# Frontend(前端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D019 真·多轮对话改造完成
> 角色: frontend

---

## 当前状态

✅ **2026-04-28 — D019 真·多轮对话改造完成**(承接 D018b 真机"输出变化不大"反馈)
✅ 2026-04-28 — D018b 真机反馈 4 项 fix(方案 b · 输入框 + counter 改 2 起步)
✅ 2026-04-28 14:31 — D017 三档下架 + D018a Stage 2 C 方案 上下文注入(已被 D019 取代)

---

## 给 @backend 的上下文(2026-04-28 D019 字段契约 — 取代 D018a/b)

### 🔥 字段契约重构(D019)

**新字段 `history`**(取代 D018a `context_prompt` + D018b `refine_instruction`):

| 项 | 内容 |
|---|---|
| 字段名 | `history` |
| 类型 | string(JSON 字符串)|
| JSON 内容 | `[{role: 'user'|'assistant', content: string}, ...]` |
| 挂载条件 | 仅在 `conversationHistory.length > 0`(即至少有一轮已完成生成)|
| 透传位置 1 | `generateContent` POST body,与 `style` 同级 |
| 透传位置 2 | `generateImageDescription` URL query(`&history=<URLencoded JSON>`)|

### 已彻底删除(D018a/b 残余,前端 0 处)

- ❌ `context_prompt`(D018a)
- ❌ `refine_instruction`(D018b)
- ❌ `previousOutput`(前端 state)
- ❌ `refineInstruction`(前端 state)

请 @backend 同步删除 sumai 中:
- `CONTEXT_INJECTION_TEMPLATE` / `CONTEXT_INJECTION_TEMPLATE_EN`
- `REFINE_INSTRUCTION_TEMPLATE` / `REFINE_INSTRUCTION_TEMPLATE_EN`
- `resolve_context()` / `resolve_refine_instruction()`
- 31 端点的 `ctx = resolve_context(data)` 注入逻辑

并新增:
- `resolve_history(data)` — JSON parse + 防御 + token 守护
- 31 端点 `messages.extend(history)` 模式

### 前端示例代码(实际)

```js
// generateContent body (POST)
data: {
  openid, content, model_type, model_name, ...,
  ...(this.data.conversationHistory && this.data.conversationHistory.length > 0
    ? { history: JSON.stringify(this.data.conversationHistory) }
    : {})
}

// generateImageDescription URL (GET SSE)
let url = `https://www.duyueai.com/describeImageStream?openid=${openid}&image_url=...`;
if (this.data.conversationHistory && this.data.conversationHistory.length > 0) {
  url += `&history=${encodeURIComponent(JSON.stringify(this.data.conversationHistory))}`;
}
```

### conversation 流程(前端视角,后端 stateless)

```
用户输入 A → 初次 generate → 后端返回 C
  → 前端 push history = [{user:A, assistant:C}]

用户点「✨ 基于此继续优化」→ 输入框展开
用户输入 R(或留空 → 用 DEFAULT_REFINE_FALLBACK)→ 点确认
  → 前端 push {user:R} → history = [{user:A, asst:C, user:R}]
  → 触发 generate,body 带 history JSON(3 turns)
  → 后端 parse history,extend 到 LLM messages
  → LLM 返回 E
  → 前端 push {assistant:E} → history = [user:A, asst:C, user:R, asst:E] (4 turns)

用户再点「✨ 基于此继续优化」→ 输入 R2 → 确认
  → 前端 push {user:R2} → history 5 turns
  → 触发 generate,body 带 history JSON(5 turns)
  → ...

最多 2 轮继续优化(MAX_REFINEMENT_ROUNDS=2),共 3 次输出(初次 + 2 继续)
```

### 后端 history extend 推荐方案(Founder 强制详细 print 日志)

**方案 A(推荐)**:history 即对话权威
- 当 `history` 字段存在且非空 → 后端用 history 作为 LLM messages,**忽略** `content` 字段(因为 history 末尾的 user msg 已是当前请求的 user input)
- `messages = [system_prompt] + history`
- LLM 返回 → SSE 流式回前端 → 前端 push assistant 到 history

**方案 B(备选)**:append `content` 到末尾
- `messages = [system_prompt] + history + [{role: 'user', content: data['content']}]`
- 注意:此时前端的 `content` 可能与 history 末尾的 user msg 重复,需 dedup

@backend 自行决定,关键是 LLM 看到完整对话上下文。

### token 守护建议

- history 可能很长(连续 2 次继续后,初始长 prompt + assistant 数千字 + 继续优化要求 + assistant 数千字 ≈ 数万 tokens)
- 建议后端做 truncation:
  - 优先保留 system prompt
  - 优先保留最近的 2 turn(user + assistant)
  - 中间 turn 可截断或摘要(用 estimated token count)
- 详细 print 日志:`[D019] history extend: turns={N}, total_chars={M}, estimated_tokens={T}, truncated={bool}`

### 风险提示给 @backend

1. **JSON parse 防御**:前端可能传非法 JSON(网络中断 / 编码问题),后端必须 try/except,parse 失败 → fallback 到无 history 模式
2. **`generateImageDescription` URL 长度**:history 较大时,URL 可能超 nginx default `large_client_header_buffers` 8KB
   - 建议 nginx 调 `large_client_header_buffers 4 16k;`
   - 或前端对 history 做 size 限制(>6KB 时截断到最近 3 turns)
   - 或把 image-desc 也改 POST(动作较大,先 nginx 调)
3. **空 `history` vs 未传 `history`**:
   - 未传 = 初次生成(等同 D018 之前)
   - 传了 `history=[]`(理论上前端不会发) = 等同未传

---

## 给 @tester 的上下文(2026-04-28 D019)

### 测试范围

| 模块 | 期望 |
|---|---|
| pytest tests/(xuhua-wx)| **18/18 PASS**(本次零回归已验证)|
| 前端 grep `previousOutput`/`refineInstruction\b`/`context_prompt`/`refine_instruction` | **在 pages/index/* 全 0 hit**(D018b 残余清零)|
| 前端 grep `conversationHistory` | js 30 hits(全文流转一致)|
| 前端 grep `\[D019\]` | js **16 hits**(8 类全覆盖)|
| 前端 grep `\[D018b\]` | js **0 hits** |

### 建议新建 sumai 测试

- `test_resolve_history_function_exists`(static 扫 `def resolve_history(data):`)
- `test_history_template_or_messages_extend_pattern_exists`(扫 `messages.extend\|messages.append.*history`)
- `test_31_endpoints_call_resolve_history`(防新增端点漏接)
- `test_default_refine_fallback_constant_present`(可选,扫前端 `pages/index/index.js` 含 `'请基于以上输出做明显改进'`)
- `test_d018ab_residue_zero_in_sumai`(扫 stream.py / stream_en.py 不再含 `CONTEXT_INJECTION_TEMPLATE` / `resolve_context` / `REFINE_INSTRUCTION_TEMPLATE` / `resolve_refine_instruction`)

### 手动回归点(等 Founder 真机验证)

1. ✅ 初次生成 → DevTools Console 见 `[D019] generateContent · 初次生成,无 history`
2. ✅ 完成 → 见 `[D019] 📝 初次生成完成 · 初始化 history (2 turns)` { mode, userContent_length, assistantContent_length }
3. ✅ 点击「✨ 基于此继续优化」→ 输入框展开 + 见 `[D019] 🎯 onRefineFromCurrent` { historyLength: 2 }
4. ✅ 不写指令直接确认 → 见 `[D019] ✅ onConfirmRefine · 用户跳过填写,用默认兜底: 请基于以上输出做明显改进`
5. ✅ 写指令"节奏更慢"再确认 → 见 `[D019] ✅ onConfirmRefine · 用户具体要求: 节奏更慢`
6. ✅ 触发 generate → 见 `[D019] 🔑 generateContent · 已挂 history` { historyTurns: 3, historyRoles: ['user','assistant','user'] }
7. ✅ 完成 → 见 `[D019] 📝 继续优化轮次完成 · push assistant` { round: 1, totalHistoryTurns: 4 }
8. ✅ 改主输入文本 → 见 `[D019] 🔄 onInputChange · 检测到新主题,重置多轮对话历史`
9. ✅ 点取消 → 见 `[D019] ❌ onCancelRefine`
10. ✅ 第 3 次确认(已达上限)→ wx.showToast '已达上限',按钮区域是 refinement-done 态
11. ✅ image-desc 模式同样流程,console 应显示 `mode: 'image-desc'`

---

## 给 @pm / @devops 的上下文

### 主包尺寸

- 本次净变化:js +3992 B + wxml +95 B + wxss 0 B = **+4087 B ≈ 4.0 KB**
- 累计主包估算:约 808 KB(原 800 + 8),距 2 MB 上限充足

### 文件变更清单(给 PM 审查)

- `pages/index/index.js`(删 D018b state/字段/逻辑 + 加 conversationHistory 流 + 16 处 [D019] log)
- `pages/index/index.wxml`(placeholder 文案 + value 绑定 refineInstructionInput + 注释 D019)
- `pages/index/index.wxss`(0 改动)
- `.claude/agents/frontend-progress/{current,completed,context-for-others}.md`(三件套全更新)
- `.team-brain/TEAM_CHAT.md`(本次完成消息追加)

按协议**未自行 commit**,等 PM 审查通过后统一 commit。

---

## 给 @resonance 的上下文

D019 真·多轮对话上线后,序话的"上下文注入"从 single-shot system prompt 升级为真正的对话(LLM 看到完整 turn 序列)。这强化了产品 Counter-Positioning 第 4 条"项目化 / 版本化",对外营销可强调:

- **真·多轮迭代**:不再是"AI 复述上次输出",而是基于完整对话上下文的精修
- **2 次精修不够?改主输入即可重启新一轮**(降低用户决策成本)
- **空指令也能继续优化**(默认"明显改进"兜底,降低用户填写负担)

---

## 给所有角色的新增上下文(2026-04-27 第三轮深修,保留)

### scroll-view 横向 scroll-x 模式编码规范(避坑)

**禁忌**:wxml 里写了 `enable-flex` 属性的 scroll-view,wxss 不要再写 `display: flex` —— **双开会触发社区已知高度异常 bug**(scroll-view 高度计算混乱,在父 overflow:hidden 下表现为大块空白)。

**正确做法**:
1. **横向 scroll-x 必须显式设 `height`**(竖向 scroll-y 文档已强调,横向虽未文档化但实测必备)
2. enable-flex 与 display:flex 二选一,通常 enable-flex 优先(WebView 兼容性更好)
3. 若需子元素居中,用 `text-align: center` 配合 `display: inline-flex/inline-block` 子元素,而非 `justify-content: center`(后者要求父开 flex)
4. 子元素自身可用 `display: inline-flex` 实现内容垂直居中

**适用范围**:本项目的 `pages/index/index.wxss` 已修复 .model-cards-scroll 和 .style-options-scroll;其他页面如果有类似 scroll-x + enable-flex 模式,务必**自查是否同时设了 display:flex**。

---

## 上次更新记录

- 2026-04-28: D019 真·多轮对话改造完成
- 2026-04-28: D018b 真机反馈 4 项 fix(方案 b 输入框)
- 2026-04-28: D017 三档下架 + D018a Stage 2 C 方案
- 2026-04-27: 第三轮深修(scroll-view enable-flex 修复)
- 2026-04-24: 多 Agent 系统初始化
