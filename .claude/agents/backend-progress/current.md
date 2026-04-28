# Backend(后端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (Stage 2 Phase 1 + Phase 2 合并 spawn 完成)
> 角色: backend

---

## 当前状态

[2026-04-28] **Stage 2 Phase 1(三档下架)+ Phase 2(C 方案 上下文注入)合并任务 已完成**,等待 PM 审查。

按 D017 + D018 + D018a 决策,只动 `sumai/stream.py` + `sumai/stream_en.py` 两文件,完成:
1. **Phase 1 · 三档下架(D017)** — 彻底删除 Stage 1 三档复杂度后端实施(常量 + 函数 + 31 端点引用全清)
2. **Phase 2 · 上下文注入(D018a)** — 新增 `CONTEXT_INJECTION_TEMPLATE` + `resolve_context()` + 31 端点注入逻辑

---

## 本次产出一览

### Phase 1 · 三档下架删除清单

- `sumai/stream.py`:
  - 删除模块级常量 `COMPLEXITY_DIRECTIVES = {...}` 及上方"Stage 1 / W2-4 / D016"注释
  - 删除 `resolve_complexity(data)` 函数
  - 17 处 `conversation_history.append({"role": "system", "content": system + COMPLEXITY_DIRECTIVES.get(...)})` 全部清掉(替换为 Phase 2 注入逻辑)
- `sumai/stream_en.py`:
  - 同上,删除 `COMPLEXITY_DIRECTIVES_EN` + `resolve_complexity` + 14 处端点引用

**验证**: `grep -n "COMPLEXITY_DIRECTIVES\|resolve_complexity" sumai/stream*.py` → **0 行残余** ✅
全 repo `grep -rn "COMPLEXITY_DIRECTIVES\|resolve_complexity\|test_complexity"` → **0 行** ✅

### Phase 2 · 上下文注入(D018a)新增内容

**模块级新常量 + 函数(stream.py / stream_en.py 顶部各一份)**:

```python
# stream.py
CONTEXT_INJECTION_TEMPLATE = """

【上下文】用户上一轮已得到的 prompt 是:
{previous_output}

现在用户希望基于此继续优化。请保留有效部分,
根据用户新的输入做改进/补充/调整。"""


def resolve_context(data):
    """从请求 data 解析 context_prompt 参数,无效或空返 None,有效则返字符串。"""
    raw = data.get('context_prompt', '')
    if not raw:
        return None
    value = raw.strip()
    if not value:
        return None
    if len(value) > 5000:
        value = value[:5000] + "...(已截断)"
    return value
```

**stream_en.py 用 `CONTEXT_INJECTION_TEMPLATE_EN`**(英文翻译,截断标记 `...(truncated)`)。

**31 端点统一注入模式**:

```python
ctx = resolve_context(data)
final_system = system + CONTEXT_INJECTION_TEMPLATE.format(previous_output=ctx) if ctx else system
conversation_history.append({"role": "system", "content": final_system})
```

- stream.py 17 处(8 空格缩进 16 处 + 4 空格缩进 1 处:`/describeImageStream` 端点 handler 内,在 generate() 函数外)
- stream_en.py 14 处(全 8 空格缩进)

**验证**:
- `grep -c CONTEXT_INJECTION_TEMPLATE stream.py` → **18**(1 定义 + 17 端点)✅ 等于任务说明的"≥ 18"
- `grep -c resolve_context stream.py` → **18**(1 定义 + 17 端点)✅
- `grep -c CONTEXT_INJECTION_TEMPLATE_EN stream_en.py` → **15**(1 定义 + 14 端点)✅
- `grep -c resolve_context stream_en.py` → **15**(1 定义 + 14 端点)✅

### 合规设计点

1. **后端不感知轮次**: 只看 `context_prompt` 字段是否存在 + 非空,不维护 round counter。轮次上限 3 由前端 counter 强制(D018a),未来要改上限只动前端。
2. **Fallback 友好**: 没传 `context_prompt` / 传空串 / 传 None / 全空白 → `resolve_context()` 返 `None` → 端点行为完全等同当前(向后兼容,新前端 / 旧前端都能用)。
3. **防御截断**: 5000 字符上限,避免上一轮巨大 output 吃光 max_tokens。截断时尾部加 `...(已截断)` / `...(truncated)`。
4. **不动任何 system prompt 字符串本身的内容** — 只在末尾追加上下文 block。
5. **不动 validate_and_deduct + save_prompt_record + 路由 routing**。
6. **不引入新 Python 包** — 只用 stdlib + 已有 anthropic/openai。

---

## 基线测试

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK** ✅
- `pytest sumai/tests/` → **89 passed / 95 skipped / 3 xfailed / 2 xpassed / 0 failed** ✅
- 基线说明: 任务交付时基线 92 passed;@tester 已在本轮删 `test_complexity.py`(3 个 stub),所以现在 89 passed 是**预期值**。**0 failed,0 collection error**。
- 残余 `tests/__pycache__/test_complexity.cpython-*.pyc` 是无害缓存(源已删),pytest 不会从 pycache 收集。

---

## 给 @frontend 的关键交接(契约)

### 上下文注入字段契约

| 字段 | 类型 | 取值 | 透传位置 | 后端行为 |
|---|---|---|---|---|
| `context_prompt` | string | 上一轮生成的 prompt 全文 | SSE GET query 或 POST form,与 `style` 同级 | 非空 → 末尾追加上下文 block;空 / 缺失 → 等同当前(无 context) |

**前端最小实施**(@frontend 同轮 spawn 处理):

```javascript
// pages/index/index.js 的 generateContent() body
{
  openid: app.globalData.openid,
  content: this.data.userInput,
  style: this.data.selectedStyle || '',
  context_prompt: this.data.refineCounter > 0 ? this.data.lastOutput : '',  // 🆕 D018a
  // ... 其他字段
}
```

**前端 counter 责任**:
- 用户点「✨ 基于此继续优化」按钮 → counter +1,把上一轮 `lastOutput` 塞进 `context_prompt`
- counter 达到 3 → 禁用按钮(D018a 上限)
- 用户重新输入(新 session)→ counter 归零,清空 `context_prompt`

**后端不感知轮次**,所以前端无论传第 1 / 2 / 3 轮都行;只要传了 context,后端都拼接。

### 跨语言端点

英文版端点(`*StreamEN`)同理透传 `context_prompt`,后端用 `CONTEXT_INJECTION_TEMPLATE_EN`(英文版上下文 block)注入。

---

## 给 @tester 的交接

### 1. test_complexity.py 已删

我已确认 sumai/tests/ 不含 test_complexity.py 源文件,只剩无害 .pyc 缓存。@tester 可:
- 无需手动清理 .pyc(下次 `pytest --cache-clear` 自动清理)
- 或手动删 `tests/__pycache__/test_complexity*.pyc`

### 2. 新增建议测试 sensor(test_context_injection.py)

| Test 名 | 用途 | 实施提示 |
|---|---|---|
| `test_context_injection_template_exists` | 静态扫源码确认 stream.py 顶部含 `CONTEXT_INJECTION_TEMPLATE = """..."""` | regex `r'CONTEXT_INJECTION_TEMPLATE\s*=\s*"""'` |
| `test_context_injection_template_en_exists` | 同上 stream_en.py | 同 |
| `test_resolve_context_returns_none_for_empty` | 静态扫源码确认 `resolve_context` fallback 路径 | regex 找 `if not raw: return None` 和 `if not value: return None` |
| `test_resolve_context_truncates_at_5000` | 确认防御截断逻辑存在 | regex 找 `len(value) > 5000` |
| `test_all_sse_endpoints_inject_context` | 扫所有 SSE 端点 generate 函数都含 `ctx = resolve_context(data)` | 必须找到 ≥ 17 处(stream.py)+ ≥ 14 处(stream_en.py) |

### 3. 全量回归基线

跑 `pytest sumai/tests/` 应得 **89 passed**(若 @tester 加新 sensor,数字会上去)。任何**新增**的失败都是回归 — 立即报警。

### 4. 集成测试建议(可选 P3)

写一个 mock 集成测试:模拟前端发 POST 到 `/botPromptStream` 带 `context_prompt='你之前生成的 prompt 文本'`,断言:
- system prompt 末尾包含 `【上下文】用户上一轮已得到的 prompt 是:` 字符串
- 不带 context_prompt 时,system prompt 末尾不含此字符串

需要 mock `client.chat.completions.create`,所以会用到 `unittest.mock`。

---

## 风险点(无 — 改动极小,行为向后兼容)

- ✅ 不传 `context_prompt` 行为与改动前完全等价
- ✅ 17 + 14 = 31 端点全部一致改动,不存在某个端点漏改
- ✅ 不动 system prompt 字符串本身,Stage 1 删除不影响 prompt 质量
- ✅ py_compile 通过
- ✅ pytest 89 passed 无倒退

---

## 上次更新记录

- 2026-04-28: **Stage 2 Phase 1 + Phase 2 合并完成 — 三档下架 + C 方案上下文注入**
- 2026-04-25 10:30: W2-4 (R3-A) + R3-B 全端点切换 + 旧函数删除
- 2026-04-24 23:45: W2-5 TOCTOU + W2-2 方案 Y 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成

---

## 未自行 commit

按协议,等 PM 审查通过后统一 commit。改动文件清单:
- `sumai/stream.py`(常量替换 + 17 端点注入逻辑改写)
- `sumai/stream_en.py`(EN 版常量替换 + 14 端点注入逻辑改写)
- `.claude/agents/backend-progress/{current,completed,context-for-others}.md`(三件套)
- `.team-brain/TEAM_CHAT.md`(本条追加)

@PM 请审查 🙏
