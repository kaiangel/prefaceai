# Coordinator(统筹者) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24 Session 3 Wave 1 完成
> 角色: coordinator

---

## 当前状态速览（2026-04-24 Session 3 后）

**Wave 1**: ✅ 全部完成,4 个 teammate 并行产出通过审查
**下一阶段**: Wave 2(RED-002 + 方案 Y + Stage 1 后端)— 待 Founder 启动指令

---

## Session 3 关键共享上下文

### 1. 仓库与远程

- xuhua-wx → `kaiangel/prefaceai` main 分支(Session 3 force push 后完全干净)
- sumai → `101.132.69.232:sumai.git` master 分支
- **注意**:sumai 是嵌套 git 仓库,位于 `xuhua-wx/sumai/`,有自己独立的 commit/push 流程

### 2. 后端 LLM 当前真相(RED-001 后)

- **主力 LLM 已是 Qwen 3.6 系列**(不再是 Anthropic Claude)
- 免费: `qwen3.6-flash-2026-04-16`
- Pro: `qwen3.6-plus-2026-04-02`
- stream.py + stream_en.py 12+ 端点已迁移
- **stream_en.py 修了 pre-existing bug**:4 个端点(dalleStreamEN/hunyuanStreamEN/runwayStreamEN/kelingStreamEN)原来调用不存在的函数

### 3. 前端 Stage 1 UX 就绪

- 三档复杂度按钮已在 pages/index/ 上线
- 参数名: `complexity`(enum: `quick|standard|professional`)
- 透传位置: `generateContent()` body,和 `style` 同级
- 未收到 complexity 时后端 fallback `standard`
- **后端 system prompt 三档未实现**(Wave 2 任务)

### 4. 已知风险(纳入 KNOWN_ISSUES.md)

| ID | 严重度 | 内容 |
|---|---|---|
| RED-002 | 🔴 P0 | 凭证硬编码(DashScope key + app.secret_key 弱密钥)|
| RED-003 | 🔴 P0 | 证书入 git 历史(需 Founder 外部 git-filter-repo + 证书轮换)|
| YELLOW-004 | 🟡 P1 | sumai TOCTOU lost update(validate+save 无事务)|
| YELLOW-001 | 🟡 P1 | /wanxiangStream 孤儿(方案 Y 实施 Wave 2)|
| GRAY-006 | 🟢 P3 | pages/index/index.js 含 3038 个 U+00A0(Stage 2+ 清理)|

### 5. 测试现状

- xuhua-wx: `tests/` 18 个 pytest(全绿)
- sumai: `sumai/tests/` **89 passed / 111 skipped / 3 xfailed / 2 xpassed**
- test_qwen_model_name 已 PM 代修(期望 qwen3.6-plus / qwen3.6-flash)

---

## 关键入口指南

| 想做什么 | 读哪个 |
|---------|-------|
| 了解项目全貌 | `CLAUDE.md` |
| sumai 后端上下文 | `sumai/CLAUDE.md`(592 行,Session 2 产出)|
| 了解自己的角色 | `.claude/agents/{角色}.md` |
| 今日重点 | `.team-brain/status/TODAY_FOCUS.md` |
| 项目看板 | `.team-brain/status/PROJECT_STATUS.md` |
| 决策记录 | `.team-brain/decisions/DECISIONS.md`(D001-D013)|
| 已知问题 | `.team-brain/knowledge/KNOWN_ISSUES.md` |
| Harness 健康 | `.team-brain/status/HARNESS_HEALTH.md` |
| 团队群聊 | `.team-brain/TEAM_CHAT.md` |
| RED-003 手动操作指南 | `sumai/docs/RED-003_git_history_cleanup_guide.md` |

---

## 给所有 Agent 的共识锚点

### 1. 产品核心愿景
> 好 prompt 本身有价值,我们的工作是让这个价值体现出来。

### 2. Beachhead
设计师 + 内容创作者 + 日常完成复杂任务的人。**放弃简单任务市场**。

### 3. 5 条 Counter-Positioning
1. 多模型对比(境内)
2. 中文创作深度
3. 多模态统一引擎 ⭐
4. 项目化 / 版本化 / 团队化
5. 微信生态原生

### 4. 合规红线
- 禁止硬编码境外 LLM 端点
- 所有 API 走 `https://www.duyueai.com`
- 境内模型主力 Qwen 3.6

### 5. 微信小程序约束
- 主包 < 2 MB(当前 ~800 KB + Session 3 增量 < 4 KB)
- 无 npm / 无 TS / 无构建工具
- 用 rpx 不用 px
- 无 DOM API / wx API 路由

---

## Coordinator 值班信号

**必须介入**:
- 合规测试 fail
- 主包超 2 MB
- 跨 Agent 领域冲突
- 架构级决策
- 联络 Co-founder(远程后端改动)

**不值班**(信任 @pm 和对应 Agent):
- 日常任务派发
- 单一领域技术决策
- 普通代码 review
- 常规测试执行

---

## 注意事项

- ⚠️ subagent Write / Bash 权限比主会话严格 → "subagent 出 draft + Coordinator Write" 混合模式
- ⚠️ 所有 spawn 用 Sonnet 4.6(Founder 决定)
- ⚠️ 派发前先更新文档
- ⚠️ 部分 subagent(@tester / @frontend)本轮无法写 `.claude/agents/*-progress/`,由 PM 代写
- ⚠️ sumai 是嵌套独立 git,commit/push 要分别操作
