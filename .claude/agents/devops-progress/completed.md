# DevOps(运维) - 已完成任务记录

> 创建日期: 2026-04-24
> 上次更新: [2026-04-24 23:15] Session 3 Wave 2 Round 2
> 角色: devops

---

## 已完成任务

### [2026-04-24] Wave 1 · RED-003 简化 + sumai .DS_Store 清理

**任务来源**: PM Lead (Coordinator, Opus 4.7) Session 3 派发

**完成内容**:

1. **sumai/.gitignore 更新**
   - 追加 `cert/` / `*.key` / `*.pem` / `*.p12` / `*.crt` — 证书和私钥
   - 追加 `**/.DS_Store` — 覆盖所有子目录（原有 `.DS_Store` 只匹配根目录）
   - 追加 `.env.local` / `.env.*.local` — RED-002 准备
   - 追加 `*.pyc` / `.pytest_cache/` — Python 缓存补充

2. **git rm --cached 移除已 tracked 文件**（sumai 独立仓库）
   - 移除 `.DS_Store`（根目录）
   - 移除 `bigmodel/.DS_Store`
   - 移除 `deepseek/.DS_Store`
   - 移除 `static/.DS_Store`
   - 移除 `cert/apiclient_key.pem`（微信支付商户私钥）
   - 移除 `cert/apiclient_cert.p12`（微信支付商户证书）
   - 移除 `cert/apiclient_cert.pem`（微信支付商户证书 PEM）
   - 移除 `cert/www.duyueai.com.key`（域名 TLS 私钥）
   - 移除 `cert/www.duyueai.com.pem`（域名证书）
   - 移除 `cert/prefaceai.net.key`（prefaceai.net TLS 私钥）
   - 移除 `cert/prefaceai.net.pem`（prefaceai.net 证书）
   - 移除 `cert/api.xuhuaai.com/api.xuhuaai.com.key`（子域名 TLS 私钥）
   - 移除 `cert/api.xuhuaai.com/api.xuhuaai.com.pem`（子域名证书）
   - **共 13 个文件从 git index 移除，本地文件完整保留**

3. **写 Founder 操作指南**
   - 创建 `sumai/docs/RED-003_git_history_cleanup_guide.md`（约 200 行）
   - 内容：为什么清历史 / git-filter-repo 安装 / 具体命令 / 破坏性警告 / 证书轮换步骤 / 操作记录表

**验收结果**:
- `git ls-files .DS_Store` → 空 ✅
- `git ls-files cert/` → 空 ✅
- `git check-ignore -v cert/apiclient_key.pem .DS_Store` → 匹配规则 ✅
- 本地 `cert/` 目录完整 ✅
- 本地 `.DS_Store` 文件存在 ✅
- `sumai/docs/RED-003_git_history_cleanup_guide.md` 存在 ✅

**后续（Founder 外部执行）**:
- commit 当前 staged 改动
- 执行 `git filter-repo` 清历史
- force push 到 remote
- 通知 Co-founder 重新 clone
- 轮换所有泄露证书（最高优先级：微信支付商户证书）

---

### [2026-04-24] Wave 2 Round 1 · 生产 env 迁移指南 + RED-003 D014 注解

**任务来源**: PM Lead (Coordinator, Opus 4.7) Session 3 Wave 2 Round 1 派发

**完成内容**:

1. **新建 `sumai/docs/RED-002_env_migration_guide.md`**(约 360 行,中文,共 7 章)
   - § 1 为什么外移:合规 + 泄露风险 + 弱 `app.secret_key` 分析
   - § 2 本地开发:`.env.example` 复制流程 / 填凭证来源 / `python-dotenv` 安装 / 本地启动验证方法
   - § 3 生产环境注入:对比 4 种方案 —— (a) Supervisor environment= 单行 / (a') Supervisor + start.sh + EnvironmentFile 组合 / (b) systemd EnvironmentFile / (c) 应用目录 .env,**推荐 (a')**
   - § 4 迁移 Checklist:Phase 1-4(Wave 2 R1 准备 / 本地验证 / 生产部署 / 生产验证),21 个 checkbox
   - § 5 回滚方案:三种症状对应操作(全局崩溃 / 个别端点 KeyError / 微信支付凭证错)
   - § 6 变量清单占位:预先列出 20+ KEY 名和用途注释,等 @backend W2-1 补全
   - § 7 附录:相关文件 / 风险评估表 / 长期演进(KMS 接入规划)

2. **`sumai/docs/RED-003_git_history_cleanup_guide.md`** 开头追加 D014 banner
   - 警告符号 + Founder 决策说明(证书暂不轮换,TLS 推迟)
   - 列出 4 条触发条件(付费 >500 / 异常交易 / 证书共享 / Stage 2+)
   - 原有 git-filter-repo 操作步骤未改动,仅在开头加状态说明

3. **`.team-brain/status/PROJECT_STATUS.md`** 一行注解
   - "已知警报"字段 RED-003 后加 `(D014 证书暂不轮换,git-filter-repo 待触发)`

**验收结果**:
- `sumai/docs/RED-002_env_migration_guide.md` 存在,7 章齐全 ✅
- `sumai/docs/RED-003_git_history_cleanup_guide.md` 开头有 D014 banner ✅
- `.team-brain/status/PROJECT_STATUS.md` 有 RED-003 D014 注解 ✅
- 未改动任何代码文件(.py / .js / .json 等)✅
- 指南中文,排版清晰(表格 + shell + checklist)✅

---

### [2026-04-24 23:15] Wave 2 Round 2 · env 指南变量清单回填 + 部署 checklist + D016 命名说明

**任务来源**: PM Lead (Coordinator, Opus 4.7) Session 3 Wave 2 Round 2 派发

**完成内容**:

1. **补齐 `sumai/docs/RED-002_env_migration_guide.md` § 6 变量清单**(由占位变为 27 变量完整清单)
   - 12 个分类表格:Flask(1) / MySQL(5) / Redis(3) / LLM(3) / 微信开放平台 3 组(9) / 微信小程序(2) / 微信支付(4) / OSS(4) / Stripe(3)
   - 每个变量含 `[ ]` Founder checkbox + ✅必填/🟢可选 + 🔴强读/🟢软读 + 默认值
   - 特殊说明:ANTHROPIC_API_KEY 强读但值可空(死代码保留,RED-001 迁完)
   - 微信支付私钥 PEM 文件不进 env,需带外传输 + `cert/*.pem` 已 gitignore
   - 统计:27 个变量合计,18 强读必填 / 9 软读有默认

2. **新增 § 6a 生产部署 step-by-step checklist**(12 步)
   - Step 1 SSH 到生产
   - Step 2 备份 Supervisor 配置 + git pull(含不立即 restart 警告)
   - Step 3 python-dotenv 安装验证
   - Step 4 创建 `/etc/sumai.env` + 权限 640 / chown root:www-data
   - Step 5 创建 `/home/www/sumai/start.sh`(source /etc/sumai.env + exec python3)+ 权限 750
   - Step 6 改 Supervisor `command=` 指向 start.sh
   - Step 7 supervisorctl reread / update / restart + status 检查
   - Step 8 curl -N smoke test `/aiAgentStream`(期望 SSE 非 500)
   - Step 9 tail -50 demo.log 检查 KeyError / EnvironmentError / Traceback
   - Step 10 ⚠️ FLASK_SECRET_KEY 切换警告(PC Web 用户全登出 / 小程序不影响 / 选低峰窗口)
   - Step 11 1 小时观察期(双终端持续监控)
   - Step 12 成功标记 + 通知团队 + GRAY-004 预告
   - 末尾"应急备忘"反向索引 § 5 回滚流程(Step 2-6 无影响 / Step 7 restart 失败 / Step 8-9 smoke 失败 / Step 10-11 支付中断)

3. **新增 § 6b complexity 三档命名说明**(D016)
   - 引用 D016 决策(`quick / standard / professional`)
   - 说明 complexity 走 HTTP 参数,不走 env(无直接变量影响)
   - 后端代码档位 id 必须用三标识
   - Tester `test_complexity.py` 按本命名,`test_sse_complexity_routing.py` 旧 `deep` Round 3 清理
   - 预留 `COMPLEXITY_DEFAULT` 未来软读扩展点

4. **§ 4 Phase 1 checklist 全部标 `[x]`**:Round 1 + Round 2 任务已完成,后续可进入 Phase 2-3

5. **文件头状态更新**:从"Round 1 启动前草稿" → "Round 2 完成,可进入 Phase 2 本地验证 / Phase 3 生产部署"

**验收结果**:
- `sumai/docs/RED-002_env_migration_guide.md` § 6 变量清单 27 个变量完整 ✅
- § 6a 部署 checklist 12 步(超 10 步最低要求)✅
- § 6b D016 命名说明已记录 ✅
- `.claude/agents/devops-progress/` 三文件更新,时间戳 `[2026-04-24 23:15]` ✅
- 指南中文,排版清晰(表格 + shell 命令 + checklist)✅
- 未改动代码文件 / 未改动其他 agent progress ✅
- 未自行 commit(按协议等 PM 审查)✅

**未改动的文件**(本 Round 不在范围):
- `.env.example`(@backend 产出,仅作 Read 参考)
- RED-003 指南(Round 1 已更新)
- PROJECT_STATUS.md / KNOWN_ISSUES.md / PENDING.md(PM 领地,由 PM 统一更新)

**待 PM 审查 + 统一 commit**:
- **sumai remote**: `sumai/docs/RED-002_env_migration_guide.md`(更新)
- **xuhua-wx remote**: `.claude/agents/devops-progress/{current,completed,context-for-others}.md`(三件套)+ `.team-brain/TEAM_CHAT.md`(追加 Round 2 完成消息)

---

## 上次更新记录

- 2026-04-24: 多 Agent 系统初始化
- 2026-04-24 Session 3: Wave 1 RED-003 任务完成
- 2026-04-24 Session 3 Wave 2 Round 1: RED-002 env 迁移指南 + RED-003 D014 banner
- [2026-04-24 23:15] Session 3 Wave 2 Round 2: env 指南变量清单 + 12 步部署 checklist + D016 命名说明 ← 本次
