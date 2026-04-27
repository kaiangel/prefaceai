# Frontend(前端) - 已完成任务记录

> 创建日期: 2026-04-24
> 上次更新: 2026-04-27 23:50 UX Hotfix 第三轮深修(scroll-view 内部异常空白根因修复)
> 角色: frontend

---

## 已完成任务

### 2026-04-27 23:50 UX Hotfix 第三轮深修: scroll-view scroll-x + enable-flex 内部异常空白修复

**背景**:第二轮(方案 B)解锁 page 滚动后,Founder 真机截图(23:05)揭示新症状 — `.model-selector` 白色卡片视觉高度 ~1000rpx,内部内容只 ~390rpx,**风格按钮和 .current-selection 之间有 ~600rpx 真空白**。PM 怀疑 root cause 是 `scroll-view scroll-x enable-flex` 在 WeChatLib 3.6.0 上未显式设 height 时高度异常。

**官方 + 社区调研产出**:
1. [scroll-view 官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html) — 横向 scroll-x 需打开 enable-flex,但 height 行为未规定
2. [SegmentFault scroll-view 高度自适应](https://segmentfault.com/a/1190000023544769) — flex:1 高度不自适应需加 1px 默认或 virtualHost
3. [博客园 scroll-view 几个坑](https://www.cnblogs.com/Lyn4ever/p/11282210.html) — enable-flex 与 display:flex 二选一
4. WebSearch 多源印证 — **enable-flex 属性 + CSS display:flex 双开** 是已知社区 bug,会让 scroll-view 高度异常

**根因诊断**:`.style-options-scroll` wxml 写了 `enable-flex` + wxss 写了 `display: flex; justify-content: center;` —— 双开触发 bug,真机表现为高度异常,在父 `.model-selector { overflow: hidden }` 下显示为 600rpx 大空白。`.model-cards-scroll` 同样无显式 height,行为不可控。

**改动**(`pages/index/index.wxss`,3 处):
| # | selector | before | after |
|---|---------|--------|-------|
| 1 | `.model-cards-scroll` | 无 height | +`height: 200rpx`(卡片 160 + padding 24+10 = 194,取 200) |
| 2 | `.style-selector` | `margin: 16rpx 0 -26rpx` | `margin: 16rpx 0 8rpx`(去 negative 技术债) |
| 3 | `.style-options-scroll` | `display: flex; justify-content: center; padding: 0 20rpx;` | 删 display:flex + justify;改 `text-align: center`;加 `height: 80rpx`(按钮 56 + 上下 12) |

**验证**:`pytest tests/ -v` → 18/18 PASS;主包尺寸 +600 字节;全 rpx 无新 px;scope 仅 1 文件 3 selector;wxml/js/其他 pages/sumai 未触。

**待 Founder 真机二次截图验证**。

---

### 2026-04-27 23:30 UX Hotfix 方案 B: page 高度解锁(布局架构层修复)

**背景**:方案 A(rpx 数值微调节省 178rpx)真机验证失败 — Founder 截图仍然看不到输入框 + 点亮灵感按钮,空白延伸到 TabBar。PM 重新诊断 root cause:**`page { height: 100vh; overflow-y: auto }` 把页面高度锁死在一屏内,`.container/.content` flex 链中超出 viewport 的子元素被裁剪、page 不能滚动到下半**。这是历史遗留布局问题,Wave 1 加 complexity-selector 让超出量增大,问题彻底暴露。方案 A 只是把超出量从 ~200rpx 缩到 ~22rpx,根本没解决"page 不能滚动"。

**官方文档调研产出**(三个权威来源):

1. **[scroll-view 官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html)** 明确建议:
   > "若要使用下拉刷新,请使用页面的滚动,而不是 `scroll-view`,这样也能通过点击顶部状态栏回到页面顶部"

   → 不应改用 scroll-view 替代 page 滚动,而应让 page 滚动正常工作。

2. **[微信开放社区 - height: 100vh + padding 滚动问题](https://developers.weixin.qq.com/community/develop/doc/000e886114434024247b9a7735bc00)** 推荐:用 `min-height` 替代 `height` + `box-sizing: border-box`,让内容自然撑高页面。

3. **[微信开放社区 - 100vh 底部空白问题](https://developers.weixin.qq.com/community/develop/doc/0000ee43314db03403ca719815b000)** 社区共识:replace `height: 100vh` with `min-height: 100vh`。

**改动清单(`pages/index/index.wxss` 唯一改动文件)**:

| # | 位置 | before | after | 理由 |
|---|------|--------|-------|------|
| 1 | `page` (L1-12) | `min-height: 100vh; height: 100vh; overflow-y: auto; background: ... fixed` | `min-height: 100vh; background: ...`(去 fixed)| 解锁 page 高度;`background: fixed` 在 Skyline 不全支持且与可滚动页面易冲突,`.container` 已有等价渐变 |
| 2 | `.content::after` (原 L37-46) | `position: fixed; height: 100vh; z-index: -1`(无 background/content,纯死代码) | 删除 + 注释说明 | 历史遗留装饰层,删除无视觉差异 |
| 3 | `.container` padding-bottom (L28) | `120rpx` | `160rpx` | TabBar 实际占用 = 100rpx + 36rpx home indicator = 136rpx,旧 120 实际还差 16rpx,新 160 留 24rpx 安全边距 |

`.container { min-height: 100vh; flex-direction: column }` 和 `.content { flex: 1 }` **保留**(它们是"内容少时撑满 viewport"的正确姿势,与 page `min-height` 完全兼容)。

**严格遵守 scope**:
- ✅ 只改 `pages/index/index.wxss`
- ✅ 未触碰 wxml / js / app.* / 其他 pages / sumai/
- ✅ 未自行 commit(等 PM 统一 commit)

**验证**:
- ✅ `pytest tests/ -v` → **18/18 passed**(零回归)
- ✅ 主包尺寸:净变化 ≈ 持平(删 10 行死代码 + 加 ~12 行注释)
- ✅ grep:无 px 新增,无 DOM API,无 npm
- ✅ `100vh` 仅剩 page + container 各 1 处的 `min-height: 100vh` + keyboard-active 的 input-box(不相关),全部符合预期

**待 Founder 真机验证**:Stage 1 UX 阻塞问题(首屏看不到输入框 + 点亮灵感按钮 + 无法滚动到底)预期彻底解决。

**与方案 A 的关系**:方案 A 的 5 处 rpx 微调(padding-top / complexity-selector margin / complexity-option height / input-box min-height/max-height)**保留不动**。方案 B 是在 A 之上从布局架构层补上"为什么仍看不到"的根因修复。两者叠加后,既首屏紧凑又允许超出内容滚动看见。

---

### 2026-04-27 21:12 UX Hotfix 方案 A: 首屏布局修复(纯 wxss)

**背景**:Founder 真机截图发现 Wave 1 加 complexity-selector 后,首屏只能看到 title + 三档按钮 + 模型选择,**输入框和"点亮灵感"按钮被挤到第二屏**。元素总高 ~1548rpx,超 iPhone 一屏 ~1356rpx 约 200rpx。PM 选方案 A:最小改动,只调 wxss 数值节省 ~178rpx。

**改动清单(`pages/index/index.wxss` 唯一改动文件)**:

| selector | 行 | 属性 | before → after | 节省 |
|----------|----|------|----------------|------|
| `.container` | 16 | padding-top | 200rpx → 120rpx | 80rpx |
| `.complexity-selector` | 1128 | margin (bottom) | 24rpx → 12rpx | 12rpx |
| `.complexity-option` | 1142 | height | 64rpx → 56rpx | 8rpx |
| `.input-box` | 366 | min-height | 314rpx → 240rpx | 74rpx |
| `.input-box` | 367 | max-height | 334rpx → 260rpx | (同步缩,保 20rpx 弹性) |

**总节省**:垂直空间收缩约 **178rpx**(80 + 20 + 74,以 min-height 计),正好把第二屏的"点亮灵感"按钮拉回首屏。

**注释更新**:把 L16 原注释 `从原来的300rpx调整到120rpx` 改为 `方案 A: 200→120 节省 80rpx,Wave 1 后修复首屏`,反映本次 hotfix 语义。其他 3 处也加 `方案 A:` 前缀注释。

**严格遵守 scope**:
- ✅ 只改 `pages/index/index.wxss`
- ✅ 未触碰 wxml / js
- ✅ 未触碰 `app.js` / 其他 pages / `sumai/`
- ✅ 未自行 commit(等 PM 统一 commit)

**验证**:
- ✅ `pytest tests/ -v` → **18/18 passed**(零回归)
- ✅ 主包尺寸:字节增量近 0(纯数值改 + 注释微调)
- ✅ grep 4 处 Edit 命中目标 selector,无误伤(L233 `.style-option` 56rpx 是原有值)
- ✅ rpx 单位 / 无 DOM / 无 npm

**待 Founder 真机验证**:本次只能从 rpx 数值层面保证,首屏可见性需 Founder 截图二次确认。

---

### 2026-04-25 09:30 Session 3 Wave 2 Round 3: R3-C 前端透传 complexity 到 SSE

**背景**:Wave 1 已上线三档复杂度选择器(currentComplexity = quick/standard/professional),`switchComplexity()` 仅更新 UI。Round 3 把 complexity 实际透传到 SSE 请求,@backend R3-A 同步实施 system prompt 三档分支,即可端到端联调。

**契约(D016)**:
- 字段名:`complexity`
- 取值:`quick` | `standard` | `professional`(D016 禁用 `deep` 命名)
- 默认:前端默认 `quick`(未改);后端未收到 → fallback `standard`

**改动 1: generateContent() POST body**(pages/index/index.js L2358):
- 在 `wx.request` data 对象加 `complexity: this.data.currentComplexity`,与 `style` 同级
- 该函数路由到 14 个 SSE 端点(由 `getApiEndpoint(modelName, currentStyle)` 决定 URL):
  - 文本:botPromptStream / reasoningStream / aiAgentStream
  - 图像:dalleStream / fluxStream / jimengpicStream / lovartpicStream / midjourneyStream
  - 视频:kelingStream / jimengvidStream / lovartvidStream / runwayStream / wanxiangStream / sora2Stream
- **一处改动覆盖 14 个端点**,这是 form/POST body 风格

**改动 2: generateImageDescription() GET URL query**(pages/index/index.js L473-474):
- URL 拼接处追加 `&complexity=${encodeURIComponent(this.data.currentComplexity)}`
- 覆盖 `/describeImageStream` 端点(图生 prompt SSE,GET 风格)

**全扫确认**:`grep "enableChunked" pages/index/index.js` → 仅 2 处(L528 + L2371),全部覆盖。app.js 内的 wx.request 都是非 SSE(用于登录 / userinfo / 收藏 / 历史等业务调用),不在 R3-C 范围。

**为什么图生 prompt 也加 complexity**:
- 后端三档 directive 对所有 SSE 端点生效,前端不区分模态
- 即使图生 prompt 短期内 directive 影响有限,保持契约一致便于后端统一实现

**技术执行要点**:
- 两处改动都在纯 ASCII 区域(L473 附近 + L2358 附近),Edit 工具直接成功
- 无需走 Python 字节级脚本(GRAY-006 NBSP 仅影响混入 NBSP 的字符串匹配)
- 不改 URL endpoint,不改 currentComplexity 默认值

**合规校验**:
- ✅ 无 DOM API
- ✅ 无 px(纯 rpx)
- ✅ 无 npm 依赖变更
- ✅ 主包增量 ~145 字节(< 200 B 放宽预算)
- ✅ `node --check pages/index/index.js` SYNTAX OK
- ✅ `pytest tests/` 18 passed(与 Wave 2 R2 基线一致,零回归)

**未动文件**(不在任务范围):
- `app.js` 任何 wx.request(都是非 SSE 业务调用)
- `pages/profile/` / `pages/favorites/` / `pages/history/` / `pages/shared/` 的 wx.request(都是非 SSE)
- `components/reference-input/`(未发起独立 SSE,触发 generateImageDescription 的入口由 index.js 调用)

---

### 2026-04-24 21:44 Session 3 Wave 2 Round 2: W2-3 hunyuan 残留清理 + 通义万相路由确认

**背景**:D010 决策 — 通义万相方案 Y(后端规范化) + 下架 hunyuan。Wave 1 已把 `modelVisibility.hunyuan = false` 让 UI 不显示,但 code 中仍有 6 处 hunyuan 残留需要彻底清除,同时确认 wanxiang 路由指向 `/wanxiangStream`(@backend Round 2 新建中)。

**清理清单(pages/index/index.js 6 处)**:
1. L184 `modelPlaceholders['hunyuan']` 长文本描述(混元以超写实画质...)
2. L207 `modelNames['hunyuan']: '腾讯混元'`
3. L224 `modelIcons['hunyuan']: getImageUrl(CDN.IMAGES.MODEL_HUNYUAN)`
4. L231 `modelVisibility.hunyuan: false`(连同注释)
5. L288 `getApiEndpoint` 内 `'hunyuan': 'https://www.duyueai.com/hunyuanStream'`
6. L800-806 `performModelVisibilityCheck` 的整段 if 块(含前导 NBSP 空白分隔行)

**WXML 清理(pages/index/index.wxml L174-182)**:
- 删除腾讯混元 model-card 整块(注释 + 条件渲染块)

**CDN 常量清理(config/cdn.js L18)**:
- 删除 `MODEL_HUNYUAN: '/prompt/model-hunyuan.png'`

**通义万相路由确认**:
- `pages/index/index.js:282`(原 L286,hunyuan 删除后行号前移 4)`'wanxiang': 'https://www.duyueai.com/wanxiangStream'` ✅ 保留不动
- 等 @backend W2-2 方案 Y 让该端点返回 200

**技术执行要点**:
- 由于 `pages/index/index.js` 含 3038 个 U+00A0(GRAY-006),普通 Edit 工具首次匹配失败
- 改用 Python 字节级脚本:遍历每个 hunyuan 标识 → 定位行 `\n` 边界 → 整行删除
- 所有删除后 `node --check` 验证语法通过
- `pytest tests/` 18/18 PASS(与 Wave 2 R1 基线一致,零回归)

**合规校验**:
- ✅ 无 DOM API(无 window/document)
- ✅ 无 px(纯 rpx)
- ✅ 无 npm 依赖变更
- ✅ 主包尺寸**净减少 ~1.5 KB**(不增加)
- ✅ performModelVisibilityCheck 函数结构完整,只剩 midjourney 检查
- ✅ modelVisibility 对象 `{ midjourney: true, }` 合法

**未动文件**(不在任务范围):
- `pages/favorites/favorites.js` / `pages/history/history.js` / `pages/shared/shared.js` 的 modelNames 映射中仍保留 `'hunyuan': '腾讯混元'` —— 理由:历史数据显示标签兼容,Stage 2+ DB 扫描确认后再清理(需先咨询 @backend)

---

### 2026-04-24 Session 3 Wave 1: Stage 1 UX 先行

**1. 首页 Hero 文案升级**:
- `sub-title` 从 `"当你要AI真正懂你..."` → `"专业创作者的 AI Prompt 工作台"`
- 面向 Beachhead: 设计师 + 内容创作者 + 日常复杂任务人群

**2. 三档复杂度选择器**(核心 UX):
- 🔸 快速想法(`quick`)- 品牌绿 `#43B692`
- 🔹 深度创作(`standard`)- 辅色蓝 `#3F88C5`
- 💎 专业项目(`professional`)- 强调金 `#F4A460`
- 默认选中 "快速想法"

**3. 专业项目视觉强调**:
- 输入框金色边框
- 结果卡片金色上边框
- 右上角 `💎 专业项目` 徽标
- 小字提示 "生成更长、更结构化、更适合沉淀为项目模板的 prompt"

**改动文件**:
- `pages/index/index.wxml`(Hero + 三档选择器 + 视觉强调 + 徽标)
- `pages/index/index.wxss`(新增 ~120 行,rpx 单位)
- `pages/index/index.js`(新增 `currentComplexity` / `complexityOptions` / `switchComplexity()`,**未碰 API 层**)

**合规校验**:
- ✅ rpx 单位(无 px)
- ✅ WXML 模板(无 JSX/HTML)
- ✅ setData 更新(无直接赋值)
- ✅ 无 DOM API(无 window/document)
- ✅ 主包增量 < 4 KB,零图片

**pre-existing 问题发现**:
- `pages/index/index.js` 含 **3038 个 U+00A0**(非断空格)
- Session 2 之前代码就这样
- Edit 工具多次匹配失败,绕过而非修复
- **纳入 GRAY-006**,Stage 2+ 统一清理

**给 @backend Wave 2 交接**:
- 参数: `complexity`(string, enum: quick/standard/professional)
- 透传位置: `generateContent()` body
- 后端 fallback: `standard`

---

### 2026-04-24 Session 初始化

- 多 Agent 系统初始化
- frontend-progress 三件套待分配

---

## 上次更新记录

- 2026-04-24 21:44: Wave 2 R2 W2-3 完成(hunyuan 清理 + wanxiang 路由确认)
- 2026-04-24 Session 3 Wave 1: Stage 1 UX 完成,PM 代写
- 2026-04-24: 多 Agent 系统初始化
