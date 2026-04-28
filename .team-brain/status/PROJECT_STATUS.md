# 项目状态看板

> 维护者: PM(Coordinator 兼任)
> 更新频率: 每周一更新,或每次 session 后

## 2026-04-28 · Stage 1 三档下架决定 + Stage 2 启动

| 维度 | 状态 |
|------|------|
| 项目名 | 序话(xuhua-wx) |
| 版本 | v0.9.6.8 |
| 平台 | 微信小程序 |
| 前端代码 | `xuhua-wx/`(remote: `kaiangel/prefaceai`,main 分支) |
| 后端代码 | `xuhua-wx/sumai/`(独立 git,remote: `101.132.69.232:sumai.git`,master 分支) |
| 部署地址 | https://www.duyueai.com / https://api.xuhuaai.com |
| App ID | wx748c6d66700c159a |
| AI 模型数 | 15 个(3 文本 + 5 图像 + 6 视频 + 1 Agent) |
| 主力 LLM | Qwen 3.6 系列(免费 qwen3.6-flash / Pro qwen3.6-plus)|
| 凭证管理 | ✅ 主文件已外移 .env(RED-002 解)|
| 并发安全 | ✅ 31 端点 SELECT FOR UPDATE 全覆盖(YELLOW-004 解)|
| **Stage 1 三档** | 🔴 **D017 决策下架**(2026-04-28,Founder verdict "鸡肋",数据 + 用户视角问题)|
| **Stage 2** | 🚀 **启动中**(D018 选 C 方案 · 上下文注入)|
| 测试覆盖 | 前端 18/18 pytest + 后端 92 passed / 95 skipped / 3 xfailed / 2 xpassed |
| CI/CD | ❌ 无(Founder 决定暂不引入) |
| 多 Agent 系统 | ✅ Wave 1+2(三轮 13 teammate)+ 04-27 三轮 hotfix(3 teammate)+ 04-28 Stage 1 下架 + Stage 2(待启动)|
| 核心定位 | AI Prompt 优化工具(中文/多模态)→ 转向"复杂任务 prompt 工作台 + Investment 阶段"|
| Beachhead | 设计师 + 内容创作者 + 日常复杂任务人群(5 人 Mom Test 已验证)|
| 付费用户 | 几十个 |
| 已知警报 | 🟢 P0 红警全闭环 / 🟢 P1 黄警全解决 / 🟢 GRAY-001~007 留 Stage 2+ |

### 已完成里程碑

- 2026-04-22 Session 1: 战略讨论 + Beachhead 锁定
- 2026-04-24 Session 2: PORTING + sumai 深度扫描
- 2026-04-24 Wave 1: GitHub 迁移 + 4 teammate 并行
- 2026-04-24~25 Wave 2 R1+R2+R3: 9 teammate 三轮收官
- 2026-04-27: 三轮 UX hotfix(scroll-view enable-flex bug 真因)
- **2026-04-28: Stage 1 三档下架 + Stage 2 启动**

### 决策累计

D001-D008(Session 1-2)+ D009-D013(Wave 1)+ D014-D016(Wave 2)+ **D017-D018(Stage 1 下架 + Stage 2 启动)= 18 条**

### 待 Stage 2 第一个最小补丁

**C 方案 · 上下文注入(Conversational Refinement)**(D018):
- 用户生成 prompt 后,加"基于这个 prompt 继续优化"按钮
- 把上一轮 output 作为 context 喂回去,生成迭代版本
- 前端 + 后端各 2-3 天工作量
- 验证 Hooked 框架 Investment 阶段补丁的核心假设

### 待后续 Stage 2 / Stage 3

- Project 容器(C 方案数据好后启动)
- Prompt 版本管理
- 个人知识库
- Web 端工作台(Stage 3,条件:Stage 2 数据好)

### Founder 外部任务(进行中)

- 🟡 生产部署 .env(按 RED-002 env 迁移指南)
- 🟡 TLS 证书轮换(D014 P3,合适窗口)
