# 序话(xuhua-wx) 专属 Skills 中英文触发词映射

> 本文档定义序话项目的专属 Skill 中英文触发词，包括专业术语和大白话表达。
> 最后更新: 2026-04-24

---

## 快速查找表

| Skill | 专业中文 | 大白话中文 | English |
|-------|---------|-----------|---------|
| wechat-miniprogram | 微信小程序、主包 2MB、rpx、WXML、setData、onShow、分包 | 小程序、打包太大、字太大、界面错位、适配不了 | wechat miniprogram, rpx, WXML, setData, package size |
| streaming-sse | SSE 流式、enableChunkedTransfer、utf8Decode、打字机效果、生成状态机 | 流式卡、打字效果慢、真机乱码、停止按钮坏了 | SSE, streaming, chunked transfer, UTF-8 decode, typing effect |
| api-integration | apiRequest、duyueai.com、境内 LLM、code -1、登录失效、会员状态、跨设备 label | API 报错、登录不上、Pro 状态不对、收藏丢了 | API integration, endpoint, error code, auth, Pro status, label sync |
| prompt-engineering | prompt 优化、system prompt、多模型对比、中文深度、模型偏好 | prompt 写得不好、同一个问题不同 LLM 答得差、中文效果 | prompt engineering, system prompt, model-specific prompt |
| context-management | 上下文管理、渐进式披露、注意力预算、记忆层级 | Claude 忘了之前说的、对话太长、信息混乱 | context management, progressive disclosure, memory |

---

## 1. wechat-miniprogram.md

### 微信小程序开发约束 Skill

**核心职责**: 守住微信小程序技术边界，防止做出不能发布 / 不能适配的代码

### 触发词

| 类型 | 触发词 |
|------|--------|
| **专业中文** | 微信小程序、WXML、WXSS、rpx、主包 2MB、分包、setData、onLoad、onShow、wx.navigateTo、自定义 TabBar、project.config.json、安全区适配 |
| **大白话中文** | 打包太大、超过 2MB、字太大、屏幕错位、小屏手机看不全、切 tab 状态乱了、分享卡片模糊、iPhone X 底部被遮 |
| **English** | wechat miniprogram, rpx, WXML, setData, package size, tab bar, safe area, subpackage |

### 文件触发

修改以下文件时**必须**加载此 Skill：
- `pages/**`（任何 .wxml / .wxss / .js / .json）
- `components/**`
- `custom-tab-bar/**`
- `app.js` / `app.json` / `app.wxss`
- `project.config.json` / `project.private.config.json`

### 核心约束速记

```
主包 < 2 MB / 分包 < 2 MB / 总包 < 20 MB
样式用 rpx 不用 px
路由用 wx.navigateTo / switchTab
setData 批次不能太频繁
```

---

## 2. streaming-sse.md

### SSE 流式约束 Skill

**核心职责**: 守护"一句话 → 流式看到 prompt 被点亮"这条核心体验链路

### 触发词

| 类型 | 触发词 |
|------|--------|
| **专业中文** | SSE、流式、enableChunkedTransfer、utf8Decode、TextDecoder、onChunkReceived、打字机效果、生成状态机、isGenerating、isGenerationActive |
| **大白话中文** | 流式卡住、打字效果跳字、真机乱码、停止按钮没用、生成完又跳出来乱的、切 tab 状态错乱 |
| **English** | SSE, streaming, chunked transfer, UTF-8 decode, typing effect, generation state machine |

### 文件触发

修改以下文件时**必须**加载此 Skill：
- `pages/index/index.js`（尤其 generateContent / appendToBuffer / processBufferContent / finishGeneration / stopGeneration）
- `components/reference-input/reference-input.js`

### 核心约束速记

```
wx.request + enableChunkedTransfer + onChunkReceived
utf8Decode 必须有 fallback（真机 TextDecoder 可能缺失）
setData 批次化（3-5 字一批）
生成状态机不要新增 flag（已复杂）
abort() 通过 requestTask 引用
```

---

## 3. api-integration.md

### 远程 API 集成约束 Skill

**核心职责**: 守护前端与远程 duyueai.com 的契约层稳定 + 合规红线

### 触发词

| 类型 | 触发词 |
|------|--------|
| **专业中文** | apiRequest、duyueai.com、境内 LLM、code -1、登录失效、会员状态、5 分钟缓存、跨设备 label 同步、historyLabels、sessionLabels、contentLabels、降级存储、Unicode 解码 |
| **大白话中文** | API 报错、登录不上、Pro 状态不对、收藏丢了、换台手机标签没了、错误消息显示成乱码、刚付完钱还显示没 Pro |
| **English** | API integration, endpoint, error code -1, auth fail, Pro status, label sync, Unicode decode, graceful degrade |

### 文件触发

修改以下文件时**必须**加载此 Skill：
- `app.js`（apiRequest / doLogin / checkProStatus / addFavorite / removeFavorite / syncLabelToCloud）
- `config/cdn.js`
- `pages/login/login.js`（登录流程）
- `pages/profile/profile.js`（会员状态 UI）

### 核心约束速记

```
所有 API 走 apiRequest()，不要直接 wx.request
code 0 = 成功；-1 = 登录失效（自动跳 login）
base URL 固定 https://www.duyueai.com
禁止硬编码境外 LLM 端点（合规红线）
会员状态 5 分钟缓存（强制刷用 forceCheck=true）
错误 Unicode 消息必须 decode
收藏失败降级本地 local_favorites
跨设备 label 四层映射同步
```

---

## 4. prompt-engineering.md

### Prompt 工程 Skill

**核心职责**: 设计 system prompt、理解各境内 LLM 的 prompt 偏好、服务 Counter-Positioning 1 & 2

### 触发词

| 类型 | 触发词 |
|------|--------|
| **专业中文** | prompt 优化、system prompt、多模型对比、境内 LLM 偏好、中文深度、prompt 模板、prompt 库、Counter-Positioning、三档复杂度 |
| **大白话中文** | prompt 写得不好、同一个问题给豆包和千问答得差太多、中文理解不行、模板不够、复杂任务 prompt 太短、专业感不够 |
| **English** | prompt engineering, system prompt, model-specific prompt, Chinese optimization, prompt template |

### 触发场景

- Stage 1 设计三档复杂度（快速想法 / 深度创作 / 专业项目）的不同 system prompt
- 讨论"多模型对比"如何差异化推荐 prompt（千问 vs 豆包 vs 混元）
- Resonance 生成 marketing 示例（"一句话变小红书爆款"）
- 用户反馈"某类 prompt 质量不如预期"时诊断

### 核心约束速记

```
system prompt 按任务复杂度分档
中文修辞 / 本地算法偏好深度嵌入
多模型: 了解每家偏好（千问重结构化、豆包偏活泼、混元稳健等）
永远只在境内模型上优化（合规）
```

---

## 5. context-management.md

### 上下文管理 Skill

**核心职责**: 管理 Claude 的注意力预算，防止上下文退化

### 触发词

| 类型 | 触发词 |
|------|--------|
| **专业中文** | 上下文管理、渐进式披露、注意力预算、记忆层级、上下文退化、progressive disclosure |
| **大白话中文** | Claude 忘了、对话太长、信息混乱、开始重复了、之前的约束不记得了 |
| **English** | context management, progressive disclosure, attention budget, memory, context degradation |

### 场景触发

以下场景时**建议**加载此 Skill：
- 开始新的工作会话
- 感觉上下文变得混乱
- 任务复杂度增加
- 需要多个 agent 协作

### 核心约束速记

```
加载策略 → 按需加载，不要一次全部加载
关键信息 → 放开头或结尾（避免 Lost in the Middle）
退化信号 → 开始重复、忘记决策、混淆内容
```

---

## 组合触发场景

### 场景 1: Stage 1 三档复杂度入口开发

**触发词**: 任务复杂度、三档入口、Stage 1 定位实验

**需要加载**:
1. `wechat-miniprogram.md` - UI 改动约束
2. `prompt-engineering.md` - 专业档 system prompt 设计
3. 可能需要 `api-integration.md` - 如新加端点

### 场景 2: 真机 SSE 乱码 bug 诊断

**触发词**: 真机乱码、流式问题

**需要加载**:
1. `streaming-sse.md` - 核心诊断
2. `wechat-miniprogram.md` - 真机差异
3. 可能需要 `api-integration.md` - 确认错误码处理

### 场景 3: 新增境内 LLM（如千问 / Kimi）

**触发词**: 新增模型、接入千问、模型选择

**需要加载**:
1. `api-integration.md` - 新端点、合规检查
2. `prompt-engineering.md` - 模型 prompt 偏好
3. `wechat-miniprogram.md` - UI 层模型选择器

### 场景 4: Stage 1 发布到微信体验版

**触发词**: 发布、上传微信、体验版

**需要加载**:
1. `wechat-miniprogram.md` - 发布流程、主包检查
2. 可能需要手动回归清单

### 场景 5: 多 agent 协作复杂改动

**触发词**: 多 agent、重构、架构调整

**需要加载**:
1. `context-management.md` - 管理上下文
2. `xhteam` 或 `xhpipeline` 工作流
3. 相关业务 Skill

---

## 与其他 Skills 的关系

| 类型 | 来源 | 范围 | 加载方式 |
|------|------|------|---------|
| **序话专属** | 本地 `.claude/skills/*.md` | 项目专属 | 手动读取 |
| **工作流 xh*** | 本地 `.claude/skills/xh*/SKILL.md` | 项目专属 | 触发命令 `/xhxxx` |
| **Context Engineering** | 全局 Marketplace Plugin | 通用 | 触发词自动激活 |

**配合使用示例**:
- 真机 SSE bug → `streaming-sse.md`（专属）+ `context-degradation`（全局）
- 长对话质量下降 → `context-management.md`（专属）+ `context-compression`（全局）
- Stage 2 Project 容器设计 → `wechat-miniprogram.md` + `api-integration.md` + `multi-agent-patterns`（全局，讨论协作）

---

## 文件路径快速参考

```
.claude/skills/
├── wechat-miniprogram.md          # 序话专属 1 (本文件的第 1 条)
├── streaming-sse.md               # 序话专属 2
├── api-integration.md             # 序话专属 3
├── prompt-engineering.md          # 通用（从 xuhuastory 复制）
├── context-management.md          # 通用
├── XUHUA_SKILL_TRIGGERS.md        # 本文件
├── CONTEXT_ENGINEERING_TRIGGERS.md # Context Engineering 触发词
├── OFFICIAL_PLUGIN_TRIGGERS.md    # 官方 plugin 触发词
├── SKILL_INDEX.md                 # Skills 索引
└── xh*/SKILL.md                   # 8 个工作流 skill
```
