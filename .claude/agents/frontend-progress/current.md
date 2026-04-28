# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 14:31 三档下架(D017)+ Stage 2 C 方案上下文注入(D018a)合并完成
> 角色: frontend

---

## 当前状态

✅ **2026-04-28 14:31 — Phase 1(D017 三档下架)+ Phase 2(D018a Stage 2 C 方案 上下文注入)合并任务全部完成**

PM 1 轮 spawn 3 teammate 并行策略下,前端在 `pages/index/{wxml,wxss,js}` 三个文件内一次性完成 Phase 1 删除 + Phase 2 新增,避免两轮 spawn 协调成本。

---

## Phase 1 · 三档复杂度下架(D017)

### 改动总览

| 文件 | 删除内容 |
|------|---------|
| `pages/index/index.wxml` | `.complexity-selector` 整段(L13-29)+ `.input-area` 上的 `currentComplexity === 'professional'` class binding + `.result-card` 上的同样 class binding + `.professional-badge` 整段 |
| `pages/index/index.wxss` | 整片 Stage 1 三档样式区(L1138-1257):`.complexity-selector` / `.complexity-options` / `.complexity-option` 及其 `:active` / 三档 `.active` 变体(quick / standard / professional)/ `.complexity-emoji` / `.complexity-name` / `.complexity-hint` / `.complexity-hint-text` / `.input-area-professional` / `.result-card-professional` / `.professional-badge` |
| `pages/index/index.js` | data 块 `currentComplexity` + `complexityOptions` 删除(L242-247)+ `switchComplexity` method 删除(L251-254)+ `generateImageDescription` URL 里 `&complexity=...`(L473-474)删除 + `generateContent` body 里 `complexity: this.data.currentComplexity`(L2358)删除 |

### 验证

```bash
$ grep -rn "complexity\|currentComplexity\|complexityOptions\|switchComplexity" pages/index/index.{js,wxml,wxss}
(no output — 0 hits)
```

✅ Phase 1 三档相关前端实施全部清除,无残留。

### 保留(D017 明示)

- Hero 文案"专业创作者的 AI Prompt 工作台"保留(`pages/index/index.wxml` L9 sub-title 不动)

---

## Phase 2 · Stage 2 C 方案 上下文注入(D018a)

### 产品契约(已锁,与 @backend 对齐)

- 字段名: `context_prompt`(string)
- 透传位置: `generateContent` body / `generateImageDescription` URL query
- **轮次上限 3 轮由前端硬约束**(后端不感知)
- 按钮文案:`✨ 基于此继续优化`(D018a)
- 第 N 轮(N ≥ 2)result-card 顶部出现 `第 N 轮迭代` 视觉徽标

### data 块新增(`pages/index/index.js` L241-244)

```js
// Stage 2 D018a: 上下文注入(C 方案)— 「✨ 基于此继续优化」最多 3 轮
refinementRound: 0,            // 当前迭代轮次,0 = 初次生成,1-3 = 第 N 次基于上轮优化
MAX_REFINEMENT_ROUNDS: 3,      // D018a 上限(前端硬约束,后端不感知)
previousOutput: '',            // 上一轮 output(将作为下一轮 context_prompt 注入)
```

### 新增 method(`pages/index/index.js` L247-264)

```js
onRefineFromCurrent: function() {
  // 1. 校验:已达上限 → toast 拦截
  // 2. 校验:暂无 fullContent → toast 拦截
  // 3. setData previousOutput = fullContent + refinementRound + 1
  // 4. 调用原 onGeneratePrompt(它内部按 inputMode 路由到 generateContent / generateImageDescription)
}
```

### 上下文挂载(双路径全覆盖)

| 调用路径 | 修改 | 位置 |
|---|---|---|
| `generateContent` body(POST 文/图/视频常规生成 31 端点)| spread `...(refinementRound > 0 && previousOutput ? { context_prompt } : {})` | `index.js` L2378-2381 |
| `generateImageDescription` URL query(图生 prompt SSE)| `url += '&context_prompt=' + encodeURIComponent(previousOutput)`(同样 refinementRound > 0 时)| `index.js` L487-490 |

**fallback 友好**:仅在 refinementRound > 0 时挂 context_prompt,初次生成不挂,后端兼容。

### 重置点(用户改输入文本 → 视为开新主题)

| 触发点 | 行为 |
|---|---|
| `onInputChange`(idea 模式输入框 input)| 检测 refinementRound > 0 → 同时 reset refinementRound: 0 + previousOutput: '' |
| `onReferenceInputChange`(reference 模式参考文字 input)| 同上 |

### WXML 新增(`pages/index/index.wxml`)

1. **第 N 轮迭代徽标**(L284-287,result-card 顶部):
   ```wxml
   <view class="refinement-badge" wx:if="{{refinementRound > 0}}">
     <text>第 {{refinementRound + 1}} 轮迭代</text>
   </view>
   ```
2. **「✨ 基于此继续优化」按钮 + counter**(L379-392,在 result-content 之后,result-card 内):
   - `wx:if="{{!isGenerating && refinementRound < MAX_REFINEMENT_ROUNDS}}"` 显示按钮
   - `wx:elif="{{!isGenerating && refinementRound >= MAX_REFINEMENT_ROUNDS}}"` 显示 "已达 3 轮迭代上限,请重新点亮灵感开始新轮次"
   - 增加 `!isGenerating` 守卫,避免生成中按钮抢焦点

### WXSS 新增(`pages/index/index.wxss` L1138-1198)

| 选择器 | 用途 |
|---|---|
| `.refinement-area` | 居中容器,与下方 result 内容分隔 |
| `.refine-btn` | 渐变绿→蓝 pill 按钮(品牌主辅色),round-pill 999rpx |
| `.refine-btn::after { border: none }` | 微信 button 默认 border 抹掉(避免 hairline) |
| `.refine-btn-hover` | scale(0.96) + 阴影减弱 |
| `.refine-counter` | 22rpx 半透明小字标 |
| `.refinement-done` / `.refine-done-text` | 上限态柔和灰提示 |
| `.refinement-badge` | 占据原 .professional-badge 的视觉位置(top: -1rpx),改用左上角 + 蓝色辅色 #3F88C5,与按钮渐变蓝端呼应 |

---

## 严格 scope 遵守

| 项 | 状态 |
|---|---|
| 只动 `pages/index/{wxml,wxss,js}` | ✅ |
| 未触碰 `app.js` / `app.wxss` / 其他 pages | ✅ |
| 未触碰 `sumai/` | ✅ |
| 未触碰 `tests/` | ✅ |
| 未触碰 其他 agent progress 文件 | ✅ |
| 未自行 commit(等 PM 统一) | ✅ |
| 未新增 npm 依赖 / DOM API / 非 wx 路由 | ✅ |

---

## 验证

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 PASS**(零回归) |
| `grep complexity\|currentComplexity\|complexityOptions\|switchComplexity` in pages/index/* | 0 hit ✅ |
| `grep refinementRound\|MAX_REFINEMENT_ROUNDS\|previousOutput\|onRefineFromCurrent\|context_prompt` in pages/index/* | 多处命中(data + method + 双路径挂载 + 双 reset 点 + WXML + WXSS) ✅ |
| 主包尺寸增量 | wxml -87B + wxss -1214B + js +1310B = **+9 B 净变化**(远低于 5KB) |
| 新增 px 单位 | 0(扫描确认)✅ |
| WXML 单位 / 路由 / setData / 无 DOM | 全合规 ✅ |
| scroll-view enable-flex + display:flex 双开 bug 风险 | N/A(本次未新增 scroll-view)✅ |

---

## 风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| 用户在迭代过程中误改 input 导致链路重置 | 低 | 设计就是"改 input = 新主题",符合直觉,且 refinementRound 提示和按钮 counter 给视觉反馈 |
| previousOutput 字段过长(超长 prompt + URL query 长度限制) | 中 | `generateImageDescription` 走 query string,长 prompt 在某些 nginx/微信底层可能超 8KB 限制。规避策略:后端 Round 1 完成后建议双方对齐 — 是否把 generateImageDescription 也改 POST,或前端对 previousOutput 做长度截断 |
| 第 3 轮迭代后用户期望"复位"路径不明 | 低 | 已在 refinement-done 文案明示"请重新点亮灵感开始新轮次",且改输入框就 reset |
| context_prompt 在后端如果未实现仍会被请求体携带 | 低 | 仅在 refinementRound > 0 时挂载,初次生成不挂 → fallback 友好;@backend 已并行实现 |

---

## 待 Founder / PM 验证

我无法亲自跑真机。预期 Founder 二次截图验证:
1. ✅ 首页中部三档按钮区彻底消失(高度收紧约 80rpx)
2. ✅ 生成完成后 result-card 底部出现「✨ 基于此继续优化 (剩 3 次)」按钮
3. ✅ 点击后再次生成,result-card 左上角浮现「第 2 轮迭代」蓝色徽标 + counter 变 (剩 2 次)
4. ✅ 改 textarea 内容 → 按钮 counter 重置回 (剩 3 次) + 徽标消失
5. ✅ 连点 3 次后按钮消失,显示"已达 3 轮迭代上限"灰提示

---

## 待 PM 审查后统一 commit

按协议**未自行 commit**。改动文件清单:

- `pages/index/index.wxml`(三档 UI 删除 + 新 refinement-area / refinement-badge)
- `pages/index/index.wxss`(Stage 1 三档样式整片删除 + 新 .refinement-* / .refine-* 样式)
- `pages/index/index.js`(data 块替换 + 新 onRefineFromCurrent + 双路径 context_prompt 挂载 + 双 input reset 点)
- `.claude/agents/frontend-progress/{current,completed,context-for-others}.md`(三件套全更新)
- `.team-brain/TEAM_CHAT.md`(本次完成消息追加)

---

## 历史:2026-04-27 23:50 UX Hotfix 第三轮深修

(scroll-view scroll-x + enable-flex 内部异常空白根因修复 — 详见 completed.md)
