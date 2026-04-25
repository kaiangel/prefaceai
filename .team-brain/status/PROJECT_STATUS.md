# 项目状态看板

> 维护者: PM(Coordinator 兼任)
> 更新频率: 每周一更新,或每次 session 后

## 2026-04-25 Session 3 Wave 2 全部完成(Round 3 收官)

| 维度 | 状态 |
|------|------|
| 项目名 | 序话(xuhua-wx) |
| 版本 | v0.9.6.8 |
| 平台 | 微信小程序 |
| 前端代码 | `xuhua-wx/`(remote: `kaiangel/prefaceai`,main 分支) |
| 后端代码 | `xuhua-wx/sumai/`(独立 git,remote: `101.132.69.232:sumai.git`,master 分支) |
| 部署地址 | https://www.duyueai.com / https://api.xuhuaai.com |
| App ID | wx748c6d66700c159a |
| AI 模型数 | **15 个**(3 文本 + 5 图像 + 6 视频 + 1 Agent)— Wave 2 R2 下架 hunyuan,新增 wanxiang 后端 |
| 代码规模 | 前端 ~7900 行 JS(hunyuan 清除后)+ 后端 ~13700 行 Python(validate_and_deduct 新增) |
| **主力 LLM** | **Qwen 3.6 系列** — 免费 qwen3.6-flash-2026-04-16 / Pro qwen3.6-plus-2026-04-02 |
| **凭证管理** | ✅ 主文件已外移到 `.env`(RED-002 Wave 2 R1) + python-dotenv;生产部署按 RED-002 env 指南 |
| **并发安全** | ✅ validate_and_deduct 事务保护 31 端点全覆盖(SELECT FOR UPDATE,Round 3 完成) |
| **Stage 1 三档** | ✅ 前端 UI(Wave 1)+ 后端 directive(Round 3)+ 前端透传(Round 3),端到端就绪 |
| 测试覆盖 | 前端 18/18 pytest(持平)+ 后端 **92 passed** / 95 skipped / 3 xfailed / 2 xpassed(Wave 2 收官基线) |
| CI/CD | ❌ 无(Founder 决定暂不引入) |
| 多 Agent 系统 | ✅ Wave 2 R1+R2 两轮 dogfood 成功(6 teammate 产出 0 修复) |
| 核心定位 | AI Prompt 优化工具(中文/多模态) |
| Beachhead | 设计师 + 内容创作者 + 日常复杂任务人群 |
| 付费用户 | 几十个 |
| 典型使用频率 | 一周 3-4 次 |
| 已知警报 | 🟢 全 P0 红警解除(RED-001/002 ✅ + RED-003 D014 降级 P3)/ 🟢 P1 黄警解除(YELLOW-001 方案 Y ✅ + YELLOW-004 TOCTOU 全端点 ✅)/ 🟢 6 灰留作 Stage 2+ |

### 已完成里程碑(2026-04-24)

- Session 1: 战略讨论 + Beachhead 锁定
- Session 2: PORTING Phase 1-4 + sumai 深度扫描 + sumai/CLAUDE.md
- Session 3 Wave 1: GitHub 迁移 + 4 teammate 并行(Qwen 迁移 + 证书整理 + 测试扩展 + Stage 1 UX)
- Session 3 Wave 2 Round 1: 3 teammate(RED-002 + 基线 + env 指南草稿)
- Session 3 Wave 2 Round 2: 3 teammate(TOCTOU 基础 + 方案 Y + hunyuan 清除 + env 指南定稿)

### 决策累计

D001-D008(Session 1-2)+ D009-D013(Wave 1)+ D014-D016(Wave 2)= **16 条**

### Wave 2 Round 3 ✅ 收官(2026-04-25)

- R3-A complexity 三档 system prompt directive(D016)
- R3-B 31 端点全切 validate_and_deduct + 旧函数删除
- R3-C 前端 generateContent + generateImageDescription 透传 complexity
- R3-D test_complexity 3 stub 激活 PASS + 测试清理

### 待后续 Session

- Sean Ellis 40% 真实测量(Stage 1 上线后)
- RED-003 git-filter-repo + 证书轮换(D014 P3 推迟)
- TLS 证书轮换(合适窗口)
- 真机验证 Stage 1(Wave 2 全部完成后)
