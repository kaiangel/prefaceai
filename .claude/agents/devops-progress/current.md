# DevOps(运维) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 全部完成后(R3 期间 @devops 无任务)

---

## Wave 2 全部完成后状态(2026-04-25)

✅ Wave 2 全部完成。@devops Round 1+R2 完成的 RED-002 env 迁移指南(772 行)+ 12 步部署 checklist 已就绪,Founder 可按指南启动生产部署。@devops 在 R3 无任务(R3 是 @backend 三档 + @frontend 透传 + @tester 测试激活,无运维改动)。

下一步等 Founder 决策:
- 启动生产 .env 配置 + restart sumai
- 或 Wave 3 / Stage 1 数据观察期再启用 @devops

---

## 历史(Round 2)

> 上次原标题: [2026-04-24 23:15] Session 3 · Wave 2 Round 2
> 角色: devops

---

## 当前状态

### Wave 2 Round 2 任务: env 指南变量清单回填 + 部署 checklist + D016 说明 ✅ 完成

**任务** (由 PM Lead Coordinator 派发):
- A. 回填 `sumai/docs/RED-002_env_migration_guide.md` § 6 变量清单(基于 @backend .env.example 27 变量)
- B. 强化生产部署 step-by-step checklist(至少 10 步)
- C. 追加 D016 complexity 命名说明(`quick / standard / professional`)
- D. 刷新 devops-progress 三件套

**状态**: 全部完成,等待 PM 审查后统一 commit(sumai remote + xuhua-wx remote 分开)

---

## 产出清单(Round 2)

### 1. `sumai/docs/RED-002_env_migration_guide.md` 大幅补齐

- **§ 1-5 章节未动**(Round 1 产物),仅在文件头部状态行更新 Wave 2 Round 2 已完成
- **§ 6 变量清单**(新):12 个分类表格,27 个变量逐一列出
  - 6.1 Flask(1 个)
  - 6.2 MySQL(5 个)
  - 6.3 Redis(3 个)
  - 6.4 LLM(3 个:QWEN/ANTHROPIC/VOLCENGINE)
  - 6.5-6.7 微信开放平台(3 组 × 3 变量 = 9 个:PC duyueai / 序话 xuhua / 公众号 GH)
  - 6.8 微信小程序(2 个)
  - 6.9 微信支付(4 个,含私钥文件路径说明)
  - 6.10 OSS(4 个)
  - 6.11 Stripe(3 个)
  - 6.12 统计(27 个合计,18 强读必填 / 9 软读有默认)
- 每个变量前有 `[ ]` checkbox 供 Founder 部署时标记
- 每个变量标注 ✅必填 / 🟢可选 + 🔴强读 / 🟢软读 + 默认值
- **§ 6a 生产部署 step-by-step checklist**(新):12 步,每步含具体 shell 命令
  - Step 1 SSH
  - Step 2 备份 Supervisor 配置 + git pull(含"pull 后不立即 restart"警告)
  - Step 3 `python-dotenv` 安装验证
  - Step 4 创建 `/etc/sumai.env` + `chmod 640` `chown root:www-data`
  - Step 5 创建 `/home/www/sumai/start.sh` + `chmod 750`
  - Step 6 改 Supervisor `command=` 指向 start.sh
  - Step 7 `supervisorctl reread/update/restart`
  - Step 8 `curl -N` smoke `/aiAgentStream`
  - Step 9 `tail -50 demo.log` 检查无 KeyError
  - Step 10 ⚠️ FLASK_SECRET_KEY 切换警告(PC Web 用户全登出)
  - Step 11 1 小时观察期(双终端持续监控)
  - Step 12 成功标记 + GRAY-004 废弃文件清理预告
  - 末尾"应急备忘"快速索引回滚流程
- **§ 6b complexity 三档命名说明**(新):
  - 引用 D016 决策(`quick / standard / professional`)
  - 说明与 env 的关系(无直接变量影响,作 HTTP 参数)
  - 后端实施档位 id 必须用三标识
  - 预留未来 `COMPLEXITY_DEFAULT` 软读变量扩展点
- **§ 4 Phase 1 checklist**: Round 1-2 任务全部标 `[x]`

### 2. 其他文件(未改)

- RED-003 指南 / PROJECT_STATUS.md:Round 1 已更新,本次未再改
- `.env.example` / 代码文件:@backend 领地,未碰

---

## 后续依赖 / 等待事项

- **等 PM 审查通过**: 才能 commit(sumai docs 一个 + xuhua-wx progress 三件套)
- **等 Founder 决策方案 (a')**: 本指南默认推荐 (a') Supervisor + start.sh + EnvironmentFile,Founder 拍板后可执行 Phase 3
- **Phase 2-3 何时执行**: @backend W2-1 代码 push 到 sumai remote 后,Founder / @devops 可按 § 6a 12 步部署

---

## Wave 2 剩余 Round(非本次范围)

- Round 3 (等 @backend W2-4 实施 complexity 三档 system prompt 后):
  - @tester 激活 `test_complexity.py` 3 skip
  - @tester 清理 `test_sse_complexity_routing.py` 的 `deep` 命名
  - @devops 无剩余任务(env 迁移已全部完成)

---

## 阶段性进展

- 2026-04-24 Session 3 Wave 1: RED-003 简化 + sumai .DS_Store 清理 ✅
- 2026-04-24 Session 3 Wave 2 Round 1: 生产 env 迁移指南 + D014 状态注解 ✅
- 2026-04-24 Session 3 Wave 2 Round 2: env 指南变量清单回填 + 12 步部署 checklist + D016 命名说明 ✅ ← 本次

---

## 上次更新记录

- 2026-04-24 Session 3: Wave 1 RED-003 任务完成
- 2026-04-24 Session 3 Wave 2 Round 1: RED-002 env 迁移指南初稿 + RED-003 D014 banner
- [2026-04-24 23:15] Session 3 Wave 2 Round 2: 变量清单 + 部署 checklist + D016 说明 ← 本次

---

## 2026-04-27 + 2026-04-28 同步 note

- **2026-04-27**:Stage 1 真机回归 + 三轮 UX hotfix(scroll-view enable-flex + display:flex 双开 bug,真因 GRAY-007 已纳入 KNOWN_ISSUES)。@frontend 主修,devops 角色未参与。详见 `daily-sync/2026-04-27.md`。
- **2026-04-28**:Founder 完成 5 人 Mom Test + Sean Ellis 40% 数据,验证"复杂任务 beachhead"假设;**D017 决策 Stage 1 三档复杂度下架**(Founder verdict "鸡肋");**D018 决策 Stage 2 启动**,先做 C 方案上下文注入。详见 `daily-sync/2026-04-28.md` + `decisions/DECISIONS.md`。
- 待 PM 出 spawn 拆解规划等 Founder "可以" 后,devops 角色可能被派发任务(详见 `handoffs/PENDING.md`)。
