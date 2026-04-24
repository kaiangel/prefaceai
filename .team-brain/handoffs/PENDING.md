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

#### [B1-b] RED-002 凭证外移 .env
- **背景**: 所有 API Key/密码/Secret 硬编码在 sumai 代码里
- **新增发现**(Session 3): `app.secret_key = '123456qwerty'` Flask session 弱密钥,PC Web 可被伪造 session cookie
- **具体**:
  - 创建 `sumai/.env.example`(列变量名不列值)
  - 重构 `mainv2.py` / `note.py` / `pay_stripe.py` 等用 `python-dotenv` 加载
  - **强密钥替换**: `app.secret_key` 用 `secrets.token_hex(32)` 生成强密钥
  - 更新 `sumai/.gitignore` 确保 `.env` 不进 git(已部分完成)
  - 生产服务器配置迁移(Supervisor env 或 systemd env)
- **负责**: @backend + @devops
- **优先级**: P0
- **前置**: 无
- **预估工作量**: 1 天

#### [B1-c 剩余] RED-003 git 历史清理 + 证书轮换
- **已完成**(Session 3): gitignore 补救 + 13 文件 untrack
- **未完成**: 
  - Founder 外部执行 `git-filter-repo` 清历史(破坏性 + 影响所有 clone 者)
  - **最高优先级**: 轮换微信支付商户证书
  - 轮换 TLS 证书(duyueai.com / api.xuhuaai.com / prefaceai.net)
- **指南**: `sumai/docs/RED-003_git_history_cleanup_guide.md`

### P1 黄色警报

#### [B2-a] YELLOW-001 /wanxiangStream 方案 Y 实施(D010)
- **决策**: 后端规范化 + 下架 hunyuan(Founder 决定)
- **具体**:
  - @backend: sumai 新建 `/wanxiangStream` 端点,system prompt 对应通义万相
  - @backend: 删 `/hunyuanStream` 端点(没在用)
  - @frontend: 从模型列表移除 "混元",保留 "通义万相"
- **优先级**: P1
- **前置**: Founder 生产线上 404 double-check
- **预估工作量**: 半天

#### [B2-b] /recent_generation — 🟡 Founder 决策: 先不管(2026-04-24)
- 留作 Stage 2+ 顺手清

#### [B2-c] /labelSync 前端 — ✅ 2026-04-24 已完成

### P1 Stage 1 后端跟进

#### [Stage1-prep-3] "专业项目" system prompt 三档配置
- **背景**: 前端三档选择器已上线(D012 方案 B 先行),后端未跟进
- **前端契约**: `complexity` 字段(enum: quick/standard/professional),透传 `generateContent()` body
- **后端 fallback**: 未收到 → `standard`
- **具体**:
  - @backend: 在 stream.py + stream_en.py 各 generate() 函数解析 complexity
  - 三档 system prompt:快速(短)/ 标准(当前默认)/ 专业(长 + 结构化 + 模板尾注)
  - 确保 complexity 在所有 12+ 端点都支持
- **优先级**: P1
- **前置**: RED-001 ✅ 已完成
- **预估工作量**: 1 天

### P1 测试跟进

#### [T1] TOCTOU test 激活
- **背景**: YELLOW-004 新增,Session 3 @tester 发现
- **具体**: @backend 修 TOCTOU(SELECT FOR UPDATE + 同 transaction)后,@tester 移除 xfail 标记
- **优先级**: P1(Stage 2 前必修)
- **负责**: @backend + @tester
- **预估工作量**: 半天

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

## Founder 外部任务(Wave 1 后)

1. **真机验证三档**(iPhone SE 375px / iPhone 14 Pro Max 428px)
2. **通义万相线上 404 double-check**
3. **git-filter-repo 外部操作**(影响所有 clone 者,指南在 sumai/docs/)
4. **微信支付商户证书轮换**(最高优先级,RED-003 前置)
5. **Wave 2 启动决策**

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
