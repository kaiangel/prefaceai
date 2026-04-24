# 序话(xuhua-wx)团队协作协议

## 团队成员

| Agent | 角色 | 职责范围 | 角色定义文件 |
|-------|------|---------|------------|
| coordinator | 统筹者 | 产品愿景、架构决策、团队管理、Founder 视角 | `.claude/agents/coordinator.md` |
| pm | 产品经理 | 需求分析、优先级、协调、验收、文档所有权 | `.claude/agents/pm.md` |
| backend | 后端 | API 集成层(app.js)、apiRequest 封装、错误处理、CDN 配置 | `.claude/agents/backend.md` |
| frontend | 前端 | 微信小程序 WXML/WXSS/JS、页面、组件、样式 | `.claude/agents/frontend.md` |
| tester | 测试 | 架构测试、质量门、回归防护、test_error_patterns 积累 | `.claude/agents/tester.md` |
| devops | 运维 | 微信 DevTools 构建、版本管理、发布流程、CI/CD | `.claude/agents/devops.md` |
| resonance | 市场共鸣官 | 增长策略、内容营销、平台运营、品牌传播（独立运营） | `.claude/agents/resonance.md` |

> **注意**: 序话不设 ai-ml 角色。AI 能力通过远程 API `https://www.duyueai.com` 提供，由 backend 角色负责集成层。

---

## 产品定位

序话是 **AI Prompt 优化工具**。

核心愿景: **"好 prompt 本身有价值，让这个价值体现出来"**

- 用户输入粗略想法/需求，序话将其"点亮"为专业级 AI Prompt
- 支持文本、图像、视频三大类 AI 模型的 prompt 优化
- 用户画像: 想用 AI 但不知道怎么写 prompt 的普通用户
- 核心体验: 输入一句话 → 获得专业级 prompt → 直接用于 AI 生成

**平台**: 微信小程序（JavaScript/WXML/WXSS，无 npm/无 TypeScript/无构建工具）
**后端**: 远程 API `https://www.duyueai.com`（不在本仓库内，不修改）

---

## 核心协议

### 0. 子代理模型规则（Founder 强制要求）

```
🚨 全团队强制执行：
- 禁止使用 Haiku 模型（包括子代理/subagent）
- 子代理最低使用 Sonnet 4.6（model: "sonnet"）
- 深度推理/产品设计类任务用 Opus 4.6
- 执行类任务（写配置/文档/脚本）用 Sonnet 4.6（Opus 贵 5 倍，按需使用）
```

使用 Task 工具时:
- **不指定 model 参数**（默认继承当前会话模型）— 推荐
- 或指定 `model: "sonnet"` — 仅用于确实轻量的任务
- **绝对不可以** 指定 `model: "haiku"`

### 1. 每次开始工作前必读

```
必读文件 (按顺序):
1. .team-brain/status/TODAY_FOCUS.md       # 今日重点（最紧急）
2. .team-brain/handoffs/PENDING.md         # 待处理的交接
3. .team-brain/status/PROJECT_STATUS.md    # 项目当前状态
4. CLAUDE.md                               # 项目核心约束
```

### 2. 每次完成工作后必更新

```
必更新文件（按并行任务协议执行）:

【所有Agent必须更新】
1. .claude/agents/{你}-progress/current.md      # 更新当前状态
2. .claude/agents/{你}-progress/completed.md    # 记录完成的任务
3. .claude/agents/{你}-progress/context-for-others.md  # 写明需要PM汇总的内容

【追加模式】
4. .team-brain/daily-sync/YYYY-MM-DD.md    # 追加今日工作（不覆盖他人）
5. .team-brain/decisions/DECISIONS.md      # 追加重要决策（不覆盖他人）

【追加模式 - 各Agent自行追加】
• .team-brain/TEAM_CHAT.md                 # ⭐ 追加模式，详见下方协议

【⚠️ 禁止直接编辑 - 由PM统一更新】
• .team-brain/handoffs/PENDING.md          # 写入context-for-others.md，PM会汇总
• .team-brain/status/PROJECT_STATUS.md     # 写入context-for-others.md，PM会汇总
• .team-brain/status/TODAY_FOCUS.md        # 写入context-for-others.md，PM会汇总
```

### 3. 交接协议

当你的工作需要其他 Agent 接手时:

```markdown
## 交接模板
### From: [你的角色]
### To: [目标角色]
### Date: YYYY-MM-DD

#### 背景
[为什么需要交接]

#### 完成的工作
[你做了什么]

#### 需要接手的工作
[对方需要做什么]

#### 关键文件
- file1.js: [说明]
- file2.wxml: [说明]

#### 注意事项
[踩过的坑、特别提醒]

#### 验收标准
[如何判断完成]
```

### 4. 决策记录协议

重要决策必须记录:

```markdown
## 决策模板
### 决策编号: DEC-YYYY-MM-DD-XXX
### 决策者: [角色]
### 影响范围: [哪些模块/Agent]

#### 问题
[要解决什么问题]

#### 方案选项
1. 方案A: [描述] - 优点/缺点
2. 方案B: [描述] - 优点/缺点

#### 最终决策
[选择了什么，为什么]

#### 后续行动
- [ ] Action 1 (负责人)
- [ ] Action 2 (负责人)
```

---

## 沟通规范

### Agent 间引用格式

```
@backend: 需要你检查 app.js 里的 apiRequest 错误处理
@frontend: 这个 API 已经更新，可以对接了
@tester: 新功能已完成，请编写测试
@devops: 准备发布，请检查版本配置
@pm: 需要确认这个需求的优先级
@resonance: 这个功能上线了，可以开始内容运营
```

### 状态标记

```
[WIP] - Work In Progress 进行中
[BLOCKED] - 被阻塞，需要等待
[READY] - 准备就绪，可以交接
[REVIEW] - 需要 Review
[DONE] - 已完成
```

---

## 🚨 并行任务时的文档更新协议（重要）

### 问题背景

当多个Agent并行执行任务时，可能同时更新共享文档（如TEAM_CHAT.md、PENDING.md），导致：
- 内容覆盖/丢失
- 版本冲突
- 信息不一致

### 解决方案：文档所有权分类（完整版）

#### 一、私有文档（各Agent独立维护，无冲突风险）

| 文档路径 | 说明 |
|---------|------|
| `.claude/agents/{agent}-progress/current.md` | 当前任务状态 |
| `.claude/agents/{agent}-progress/completed.md` | 已完成任务记录 |
| `.claude/agents/{agent}-progress/context-for-others.md` | 给其他Agent的上下文 |

#### 二、共享文档 - 高频更新

| 文档路径 | 更新方式 | 说明 |
|---------|---------|------|
| `.team-brain/TEAM_CHAT.md` | ⭐ **追加模式** | 各Agent自行追加，详见下方协议 |
| `.team-brain/handoffs/PENDING.md` | PM统一更新 | 写入context-for-others.md，PM会汇总 |
| `.team-brain/status/TODAY_FOCUS.md` | PM统一更新 | 写入context-for-others.md，PM会汇总 |
| `.team-brain/status/PROJECT_STATUS.md` | PM统一更新 | 写入context-for-others.md，PM会汇总 |

#### 三、共享文档 - 谁创建谁维护（文件名需包含创建者标识）

| 文档路径 | 命名规则 | 示例 |
|---------|---------|------|
| `.team-brain/analysis/*.md` | `{主题}_{AGENT}.md` | `PROMPT_FLOW_ANALYSIS_PM.md` |
| `.team-brain/handoffs/HANDOFF-*.md` | `HANDOFF-{日期}-{编号}-{主题}.md` | `HANDOFF-2026-04-24-001-SSE-FIX.md` |

#### 四、共享文档 - 低频更新（需Coordinator批准或团队协商）

| 文档路径 | 说明 | 修改条件 |
|---------|------|---------|
| `.claude/agents/{agent}.md` | Agent角色定义 | 需Coordinator批准 |
| `.team-brain/TEAM_PROTOCOL.md` | 团队协作协议（本文档） | 需Coordinator批准 |
| `.team-brain/knowledge/*.md` | 知识库文档 | 谁负责该领域谁更新 |
| `.team-brain/decisions/DECISIONS.md` | 决策记录 | 任何Agent可追加，不可删改他人记录 |
| `CLAUDE.md` | 项目主文档 | 需Coordinator批准 |
| `docs/*.md` | 项目技术文档 | 需相关Agent Review |

#### 五、文档分类速查表

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         文档分类速查                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟢 可以直接编辑（无需协调）:                                              │
│     • 你自己的 {agent}-progress/*.md                                     │
│     • 你创建的 analysis/*.md 和 handoffs/*.md                            │
│     • daily-sync/*.md（追加模式）                                        │
│     • TEAM_CHAT.md（⭐追加模式，只能在末尾添加）                           │
│                                                                         │
│  🟡 需要PM汇总（不要直接编辑）:                                            │
│     • PENDING.md                                                        │
│     • TODAY_FOCUS.md                                                    │
│     • PROJECT_STATUS.md                                                 │
│                                                                         │
│  🔴 需要审批（提前沟通）:                                                  │
│     • CLAUDE.md                                                         │
│     • TEAM_PROTOCOL.md                                                  │
│     • {agent}.md（角色定义）                                              │
│     • docs/*.md                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 并行任务执行流程

```
┌─────────────────────────────────────────────────────────────┐
│ Agent完成任务后的更新流程                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  backend / tester / frontend / devops / resonance:          │
│  ├── ✅ 更新 .claude/agents/{自己}/current.md               │
│  ├── ✅ 更新 .claude/agents/{自己}/completed.md             │
│  ├── ✅ 更新 .claude/agents/{自己}/context-for-others.md    │
│  ├── ✅ 追加 TEAM_CHAT.md（追加模式，只在末尾添加）          │
│  └── ❌ 不直接编辑 PENDING.md、PROJECT_STATUS.md 等          │
│                                                             │
│  PM:                                                        │
│  ├── 读取各Agent的 context-for-others.md                    │
│  ├── ✅ 追加 TEAM_CHAT.md（追加模式，与其他Agent相同）       │
│  └── 统一更新 PENDING.md、PROJECT_STATUS.md、TODAY_FOCUS.md │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### context-for-others.md 的格式要求

各Agent完成任务后，在 `context-for-others.md` 中写明：

```markdown
## 当前状态速览

状态: 🟢 完成 / 🟡 进行中 / 🔴 阻塞
刚完成: [一句话描述完成了什么]
下一步: [一句话描述下一步]
需要PM汇总: [需要写入TEAM_CHAT的内容摘要]

---

## 需要PM汇总到群聊的内容

[详细的完成报告，PM会将此内容汇总到TEAM_CHAT.md]
```

### 注意事项

1. **TEAM_CHAT.md 采用追加模式**: 各Agent完成任务后自行追加消息，详见下方协议
2. **其他高频文档由PM统一更新**: PENDING/PROJECT_STATUS/TODAY_FOCUS 仍由PM汇总更新
3. **文件名包含所有者**: 分析文档命名为 `{主题}_PM.md`、`{主题}_BACKEND.md` 等，避免冲突
4. **定期汇总**: PM在每个阶段结束后汇总各Agent状态，更新共享文档
5. **追加模式文档**: daily-sync、decisions、TEAM_CHAT 采用追加模式，每个Agent在文件末尾追加自己的内容，不修改他人内容
6. **低频文档修改**: 修改 CLAUDE.md、TEAM_PROTOCOL.md、Agent角色定义等低频文档前，必须先与Coordinator沟通获得批准

---

## ⭐ TEAM_CHAT.md 追加模式协议（重要）

### 为什么采用追加模式

各Agent完成任务后立即记录，信息更及时、更准确；并行任务时也不会冲突（只追加，不覆盖）。

### 核心规则

```
1. 只能在文件末尾追加新消息
2. 不能修改、删除已有消息
3. 每条消息必须有精确时间戳（到分钟）
4. 用明确的分隔线标记消息边界
5. 时间戳必须使用真实的北京时间（见下方"时间戳规范"）
```

### 🕐 时间戳规范（全团队强制执行）

**所有文档中的时间戳必须使用真实的北京时间**，不允许估算或编造。

**获取方法**（在每次写入时间戳前执行）:
```bash
TZ=Asia/Shanghai date '+%Y-%m-%d %H:%M'
```

**适用范围**: 所有Agent在更新以下文件时必须遵循：
- `{agent}-progress/current.md`、`completed.md`、`context-for-others.md`
- `.team-brain/TEAM_CHAT.md`
- `.team-brain/daily-sync/*.md`
- `.team-brain/status/TODAY_FOCUS.md`、`PROJECT_STATUS.md`
- `.team-brain/handoffs/PENDING.md`
- `.team-brain/decisions/DECISIONS.md`
- 所有其他包含时间戳的文档

**禁止行为**:
- ❌ 使用UTC或其他时区的时间
- ❌ 根据任务顺序推测时间
- ❌ 使用非实时的虚构时间

### 消息格式

```markdown
---

### YYYY-MM-DD HH:MM

**@agent名**:

[消息内容]

---
```

### 追加方法

使用 Edit 工具时:
- `old_string`: 文件最后的 `---` 分隔线
- `new_string`: 原分隔线 + 新消息 + 新分隔线

**示例**：
```python
Edit(
    file_path=".team-brain/TEAM_CHAT.md",
    old_string="---\n",  # 匹配文件末尾的分隔线
    new_string="""---

### 2026-04-24 14:35

**@frontend**:

index 页面 SSE 流式渲染修复完成，已验证中文字符不再乱码。

下一步：等待 tester 验收

---
"""
)
```

### 禁止操作

- ❌ 修改他人消息
- ❌ 删除任何内容
- ❌ 在中间插入
- ❌ 修改时间戳

### 并行安全性

| 场景 | 传统编辑 | 追加模式 |
|------|---------|---------|
| A读→A写→B读→B写 | ✅ 正常 | ✅ 正常 |
| A读→B读→A写→B写 | ❌ A的内容被覆盖 | ✅ 两条消息都保留 |
| 最坏情况 | 信息丢失 | 顺序轻微错乱（可接受） |

---

## 文件命名规范

```
日期格式: YYYY-MM-DD
时间格式: HH:MM
文件命名: kebab-case (小写+连字符)

示例:
- 2026-04-24.md
- prompt-flow-analysis.md
- DEC-2026-04-24-001.md
```

---

## 上下文预算管理

### 原则
- 每个 Agent 的"必读"文件总量控制在 context window 的 30% 以内
- 超过 30% 的信息通过"按需阅读"获取
- 优先读 context-for-others.md（精炼信息），而非完整源文件
- TEAM_CHAT.md 已有归档机制（`scripts/archive_team_chat.sh`），主文件只保留最近 7 天

### 各角色阅读清单

#### Backend Agent
**必读（每次开工）**:
1. `.claude/agents/backend-progress/current.md` — 自己的进度
2. `.team-brain/status/TODAY_FOCUS.md` — 今日重点
3. `.claude/agents/pm-progress/context-for-others.md` — PM 的最新指令

**按需阅读**:
- `.claude/agents/frontend-progress/context-for-others.md` — 有 API 对接时
- `.claude/agents/tester-progress/context-for-others.md` — 有测试反馈时
- `CLAUDE.md` 的对应技术章节 — 需要确认架构约束时

**不需要读**:
- TEAM_CHAT.md 全文（太长，PM 会在 context-for-others 里摘要关键信息）
- resonance 的所有进度文件

#### Frontend Agent
**必读（每次开工）**:
1. `.claude/agents/frontend-progress/current.md` — 自己的进度
2. `.team-brain/status/TODAY_FOCUS.md` — 今日重点
3. `.claude/agents/pm-progress/context-for-others.md` — PM 的最新指令
4. `.claude/agents/backend-progress/context-for-others.md` — API 状态

**按需阅读**:
- `.claude/agents/tester-progress/context-for-others.md` — 有测试反馈时
- `CLAUDE.md` 的前端相关章节

**不需要读**:
- devops 的进度（除非有发布相关需求）
- resonance 的进度

#### Tester Agent
**必读（每次开工）**:
1. `.claude/agents/tester-progress/current.md` — 自己的进度
2. `.team-brain/status/TODAY_FOCUS.md` — 今日重点
3. `.claude/agents/pm-progress/context-for-others.md` — PM 的最新指令
4. `.claude/agents/backend-progress/context-for-others.md` — 最新代码改动
5. `.claude/agents/frontend-progress/context-for-others.md` — 最新前端改动

**按需阅读**:
- `CLAUDE.md` 的技术约束章节

#### DevOps Agent
**必读（每次开工）**:
1. `.claude/agents/devops-progress/current.md` — 自己的进度
2. `.team-brain/status/TODAY_FOCUS.md` — 今日重点
3. `.claude/agents/pm-progress/context-for-others.md` — PM 的最新指令

**按需阅读**:
- `.claude/agents/backend-progress/context-for-others.md` — 发布相关变更时

#### PM Agent
**必读（每次开工）**:
1. 所有 agent 的 `context-for-others.md`（这是 PM 的核心职责）
2. `.team-brain/status/TODAY_FOCUS.md` — 今日重点
3. `.team-brain/handoffs/PENDING.md` — 待处理交接
4. `.team-brain/status/PROJECT_STATUS.md` — 项目状态

**按需阅读**:
- 各 agent 的 `current.md`（被阻塞时深入了解）
- TEAM_CHAT.md 最新部分（归档后主文件较短）

---

## 冲突解决规则

1. **代码冲突**: Frontend/Backend 在同一文件上的修改需提前通知 PM，由 PM 协调先后顺序
2. **需求冲突**: PM 有最终裁量权，必要时上升到 Coordinator
3. **架构争议**: 先记录在 DECISIONS.md，由 Coordinator 最终决定
4. **Agent 间争议**: 在 TEAM_CHAT.md 中讨论，不要私自决定影响他人的事

---

## 序话特有开发约束（全员必知）

1. **微信小程序限制**: 所有代码必须兼容微信 DevTools 编译器（无 DOM/window/document API）
2. **无 npm**: 不能使用 npm 包，所有依赖手动管理
3. **API 全走 wx.request()**: 通过 app.js 的 apiRequest() 封装，不直接调用 wx.request
4. **SSE 流式**: 使用 enableChunkedTransfer，需自定义 UTF-8 解码
5. **不改后端**: 后端在远程 duyueai.com，所有 Agent 不修改后端代码
6. **样式用 rpx**: 不用 px，微信小程序响应式单位
7. **路由**: 用 wx.navigateTo/wx.switchTab，不是 router.push
8. **每次修改后在微信 DevTools 中验证**

---

*版本: 1.0*
*创建日期: 2026-04-22*
*适用项目: 序话(xuhua-wx) — AI Prompt 优化微信小程序*
*需要 Coordinator 批准后才能修改本文档*
