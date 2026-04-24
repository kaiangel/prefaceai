# 决策记录

> 维护者: PM
> 规则: 追加式,不删除历史决策

## 2026-04-24

### D001 - 多 Agent 协作系统从 xuhuastory 移植到 xuhua-wx
- **决策者**: Founder
- **理由**: 提升 2 人团队 + Claude Code 的协作效率
- **影响**: 新增 .team-brain/ / .claude/agents/ / .claude/skills/ / tests/ 目录
- **执行**: Coordinator(Opus 4.7)派 4 个 Sonnet 4.6 agent 并行 Phase 1

### D002 - 全部 spawn agent 使用 Sonnet 4.6
- **决策者**: Founder
- **理由**: Sonnet 4.6 性价比最高,Opus 保留给 Coordinator 做 review
- **影响**: 所有 subagent 调用强制 model: sonnet

### D003 - Resonance agent 独立(不与 xuhuastory 共享)
- **决策者**: Founder
- **理由**: 序话与 xuhuastory 是同一创始人的不同产品,营销需分开运营

### D004 - 不引入 GitHub Actions CI / 不加 eslint PostToolUse hook
- **决策者**: Coordinator(Founder 授权)
- **理由**: 微信小程序无 npm 生态 + .eslintrc.js 规则为空,eslint 空转

### D005 - Beachhead 锁定 "设计师 + 内容创作者 + 日常完成复杂任务人群"
- **决策者**: Founder
- **理由**: Session 1 战略讨论 + "上次放弃用序话是简单任务"用户洞察

### D006 - 多模型对比护城河限定中国大陆境内模型
- **决策者**: Founder
- **理由**: 微信小程序合规要求
- **影响范围**: 千问、豆包、混元、Kimi、智谱、MiniMax、小米 MiMo 等

### D007 - Sumai 后端代码以嵌套 git repo 方式共存于 xuhua-wx 目录
- **决策者**: Founder
- **日期**: 2026-04-24
- **背景**: sumai 是序话的真实后端代码(clone 自 `101.132.69.232:/home/git/sumai.git`,部署到 `https://www.duyueai.com`)。为了让 Claude Code Agent 能跨仓库做 API 契约分析,Founder 把 sumai clone 到 `/Users/kaisbabybook/WeChatProjects/xuhua-wx/sumai/`。
- **策略**:
  - `sumai/` 是**独立 git 仓库**(保留自己 `.git/`)
  - xuhua-wx 的 `.gitignore` 已排除 `/sumai/`,避免嵌套 commit
  - sumai 的改动各自 push 到 sumai repo
  - xuhua-wx 的改动 push 到 `shunshunyue/xuhua-wx`
- **影响**:
  - Backend agent 白名单扩展到 `sumai/**`(一个 Backend 管全栈)
  - Tester agent 测试范围扩展到 sumai 后端 + xuhua-wx 前端
  - 所有 Claude Code agent 可 Read sumai 代码,但 **.env 等敏感文件不读**

### D008 - Coordinator 兼任 PM Lead(subagent 层级限制)
- **决策者**: Founder
- **日期**: 2026-04-24
- **背景**: 实测发现 subagent 不能再 spawn 子子 agent。原 xhteam skill 设计"PM 作为 subagent 再 spawn teammates"不可行。
- **新架构**:
  ```
  Founder (你)
      ↓
  Coordinator + PM Lead (主会话 Opus 4.7)
     - 战略把关(Coordinator 原职)
     - 规划 / 拆解 / spawn teammates / 审查(PM 原职)
      ↓
  Teammates (subagents 一级,不能再 spawn)
     - @backend / @frontend / @tester / @devops / @resonance
  ```
- **影响**:
  - `.claude/agents/pm.md` 的"PM 作为独立 Lead"部分调整为"PM 是思维框架,由主会话承担执行"
  - xhteam skill 的"PM 作为 Agent Team Lead"由主会话(Coordinator)履行
  - 实际 spawn / 审查 / 修复循环都在主会话里完成
- **保留**: pm.md 的产品决策视角、需求过滤器、Beachhead 把关等职责仍然是 PM 角色的核心(主会话以 PM 视角工作时遵循)

---

(新决策往下追加)

### D009 - GitHub 前端仓库迁移到 kaiangel/prefaceai(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: 复用 Founder 个人账号下旧仓库 `kaiangel/prefaceai`(之前存微信小程序旧代码,决定清空复用),不继续用 `shunshunyue/xuhua-wx`
- **执行**: `git remote set-url origin git@github.com:kaiangel/prefaceai.git && git push -u origin main --force`(覆盖旧代码)
- **结果**: xuhua-wx 本地 main HEAD `722bcd4` 已 push,远程 main 指向此 commit

### D010 - 通义万相方案 Y + 下架 hunyuan(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: 查证发现前端 wanxiang 按钮调 `/wanxiangStream`(不存在)→ 404;前端 hunyuan 按钮调 `/hunyuanStream`(实际是通义万相 2.2 的 system prompt — 命名错位)
- **决策**: 方案 Y(后端规范化)+ 下架 hunyuan
  - sumai 新建 `/wanxiangStream`(复制 `/hunyuanStream` 实现)
  - sumai 可删 `/hunyuanStream`(hunyuan 前端下架后无调用)
  - 前端删除 hunyuan 按钮相关配置(modelNames / modelDescriptions / baseEndpoints)
- **理由**: 用户说 hunyuan 没在用 + 保留通义万相(真实体现合规境内模型聚合)
- **状态**: Wave 2 实施

### D011 - Qwen 差异化:免费用 Flash 3.6 / Pro 用 Plus 3.6(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: Session 2 发现 "qwen-plus-latest Pro 和免费仅 max_tokens 不同" 差异化弱
- **决策**:
  - 免费用户: `qwen3.6-flash-2026-04-16`(更快、更便宜、阶梯定价,2 元起/百万 tokens)
  - Pro 用户: `qwen3.6-plus-2026-04-02`(编程能力对标 Claude Opus 4.5,1M context)
  - max_tokens 保持不变(Pro=8630 / 免费=4096)
- **结果**: 真实产品差异化(模型不同 + max_tokens 不同)+ 合规(全 Qwen 境内)+ 成本可控
- **执行**: Wave 1 @backend 已完成

### D012 - Stage 1 启动方式:方案 B 并行(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **决策**: Stage 1 前端先行(UX 不依赖后端)+ 后端 system prompt 等 RED-001 迁移完成再改
- **理由**: 避免在 Claude + Qwen 两套 prompt 上都加 complexity 档,效率最高
- **执行**: Wave 1 @frontend 已完成前端部分;Wave 2 补后端 complexity 三档

### D013 - 红色警报 RED-001/002/003 处理:方案 B 并行(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **决策**: Stage 1 开工同时,背景处理红色警报,不串行
- **理由**: Stage 1 纯前端 UX 改动不依赖 sumai,可并行
- **状态**: RED-001 大部分完成(Wave 1);RED-002/003 Wave 2 + Founder 外部操作

---

(新决策往下追加)
