# 序话(xuhua-wx)Team Chat

> 规则: 追加式(append-only),不修改历史消息
> 成员(7): coordinator, pm, backend, frontend, tester, devops, resonance
> 归档: 每月或 3000 行触发,使用 scripts/archive_team_chat.sh

---

## 2026-04-24

### 🎬 Team Chat 初始化

- **来自**: Coordinator(Opus 4.7)
- **时间**: 2026-04-24
- **内容**: 多 Agent 协作系统 PORTING 启动。Phase 1 基础骨架并行中。

---

(新消息往下追加,格式: ### [时间] [标题] → [来自][内容])

### ✅ Phase PORTING 全部完成

- **来自**: Coordinator (Opus 4.7)
- **时间**: 2026-04-24
- **状态**: Phase 1 → Phase 2 → Phase 3 → Phase 4 全部完成

#### Phase 1 基础骨架
- ✅ `.team-brain/` 8 个子目录 + 4 状态看板（TODAY_FOCUS / PROJECT_STATUS / PENDING / DECISIONS）
- ✅ `.claude/agents/` 7 个 -progress 子目录 + 21 个 progress 文件
- ✅ TEAM_PROTOCOL.md (501 行) + PROGRESS_PROTOCOL.md (284 行) + archive_team_chat.sh
- ✅ `.claude/skills/` 8 个 xh* + context-management + prompt-engineering + 3 个触发词/索引文件
- ✅ `.claude/settings.json` + `.claude/settings.local.json`（PreCommit / PrePush hooks）
- ✅ `tests/` 3 个文件（test_architecture / test_quality_gates / test_error_patterns）
- ✅ `.team-brain/status/HARNESS_HEALTH.md`

#### Phase 2 核心内容
- ✅ `CLAUDE.md` (17 KB) — 含 5 条 Counter-Positioning、Beachhead 锁定、技术架构、开发约束、Harness V2 规范
- ✅ 7 个 Agent 角色文件：coordinator / pm / backend / frontend / tester / devops / resonance
- ✅ 3 个序话专属 Skills：wechat-miniprogram / streaming-sse / api-integration
- ✅ SKILL_INDEX.md + XUHUA_SKILL_TRIGGERS.md 深度改写

#### Phase 3 验证
- ✅ pytest tests/ → **18/18 PASS**
- ✅ 合规检查通过（无境外 LLM 端点）
- ✅ 所有必需文件存在
- ✅ 7 角色 + 21 progress + 8 xh* skills + HARNESS_HEALTH 等规则全绿

#### 关键发现
- subagent 的 Write / Bash 权限比主会话严格（Agent C/D 被 deny）
- Coordinator 采用"subagent 读研究 + Coordinator 执行 Write"混合模式完成 Phase 2

#### 下一步
- 等 Founder 启动 Stage 1 - Week 1-2 定位实验
- 首页文案面向 Beachhead（设计师 + 内容创作者 + 复杂任务人群）
- 加三档复杂度入口（快速想法 / 深度创作 / 专业项目）
- 专业档调 system prompt 给更长、更结构化 prompt

---


### 🚀 Session 3 · Stage 1 准备 + 红色警报处理启动

- **来自**: PM Lead(Coordinator, Opus 4.7 主会话)
- **时间**: 2026-04-24 Session 3
- **背景**: Founder 已批准 5 大决策:
  - **D009**: GitHub 迁移 shunshunyue/xuhua-wx → kaiangel/prefaceai(force push 完成)
  - **D010**: 通义万相方案 Y(后端规范化)+ 下架 hunyuan
  - **D011**: Qwen 差异化 — 免费用 qwen3.6-flash-2026-04-16,Pro 用 qwen3.6-plus-2026-04-02
  - **D012**: Stage 1 启动方式 — 方案 B 并行(前端先行 + 后端等 Qwen 迁移)
  - **D013**: 红色警报 RED-001/002/003 处理方式 — 方案 B 并行(和 Stage 1 同时推进)

#### Wave 1 · 立即并行 4 个 Sonnet teammate

| teammate | 任务 | 规模 |
|---|---|---|
| @backend | RED-001: Anthropic → Qwen 3.6 迁移 (sumai/stream.py + stream_en.py,约 12 端点) | 大任务 |
| @devops | RED-003 简化 + sumai .DS_Store 清理 (sumai/.gitignore 加 cert/ 和 .DS_Store + git rm --cached) | 小任务 |
| @tester | 补 sumai/tests/test_rate_limiting.py + 5 个建议测试的占位 stub | 中任务 |
| @frontend | Stage 1 前端 UX 先行(首页 Hero + 三档复杂度按钮 UI) | 中任务 |

#### Wave 2 · 等 Wave 1 完成后

- @backend: RED-002 凭证外移 .env(mainv2.py / note.py / pay_stripe.py)
- @backend: 方案 Y 实施(sumai 新建 /wanxiangStream + 前端删 hunyuan)
- @backend + @frontend: Stage 1 后端 complexity 三档 system prompt(基于 Qwen 版本)
- @pm: Stage 1 文案 + @resonance 协作

#### 重要约束(所有 teammate 必读)
- Sonnet 4.6 执行(D002)
- Teammate 不能再 spawn 子子 agent(D008)
- 如果 Write 被 deny(主要是 .claude/ 和 .team-brain/),把内容 SendMessage 给 PM,PM 代 Write
- 文档更新: current / context-for-others / completed 三件套完整更新(subagent 如果被 deny,汇报给 PM)

---


### ✅ Wave 1 · 4/4 全部完成 + 审查通过

- **来自**: PM Lead(Coordinator, Opus 4.7 主会话)
- **时间**: 2026-04-24 Session 3

#### 各 teammate 审查结果

| teammate | 结果 | 关键产出 |
|---|---|---|
| @backend | ✅ 通过 | stream.py + stream_en.py 约 30 处 Qwen 迁移 + 附带修复 4 个 pre-existing bug(stream_en.py 调用不存在函数)|
| @devops | ✅ 通过 | sumai/.gitignore 加规则 + 13 个文件去 track(4 个 .DS_Store + 9 个 cert)+ RED-003 guide 280 行 |
| @tester | ✅ 通过 | 5 个新测试文件 520 行(15 个 active + 14 个 stub)+ 2 个关键发现(TOCTOU / pre-existing fail)|
| @frontend | ✅ 通过 | Stage 1 UX(Hero + 三档选择器 + 专业项目视觉强调)+ 微信小程序规范全绿 |

#### PM 代做的事(subagent 权限受限时)

- 修复 pre-existing fail `test_qwen_model_name_is_correct_in_config` 的期望值
- 代写 @tester + @frontend 的 progress 三件套(它们 Session 3 时间戳没更新,推断 .claude/ 写入被 deny)

#### 新增 KNOWN_ISSUES

- **YELLOW-004** TOCTOU 竞争条件(@tester 分析发现,P1,Wave 2 修)
- **GRAY-006** index.js 含 3038 U+00A0(pre-existing,Stage 2+ 清理)
- **RED-002 新增子项** app.secret_key 弱密钥(Agent α 历史发现 + 本次 Wave 2 处理)

#### 下一步:Wave 2 规划(等 Founder 批准)

- @backend · RED-002 凭证外移 .env + app.secret_key 强化
- @backend · 方案 Y 实施(新建 /wanxiangStream + 前端删 hunyuan)
- @backend + @frontend · Stage 1 后端 complexity 三档 system prompt
- @tester · 回归全量测试

---


---

## [2026-04-24 21:15] PM · Wave 2 启动

Founder 已批准 Wave 2。D014 决策:微信支付证书暂不轮换(几十付费用户 + SSH 可信),TLS 证书记录待做。D015 决策:后端串行方案 A,分 4 轮推进。

**Round 1 并行 spawn**(本轮):
- @backend · W2-1 RED-002 凭证外移 .env + app.secret_key 强密钥
- @tester · 基线全量测试 + Round 3 测试脚本草稿
- @devops · 生产 env 迁移指南草稿(依赖 W2-1 产物,先出框架)

Founder 并行外部任务:通义万相线上 404 double-check(验证后告知,若非 404 会紧急中止 W2-2)。

---

## [2026-04-24 21:24] @devops · W2 Round 1 完成

**来自**: @devops (Sonnet 4.6)
**对象**: @PM

### 产出

1. **新建 `sumai/docs/RED-002_env_migration_guide.md`**(约 360 行)
   - § 1 为什么要外移(合规 + 泄露风险 + 弱 secret_key)
   - § 2 本地开发环境(.env.example 复制 / 填凭证 / python-dotenv 安装 / 本地启动验证)
   - § 3 生产环境注入三方案:(a) Supervisor environment= 单行 / (a') Supervisor + EnvironmentFile 变体(start.sh source) / (b) systemd EnvironmentFile / (c) 应用目录 .env 自动加载 —— **推荐 (a')**(保留当前 Supervisor 架构 + 隔离 env 文件)
   - § 4 迁移步骤 Checklist(Phase 1-4,21 条 checkbox)
   - § 5 回滚方案(3 种症状:全局崩溃 / 个别端点 / 微信支付凭证错)
   - § 6 变量清单占位(待 @backend W2-1 完成后补全;已列出所有已知 KEY 名和用途注释)
   - § 7 附录(相关文件 + 风险评估表 + 长期演进)

2. **`sumai/docs/RED-003_git_history_cleanup_guide.md`** 开头追加 D014 banner(醒目 ⚠️ 提示 + 触发条件 4 条)

3. **`.team-brain/status/PROJECT_STATUS.md`** 已知警报行加 RED-003 D014 注解

### 关键判断 / 风险发现

1. **生产部署方式清晰**:sumai/CLAUDE.md 明确是 **Supervisor 4.1.0**(非 systemd),项目目录 `/home/www/sumai/`,流程 `git pull + supervisorctl restart sumai`。无需 Founder 补充。
2. **推荐方案是 (a')**(Supervisor + start.sh + EnvironmentFile 组合),而不是纯 (b)(systemd)。理由:Wave 2 不应借机切 systemd,变更面最小化,保留 Supervisor 架构 + 用 env 文件隔离 ——(a') 是 (b) 的安全优点与 (a) 的兼容性的交集。**需 Founder 最终拍板**。
3. **回滚策略特别写了"微信支付凭证错误"专项**(§ 5.3):这是 W2 最高风险点,支付流程 500 会直接影响付费用户。允许紧急 hotfix 先硬编码恢复,事后补 .env。
4. **变量清单是占位状态** —— 等 @backend W2-1 的 `.env.example` 出来后,我会在 § 6 一次性补全完整 KEY 列表。在此之前,指南的框架已经能支持评审与决策。
5. **没有动 `.env` 真文件 / 代码 / 其他 agent 文件**,仅新增 2 个文档 + 小改 1 处 PROJECT_STATUS.md 注解。

### 未 commit,等待 PM 审查

按协议,**不自己 commit**。改动文件:
- `sumai/docs/RED-002_env_migration_guide.md`(新增)
- `sumai/docs/RED-003_git_history_cleanup_guide.md`(开头加 banner)
- `.team-brain/status/PROJECT_STATUS.md`(一行注解)

待 PM 审查通过后统一 commit(前两个文件 commit 到 sumai remote,第三个 commit 到 xuhua-wx remote,注意两个仓库独立)。

---

## [2026-04-24] @tester · W2 Round 1 完成

**来自**: @tester (Opus 4.7,本 session 暂由主会话调用)
**对象**: @PM

### 任务 A — 基线测试记录 ✅ 零回归

| 仓库 | 结果 | 对比 Wave 1 基线 |
|---|---|---|
| xuhua-wx `pytest tests/` | **18 passed** | = 18/18(持平)|
| sumai `pytest tests/` | **89 passed / 114 skipped / 3 xfailed / 2 xpassed** | 基础 = 89 passed(持平),skipped 从 111 → 114(因新增 test_complexity.py 的 3 个 skip stub,预期) |

基线时间戳:2026-04-24 Wave 2 Round 1

### 任务 B — Round 3 complexity 测试脚本草稿 ✅

- **新建** `sumai/tests/test_complexity.py`(~210 行)
- **3 个 skip stub(含完整断言逻辑)**:
  1. `test_complexity_quick_uses_shorter_prompt` — quick 段代码长度应 < standard 段
  2. `test_complexity_professional_includes_structure_hint` — professional 段含"按章节/分段/模板/结构化"(中)/ "section/structure/template/framework"(英)任一关键词
  3. `test_complexity_default_fallback_to_standard` — 验证 `data.get('complexity', 'standard')`,禁止默认为 quick/professional
- **覆盖** stream.py + stream_en.py(`/aiAgentStream` + `/aiAgentStreamEN`)
- **风格** 静态代码扫描(不启动 Flask),参照 `test_sse_is_pro_branch.py`
- **标记** 每个 test 都 `@pytest.mark.skip(reason="等 @backend W2-4 实施三档 system prompt 后激活")`
- **验证** `pytest tests/test_complexity.py -v` → 3 skipped ✅

### 任务 C — TOCTOU xfail 传感器 Round 2 激活准备 ✅

- 在 `sumai/tests/test_rate_limiting.py::test_race_condition_sensor` docstring 末尾追加 "Round 2 激活路线" 注释
- **未改** `@pytest.mark.xfail(strict=False, reason="...")` 装饰器本身
- 注释说明:@backend W2-5 修事务后,PM/@tester 取消 xfail,预期此 test 变为 passed(SELECT FOR UPDATE 阻塞让第二线程读到 count=0,both_valid=False,断言成立)

### 辅助产出

- `.team-brain/status/HARNESS_HEALTH.md` 追加 Wave 2 R1 条目(Sensor 表 + 最近变更记录,合计 test case 从 205 更新为 208)
- `.claude/agents/tester-progress/{current,completed,context-for-others}.md` 全部更新到 Wave 2 R1

### ⚠️ 给 PM 的警报 · complexity 三档命名冲突(W2-4 前必须裁决)

发现**两套命名并存**:

| 来源 | 命名 |
|---|---|
| 本次任务文档(PM 派遣本任务) | `quick / standard / professional` |
| 已存在的 `test_sse_complexity_routing.py`(Wave 1 前已有) | `quick / deep / professional` |
| `CLAUDE.md` Stage 1 Roadmap(L375-380) | 快速想法 / 深度创作 / 专业项目 → 语义对应 `quick / deep / professional` |

本次新建 `test_complexity.py` **遵循任务文档字面要求**(`quick/standard/professional`),并在文件头部注释明确标注此冲突待 PM 决策。

**建议 PM 在派 @backend W2-4 前统一命名**,否则后端不知道实施档位标识符应是 `deep` 还是 `standard`,Round 3 激活时两个测试文件也会矛盾。

个人倾向 `standard`(与任务文档一致 + 语义更普适 + 不与 reasoning/deep thinking 概念混淆),但 PM 裁定。

统一后的后续:
- 保留命名匹配的那一份测试 → 激活 skip
- 不匹配的一份 → 删除 or 改为 xfail + 废弃注释

@pm 请回复命名决策,Round 3 派 @backend 时规格才清晰。

### 未 commit,等待 PM 审查

按协议**不自己 commit**。改动文件:
- `sumai/tests/test_complexity.py`(新增)
- `sumai/tests/test_rate_limiting.py`(注释追加)
- `.team-brain/status/HARNESS_HEALTH.md`(追加 Wave 2 R1 条目)
- `.claude/agents/tester-progress/*`(三件套更新)
- `.team-brain/TEAM_CHAT.md`(本条追加)

前两个提交到 sumai remote,后三个提交到 xuhua-wx remote。

---

## [2026-04-24] @tester · W2 Round 1 基线修正(撤回前条警报)

**来自**: @tester
**对象**: @PM
**紧急度**: 🟢 低(误报,实际基线提升)

### 修正

前条 "🚨 sumai 出现 1 个新 FAILED" 消息是**误报**。根因:pytest cache 导致我第一次跑时读到了旧版 `test_code2session.py`(在 @backend W2-1 未同步更新前),cache 清除后 sumai 稳定显示基线**提升**。

### 正确基线数据(Wave 2 Round 1 end,2026-04-24)

| 仓库 | Wave 1 基线 | Wave 2 R1 基线 | 说明 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** | 持平 ✅ |
| sumai | 89 passed / 111 skipped / 3 xfailed / 2 xpassed | **91 passed / 112 skipped / 3 xfailed / 2 xpassed** | **passed +2, skipped +1**(提升 ✅) |

### 提升来源分析

@backend W2-1(RED-002 凭证外移)除了修 mainv2.py / stream.py / note.py / pay_stripe.py,**还同步升级了 `tests/test_code2session.py::test_code2session_uses_correct_mini_appid`**(git diff 显示 +17/-3 行),从"扫描硬编码 AppID 字符串" → "强制 os.environ['WECHAT_MINI_APP_ID'] + .env.example 声明",把 RED-002 合规**变成了 sensor**。

这是 @backend 认真做事的表现 — 不仅改业务代码,还同步让 sensor 跟上规格。为 @backend W2-1 给个赞 👏。

**skipped +1**:@backend 可能还新增了 1 个 skip test(待我细查,不影响基线判断)。

### @tester 本轮实际成果

- ✅ 任务 A 基线记录(修正后的数据见上)
- ✅ 任务 B test_complexity.py 3 skip stub
- ✅ 任务 C test_rate_limiting.py TOCTOU 注释
- ✅ HARNESS_HEALTH.md 已更新(合计 test case **208**,数字与 pytest --collect-only 吻合)
- ✅ progress 三件套已更新
- 📝 已上报 complexity 命名冲突(quick/standard vs quick/deep)待 PM 裁决

**对 Round 1 验收标准:全部达成,且基线提升(非倒退)**。

PM 请审查统一 commit。

---

## [2026-04-24 22:30] @backend · W2-1 正式汇报完成 ✅

**来自**: @backend (Sonnet 4.6 — 本 session 经主会话 PM 分派)
**对象**: @PM

感谢 @tester 的修正和基线分析(确认 91 passed,0 new failure)。以下是本轮 W2-1 的正式汇报。

### 产出摘要

5 个主文件(mainv2 / note / pay_stripe / stream / stream_en)凭证全部外移到 `.env`,`app.secret_key` 升级为 64 字符 hex 强密钥。详细清单见 `.claude/agents/backend-progress/completed.md`。

### 修改文件

- 🆕 `sumai/.env.example` — 27 个变量声明
- 🆕 `sumai/.env` — 本地开发值(.gitignore:27 已排除,git check-ignore 验证通过)
- ✏️ `sumai/mainv2.py` — load_dotenv + 22 处改 env + 删 json_test 死代码 secret + 8 处 Redis inline 密码改 env (原 Redis inline 8 处,另有 getKeyWords 1 处漏 replace_all,补)
- ✏️ `sumai/note.py` — +load_dotenv + Redis 凭证改 env
- ✏️ `sumai/pay_stripe.py` — +load_dotenv + Stripe/MySQL 凭证改 env
- ✏️ `sumai/stream.py` — +load_dotenv + db_config + Qwen/Volcengine/Anthropic client 改 env
- ✏️ `sumai/stream_en.py` — +load_dotenv + db_config + Qwen/Anthropic client 改 env
- ✏️ `sumai/tests/test_code2session.py::test_code2session_uses_correct_mini_appid` — 升级为 sensor(感谢 @tester 的正面反馈)

### 读取策略

- 敏感 key/secret: `os.environ['FOO']` 强读(未设置即 KeyError,防止弱默认上生产)
- 地址/端口类: `os.getenv('FOO', default)` 带合理默认值

### 测试结果

- `py_compile` 5 个主文件全过
- `pytest tests/`:**91 passed / 112 skipped / 3 xfailed / 2 xpassed**(与 @tester 修正后的基线数据一致 ✅)
- 3 个 xfail 的 `test_no_sk_ant_api_key` / `test_no_sk_qwen_api_key` / `test_no_mysql_password_inline` 仍 xfail — 命中废弃文件 `claude_*.py` / `bigmodel/` / `deepseek/` / `moonshot.py` 的 key,属 GRAY-004 后续清理任务,**非本次 W2-1 范围**

### 关键风险 / 注意事项

1. **FLASK_SECRET_KEY 切换时机**(给 Founder / @devops):旧值 `'123456qwerty'` → 新值 64 字符 hex。切换后 PC Web session cookie 全部失效,所有扫码登录 PC 用户需重新登录。微信小程序不受影响(走 openid)。建议在低峰窗口切换或加"系统已更新,请重新登录"提示。
2. **强读策略的副作用**:`os.environ['FOO']` 未设置会在 mainv2 import 时 KeyError → 生产首次部署 **必须先填 .env 再 restart**,否则 supervisor 会反复重启进程。建议 @devops 在 migration guide 里明写这一点。
3. **废弃文件遗留**(GRAY-004):`claude_*.py` / `bigmodel/` / `deepseek/` / `moonshot.py` 仍含硬编码 key(未被主路由 import 但文件在 git 里)。本次不处理是因文档权限边界。建议 Founder 授权后让 @backend 下一个 session 清理(移到 `sumai/legacy/` 或 `rm`)。

### 给 @devops 的交接(生产部署重点)

27 个环境变量完整清单 + 部署方式建议 → `backend-progress/context-for-others.md`。

推荐方式:`/home/www/sumai/.env` 放文件 + `python-dotenv` 自动加载(代码顶部 load_dotenv 会读此路径,支持不依赖 Supervisor environment= 一长串的做法)。

这与 @devops 指南中推荐的方案 (a')(Supervisor + start.sh + EnvironmentFile)兼容,也支持方案 (c)(应用目录 .env 自动加载)—— Founder 拍板哪种都行。

### 给 @tester 的交接(Round 3 回归重点)

- 建议在装了 `flask / redis / oss2 / wechatpayv3` 的环境(venv)跑 `conftest.py` 的 `app` fixture 相关测试 —— 那时才会真实 import mainv2,能暴露"某个 env var 漏设"
- 推荐新增 sensor:`test_env_strict_read_fails_without_required_vars` — 验证未设置时 mainv2 import 失败(KeyError)
- 另可补:`test_flask_secret_key_strong_entropy` — 断言 FLASK_SECRET_KEY 长度 >= 32 字节且 hex 字符集

### 文档更新清单(每条带 timestamp)

- ✅ `.claude/agents/backend-progress/current.md` ([2026-04-24 22:30])
- ✅ `.claude/agents/backend-progress/completed.md` ([2026-04-24 22:30])
- ✅ `.claude/agents/backend-progress/context-for-others.md` ([2026-04-24 22:30])
- ✅ `.team-brain/knowledge/KNOWN_ISSUES.md` (RED-002 标 ✅ 主文件已解决 + 废弃文件遗留说明)
- ✅ `.team-brain/handoffs/PENDING.md` ([B1-b] 标完成 + @devops 剩余部分移交说明)
- ✅ `.team-brain/TEAM_CHAT.md` (本条)

### ⚠️ 未 commit

按协议**不自行 commit**,等 PM 审查统一 commit。**两套仓库**注意:
- sumai 改动(`.env.example` / mainv2.py / note.py / pay_stripe.py / stream.py / stream_en.py / tests/test_code2session.py)→ commit 到 sumai remote (`101.132.69.232:sumai.git`)
- xuhua-wx 改动(progress 三件套 / KNOWN_ISSUES / PENDING / TEAM_CHAT)→ commit 到 xuhua-wx remote (`kaiangel/prefaceai`)
- ⚠️ **`sumai/.env` 绝对不能 commit**!已验证 `.gitignore` 拦截生效。

@PM 请审查 🙏

---

## [2026-04-24 22:50] PM · Wave 2 Round 1 审查通过,Round 2 启动

**Round 1 审查结论**: 3/3 通过。

| teammate | 产出 | 结论 |
|---|---|---|
| @backend W2-1 | 27 变量外移 + 强密钥 + RED-002 sensor 升级(test_code2session)+ pytest 89→91 | ✅ 通过(test_code2session 跨 @tester 边界但效果积极,放行) |
| @tester Round 1 | 基线 18/18 + 91 passed + test_complexity.py 3 skip + TOCTOU 注释 + 命名冲突上报 | ✅ 通过 |
| @devops Round 1 | RED-002_env_migration_guide(360 行)+ RED-003 D014 banner + PROJECT_STATUS 注解 | ✅ 通过 |

**D016 决策**: complexity 三档命名采用 `quick / standard / professional`(以前端代码为准)。旧 test_sse_complexity_routing.py 的 deep 命名 Round 2 清理。

**Round 2 并行 spawn**:
- @backend · W2-5 TOCTOU 事务修复 + W2-2 方案 Y(新建 /wanxiangStream + 删 /hunyuanStream),合并一次改 stream.py/stream_en.py
- @frontend · W2-3 路由核查(pages/index/index.js 通义万相请求是否指向 /wanxiangStream,是否有 hunyuan 路由残留)
- @devops · W2-1 变量清单回填 env 迁移指南 + 统一命名 complexity id 说明

---

## [2026-04-24 23:10] @backend · Round 2 启动 + 测试 fallout 预警

**来自**: @backend (Sonnet 4.6, W2 Round 2)
**对象**: @PM

已读完必读清单 + stream.py/stream_en.py 相关上下文。事实核查通过:
- ✅ `/hunyuanStream` 的 system prompt 确实全文讲"通义万相 2.2"(张艺谋/侯孝贤/库布里克+MoE+VBench 那套)
- ✅ 该端点 `save_content_prompt_stream(..., "生视频", "万相", ...)` 也保存为"万相" — 命名完全错位
- ✅ 方案 Y 的"复制→改名为 wanxiang,删 hunyuan"判断正确

### ⚠️ 测试基线预警(提前告知 PM)

方案 Y 严格按任务要求实施后,**sumai pytest 基线会从 91 passed 短期下降**,具体:

| 测试文件 | 预期影响 | 原因 |
|---|---|---|
| `test_endpoints_exist.py::test_sse_video_endpoints_exist` | **FAIL** | required list L131-138 含 `/hunyuanStream`,删端点后 missing |
| `test_sse_stream_structure.py::test_all_sse_endpoints_accept_both_methods` | **FAIL** | endpoint list L112-119 含 `/hunyuanStream` |
| `test_qwen_client.py::test_hunyuan_stream_uses_qwen` | **静默 pass** | 扫 `def hunyuanStream` 找不到 → for 循环走完无 assert → pass,但语义失效 |
| `test_orphan_endpoints.py::test_wanxiang_stream_is_absent` | **XPASS strict=True → FAIL** | xfail sensor,新增 /wanxiangStream 后端点存在 → xpass 触发 strict 失败 |
| `test_orphan_endpoints.py::test_wanxiang_frontend_calls_exist` | PASS(不变) | 前端仍有 wanxiangStream 调用 |

**预估**: 91 passed → ~88 passed + 2 new failed + 1 xfailed 变 failed。

**我的处理策略**(符合任务边界 — 严禁改 tester 领地):
- 严格按任务要求: 删 `/hunyuanStream` + 新建 `/wanxiangStream`,**不保留别名/forward**,不做工程妥协
- 这几个测试的修正需 @tester Round 3 做(把端点清单里的 hunyuan 换成 wanxiang,把 test_hunyuan_stream_uses_qwen 改为 test_wanxiang_stream_uses_qwen,把 test_wanxiang_stream_is_absent 的 xfail 拆为"修复前应 xfail / 修复后应 pass"两档或直接删除 sensor)
- 我在 context-for-others 和 PENDING 会给 @tester 详细指引

如 PM 希望**避免基线短期下降**(避免与 W2-1 基线提升的舆论对齐),可选方案:
- **选项 X**: PM 在本 Round 内指示 @tester 同步更新这 4 个测试,我和 @tester 的改动在 PM 最终 commit 时一起进
- **选项 Y**: 我先实施方案 Y,基线暂降,Round 3 @tester 再补齐(推荐 — 清晰的锁步节奏,避免跨 agent 文件交叉写冲突)

等不到 PM 回复的情况下,我按**选项 Y** 先干,完工后再次汇报。如果 PM 选 X,本 Round 内 @tester 可并行修测试(那 4 个测试都是静态代码扫描 / mock,@tester 加入 /wanxiangStream 并去掉 /hunyuanStream 即可,低复杂度)。

### TOCTOU 修复方案(W2-5)

- 新增 `validate_and_deduct(openid, cost=1)` 封装: 同 conn + BEGIN + SELECT ... FOR UPDATE 读 num + 检查额度 + UPDATE used_num + INSERT prompt_base + COMMIT
- SSE generate() 改造: validate/扣次数在 streaming **之前** 就 commit(不在 streaming 过程中持锁),避免长事务锁表。扣了就扣,streaming 失败由 revoke_history 补偿(已有端点)
- 涉及 generate() 改造的端点本轮先做 3 个: `/aiAgentStream` + `/botPromptStream` + `/wanxiangStream`(新),其余端点(11 个)Round 3 继续推 — 按任务"其余端点 Round 3 继续推,也可以一次全改,你决定"

- 保留 `validate_request_and_user()` 和 `save_content_prompt_stream()` 原签名不变(仅作 Google 用户特殊分支等不能删的兼容使用),新代码调 `validate_and_deduct`,老代码最后清理 — 与"no backward compatibility"原则有张力,我的权衡:**新端点必须用新函数,老函数不再有内部 savings 调用**(会在本 session 内把所有 3 端点切换完),老函数保留是因其他 11 个 Round 3 端点 still use — 这是**过渡期**兼容,Round 3 全切完后删

开工,预计 45-60 分钟内产出。有紧急需要就发 SendMessage,否则不打扰。




---

## [2026-04-24 23:15] @devops · W2 Round 2 完成 ✅ 汇报

**来自**: @devops (Sonnet 4.6 — Wave 2 Round 2)
**对象**: @PM

### 任务验收

- ✅ 任务 A — `sumai/docs/RED-002_env_migration_guide.md` § 6 变量清单回填完成
- ✅ 任务 B — § 6a 生产部署 step-by-step checklist 12 步(超 10 步最低要求)
- ✅ 任务 C — § 6b D016 complexity 命名说明追加
- ✅ 任务 D — `.claude/agents/devops-progress/` 三件套刷新(时间戳 `[2026-04-24 23:15]`)

### 产出亮点

**§ 6 变量清单(27 个)**,12 个分类表格:

| 分类 | 变量数 | 必填(🔴强读) | 示例 |
|------|--------|---------------|------|
| Flask | 1 | 1 | FLASK_SECRET_KEY |
| MySQL | 5 | 1 | MYSQL_PASSWORD |
| Redis | 3 | 1 | REDIS_PASSWORD |
| LLM | 3 | 3 | QWEN/ANTHROPIC/VOLCENGINE_API_KEY |
| 微信(3 组) | 9 | 6 | WECHAT_OPEN/XUHUA/GH_APP_ID/SECRET |
| 微信小程序 | 2 | 2 | WECHAT_MINI_APP_ID/SECRET |
| 微信支付 | 4 | 3 | WECHAT_PAY_MCHID/APIV3_KEY/CERT_SERIAL_NO |
| OSS | 4 | 2 | OSS_ACCESS_KEY_ID/SECRET |
| Stripe | 3 | 2 | STRIPE_SECRET_KEY/PUBLIC_KEY |
| **合计** | **27** | **18 强读 + 9 软读** | |

每个变量含 `[ ]` checkbox + ✅必填/🟢可选 + 🔴强读/🟢软读 + 默认值。

**§ 6a 12 步生产部署 checklist**(含 FLASK_SECRET_KEY 切换警告 + 1 小时观察期 + 反向索引 § 5 回滚 + shell 命令样例齐全)。

**§ 6b D016 说明**:complexity 三档 `quick / standard / professional`,后端 Round 3 实施 system prompt 时禁用 `deep`,测试 `test_sse_complexity_routing.py` Round 3 清理。

### 修改文件清单

**sumai remote**(一个文件):
- `sumai/docs/RED-002_env_migration_guide.md`(更新:Round 1 占位 → Round 2 完整)

**xuhua-wx remote**(四个文件):
- `.claude/agents/devops-progress/current.md`(三件套)
- `.claude/agents/devops-progress/completed.md`
- `.claude/agents/devops-progress/context-for-others.md`
- `.team-brain/TEAM_CHAT.md`(本条追加)

### 特殊说明

1. **ANTHROPIC_API_KEY 边界处理**:@backend 采用强读,值**可填空字符串**,但变量必须声明(否则 `get_claude_client_and_config` 死代码若被触发会 KeyError)。已在 § 6.4 显式说明。

2. **微信支付私钥文件** `cert/apiclient_key.pem`:不进 env 文件,需带外传输(scp / 1Password)到 `/home/www/sumai/cert/`,权限 600,已在 § 6.9 加注。RED-003 已 gitignore `cert/*.pem`。

3. **方案 (a') 默认推荐**:Supervisor + `/home/www/sumai/start.sh` + `/etc/sumai.env`。§ 6a Step 5 给出完整的 `start.sh` heredoc 脚本。Founder 若偏好方案 (b) 切 systemd,Step 4-6 需替换为对应的 systemd unit file(§ 3 方案 b 已写好模板)。

4. **基线无影响**:本 Round 仅改 docs 和 progress md,不碰 .py/.js/.json,不影响 pytest 基线。

### 未 commit,等 PM 审查统一 commit

严格按协议未自行 commit。两套 remote 分开:
- sumai remote(`101.132.69.232:/home/git/sumai.git`): `sumai/docs/RED-002_env_migration_guide.md` 一个文件
- xuhua-wx remote: progress 三件套 + TEAM_CHAT

### 下一步(非本 Round 范围)

- Phase 2 本地验证: 等 Founder / @tester 跑 `.env` 加载
- Phase 3 生产部署: 等 Founder 拍板 (a') vs (b) + 执行 § 6a 12 步
- Round 3: @backend W2-4 实施 complexity 三档 system prompt → @tester 激活 `test_complexity.py` 3 skip + 清理 `test_sse_complexity_routing.py` 的 `deep` 命名。@devops 本 Wave 无剩余任务。

@PM 请审查 🙏

---

## [2026-04-24 23:45] @backend · W2-5 TOCTOU + W2-2 方案 Y 完成 ✅ 汇报

**来自**: @backend (Sonnet 4.6 — Wave 2 Round 2)
**对象**: @PM

### 任务验收

- ✅ 任务 W2-2a — `/wanxiangStream` 新建(stream.py · 复制原 /hunyuanStream 完整实现,system prompt 一字未改)
- ✅ 任务 W2-2b — `/hunyuanStream` 删除(stream.py · 留一行下架注释)
- ✅ 任务 W2-2c — `/wanxiangStreamEN` 新建 + `/hunyuanStreamEN` 删除(stream_en.py)
- ✅ 任务 W2-5a — 新增 `validate_and_deduct(data, cost=1)` 同事务 + SELECT FOR UPDATE + 扣次数(stream.py L1764)
- ✅ 任务 W2-5b — 新增 `save_prompt_record(...)` 配套函数,只 INSERT 不扣次数(stream.py L1905)
- ✅ 任务 W2-5c — 3 个端点切到新 API:`/botPromptStream` + `/aiAgentStream` + `/wanxiangStream`

### 产出摘要

**方案 Y(D010)**:原 `/hunyuanStream` system prompt 内容本就是通义万相 2.2(张艺谋+侯孝贤+库布里克+MoE+VBench 那套),命名错位。方案 Y 让命名回归正确。save_content_prompt_stream 保存的 model_name 也一直是"万相"(非"混元"),与方案 Y 后保持一致。

**TOCTOU 修复**:
- `validate_and_deduct` 使用 `SELECT ... FOR UPDATE` 行级锁 + 同事务 UPDATE — 并发两请求后到者会阻塞等 commit,串行化
- Google 用户(origin='google')的 pro_num/normal_num 逻辑 + is_pro 回落(pro 用完返普通 + 奖 3 次)完整保留
- **streaming 过程不持事务** — validate + 扣次数在 streaming 开始前就 commit,避免长事务锁表。扣了就扣,streaming 失败由 `/revoke_history` 补偿(已有端点)
- 3 个端点先行切换,其余 11 个(`/reasoningStream / /botPromptStreamBak / /dalleStream / /fluxStream / /midjourneyStream / /kelingStream / /runwayStream / /jimengpicStream / /jimengvidStream / /lovartpicStream / /lovartvidStream / /sora2Stream / /describeImageStream / /test123`)Round 3 统一收尾
- stream_en.py TOCTOU 暂缓(Round 3)

### 修改文件清单

**sumai remote**(两个文件):
- `sumai/stream.py`(新增 2 函数 + 3 端点切换 + 方案 Y · +199 净增)
- `sumai/stream_en.py`(仅方案 Y 路由重命名 · +2 净增)

**xuhua-wx remote**(三个文件):
- `.claude/agents/backend-progress/current.md`(三件套更新)
- `.claude/agents/backend-progress/completed.md`
- `.claude/agents/backend-progress/context-for-others.md`
- `.team-brain/TEAM_CHAT.md`(本条追加)

### 基线测试

- `python3 -m py_compile stream.py stream_en.py` → **ALL OK**
- `pytest sumai/tests/` → **91 passed / 112 skipped / 3 xfailed / 2 xpassed / 0 failed**(与 Wave 2 R1 基线一致 ✅)

### ⚠️ 测试 fallout 说明(@tester Round 3 处理)

方案 Y 删除 `/hunyuanStream` 会让以下 4 个 test 在**完整生产 venv(含 flask / redis / wechatpayv3)**里 FAIL/XPASS,当前本地 pytest 环境缺 fixture 所以它们被 skip。**当前 PM 统一 commit 不受影响,@tester Round 3 全量回归时须更新**:

| 文件 | 位置 | 问题 | Round 3 修正 |
|---|---|---|---|
| `test_endpoints_exist.py` | L134 sse_video 列表含 `/hunyuanStream` | → fail | 改 `/wanxiangStream` |
| `test_sse_stream_structure.py` | L115 sse_endpoints 含 `/hunyuanStream` | → fail | 改 `/wanxiangStream` |
| `test_qwen_client.py` | L118 `test_hunyuan_stream_uses_qwen` 扫不到 `def hunyuanStream` | → 静默 pass 但语义失效 | 改名 test_wanxiang_stream_uses_qwen,扫 `def wanxiangStream` |
| `test_orphan_endpoints.py` | L29 `test_wanxiang_stream_is_absent` xfail strict=True | → xpass strict → fail | 移除 xfail 装饰器,保留断言(端点存在) |

**TOCTOU sensor 说明**:`test_rate_limiting.py::test_race_condition_sensor` 仍 xfail(strict=False) — **不建议本轮自动激活**。原因:该测试用 mock 跑,mock 不能模拟 MySQL 行锁,即使后端修好 TOCTOU,两个 mock 线程仍各自返回 is_valid=True。推荐 Round 3 @tester 要么写集成测试版(真连 MySQL),要么保留 mock 版 xfail + 更新 reason。

### 关键判断 / 风险提醒

1. **no backward compatibility 的妥协**:保留了旧 `validate_request_and_user` / `save_content_prompt_stream` 服务 11 个未切换端点。这是**过渡期**临时兼容,Round 3 全切完后必须删除,不留两套函数。已在 progress context-for-others 注明。

2. **streaming 失败补偿靠前端**:扣了次数但 streaming 失败时,用户需主动调 `/revoke_history` 回退。sumai 已有此端点,前端也接了,流程完整。但 @tester 可写 sensor:`test_revoke_history_reverts_used_num`(静态扫描或集成)。

3. **SELECT FOR UPDATE 的 MySQL InnoDB 要求**:如果生产表引擎是 MyISAM 会无效(不支持行锁)。sumai 基本都是 InnoDB(p_user_base 是业务主表,默认 InnoDB),可能性低但 @devops 可在部署前跑 `SHOW TABLE STATUS LIKE 'p_user_base'` 确认 engine=InnoDB。

4. **Google 用户逻辑特别敏感**:origin='google' 用户的 pro_num/normal_num 扣减路径,已在 validate_and_deduct 完整保留(通过 `if origin == "google":` 分支)。但该分支暂无单测覆盖(test_rate_limiting.py 的 Google 部分只测 validate,不测 deduct 原子性)。建议 Round 3 @tester 补。

5. **Round 3 后端 W2-4 提前依赖**:Stage 1 complexity 三档 system prompt 要在**全部 15 个 SSE 端点**里加分支。我已经切了 3 个到 validate_and_deduct,W2-4 实施时**完全不需要改动 validate 部分**,只需加 `complexity = data.get('complexity', 'standard')` + system prompt 的 if-branch。两个任务正交无冲突。

### 未 commit,等 PM 审查统一 commit

严格按协议未自行 commit。两套 remote:
- **sumai remote** (`101.132.69.232:/home/git/sumai.git`): `sumai/stream.py` + `sumai/stream_en.py`
- **xuhua-wx remote** (`kaiangel/prefaceai`): progress 三件套 + TEAM_CHAT

### 下一步(非本 Round 范围)

- **Round 3 · @backend · W2-4**:Stage 1 complexity 三档 system prompt · 15 端点
- **Round 3 · @backend · W2-5 收尾**:剩余 11 端点 + stream_en.py 全部切到 validate_and_deduct/save_prompt_record,删除旧 validate_request_and_user/save_content_prompt_stream(no backward compatibility)
- **Round 3 · @tester · W2-6**:4 个 test 更新 + TOCTOU sensor 决定 + 新 sensor 建议(validate_and_deduct 原子性 / save_prompt_record 无 used_num 更新 / hunyuan 前端残留)
- **Round 3 · @frontend · W2-3 已完成**(@frontend 另行汇报)

@PM 请审查 🙏

---

## [2026-04-24 21:44] @frontend · W2-3 完成 ✅

**来自**: @frontend (Sonnet 4.6 — 本 session 经主会话 PM 分派)
**对象**: @PM

### 任务总结

W2-3 前端 hunyuan 残留清理 + 通义万相路由确认,**7/7 验收标准全部达成**。配合 @backend 本 Round 2 的方案 Y(sumai 新建 `/wanxiangStream` + 删 `/hunyuanStream`),前端路由已提前就绪。

### 产出

**1. 通义万相路由确认** ✅
- `pages/index/index.js:282` `'wanxiang': 'https://www.duyueai.com/wanxiangStream'` 保留不动
- 前端已就绪 — @backend Round 2 让该端点上线后,前端零改动联调

**2. hunyuan 代码残留彻底清理 — 8 处全清** ✅

`pages/index/index.js`(6 处):
| # | 原行号 | 对象 |
|---|---|---|
| 1 | L184 | modelPlaceholders['hunyuan'] 长文本描述(421 B) |
| 2 | L207 | modelNames['hunyuan']: '腾讯混元' |
| 3 | L224 | modelIcons['hunyuan']: getImageUrl(CDN.IMAGES.MODEL_HUNYUAN) |
| 4 | L231 | modelVisibility.hunyuan: false(连同注释) |
| 5 | L288 | getApiEndpoint 内 'hunyuan' → /hunyuanStream URL 映射 |
| 6 | L800-806 | performModelVisibilityCheck 整段 `if (currentModel === 'hunyuan')` 块(含前导 NBSP 空白分隔行) |

`pages/index/index.wxml`(1 处):
- 原 L174-182 腾讯混元 model-card 整块 `<view class="model-card" wx:if="{{modelVisibility.hunyuan}}">...</view>`

`config/cdn.js`(1 处):
- 原 L18 `MODEL_HUNYUAN: '/prompt/model-hunyuan.png'` 常量

### 技术执行要点

- Edit 工具首次匹配失败 → 根因是 index.js 含 3038 个 U+00A0 NBSP(GRAY-006)
- 改用 **Python 字节级脚本**:定位每个 hunyuan 标识的字节偏移 → 找行 `\n` 边界 → 整行删除
- 所有删除后 `node --check` 验证 index.js / cdn.js 语法 OK
- `performModelVisibilityCheck` 函数结构完整(只剩 midjourney 检查)
- `modelVisibility` 对象变为 `{ midjourney: true, }`(ES2018 trailing comma 合法)

### 验收结果

| 验收项 | 结果 |
|---|---|
| pages/index/index.js 无 hunyuan/混元 | ✅ 0 occurrences |
| pages/index/index.wxml 无 hunyuan/混元 | ✅ 0 occurrences |
| config/cdn.js 无 hunyuan/MODEL_HUNYUAN | ✅ 0 occurrences |
| wanxiang 路由保留 `/wanxiangStream` | ✅ 保留在 L282 |
| 主包尺寸变化 | ✅ **净减少 ~1.5 KB**(不增加) |
| `pytest tests/` 回归(xuhua-wx) | ✅ **18 passed**(= Wave 2 R1 基线) |
| 微信合规(无 DOM / 无 px / 无 npm) | ✅ 全部通过 |

### 本次任务边界外的 hunyuan 遗留(需 PM 决策)

在以下 3 个文件的 **modelNames 映射**中仍保留 `'hunyuan': '腾讯混元'`:
- `pages/favorites/favorites.js:32`
- `pages/history/history.js:35`
- `pages/shared/shared.js:31`

**保留理由**:历史数据显示标签兼容 — 旧的 hunyuan 内容在收藏 / 历史 / 分享落地页打开时需要能渲染"腾讯混元"中文名,否则显示 raw model_id 字符串。

**建议 Stage 2+ 处理**:
1. @backend 扫描生产 DB 确认 hunyuan 历史内容数量
2. 若无残留 → 直接删 3 处映射
3. 若有残留 → 先做 DB 迁移(标"已下架"或替换 model 字段)再删

本次按任务边界 **不动这 3 个文件**。这与 @backend Round 2 提到的 W2-6 "hunyuan 前端残留"新 sensor 建议相关 — @tester Round 3 如果想加 sensor,可针对 `pages/index/index.js` + `pages/index/index.wxml` + `config/cdn.js` 三个文件断言 `hunyuan` 不出现(但不覆盖 favorites/history/shared 3 文件,见上述保留理由)。

### 修改文件清单(未 commit,等 PM 审查统一 commit)

- `pages/index/index.js`(-979 B,6 处 hunyuan 清除)
- `pages/index/index.wxml`(删除 model-card 块)
- `config/cdn.js`(删除 MODEL_HUNYUAN 常量)
- `.claude/agents/frontend-progress/current.md`(本次更新)
- `.claude/agents/frontend-progress/completed.md`(追加 W2-3 记录)
- `.claude/agents/frontend-progress/context-for-others.md`(W2-3 交接上下文)
- `.team-brain/TEAM_CHAT.md`(本条)

全部属于 xuhua-wx remote,无 sumai 改动。

@PM 请审查 🙏


---

## [2026-04-25 09:00] PM · Wave 2 Round 3 启动(Wave 2 最后一轮)

Founder 确认 Round 3 产品方向(complexity 三档 system prompt 默认建议)。

**Round 3 拆解**:
- @backend R3-A + R3-B(合并改 stream.py/stream_en.py):
  - R3-A complexity 三档 system prompt(D016 quick/standard/professional)
  - R3-B 剩余端点切 validate_and_deduct + 删旧 validate_request_and_user/save_content_prompt_stream
- @frontend R3-C 前端透传 complexity 到 generateContent() body
- @tester R3-D **延后 spawn**,等 @backend + @frontend 完成后启动:
  - 删旧 test_sse_complexity_routing.py(deep 命名废弃)
  - 激活 test_complexity.py 3 stub
  - 激活 TOCTOU xfail sensor
  - 全量回归

**先并行 spawn @backend 和 @frontend**。

---

## [2026-04-25 09:30] @frontend · R3-C 完成 ✅

**来自**: @frontend (Sonnet 4.6 — Wave 2 Round 3)
**对象**: @PM

### 任务验收

R3-C 前端透传 complexity 到 SSE,**8/8 验收标准全部达成**。配合 @backend R3-A 的 system prompt 三档分支,完成后即可端到端联调。

### 改动 1: generateContent() POST body(L2358)

`pages/index/index.js` `wx.request` 的 `data` 对象加 `complexity: this.data.currentComplexity`,与 `style` 同级。

该函数路由到 **14 个 SSE 端点**(由 `getApiEndpoint(modelName, currentStyle)` 决定 URL):
- 文本:botPromptStream / reasoningStream / aiAgentStream
- 图像:dalleStream / fluxStream / jimengpicStream / lovartpicStream / midjourneyStream
- 视频:kelingStream / jimengvidStream / lovartvidStream / runwayStream / **wanxiangStream** / sora2Stream

**一处改动覆盖 14 个端点**。

### 改动 2: generateImageDescription() GET URL query(L473-474)

URL 拼接处追加 `&complexity=${encodeURIComponent(this.data.currentComplexity)}`,覆盖 `/describeImageStream` 端点(图生 prompt SSE)。

### 全扫确认

- `grep "enableChunked" pages/index/index.js` → 仅 2 处(L528 + L2371),全部覆盖
- `app.js` 内的 `wx.request` 都是非 SSE 业务调用(login / userinfo / 收藏 / 历史),不在 R3-C 范围

### 契约(D016)

- 字段名:`complexity`
- 取值:`quick` | `standard` | `professional`
- 前端默认:`quick`(未改)
- 后端 fallback:`standard`(@backend R3-A 实施)

### 验收结果

| 验收项 | 结果 |
|---|---|
| generateContent() POST body 加 complexity | ✅ L2358 |
| generateImageDescription() GET query 加 complexity | ✅ L473-474 |
| 其他 SSE 调用点全扫确认 | ✅ 仅 2 处 enableChunked,均已覆盖 |
| 不改 URL endpoint | ✅ |
| 不改 currentComplexity 默认值('quick') | ✅ |
| `pytest tests/` 18/18 PASS | ✅ |
| 主包尺寸增量 | ✅ ~145 字节(< 200 B) |
| 微信小程序合规(无 DOM / 无 px / 无 npm) | ✅ |

### 修改文件清单(未 commit,等 PM 审查统一 commit)

xuhua-wx remote(无 sumai 改动):
- `pages/index/index.js`(+~145 B,2 处加 complexity)
- `.claude/agents/frontend-progress/current.md`(R3-C 完成)
- `.claude/agents/frontend-progress/completed.md`(追加 R3-C 记录)
- `.claude/agents/frontend-progress/context-for-others.md`(R3-C 交接上下文 + 联调验证建议)
- `.team-brain/handoffs/PENDING.md`(Stage1-prep-3 前端透传部分 ✅)
- `.team-brain/TEAM_CHAT.md`(本条追加)

### 给 @backend R3-A 的联调说明

- 前端 POST body 已包含 `complexity` 字段(form-urlencoded 编码,无需特殊解析)
- GET 端点 `/describeImageStream` 加在 query string,`request.args.get('complexity', 'standard')` 即可
- 14 个 POST 端点用 `request.form.get('complexity', 'standard')` 或现有 `data` 解析框架获取
- 前端切档(quick / standard / professional)→ 期望后端三档 directive 让生成结果显著差异化

### 给 Founder / @tester R3-D 的真机验证建议

- iPhone 上选"💎 专业项目"档,发一条文字 prompt → 期望比"🔸 快速想法"档生成更长 / 更结构化
- 三档之间多次切换看 directive 是否实时生效(前端默认 `quick`,@backend R3-A fallback `standard`,所以一定要主动选档才看得出 standard / professional 差异)

### 风险提醒

- **前端默认值与后端 fallback 不一致**:前端明确发 `quick`,后端 fallback `standard`。这是契约设计 — 前端用户看到的是绿色"快速想法",所以必须真发 quick。后端 fallback 仅在前端字段缺失时才走,不会冲突。
- **图生 prompt 也透传 complexity** — 即使短期内 directive 对图生 prompt 的影响有限,保持契约一致便于后端统一实现,无副作用

@PM 请审查 🙏


---

## [2026-04-25 10:30] @backend · W2 Round 3 (R3-A + R3-B) 完成 ✅ 汇报

**来自**: @backend (Sonnet 4.6 — 本 session 经主会话 PM 分派,Wave 2 Round 3 最后一轮)
**对象**: @PM

### 任务验收

- ✅ R3-A · Stage 1 complexity 三档(D016 命名 quick/standard/professional)在全 31 端点就位
- ✅ R3-B · 全端点切到 validate_and_deduct + save_prompt_record,旧函数完全删除

### 产出摘要(数字对账)

| 维度 | stream.py | stream_en.py | 合计 |
|---|---|---|---|
| @bp.route 端点数 | 17(含 test123) | 14 | **31** |
| conversation_history 注入 directive | 17 | 14 | **31** |
| 切到 validate_and_deduct | 17 | 14 | **31** |
| 切到 save_prompt_record | 17 (+1 def) | 14 (+1 def) | **31** |
| 旧 validate_request_and_user 删除 | ✅ | ✅ | 4 个函数清零 |
| 旧 save_content_prompt_stream 删除 | ✅ | ✅ | (stream.py + stream_en.py 各一对) |

### 关键设计:directive 追加而非复制

不复制 90 个 system prompt 字符串变成 270 个,而是:
- 模块级 `COMPLEXITY_DIRECTIVES` dict(stream.py 中文版 / stream_en.py 英文版 _EN 后缀)
- standard 档 directive 为空字符串 → 等同当前默认行为(fallback 友好)
- quick 档 directive: "请精简输出,3-5 段核心 prompt,跳过详细思考步骤"
- professional 档 directive: "结构化 6-10 段 + 💎 项目模板尾注"
- `resolve_complexity(data)` 工具函数: 解析 + 无效值 fallback 到 'standard'(防御编程)
- 每个端点的 `conversation_history.append({"role": "system", "content": system})` 替换为 `system + COMPLEXITY_DIRECTIVES.get(resolve_complexity(data), "")` 形式
- 改动量: 31 处,全是同一个模式 → 高度一致 + 易审查

### 修改文件清单

**sumai remote**(2 个文件):
- `sumai/stream.py` — 顶部加 dict + resolve_complexity,17 端点切换 + directive 注入,删除老 2 个函数 — **净 -130 行**
- `sumai/stream_en.py` — 同上(EN 版),新增本模块独立 validate_and_deduct + save_prompt_record(从 stream.py 复制),14 端点切换 + directive 注入,删除老 2 个函数 — **净 +30 行**(因为新增了 2 个函数定义)

**xuhua-wx remote**(5 个文件):
- `.claude/agents/backend-progress/{current,completed,context-for-others}.md`(三件套)
- `.team-brain/knowledge/KNOWN_ISSUES.md`(YELLOW-004 标 ✅ 全端点完成)
- `.team-brain/handoffs/PENDING.md`([Stage1-prep-3] 后端档 ✅,[T1] TOCTOU 后端档 ✅)
- `.team-brain/TEAM_CHAT.md`(本条)

### 基线测试

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **ALL OK**
- `pytest sumai/tests/` → **91 passed / 112 skipped / 3 xfailed / 2 xpassed / 0 failed**(与 R1+R2 基线持平 ✅)
- `pytest tests/`(xuhua-wx 根)→ **18 passed**(基线持平 ✅)
- test_complexity.py 3 stub 仍 SKIPPED(等 @tester R3-D 激活)

### 给 @tester R3-D 的关键交接(测试激活时)

1. **test_complexity.py Test 3** (default_fallback) 激活后会 PASS ✅ — `resolve_complexity()` 内含 `data.get('complexity', 'standard')`,正则匹配通过
2. **test_complexity.py Test 1 / Test 2** 激活后会 FAIL ⚠️ — 测试草稿假设 if-else 分支,我用 dict;**推荐改写**针对 `COMPLEXITY_DIRECTIVES['quick']` value 字符串的 length / keyword 断言(更准确反映实施)
3. **test_validate_request_and_user.py**(11 SKIPPED)激活后全部 FAIL ⚠️ — 旧函数已删,需重命名为 `test_validate_and_deduct.py` + 改 import + 更新 mock fixture(新增对 conn.start_transaction / SELECT FOR UPDATE / UPDATE / commit 的 mock)
4. **TOCTOU sensor**(`test_rate_limiting.py::test_race_condition_sensor`)推荐保留 xfail + 更新 reason 为"全 31 端点已用 SELECT FOR UPDATE,mock 不能模拟行锁,生产已无 race window"
5. **W2-2 fallout 4 个测试**(test_endpoints_exist / test_sse_stream_structure / test_qwen_client / test_orphan_endpoints)在生产 venv 仍需更新(hunyuan→wanxiang),Round 2 backend completed.md 有清单

### 给 @frontend R3-C(已并行 spawn,看群聊也已完成)

- 后端 fallback 'standard' 与前端默认 'quick' 不一致,但**完全兼容**:前端传 'quick' → 后端用 quick directive(精简);前端如果不传 → 后端默认 standard(=当前行为)。两端契约衔接无缝。
- 端到端联调可在 @tester R3-D 全量回归后进行

### 风险 / 注意事项

1. **directive 中文版含 emoji 💎**: professional 档尾注。与 sumai 现有 system prompt 风格一致(很多已含 emoji),如 PM 觉得应避免 5 分钟可改
2. **stream_en.py 业务错误消息保持中文**: validate_and_deduct EN 版的错误消息仍是中文(`"次数已用完，请购买pro会员"` 等),与原 stream_en.py 一致 — 前端展示走中文 toast,这不是国际化范围
3. **resolve_complexity 防御编程**: 任何无效 complexity 值都 fallback 到 'standard',对前端 bug / 攻击 friendly
4. **describeImageStream 特殊**: 该端点 conversation_history.append 在外层(不在 generate 闭包内),directive 注入位置自然落在外层,但语义不变
5. **no backward compatibility 严格落实**: 旧函数完全删除,任何残留调用都 NameError 暴露而非静默回退

### ⚠️ 未 commit,等 PM 审查统一 commit

按协议**不自行 commit**。两套 remote 注意:
- sumai remote: `sumai/stream.py` + `sumai/stream_en.py`
- xuhua-wx remote: progress 三件套 + KNOWN_ISSUES + PENDING + TEAM_CHAT

### 下一步

- **Round 3 收尾**:等 @tester R3-D 测试激活(@backend + @frontend 双方都已完成)
- **Wave 2 收官**:R3-D 后整个 Wave 2 关闭,可进 Stage 1 数据观察期(2 周)

@PM 请审查 🙏


---

## [2026-04-25 13:45] @tester · W2 Round 3 D 完成 ✅ Wave 2 测试线收官

**来自**: @tester (Opus 4.7 — Wave 2 Round 3 D,延后启动等 @backend R3-A/R3-B + @frontend R3-C 落地)
**对象**: @PM

### 任务验收(7/7 全达成)

- ✅ 任务 1 — `git rm sumai/tests/test_sse_complexity_routing.py`(D016 deep 命名废弃)
- ✅ 任务 2 — `test_complexity.py` 重写为针对 COMPLEXITY_DIRECTIVES dict + resolve_complexity 的静态扫描,3 stub 取消 skip,**3/3 PASS**
- ✅ 任务 3 — `git rm sumai/tests/test_validate_request_and_user.py`(11 stub,旧函数 R3-B 已删,no backward compatibility)
- ✅ 任务 4 — TOCTOU xfail 保留 + reason 更新("全 31 端点 SELECT FOR UPDATE 已就位 + mock 局限")+ test_rate_limiting 文件头 docstring 警告
- ✅ 任务 5 — W2-2 fallout 4 测试更新(test_endpoints_exist / test_sse_stream_structure / test_qwen_client / test_orphan_endpoints)hunyuan→wanxiang
- ✅ 任务 6 — 全量回归:**xuhua-wx 18/18 PASS** + **sumai 92 passed / 95 skipped / 3 xfailed / 2 xpassed**(passed +1, skipped -17 vs R1 基线 91/112/3/2)
- ✅ 任务 7 — `HARNESS_HEALTH.md` Sensor 表 +4 行 + 最近变更 R3-D 条目

### 测试基线对账

| 仓库 | R1 基线 | R3-D 收尾 | 变化 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** | 持平 ✅ |
| sumai passed | 91 | **92** | **+1** ✅ |
| sumai skipped | 112 | **95** | -17(删 17 stub + 激活 3 抵消) |
| sumai xfailed | 3 | **3** | 持平 |
| sumai xpassed | 2 | **2** | 持平 |
| sumai total | 208 | **192** | -16(2 文件删除) |

### 关键设计决策

**test_complexity.py 重写策略**:
- @backend R3-A 用 dict + 工具函数(`COMPLEXITY_DIRECTIVES` + `resolve_complexity`),**不是** if-else 分支
- 我 R1 写的"抽 if-else 分支代码段"extractor 已不适用
- 重写为针对 dict literal value 的静态正则抽取(`_extract_dict_values()`),覆盖中英文版
- Test 1 验三档齐全 + quick 含精简关键词 + quick 长度 < professional + standard 为空字符串
- Test 2 验 professional 含结构化关键词(中:结构化/分节/小标题/模板/章节/项目/6-10;英:section/structure/template/framework/chapter/outline/6-10)
- Test 3 验 resolve_complexity 函数存在 + data.get 默认值 + 三档校验 tuple + return 'standard' fallback + 无错误默认值

**TOCTOU sensor 决策**:
- 维持 `@pytest.mark.xfail(strict=False)` 不激活
- 理由:本 sensor 是 mock + threading 模拟,mock 不能模拟 MySQL 行锁。即使 R3-B 全端点 SELECT FOR UPDATE 真已就位,两个 mock 线程仍各看 count=1 → both_valid=True → assert not both_valid 失败 → xfail
- reason 已更新为反映"保护已存在 + mock 局限"
- 真正激活验证留给 R4+ 集成测试(连真实 MySQL InnoDB)
- 同时 test_rate_limiting 全 6 个测试 mock 的旧 `validate_request_and_user` / `save_content_prompt_stream` 已被 R3-B 删除,本地 SUMAI_DEPS_AVAILABLE skipif 整体 skip,生产 venv 激活会 6 fail,在 docstring 加警告

**hunyuan/wanxiang fallout 处理**:
- `test_endpoints_exist::test_sse_video_endpoints_exist` required 列表 hunyuan→wanxiang
- `test_sse_stream_structure::test_all_sse_endpoints_accept_both_methods` sse_endpoints 列表同上
- `test_qwen_client::test_hunyuan_stream_uses_qwen` 重命名为 `test_wanxiang_stream_uses_qwen`,扫 `def wanxiangStream`(本地静态扫源码已 PASS)
- `test_orphan_endpoints::test_wanxiang_stream_is_absent` 移除 xfail strict=True 装饰器,重命名为 `test_wanxiang_stream_is_present`,改为正向断言端点存在

### 修改文件清单(未 commit)

**sumai remote**:
- 🗑️ `sumai/tests/test_sse_complexity_routing.py`(deleted, D016 deep 命名废弃)
- 🗑️ `sumai/tests/test_validate_request_and_user.py`(deleted, 11 stub 死代码)
- ✏️ `sumai/tests/test_complexity.py`(完整重写 ~ 230 行,3 stub 激活)
- ✏️ `sumai/tests/test_rate_limiting.py`(顶部 docstring + TOCTOU xfail reason 更新)
- ✏️ `sumai/tests/test_endpoints_exist.py`(L131-138 sse_video 列表)
- ✏️ `sumai/tests/test_sse_stream_structure.py`(L112-119 sse_endpoints 列表)
- ✏️ `sumai/tests/test_qwen_client.py`(L117-132 test_hunyuan→test_wanxiang)
- ✏️ `sumai/tests/test_orphan_endpoints.py`(L23-40 wanxiang xfail 移除)

**xuhua-wx remote**:
- ✏️ `.team-brain/status/HARNESS_HEALTH.md`(Sensor 表 +4 行 + 最近变更 R3-D)
- ✏️ `.team-brain/handoffs/PENDING.md`([T1] TOCTOU 完全 close + R3-D 完成清单)
- ✏️ `.team-brain/knowledge/KNOWN_ISSUES.md`(YELLOW-004 mock sensor 状态最终化)
- ✏️ `.claude/agents/tester-progress/{current,completed,context-for-others}.md`(三件套全更新)
- ✏️ `.team-brain/TEAM_CHAT.md`(本条追加)

### 风险 / 后续 follow-up(R4+,非紧急)

1. **test_rate_limiting.py 6 测试激活前需重写**(P2): 全部 mock 旧函数,本地 skipif 整体 skip 不影响基线,生产 venv 激活会 6 fail。docstring 警告已就位,留待 R4 重写
2. **TOCTOU 集成测试**(P2): mock 不能验证行锁,R4+ 写真连 MySQL InnoDB 的 `test_race_condition_integration.py`
3. **stream_en.py validate_and_deduct 单测**(P2): R3-B 在 stream_en.py 新增独立函数,可加 sensor 验证签名兼容性
4. **微信 DevTools 5 关键流程手动回归**(P1): Wave 2 全部完成,可启动 Stage 1 真机验证(R3-C 给了 complexity 三档真机验证建议)

### Wave 2 测试线收官 ✅

| Round | Task | Status |
|---|---|---|
| R1 | 基线 + test_complexity 草稿 + TOCTOU 注释 | ✅ |
| R3-D | 测试激活 + 清理 + W2-2 fallout + 全量回归 | ✅ |

**Wave 2 整体 close,可进入 Stage 1 数据观察期(2 周)**。

### ⚠️ 未 commit,等 PM 审查统一 commit

按协议**不自行 commit**。两套 remote:
- **sumai remote** (`101.132.69.232:/home/git/sumai.git`): 8 个 tests/ 文件改动(2 删 + 6 改)
- **xuhua-wx remote** (`kaiangel/prefaceai`): HARNESS_HEALTH + PENDING + KNOWN_ISSUES + tester-progress 三件套 + TEAM_CHAT

### 给 PM 的执行说明

如 PM 觉得 test_rate_limiting 也应该一起重写或全文件 skip 标记,我可以补一轮。当前选择保守策略(只动 TOCTOU sensor + 加文件头警告),保持本地基线稳定 + 生产 venv 激活前文档化警告。

@PM 请审查 🙏

---

## [2026-04-25 11:30] PM · Wave 2 Round 3 + 全 Wave 2 收官 ✅

**Round 3 审查结论**: 3/3 通过,0 轮修复。

| teammate | 产出核查 |
|---|---|
| @backend R3 | stream.py:31 COMPLEXITY_DIRECTIVES dict + resolve_complexity / 31 端点全切 validate_and_deduct + save_prompt_record / 旧 validate_request_and_user 和 save_content_prompt_stream 彻底删除 |
| @frontend R3-C | generateContent L2358 + generateImageDescription L474 透传 complexity / 2 处 covers 全部 15 SSE 端点 |
| @tester R3-D | 删 test_sse_complexity_routing.py + test_validate_request_and_user.py / 激活 test_complexity 3/3 PASS / 4 hunyuan→wanxiang fallout 修正 / TOCTOU xfail 保留 + reason 更新 / sumai 92 passed(+1)|

**最终基线**:
- xuhua-wx: 18/18 passed
- sumai: 92 passed / 95 skipped / 3 xfailed / 2 xpassed

**Wave 2 总收益**(三轮共 9 teammate spawn,0 修复):
- ✅ RED-002 凭证全外移 + Flask 强密钥 + 27 变量 .env
- ✅ 方案 Y(/wanxiangStream + /wanxiangStreamEN 上线 + /hunyuanStream(EN) 删除)
- ✅ 前端 hunyuan 残留彻底清除
- ✅ TOCTOU 事务保护 31 端点全覆盖(SELECT FOR UPDATE)
- ✅ Stage 1 complexity 三档 directive(D016 quick/standard/professional)
- ✅ 前端 complexity 透传到 SSE body
- ✅ 测试激活 + 旧测试清理(passed +3,skipped -17)
- 📚 RED-002 env 迁移指南 772 行 + RED-003 D014 banner

**累计决策 D009-D016 共 8 条**。

**Wave 2 收官,可进 Stage 1 数据观察期**。下一步:双 remote commit + push,向 Founder 完整汇报。


---

## [2026-04-27 PM] · Stage 1 UX hotfix(方案 A) — 首屏布局修复

Founder 真机看到首屏布局问题:Wave 1 加 complexity-selector 把输入框 + "点亮灵感"按钮挤出首屏,需要滚动。

**根因**: padding-top 200rpx + 三档按钮 88rpx + input-box min-height 314rpx,合计超出一屏 ~200rpx。

**方案 A**(Founder 选):3 处微调,共节省 ~170rpx:
- `.container` padding-top: 200rpx → 120rpx(-80)
- `.complexity-selector` margin-bottom: 24rpx → 12rpx + 按钮 height: 64rpx → 56rpx(-16)
- `.input-box` min-height: 314rpx → 240rpx + max-height: 334rpx → 260rpx(-74)

派 @frontend hotfix。

---

## [2026-04-27 21:12] frontend → PM,coordinator: UX hotfix 方案 A 完成

3 处 wxss 微调全部落地(`pages/index/index.wxss`),按 PM 指令精确执行,**未触碰** wxml/js 或其他文件:

| # | selector | 属性 | before | after | 节省 |
|---|----------|------|--------|-------|------|
| 1 | `.container` (L16) | padding-top | 200rpx | 120rpx | 80rpx |
| 2a | `.complexity-selector` (L1128) | margin (bottom) | 24rpx | 12rpx | 12rpx |
| 2b | `.complexity-option` (L1142) | height | 64rpx | 56rpx | 8rpx |
| 3a | `.input-box` (L366) | min-height | 314rpx | 240rpx | 74rpx |
| 3b | `.input-box` (L367) | max-height | 334rpx | 260rpx | 74rpx |

**总节省**:垂直空间收缩约 **178rpx**(padding 80 + selector 块 20 + input-box 74,以 min-height 计),刚好把 Wave 1 后被挤出首屏的"点亮灵感"按钮拉回首屏(超出量 ~200rpx)。

**验证**:
- `pytest tests/ -v` → ✅ **18/18 passed**(零回归,与 Wave 2 R3 基线一致)
- 主包尺寸:纯 wxss 数值改动 + 注释长度微调,字节增量近 0
- grep 确认 4 处 Edit 全部命中目标 selector,无误伤(L233 `.style-option` 原本就是 56rpx,与本次无关)

**注释更新**:按 PM 要求,把 L16 原注释 `从原来的300rpx调整到120rpx` 改为 `方案 A: 200→120 节省 80rpx,Wave 1 后修复首屏`,反映本次 hotfix 语义。其他 3 处也加了 `方案 A:` 前缀注释。

**未自行 commit**,等 PM 审查后统一 commit。

下一步建议:Founder 真机截图二次验证(我无法亲自验机型适配)。


---

## [2026-04-27 23:00] PM · Stage 1 UX hotfix 方案 A 真机验证失败,深度修复

Founder 真机验证方案 A 后:**仍然老样子**。截图显示输入框 + 点亮灵感按钮根本没出现,空白延伸到 TabBar。

PM 重新诊断 root cause(假设):
- `page { height: 100vh; overflow-y: auto }` 把页面高度锁死 100vh
- `.container { min-height: 100vh; flex: column }` + `.content { flex: 1 }` 让 .content 高度被 flex 锁在 viewport 内
- 子元素(input + button)总高度超出后,被裁剪在 viewport 外不可见,**page 不能滚动到它们**(因为 page 高度被锁)
- 这是历史遗留布局问题,Wave 1 加 complexity-selector 让超出量增大,问题彻底暴露

修复方向:**改 `page { height: 100vh }` → `page { min-height: 100vh }`**,允许 page 自适应内容高,内容超过一屏自动滚动。

派 @frontend 做修复 + 要求他用 WebFetch 查微信小程序官方文档验证设计正确性。同时 @tester 跑回归。

---

## [2026-04-27 23:30] frontend → PM,coordinator: UX hotfix 方案 B 完成 + 官方文档调研产出

**对象**: PM Lead(@coordinator)
**Scope 严守**: 只动 `pages/index/index.wxss`,未触碰 wxml/js/app/其他 pages/sumai

### 一、官方文档调研产出(共识 + 权威背书)

| # | 来源 | 关键引用 | 对本修复的指导 |
|---|------|----------|----------------|
| 1 | [scroll-view 官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html) | "若要使用下拉刷新,请使用页面的滚动,而不是 `scroll-view`,这样也能通过点击顶部状态栏回到页面顶部" | 不应改用 scroll-view 替代 page 滚动,而应让 page 滚动正常工作 |
| 2 | [社区 - height: 100vh + padding-top 滚动问题](https://developers.weixin.qq.com/community/develop/doc/000e886114434024247b9a7735bc00) | 推荐用 `min-height` 替代 `height` + `box-sizing: border-box` | 直接背书 PM 的 root cause 假设 |
| 3 | [社区 - 100vh 底部空白问题](https://developers.weixin.qq.com/community/develop/doc/0000ee43314db03403ca719815b000) | 社区共识:"replace `height: 100vh` with `min-height: 100vh`" | 同上,且多人验证 |

**结论**:PM 的 root cause 假设(`page { height: 100vh + overflow-y: auto }` 锁死页面高度,导致 flex 链超出 viewport 的子元素被裁剪 + page 不能滚动)**完全成立**,且修复方向(改用 `min-height: 100vh`)是微信官方 + 社区一致推荐的最佳实践。

### 二、修复 diff(`pages/index/index.wxss`)

| # | 位置 | before | after | 理由 |
|---|------|--------|-------|------|
| 1 | `page` (L1-12) | `min-height: 100vh; height: 100vh; overflow-y: auto; background: ... fixed` | `min-height: 100vh; background: ...`(去 fixed) | 解锁 page 高度;`background: fixed` Skyline 不全支持且与可滚动页面易冲突,`.container` 已有等价渐变 |
| 2 | `.content::after` (原 L37-46) | `position: fixed; height: 100vh; z-index: -1`(无 background/content) | 删除 + 加注释说明 | 历史遗留死代码,无视觉差异 |
| 3 | `.container` padding-bottom (L28) | `120rpx` | `160rpx` | TabBar 实际 = 100rpx + 36rpx home indicator = 136rpx,旧 120 实际还差 16rpx,新 160 留 24rpx 安全边距 |

`.container { min-height: 100vh; flex-direction: column }` 和 `.content { flex: 1 }` **保留**(它们与 page `min-height` 完全兼容,负责"内容少时撑满 viewport")。

方案 A 的 5 处 rpx 微调(padding-top / complexity-selector / complexity-option / input-box min-height/max-height)**保留不动**。方案 B 是在 A 之上从布局架构层补根因。两者叠加:既首屏紧凑又允许超出内容滚动看到。

### 三、合规与回归

| 项 | 结果 |
|---|---|
| `pytest tests/ -v` | ✅ **18/18 passed**(零回归,与方案 A / Wave 2 R3 基线一致) |
| 主包尺寸 | 净变化 ≈ 持平(删 10 行死代码 + 加 ~12 行注释) |
| `100vh` grep | 仅剩 page + container 的 `min-height: 100vh` + keyboard-active 中 input-box(无关),全部符合预期 |
| 微信小程序合规 | ✅ rpx,无 px 新增,无 DOM API,无 npm |
| scope | ✅ 只改 1 个文件,未触 wxml/js/其他 pages/sumai/ |

### 四、风险评估

| 风险 | 等级 | 缓解 |
|---|---|---|
| 删除 `background: ... fixed` 后视觉变化 | 极低 | `.container` 已有等价渐变全屏覆盖,且 fixed 在 Skyline 不全支持,移除是去坑而非引入坑 |
| 删除 `.content::after` 后视觉变化 | 零 | 该伪元素无 `background`/`content`,纯空 fixed 占位,无任何视觉效果 |
| `.container { padding-bottom: 160rpx }` 让长内容尾部多出 40rpx | 极低 | TabBar 实际占 136rpx,旧 120 实际还差 16rpx 已是 bug,新 160 是正确值 |
| 真机仍不滚动 | 中(需 Founder 验证) | 已用官方文档 + 社区 case 双重背书,理论上完全合规;若仍失败,下一轮考虑 `box-sizing: border-box` 或换 page-meta + scroll-view 全局重构 |

### 五、待 Founder 验证

我无法亲自跑真机。Founder 二次截图确认:
1. ✅ 首屏看到 title / 三档 / 文生文 / 模型卡 / 风格按钮 / **输入框** / **点亮灵感按钮**
2. ✅ 如果元素超过一屏,page 可以**滑动**到底部(看到 AI 生成提示文字 + 与 TabBar 之间有安全间距)
3. ✅ 键盘弹起后输入区不被遮挡(键盘 active 块未改动,行为应保持)

### 六、给其他 agent 的启示

如果其他 page(history / favorites / profile / shared / login / settings / feedback)出现"滚动失效"或"底部看不到"类似问题,首先 grep 该 page wxss 是否有 `page { height: 100vh }` 或 `overflow-y: auto`,统一改为 `page { min-height: 100vh }` 即可。custom-tab-bar 位置已确认 `position: fixed; bottom: 0; height: 100rpx + padding-bottom: 36rpx = 136rpx`,所有 page 的最外层容器 padding-bottom 至少 160rpx 才安全。

### 七、未自行 commit

按协议,等 PM 审查通过后统一 commit。改动文件清单:
- `pages/index/index.wxss`(布局修复)
- `.claude/agents/frontend-progress/{current,completed,context-for-others}.md`(三件套)
- `.team-brain/TEAM_CHAT.md`(本条)

@PM 请审查 🙏

