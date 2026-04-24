# 项目状态看板

> 维护者: PM(Coordinator 兼任)
> 更新频率: 每周一更新,或每次 session 后

## 2026-04-24 Session 3 后

| 维度 | 状态 |
|------|------|
| 项目名 | 序话(xuhua-wx) |
| 版本 | v0.9.6.8 |
| 平台 | 微信小程序 |
| 前端代码 | `xuhua-wx/`(remote: `kaiangel/prefaceai`,main 分支) |
| 后端代码 | `xuhua-wx/sumai/`(独立 git,remote: `101.132.69.232:sumai.git`,master 分支) |
| 部署地址 | https://www.duyueai.com / https://api.xuhuaai.com |
| App ID | wx748c6d66700c159a |
| AI 模型数 | 16 个(3 文本 + 5 图像 + 7 视频 + 1 Agent) |
| 代码规模 | 前端 ~8000 行 JS + 后端 ~13500 行 Python |
| **主力 LLM** | **Qwen 3.6 系列**(Session 3 RED-001 迁移后) — 免费 qwen3.6-flash / Pro qwen3.6-plus |
| 测试覆盖 | 前端 18 个 pytest + 后端 205 个 pytest(88 passed) |
| CI/CD | ❌ 无(Founder 决定暂不引入) |
| 多 Agent 系统 | ✅ 运行中(Coordinator 兼 PM Lead,5 个 teammate 角色) |
| 核心定位 | AI Prompt 优化工具(中文/多模态) |
| Beachhead | 设计师 + 内容创作者 + 日常复杂任务人群 |
| 付费用户 | 几十个(待 Stage 1 数据) |
| 典型使用频率 | 一周 3-4 次 |
| 已知警报 | 🔴 3 红 / 🟡 3 黄 / 🟢 6 灰(详见 KNOWN_ISSUES.md) |

### 已完成里程碑

- 2026-04-22 Session 1: 战略讨论 + Beachhead 锁定
- 2026-04-24 Session 2: 多 Agent 系统 PORTING Phase 1-4 + Sumai 深度扫描
- 2026-04-24 Session 3: GitHub 迁移 + Wave 1 并行(Qwen 迁移 + 证书整理 + 测试扩展 + Stage 1 UX 先行)

### 待 Wave 2 / 后续 Session

- RED-002 凭证外移 .env(.env.example + python-dotenv 接入 + app.secret_key 强化)
- 方案 Y 实施(新建 /wanxiangStream + 删 hunyuan)
- Stage 1 后端 complexity 三档 system prompt
- Sean Ellis 40% 真实测量
- RED-003 git-filter-repo + 证书轮换(需 Founder 外部操作)
