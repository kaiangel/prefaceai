# Coordinator(统筹者) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24
> 角色: coordinator

---

## 当前状态速览（2026-04-24）

**Phase PORTING**: ✅ 全部完成  
**下一阶段**: Stage 1 Week 1-2（定位实验）— 待 Founder 下达启动指令

---

## 系统已就绪

### 可用资源

- ✅ **CLAUDE.md** 全局上下文（17 KB，必读）
- ✅ **7 个 Agent 角色文件** 在 `.claude/agents/`
- ✅ **21 个 progress 文件** 等你填写
- ✅ **3 个序话专属 Skills**: wechat-miniprogram / streaming-sse / api-integration
- ✅ **8 个 xh* 工作流 Skills**
- ✅ **通用 Skills**: prompt-engineering / context-management
- ✅ **3 个测试文件** + HARNESS_HEALTH.md

### 关键入口指南

| 想做什么 | 读哪个 |
|---------|-------|
| 了解项目全貌 | `CLAUDE.md` |
| 了解自己的角色 | `.claude/agents/{你的角色}.md` |
| 团队协作规则 | `.team-brain/TEAM_PROTOCOL.md` |
| 写进度 | `.claude/agents/{你的角色}-progress/current.md` |
| 今日重点 | `.team-brain/status/TODAY_FOCUS.md` |
| Harness 健康 | `.team-brain/status/HARNESS_HEALTH.md` |
| Skill 索引 | `.claude/skills/SKILL_INDEX.md` |

---

## 给所有 Agent 的共识锚点

### 1. 产品核心愿景

> **好 prompt 本身有价值，我们的工作是让这个价值体现出来。**

### 2. Beachhead（锁定）

设计师 + 内容创作者 + 日常完成复杂任务的人。**放弃简单任务市场**。

### 3. 5 条 Counter-Positioning 护城河

1. 多模型对比（境内）
2. 中文创作深度
3. 多模态统一引擎 ⭐（真正的 Cornered Resource）
4. 项目化 / 版本化 / 团队化（Investment 阶段）
5. 微信生态原生

### 4. 合规红线

- **禁止硬编码境外 LLM 端点**（test_architecture 强制）
- 所有 API 走 `https://www.duyueai.com`
- 境内模型（千问 / 豆包 / 混元 / Kimi / 智谱 / MiniMax / MiMo 等）

### 5. 微信小程序约束

- 主包 < 2 MB
- 无 npm / 无 TS / 无构建工具
- 用 rpx 不用 px

---

## Coordinator 的值班信号

**必须介入**：
- 合规测试 fail
- 主包超 2 MB
- 跨 Agent 领域冲突
- 架构级决策
- 联络 Co-founder（远程后端改动）

**不值班**（信任 @pm 和对应 Agent）：
- 日常任务派发
- 单一领域技术决策
- 普通代码 review
- 常规测试执行

---

## 本周建议聚焦

1. **Founder**: Stage 1 启动时机 + 首批定位实验文案
2. **@pm**: 在 PROJECT_STATUS.md 填入 Stage 1 具体指标
3. **@frontend**: 三档复杂度入口 UI 草稿
4. **@backend**: system prompt 三档配置方案
5. **@tester**: Stage 1 发布前手动回归 checklist
6. **@devops**: 发布流程文档化
7. **@resonance**: Stage 1 首批 marketing 内容

---

## 注意事项

- ⚠️ subagent Write / Bash 权限比主会话严格 → "subagent 出 draft + Coordinator Write" 混合模式
- ⚠️ 所有 spawn 用 Sonnet 4.6（Founder 决定）
- ⚠️ 派发前先更新文档
