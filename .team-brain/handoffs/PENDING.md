# 待交接事项

> 维护者: PM (Coordinator 在兼 PM 模式下维护)
> 规则: 追加式,完成后打 ✅

---

## 当前待交接(2026-04-24 Session 3 Wave 1 后)

### ✅ Wave 1 完成项(2026-04-24 Session 3)

- ✅ **[B1-a] RED-001 Anthropic → Qwen 3.6 迁移**(stream.py + stream_en.py 约 30 处,test_qwen_model_name 已同步修)
- ✅ **[B1-c 部分] RED-003 gitignore + 13 文件 untrack**(git-filter-repo 外部操作由 Founder 执行,`sumai/docs/RED-003_git_history_cleanup_guide.md` 已提供)
- ✅ **[B4] sumai/CLAUDE.md**(Session 2 完成)
- ✅ **[B5] sumai 测试骨架**(Session 2 建立 + Session 3 新增 test_rate_limiting + 4 stub)
- ✅ **[Stage1-prep-2] 三档复杂度 UX 草稿**(Wave 1 @frontend 完成,已上线等后端跟进)
- ✅ **GitHub 迁移**(xuhua-wx → kaiangel/prefaceai main,sumai → 101.132.69.232:sumai.git master)

---

## Wave 2 待启动(等 Founder 指令)

### P0 红色警报剩余

#### ✅ [B1-b] RED-002 凭证外移 .env + 强密钥 (2026-04-24 22:30 @backend W2-1 完成)
- 5 个主文件(mainv2 / note / pay_stripe / stream / stream_en)凭证全部外移
- `app.secret_key` 换成 64 字符 hex 强密钥
- `.env.example` 已建,27 个变量声明齐全
- 测试基线 89 → 91 passed,0 new failure
- **剩余**(移交 @devops 做生产部署):
  - 生产服务器设置 27 个环境变量(详见 `backend-progress/context-for-others.md`)
  - 生产 venv 确认 `python-dotenv` 已装
  - FLASK_SECRET_KEY 切换时机(导致 PC Web session 失效,用户需重新登录)
- **完全 close 后再移**(等废弃文件硬编码也清理,归 GRAY-004 处理)

#### [B1-c 剩余] RED-003 git 历史清理 + 证书轮换
- **已完成**(Session 3): gitignore 补救 + 13 文件 untrack
- **未完成**: 
  - Founder 外部执行 `git-filter-repo` 清历史(破坏性 + 影响所有 clone 者)
  - **最高优先级**: 轮换微信支付商户证书
  - 轮换 TLS 证书(duyueai.com / api.xuhuaai.com / prefaceai.net)
- **指南**: `sumai/docs/RED-003_git_history_cleanup_guide.md`

### P1 黄色警报

#### ✅ [B2-a] YELLOW-001 /wanxiangStream 方案 Y 实施(D010) — 2026-04-24 23:45 @backend W2-2 完成
- ✅ `/wanxiangStream` 新建(sumai/stream.py,复制原 /hunyuanStream 实现,system prompt 一字未改)
- ✅ `/hunyuanStream` 下架(stream.py 留注释,stream_en.py 同理 EN 版)
- ✅ `/wanxiangStreamEN` 新建,`/hunyuanStreamEN` 下架
- ✅ **@frontend W2-3 完成**(2026-04-24 21:44):`pages/index/index.js` 6 处 + `pages/index/index.wxml` 1 处 + `config/cdn.js` 1 处 hunyuan 清除;wanxiang 路由 `'https://www.duyueai.com/wanxiangStream'` 保留就绪;xuhua-wx `pytest tests/` 18 passed 零回归;主包净减少 ~1.5 KB。另发现 favorites/history/shared 3 个文件仍有 hunyuan 显示标签,为历史数据兼容保留,建议 Stage 2+ 由 @backend 扫 DB 确认后再清理。
- **剩余**(Round 3):
  - @tester Round 3 更新 4 个 test(`test_endpoints_exist.py::test_sse_video_endpoints_exist` / `test_sse_stream_structure.py::test_all_sse_endpoints_accept_both_methods` / `test_qwen_client.py::test_hunyuan_stream_uses_qwen` / `test_orphan_endpoints.py::test_wanxiang_stream_is_absent`)

#### [B2-b] /recent_generation — 🟡 Founder 决策: 先不管(2026-04-24)
- 留作 Stage 2+ 顺手清

#### [B2-c] /labelSync 前端 — ✅ 2026-04-24 已完成

### P1 Stage 1 后端跟进

#### [Stage1-prep-3] "专业项目" system prompt 三档配置 — ✅ 2026-04-25 后端完成(R3-A)
- **背景**: 前端三档选择器已上线(D012 方案 B 先行),后端 R3-A 跟进
- **前端契约**: `complexity` 字段(enum: quick/standard/professional),透传 `generateContent()` body
- **后端 fallback**: 未收到 / 无效值 → `standard`(等同当前默认行为)
- ✅ **后端实施完成(2026-04-25 R3-A @backend)**:
  - `sumai/stream.py` 顶部新增 `COMPLEXITY_DIRECTIVES` dict(中文版)
  - `sumai/stream_en.py` 顶部新增 `COMPLEXITY_DIRECTIVES_EN` dict(英文版)
  - 两个文件各新增 `resolve_complexity(data)` 工具函数
  - 全部 31 个 SSE 端点(stream.py 17 + stream_en.py 14)的 conversation_history.append(system) 都已注入 directive
  - **不复制 system prompt**: 用 dict 追加 directive,原 90 个 system prompt 一字未改,改动量从 270 处缩小到 31 处
  - 后端 fallback 'standard' 覆盖前端不传 / 无效值场景,防御编程
- ✅ **前端透传部分完成(2026-04-25 R3-C @frontend)**:
  - `pages/index/index.js` L2358 `generateContent()` POST body 加 `complexity: this.data.currentComplexity`(覆盖 14 个 SSE 端点 botPromptStream/reasoning/aiAgent/dalleStream/fluxStream/jimengpic/lovartpic/midjourney/keling/jimengvid/lovartvid/runway/wanxiang/sora2)
  - `pages/index/index.js` L473-474 `generateImageDescription()` GET URL query 加 `&complexity=...`(覆盖 `/describeImageStream`)
  - 默认值 `quick`(未改),后端 fallback `standard`(@backend R3 实施)
  - `pytest tests/` 18/18 PASS,`node --check` 语法 OK,主包尺寸增量 ~145 字节
- **端到端就绪**: @backend + @frontend 双方完成,端到端联调可在 @tester R3-D 全量回归后进行
- **测试激活**: `sumai/tests/test_complexity.py` 3 stub 等 @tester R3-D 激活(详见 backend context-for-others.md 给的修正建议)
- **优先级**: ✅ 已解决

### P1 测试跟进

#### ✅ [T1] TOCTOU 全端点修复完成 — @backend Round 3 (R3-B) + @tester Round 3 (R3-D) 收尾
- ✅ stream.py 17 端点 + stream_en.py 14 端点 = 全部 31 端点切到 `validate_and_deduct` + `save_prompt_record`
- ✅ 旧 `validate_request_and_user` + `save_content_prompt_stream` 已删除(stream.py + stream_en.py 各一对,共 4 个函数定义)
- ✅ stream_en.py 新增本模块独立 `validate_and_deduct` + `save_prompt_record`(从 stream.py 复制)
- ✅ Google 用户 origin='google' 路径完整保留
- ✅ is_pro 回落(pro 用完返普通 + 奖 3 次)完整保留
- ✅ pytest sumai/tests/ R3-D 基线 92 passed(R1 基线 91 + R3-D 净 +1),无回归
- ✅ **@tester R3-D 完成**(2026-04-25):
  - 删除 `test_validate_request_and_user.py`(11 stub 死代码,旧函数已删,no backward compatibility)
  - 删除 `test_sse_complexity_routing.py`(D016 deep 命名废弃)
  - 重写 + 激活 `test_complexity.py` 3 个 test 为针对 COMPLEXITY_DIRECTIVES dict 的静态扫描,3/3 PASS
  - W2-2 fallout 4 个测试修正(hunyuan→wanxiang)
  - TOCTOU sensor 保留 xfail + reason 更新(全 31 端点保护已就位 + mock 局限)
  - HARNESS_HEALTH.md sensor 表 +4 行
- 🟡 R4+ follow-up(非紧急,文档已警告):
  - test_rate_limiting 6 个测试激活前需重写(mock 旧函数,本地全 skip)
  - TOCTOU 集成测试需真连 MySQL InnoDB
- **优先级**: ✅ 完全 close

#### [T2] 回归全量测试
- **背景**: RED-001 迁移后确保没破坏
- **具体**: `cd sumai && pytest tests/ -v`(当前 89 passed / 111 skipped)
- **已完成**: Session 3 已运行一次 ✅
- **负责**: @tester(Wave 2 前再跑一次)

### P2 Stage 1 真正开工前

#### [Stage1-prep-1] Co-founder 对齐
- **Founder 已说不需要对齐,留作备忘**

### P2 其他整理(Stage 2 之后)

- **[GRAY-003]** 序话小程序代码重构: Markdown 渲染去重 + 模型检测去重
- **[GRAY-004]** sumai 废弃文件清理(`claude_*.py` / `app.py_back` / `deepseek/` / `bigmodel/` / `moonshot.py`)→ 移到 `sumai/legacy/` 或删除
- **[GRAY-005]** 前端生成状态机重构(合并 isGenerating / isGenerationActive / isCompletelyTerminated)
- **[GRAY-006]** `pages/index/index.js` 3038 个 U+00A0 统一清理(Session 3 新增)

---

## Founder 外部任务(Wave 2 期间 + 之后)

### 🟡 P1 · Wave 2 并行执行
1. **通义万相线上 404 double-check** — 打开小程序选"通义万相"发一条,如果居然能跑,立即 SendMessage 给 PM,W2-2 紧急中止
2. **真机验证 Stage 1 三档**(iPhone SE 375px / iPhone 14 Pro Max 428px)— Wave 2 全部完成后进行,作为 Stage 1 数据埋点前提

### 🟢 P3 · 推迟处理(D014 决策 2026-04-24)
3. **TLS 证书轮换**(duyueai.com / api.xuhuaai.com / prefaceai.net)— 简单无审核,合适时间窗口执行,不紧急
4. **微信支付商户证书轮换** — **暂不做**(付费 <500 人 + SSH 可信 + 无异常交易),D014 触发条件达到再启动
5. **git-filter-repo 外部操作** — 可选,指南在 `sumai/docs/RED-003_git_history_cleanup_guide.md`,轮换证书之前做或之后做都可,当前非紧急

---

## 历史记录(完成的交接)

- 2026-04-22: Session 1 战略讨论完成 ✅
- 2026-04-24 Session 2: PORTING Phase 1-4 完成 ✅
- 2026-04-24 Session 2: GitHub 与本地对齐 ✅
- 2026-04-24 Session 2: sumai 克隆到本地 + Explore 深度扫描 ✅
- 2026-04-24 Session 2: KNOWN_ISSUES.md 创建 ✅
- 2026-04-24 Session 2: sumai-deep-dive-2026-04-24.md 归档 ✅
- 2026-04-24 Session 2: sumai/CLAUDE.md 编写完成 ✅
- 2026-04-24 Session 3: GitHub 迁移 kaiangel/prefaceai ✅
- 2026-04-24 Session 3: Wave 1 全部完成(4 teammate 并行) ✅
- 2026-04-24 Session 3: D009-D013 决策登记 ✅
- 2026-04-24 Session 3: app.js labelSync 僵尸代码清理 ✅

---

## 当前待交接(2026-04-28 Stage 1 下架 + Stage 2 启动)

### ✅ 04-27 三轮 UX hotfix 完成

- ✅ 方案 A padding/margin 微调(commit 6c82c37,失败但保留为基线)
- ✅ 方案 B page 高度锁死解除(commit 8538ee9,部分有效)
- ✅ 方案 C scroll-view enable-flex + display:flex 双开修复(commit 3d19d27,真因 ✅)

### ✅ 04-28 战略数据验证完成(Founder)

- ✅ 5 人 Mom Test 访谈
- ✅ Sean Ellis 40% 真实问卷
- ✅ 数据验证"复杂任务 beachhead"假设

### 🚀 Stage 1 三档下架(D017,本周内)

- @backend: 删 COMPLEXITY_DIRECTIVES dict + resolve_complexity 函数(stream.py + stream_en.py)+ 31 端点内 directive 注入
- @frontend: 删 complexity-selector wxml + complexity-* 全部 wxss + currentComplexity / complexityOptions / switchComplexity js + 透传 complexity 字段
- @tester: 删 test_complexity.py + 清理相关断言;回归 sumai 92 passed / xuhua-wx 18/18

### 🚀 Stage 2 第一个最小补丁(D018,本周内)

**C 方案 · 上下文注入(Conversational Refinement)**:
- @backend: stream.py 各端点支持新参数 `context_prompt`(上一轮 output),写入 system prompt context block
- @backend: 验证 Qwen 3.6 在多轮 context 下的输出质量(简单 sanity test)
- @frontend: result-card 内加 "基于此继续优化" 按钮,点击后把 result 作为 context 注入下一次 generateContent
- @frontend: 加视觉提示"第 N 轮迭代",让用户感知 Investment
- @tester: 加 test_context_injection.py 至少 3 个 stub
- 工作量预估 3-5 天

### 🟡 Founder 外部任务(待合适窗口)

- 生产部署 .env(按 sumai/docs/RED-002_env_migration_guide.md 12 步)
- TLS 证书轮换(D014 P3)
- git-filter-repo 外部操作(D014 P3)
- 微信支付商户证书轮换(D014 暂不,触发条件再启)


---

## 2026-04-28 PM 地毯审查 D018a 后发现的 follow-up(非本轮 fix)

### 🟡 [F-1 P2] refinementRound state machine race(SSE 失败时卡死)

- **现象**: `onRefineFromCurrent` 点击时立即 `refinementRound + 1`,但如果 SSE 失败/取消/网络挂,result 没更新而 refinementRound 已增加
- **影响**: 用户感知错乱,可能基于同一 fullContent 重复 refine
- **修复方向**: 改成 SSE 成功完成回调内 +1,失败时回滚
- **工作量**: 0.5 天 @frontend
- **触发条件**: Stage 1 数据观察期发现真实用户报告 / 真机异常网络重现

### 🟡 [F-2 P1] generateImageDescription GET URL 长度风险

- **现象**: GET URL 加 `&context_prompt=...`,5000 字符 ctx + URL encoding ~3x = 15000 字符,可能超 nginx 默认 8KB header buffer
- **影响**: 真机出 414 URI Too Long,/describeImageStream 在 refinement 时必崩
- **修复方向**: 改 POST(更彻底) / 前端截短到 2000 字符 / nginx 调大 buffer(@devops)
- **工作量**: @frontend 改 POST 1 天 / 仅截短 0.5 天
- **触发条件**: Founder 真机测试 /describeImageStream 的 refinement(图生 prompt 模式 + 点继续优化)出 414

### 🟡 [F-3 P2] previousOutput 可能被后端截断,前端不感知

- **现象**: ctx > 5000 字符 时后端 resolve_context 截断,前端不知道丢了多少
- **影响**: 用户感觉"模型没看完整"但前端无提示
- **修复方向**: 前端发送前自检 length > 5000 时弹 toast 提醒"上轮内容过长,将基于前 5000 字符优化"
- **工作量**: @frontend 0.5 小时
- **触发条件**: 用户上一轮 prompt 较长时

