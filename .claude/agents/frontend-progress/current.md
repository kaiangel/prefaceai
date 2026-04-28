# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D019 真·多轮对话改造完成
> 角色: frontend

---

## 当前状态

✅ **2026-04-28 — D019 真·多轮对话改造完成**

承接 D018b 真机反馈"继续优化输出变化不大"问题,后端 + 前端协同从"single-shot system prompt 注入"重构为"真·多轮 conversation history extend"模式。

**核心变化**:
- 删除 D018a/b 残余 state(`previousOutput` / `refineInstruction`)
- 删除 D018a/b 字段契约(`context_prompt` / `refine_instruction`)
- 新增 `conversationHistory: []` (append 模式) + 透传 JSON 给后端的新字段 `history`
- 新增 `DEFAULT_REFINE_FALLBACK = '请基于以上输出做明显改进'` 兜底(用户跳过填写时)
- 新增 `refineInstructionInput` 临时 state(承载输入框文字,onConfirmRefine 时移到 history)

---

## 改动总览

| 文件 | 改动 |
|------|------|
| `pages/index/index.js` | data 块:删 `previousOutput` + `refineInstruction`,加 `conversationHistory: []` + `refineInstructionInput: ''` + `DEFAULT_REFINE_FALLBACK`;`onRefineFromCurrent` 简化(只展开 UI);`onConfirmRefine` 重写(append 上轮 assistant + 本轮 user 到 history);`onCancelRefine` 简化(不动 history);`generateImageDescription` URL 由 `&context_prompt&refine_instruction` → `&history=<JSON>`;`generateContent` body 同改 `{ history: JSON.stringify(...) }`;`handlePostGeneration`(text 模式) + `completeImageDescriptionGeneration`(image-desc 模式)各加"完成后 push 到 history"块(初次 push 2 turns,后续 push 1 assistant);`onInputChange` + `onReferenceInputChange` reset 同步清空 conversationHistory + refinementRound + showRefineInput + refineInstructionInput |
| `pages/index/index.wxml` | textarea `value` 由 `{{refineInstruction}}` → `{{refineInstructionInput}}`;placeholder 文案改为示例化"告诉 AI 要怎么改(如:'换个场域和角色'、'3 个步骤太多,精简到 2 个'、'语言风格更口语化')";WXML 注释 D018b → D019 |
| `pages/index/index.wxss` | **未修改**(本轮无 UI 改动,仅数据流 + placeholder + console.log) |

---

## 关键代码点

### data 块(index.js L241-254)

```js
// Stage 2 D019: 真·多轮对话改造
refinementRound: 0,
MAX_REFINEMENT_ROUNDS: 2,
showRefineInput: false,
conversationHistory: [],          // [{role: 'user'|'assistant', content: string}]
refineInstructionInput: '',       // 临时承载输入框文字
DEFAULT_REFINE_FALLBACK: '请基于以上输出做明显改进',
```

### conversation 流程(状态机)

```
初次生成完成(handlePostGeneration / completeImageDescriptionGeneration):
  IF refinementRound===0 && history.length===0:
    push [{user:A, assistant:C}]   ← 一次性初始化 2 turns
  IF refinementRound > 0:
    push {assistant:E}              ← 仅 push 本轮 assistant

用户继续优化(onConfirmRefine):
  1. userInstruction = refineInstructionInput || DEFAULT_REFINE_FALLBACK
  2. IF history 末尾不是 assistant: push {assistant: fullContent}  (防双击)
  3. push {user: userInstruction}
  4. setData refinementRound+1, showRefineInput=false, refineInstructionInput=''
  5. onGeneratePrompt() → callStreamAPI / generateImageDescription
     → body/URL 带 history JSON
```

### 新契约(给 @backend)

| 路径 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `generateContent` POST body | `history` | string (JSON of `[{role, content}]`) | 仅在 conversationHistory.length > 0 时挂载 |
| `generateImageDescription` URL query | `&history=<URLencoded JSON>` | 同上 | 同上 |

**已删除字段**:`context_prompt` / `refine_instruction`(D018a/b 残余,前端 0 处)

### 重置点(用户改主输入 → 视为新主题)

| 触发 | 行为 |
|------|------|
| `onInputChange` (idea 模式) | reset refinementRound + conversationHistory + showRefineInput + refineInstructionInput,console.log "🔄 检测到新主题" |
| `onReferenceInputChange` (reference 模式) | 同上 |

---

## [D019] console.log 全清单(16 处)

| # | 位置 | 触发 |
|---|------|------|
| 1 | `onRefineFromCurrent` (L259) | 展开输入框 |
| 2 | `onConfirmRefine` 跳过填写 (L299) | 用 fallback |
| 3 | `onConfirmRefine` 用户具体要求 (L301) | 用真实 instruction |
| 4 | `onConfirmRefine` history 准备 push (L313) | 列出 turns/roles |
| 5 | `onCancelRefine` (L330) | 用户取消 |
| 6 | `onReferenceInputChange` reset (L544) | 检测到新主题 |
| 7 | `generateImageDescription` 已挂 history (L565) | 透传 JSON |
| 8 | `generateImageDescription` 初次 (L573) | 无 history |
| 9 | `generateImageDescription` SSE URL preview (L576) | 前 500 字符 |
| 10 | `completeImageDescriptionGeneration` 初次 push (L711) | image-desc 模式 |
| 11 | `completeImageDescriptionGeneration` 继续 push (L720) | image-desc 模式 |
| 12 | `onInputChange` reset (L1131) | 检测到新主题 |
| 13 | `handlePostGeneration` 初次 push (L1936) | text 模式 |
| 14 | `handlePostGeneration` 继续 push (L1945) | text 模式 |
| 15 | `generateContent` 已挂 history (L2509) | 透传 JSON |
| 16 | `generateContent` 初次 (L2517) | 无 history |

---

## 严格 scope 遵守

| 项 | 状态 |
|---|---|
| 只动 `pages/index/{wxml,js}`(wxss 本轮未改) | ✅ |
| 未触碰 `app.js` / 其他 pages | ✅ |
| 未触碰 `sumai/` | ✅ |
| 未触碰 `tests/` | ✅ |
| 未触碰 其他 agent progress 文件 | ✅ |
| 未自行 commit(等 PM 统一) | ✅ |
| 未引入 npm / DOM API / 非 wx 路由 | ✅ |
| 全 rpx 无新增 px 单位 | ✅(本轮无 css 改动) |

---

## 验证

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 PASS**(零回归) |
| `node --check pages/index/index.js` | ✅ JS 语法 OK |
| `grep "previousOutput\|refineInstruction\b\|context_prompt\|refine_instruction" pages/index/index.js` | ✅ **0 hits**(D018b 残余清零) |
| `grep "[D018b]" pages/index/index.js` | ✅ **0 hits** |
| `grep "[D019]" pages/index/index.js` | ✅ **16 hits**(目标 ≥ 5,涵盖 8 类) |
| `grep "conversationHistory" pages/index/index.js` | ✅ 30 hits(全文流转一致) |
| `grep "refineInstructionInput" pages/index/index.js` | ✅ 8 hits |
| `grep "refineInstructionInput" pages/index/index.wxml` | ✅ 1 hit(textarea value 绑定) |
| 主包尺寸增量 | js +3992 B + wxml +95 B + wxss 0 B = **+4087 B ≈ 4.0 KB**(< 5 KB) ✅ |

---

## 待 Founder / PM 验证(真机)

预期日志看到的关键诊断:

1. **初次生成**:打开 DevTools Console 看到
   - `[D019] generateContent · 初次生成,无 history` (text) 或 `[D019] generateImageDescription · 初次生成,无 history` (image)
   - 完成后 `[D019] 📝 初次生成完成 · 初始化 history (2 turns)` { mode, userContent_length, assistantContent_length }

2. **点击「✨ 基于此继续优化」**:
   - `[D019] 🎯 onRefineFromCurrent · 展开输入框` { currentRound: 0, historyLength: 2 }

3. **填写要求 / 跳过 + 点「确认优化」**:
   - 跳过:`[D019] ✅ onConfirmRefine · 用户跳过填写,用默认兜底: 请基于以上输出做明显改进`
   - 填写:`[D019] ✅ onConfirmRefine · 用户具体要求: 节奏更慢`
   - 准备 push:`[D019] 🔑 onConfirmRefine · history 准备 push 给后端` { historyTurns: 3, historyRoles: ['user','assistant','user'] }
   - 透传:`[D019] 🔑 generateContent · 已挂 history` { historyTurns: 3, historyJson_preview }

4. **第 2 轮完成**:
   - `[D019] 📝 继续优化轮次完成 · push assistant` { round: 1, totalHistoryTurns: 4, historyRoles: ['user','assistant','user','assistant'] }

5. **改主输入触发重置**:
   - `[D019] 🔄 onInputChange · 检测到新主题,重置多轮对话历史`

6. **取消按钮**:
   - `[D019] ❌ onCancelRefine · 用户取消`

7. **达上限**:第 3 次点 confirm(refinementRound 已是 2) → wx.showToast '已达上限',按钮区域已是 refinement-done 态

---

## 给 @backend 的契约提醒(D019)

后端在收到 `history` 字段时:
1. JSON parse → `[{role, content}, ...]`
2. extend 到 LLM `messages`(在 system prompt 之后)
3. 仍要附加当前请求的 `content`(原始输入或 user msg)?— 取决于后端实现:
   - 方案 A:把 history 当 full context,**不再** append 当前 `content`(因为 content 已是 history 末尾的 user msg)
   - 方案 B:append `content` 作为最后一条 user msg(此时前端的 `content` 字段就是 history 末尾 user msg 的副本)
   
   建议:**方案 A**(history 即权威),当 history 存在时后端忽略 `content` 字段或仅做日志记录。@backend 可自行决定,关键是端到端 LLM 看到完整对话。

4. token 预算:历史可能很长,后端需做 truncation(D019 后端任务范围)
5. 当 history 不传 / 空数组 → 后端走单次模式(等同 D018 之前)

---

## 历史

- 2026-04-28 — D018b 真机反馈 4 项 fix(详见 completed.md)
- 2026-04-28 14:31 — D017 三档下架 + D018a Stage 2 C 方案 上下文注入
- 2026-04-27 23:50 — UX Hotfix 第三轮深修
