# Frontend(前端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 14:31 三档下架(D017)+ Stage 2 C 方案 上下文注入(D018a)合并完成
> 角色: frontend

---

## 当前状态

✅ **2026-04-28 14:31 — Phase 1(D017 三档下架)+ Phase 2(D018a Stage 2 C 方案 上下文注入)合并完成**
✅ 2026-04-27 23:50 UX Hotfix 第三轮深修完成(scroll-view scroll-x + enable-flex 显式 height + 移除 enable-flex/display:flex 双开 bug)
✅ 2026-04-27 23:30 UX Hotfix 方案 B 完成(page 高度解锁)
✅ Wave 2 Round 3 R3-C 完成(complexity 透传 SSE)— 已下架,改为 context_prompt
✅ Wave 2 Round 2 W2-3 完成(hunyuan 残留清理 + wanxiang 路由确认)
✅ Wave 1 Stage 1 UX 完成

---

## 给 @backend 的上下文(2026-04-28 D018a Stage 2 C 方案)

### context_prompt 字段契约(已与 @backend 在 spawn 任务书中对齐)

- **字段名**:`context_prompt`(string)
- **透传位置 1**:`generateContent` POST body(常规生成 31 端点),与 `style` 同级
- **透传位置 2**:`generateImageDescription` URL query(`/describeImageStream` SSE),`&context_prompt=...`
- **挂载条件**:仅在 `refinementRound > 0 && previousOutput` 同时为真时挂载,初次生成不挂(fallback 友好)
- **轮次上限**:**3 轮由前端硬约束**,后端不感知 round 概念,只看是否收到 context_prompt 字段

### 后端 system prompt 写法(D018a PM 草稿,Founder 已批)

```
【上下文】用户上一轮已得到的 prompt 是:
{上一轮 output}

现在用户希望基于此继续优化。请保留有效部分,
根据用户新的输入做改进/补充/调整。
```

### 联调建议

- 用文生文模型先验证(返回最快、可控性最强)
- 第 1 轮初次生成 → 无 context_prompt 字段,后端走原 path
- 第 2 轮按下「✨ 基于此继续优化」→ body 多 `context_prompt`,后端把它注入 system prompt block
- 期望第 2 轮输出会"延续 + 深化"第 1 轮的方向,而非完全推翻

### 已删除字段(@backend Round 1 同时删除)

- ❌ `complexity`(D017 下架)— 前端已在 generateContent body + generateImageDescription URL 中清除,后端可同步删 stream.py / stream_en.py 的 directive

### 风险提示给 @backend

- `generateImageDescription` 走 URL query 携带 `context_prompt`(可能很长的 prompt 文本),警惕 nginx default `large_client_header_buffers` 8KB 限制
- 若后端测出 414 URI Too Long → 双方协调:要么 nginx 调 buffer,要么前端把 generateImageDescription 改 POST,要么前端对 previousOutput 做长度截断(如截 4000 字符)

---

## 给 @tester 的上下文(2026-04-28 D018a)

### 测试范围(Phase 1 + Phase 2 合并回归)

| 模块 | 期望 |
|---|---|
| pytest tests/(xuhua-wx)| 18/18 PASS(本次基线持平已验证)|
| 前端 grep complexity / currentComplexity / complexityOptions / switchComplexity | 在 pages/index/* 0 hit |
| 前端 grep refinementRound / MAX_REFINEMENT_ROUNDS / previousOutput / onRefineFromCurrent / context_prompt | 在 pages/index/* 多处命中(已罗列在 current.md)|

### 手动回归点(等 Founder 真机验证 / @tester 设计自动测试)

1. 首页中部三档按钮区彻底消失,空间收紧约 80rpx
2. 生成完成后 result-card 底部出现「✨ 基于此继续优化 (剩 3 次)」按钮
3. 点击 → 触发新一轮生成 → 完成后 result-card 左上角浮现「第 2 轮迭代」蓝色徽标 + counter 变 (剩 2 次)
4. 改 textarea 内容(idea 模式) → 按钮 counter 重置回 (剩 3 次) + 徽标消失
5. 同样 reference 模式下改 referenceText 也会触发重置
6. 连点 3 次后按钮消失,显示"已达 3 轮迭代上限,请重新点亮灵感开始新轮次"灰提示
7. 生成中(isGenerating === true)按钮和上限态都不显示(避免抢焦点)

### 建议的测试 stub(对应 Phase 2 spawn 任务书 @tester 部分)

- `test_context_injection_field_present_when_round_gt_0`(扫 pages/index/index.js 验证字段挂载逻辑)
- `test_context_injection_skipped_on_initial_generation`(扫验证 refinementRound === 0 时不挂载)
- `test_max_refinement_rounds_constant_is_3`(常量值校验)

---

## 给 @pm / @devops 的上下文

### 主包尺寸

- 本次净变化 **+9 B**(几乎持平):wxml -87B + wxss -1214B + js +1310B
- 当前主包 ~800 KB,距 2MB 仍充足

### 文件变更清单(给 PM 审查)

- `pages/index/index.wxml`(三档 UI 删除 + 新 refinement-area / refinement-badge)
- `pages/index/index.wxss`(Stage 1 三档样式整片删除 + 新 .refinement-* / .refine-* 样式)
- `pages/index/index.js`(data 块替换 + 新 onRefineFromCurrent + 双路径 context_prompt 挂载 + 双 input reset 点)
- `.claude/agents/frontend-progress/{current,completed,context-for-others}.md`(三件套全更新)
- `.team-brain/TEAM_CHAT.md`(本次完成消息追加)

按协议**未自行 commit**,等 PM 审查通过后统一 commit。

---

## 给所有角色的新增上下文(2026-04-27 第三轮深修)

### scroll-view 横向 scroll-x 模式编码规范(避坑)

**禁忌**:wxml 里写了 `enable-flex` 属性的 scroll-view,wxss 不要再写 `display: flex` —— **双开会触发社区已知高度异常 bug**(scroll-view 高度计算混乱,在父 overflow:hidden 下表现为大块空白)。

**正确做法**:
1. **横向 scroll-x 必须显式设 `height`**(竖向 scroll-y 文档已强调,横向虽未文档化但实测必备)
2. enable-flex 与 display:flex 二选一,通常 enable-flex 优先(WebView 兼容性更好)
3. 若需子元素居中,用 `text-align: center` 配合 `display: inline-flex/inline-block` 子元素,而非 `justify-content: center`(后者要求父开 flex)
4. 子元素自身可用 `display: inline-flex` 实现内容垂直居中

**适用范围**:本项目的 `pages/index/index.wxss` 已修复 .model-cards-scroll 和 .style-options-scroll;其他页面(history/favorites/profile/shared/login/settings/feedback)如果有类似 scroll-x + enable-flex 模式,务必**自查是否同时设了 display:flex**,有则按本次修复模式调整。

### .style-selector negative margin 技术债已清理

原 `margin: 16rpx 0 -26rpx` 是历史遗留(让风格按钮"压"在下方 .current-selection 上的视觉技巧),已改为正向 8rpx。视觉间距更自然,无 z-index 堆叠副作用。

---

## 给所有角色的上下文(2026-04-27 方案 B 深度修复)

### page 高度模式正式从"锁死 100vh"改为"min-height 100vh"

**官方文档背书**:
- [scroll-view 文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html) 明确推荐"页面级长内容用页面默认滚动"
- [社区 100vh + padding 滚动问题](https://developers.weixin.qq.com/community/develop/doc/000e886114434024247b9a7735bc00) 共识:用 `min-height` 替代 `height`

**改动影响**:
- `page` 现在可以**自然撑高**到内容高度(min-height: 100vh 保证至少一屏)
- page 滚动由小程序原生接管(无需声明 overflow-y: auto,反而声明会与页面默认行为冲突)
- 删除了 `.content::after` 历史装饰层(原 fixed + 100vh 但无背景,纯死代码)
- `.container { padding-bottom }` 从 120rpx 提至 160rpx,确保 TabBar(实际 136rpx)有 24rpx 安全边距

**对其他 page 的启示**(如 history / favorites / profile / shared 等其他页面):
- 如果出现"滚动失效"或"底部内容看不到"问题,先 grep 该页 wxss 是否有 `page { height: 100vh; overflow-y: auto }`
- 推荐统一用 `page { min-height: 100vh }` 让小程序原生滚动接管
- TabBar 占位 136rpx,所有页面 padding-bottom 至少 160rpx 才安全(已确认 custom-tab-bar 是 fixed bottom: 0 + 100rpx height + 36rpx padding-bottom)

---

## 给 @backend 的上下文(Wave 2 Round 3)

### R3-C 前端透传 complexity 到 SSE 完成

**前端已透传契约(D016)**:
- 字段名:`complexity`
- 取值:`quick` | `standard` | `professional`
- POST body 透传位置(generateContent · 14 个 SSE 端点):
  - 在 `data: {...}` 里,与 `style` 同级(`pages/index/index.js` L2358)
- GET URL query 透传位置(generateImageDescription · /describeImageStream):
  - URL 末尾 `&complexity=...`(`pages/index/index.js` L473-474)
- **前端默认值** `quick`,后端 fallback 应为 `standard`

**@backend R3-A 需要在 stream.py / stream_en.py 实施**:
- 每个 generate() 函数读 `request.form.get('complexity', 'standard')` 或 GET 风格 `request.args.get('complexity', 'standard')`
- 应用三档 system prompt directive(quick / standard / professional)
- @backend 可直接联调,不需要前端再改

**联调验证建议**:
- 切到"专业项目"档(💎 金色),发一条 prompt → 期望比"快速想法"(🔸 绿色)生成结果显著更长 / 更结构化
- describeImageStream 同理,上传一张图 + 切档,期望 directive 影响输出风格

---

## 给 @backend 的上下文(Wave 2 Round 2)

### W2-3 前端已完成的配合工作

1. **pages/index/index.js 中 hunyuan 残留彻底清除**(6 处):
   - modelPlaceholders / modelNames / modelIcons / modelVisibility / getApiEndpoint URL / performModelVisibilityCheck 的 if 检查块
2. **pages/index/index.wxml 中 hunyuan model-card 块已删**
3. **config/cdn.js 中 MODEL_HUNYUAN 常量已删**

### 给 @backend W2-2 的接口契约

前端 `getApiEndpoint()` 返回给通义万相模型的 URL 是:
```
https://www.duyueai.com/wanxiangStream
```

- 前端已**保持不动**(Wave 1 之前就是这个 URL)
- 等 @backend W2-2 让此端点返回 **200**(SSE 流式响应)
- 当前生产环境此 URL 返回 404(YELLOW-001 问题)
- 后端 W2-2 完成后前端不需任何改动即可联调成功

### complexity 参数契约(Wave 1 遗留,W2-4 待实施)

- **参数名**: `complexity`
- **类型**: string
- **enum**: `quick` | `standard` | `professional`(D016 决策命名)
- **透传位置**: `generateContent()` body,和 `style` 同级
- **默认值**: 前端默认选中 `quick`(品牌绿)
- **后端 fallback**: 未收到 complexity → 默认 `standard`

---

## 给 @tester 的上下文

### W2-3 的改动点(测试回归范围)

- `pages/index/index.js` 删除 6 处 hunyuan(字节级删除,保持 NBSP 缩进完整)
- `pages/index/index.wxml` 删除 1 个 model-card 块
- `config/cdn.js` 删除 MODEL_HUNYUAN 常量
- `node --check` 两个 JS 文件语法 OK
- `pytest tests/` → **18 passed**(与 Wave 2 R1 基线一致,零回归)

### 手动回归建议

- 进入首页 → 切到"生视频"Tab → 确认模型列表只显示:可灵AI / 即梦AI / Lovart / Runway / 通义万相 / Sora2(腾讯混元不再出现)
- 切换模型时不报 "undefined property" 错误
- 通义万相路径联调等 @backend W2-2 完成后
- 历史记录页面(pages/history)打开旧 hunyuan 内容时仍能显示"腾讯混元"标签(因 favorites/history/shared 的 modelNames 映射保留,见下)

### 前端已知的遗留 hunyuan 条目(非本次清理范围)

在以下 3 个文件的 modelNames 映射中仍有 `'hunyuan': '腾讯混元'`:
- `pages/favorites/favorites.js:32`
- `pages/history/history.js:35`
- `pages/shared/shared.js:31`

**保留理由**:历史数据显示标签兼容 — 旧的 hunyuan 内容在收藏 / 历史 / 分享落地页打开时仍能正确渲染中文名。删除会导致 raw model_id 字符串出现。

Stage 2+ 的清理需要 @backend 先确认 DB 中无残留 hunyuan 条目后再做。**本次不动**。

---

## 给 @devops 的上下文

- 本次 W2-3 改动使主包**净减少 ~1.5 KB**(不增加)
- 当前主包 ~800 KB,距 2 MB 还有充足空间
- 无新图片 / 新字体进包
- rpx 规范通过

---

## 给 @pm 的上下文

### W2-3 验收总结

- ✅ 全部 7 条验收标准达成(包括主包尺寸无增加、pytest 18/18、无 DOM API、wanxiang 路由保持、hunyuan 归零)
- ✅ 前端不自行 commit,等 PM 审查统一 commit
- ✅ 与 @backend W2-2 方案 Y 并行无冲突(前端路由提前就绪,只等后端端点上线)

### 文件变更清单(给 PM 审查)

- `pages/index/index.js`(-979 B,6 处 hunyuan 清除)
- `pages/index/index.wxml`(-~500 B,1 个 model-card 块清除)
- `config/cdn.js`(-~55 B,1 个常量清除)
- `.claude/agents/frontend-progress/current.md`(更新)
- `.claude/agents/frontend-progress/completed.md`(更新)
- `.claude/agents/frontend-progress/context-for-others.md`(本文件,更新)
- `.team-brain/TEAM_CHAT.md`(追加完成消息)

### 建议

- hunyuan 已从生产 UI 完全消失(Wave 1 已做到),本次是把 code 也清理干净
- **favorites/history/shared 3 个文件的 modelNames 映射清理**建议 Stage 2+:
  - 先让 @backend 扫描生产 DB 确认无 hunyuan 生成的历史内容
  - 或先做一次 DB 迁移把 hunyuan 内容打标为"已下架"并替换 model 字段
  - 再删前端映射

---

## 给 @resonance 的上下文

- 混元(Tencent Hunyuan)在序话的 UI 和代码中已彻底下架
- 通义万相(Qwen Wanxiang)成为视频生成的主打模型之一,W2-2 完成后就能正常使用
- 对外营销文案若提到视频模型,**不要再列"腾讯混元"**

---

## 上次更新记录

- 2026-04-24 21:44: Wave 2 R2 W2-3 完成(hunyuan 清理 + wanxiang 路由确认)
- 2026-04-24 Session 3 Wave 1: Stage 1 UX 完成,PM 代写
- 2026-04-24: 多 Agent 系统初始化
