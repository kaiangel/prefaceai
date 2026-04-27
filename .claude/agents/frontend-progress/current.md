# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-27 23:50 UX Hotfix 第三轮深修(scroll-view height 显式化)
> 角色: frontend

---

## 当前状态

✅ **2026-04-27 23:50 UX Hotfix 第三轮深修完成**(model-selector 内部异常空白根因修复)

### 本次任务

第二轮(方案 B)修复让 page 可滚动 ✅,但 Founder 真机截图(23:05)揭示新症状:`.model-selector` 白色卡片视觉高度 ~1000rpx,内部内容只 ~390rpx,**风格按钮和 .current-selection 之间有 ~600rpx 真空白**。

PM 怀疑 root cause:`scroll-view scroll-x enable-flex` 在 WeChatLib 3.6.0 上未显式设 height 时高度异常。要求做官方文档深度调研后修复。

### 官方文档 + 社区调研产出(权威背书)

| # | 来源 | 关键引用 | 对本修复的指导 |
|---|------|----------|----------------|
| 1 | [scroll-view 官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html) | "使用竖向滚动时,需要给 scroll-view 一个固定高度,通过 WXSS 设置 height";"横向滚动需打开 enable-flex 以兼容 WebView" | 横向 scroll-x + enable-flex 不显式 height 行为不规定,实际易出问题 |
| 2 | [SegmentFault 高度自适应解决方案](https://segmentfault.com/a/1190000023544769) | "flex:1 高度依然不会自适应,加一个默认高度 1px 就可以自适应了";"组件化后一定要设置组件虚拟化,否则高度还是不会自适应" | scroll-view 高度异常是已知坑,需显式控制 |
| 3 | [博客园 - scroll-view 几个坑](https://www.cnblogs.com/Lyn4ever/p/11282210.html) | "view 是 block 组件,但是这里用了 flex 就不能滚动了" → 解决方案 `overflow: hidden; white-space: nowrap;` 或启用 `enable-flex` | enable-flex 与 display: flex 二选一原则 |
| 4 | WebSearch 结论(多源印证) | "When opening enable-flex with CSS display: flex on scroll-view, the height displays abnormally"(社区共识) | **直击 .style-options-scroll 元凶:同时使用 enable-flex 属性 和 CSS display:flex** |

### 根因诊断

`.style-options-scroll` 的 wxml 写了 `enable-flex` 属性,wxss 又写了 `display: flex; justify-content: center;` —— **enable-flex + display:flex 双开** 触发社区已知 bug,真机表现为高度异常,在父 `.model-selector { overflow: hidden }` 下产生大块空白。

`.model-cards-scroll` 同样问题(scroll-x + enable-flex 但无显式 height),在 WeChatLib 渲染下行为不可控。

### 改动清单(`pages/index/index.wxss` 唯一改动文件)

| # | selector | before | after | 理由 |
|---|---------|--------|-------|------|
| 1 | `.model-cards-scroll`(L135-141) | 无 height | `+height: 200rpx` | 卡片 160rpx + 上下 padding(24+10) = 194rpx,向上取整 200 留 6rpx 弹性 |
| 2 | `.style-selector`(L218-220) | `margin: 16rpx 0 -26rpx` | `margin: 16rpx 0 8rpx` | 移除 -26rpx negative bottom margin 技术债,改正向 8rpx 自然分隔 |
| 3 | `.style-options-scroll`(L222-227) | `display: flex; justify-content: center; padding: 0 20rpx;`(无 height) | 删 `display: flex` + 删 `justify-content: center`,改用 `text-align: center` + 加 `height: 80rpx` | 触发 enable-flex + display:flex 双开 bug 的根因消除;`.style-option` 自身 inline-flex 已能正常排列;显式 height(56rpx 按钮 + 上下 12rpx) |

`.model-tabs` 不动(已有 height: 50rpx,虽数值偏小但实际显示无 bug,本次 scope 控制);其它已有 hotfix 方案 A/B 的改动**全部保留**。

### 严格遵守 scope

- ✅ 只改 `pages/index/index.wxss`(3 处 selector)
- ✅ 未触碰 `pages/index/index.wxml`
- ✅ 未触碰 `pages/index/index.js`
- ✅ 未触碰 `app.js` / `app.wxss` / 其他 pages / `sumai/`
- ✅ 未自行 commit

### 验证

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 passed**(零回归,与方案 A/B/Wave 2 R3 基线一致) |
| 主包尺寸 | 字节净变化:增加 ~16 行注释 + 3 行 height/text-align,约 +600 字节,远低于 30 KB 上限 |
| 微信小程序合规 | ✅ 全部 rpx,无新 px(703/707/715/891 行的 px 是预先存在的 1-2px scrollbar / media query) |
| `display: flex` 在 scroll-view 上的二次扫描 | ✅ 仅剩 `.model-tabs`(它无问题且本次不动)|

### 风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| .style-options-scroll 居中失效 | 极低 | 用 `text-align: center` 替代 `justify-content: center`,inline-flex 元素响应 text-align,效果等价 |
| .style-selector 移除 -26rpx 后 .current-selection 距离变远 | 极低 | 原 -26rpx 是错误技术债(让风格按钮"压"在 current-selection 上),移除后是正确视觉层次 |
| 200rpx / 80rpx height 在不同字体大小下溢出 | 低 | 子元素都是 inline-flex 自然居中,scroll-x 模式下溢出会自动横向滚,垂直方向无溢出风险 |

### 待 Founder 验证

我无法亲自跑真机。预期 Founder 二次截图:
1. ✅ `.model-selector` 高度收紧到 ~430rpx(去掉 600rpx 异常空白)
2. ✅ 风格按钮和 .current-selection 之间是自然的 8rpx 间距(无空旷感)
3. ✅ 模型卡片仍可横向滚动,风格按钮(有用/有趣/有料)仍可横向滚动
4. ✅ 风格按钮组在容器内居中显示

---

## 历史:2026-04-27 23:30 UX Hotfix 方案 B(已上一轮完成)

### 本次任务

方案 A 真机验证失败(Founder 截图:输入框 + "点亮灵感"按钮仍完全不可见,空白延伸到 TabBar)。PM 重新诊断 root cause:`page { height: 100vh + overflow-y: auto }` 把页面高度锁死在一屏内,`.container/.content` flex 链中超出 viewport 的子元素被裁剪、page 不能滚动。这是历史遗留布局问题,Wave 1 加 complexity-selector 让超出量增大,问题彻底暴露。

### 官方文档调研产出

1. **[scroll-view 官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html)** 明确建议:
   > "若要使用下拉刷新,请使用页面的滚动,而不是 `scroll-view`,这样也能通过点击顶部状态栏回到页面顶部"
   > "使用竖向滚动时,需要给 scroll-view 一个固定高度,通过 WXSS 设置 height"
   → 不应改用 scroll-view 替代 page 滚动,而应让 page 滚动正常工作。
2. **[微信开放社区 - height: 100vh + padding 滚动问题](https://developers.weixin.qq.com/community/develop/doc/000e886114434024247b9a7735bc00)** 推荐:用 `min-height` 替代 `height` + `box-sizing: border-box`,让内容自然撑高页面。
3. **[微信开放社区 - 100vh 底部空白问题](https://developers.weixin.qq.com/community/develop/doc/0000ee43314db03403ca719815b000)** 社区共识:replace `height: 100vh` with `min-height: 100vh`。

### 改动清单(`pages/index/index.wxss` 唯一改动文件)

| # | 位置 | 改动 | 理由 |
|---|------|------|------|
| 1 | `page` (L9-12) | 删除 `height: 100vh` + `overflow-y: auto`,只保留 `min-height: 100vh`;同时去掉 `background: ... fixed` 的 `fixed` | 解锁 page 高度,内容超出自动撑高 + 由小程序原生页面滚动接管。`background: fixed` 在 Skyline 不完全支持且与可滚动页面易出怪相,且 `.container` 已有等价渐变 |
| 2 | `.content::after` (原 L37-46) | 完全删除 | 历史遗留死代码:`position: fixed; height: 100vh; z-index: -1` 但无 `background`/`content`,纯无视觉效果占位,删除无任何视觉差异 |
| 3 | `.container` (L28) | `padding-bottom: 120rpx → 160rpx` | TabBar 实际占用 = 100rpx height + 36rpx home indicator padding = 136rpx,旧 120rpx 实际还差 16rpx,新 160rpx 留 24rpx 安全边距 |

`.container { min-height: 100vh; flex-direction: column }` 和 `.content { flex: 1 }` **保留**(它们是"内容少时撑满 viewport"的正确姿势,与解锁 page 高度的 `min-height` 兼容)。

### 严格遵守 scope

- ✅ 只改 `pages/index/index.wxss`
- ✅ 未触碰 `pages/index/index.wxml` / `pages/index/index.js`
- ✅ 未触碰 `app.js` / `app.wxss` / 其他 pages / `sumai/`
- ✅ 未自行 commit(等 PM 统一 commit)

### 验证

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 passed**(零回归) |
| 主包尺寸 | 字节净变化:删 10 行 `.content::after` + 加 ~12 行注释 ≈ 持平 |
| 微信小程序合规 | ✅ 全部 rpx,无 px 新增,无 DOM API,无 npm |
| grep `100vh` | 仅剩 `page { min-height: 100vh }` + `.container { min-height: 100vh }` + `.input-box keyboard-active` 中的不相关使用,符合预期 |

### 待 Founder 真机验证

Stage 1 UX 阻塞问题(首屏看不到输入框 + 点亮灵感按钮 + 无法滚动到底)预期彻底解决。Founder 截图二次验证后才能最终确认。

---

## 上次更新记录

- 2026-04-27 23:30: UX Hotfix 方案 B 完成(布局架构层修复 — page 高度解锁 + 死代码清理 + TabBar 间距修正)
- 2026-04-27 21:12: UX Hotfix 方案 A 完成(首屏布局微调,后续真机验证失败)
- 2026-04-25 09:30: Wave 2 R3 R3-C 完成(complexity 透传 SSE)
- 2026-04-24 21:44: Wave 2 R2 W2-3 完成(hunyuan 残留清理 + 通义万相路由确认)
- 2026-04-24 Session 3: Wave 1 完成,PM 代写 progress
- 2026-04-24 Session 2: 初始化
