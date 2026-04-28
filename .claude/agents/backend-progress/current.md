# Backend(后端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (D018b 真机反馈修复完成)
> 角色: backend

---

## 当前状态

[2026-04-28] **D018b 真机反馈修复 已完成**,等待 PM 审查。

按 D018b 决策(Stage 2 上下文注入第一轮真机反馈 + 方案 b 加用户输入框),
只动 `sumai/stream.py` + `sumai/stream_en.py` + `sumai/tests/test_context_injection.py` 三文件,完成:

1. **Fix 1**: 强化 `CONTEXT_INJECTION_TEMPLATE` 措辞(从 D018a 的"建议性"升级为"约束性",
   含"明显改写""不要复述""明显升级"关键词;EN 版镜像同步 substantially rewrite / clearly upgraded)
2. **Fix 2**: 新增 `REFINE_INSTRUCTION_TEMPLATE` 常量 + `resolve_refine_instruction()` 函数
   (解析 `refine_instruction` 字段,1000 字符截断,空值 fallback 友好)
3. **Fix 3**: 31 端点 ctx 注入逻辑从"1 行 .replace"升级到"4 行组装 refine_block + 双 .replace"
   — **严禁 .format()**(D018a P0 fix 不能回滚)
4. **Fix 4**: `test_context_injection.py` 新增 2 个 active sensor + 扩展 .format() 防御覆盖 REFINE

---

## 本次产出一览

### Fix 1 · 强化 CONTEXT_INJECTION_TEMPLATE 措辞

**stream.py 新模板**(覆盖原 D018a 模板,带 `{refine_instruction_block}` 第二占位符):

```python
CONTEXT_INJECTION_TEMPLATE = """

【上下文】用户上一轮已得到的 prompt 是:
{previous_output}

【优化要求】
请基于上一轮做**明显改写**,不要复述上一轮的相同内容。
重点针对用户新提出的方向做有差异化的改进/补充/扩展,
保留有效部分,但表达方式必须**明显升级**(可调整结构、强化细节、补充示例、调整语气等)。
{refine_instruction_block}"""
```

**stream_en.py 新模板**(EN 版镜像):

```python
CONTEXT_INJECTION_TEMPLATE_EN = """

[Context] The prompt the user obtained from the previous round is:
{previous_output}

[Refinement Directive]
Please **substantially rewrite** based on the previous round. Do NOT simply repeat the same content.
Focus on the user's new direction with clearly differentiated improvements / additions / expansions.
Preserve what works, but the expression must be **clearly upgraded**
(adjust structure, strengthen details, add examples, change tone, etc.).
{refine_instruction_block}"""
```

### Fix 2 · 新增 REFINE_INSTRUCTION_TEMPLATE + resolve_refine_instruction

**stream.py 新增**(模块级,在 CONTEXT_INJECTION_TEMPLATE / resolve_context 之后):

```python
REFINE_INSTRUCTION_TEMPLATE = "\n\n【用户具体要求】\n{instruction}\n请严格按此要求调整。"


def resolve_refine_instruction(data):
    """从请求 data 解析 refine_instruction 参数,无效或空返 None,有效则返字符串。"""
    raw = data.get('refine_instruction', '')
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    if len(value) > 1000:
        value = value[:1000] + "...(已截断)"
    return value
```

**stream_en.py 新增**(EN 版镜像):

```python
REFINE_INSTRUCTION_TEMPLATE_EN = "\n\n[User's Specific Requirements]\n{instruction}\nFollow these requirements strictly."

def resolve_refine_instruction(data):
    raw = data.get('refine_instruction', '')
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    if len(value) > 1000:
        value = value[:1000] + "...(truncated)"
    return value
```

### Fix 3 · 31 端点统一新注入模式

**所有 31 处 ctx 注入从 1 行变 4 行**(组装 refine_block + 双 .replace):

```python
ctx = resolve_context(data)
if ctx:
    refine_inst = resolve_refine_instruction(data)
    refine_block = REFINE_INSTRUCTION_TEMPLATE.replace("{instruction}", refine_inst) if refine_inst else ""
    directive = CONTEXT_INJECTION_TEMPLATE.replace("{previous_output}", ctx).replace("{refine_instruction_block}", refine_block)
    final_system = system + directive
else:
    final_system = system
conversation_history.append({"role": "system", "content": final_system})
```

- stream.py 17 处(16 处 8 空格 + 1 处 4 空格 `/describeImageStream`)
- stream_en.py 14 处(全 8 空格,用 `_EN` 版本常量)

**严禁 .format()** (D018a P0 fix 防回归)— 全文 0 处 .format()。

### Fix 4 · test_context_injection.py 新 sensor + 扩展防御

新增 2 个 active sensor:

| Test 名 | 类型 | 验证 |
|---|---|---|
| `test_refine_instruction_template_exists` | active 静态扫描 | REFINE_INSTRUCTION_TEMPLATE/EN 常量存在 + 关键短语(zh"用户具体要求"/"严格按此要求";en"User's Specific Requirements"/"Follow these requirements")+ `{instruction}` 占位符 + CONTEXT_INJECTION_TEMPLATE 含 `{refine_instruction_block}` 占位符 + D018b 强化关键词("明显改写"/"明显升级"/"substantially rewrite"/"clearly upgraded") |
| `test_resolve_refine_instruction_function_exists` | active 静态扫描 | `def resolve_refine_instruction(data):` 签名 + `data.get('refine_instruction')` 字段读取 + 1000 字符截断保护 |

扩展原 P0 sensor 覆盖 REFINE_INSTRUCTION_TEMPLATE.format(:

```python
assert "REFINE_INSTRUCTION_TEMPLATE.format(" not in stream_py
assert "REFINE_INSTRUCTION_TEMPLATE_EN.format(" not in stream_en_py
```

---

## grep 计数验证(全部匹配预期)

| 文件 | 符号 | 实际 | 期望 |
|---|---|---|---|
| stream.py | `CONTEXT_INJECTION_TEMPLATE` | 18 | 1 def + 17 端点 ✅ |
| stream.py | `REFINE_INSTRUCTION_TEMPLATE` | 18 | 1 def + 17 端点 ✅ |
| stream.py | `resolve_context` | 18 | 1 def + 17 端点 ✅ |
| stream.py | `resolve_refine_instruction` | 18 | 1 def + 17 端点 ✅ |
| stream.py | `ctx = resolve_context` | 17 | 17 端点 ✅ |
| stream_en.py | `CONTEXT_INJECTION_TEMPLATE_EN` | 15 | 1 def + 14 端点 ✅ |
| stream_en.py | `REFINE_INSTRUCTION_TEMPLATE_EN` | 15 | 1 def + 14 端点 ✅ |
| stream_en.py | `resolve_context` | 15 | 1 def + 14 端点 ✅ |
| stream_en.py | `resolve_refine_instruction` | 15 | 1 def + 14 端点 ✅ |
| stream_en.py | `ctx = resolve_context` | 14 | 14 端点 ✅ |

**禁忌检查(必须全 0)**:
- `TEMPLATE.format(` / `TEMPLATE_EN.format(` / `REFINE_INSTRUCTION_TEMPLATE.format(` / `REFINE_INSTRUCTION_TEMPLATE_EN.format(` 全文计数 = **0** ✅
- 旧 1-行 pattern `final_system = system + CONTEXT_INJECTION_TEMPLATE` 残余 = **0** ✅

**端点数验证**:
- `@stream_bp.route` 数 = 17(stream.py)
- `@stream_en_bp.route` 数 = 14(stream_en.py)
- 合计 31 端点全部覆盖 ✅

---

## 基线测试

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK** ✅
- `pytest sumai/tests/test_context_injection.py -v` → **5 passed / 1 skipped** ✅(原 3 active + 1 skip + D018b 新 2 active)
- `pytest sumai/tests/` → **94 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed** ✅(基线 92 + 2 新 sensor)
- `pytest tests/` (xuhua-wx 根) → **18 passed** ✅(持平)

---

## 给 @frontend 的契约(D018b 新增字段)

### 新增字段 `refine_instruction`

| 字段 | 类型 | 取值 | 透传位置 | 后端行为 |
|---|---|---|---|---|
| `refine_instruction` | string(可选) | 用户在方案 b 输入框写的"重点调慢节奏" / "加悬念" 等具体要求 | SSE GET query 或 POST form,与 `context_prompt` 同级 | 非空 → 包成「用户具体要求】块插入 directive;空 / 缺失 → 仅注入 context block |

**前端实施提示**:

```javascript
// pages/index/index.js generateContent() body
{
  openid: app.globalData.openid,
  content: this.data.userInput,
  style: this.data.selectedStyle || '',
  context_prompt: this.data.refineCounter > 0 ? this.data.lastOutput : '',
  refine_instruction: this.data.refineInstructionInput || '',  // 🆕 D018b 方案 b
  // ... 其他字段
}
```

**前端职责**:
- 用户点「✨ 基于此继续优化」按钮 → 弹小输入框 + 「✓ 确认优化」+ 「取消」按钮
- 用户写完(可空)→ 点「✓ 确认优化」→ 把输入框内容塞进 `refine_instruction`
- counter 起步剩 2(D018b: MAX 3 - 1 初次生成 = 2 次继续优化机会)
- 后端不感知 counter,只看 `context_prompt` 和 `refine_instruction` 是否非空

**后端行为细则**:
- `context_prompt` 空 / 缺失 → 不注入任何 block(保持向后兼容)
- `context_prompt` 非空 + `refine_instruction` 空 → 只注入 context block(D018b 强化版,无【用户具体要求】块)
- `context_prompt` 非空 + `refine_instruction` 非空 → 注入完整(context + refine block)

### 跨语言端点

英文版端点(`*StreamEN`)同理透传 `refine_instruction`,后端用 `REFINE_INSTRUCTION_TEMPLATE_EN`(英文版)注入。

---

## 给 @tester 的交接(本轮已自助完成)

按本轮特殊安排,我自己加了 2 个新 active sensor(因为 sensor 直接和我的代码绑定,顺手加比 spawn @tester 单独做更高效)。

| 新 Sensor | 状态 | 说明 |
|---|---|---|
| `test_refine_instruction_template_exists` | ✅ PASSED | 验证 REFINE_INSTRUCTION_TEMPLATE 常量 + 关键短语 + D018b 强化措辞 |
| `test_resolve_refine_instruction_function_exists` | ✅ PASSED | 验证 resolve_refine_instruction 函数 + 字段读取 + 1000 字符截断 |
| 原 P0 sensor(`test_context_injection_template_exists`)扩展 | ✅ PASSED | 加了 REFINE_INSTRUCTION_TEMPLATE.format( 防御 |

@tester 后续若做 D018b 集成测试,可参考本文件第 4 个 skip stub 已有的 mock 思路,新增 mock 验证:
- 带 `refine_instruction='重点调慢节奏'` 时,system prompt 含「用户具体要求】 + '重点调慢节奏'
- 带 context_prompt 但不带 refine_instruction 时,system 含【上下文】但不含【用户具体要求】

---

## 风险点(无 — 改动严格遵守 D018a P0 fix 约束)

- ✅ 全文 0 处 .format() — D018a P0 防回归
- ✅ 31 端点全部一致改动,不存在某个端点漏改
- ✅ `refine_instruction` 不传 / 空 → refine_block 为空字符串 → 等同 D018b 措辞强化版 directive(向后兼容,前端 D018a → D018b 平滑切换)
- ✅ `context_prompt` 不传 / 空 → 整个 directive 不注入(等同 Stage 1 完全不动)
- ✅ 不动 system prompt 字符串本身
- ✅ 不动 validate_and_deduct + save_prompt_record + 路由 routing
- ✅ 不动 mainv2.py / note.py / pay_stripe.py
- ✅ 不动其他 sumai/tests/ 文件(只动 test_context_injection.py 加 2 个新 test)
- ✅ py_compile 通过
- ✅ pytest 94 passed 无倒退(+2 = 新 sensor)

---

## 上次更新记录

- 2026-04-28: **D018b 真机反馈修复** — 强化措辞 + refine_instruction 字段 + 31 端点新注入模式
- 2026-04-28: Stage 2 Phase 1 + Phase 2 合并完成 — 三档下架 + C 方案上下文注入(D018a)
- 2026-04-25 10:30: W2-4 (R3-A) + R3-B 全端点切换 + 旧函数删除
- 2026-04-24 23:45: W2-5 TOCTOU + W2-2 方案 Y 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成

---

## 未自行 commit

按协议,等 PM 审查通过后统一 commit。改动文件清单:

**sumai 仓库**(独立 git remote):
- `sumai/stream.py`(顶部新增 REFINE 常量 + 函数 / 强化 CONTEXT 模板;17 端点 ctx 注入升级)
- `sumai/stream_en.py`(EN 版镜像同步)
- `sumai/tests/test_context_injection.py`(新增 2 个 active sensor + 扩展 P0 防御)

**xuhua-wx 仓库**:
- `.claude/agents/backend-progress/{current,completed,context-for-others}.md`(三件套)
- `.team-brain/TEAM_CHAT.md`(本条追加)

@PM 请审查 🙏
