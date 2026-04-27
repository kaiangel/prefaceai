# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-27 23:30 UX Hotfix 方案 B(深度修复)
> 角色: frontend

---

## 当前状态

✅ **2026-04-27 23:30 UX Hotfix 方案 B 完成**(布局架构层修复 — page 高度解锁)

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
