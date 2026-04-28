# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D018b 真机反馈四项 fix 完成
> 角色: frontend

---

## 当前状态

✅ **2026-04-28 — D018b 真机反馈 4 项 fix 完成**

承接 D018a 真机反馈,实施 4 项修复:
1. **Fix 1** 主按钮 `white-space: nowrap` + counter padding 收紧(防真机文字换行)
2. **Fix 2** `MAX_REFINEMENT_ROUNDS: 3 → 2`(初始 counter "剩 2 次",共 3 次输出 = 初次 + 2 轮继续)
3. **Fix 3** 方案 b · 点按钮后展开"继续优化要求"输入框 + 「✓ 确认优化」/「取消」按钮(用户填指令后才触发 generate)
4. **Fix 4** 透传 `refine_instruction` 字段到 `generateContent` body + `generateImageDescription` URL(后端 D018b 契约)

---

## 改动总览

| 文件 | 改动 |
|------|------|
| `pages/index/index.js` | data 块 `MAX_REFINEMENT_ROUNDS: 3 → 2` + 新增 `showRefineInput` / `refineInstruction` state;`onRefineFromCurrent` 改为"展开输入框"(不立即触发);新增 `onRefineInstructionInput` / `onConfirmRefine` / `onCancelRefine` 三个 method;`generateContent` body 和 `generateImageDescription` URL 同时挂 `refine_instruction`;`onInputChange` / `onReferenceInputChange` 重置点同步 reset `showRefineInput` + `refineInstruction` |
| `pages/index/index.wxml` | 主按钮 `wx:if` 加 `&& !showRefineInput` 条件;主按钮文案上限态保持(其文案仍写"已达 3 轮迭代上限",因为加上初次共 3 轮);新增 `.refine-input-area` 块(textarea + 取消按钮 + 确认优化按钮) |
| `pages/index/index.wxss` | `.refine-btn` 加 `white-space: nowrap`、padding 由 32rpx → 28rpx 收紧、`.refine-counter` margin-left 8rpx → 6rpx + 加 nowrap;新增 `.refine-btn-text`、`.refine-input-area`、`.refine-instruction-box`、`.refine-input-buttons`、`.refine-cancel-btn` (+ hover/after)、`.refine-confirm-btn` (+ hover/after) |

---

## 关键代码点

### data 块(index.js L241-247)

```js
refinementRound: 0,            // 0 = 初次生成,1-2 = 第 N 次基于上轮优化
MAX_REFINEMENT_ROUNDS: 2,      // D018b: 改为 2(counter "剩 2 次"起步)
previousOutput: '',            // 上一轮 output → 下一轮 context_prompt
showRefineInput: false,        // D018b 方案 b: 是否展开"继续优化要求"输入框
refineInstruction: '',         // D018b: 用户填写的继续优化要求(可空)
```

### 状态机(D018b 方案 b)

```
初始态: showRefineInput=false, refinementRound=0, refineInstruction=''
  ↓ 点击「✨ 基于此继续优化」(onRefineFromCurrent)
展开态: showRefineInput=true, refinementRound=0(尚未 +1)
  ↓ ① 用户写指令(可空)→ 点「✓ 确认优化」(onConfirmRefine)
触发态: showRefineInput=false, refinementRound=1, previousOutput=fullContent
  → onGeneratePrompt → generateContent/generateImageDescription 自动带 refine_instruction + context_prompt
  ↓ ② 用户点「取消」(onCancelRefine)
回到初始态: showRefineInput=false, refineInstruction=''(refinementRound 不变)
```

### 后端契约挂载(双路径全覆盖)

| 路径 | 位置 | 代码 |
|------|------|------|
| `generateContent` body(POST 31 端点)| index.js L2421-2431 | `...(refinementRound > 0 && previousOutput ? { context_prompt, refine_instruction } : {})` |
| `generateImageDescription` URL query(SSE 1 端点)| index.js L529-532 | `url += '&context_prompt=...&refine_instruction=...'`(同上条件)|

**契约语义**:`refine_instruction` 仅在 refinementRound > 0(即与 context_prompt 同时)时挂载,且即使空字符串也传(后端能区分"传了空" vs "没传")。

### 重置点(用户改主输入 → 视为新主题)

| 触发 | 行为 |
|------|------|
| `onInputChange` (idea 模式)| reset refinementRound + previousOutput + showRefineInput + refineInstruction |
| `onReferenceInputChange` (reference 模式)| 同上 |

---

## WXML 三态结构

```wxml
<!-- ① 主按钮 -->
<view class="refinement-area" wx:if="{{!isGenerating && refinementRound < MAX_REFINEMENT_ROUNDS && !showRefineInput}}">
  <button class="refine-btn" bindtap="onRefineFromCurrent">
    <text class="refine-btn-text">✨ 基于此继续优化</text>
    <text class="refine-counter">(剩 {{MAX_REFINEMENT_ROUNDS - refinementRound}} 次)</text>
  </button>
</view>
<!-- ② 上限态 -->
<view class="refinement-area refinement-done" wx:elif="{{!isGenerating && refinementRound >= MAX_REFINEMENT_ROUNDS}}">
  <text class="refine-done-text">已达 3 轮迭代上限,请重新点亮灵感开始新轮次</text>
</view>
<!-- ③ 输入框区域(独立 wx:if,不在 if/elif 链中)-->
<view class="refine-input-area" wx:if="{{showRefineInput && !isGenerating}}">
  <textarea ... bindinput="onRefineInstructionInput" auto-focus />
  <view class="refine-input-buttons">
    <button class="refine-cancel-btn" bindtap="onCancelRefine">取消</button>
    <button class="refine-confirm-btn" bindtap="onConfirmRefine">✓ 确认优化</button>
  </view>
</view>
```

---

## 严格 scope 遵守

| 项 | 状态 |
|---|---|
| 只动 `pages/index/{wxml,wxss,js}` | ✅ |
| 未触碰 `app.js` / 其他 pages | ✅ |
| 未触碰 `sumai/` | ✅ |
| 未触碰 `tests/` | ✅ |
| 未触碰 其他 agent progress 文件 | ✅ |
| 未自行 commit(等 PM 统一) | ✅ |
| 未引入 npm / DOM API / 非 wx 路由 | ✅ |
| 全 rpx 无新增 px 单位 | ✅ |

---

## 验证

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 PASS**(零回归) |
| `grep MAX_REFINEMENT_ROUNDS` | 已是 `2`(L243) ✅ |
| `grep showRefineInput` | js 9 处 / wxml 2 处 ✅ |
| `grep refineInstruction` | js 22 处 / wxml 6 处 ✅ |
| `grep onConfirmRefine` | js + wxml 各 1 处定义/绑定 ✅ |
| `grep onCancelRefine` | js + wxml 各 1 处定义/绑定 ✅ |
| `grep onRefineInstructionInput` | js + wxml 各 1 处定义/绑定 ✅ |
| `grep refine_instruction` | js 4 处(2 处实际挂载 + 2 处注释)✅ |
| 主包尺寸增量 | wxml +1430B + wxss +1572B + js +1957B = **+4959 B 净增 ≈ 4.84 KB**(< 5KB) ✅ |
| 新增 px 单位 | 0 ✅ |
| WXML 单位 / 路由 / setData / 无 DOM | 全合规 ✅ |
| scroll-view enable-flex 双开 bug 风险 | N/A(本次未新增 scroll-view)✅ |

---

## 待 Founder / PM 验证(真机)

我无法亲自跑真机。预期 Founder 二次截图验证:

1. ✅ 生成完成后底部按钮文案「✨ 基于此继续优化 (剩 2 次)」**不换行**
2. ✅ 点击按钮 → 按钮区淡出 / 输入框区滑出(显示 textarea + auto-focus + 取消/确认两按钮)
3. ✅ 点「取消」→ 输入框区收起 / 主按钮回来 / refinementRound 不变(仍是"剩 2 次")
4. ✅ 不写指令直接点「✓ 确认优化」→ 触发 generate(refine_instruction 传空字符串到后端)→ 第 2 轮生成 → 徽标「第 2 轮迭代」+ 按钮变「(剩 1 次)」
5. ✅ 写指令"节奏更慢"再点「✓ 确认优化」→ 触发 generate(refine_instruction 传值)→ 后端按指令重写
6. ✅ 连点 2 次 confirm 后(refinementRound = 2)→ 按钮消失 / "已达 3 轮迭代上限"灰提示出现
7. ✅ 改 textarea 主输入文本 → counter 重置回 (剩 2 次) + 输入框区(若展开)收起 + refineInstruction 清空

---

## 给 @backend 的契约提醒

后端在收到 `refine_instruction` 字段时(必伴随 context_prompt),按 D018b system prompt 注入"用户继续优化要求是: {refine_instruction}"。空字符串视为"用户没填,自由发挥即可"。前端保证只在 refinementRound > 0 时挂这两个字段。

---

## 待 PM 审查后统一 commit

按协议**未自行 commit**。改动文件清单:

- `pages/index/index.wxml`(refinement-area 三态结构 + .refine-input-area 块)
- `pages/index/index.wxss`(.refine-btn 加 nowrap + .refine-input-area / .refine-instruction-box / .refine-input-buttons / .refine-cancel-btn / .refine-confirm-btn 新增)
- `pages/index/index.js`(data 块 MAX 改 2 + 新 state + onRefineFromCurrent 改逻辑 + 3 新 method + 双路径 refine_instruction 挂载 + 双 reset 点同步清理)
- `.claude/agents/frontend-progress/{current,completed,context-for-others}.md`(三件套全更新)
- `.team-brain/TEAM_CHAT.md`(本次完成消息追加)

---

## 历史

- 2026-04-28 14:31 — D017 三档下架 + D018a Stage 2 C 方案 上下文注入(详见 completed.md)
- 2026-04-27 23:50 — UX Hotfix 第三轮深修
