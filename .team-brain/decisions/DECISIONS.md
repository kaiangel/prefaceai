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

---

(新决策往下追加)
