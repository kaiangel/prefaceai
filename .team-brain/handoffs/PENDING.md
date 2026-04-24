# 待交接事项

> 维护者: PM (Coordinator 在兼 PM 模式下维护)
> 规则: 追加式,完成后打 ✅

---

## 当前待交接(2026-04-24 Session 2 后)

### P0 红色警报处理(Stage 1 开工前必须对齐)

#### [B1-a] 迁移 sumai 主力模型 Anthropic → Qwen Flash 3.6
- **背景**: RED-001,Anthropic 是境外服务 + API Key 硬编码,与合规决策 D006 冲突
- **具体**:
  - 把 `sumai/stream.py` 和 `sumai/stream_en.py` 里的 `claude-haiku-4-5` 迁移到 `qwen3.6-flash-2026-04-16`
  - `qwen3-vl-plus`(图生 prompt)可升级到 `qwen3-vl-flash-2026-01-22`(更快更省)
  - 预期 12+ 端点改动
  - **必须**: 迁移前做 prompt 质量 A/B 对比,确保 Qwen 输出不劣于 Claude
- **负责**: @backend
- **优先级**: P0(合规底线)
- **前置**: 无
- **预估工作量**: 1-2 天(包括 prompt 适配测试)

#### [B1-b] 凭证外移到 .env + 环境变量
- **背景**: RED-002,所有 API Key/密码/Secret 硬编码在 sumai 代码里
- **具体**:
  - 创建 `sumai/.env.example`(列变量名不列值)
  - 重构代码使用 `python-dotenv` 加载
  - 更新 `sumai/.gitignore` 确保 `.env` 不进 git
  - 生产服务器配置迁移(Supervisor env 或 systemd env)
- **负责**: @backend + @devops
- **优先级**: P0
- **前置**: 无
- **预估工作量**: 1 天

#### [B1-c] 清理 git 历史中的生产证书 + 轮换
- **背景**: RED-003,`sumai/cert/*.key` / `*.pem` / `*.p12` 已提交到 git
- **具体**:
  - 把 `cert/*.{key,pem,p12}` 加到 `sumai/.gitignore`
  - 用 `git-filter-repo` 或 `BFG Repo-Cleaner` 从 git 历史中清除(⚠️ 会改 commit hash,影响其他已 clone 的开发环境)
  - 轮换所有泄露的证书和私钥(域名 TLS + 微信支付商户)
- **负责**: @devops(需外部协助)
- **优先级**: P0
- **前置**: 确认没有其他开发者在 clone sumai 仓库本地版本(避免 rebase 冲突)
- **预估工作量**: 半天(核心清理)+ 证书轮换(需外部服务)

### P1 黄色警报处理

#### [B2-a] 确认 `/wanxiangStream` 处理方式(生产当前 404)
- **背景**: YELLOW-001,前端调用后端没实现
- **具体动作**:
  - Founder 手动在小程序选"通义万相"模式尝试生成视频,double-check 确认是坏的
  - 决策: 补后端(@backend 在 sumai 加端点) vs 下架(@frontend 从模型列表移除)
- **优先级**: P1(影响用户体验 + 品牌)
- **前置**: Founder 验证
- **预估工作量**: 1 小时(验证)+ 视决策定(1 天补后端 / 1 小时下架)

#### [B2-b] 清理 `/recent_generation` 前端调用 — 🟡 **Founder 决策: 先不管**(2026-04-24)
- **背景**: YELLOW-003,app.js:521 调用失败返回 null,用户无感
- **当前状态**: 优先级降为 P3,留作未来顺手清
- **负责**: @backend(未来 Stage 2+ 重构期顺手处理)

#### [B2-c] 清理 `/labelSync` 前端调用 — ✅ **2026-04-24 已完成**
- **背景**: YELLOW-002,前端假同步,实际靠 `/history` 带 style 字段跨设备同步
- **已执行**:
  - ✅ 删 `app.js` 的 `syncLabelToCloud` / `getLabelFromCloud` 函数定义(原 L419-476)
  - ✅ 删调用点 L262(`saveSessionLabel` 内)+ L287(`getSessionLabel` 的云端回退块)
  - ✅ 保留 NOTE 注释指向 YELLOW-002 记录
  - ✅ app.js 从 995 行减至 922 行
  - ✅ pytest 18/18 PASS + node --check 通过
- **决策者**: Founder(2026-04-24)
- **后续**: sumai 后端的 `/labelSync` 端点残留可以在某次 sumai 重构时清理(非紧急)

### P1 Stage 1 开工前准备

#### [B4] 为 sumai 写 CLAUDE.md
- **背景**: GRAY-002,sumai 10000+ 行代码无 CLAUDE.md,agent 难工作
- **具体**: 基于 `.team-brain/analysis/sumai-deep-dive-2026-04-24.md` 写
- **负责**: Coordinator(本 session 进行中,Sonnet agent 辅助)
- **优先级**: P1
- **状态**: 🟡 本 session 进行中

#### [B5] 为 sumai 补测试骨架
- **背景**: GRAY-001,sumai 零自动化测试
- **具体**: pytest + pytest-flask + unittest.mock,覆盖 8 个维度(架构/端点/业务/SSE/LLM/支付/上传/schema)
- **负责**: Coordinator(本 session 进行中,Sonnet agent 辅助)
- **优先级**: P1
- **状态**: 🟡 本 session 进行中

### P2 Stage 1 真正开工前的前置

#### [Stage1-prep-1] 与 Co-founder 对齐
- Stage 1 首期时长(建议 2 周)
- Stage 1 具体成功指标("专业项目"档选择率 >30% + 付费转化率提升 X%)
- 开工时间表
- **(Founder 已说不需要对齐,留作备忘)**

#### [Stage1-prep-2] 设计三档复杂度 UX 草稿
- 快速想法 / 深度创作 / 专业项目
- 首页 Hero 文案新定位(3 个候选)
- **负责**: @frontend + @resonance + @pm(协同)

#### [Stage1-prep-3] 设计 "专业项目" system prompt 三档配置
- 需要**先在 sumai 完成 B1-a(Qwen 迁移)** 再做此任务(否则要在 Claude 和 Qwen 两套 prompt 上都改)
- **负责**: @backend

### P2 其他整理(Stage 2 之后)

- **[GRAY-003]** 序话小程序代码重构: Markdown 渲染去重 + 模型检测去重
- **[GRAY-004]** sumai 废弃文件清理(`claude_*.py` / `app.py_back` / `deepseek/` / `bigmodel/` / `moonshot.py`)→ 移到 `sumai/legacy/` 或删除
- **[GRAY-005]** 前端生成状态机重构(合并 isGenerating / isGenerationActive / isCompletelyTerminated)

---

## 历史记录(完成的交接)

- 2026-04-22: Session 1 战略讨论完成 ✅
- 2026-04-24: PORTING Phase 1-4 完成 ✅
- 2026-04-24: GitHub 与本地对齐 ✅
- 2026-04-24: sumai 克隆到本地 + Explore 深度扫描 ✅
- 2026-04-24: KNOWN_ISSUES.md 创建 ✅
- 2026-04-24: sumai-deep-dive-2026-04-24.md 归档 ✅
