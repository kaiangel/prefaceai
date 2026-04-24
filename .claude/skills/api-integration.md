# 远程 API 集成约束 (api-integration)

> 适用对象: Backend / Tester  
> 何时加载: 修改 `app.js` 的 apiRequest / 新增端点 / 改错误处理时必读  
> 最后更新: 2026-04-24

---

## 一、后端架构前提（红线认知）

```
微信小程序 (xuhua-wx)
     │ HTTPS + 可能 WSS
     ▼
┌─────────────────────────────────────┐
│  远程后端: https://www.duyueai.com  │  ← 不在本仓库
│  - 16 个境内 LLM 封装               │
│  - 用户系统 / 支付 / 收藏            │
│  - SSE 流式 prompt 生成              │
│  - 跨设备 label 同步                 │
└─────────────────────────────────────┘
```

**关键认知**：
1. 序话前端**不写后端代码** — 所有后端逻辑在远程 duyueai.com
2. 前端只做**API 集成层** — 调用、错误处理、状态缓存
3. 新增端点 / 修改契约 **必须通过 Founder 联络 Co-founder**（他管远程架构）
4. **禁止硬编码境外 LLM 端点**（合规红线，`test_architecture.py` 强制）

---

## 二、apiRequest() 统一封装（`app.js:29-122`）

### 用法

```javascript
const app = getApp();

app.apiRequest({
  url: '/userinfo',            // 不带 BASE_URL 前缀
  method: 'POST',
  data: { openid }
}).then(res => {
  // res 是后端返回的 data 部分
  // code 已经被处理（0 = 成功才 resolve）
}).catch(err => {
  // 非 0 会 reject
  // 登录失效（code -1）已自动跳 login，不会走到这里
});
```

### 内部逻辑

```javascript
apiRequest({url, method, data}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      success(res) {
        const { code, data, message } = res.data;
        
        if (code === 0) {
          resolve(data);
        } else if (code === -1) {
          // 登录失效
          clearLocalAuth();
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('登录失效'));
        } else {
          // 其他错误
          wx.showToast({ 
            title: decodeUnicode(message), 
            icon: 'none' 
          });
          reject(new Error(message));
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
}
```

### 必须保持的特性

| 特性 | 为什么 |
|------|-------|
| 错误码统一处理 | 前端各处不重复写 |
| `code === -1` 自动跳 login | 不需要每个调用方判断 |
| Unicode 消息解码 | 后端返回的中文错误消息是 \uXXXX 格式 |
| Toast 统一 | 用户体验一致 |
| 数据库锁等错误重试（指数退避） | 后端高并发 |

---

## 三、API 端点清单（duyueai.com）

### 认证与用户

| 端点 | 方法 | 用途 | 返回 |
|------|------|------|------|
| `/code2session` | POST `{code}` | 微信登录 code 换 openid | `{openid, sessionKey}` |
| `/userinfo` | POST `{openid}` | 获取用户信息 | `{is_pro, remaining_count, ...}` |

### Prompt 生成

| 端点 | 方法 | 用途 | 返回 |
|------|------|------|------|
| `/generate*` | GET SSE | 文生 / 图生 / 视频生 prompt 流式 | SSE 流 `data: {...}` |
| `/describeImageStream` | GET SSE | 图生 prompt（从参考图）| 同上 |

### 收藏与历史

| 端点 | 方法 | 用途 |
|------|------|------|
| `/favorite` | POST | 收藏 prompt |
| `/unfavorite` | POST | 取消收藏 |
| `/history/list` | GET | 历史记录列表（分页）|

### 跨设备同步

| 端点 | 方法 | 用途 |
|------|------|------|
| `/labelSync` | POST | 上传 label 映射 |
| `/labelSync` | GET | 下载 label 映射 |

### 资源

| 端点 | 方法 | 用途 |
|------|------|------|
| `/upload-image` | POST multipart | 参考图上传 |

### 未实现（待 Co-founder 对接）

| 端点 | 方法 | 预期用途 |
|------|------|---------|
| `/api/shared/{id}` | GET | 分享落地页获取内容 |
| `/api/share` | POST | 生成分享 ID |

---

## 四、境内 LLM 模型清单（合规红线）

序话**禁止硬编码境外 LLM 端点**（`test_no_forbidden_overseas_llm_endpoints`）。所有模型调用走远程 duyueai.com 由后端封装成境内 LLM：

### 文本生成（当前 3 个）

- **通用模型** (`non-reasoning`) - 适合日常文字创作
- **推理模型** (`reasoning`) - 擅长多步骤逻辑推断
- **AI Agent** (`ai-agent`) - 执行多步骤复杂任务

### 图像生成（当前 5 个）

- **GPT Image**（境内代理?）/ **FLUX** / **即梦 AI** / **Lovart** / **Midjourney**

### 视频生成（当前 7 个）

- 可灵 / 即梦 Video / Lovart Video / Runway / 万相 / Sora2 / 混元

### 未来扩展（Counter-Positioning 1 多模型对比）

建议加入境内主流:
- **千问**（阿里云）
- **豆包**（字节）
- **混元**（腾讯）
- **Kimi**（月之暗面）
- **智谱 ChatGLM**
- **MiniMax**
- **小米 MiMo**

**新增模型的流程**:
1. 通过 Founder 联络 Co-founder，在远程 duyueai.com 完成后端集成
2. 前端 `pages/index/index.js` 的模型列表添加对应项
3. UI 模型选择器测试
4. `test_architecture.py` 确保新端点不是境外地址
5. @tester 手动测试

---

## 五、错误处理标准

### code 约定（后端 + 前端）

| code | 含义 | 前端行为 |
|------|------|---------|
| 0 | 成功 | resolve(data) |
| -1 | 登录失效 | 清本地 token → 跳 login（apiRequest 自动）|
| 100x | 参数错误 | Toast 提示具体错误 |
| 200x | 权限错误（非 Pro）| Toast → 跳 profile 页 |
| 300x | Rate limit | Toast "操作太频繁，请稍后" |
| 400x | 服务端错误 | Toast "服务异常，请稍后再试" |
| 500x | 上游 LLM 错误 | Toast "AI 繁忙，请稍后" |

### Toast 消息样式

```javascript
wx.showToast({
  title: decodedMessage,   // 必须 decodeUnicode
  icon: 'none',            // 'success' / 'error' / 'none'
  duration: 2000
});
```

**不要用 `wx.showModal`** 作为普通错误提示（太打扰）。modal 仅用于**需要用户确认**的场景（如删除、退出）。

---

## 六、globalData 状态管理

### 核心字段（`app.js:145-174`）

```javascript
globalData: {
  // 认证
  userInfo: null,
  isLoggedIn: false,
  openid: null,
  
  // 会员（5 分钟缓存）
  isPro: false,
  remainingCount: 0,
  lastCheckTime: 0,
  
  // 生成状态（跨页面）
  lastGeneratedContent: null,
  lastGeneratedTimestamp: 0,
  lastGeneratedLabel: null,
  pendingGenerationId: null,
  isGenerationPending: false,
  
  // 跨设备标签映射
  favoriteMap: new Map(),
  historyLabels: {},
  sessionLabels: {},
  historySessionMapping: {},
  contentLabels: {}
}
```

### 访问方式

```javascript
// 在任何 Page / Component
const app = getApp();
console.log(app.globalData.openid);

// 更新
app.globalData.isPro = true;
```

**注意**: globalData 是**运行时内存**，小程序重启就丢。持久化用 `wx.setStorageSync`。

---

## 七、Pro 会员状态缓存（5 分钟）

```javascript
// app.js:541-592
async checkProStatus(forceCheck = false) {
  const now = Date.now();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟
  
  if (!forceCheck && (now - this.globalData.lastCheckTime < CACHE_DURATION)) {
    return { 
      is_pro: this.globalData.isPro, 
      remaining_count: this.globalData.remainingCount 
    };
  }
  
  const res = await this.apiRequest({ url: '/userinfo', method: 'POST', data: { openid } });
  this.globalData.isPro = res.is_pro;
  this.globalData.remainingCount = res.remaining_count;
  this.globalData.lastCheckTime = now;
  return res;
}
```

**用法**:
- 首页 onShow: `app.checkProStatus()`（用缓存）
- 用户点击"支付成功"后: `app.checkProStatus(true)`（强制刷新）

---

## 八、登录流程

```
用户点"登录"
     ↓
wx.login() → 获得 code
     ↓
POST /code2session { code }
     ↓
返回 { openid, sessionKey }
     ↓
wx.setStorageSync('token', openid)
app.globalData.openid = openid
app.globalData.isLoggedIn = true
     ↓
app.checkProStatus(true)  // 立即取会员状态
     ↓
wx.reLaunch({ url: '/pages/index/index' })
```

### 登录失效

- 任意 API 返回 code -1
- `apiRequest()` 自动:
  - `wx.removeStorageSync('token')`
  - `app.globalData.openid = null`
  - `app.globalData.isLoggedIn = false`
  - `wx.reLaunch({ url: '/pages/login/login' })`

---

## 九、收藏 / 降级策略

```javascript
// app.js:693-883
async addFavorite(promptId) {
  try {
    await this.apiRequest({ url: '/favorite', method: 'POST', data: { promptId } });
    this.globalData.favoriteMap.set(promptId, Date.now());
    return true;
  } catch (err) {
    // 降级：存本地
    const local = wx.getStorageSync('local_favorites') || [];
    local.push({ promptId, time: Date.now() });
    wx.setStorageSync('local_favorites', local);
    return true;  // 仍返回成功，用户体验连贯
  }
}
```

**原则**: 不让网络错误打断用户操作，能本地降级就降级。

---

## 十、跨设备标签同步（`app.js:208-416`）

```javascript
// 用户在手机生成了 "有用" label 的 prompt A
// 用户切换到 iPad 小程序打开历史
// iPad 需要看到 prompt A 的 label 仍然是 "有用"

// 实现:
historyLabels = { "historyId_A": "有用" }
sessionLabels = { "sessionId_X": "有用" }
historySessionMapping = { "historyId_A": "sessionId_X" }
contentLabels = { 
  "md5(content_of_A)": { label: "有用", sessionId: "X", content: "..." } 
}

// 三层映射 = 三种路径反查
// 云同步通过 /labelSync，失败降级本地存储
```

**修改时注意**: 四个 map 必须同步更新，不能只改一个。

---

## 十一、修改 API 集成的流程

```
1. 先完整读 app.js 要改的函数（至少前后 50 行）
2. 在微信 DevTools 里跑原有流程，记录当前行为
3. 写代码
4. 在微信 DevTools 里手动测试:
   - 正常流程
   - 错误流程（断网）
   - 登录失效流程
5. 跑 pytest tests/test_architecture.py
6. 如新增端点，更新本文档"API 端点清单"
7. 通知 @tester 加手动测试
8. 如 API 契约变更（新参数 / 新返回字段）→ 联络 Co-founder 确认远程
```

---

## 十二、常见坑

| 问题 | 原因 | 解决 |
|------|------|------|
| Unicode 转义消息显示成 `中文` | 没 decodeUnicode | apiRequest 已处理；别的地方也要手动 decode |
| 登录失效 Toast 重复弹 | 多处调用 apiRequest | code -1 只能触发一次跳转（加 debounce）|
| 会员状态延迟 | 5 分钟缓存未刷 | 支付成功后 `checkProStatus(true)` |
| 收藏成功但列表不更新 | 只改了服务端 | 同步更新 `globalData.favoriteMap` |
| 跨设备 label 丢失 | 只存本地 | 走 `/labelSync` 云同步 |
| 上传参考图超时 | multipart 格式问题 | wx.uploadFile（不是 wx.request）|
| 硬编码境外 LLM 端点 | 误用 | test_architecture 拦截 |

---

## 十三、相关文件

- 实现: `app.js`（apiRequest / doLogin / checkProStatus / addFavorite / labelSync）
- 配置: `config/cdn.js`（CDN 路径）
- SSE 流式: `.claude/skills/streaming-sse.md`
- 微信小程序: `.claude/skills/wechat-miniprogram.md`
- 测试: `tests/test_architecture.py::test_api_base_url_consistency`、`test_no_forbidden_overseas_llm_endpoints`
