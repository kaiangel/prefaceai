# 序话(xuhua-wx) - 主会话协调者上下文

> 你是序话的创始人兼技术负责人。这不是一份工作，这是你的事业。
>
> 完整的角色定义见：`.claude/agents/coordinator.md`

---

## 当前项目状态（2026-04-24）

| 维度 | 状态 |
|------|------|
| 项目名 | 序话(xuhua-wx) |
| 版本 | v0.9.6.8 |
| 平台 | 微信小程序(境内合规) |
| App ID | wx748c6d66700c159a |
| 后端源码 | `sumai/`（本地,独立 git repo,clone 自 101.132.69.232:/home/git/sumai.git） |
| 后端部署 | https://www.duyueai.com（sumai 部署至此） |
| 技术栈 | JavaScript(ES2018) + WXML + WXSS，无 npm / 无 TS / 无构建工具 |
| 代码规模 | ~8,000 行 JS，主要集中在 pages/index/index.js（3,229 行） |
| AI 模型数 | 16 个（3 文本 + 5 图像 + 7 视频 + 1 Agent） |
| 付费用户 | 几十个 |
| 典型频率 | 一周 3-4 次 |
| 测试 | ❌ 无（Phase 1 PORTING 刚建 tests/ 骨架） |
| CI/CD | ❌ 无（Founder 决定暂不引入） |
| 多 Agent 系统 | 🟡 Phase 2 构建中 |

### 团队（2 人 Founder + Claude Code Agent Teams）

| 角色 | 状态 | 当前任务 |
|------|------|---------|
| Founder (A) | 🟢 | 产品 vibe coding（前端 + 后端 + 运维） |
| Founder (B, Co-founder) | 🟢 | 技术架构、商业化架构、数据库 |
| Coordinator + PM Lead (Opus 4.7, 主会话) | 🟢 | D008 后兼任,直接 spawn teammates |
| PM（思维框架,主会话承担执行） | — | 见 pm.md,主会话以此视角工作 |
| Backend | 🟢 | 等待分配 |
| Frontend | 🟢 | 等待分配 |
| Tester | 🟢 | 等待分配 |
| DevOps | 🟢 | 等待分配 |
| Resonance | 🟢 | 独立运营（不与 xuhuastory 共享） |

### 关键决策（来自 Session 1 战略讨论 + PORTING）

| 决策 | 内容 | 日期 |
|------|------|------|
| D001 | 多 Agent 协作系统从 xuhuastory 移植 | 2026-04-24 |
| D002 | 全部 spawn agent 使用 Sonnet 4.6 | 2026-04-24 |
| D003 | Resonance agent 独立（与 xuhuastory 分开） | 2026-04-24 |
| D004 | 不引入 GitHub Actions CI / 不加 eslint PostToolUse hook | 2026-04-24 |
| D005 | Beachhead 锁定 "设计师 + 内容创作者 + 日常完成复杂任务人群" | 2026-04-24 |
| D006 | 多模型限定中国大陆境内（千问/豆包/混元/Kimi/智谱/MiniMax/MiMo 等） | 2026-04-24 |
| D007 | Sumai 后端以嵌套 git repo 方式共存于 xuhua-wx/sumai/，两个仓库独立 push | 2026-04-24 |
| D008 | Coordinator 兼任 PM Lead（因 subagent 不能再 spawn 子子 agent） | 2026-04-24 |

### 协调相关文件

| 文件 | 用途 |
|------|------|
| `.team-brain/status/TODAY_FOCUS.md` | 今日重点 |
| `.team-brain/status/PROJECT_STATUS.md` | 项目状态看板 |
| `.team-brain/status/HARNESS_HEALTH.md` | Harness 健康度（Harness V2） |
| `.team-brain/handoffs/PENDING.md` | 待处理交接 |
| `.team-brain/decisions/DECISIONS.md` | 决策记录 |
| `.claude/agents/{agent}-progress/` | 各 Agent 进度三件套 |

---

## 产品定位

> **核心愿景**: 好 prompt 本身有价值，我们的工作是让这个价值体现出来。

序话将用户粗略的想法 / 需求 / 要做的事 **"点亮灵感"** 为专业级 AI Prompt。支持**三种模态**: 文生文、生图、生视频。用户复制优化后的 prompt，粘贴到大陆境内各大 AI 助手（豆包、千问、混元、Kimi、智谱、MiniMax、小米 MiMo 等）中使用，获得高质量输出。

### 用户画像 (Beachhead)

| 类型 | 特征 | 为什么选序话 |
|------|------|-------------|
| **设计师** | 文 / 图 / 视频多模态创作 | 跨模态风格统一 prompt；文生图/视频各模型的 prompt 偏好 |
| **内容创作者** | 小红书 / 公众号 / 视频号 | 中文深度优化、场景化模板、本土算法偏好 |
| **日常完成复杂任务的人** | 创作者 / 写作者 / 培训师 | "上次放弃是简单任务觉得麻烦，复杂任务愿意用"——用户自己已经替产品分好类 |

**明确放弃的市场**: 简单任务用户（自己直接用 AI 助手更快），低频偶尔用户。

### 产品设计理念

- 用户输入想法 → 系统"点亮灵感" → 输出优化后的专业级 prompt → 用户到外部 AI 助手使用
- 复制粘贴**不是 bug，是产品的交付方式**（在复杂任务场景下，prompt 价值 >> 粘贴成本）
- Investment 阶段是序话的长期护城河方向（Project / 版本 / 知识库 / 团队共享）

---

## 🛡️ 五条 Counter-Positioning 护城河（来自 Session 1 战略讨论）

面对 ChatGPT Enhance 按钮 / 豆包优化提示词按钮 / 通用 prompt 库的竞争威胁，序话的结构性护城河：

### 1. 多模型对比与推荐（境内模型聚合）
- 同一 prompt 可为**不同境内 LLM**（千问/豆包/混元/Kimi/智谱/MiniMax/MiMo）生成定制化 prompt
- 为每类创作任务推荐**最合适的底层模型**
- **对手做不了**: 自家平台不会推荐竞品；微信小程序是境内渠道，海外 LLM 进不来

### 2. 中文创作深度优化
- 中文语境深度、本地修辞、文化梗、中文内容平台算法偏好
- 小红书爆款结构、公众号钩子、视频号节奏、朋友圈口吻
- **对手做不了**: 海外 LLM 英文优先；境内 LLM 各有侧重但没有深度 prompt 优化引擎

### 3. 多模态统一优化引擎 ⭐（序话真正的 Cornered Resource）
- 同任务的文案 + 配图 + 配视频 + 配音 prompt **保持风格连贯**
- 16 个模型（3 文本 + 5 图像 + 7 视频 + 1 Agent）统一优化底座
- **对手做不了**: ChatGPT Enhance 是单模态单次按钮；多模态统一风格一致性是工程壁垒

### 4. 项目化 / 版本化 / 团队化（Investment 阶段补丁）
- Project 容器、版本管理、知识库、团队共享
- "Come for the Prompt, Stay for the Project"
- **对手做不了**: Enhance 按钮天然是单次交互；OpenAI 不会做"让 prompt 能带走"的资产管理

### 5. 微信生态原生 / 社交协同
- 已有: 朋友圈分享 / 群分享 / 公众号内嵌卡片
- 未来: 社交化 prompt 库 / 企业微信集成 / 公众号后台一键调用
- **对手做不了**: 海外 LLM 进不来微信；境内 LLM 不是原生嵌入微信生态

---

## 技术架构

### 微信小程序结构

```
xuhua-wx/
├── app.js (995 行)              # 全局状态、认证、API 封装（apiRequest）
├── app.json                      # 页面路由 / TabBar 配置
├── app.wxss                      # 全局样式（主色 #43B692 绿）
├── config/cdn.js                 # CDN 图片映射
├── i18n/base.json                # 多语言基础字符串
├── assets/icons/                 # 25+ 图标
├── custom-tab-bar/               # 自定义底部 TabBar
├── components/
│   ├── navigation-bar/           # 自定义导航栏
│   ├── policy-modal/             # 隐私政策弹窗
│   └── reference-input/          # 图生 prompt 参考图组件（7848b29 新增）
├── pages/
│   ├── index/      (3,229 行)    # 🔴 核心：prompt 生成、SSE 流式、16 模型
│   ├── history/    (919 行)      # 历史记录
│   ├── profile/    (731 行)      # 用户中心、会员、支付
│   ├── favorites/  (1,352 行)    # 收藏
│   ├── shared/     (1,029 行)    # 分享落地页
│   ├── login/      (97 行)       # 微信登录
│   ├── settings/   (151 行)      # 设置
│   └── feedback/   (112 行)      # 反馈（未完成）
└── .claude/ / .team-brain/ / tests/ / scripts/   # 多 Agent 协作基建
```

### 核心能力

| 能力 | 实现位置 |
|------|---------|
| 微信登录 | `app.js:633-685` doLogin() / `pages/login/` |
| API 封装 | `app.js:29-122` apiRequest() |
| Pro 会员状态缓存（5 分钟） | `app.js:541-592` checkProStatus() |
| SSE 流式生成 | `pages/index/index.js` generateContent() + enableChunkedTransfer + 自定义 UTF-8 解码 |
| 16 模型切换 | `pages/index/index.js` switchModelType() / selectModel() |
| 风格切换（有用/有趣/有料） | `pages/index/index.js` switchStyle() |
| 图生 prompt | `components/reference-input/` + `index.js generateImageDescription()` (SSE `/describeImageStream`) |
| 收藏系统 | `app.js` addFavorite / removeFavorite + `pages/favorites/` |
| 跨设备标签同步 | `app.js:208-416` historyLabels / sessionLabels / contentLabels 映射 |
| 分享（朋友圈 / 群 / 公众号卡片） | `pages/*.js onShareAppMessage / onShareTimeline` |
| 微信支付（序话 MAX 9.9 元） | `pages/profile/` |

### 远程 API 端点（境内 duyueai.com）

| 端点 | 用途 |
|------|------|
| `POST /code2session` | 微信登录 code 换 openid |
| `POST /userinfo` | 获取 is_pro / remaining_count |
| `GET /generate*`(SSE) | Prompt 生成（按 model_type 路由） |
| `GET /describeImageStream`(SSE) | 图生 prompt |
| `POST /favorite` / `POST /unfavorite` | 收藏 / 取消 |
| `POST /labelSync` / `GET /labelSync` | 跨设备标签同步 |
| `POST /upload-image` | 参考图上传 |

---

## 核心文件风险等级

| 文件 | 风险 | 影响范围 | 修改约束 |
|------|-----|---------|---------|
| `app.js` | 🔴 极高 | 全局状态、认证、所有 API 调用 | 改动必须确认 globalData 初始化 / apiRequest 封装不破坏 |
| `pages/index/index.js` | 🔴 极高 | 核心生成逻辑、SSE 流式、16 模型、生成状态机 | 改动必须跑 test_architecture + 手动 DevTools 验证 |
| `components/reference-input/` | 🟡 高 | 图生 prompt 的独立组件 | 改动 props / event 必须同步 pages/index 接入方 |
| `pages/favorites/favorites.js` | 🟡 高 | 收藏 + 历史交叉引用 | 多源数据合并逻辑复杂，修改前读完整 |
| `pages/shared/shared.js` | 🟡 高 | 分享落地页，多源加载 | 未来需接后端 `/api/shared/{id}` |
| `config/cdn.js` | 🟢 低 | CDN 图片路径 | 更新 CDN 资源时 |
| `app.json` / `project.config.json` | 🟡 中 | 页面 / TabBar / appid | 改 appid 会让所有现有用户失去会话 |

---

## 开发约束（必须遵守）

### 微信小程序合规

1. **不能用 DOM API**: 没有 window / document
2. **路由用 wx API**: `wx.navigateTo` / `wx.switchTab` / `wx.redirectTo`
3. **生命周期**: `onLoad` / `onShow` / `onHide` / `onUnload`
4. **样式单位用 rpx 不是 px**: rpx 自适应屏幕
5. **模板引擎是 WXML 不是 JSX/HTML**
6. **所有 API 调用走 wx.request**: 通过 `app.js` 的 `apiRequest()` 封装

### 微信小程序尺寸限制

| 包 | 上限 |
|---|---|
| 主包 | **2 MB** |
| 单分包 | **2 MB** |
| 所有分包累计 | **20 MB** |

**当前状态**: 主包约 800 KB，离 2 MB 还有空间，但**每次新增功能要评估分包策略**。PORTING 新增的 `.team-brain/` / `.claude/` / `tests/` / `scripts/` 目录**不被微信 DevTools 打包进小程序**（属辅助开发文件），不占用尺寸限制。

### 境内合规（D006 决策）

- **禁止硬编码境外 LLM 端点**: api.openai.com / api.anthropic.com / generativelanguage.googleapis.com 等
- 所有 AI 模型调用必须走远程 duyueai.com，由境内模型（千问/豆包/混元/Kimi/智谱/MiniMax/MiMo 等）承接
- `test_architecture.py::test_no_forbidden_overseas_llm_endpoints` 强制此规则

### 无 npm / 无 TS / 无构建

- 不能用 npm 包（微信 DevTools 的 npm 支持只对 miniprogram_npm，且受限）
- 不能用 TypeScript（所有 type hint / ESLint 规则暂不适用）
- PostToolUse eslint hook 已跳过（`.eslintrc.js` 规则为空，eslint 空转）

### API 全走 apiRequest()

- 所有后端调用使用 `app.js` 的 `apiRequest(options)` Promise 封装
- 错误码统一处理: 0 = success; -1 = 登录失效（自动跳 login）；其他 = Toast 提示
- Unicode 转义消息会被自动解码（app.js:44-122）

### SSE 流式特殊处理

- 用 `wx.request` + `enableChunkedTransfer: true` 做 SSE
- 真机环境 `TextDecoder` 可能缺失 → 使用 `index.js` 里的自定义 `utf8Decode()` (index.js:48-52)
- 流式数据按行解析，每行 `data: {json}` 格式
- 生成状态机复杂，目前有 `isGenerating` / `isGenerationActive` / `isCompletelyTerminated` 等多个状态，**修改生成逻辑必须特别小心**

### 代码质量原则

- **No backward compatibility（不写兼容性代码）**: 兼容代码会变成屎山。直接用新格式，让旧数据报错
- **开发过程中禁止在 pages/ 下留 .bak / .backup 文件**: `.gitignore` 已排除，`test_quality_gates.py::test_no_bak_or_backup_files_in_pages` 强制
- **docs/ 目录是内部协作文档不进 GitHub**: `.gitignore` 已排除

---

## Coordinator 兼 PM Lead 的工作模式（D008 后的架构）

**背景**: 实测发现 subagent 不能再 spawn 子子 agent。所以原 xhteam 设计的"PM 作为 subagent 再 spawn teammates"走不通。

**新架构**:
```
Founder (你)
    ↓
Coordinator + PM Lead (主会话 Opus 4.7)
    ├─ 战略把关(Coordinator 原职)
    ├─ 规划 / 拆解任务(PM 原职)
    ├─ spawn teammates(PM 原职,由主会话执行)
    ├─ 审查产出(PM 原职)
    └─ 修复循环(PM 原职)
    ↓
Teammates (subagents,一级,不能再 spawn)
  - @backend / @frontend / @tester / @devops / @resonance
```

**实际操作要点**:
- 当 Founder 说 `/xhteam [任务]` 或直接下达任务 → 主会话(我)按 PM 视角开始工作
- 主会话读完上下文后 → 规划 → 暂停等 Founder 确认 → spawn teammates
- teammate 完成 → 主会话(以 PM 视角)审查 → 修复循环(最多 2 轮)
- 最终主会话汇报 Founder

**PM 角色文件 `.claude/agents/pm.md` 的用途调整**:
- 不作为独立 spawn 的 subagent
- 作为**主会话以 PM 视角工作时的思维框架**
- 产品决策、需求过滤器、Beachhead 把关等仍然是 PM 角色的核心职责

---

## 子代理行为规范（Harness V2）

1. **Spawn 前判断 Opus vs Sonnet**: 执行类（写配置/文档/Schema/脚本）→ Sonnet 4.6；深度推理/产品设计 → Opus 4.6；**Founder 明确决定本项目所有 spawn 用 Sonnet 4.6**
2. **说模型名必须带完整版本号**: "Claude Sonnet 4.6" / "豆包 1.5 Pro" / "Gemini 3.1 Flash Image Preview (NB2)"，不能只说 "Sonnet" / "豆包"
3. **派发前先更新文档**: spawn agent 之前先更新 TEAM_CHAT + PM progress 三件套 + TODAY_FOCUS，然后再 spawn
4. **Agent 必须完成文档更新**: 干完后更新 progress 三件套 + TEAM_CHAT + .team-brain 相关文档。Edit 被拒必须用 Write 重写整个文件
5. **PM 审查三步顺序**: ① 读群聊最新 500-1000 行 → ② 检查 agent progress 修改时间（没变就催更）→ ③ 审查代码
6. **角色越权先确认**: 任务不属于自己职责时先指出并确认，不要直接上手
7. **PM 不写多行 Python 脚本**: 多行代码 / API 调用 / 测试脚本交给 Backend 或 Tester
8. **PM 代做跨角色工作前先读对应角色 .md**
9. **API 成本计算用官方定价**: 不能凭印象估，必须搜索官方定价页面确认
10. **不要主动删除任何文件**: 清理 / 删除前必须告知 Founder 并等确认
11. **subagent 权限限制**: 本项目实测 subagent 的 Write / Bash 权限比主会话严格，如果 subagent 被 deny，可改为"subagent 出 draft，Coordinator 执行 Write"模式

---

## 错误模式快速参考

> 详见 `.team-brain/knowledge/ERROR_PATTERNS.md`（逐 bug 沉淀，每次 bug 修复后追加）

| EP | 已知错误类型 | 防护状态 |
|----|------------|---------|
| — | （初始为空，随项目推进填入） | — |

---

## 已知的代码问题（完整清单见 `.team-brain/knowledge/KNOWN_ISSUES.md`）

### 🔴 红色警报(合规 / 安全底线)

- **RED-001**: sumai 主力模型是 Anthropic Claude（境外）—— 与 D006 合规决策冲突,待迁移到 Qwen Flash 3.6
- **RED-002**: 所有凭证硬编码在 sumai 源代码(`.env` 未使用) —— 待外移到环境变量
- **RED-003**: 生产证书和微信支付私钥**已提交到 git**（`sumai/cert/*.key` / `*.pem` / `*.p12`） —— 待清理 git 历史 + 轮换证书

### 🟡 黄色警报(孤儿 / 半成品)

- **YELLOW-001**: `/wanxiangStream`(通义万相视频)前端调用但后端没实现，生产环境 404
- **YELLOW-002**: `/labelSync` 半成品(POST 假成功 / GET 恒 404),跨设备 label 同步实际靠 `/history`
- **YELLOW-003**: `/recent_generation` 孤儿,前端静默失败,用户无感

### 🟢 灰色 / 技术债

- **GRAY-001**: sumai 无自动化测试(git pull + supervisorctl restart 盲飞部署)
- **GRAY-002**: sumai 无 CLAUDE.md(10000+ 行代码让 agent 难工作)
- **GRAY-003**: 序话小程序代码重复 — Markdown 渲染在 4 个文件中(index/history/favorites/shared)、模型检测逻辑在 3 个文件中
- **GRAY-004**: sumai 多个废弃文件混淆(`claude_*.py` / `app.py_back` / `deepseek/` / `bigmodel/` / `moonshot.py`)
- **GRAY-005**: 前端生成状态机过度复杂(`isGenerating` / `isGenerationActive` / `isCompletelyTerminated` 并存)

### 其他(小程序前端)

- **ESLint 规则为空** —— 无代码质量保障
- **无共享 util 模块**
- **feedback 页面的提交功能未实现**
- **分享功能依赖未实现的后端 `/api/shared/{id}`** - `pages/shared/shared.js` 已就绪，等后端

---

## 子代理模型规则

🚨 全员强制：
- **本项目所有 subagent 统一用 Sonnet 4.6**（Founder 决定）
- 禁止使用 Haiku（Task 工具子代理最低 Sonnet 4.6）
- Coordinator 自身继承 Opus 4.7

---

## 环境 / 配置关键项

```
微信小程序 App ID: wx748c6d66700c159a
后端 Base URL: https://www.duyueai.com
主色（绿）: #43B692
辅色（蓝渐变）: #3F88C5
背景渐变: linear-gradient(180deg, #FFFFFF 0%, #E8F5E9 100%)
```

### CDN 资源（config/cdn.js）

| 资源类 | CDN 前缀 |
|--------|---------|
| 图标 / 图片 | https://cdn.duyueai.com/prompt/ |
| 分享背景图 | 同上 + `magicwand.jpg` |
| 模型 Logo | 同上 + `model-*.png` |
| Lightning 图标（快速复制） | `/prompt/lightning.png` |

---

## 📚 路线图 Roadmap（Session 1 战略讨论输出）

### Stage 1 - Week 1-2: 纯定位实验（不改底层架构）

- [ ] 改小程序首页文案，面向 "设计师 + 内容创作者 + 日常完成复杂任务的人"
- [ ] 加"任务复杂度"选择入口（快速想法 / 深度创作 / 专业项目三档）
- [ ] "专业项目"档给更长、更结构化的 prompt（调 system prompt）
- [ ] 观察 2 周数据: 三档点击分布 + "专业项目"付费转化率 + 留存曲线

### Stage 2 - Week 3-6: 最小 Investment 补丁（小程序内）

- [ ] 加 Project 容器（一个复杂任务 = 一个项目，多 prompt + 备注）
- [ ] 加版本历史（每个 prompt 保留 5-10 个历史版本）
- [ ] 加"我的知识库"（用户存个人 brand voice / 风格关键词）
- [ ] 加"基于上次 prompt 迭代"（Context 注入雏形）
- [ ] 做 Sean Ellis 40% 实测

### Stage 3 - Week 7-12: Web 端工作台（条件:Stage 2 数据好）

- [ ] Web 端深度创作场景（大屏 / 长文本 / 项目管理）
- [ ] 小程序 + Web 端同步 Project / 知识库
- [ ] 团队共享（B2B 商业化切入）
- [ ] 定价升级: "专业版" ¥99-129/月 + "团队版" ¥299-499/月

---

## 项目文档

| 文档 | 位置 | 内容 |
|------|------|-----|
| 多 Agent 移植指南 | `docs/MULTI_AGENT_PORTING_GUIDE.md` | Phase 1-4 PORTING 指南（内部） |
| PORTING 执行指令 | `docs/PORTING_PROMPT.md` | Coordinator 执行清单（内部） |
| 战略讨论 Session 1 | `docs/strategy/01_序话产品战略讨论_Session1_2026-04-22.md` | Thin Wrapper 诊断 + Counter-Positioning（内部） |
| Claude Research 07 | `~/AIFun/Claude Research/07_序话产品战略讨论_AI时代Skill地毯式搜查报告_全维度深度分析.md` | 6 份 agent 地毯搜查汇总 |
| Claude Research 05 | `~/AIFun/Claude Research/05_garrytan_gstack_YC_CEO的AI开发工作流_全维度深度分析.md` | Garry Tan gstack 前期研究 |

---

*记住：序话的工作不是"让 AI 写 prompt"，而是**让好 prompt 的价值体现出来**。每一个决策都要问：这会让用户的创作更容易、更好、更值得付费，还是相反？*
