# Skill Index - 序话 (xuhua-wx)

> 基于 **Agent-Skills-for-Context-Engineering** 的渐进式披露原则
> **按需加载，不要一次读完所有 skill**
> 最后更新: 2026-04-24

---

## 三类 Skills

### 1. 序话专属 Skills（本地 `.claude/skills/`）

| Skill | 触发场景 | 优先级 | 谁最常用 |
|-------|---------|--------|---------|
| [wechat-miniprogram](./wechat-miniprogram.md) | 修改 `pages/` / `components/` / `app.js` / `project.config.json` | 🔴 必读 | Frontend / Backend / DevOps |
| [streaming-sse](./streaming-sse.md) | 修改 `pages/index/index.js` 的生成 / SSE 流式逻辑 | 🔴 必读 | Backend / Tester |
| [api-integration](./api-integration.md) | 修改 `app.js` / 新增端点 / 错误处理 | 🔴 必读 | Backend / Tester |
| [prompt-engineering](./prompt-engineering.md) | 讨论 prompt 优化逻辑 / 设计 system prompt | 🟡 推荐 | Backend / PM / Resonance |
| [context-management](./context-management.md) | 工作流程管理 / 多 Agent 协作 | 🟡 推荐 | 所有角色 |

**中英文触发词对照**: [XUHUA_SKILL_TRIGGERS.md](./XUHUA_SKILL_TRIGGERS.md)

### 2. 工作流 Skills（xh* 系列，从 xuhuastory 移植）

| Skill | 用途 | 触发命令 |
|-------|------|---------|
| [xhteam](./xhteam/SKILL.md) | Agent Teams 全自动协作 | `/xhteam [任务]` |
| [xhpipeline](./xhpipeline/SKILL.md) | 半自主开发流水线（PM 编排） | `/xhpipeline [任务]` |
| [xhassign](./xhassign/SKILL.md) | 单 agent 任务分配 | `/xhassign [角色] [任务]` |
| [xhaudit](./xhaudit/SKILL.md) | PM 独立审查 | `/xhaudit [目标]` |
| [xhdispatch](./xhdispatch/SKILL.md) | PM 记录+派发 | `/xhdispatch [任务]` |
| [xhsync](./xhsync/SKILL.md) | Coordinator 全局同步 | `/xhsync` |
| [xhtdd](./xhtdd/SKILL.md) | 测试驱动开发 | `/xhtdd [功能]` |
| [xhwrap](./xhwrap/SKILL.md) | 收尾文档检查 | `/xhwrap` |

### 3. Context Engineering Skills（全局已安装 plugin）

| Plugin | 包含 Skills | 触发场景 |
|--------|-----------|---------|
| context-engineering-fundamentals | context-fundamentals, context-degradation, context-compression, context-optimization | 上下文问题 |
| agent-architecture | multi-agent-patterns, memory-systems, tool-design | 多 Agent / 记忆 / 工具 |
| agent-evaluation | evaluation, advanced-evaluation | 评估 Agent 质量 |
| agent-development | project-development | AI 项目开发 |
| cognitive-architecture | bdi-mental-states | 认知架构 / 决策 |

**中英文触发词对照**: [CONTEXT_ENGINEERING_TRIGGERS.md](./CONTEXT_ENGINEERING_TRIGGERS.md)

### 4. Claude Official Plugins（按需安装）

| Plugin | Scope | Skills / 命令 |
|--------|-------|-------------|
| commit-commands | user | `/commit`, `/commit-push-pr`, `/clean_gone` |
| code-review | user | `/code-review` |
| feature-dev | user | `/feature-dev` |
| frontend-design | project | `/frontend-design` |
| （未来按需加）| | |

**中英文触发词对照**: [OFFICIAL_PLUGIN_TRIGGERS.md](./OFFICIAL_PLUGIN_TRIGGERS.md)

---

## Skill Activation Rules（文件 / 关键词触发）

### wechat-miniprogram.md

**触发词**: 微信小程序、rpx、主包 2MB、分包、WXML、setData、onShow、tabBar

**触发文件**:
- `pages/**`
- `components/**`
- `app.js` / `app.json` / `app.wxss`
- `project.config.json`
- `custom-tab-bar/**`

**核心要点**: 主包 2 MB、无 npm、无 TS、rpx 适配

---

### streaming-sse.md

**触发词**: SSE、流式、enableChunkedTransfer、utf8Decode、打字机效果、生成状态机、真机乱码

**触发文件**:
- `pages/index/index.js`（generateContent / appendToBuffer / processBufferContent / stopGeneration）
- `components/reference-input/reference-input.js`（图生 prompt 触发 SSE）

**核心要点**: wx.request + enableChunkedTransfer + 自定义 utf8Decode + 状态机一致

---

### api-integration.md

**触发词**: apiRequest、duyueai.com、境内 LLM、code -1、登录失效、会员状态、跨设备 label 同步

**触发文件**:
- `app.js`（apiRequest / doLogin / checkProStatus / favorite / labelSync）
- `config/cdn.js`

**核心要点**: 统一错误处理、合规红线（无境外 LLM 端点）、5 分钟会员缓存

---

### prompt-engineering.md

**触发词**: prompt 优化、system prompt、多模型对比、中文深度、Counter-Positioning

**触发场景**:
- 讨论 Stage 1 "专业项目"档 system prompt
- 讨论多模型差异化推荐
- Resonance 生成 marketing 示例 prompt

**核心要点**: 境内模型（千问/豆包/混元/Kimi 等）prompt 偏好，中文深度优化

---

### context-management.md

**触发场景**:
- 新会话开始
- 多 agent 协作
- 上下文混乱时

**核心要点**: 渐进式披露，按需加载

---

## Loading Strategy

```
任务复杂度 → 加载深度

Simple (bug fix):
  └── 只读对应 agent 定义

Medium (new feature):
  └── agent 定义 + 相关 skill 摘要

Complex (architectural change):
  └── agent 定义 + 相关 skill 完整内容 + CLAUDE.md
```

---

## Integration with .team-brain

Skills 提供**约束和方法论**，.team-brain 提供**状态和协作**:

```
.claude/skills/                  # 怎么做（约束、规范）
  ├── wechat-miniprogram.md
  ├── streaming-sse.md
  ├── api-integration.md
  ├── prompt-engineering.md
  ├── context-management.md
  └── xh*/SKILL.md               # 工作流

.team-brain/                     # 做什么（状态、任务）
  ├── status/                    # 当前状态 + HARNESS_HEALTH
  ├── handoffs/                  # 交接任务
  ├── decisions/                 # 决策记录
  └── knowledge/                 # 积累的经验（ERROR_PATTERNS 等）
```

---

## For Each Agent

| Agent | 必读 Skills | 选读 Skills |
|-------|------------|-----------|
| **coordinator** | CLAUDE.md（战略层）| 所有（按需） |
| **pm** | context-management | prompt-engineering（审 Stage 1 定位时） |
| **backend** | api-integration, streaming-sse, wechat-miniprogram | prompt-engineering |
| **frontend** | wechat-miniprogram | context-management |
| **tester** | api-integration, streaming-sse, wechat-miniprogram（知道要测什么）| context-management |
| **devops** | wechat-miniprogram（主包尺寸 / 发布约束）| context-management |
| **resonance** | prompt-engineering（生成营销示例时）| context-management |

---

## 典型组合加载场景

### 场景 1: Stage 1 三档复杂度入口改动

- `wechat-miniprogram.md`（UI 改动）
- `prompt-engineering.md`（专业档 system prompt 设计）

### 场景 2: SSE 真机乱码 bug

- `streaming-sse.md`（核心诊断）
- `api-integration.md`（是否是错误码处理异常）
- `wechat-miniprogram.md`（真机差异）

### 场景 3: 新增境内 LLM（如千问）

- `api-integration.md`（新端点、合规检查）
- `prompt-engineering.md`（模型 prompt 偏好）

### 场景 4: 发布 Stage 1 到微信体验版

- `wechat-miniprogram.md`（发布流程、主包 2MB 检查）

---

## 与 Context Engineering Skills 的关系

| 类型 | 来源 | 范围 | 加载方式 |
|------|------|------|---------|
| **序话 Skills** | 本地 `.claude/skills/` | 项目专属 | 手动读取文件 |
| **工作流 xh* Skills** | 本地 `.claude/skills/xh*/` | 项目专属（从 xuhuastory 移植改名）| 触发命令 `/xhxxx` |
| **Context Engineering Skills** | 全局 Marketplace Plugin | 所有项目通用 | 触发词自动激活 |

---

## 文件路径快速参考

```
.claude/skills/
├── wechat-miniprogram.md         # 序话专属 1
├── streaming-sse.md              # 序话专属 2
├── api-integration.md            # 序话专属 3
├── prompt-engineering.md         # 通用（从 xuhuastory 复制）
├── context-management.md         # 通用
├── XUHUA_SKILL_TRIGGERS.md       # 中英文触发词（本 index 的补充）
├── CONTEXT_ENGINEERING_TRIGGERS.md
├── OFFICIAL_PLUGIN_TRIGGERS.md
├── SKILL_INDEX.md                # 本文件
└── xh*/SKILL.md                  # 8 个工作流
```

---

## 添加新 Skill 的流程

1. 评估是否真的需要新 skill（避免过度拆分）
2. 在 `.claude/skills/` 下创建新 `.md` 文件
3. 更新本文件（SKILL_INDEX.md）
4. 更新 XUHUA_SKILL_TRIGGERS.md 加入触发词
5. 如果对应某个 Agent，在该 Agent 角色文件的"Skills"section 中引用
6. 通知 @pm 记录到 DECISIONS.md
