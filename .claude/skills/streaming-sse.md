# SSE 流式约束 (streaming-sse)

> 适用对象: Backend / Tester  
> 何时加载: 修改 `pages/index/index.js` 的 generateContent / appendToBuffer / processBufferContent 时必读  
> 最后更新: 2026-04-24

---

## 一、为什么 SSE 在序话如此关键

序话的**核心体验承诺**是"一句话 → 流式看到 prompt 被点亮"。这条链路不流畅的话：

- 用户看着屏幕空白 3 秒 → 开始怀疑"是不是卡了"
- 打字机效果跳跃 / 卡顿 → "这 AI 有点蠢"
- 乱码 / UTF-8 错误 → "不能用，卸载"

所以 SSE 流式**不能挂、不能乱、不能卡、不能慢**。这是一个技术难题，因为微信小程序的 `wx.request` 对 SSE 支持**不完美**，真机环境更是有坑。

---

## 二、wx.request + enableChunkedTransfer 架构

```javascript
const requestTask = wx.request({
  url: `${BASE_URL}/generate?openid=${openid}&prompt=${encodedPrompt}`,
  method: 'GET',
  header: { 'Accept': 'text/event-stream' },
  enableChunkedTransfer: true,    // 关键：开启分块传输
  enableChunked: true,             // 部分老版本的兼容字段
  responseType: 'text',            // 或 'arraybuffer'（真机更稳）
  success(res) { /* 全部数据接收完 */ },
  fail(err) { /* 错误处理 */ }
});

// 关键：监听 onChunkReceived 接收流式数据
requestTask.onChunkReceived(function(chunk) {
  // chunk.data 是 ArrayBuffer
  const text = utf8Decode(new Uint8Array(chunk.data));
  appendToBuffer(text);
});

// 关键：保留 requestTask 引用，用于用户点"停止"时 abort
this.currentRequestTask = requestTask;
```

**用户停止生成**:
```javascript
stopGeneration() {
  if (this.currentRequestTask) {
    this.currentRequestTask.abort();
    this.currentRequestTask = null;
  }
  this.setData({ isGenerating: false });
}
```

---

## 三、自定义 UTF-8 解码（真机坑）

### 问题
部分真机环境**没有 `TextDecoder` API**，直接 `new TextDecoder()` 会 crash。

### 解决（`pages/index/index.js:48-52`）

```javascript
function utf8Decode(uint8Array) {
  try {
    return new TextDecoder('utf-8').decode(uint8Array);
  } catch (e) {
    // Fallback: 适用于小数组
    return String.fromCharCode.apply(null, uint8Array);
  }
}
```

### 注意
- `String.fromCharCode.apply(null, bigArray)` 在数组超大时**会爆栈**
- **推荐**: 分段调用，每段 ≤ 8192 字节

```javascript
function utf8DecodeSafe(uint8Array) {
  try {
    return new TextDecoder('utf-8').decode(uint8Array);
  } catch (e) {
    const CHUNK = 8192;
    let result = '';
    for (let i = 0; i < uint8Array.length; i += CHUNK) {
      result += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK));
    }
    // 注意: 这只在 ASCII 安全，中文 UTF-8 多字节会错
    // 更稳妥的做法是用 encoding polyfill
    return result;
  }
}
```

**最稳方式**（未来重构方向）: 用 `text-encoding` polyfill 或接受真机有偶发性降级。

---

## 四、数据分帧与解析

### 后端返回格式（SSE 标准）

```
data: {"type":"start","sessionId":"abc123"}

data: {"type":"chunk","content":"让"}

data: {"type":"chunk","content":"我"}

data: {"type":"chunk","content":"为你"}

...

data: {"type":"end","label":"有用"}

```

每行 `data: {json}\n`（JSON），行与行之间空行 `\n\n`。

### 前端解析

```javascript
let buffer = '';  // 跨 chunk 累积

function appendToBuffer(text) {
  buffer += text;
  
  // 按 \n 切分，保留最后一个可能不完整的
  let lines = buffer.split('\n');
  buffer = lines.pop(); // 最后一段可能不完整，留到下次
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;               // 空行跳过
    if (!trimmed.startsWith('data:')) continue;
    
    const jsonStr = trimmed.slice(5).trim();
    if (!jsonStr) continue;
    
    try {
      const data = JSON.parse(jsonStr);
      handleStreamData(data);
    } catch (e) {
      console.warn('SSE parse error:', jsonStr, e);
    }
  }
}

function handleStreamData(data) {
  if (data.type === 'start') { /* 初始化状态 */ }
  if (data.type === 'chunk') { /* 追加到 content */ }
  if (data.type === 'end')   { /* 标记完成 */ }
  if (data.type === 'error') { /* 错误处理 */ }
}
```

---

## 五、打字机效果

### 错误做法：每个字符 setData

```javascript
// ❌ 每个 chunk 一次 setData → 真机卡爆
onChunk(char) {
  this.setData({ content: this.data.content + char });
}
```

### 正确做法：批量 setData + 动画

```javascript
// ✅ 缓冲一个 buffer，按动画帧刷新
let pendingText = '';
let typingTimer = null;

function queueTyping(newText) {
  pendingText += newText;
  if (!typingTimer) {
    typingTimer = setInterval(() => {
      if (!pendingText) {
        clearInterval(typingTimer);
        typingTimer = null;
        return;
      }
      // 每 50ms 吐 3-5 字
      const take = Math.min(5, pendingText.length);
      const next = pendingText.slice(0, take);
      pendingText = pendingText.slice(take);
      this.setData({ 
        content: this.data.content + next 
      });
    }, 50);
  }
}
```

**序话当前的实现在 `pages/index/index.js`**（generateContent 相关函数），维护了一套状态机来协调缓冲与显示。

---

## 六、生成状态机（复杂但必要）

序话当前有**多个状态标志**协调生成逻辑：

| 状态 | 含义 | 何时 true |
|------|------|----------|
| `isGenerating` | UI 层面显示"生成中"动画 | 用户点击生成到收到 end 信号 |
| `isGenerationActive` | 严格的业务生成状态 | 同上（冗余保障） |
| `isCompletelyTerminated` | 彻底终止（用户 abort） | 用户主动停止后 |
| `isTyping` | 打字效果进行中 | 有未吐完的 buffer |
| `showCursor` | 显示闪烁光标 | isTyping 期间 |
| `streamEndSignal` | 后端已发送 end 信号 | 收到 `data: {type:"end"}` |

**已知问题**（CLAUDE.md "已知代码问题" 提到）:
> 生成状态管理过度复杂（isGenerating / isGenerationActive / isCompletelyTerminated 并存）

**改动建议**（未来重构）:
- 合并为单一状态机: `state: 'idle' | 'generating' | 'typing' | 'terminated'`
- 但改动风险极高，需先有完整测试覆盖再动

**当前原则**: **修改生成逻辑前必须理解全部状态流**。改之前读 `generateContent` / `appendToBuffer` / `processBufferContent` / `finishGeneration` / `stopGeneration` 所有代码。

---

## 七、图生 prompt 的 SSE（`/describeImageStream`）

类似文生 prompt 的流式，但参数不同：
- 先上传图片到 `/upload-image` → 拿到 URL
- 再调 `/describeImageStream?imageUrl=...`
- 同样的 SSE 分帧解析

由 `components/reference-input/` 组件触发，`pages/index/index.js generateImageDescription` 接收。

---

## 八、错误处理

### 网络中断

```javascript
requestTask.onChunkReceived(/* ... */);

requestTask.onHeadersReceived((h) => {
  console.log('SSE headers:', h.statusCode);
  if (h.statusCode !== 200) {
    // 非 200 直接处理错误
    this.handleStreamError(`HTTP ${h.statusCode}`);
  }
});

// wx.request 的 fail 回调会在网络错误时触发
fail(err) {
  if (err.errMsg.includes('abort')) return; // 用户主动停止
  this.handleStreamError(err.errMsg);
}
```

### 超时

```javascript
// 设置超时（对流式接口适当延长）
timeout: 60000,  // 60 秒
```

### 中途报错

后端可能中途 push `data: {"type":"error","message":"..."}`。前端要：
- 停止累积
- 清空打字缓冲
- 展示错误 Toast
- 保留已生成的部分（用户可能仍有用）

---

## 九、测试清单

### 真机测试（@tester 必跑）

```
[ ] iPhone（含老款如 iPhone 8）SSE 流式正常
[ ] Android 中低端机型 SSE 正常
[ ] 微信 DevTools 模拟器 SSE 正常
[ ] 网络慢时（4G 弱信号）不崩
[ ] 用户中途停止 abort 正常
[ ] 生成完后立即发起第二次生成不冲突
[ ] 生成中切 tab 再切回来 UI 正常
```

### pytest 测试

- `test_architecture.py` 确保 utf8Decode 存在且有 fallback
- 后续可加 test_ep_001_sse_utf8_decode_fallback

---

## 十、相关文件

- 实现: `pages/index/index.js`（generateContent / appendToBuffer / processBufferContent / stopGeneration）
- 组件: `components/reference-input/reference-input.js`（图生 prompt 触发）
- 测试: `tests/test_architecture.py` / `tests/test_error_patterns.py`
- API 集成: `.claude/skills/api-integration.md`
- 微信小程序基础: `.claude/skills/wechat-miniprogram.md`
