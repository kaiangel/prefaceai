# Harness 健康度看板

> 上次更新: 2026-04-24
> 更新者: PM(由 Coordinator 初始化)
> 更新频率: 每周一次,或每个重大 TASK 完成后

---

## Sensor 覆盖率

| 架构规则 | 文档记录 (Guide) | 自动化测试 (Sensor) | Hook 强制 |
|---------|:---:|:---:|:---:|
| 必需文件存在 | ✅ | ✅ test_architecture | PreCommit |
| 7 角色 progress | ✅ | ✅ test_architecture | PreCommit |
| API base URL 一致性 | ✅ | ✅ test_architecture | PreCommit |
| 境外 LLM 端点禁令(合规) | ✅ | ✅ test_architecture | PreCommit |
| .team-brain 目录结构 | ✅ | ✅ test_architecture | PreCommit |
| TEAM_CHAT header 完整 | ✅ | ✅ test_architecture | PreCommit |
| HARNESS_HEALTH.md 存在 | ✅ | ✅ test_architecture | PreCommit |
| test_error_patterns 存在 | ✅ | ✅ test_architecture | PreCommit |
| 8 xh* skills 存在 | ✅ | ✅ test_architecture | PreCommit |
| XUHUA_SKILL_TRIGGERS 重命名 | ✅ | ✅ test_architecture | PreCommit |
| app.json 合法 | ✅ | ✅ test_quality_gates | PreCommit |
| page 四件套完整 | ✅ | ✅ test_quality_gates | PreCommit |
| tabBar 图标存在 | ✅ | ✅ test_quality_gates | PreCommit |
| pages/ 无 backup 文件 | ✅ | ✅ test_quality_gates | PreCommit |
| .gitignore 排除内部文档 | ✅ | ✅ test_quality_gates | PreCommit |

---

## 错误模式防护率

- 已记录错误模式: **0 个**
- 有工程化防护 (Sensor/Hook): **0 个** ✅
- 仅文档记录: **0 个** ❌
- **防护率**: **N/A**(无错误模式记录)

---

## TEAM_CHAT 文件状态

| 指标 | 值 |
|------|-----|
| 当前行数 | ~10(初始化) |
| 上次归档 | 从未 |
| 状态 | 🟢 健康 (< 3,000 行) |

---

## Harness 评分

| 维度 | 当前 | 目标 | 说明 |
|------|:----:|:----:|------|
| Guides(前馈)| 7/10 | 8/10 | CLAUDE.md + 7 角色文件 + MULTI_AGENT_PORTING_GUIDE |
| Sensors(反馈)| 4/10 | 6/10 | 2 个 pytest 文件;无 GitHub Actions CI(Founder 决定暂不做) |
| 计算性控制 | 3/10 | 5/10 | PreCommit hook(仅本地);缺 file whitelist 越权检测 |
| 编排设计 | 7/10 | 8/10 | 5 层协作架构移植完整;缺 xhteam 实战 dogfood |

---

## 待提升项(优先级排序)

1. **P0** - 完成 Phase 2: 7 个 Agent 角色 .md 文件 + CLAUDE.md
2. **P1** - 把 file whitelist 越权检测加入 test_architecture.py
3. **P2** - 用 xhteam skill dogfood 一个真实 TASK,验证协作流程
4. **P3** - 加入微信小程序尺寸限制 quality gate(主包 2MB / 总包 20MB)
5. **P3** - 加入代码重复检测(Markdown 渲染在 4 处重复)

---

## 最近变更记录

- **2026-04-24**: Day 1 初始化完成
  - Phase 1 基础骨架(.team-brain/ / .claude/agents/ 21 progress / settings.json / tests 三件套 / HARNESS_HEALTH.md 自身)
  - Sensor 覆盖基础架构规则(15 条 test)
  - 待做: Phase 2 核心内容(CLAUDE.md + 7 角色 md + 3 专属 skills)
