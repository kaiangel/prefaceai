# Coordinator(统筹者) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 全部完成后
> 角色: coordinator

---

## 当前状态速览（2026-04-24 Session 3 Wave 2 Round 2 后）

**Wave 1**: ✅ 完成并 push(xuhua-wx 619d191 / sumai a31163c)
**Wave 2 Round 1**: ✅ 完成(RED-002 凭证外移 + 基线 + env 指南草稿)
**Wave 2 Round 2**: ✅ 完成(TOCTOU 基础 + 方案 Y + hunyuan 清除 + env 指南定稿)
**Wave 2 Round 3**: ⏳ 最后一轮,等 Founder 对 complexity 三档产品方向确认

---

## Wave 2 关键变化(给所有 Agent)

### 新函数契约(sumai/stream.py)

- `validate_and_deduct(data, cost=1)` L1764:替代旧 `validate_request_and_user` + `save_content_prompt_stream` 的额度检查和扣次数部分。SELECT FOR UPDATE + 同事务 commit,消除 TOCTOU
- `save_prompt_record(content, response, openid, ...)` L1905:只 INSERT prompt_base,不再扣次数
- 旧 `validate_request_and_user` + `save_content_prompt_stream` 保留,Round 3 删

### 端点切换状态

- 已切新 API:`/botPromptStream`、`/aiAgentStream`、`/wanxiangStream`(新建)
- 未切(Round 3):reasoningStream / fluxStream / midjourneyStream / jimengpicStream / lovartpicStream / dalleStream / runwayStream / kelingStream / jimengvidStream / lovartvidStream / sora2Stream / describeImageStream + stream_en.py 全部

### 方案 Y 已实施(D010)

- sumai 新建 `/wanxiangStream` + `/wanxiangStreamEN`(复制原 /hunyuanStream 内容,实际是通义万相 system prompt)
- sumai 删 `/hunyuanStream` + `/hunyuanStreamEN`,留下架注释
- 前端 `pages/index/index.js`、`wxml`、`config/cdn.js` 的 hunyuan 引用全部清除
- 前端 favorites/history/shared 的 modelNames 映射保留 `hunyuan: '腾讯混元'` 做历史数据兼容

### 凭证管理(D016 / RED-002)

- sumai 主文件(mainv2/note/pay_stripe/stream/stream_en)凭证已 `os.getenv()` 外移
- 开发者本地 `.env`(不入 git)
- 生产部署指南:`sumai/docs/RED-002_env_migration_guide.md`(772 行完整 checklist)
- **FLASK_SECRET_KEY 切换会让 PC Web 用户全部登出**(小程序不受影响)

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

---

## 2026-04-28 PM(后续)· D018b 完成 + 诊断日志 + D019 即将启动

- **D018b 双 remote push**:sumai a36ebe0(directive 强化 + refine_instruction)+ xuhua-wx 764f408(方案 b 输入框 + 按钮 nowrap + counter 剩 2)
- **诊断日志**:xuhua-wx 11a15d6 加 8 处 [D018b] console.log,Founder 真机重测以观察 refine_instruction 是否端到端通
- **Founder 真机反馈**:输出几乎复述上一轮 → PM 诊断为"伪上下文注入"架构限制(directive 在 system 末尾优先级低,且"保留有效部分"措辞与"更换"指令矛盾)
- **D019 决定(2026-04-28 Founder 拍板)**: 改造为**真·多轮对话**(LLM 原生 chat completion 模式),user message 是用户的修改指示而不是再发原 idea。D018a/b 整套 directive 即将被 D019 替代,F-4 自动消失
- 待 PM 出 D019 拆解规划等 Founder "可以",coordinator 角色可能被派发任务
