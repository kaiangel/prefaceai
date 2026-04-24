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

### YELLOW-001 · `/wanxiangStream`(通义万相视频生成)孤儿调用

- **发现日期**: 2026-04-24
- **位置**: 前端 `pages/index/index.js:272` 调用,后端 sumai 没实现
- **现状**: 生产环境上**"通义万相"视频生成功能 404 失败**
- **验证**: 需手动在小程序选"通义万相"模式下尝试生成视频,确认失败
- **解决方案**:
  - **选项 A**: 在 sumai 补 `/wanxiangStream` 端点
  - **选项 B**: 从前端模型列表中**下架**"通义万相"(如果没需求)
- **优先级**: P1(影响功能 + 品牌形象 — 用户选中后 404)
- **负责**: Founder 决策(继续还是下架)→ @backend 或 @frontend 执行

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

### YELLOW-004 · TOCTOU 竞争条件 — 用户次数扣减可能 lost update

- **发现日期**: 2026-04-24 Session 3(@tester 分析 sumai/stream.py 时发现)
- **位置**:
  - `sumai/stream.py:1753` `validate_request_and_user()`(SELECT limit_num-used_num)
  - `sumai/stream.py save_content_prompt_stream()`(UPDATE used_num)
- **现状**: 两个操作是**独立 DB 连接**,中间无事务保护
- **风险**: 并发用户(如 5 个同时请求)可能都通过 validate(看到 count=1)后各自扣减,实际只扣 1 次但消耗 5 次额度 → **用户多扣次数 / 少扣次数**(取决于 InnoDB 行级锁具体行为)
- **Sensor**: `sumai/tests/test_rate_limiting.py::test_race_condition_sensor`(xfail 状态,修复后自动变绿)
- **解决方案**: 
  - **选项 A**:用 `SELECT ... FOR UPDATE` + 同一 transaction 保护
  - **选项 B**:合并 validate 和 save 为单一原子 UPDATE(减少往返)
  - **选项 C**:用 Redis 原子操作做限流层(额外一层保护)
- **优先级**: P1(Stage 2 前修复,否则付费用户可能投诉次数被多扣)
- **负责**: @backend

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

---
