# 已知问题 / Tech Debt 清单

> 维护者: Coordinator + PM
> 规则: 每个问题独立编号,按严重度排序
> 更新: 每周一次,或每次重大 session 后
> 来源: Session 1 战略讨论 + Explore agent 深度扫 sumai(2026-04-24)

---

## 🔴 红色警报(合规/安全底线)

### RED-001 · Anthropic Claude 是境外服务 + 是 sumai 主力模型

- **发现日期**: 2026-04-24(Session 2)
- **位置**: `sumai/stream.py` L2040, `sumai/stream_en.py` L8259
- **现状**:
  - sumai 当前的**文生文 / 生图 / 生视频主力模型是 `claude-haiku-4-5`**(Anthropic 境外服务)
  - 只有 `/aiAgentStream` / `/hunyuanStream` / `/describeImageStream` 3 个端点用 Qwen(合规)
  - 其他 ~12 个 prompt 优化端点走 Anthropic
- **风险**: 与 D006 "多模型限定中国大陆境内" 决策冲突
- **解决方案**: 迁移主力模型到 **Qwen Flash 3.6**
  - `qwen-plus-latest` → `qwen3.6-flash-2026-04-16`(更快、更便宜、支持缓存)
  - `qwen3-vl-plus` → `qwen3-vl-flash-2026-01-22`(视觉理解)
  - 预计工作量: 改 `stream.py` + `stream_en.py` 约 30 处 `generate()` 函数 + prompt 适配测试
- **优先级**: P0(合规底线)
- **负责**: @backend(Stage 1 之前完成)

### RED-002 · 所有凭证硬编码在 sumai 源代码

- **发现日期**: 2026-04-24(Agent α 扫 sumai/CLAUDE.md 时又新发现 secret_key)
- **涉及**:
  - Anthropic API Key(`sk-ant-api03-...`)
  - Qwen / DashScope API Key(`sk-...`)
  - MySQL 密码
  - Redis 密码 + 微信 AppSecret(多个)
  - 微信支付 MCHID / 证书序列号 / APIV3_KEY
  - OSS AccessKey ID / Secret
  - Stripe 生产密钥(sk_live_...)
  - **🆕 Flask `app.secret_key = '123456qwerty'`**(`mainv2.py:55`,**弱密钥**,影响 PC session 安全性,易被暴力破解伪造 session cookie)
- **现状**: `python-dotenv==1.0.1` 已安装但**未实际使用**
- **风险**: 一旦 sumai 仓库泄露,所有下游资源暴露
- **解决方案**: 
  - 创建 `sumai/.env.example` 列出所有需要的变量(不含值)
  - 重构代码使用 `python-dotenv` 加载环境变量
  - 更新 `.gitignore` 确保 `.env` 不进 git
  - 部署配置迁移(生产服务器 `/etc/supervisor/conf.d/` 或 systemd env)
- **优先级**: P0(安全底线)
- **负责**: @backend + @devops

### RED-003 · 生产证书和微信支付私钥已提交到 git

- **发现日期**: 2026-04-24
- **涉及文件**:
  - `sumai/cert/www.duyueai.com.key`(域名 TLS 私钥)
  - `sumai/cert/apiclient_key.pem`(微信支付商户私钥)
  - `sumai/cert/apiclient_cert.p12`(微信支付商户证书)
  - `sumai/cert/api.xuhuaai.com/*.key`
- **现状**: `sumai/.gitignore` 没排除 `cert/` 目录
- **风险**: 拿到仓库访问权 = 能冒充 www.duyueai.com + 操作微信支付
- **解决方案**:
  - 把 `cert/*.key` / `cert/*.pem` / `cert/*.p12` 加到 `sumai/.gitignore`
  - `git-filter-repo` 从 git 历史中彻底清除(**需确认是否影响已 clone 的其他开发环境**)
  - 轮换所有泄露的证书和私钥(域名 + 微信支付)
- **优先级**: P0(安全底线)
- **负责**: @devops(需外部协助)

---

## 🟡 黄色警报(功能残缺 / 孤儿端点)

### YELLOW-001 · `/wanxiangStream`(通义万相视频生成)孤儿调用 · ✅ 已解决 2026-04-24 23:45

- **发现日期**: 2026-04-24
- **原位置**: 前端 `pages/index/index.js:272` 调用,后端 sumai 没实现
- **方案**: 方案 Y (D010) — 后端规范化
- **状态**: ✅ **已解决**(@backend W2-2 · Wave 2 Round 2)
  - `sumai/stream.py`: `/wanxiangStream` 新建(复制原 `/hunyuanStream` 实现,system prompt 内容即通义万相 2.2,命名错位已修复)
  - `sumai/stream.py`: `/hunyuanStream` 删除,留 downgrade 注释
  - `sumai/stream_en.py`: 同理处理 `/wanxiangStreamEN` + `/hunyuanStreamEN`
  - `pytest` 基线 91 passed 持平(删除 hunyuan 的 4 个 test 影响在本地 pytest 环境被 skip 遮蔽,Round 3 @tester 在生产 venv 跑全量回归时需更新那 4 个 test)
- **剩余**(Round 3):
  - @frontend W2-3: 前端路由核查(pages/index/index.js 的 hunyuan 路径残留清理)
  - @tester W2-6: 更新 `test_endpoints_exist.py` L134 / `test_sse_stream_structure.py` L115 / `test_qwen_client.py` L118 / `test_orphan_endpoints.py` L29

### YELLOW-002 · `/labelSync` 半成品(僵尸代码)

- **发现日期**: 2026-04-24
- **位置**: 
  - 前端 `app.js:262/287/419-447` 的 `syncLabelToCloud` / `getLabelFromCloud`
  - 后端 `sumai/mainv2.py:2286` 的 `/labelSync` 端点
- **现状**: 
  - 前端调用 POST `/labelSync` 上传 → 后端返回"同步成功(临时实现)"但**实际啥也没存**
  - 前端调用 GET `/labelSync` 下载 → 后端**永远返回 404**
- **为什么感知不到?** 风格标签(style)本来就存在 `prompt_base` 表里,`/history` 端点会返回带 style 的记录,所以跨设备同步其实**靠的是 /history**,不是 /labelSync
- **解决方案**(选其一):
  - **选项 A(推荐)**: 删前端 `syncLabelToCloud` / `getLabelFromCloud` 和所有调用点(最干净)
  - **选项 B**: 留着假成功,反正不影响功能(但会让 agent 看代码迷惑)
  - **选项 C**: 后端补真实实现(如果未来有更精细的标签需求)
- **优先级**: P2(不影响功能,但代码质量差)
- **负责**: @backend(Stage 2 之前清理)

### YELLOW-003 · `/recent_generation` 孤儿调用

- **发现日期**: 2026-04-24
- **位置**: 前端 `app.js:521`,后端 sumai 没实现
- **现状**: 前端调用失败返回 null,前端容错处理,**用户无感**
- **影响**: 某个"最近生成"的小入口永远为空 + 每次浪费一次网络请求
- **解决方案**: 删前端 L521 的调用代码
- **优先级**: P3(可忽略 / 顺手清)
- **负责**: @backend

---

## 🟢 灰色 / 技术债(影响开发效率)

### GRAY-001 · sumai 无自动化测试

- **发现日期**: 2026-04-24
- **现状**:
  - `*_test.py` 文件都是手动 print 脚本,不是 pytest/unittest
  - 无 `.github/workflows/` CI
  - **部署是 `git pull + supervisorctl restart` 盲飞**
- **风险**: 任何代码改动都没有自动验证,回归风险高
- **解决方案**: 补最小可用 pytest 骨架(见 B5 规划)
- **优先级**: P1
- **负责**: @tester(Stage 1 之前)

### GRAY-002 · sumai 无 CLAUDE.md

- **发现日期**: 2026-04-24
- **现状**: 10000+ 行代码,agent 无上下文难工作
- **解决方案**: 写 `sumai/CLAUDE.md`(基于 Explore 报告)
- **优先级**: P1
- **负责**: Coordinator(本 session 做)

### GRAY-003 · 序话小程序代码重复

- **发现日期**: Session 1 / PORTING
- **现状**:
  - Markdown 渲染逻辑在 4 个文件重复(index / history / favorites / shared)
  - 模型检测逻辑在 3 个文件重复
- **优先级**: P2
- **负责**: @frontend(Stage 2 + 重构期)

### GRAY-004 · sumai 多个废弃文件混淆

- **发现日期**: 2026-04-24
- **现状**:
  - `claude_*.py`(旧版 Anthropic 调用)
  - `app.py_back`(旧版应用主文件)
  - `deepseek/`(命名为 deepseek 实际调 Qwen)
  - `bigmodel/`(历史 prompt 版本)
  - `moonshot.py`(Kimi,未接主路由)
- **风险**: agent 读错文件 → 改动误以为生效但无效
- **解决方案**: 规范化 — 废弃文件移到 `sumai/legacy/` 或直接删除
- **优先级**: P2
- **负责**: @backend + @devops

### GRAY-005 · 生成状态机过度复杂(前端)

- **发现日期**: Session 1
- **现状**: 同时存在 `isGenerating` / `isGenerationActive` / `isCompletelyTerminated` 等多个标志
- **风险**: 状态不一致容易产生"幽灵生成"bug
- **优先级**: P2
- **负责**: @backend(Stage 2 重构)

---

## 历史 bug 记录(EP 编号,同步 test_error_patterns.py)

> 暂无 EP 记录。每次 bug 修复后在此追加。

---

## 清理规则

- 同一问题有**新状态变更**(如修复)时,**追加子条目**而非删除原记录
- 重大问题升级 / 降级时说明理由
- 已完全解决的问题保留记录,标记 `✅ 已解决 (日期)`

---

## 🟡 黄色警报(Session 3 新发现)

### YELLOW-004 · TOCTOU 竞争条件 — 用户次数扣减可能 lost update · ✅ 全 31 端点已修(R3-B 收尾)

- **发现日期**: 2026-04-24 Session 3(@tester 分析 sumai/stream.py 时发现)
- **原位置**:
  - `sumai/stream.py:1753` `validate_request_and_user()`(SELECT limit_num-used_num)
  - `sumai/stream.py save_content_prompt_stream()`(UPDATE used_num)
- **原风险**: 两个操作是独立 DB 连接,中间无事务保护,并发用户可能 lost increment(扣少/扣多)
- **解决方案(已采纳)**: 选项 A — `SELECT ... FOR UPDATE` + 同一 transaction
- **状态**: ✅ **完成**(@backend W2-5 + R3-B · Wave 2 Round 2 + Round 3 全收尾)
  - ✅ 新增 `validate_and_deduct(data, cost=1)`:同 conn + `start_transaction` + `SELECT ... FOR UPDATE` + 额度检查 + `UPDATE used_num` 同事务 + commit
    - stream.py 模块级定义
    - stream_en.py 模块级独立定义(R3-B 新增,从 stream.py 复制实现,仅 connect_to_db() 是本模块独立的)
  - ✅ 新增 `save_prompt_record(...)`:配套,只 `INSERT prompt_base`,不扣次数(stream.py + stream_en.py 各一份)
  - ✅ stream.py + stream_en.py **全部 31 个 SSE 端点**都已切到新 API:
    - stream.py 17 端点(含 test123)— Round 2 切 3 + R3-B 切 14
    - stream_en.py 14 端点 — R3-B 一次性全切
  - ✅ 旧 `validate_request_and_user` + `save_content_prompt_stream` **已删除**(stream.py 和 stream_en.py 各删除一对,共 4 个函数定义,符合 no backward compatibility 原则)
  - ✅ streaming 过程不持事务(validate+扣次数在 streaming 前 commit),避免长事务锁表
  - ✅ Google 用户(origin='google')pro_num/normal_num 路径完整保留(stream.py 和 stream_en.py 都有)
  - ✅ is_pro 回落(pro 用完返普通 + 奖 3 次)完整保留
  - ✅ 异常时 rollback + 友好错误返回
  - ✅ `pytest sumai/tests/` 91 passed 基线持平(全程零回归)
- **mock sensor 状态**(@tester R3-D 已处理 2026-04-25):
  - ✅ `test_rate_limiting.py::test_race_condition_sensor` 维持 xfail(strict=False),reason 更新为"全 31 端点已用 validate_and_deduct(SELECT FOR UPDATE)实施保护,mock 不能模拟 MySQL InnoDB 行锁,集成测试需 R4+"
  - ✅ test_rate_limiting.py 顶部 docstring 警告:整个文件 mock 旧 validate_request_and_user(已删),激活前需重写为新 API mock(R4+ 任务)
  - ✅ 4 个 W2-2 fallout 测试已修正(hunyuan→wanxiang)
  - 🟡 后续 R4+: 写真连 MySQL 的集成测试 `test_race_condition_integration.py`,验证 SELECT FOR UPDATE 真正阻塞
- **生产前置(@devops)**: 验证 `p_user_base` 表引擎为 InnoDB(`SHOW TABLE STATUS LIKE 'p_user_base'`)— MyISAM 不支持 FOR UPDATE 行锁
- **优先级**: ✅ 完全 close
- **负责**: @backend R3-B 全端点 + 旧函数删除 + @tester R3-D 测试激活清理 + W2-2 fallout 修正

---

## 🟢 灰色 / 技术债(Session 3 新增)

### GRAY-006 · pages/index/index.js 含 3038 个 U+00A0 非断空格

- **发现日期**: 2026-04-24 Session 3(@frontend 写 Stage 1 UX 时发现)
- **现状**: 整个 index.js 的缩进几乎全用 U+00A0(非断空格),而非标准 U+0020 空格
- **来源**: pre-existing — Session 2 之前的代码就这样(可能是 copy-paste 时从富文本编辑器带进来的)
- **影响**:
  - Edit 工具匹配字符串时多次失败(string 匹配不上)
  - 微信小程序编译器容忍(代码能正常运行)
  - 但降低代码可维护性,未来 agent 改动困难
- **解决方案**: 用 sed 或 Python 批量替换 `U+00A0` → `U+0020`,然后 `node --check` 验证
- **优先级**: P3(Stage 2+ 重构期统一清理)
- **负责**: @frontend

---

## 🔴 红色警报状态更新(Session 3 追加)

### RED-001 · 状态变更 2026-04-24

- **从**: 未处理,Anthropic 是主力
- **到**: ✅ **大部分完成**(@backend Wave 1)
  - `sumai/stream.py`:新增 `get_openai_client_and_config()` 用 Qwen 3.6,`/test123` 端点迁移
  - `sumai/stream_en.py`:新增 `get_openai_client_and_config()`,10 个端点 + 11 个 generate() 迁移
  - **附带 bug 修复**:stream_en.py 有 4 个端点原本调用不存在的 `get_openai_client_and_config`(pre-existing bug,现已一并修复)
  - `get_claude_client_and_config()` 函数保留(标 deprecated,RED-002 时清理)
- **剩余**: RED-002 Wave 2 时把 Anthropic 导入 + API Key 硬编码一并清理

### RED-002 · 新增子项(Session 3 发现)

除原有凭证硬编码外,新增:
- **Flask `app.secret_key = '123456qwerty'`**(`mainv2.py:55`)— 弱密钥!PC Web session 可被伪造。Wave 2 用 `secrets.token_urlsafe(32)` 生成强随机替换,并外移到 .env。

### RED-002 · 状态变更 [2026-04-24 22:30] ✅ 主文件已解决

- **从**: 所有凭证硬编码在 sumai 源代码,app.secret_key 为弱密钥 '123456qwerty'
- **到**: ✅ **5 个主文件完成**(@backend Wave 2 Round 1 · W2-1)
  - `sumai/mainv2.py` / `note.py` / `pay_stripe.py` / `stream.py` / `stream_en.py` 所有硬编码 API Key / 密码 / AppSecret / MCHID / OSS key / Stripe key 已改为 `os.environ[...]` 或 `os.getenv(...)` 读取
  - `app.secret_key` 已从 `'123456qwerty'` 换为 64 字符 hex random (`os.environ['FLASK_SECRET_KEY']`)
  - `sumai/.env.example` 新建,声明全部 27 个必需环境变量 + 注释
  - `sumai/.env` 本地开发用,被 `.gitignore` 排除
  - `sumai/mainv2.py` 顶部加 `load_dotenv()`,各蓝图模块独立 `load_dotenv()` (幂等)
  - `json_test` 端点的死代码 + merchant secret 已删除
  - 测试基线:`89 passed` → `91 passed`,`0 new failure`
- **剩余废弃文件硬编码**(不影响主路由,属 GRAY-004):
  - `sumai/claude_*.py` (11 个文件,含 Anthropic key 硬编码)
  - `sumai/bigmodel/*.py` / `sumai/deepseek/*.py` (含 Qwen key)
  - `sumai/moonshot.py` (含 Kimi key)
  - 这些文件均**未被主路由 import**,生产运行不涉及,但残留 key 仍算合规风险 → GRAY-004 任务
- **生产迁移待办**(@devops):
  - 在生产服务器 `/etc/supervisor/conf.d/sumai.conf` 或 `/home/www/sumai/.env` 设置 27 个环境变量(清单见 `backend-progress/context-for-others.md`)
  - 确认 venv 装有 `python-dotenv>=1.0.1`(requirements.txt 已含)
  - 切换 `FLASK_SECRET_KEY` 时提醒 PC Web 用户需重新扫码登录(小程序无影响)
  - 详细指南草稿:`sumai/docs/RED-002_env_migration_guide.md`(@devops 待定稿)
- **测试影响**(@tester):
  - `tests/test_no_hardcoded_credentials.py` 中 3 个故意 xfail 测试仍 xfail(命中废弃文件),预期行为
  - `tests/test_code2session.py::test_code2session_uses_correct_mini_appid` 已更新为检查 env 引用而非硬编码文本

---

---

## Wave 2 收官状态汇总(2026-04-25)

| 警报 | Wave 2 前 | Wave 2 后 | 解决路径 |
|---|---|---|---|
| RED-001 | 🔴 P0 | ✅ 已解 | Wave 1 @backend 迁移 stream.py + stream_en.py 到 Qwen 3.6 |
| RED-002 | 🔴 P0 | ✅ 已解 | Wave 2 R1 @backend 27 变量 .env 外移 + Flask 强密钥;主文件 mainv2/note/pay_stripe/stream/stream_en 全部 os.getenv() 化 |
| RED-003 | 🔴 P0 | 🟢 D014 P3 | Founder 决策"暂不轮换证书"(付费<500 + SSH 可信),gitignore 已补救,git-filter-repo 待触发条件 |
| YELLOW-001 | 🟡 P1 | ✅ 已解 | Wave 2 R2 @backend 方案 Y(/wanxiangStream + EN 新建,/hunyuanStream + EN 删除)+ R3-D test sensor 激活 |
| YELLOW-002 | 🟡 P2 | ✅ 已解 | Wave 1 PM 清前端 labelSync 僵尸代码 |
| YELLOW-003 | 🟡 P3 | 🟢 Founder 决策不管 | Stage 2+ 顺手清 |
| YELLOW-004 | 🟡 P1 | ✅ 已解 | Wave 2 R3-B @backend 全 31 端点切 validate_and_deduct(SELECT FOR UPDATE + 同事务) |
| GRAY-001~006 | 🟢 | 🟢 留 Stage 2+ | GRAY-001/002 已部分解(sumai 92 test + sumai/CLAUDE.md);其他保留 |

**结论**:
- 所有 P0 红警已闭环(2 解决 + 1 D014 降级)
- 所有 P1 黄警已解决(YELLOW-001 + YELLOW-004)
- P2/P3 残留按 D014 / Founder 决策推迟到 Stage 2+


---

## GRAY-007 · scroll-view enable-flex + display:flex 双开 bug(2026-04-27 新增)

**严重度**: 🟢 P2(Stage 2 全项目排查)

**现象**:
- WeChatLib 3.6.0(可能更早版本也有)
- `<scroll-view scroll-x enable-flex>` + 同 selector wxss `display: flex` 双开
- scroll-view 高度计算异常(撑大父容器或采用 default 几百 rpx)
- 在 `overflow: hidden` 父级下表现为大块空白

**首次发现**: 2026-04-27 Stage 1 真机回归,`.style-options-scroll` 触发,产生 ~600rpx 异常空白

**修复模式**:
- wxml `enable-flex` 属性保留(scroll-x 需要它)
- wxss 删 `display: flex` + `justify-content: center`
- 改 `text-align: center`(子元素 inline-flex 自然居中)
- 加显式 `height: Nrpx`(scroll-x 必备)

**Sources**:
- 官方 [scroll-view 文档](https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html)
- [SegmentFault scroll-view 高度自适应解决方案](https://segmentfault.com/a/1190000023544769)
- [博客园 - scroll-view 几个坑](https://www.cnblogs.com/Lyn4ever/p/11282210.html)
- [enable-flex 失效解决方法](https://blog.csdn.net/qq_36734002/article/details/118086975)

**Stage 2+ 排查清单**:
- `pages/history/`
- `pages/favorites/`
- `pages/profile/`
- `pages/shared/`
- `pages/login/`
- `pages/settings/`
- `pages/feedback/`

如有同样的 enable-flex + display:flex 双开,按本次模式修复。

---

## STAGE-1 · 三档复杂度功能下架(2026-04-28 D017)

**功能** Stage 1 Wave 1 上线 UI + Wave 2 R3-A 上线后端 directive
**verdict**: 鸡肋,Founder 拍板下架

**鸡肋原因**:
1. standard 档 directive = 空字符串(形同虚设)
2. quick / professional 是软建议非硬约束(Qwen 听不听不可控)
3. professional 末尾固定追加 "💎 建议:此 prompt 适合保存为项目模板..." 用户复制时多余
4. 没做过真实 A/B 验证

**下架范围**(由本周 spawn 的 teammate 执行):
- 前端 WXML: 删 complexity-selector / complexity-options / complexity-hint
- 前端 WXSS: 删 .complexity-* 所有样式 + .input-area-professional + .result-card-professional + .professional-badge
- 前端 JS: 删 currentComplexity / complexityOptions / switchComplexity / 透传 complexity 字段
- 后端 stream.py + stream_en.py: 删 COMPLEXITY_DIRECTIVES dict + resolve_complexity 函数 + 31 端点内 directive 注入
- 测试: 删 test_complexity.py + 清理相关断言
- D016 命名决策保留为历史档案,不删

**Hero 文案保留**(定位文案"专业创作者的 AI Prompt 工作台"是有效的)


---

## STAGE-2 D018a/b · 伪上下文注入架构限制(2026-04-28 PM verdict)

**判定**: D018a 上下文注入 + D018b directive 强化 + 用户输入框 整套实现的局限
- LLM 看到 system = B + D(D 含 C 整段),user = A(原始)
- LLM 倾向"保留有效部分"(directive 措辞)+ 把"更换"当微调
- "保留 vs 更换"措辞矛盾,模型选保守
- 注入位置在 system 末尾,优先级低于 system 开头的原始 B
- Founder 真机:用户写"换场域和角色",输出几乎复述上一轮

**替代方案 D019**: 真·多轮对话(chat completion 原生)
- 删 CONTEXT_INJECTION_TEMPLATE / REFINE_INSTRUCTION_TEMPLATE
- conversation_history append [{user:A}, {assistant:C}, {user:用户修改指示}]
- 用户消息**变了**(不再是 A,而是"对 C 的具体不满"),LLM 真听话
- D018a/b 整套 directive 即将被废弃
- F-4 .replace() 链式问题自动消失(不再用 .replace 拼)

**Founder 决策**(2026-04-28):
- Token 消耗增长接受
- UI 不展示历史(选项 a)
- 输入框 placeholder 改"告诉 AI 要怎么改(如:换个场域和角色...)"
- 跳过填写时给默认兜底"请基于以上输出做明显改进"
