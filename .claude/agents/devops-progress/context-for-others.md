# DevOps(运维) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 全部完成后(R3 期间无任务)
> 角色: devops

---

## 环境状态

| 环境 | 状态 | 最近更新 |
|------|------|----------|
| 本地 xuhua-wx | ✅ 正常 | 2026-04-24 |
| sumai（本地副本） | ✅ 正常，RED-003 staged + Wave 2 Round 1 docs + Wave 2 Round 2 docs 待 commit | 2026-04-24 Session 3 R2 |
| 微信开发版 | ✅ 正常 | 2026-04-24 |
| 微信体验版 | — | — |
| 微信正式版 | v0.9.6.8 | — |
| sumai 生产（duyueai.com） | ✅ 运行中(仍用硬编码凭证,env 迁移待 Phase 3 执行) | — |

---

## 配置状态

- settings.json allow 清单: 21 条
- settings.local.json hooks: PreCommit + PrePush 已启用
- GitHub Actions CI: 未启用（Founder 决定，D004）
- sumai/.gitignore: 已更新（RED-003 规则追加，Wave 1 完成）
- sumai/.env.example: ✅ 存在（@backend W2-1 Round 1 产出，27 变量）
- sumai/.env: 本地开发存在，已验证 .gitignore 拦截（@backend W2-1 Round 1）

---

## RED-002 env 迁移(Wave 2 进度)

### 当前阶段: Phase 1 完成 ✅ → 等 PM 审查 + Founder 拍板 → Phase 2-3 执行

| Phase | 任务 | 状态 |
|-------|------|------|
| Phase 1 | @backend W2-1 代码改 + @devops 指南 | ✅ 完成(R1 + R2) |
| Phase 2 | 本地验证(`.env` 填值 + mainv2 启动 + pytest) | ⏳ 等 Founder/@tester |
| Phase 3 | 生产部署(按 § 6a 12 步) | ⏳ 等 Founder 拍板方案 + 执行 |
| Phase 4 | 生产验证(1 小时观察) | ⏳ |
| Phase 5 | 清理废弃文件硬编码(GRAY-004) | ⏳ 未来 Wave |

### 📋 完整变量清单(27 个)

**详见** `sumai/docs/RED-002_env_migration_guide.md` § 6,或 `.claude/agents/backend-progress/context-for-others.md`(@backend 原始发布)。

**简化概览**:

| 分类 | 变量数 | 必填(🔴强读) | 示例变量 |
|------|--------|---------------|---------|
| Flask | 1 | 1 | FLASK_SECRET_KEY |
| MySQL | 5 | 1 | MYSQL_PASSWORD |
| Redis | 3 | 1 | REDIS_PASSWORD |
| LLM | 3 | 3 | QWEN_API_KEY / ANTHROPIC_API_KEY(可空)/ VOLCENGINE_API_KEY |
| 微信 PC(duyueai) | 3 | 2 | WECHAT_OPEN_APP_ID/SECRET |
| 微信 PC(xuhua) | 3 | 2 | WECHAT_XUHUA_APP_ID/SECRET |
| 微信公众号 | 3 | 2 | WECHAT_GH_APP_ID/SECRET |
| 微信小程序 | 2 | 2 | WECHAT_MINI_APP_ID/SECRET |
| 微信支付 | 4 | 3 | WECHAT_PAY_MCHID/APIV3_KEY/CERT_SERIAL_NO |
| OSS | 4 | 2 | OSS_ACCESS_KEY_ID/SECRET |
| Stripe | 3 | 2 | STRIPE_SECRET_KEY / PUBLIC_KEY |
| **合计** | **27** | **18 强读 + 9 软读** | |

### 🚨 生产部署 checklist(12 步摘要)

详见 `sumai/docs/RED-002_env_migration_guide.md` § 6a。简要:

1. SSH 到 `101.132.69.232`
2. `cd /home/www/sumai` + 备份 Supervisor 配置 + `git pull`(**不立即 restart**)
3. 确认 `python-dotenv` 装了
4. 创建 `/etc/sumai.env` + `chmod 640` `chown root:www-data`
5. 创建 `/home/www/sumai/start.sh`(source env 后 exec python3)+ `chmod 750`
6. 改 Supervisor `command=` 指向 `start.sh`
7. `supervisorctl reread && update && restart sumai`
8. `curl -N` smoke test `/aiAgentStream`
9. `tail -50 demo.log` 检查无 KeyError
10. ⚠️ FLASK_SECRET_KEY 切换警告(PC Web 用户全登出,低峰执行)
11. 1 小时观察期(双终端持续监控)
12. 成功标记 + 通知团队

### ⚠️ FLASK_SECRET_KEY 切换警告(高优先级,给 Founder)

- **影响**:所有 PC Web 扫码登录用户(`duyueai.com` / `api.xuhuaai.com`)的 Flask session cookie 全部失效,需重新扫码登录
- **不影响**:微信小程序用户(走 openid,不依赖 Flask session)
- **建议窗口**:周一早 7:00-8:00 或其他低峰期
- **前置**:最好在 PC Web / 公众号 H5 页面加 Toast "系统已更新,请重新登录"
- **支付流程保护**:切换前暂停新订单 5 分钟,等老订单跑完

### 回滚策略(关键)

- Step 2-6 任一步失败 → 无影响,重做即可
- Step 7 restart 后起不来 → `cp /root/sumai.conf.bak.YYYYMMDD /etc/supervisor/conf.d/sumai.conf` + `git revert HEAD` + `supervisorctl restart`
- Step 8-9 smoke 失败 → 常见漏设某个 🔴 强读变量,`vim /etc/sumai.env` 补上后 restart
- 微信支付错 → 允许紧急 hotfix 硬编码恢复,事后补 .env(详见 § 5.3)

---

## D016 · complexity 三档命名记录

**2026-04-24 D016 决策**:complexity 三档命名统一为 **`quick / standard / professional`**(前端 `pages/index/index.js` 实际 id)。

**对各角色的影响**:
- @backend Round 3(W2-4): 实施 system prompt 三档时,代码 id 必须用 `quick` / `standard` / `professional`,禁用 `deep`
- @tester Round 3: 激活 `test_complexity.py` 3 skip;清理 `test_sse_complexity_routing.py` 的 `deep` 命名(改或删)
- @frontend: 已按此标准(CLAUDE.md Stage 1 Roadmap 的"快速想法/深度创作/专业项目"中文档位 id 对应 `quick/standard/professional`)
- @devops: env 迁移指南 § 6b 已记录该命名规则,无环境变量影响

---

## sumai git 状态(本地未 commit 改动清单)

**sumai remote**(等 PM 审查统一 push):
- Wave 1 产出:`.gitignore` 更新 + 13 个 cert/DS_Store staged 待删除 + `docs/RED-003_git_history_cleanup_guide.md`
- Wave 2 Round 1 产出:`docs/RED-002_env_migration_guide.md` 初稿 + RED-003 D014 banner
- Wave 2 Round 2 产出:**`docs/RED-002_env_migration_guide.md` 补齐(§ 6 变量清单 + § 6a 12 步 checklist + § 6b D016 说明)**
- @backend W2-1 产出(非 @devops 领地):`.env.example`(27 变量) + `mainv2.py` / `note.py` / `pay_stripe.py` / `stream.py` / `stream_en.py` + `tests/test_code2session.py`

**xuhua-wx remote**(等 PM 审查):
- `.claude/agents/devops-progress/{current,completed,context-for-others}.md`(三件套,本 Round 2 更新)
- `.team-brain/TEAM_CHAT.md`(追加 Round 2 完成消息)
- Round 1 产出:`.team-brain/status/PROJECT_STATUS.md`(RED-003 D014 注解)
- 其他 Agent 产出(进度、测试等)

---

## 待其他 Agent 注意

- **sumai 仓库独立**:改 sumai 代码必须在 `sumai/` 目录下 commit 到 sumai 的 remote,不能 commit 到 xuhua-wx
- **cert/ 不要再往 sumai git 添加任何证书文件**:gitignore 已配置
- **.env 文件绝对不能 commit**:`.gitignore` 第 27 行已拦截,@backend 已验证
- **commit message 请遵循规范**:feat/fix/chore prefix + 具体内容
- **发布前必须跑 pytest**:PreCommit hook 已配置
- **complexity 档位 id**:全员用 `quick / standard / professional`,禁用 `deep`(D016)

---

## 发布前 checklist(微信小程序 v0.9.6.9 或后续版本,未变动)

- [ ] git status 干净（无未提交改动）
- [ ] pytest tests/ 全绿
- [ ] @tester 5 关键流程手动回归通过
- [ ] 主包尺寸 < 2 MB
- [ ] project.config.json 版本号已 bump
- [ ] 清理本地 console.log / debug print
- [ ] TEAM_CHAT.md < 3000 行

---

## RED-003 后续（D014 后调整,Round 1 未变动）

**⚠️ 2026-04-24 D014 决策**: 证书暂不轮换,git-filter-repo 待触发。详见 `sumai/docs/RED-003_git_history_cleanup_guide.md` 开头 banner。当前状态下仅 `.gitignore` 防御已生效,不需要立即操作。

**触发条件**(满足任一即执行原 guide 全部步骤):
- 付费用户超 500 人
- 发现异常交易 / 证书被意外共享 / SSH 密钥泄露
- Stage 2+ 对外开放更多协作者前

---

## 给各 Agent 的专项提醒

### @backend
- W2-1 代码改动已完成,进入 PM 审查阶段
- Round 3(W2-4)实施 complexity 三档 system prompt 时,档位 id 必须用 `quick / standard / professional`(D016)
- 未来 GRAY-004 清理废弃文件硬编码时请参考 § 6 清单里的 🔴 强读变量

### @tester
- 生产部署后(Phase 4)需跑 smoke test:小程序真机测试 `/aiAgentStream` + `/describeImageStream` + 支付流程
- 可考虑新增 sensor:`test_env_strict_read_fails_without_required_vars`(@backend 的建议)
- Round 3 激活 `test_complexity.py` 3 skip(W2-4 后)
- `test_sse_complexity_routing.py` 的 `deep` 命名 Round 3 清理

### @frontend
- 无 W2-1 / W2-R2 影响(API 契约未变)
- complexity 三档入口 UI 使用 `quick / standard / professional` id(D016 已对齐)

### @pm
- Wave 2 Round 2 完成,可审查 commit
- 两套 remote 需分别 push:sumai docs 一个文件 → sumai remote;xuhua-wx 三件套 + TEAM_CHAT → xuhua-wx remote
- Founder 方案 (a') vs (b) 需拍板(本指南默认推荐 (a'))才能进入 Phase 3

### Founder
- **决策点**:选方案 (a') Supervisor + start.sh + EnvironmentFile(推荐,最小改动)**还是** (b) 切 systemd(借机升级)
- **切换 FLASK_SECRET_KEY 的窗口**:建议周一早 7:00(PC Web 用户会全部登出,小程序不受影响)
- **18 个 🔴 强读变量的真值收集**:建议从 1Password / 密码管理器拿齐后再执行 Phase 3
