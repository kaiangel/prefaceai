# 微信小程序开发约束 (wechat-miniprogram)

> 适用对象: Frontend / Backend / Tester / DevOps  
> 何时加载: 修改 `pages/` / `components/` / `app.js` / `project.config.json` 前必读  
> 最后更新: 2026-04-24

---

## 一、三大核心约束

### 1. 尺寸上限（硬红线）

| 包 | 上限 | 违反后果 |
|---|---|---|
| **主包** | **2 MB** | 审核被拒 / 无法发布 |
| **单分包** | **2 MB** | 同上 |
| **所有分包累计** | **20 MB** | 同上 |

**当前序话主包约 800 KB**（2026-04-24 估计）。

**减包策略**:
- 图片资源走 CDN（`config/cdn.js` 定义的 https://cdn.duyueai.com/prompt/）**不进小程序包**
- 大图 / 模型 Logo 走 CDN
- 字体文件（中文字体特别大）尽量用系统字体
- 非首屏页面考虑分包（如 settings / feedback / about）
- `.team-brain/` / `.claude/` / `tests/` / `scripts/` / `docs/` **不进小程序包**（微信 DevTools 自动识别）

**检查方法**:
```
微信 DevTools → 详情 → 基本信息 → 代码包大小
```

### 2. 环境与能力限制

| 不能用 | 替代 |
|--------|------|
| `window` / `document` / DOM API | `wx.*` 系列 API |
| `fetch` / `XMLHttpRequest` | `wx.request` |
| `localStorage` | `wx.setStorageSync / getStorageSync` |
| `console.log`（部分高级功能）| `console.log` 基础可用，但不保证都有 |
| `eval` / `new Function` | 禁止（小程序安全沙箱） |
| `<script>` 标签 | WXML 不支持 |
| React / Vue 等框架 | 微信原生 WXML + setData |
| npm 包（大多数） | 只有 `miniprogram_npm` 支持，序话**完全不用** |
| TypeScript | 小程序 TS 支持有限，序话**完全不用** |
| ESLint 规则 | `.eslintrc.js` 规则为空（Founder 决定） |

### 3. 样式单位与屏幕适配

- **样式单位必须用 rpx**，不是 px
- 设计稿 750 宽 = 750 rpx
- rpx 自动按设备屏幕宽度缩放
- px 在小屏手机会太大，在大屏会太小

```wxss
/* ❌ 错误 */
.card { width: 300px; padding: 20px; }

/* ✅ 正确 */
.card { width: 600rpx; padding: 40rpx; }
```

---

## 二、生命周期

### 页面生命周期

```javascript
Page({
  data: { ... },
  onLoad(options) { 
    // 页面加载,options 是路由参数
    // 用于初始化数据、发 API 请求
  },
  onShow() {
    // 每次显示（含从后台切回）都会触发
    // 用于刷新可能变化的数据（如会员状态）
  },
  onReady() {
    // 首次渲染完成
    // 用于需要等 DOM 就绪的操作
  },
  onHide() {
    // 切到后台
    // 用于停止定时器 / 取消轮询
  },
  onUnload() {
    // 页面销毁（navigateBack 或 redirectTo）
    // 用于清理资源
  },
  onPullDownRefresh() { /* 下拉刷新 */ },
  onReachBottom() { /* 触底加载 */ },
  onShareAppMessage() { /* 分享给朋友 */ },
  onShareTimeline() { /* 分享到朋友圈 */ }
})
```

### App 生命周期

```javascript
App({
  globalData: {}, // 全局共享数据
  onLaunch() {
    // 小程序启动（冷启动）
  },
  onShow(options) {
    // 小程序显示（含冷启动 + 热启动）
  },
  onHide() {
    // 小程序切到后台
  },
  onError(msg) {
    // 错误上报
  }
})
```

### Component 生命周期

```javascript
Component({
  properties: { /* 外部传入 */ },
  data: { /* 内部 */ },
  lifetimes: {
    attached() { /* 组件被附加到页面 */ },
    detached() { /* 组件被移除 */ }
  },
  methods: { /* 自定义方法 */ }
})
```

---

## 三、路由

```javascript
// tab 页面
wx.switchTab({ url: '/pages/index/index' });

// 普通页面（保留当前页面）
wx.navigateTo({ url: '/pages/settings/settings' });

// 重定向（关闭当前页）
wx.redirectTo({ url: '/pages/login/login' });

// 重新启动（关闭所有页面）
wx.reLaunch({ url: '/pages/index/index' });

// 返回
wx.navigateBack({ delta: 1 });
```

---

## 四、setData 性能原则

```javascript
// ❌ 错误：频繁 setData 整个对象
this.setData({ result: this.data.result + newChar });

// ✅ 正确：路径写法，只更新变化的部分
this.setData({ 'result.content': newValue });

// ✅ 正确：批量合并后再 setData
let updates = {};
updates[`list[${index}].status`] = 'done';
updates[`list[${index}].time`] = Date.now();
this.setData(updates);
```

**序话流式打字效果的坑**: 每个字符一次 setData 会卡顿，应该**按批次 setData（3-5 字一批）**。

---

## 五、scroll-view 和长列表

```xml
<!-- 长列表必须用 scroll-view，不要用 view + overflow -->
<scroll-view scroll-y="true" style="height: 100vh">
  <block wx:for="{{items}}" wx:key="id">
    <view>{{item.title}}</view>
  </block>
</scroll-view>
```

**WXML 循环必须带 `wx:key`**，否则触发大量重渲染。

---

## 六、条件渲染

```xml
<!-- 单条件：wx:if -->
<view wx:if="{{loggedIn}}">已登录</view>
<view wx:else>未登录</view>

<!-- 多条件：block 包裹 -->
<block wx:if="{{type === 'a'}}">A</block>
<block wx:elif="{{type === 'b'}}">B</block>
<block wx:else>C</block>

<!-- hidden 属性（快速切换显示但保留 DOM）-->
<view hidden="{{!showPanel}}">...</view>
```

**`wx:if` vs `hidden` 选择**：
- `wx:if`: 销毁 / 重建 DOM，适合切换频率低的场景
- `hidden`: 保留 DOM 只切显示，适合频繁切换

---

## 七、分享能力

### 分享给朋友（单个用户或群）

```javascript
onShareAppMessage(res) {
  return {
    title: '序话 - 让好 prompt 的价值被看见',
    path: `/pages/shared/shared?id=${this.data.shareId}`,
    imageUrl: 'https://cdn.duyueai.com/prompt/share-cover.jpg'
  };
}
```

### 分享到朋友圈

```javascript
onShareTimeline() {
  return {
    title: '...',
    query: `id=${this.data.shareId}`,
    imageUrl: '...'
  };
}
```

**注意**:
- 朋友圈分享需要**在 app.json 的 window 配置或 page.json 中声明**
- 分享图尺寸推荐 5:4，500 × 400 以上分辨率（模糊严重影响口碑）

---

## 八、自定义 TabBar

序话使用 **custom-tab-bar**（不是系统 TabBar），位置: `custom-tab-bar/`。

优势: 完全可定制（主色 `#43B692` / 自定义动效 / 特殊按钮）
代价: 每个 tab 页面切换时需手动 `setSelectedIndex`

```javascript
// 每个 tab 页面 onShow 时:
onShow() {
  if (typeof this.getTabBar === 'function' && this.getTabBar()) {
    this.getTabBar().setData({ selected: 0 }); // 对应 tab 下标
  }
}
```

---

## 九、安全区适配（iPhone 刘海 / 底部横条）

```wxss
.bottom-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.top-safe {
  padding-top: env(safe-area-inset-top);
}
```

或通过 JS 读取:
```javascript
const { safeArea, statusBarHeight } = wx.getSystemInfoSync();
```

---

## 十、project.config.json 关键字段

```json
{
  "appid": "wx748c6d66700c159a",
  "projectname": "序话",
  "setting": {
    "urlCheck": true,     // 审核域名是否白名单
    "es6": true,          // ES6 转 ES5
    "minified": true,     // 代码压缩
    "packOptions": { "ignore": [...] }  // 不打包的文件
  }
}
```

**序话 packOptions.ignore 应该至少包含**:
```json
"ignore": [
  {"type": "folder", "value": ".team-brain"},
  {"type": "folder", "value": ".claude"},
  {"type": "folder", "value": "tests"},
  {"type": "folder", "value": "scripts"},
  {"type": "folder", "value": "docs"},
  {"type": "file", "value": "CLAUDE.md"}
]
```

这样才能确保辅助开发文件**不会被打包进小程序**。

---

## 十一、发布流程

```
开发版（扫码预览，团队内）
    ↓
体验版（给更多人扫码测试）
    ↓
提交审核（微信官方审核 3-7 天）
    ↓
发布正式版（用户自动更新）
```

### 发布前必做

- [ ] 主包尺寸 < 2 MB（DevTools 检查）
- [ ] `pytest tests/` 全绿
- [ ] @tester 5 关键流程手动回归通过
- [ ] `project.config.json` 版本号已 bump
- [ ] 清理 console.log / debug 代码

---

## 十二、常见坑速查

| 症状 | 原因 | 解决 |
|------|------|------|
| `wx:key` 报 warning | 循环渲染没加 key | 每个 `wx:for` 加 `wx:key` |
| 切 tab 后状态错乱 | 未在 onShow 更新 | 加 onShow 里 refresh 数据 |
| 分享卡片模糊 | imageUrl 图片太小 | CDN 高清图 500+ 宽 |
| 键盘弹起遮挡输入 | textarea 未处理 | 监听 bindfocus，调整 padding |
| setData 卡顿 | 频繁整对象 setData | 用路径写法 / 批次合并 |
| tabBar 选中状态错 | 未用自定义 TabBar | setSelectedIndex |
| iPhone X 底部按钮被遮 | 未做安全区适配 | `env(safe-area-inset-bottom)` |
| 主包超限 | 图片 / 字体进包 | 走 CDN / 分包 |

---

## 相关文件

- 全局约束: `CLAUDE.md`
- API 集成: `.claude/skills/api-integration.md`
- SSE 流式: `.claude/skills/streaming-sse.md`
- 微信官方文档: https://developers.weixin.qq.com/miniprogram/dev/framework/
