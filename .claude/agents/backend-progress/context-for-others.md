# Backend(后端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (D018b 真机反馈修复完成)
> 角色: backend

---

## 当前状态速览

[2026-04-28] **D018b backend 工作完成**(D018a 真机反馈 + 方案 b 加用户输入框):

- ✨ CONTEXT_INJECTION_TEMPLATE 措辞强化(从"建议性"→"约束性")
- ✨ 新增 `refine_instruction` 字段契约 + `REFINE_INSTRUCTION_TEMPLATE` + `resolve_refine_instruction()`
- ✨ 31 SSE 端点 ctx 注入升级为"组装 refine_block + 双 .replace"模式
- ✨ test_context_injection.py 加 2 active sensor + 扩展 P0 .format() 防御覆盖 REFINE
- ✅ 全文 0 处 .format()(D018a P0 fix 防回归)
- ✅ py_compile 通过,pytest 94 passed(基线 92 + 2 新 sensor),18 passed(xuhua-wx)无回归
- 🔄 待 PM 审查后统一 commit

---

## API 契约变更清单(本次 D018b)

### 🆕 新增的契约: refine_instruction 字段

| 字段 | 类型 | 取值 | 透传位置 | 后端 fallback |
|---|---|---|---|---|
| `refine_instruction` | string(可选) | 用户在方案 b 输入框写的"重点调慢节奏" / "加悬念" / "去掉某段" 等具体优化指令 | SSE GET query 或 POST form,与 `context_prompt` 同级 | 未传 / 空串 / None / 全空白 → 不注入「用户具体要求】块,只用 D018b 强化版 directive |

**端点覆盖**: 全部 31 个 SSE 端点(stream.py 17 + stream_en.py 14)。

**后端行为矩阵**:

| context_prompt | refine_instruction | 后端注入行为 |
|---|---|---|
| 空 / 缺失 | 任何 | **不注入任何 directive**(等同 Stage 1,完全向后兼容) |
| 非空 | 空 / 缺失 | 注入 D018b 强化版 directive,但 `{refine_instruction_block}` 为空字符串 |
| 非空 | 非空 | 注入 D018b 强化版 directive + 「用户具体要求】块(refine_inst 内容) |

**注入逻辑**(后端 4 行):

```python
ctx = resolve_context(data)
if ctx:
    refine_inst = resolve_refine_instruction(data)
    refine_block = REFINE_INSTRUCTION_TEMPLATE.replace("{instruction}", refine_inst) if refine_inst else ""
    directive = CONTEXT_INJECTION_TEMPLATE.replace("{previous_output}", ctx).replace("{refine_instruction_block}", refine_block)
    final_system = system + directive
else:
    final_system = system
```

**注入模板**(中文版):

```
【上下文】用户上一轮已得到的 prompt 是:
{previous_output}

【优化要求】
请基于上一轮做**明显改写**,不要复述上一轮的相同内容。
重点针对用户新提出的方向做有差异化的改进/补充/扩展,
保留有效部分,但表达方式必须**明显升级**(可调整结构、强化细节、补充示例、调整语气等)。

【用户具体要求】(可选)
{instruction}
请严格按此要求调整。
```

英文版同结构,关键短语:`Refinement Directive` / `substantially rewrite` / `Do NOT simply repeat` / `clearly upgraded` / `User's Specific Requirements` / `Follow these requirements strictly`。

**防御截断**:
- `context_prompt` > 5000 字符 → 截断到 5000 + 尾部加 `...(已截断)` / `...(truncated)`(D018a 已有,不变)
- `refine_instruction` > 1000 字符 → 截断到 1000 + 尾部加 `...(已截断)` / `...(truncated)`(🆕 D018b)

**后端不感知轮次**: 只看 `context_prompt` 和 `refine_instruction` 字段是否存在 + 非空。
轮次上限(D018b: 起步剩 2 次,共 3 次)由前端 counter 强制。

### 🔄 修改的契约: CONTEXT_INJECTION_TEMPLATE 措辞

D018a → D018b:从"建议性"升级为"约束性"。**前端无需任何变更**(模板内容是后端内部实现细节)。

新模板关键短语:
- zh: 【优化要求】 / **明显改写** / 不要复述 / **明显升级** / 调整结构、强化细节、补充示例、调整语气
- en: [Refinement Directive] / **substantially rewrite** / Do NOT simply repeat / **clearly upgraded**

---

## 给 @frontend 的契约(D018b 实施提示)

```javascript
// pages/index/index.js generateContent() body
{
  openid: app.globalData.openid,
  content: this.data.userInput,
  style: this.data.selectedStyle || '',
  context_prompt: this.data.refineCounter > 0 ? this.data.lastOutput : '',     // D018a
  refine_instruction: this.data.refineInstructionInput || '',                  // 🆕 D018b
  // ... 其他字段
}
```

**前端职责**(@frontend 同轮 spawn 处理):
1. 用户点「✨ 基于此继续优化(剩 N 次)」按钮 → 在按钮下方滑出小输入框 + 「✓ 确认优化」+「取消」按钮
2. 用户写"重点调慢节奏" / "加悬念" 等(可空,跳过填写也行)
3. 点「✓ 确认优化」→ 把输入框内容塞进 `refine_instruction` 一并发送
4. counter `MAX_REFINEMENT_ROUNDS: 3` 起步显示「剩 2 次」(初次生成算第 1 次)
5. counter 达到 0 → 禁用按钮
6. 用户重新输入(新 session)→ counter 归零,清空 `context_prompt` + `refine_instruction`

**后端不感知 counter** — 第 1 / 2 / 3 轮在后端看完全一样,都是"有 context_prompt 就注入 directive,有 refine_instruction 就额外加用户要求块"。

英文版端点(`*StreamEN`)同理透传 `refine_instruction`,后端用 `REFINE_INSTRUCTION_TEMPLATE_EN`(英文版)注入。

### 字段长度建议

- `refine_instruction` 用户输入控件建议加 maxlength 1000(后端会截断,但前端友好)
- 输入框 placeholder 建议:"想调整哪里?例如:重点调慢节奏 / 加悬念 / 去掉血腥(可不填)"

---

## 给 @tester 的交接

### 本轮已自助新增 2 个 active sensor

| Test 名 | 类型 | 状态 |
|---|---|---|
| `test_refine_instruction_template_exists` | active 静态扫描 | ✅ PASSED |
| `test_resolve_refine_instruction_function_exists` | active 静态扫描 | ✅ PASSED |
| (扩展)`test_context_injection_template_exists` 加 REFINE_INSTRUCTION.format 防御 | active 静态扫描 | ✅ PASSED |

### 全量回归基线

`pytest sumai/tests/` 应得 **94 passed**(D018a 基线 92 + D018b 新 2 sensor)。
`pytest tests/`(xuhua-wx 根)应得 **18 passed**(持平)。

任何**新增**的失败都是回归 — 立即报警。

### 集成测试建议(可选 P3,等 Flask test client 真实化)

mock 集成测试,可参考 test_context_injection.py 第 4 个 skip stub 已有的思路扩展:
- 带 `context_prompt='abc' + refine_instruction='重点调慢节奏'` → captured system 含 `abc` + `【上下文】` + `重点调慢节奏` + `【用户具体要求】`
- 带 `context_prompt='abc'` 不带 `refine_instruction` → captured system 含 `abc` + `【上下文】` 但**不含** `【用户具体要求】`
- 带 `refine_instruction='abc'` 不带 `context_prompt` → captured system **不含** `【上下文】` 也**不含** `【用户具体要求】`(整个 directive 不注入)

---

## 给 @devops: 无新增部署变更

- D018b 是 sumai 内的纯代码改动,**无新增环境变量**
- 只需 `git pull + supervisorctl restart sumai`
- 完全向后兼容:
  - 旧前端不传 `refine_instruction` → 后端等同 D018a 强化措辞行为
  - 旧前端不传 `context_prompt` → 整个 directive 不注入,等同 Stage 1
- 部署顺序无要求(后端可先于前端,前端可先于后端)
- 推荐先后端再前端(后端老前端兼容,前端老后端新字段被忽略也没问题)

---

## 给 PM: KNOWN_ISSUES / DECISIONS 状态更新建议

可在 KNOWN_ISSUES.md / DECISIONS.md 标:
- **D018b 真机反馈修复 ✅ backend 已完成**(待 PM commit + @frontend 同轮完成后整体上线)
- 不动 RED-001 / RED-002 / RED-003 状态
- D018a P0 fix(709335c).format() → .replace() 已自然继承,本轮 sensor 加固防御

PENDING.md 可标:
- D018b backend ✅(本次完成,5 sensor 全过)
- D018b frontend — 等 @frontend 同轮完成

PM 审查关注点(地毯式):
1. 4 个新 fix 全部到位 ✅(grep 计数全匹配)
2. .format() 严禁回归 ✅(全文 0 处)
3. 31 端点全部一致 ✅(17 + 14)
4. 1 处特殊缩进(/describeImageStream 4 空格)已单独处理 ✅
5. fallback 友好(空 refine_instruction 不影响 D018b 强化措辞)✅
6. test_context_injection.py 5 active + 1 skip 全过 ✅

---

## 历史变更记录

### [2026-04-28] D018b 真机反馈修复(本次)

详见 `current.md` + `completed.md`。

### [2026-04-28] Stage 2 Phase 1 + Phase 2 合并 spawn(D017 三档下架 + D018a C 方案上下文注入)

- complexity 三档(D016)在 31 端点的实施 — Phase 1 全部回滚 ✅
- CONTEXT_INJECTION_TEMPLATE + resolve_context + 31 端点 D018a 注入 — **本次 D018b 升级**(措辞强化 + refine_instruction)

### [2026-04-25 10:30] W2-4 R3-A + R3-B(Wave 2 收尾)

- complexity 三档(D016)在 31 端点就位 — D017 已下架
- 全端点切到 validate_and_deduct + save_prompt_record,旧函数完全删除 — **保留**

### [2026-04-24 23:45] W2-2 方案 Y + W2-5 TOCTOU(Round 2)

- /wanxiangStream 新建,/hunyuanStream 下架
- 3 端点切到 validate_and_deduct(其余 11 + stream_en.py 14 在 R3-B 收尾)— **保留**

### [2026-04-24 22:30] W2-1 RED-002 凭证外移

主文件全部外移到 `.env`,27 个环境变量清单(部署关键)— **保留**

### [2026-04-24] RED-001 — Anthropic → Qwen 3.6 全量迁移 — **保留**

---

## 上次更新记录

- 2026-04-28: **D018b 真机反馈修复完成**(措辞强化 + refine_instruction 字段)
- 2026-04-28: Stage 2 Phase 1 + Phase 2 合并完成(D017 + D018a)
- 2026-04-25 10:30: R3-A + R3-B 完成(本次 R3-A 部分被 D017 回滚)
- 2026-04-24 23:45: W2-5 + W2-2 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成
