# Tester(测试) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 21:43 D020 防御 sensor 4/4 PASS — 等 PM 审查
> 角色: tester

---

## 最新测试结果(D020 收尾 [2026-04-28 21:43])

| 测试项 | 结果 | 日期 |
|--------|------|------|
| xuhua-wx 全量(`pytest tests/`) | ✅ **18/18 PASSED**(持平) | 2026-04-28 21:43 |
| sumai 全量(`pytest tests/`) | ✅ **97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed = 198 total** | 2026-04-28 21:43 |
| 合规(无境外 LLM) | ✅ PASS | 2026-04-28 |
| 架构(必需文件存在)| ✅ PASS | 2026-04-28 |
| 质量门(app.json 合法)| ✅ PASS | 2026-04-28 |
| Qwen 3.6 模型名合规 | ✅ PASS(`test_qwen_model_name_is_correct_in_config`)| 2026-04-28 |
| Stage 2 D019 真·多轮对话(messages history) | ✅ **3 active PASS + 1 skip stub**(`test_multi_turn_history.py` Test 1-5) | 2026-04-28 |
| **Stage 2 D020 footer 常量(锁定关键短语)** | ✅ **PASS** Test 6 | 2026-04-28 21:43 |
| **Stage 2 D020 调温 >= 0.8** | ✅ **PASS** Test 7 | 2026-04-28 21:43 |
| **Stage 2 D020 Pro 模型 qwen3.6-plus** | ✅ **PASS** Test 8(deepseek-v3 已 0 hits) | 2026-04-28 21:43 |
| **Stage 2 D020 31 端点应用 footer + 调温** | ✅ **PASS** Test 9(MULTI_TURN_FOOTER 35 / final_system 85 / final_temperature 68 — 远超阈值) | 2026-04-28 21:43 |
| ~~complexity 三档 directive~~ | ❌ **D017 下架** | 2026-04-28 |
| ~~Stage 2 D018a/b system prompt 注入~~ | ❌ **D019 下架** | 2026-04-28 |
| wanxiangStream 用 Qwen | ✅ PASS | 2026-04-25 R3-D |
| TOCTOU xfail sensor | ⚠️ xfail(R3-B 已修保护,mock 局限,reason 已更新) | 2026-04-25 |
| 手动回归 5 关键流程 | 待做(D020 完成后强烈建议) | — |
| 主包尺寸 | ~800 KB(< 2 MB)| 2026-04-25 |

---

## 错误模式沉淀

- 当前无 EP 记录(`.team-brain/knowledge/ERROR_PATTERNS.md` 占位中,随项目推进填入)

---

## 给 @backend 的上下文

### Stage 2 D020 防御 sensor 4/4 PASS ✅

**Sensor 终态(2026-04-28 21:43)**:

| Test | 设计 | 状态 |
|---|---|---|
| Test 6 footer 常量 | MULTI_TURN_FOOTER + _EN 顶部定义 + 关键短语锁定 | ✅ **PASS** |
| Test 7 调温 >= 0.8 | MULTI_TURN_TEMPERATURE / _EN >= 0.8(默认 0.85) | ✅ **PASS** |
| Test 8 Pro 模型 qwen3.6-plus | 不含 deepseek-v3-250324 + 含 qwen3.6-plus-2026-04-02 + 含 qwen3.6-flash-2026-04-16 | ✅ **PASS** |
| Test 9 31 端点应用 | grep MULTI_TURN_FOOTER 35/18 + final_system 85/17 + 等 | ✅ **PASS**(远超阈值) |

### Sensor 实测 grep 计数(全部远超阈值)

- stream.py `MULTI_TURN_FOOTER` 引用 = **35**(阈值 18,1 def + 34 应用)
- stream.py `MULTI_TURN_TEMPERATURE` 引用 = **35**(阈值 18)
- stream_en.py `MULTI_TURN_FOOTER_EN` 引用 = **29**(阈值 15)
- stream_en.py `MULTI_TURN_TEMPERATURE_EN` 引用 = **29**(阈值 15)
- stream.py `final_system` = **85** / `final_temperature` = **68**(阈值 17)
- stream_en.py `final_system` = **70** / `final_temperature` = **56**(阈值 14)
- stream.py `qwen3.6-plus-2026-04-02` = **2**;stream_en.py = **1**
- stream.py `deepseek-v3-250324` = **0**(完全清除)

✅ D020 实施扎实!

### 注意事项

1. `backend-progress` 三件套时间戳停在 16:21 D019,**未刷新到 D020** — PM 已知会,建议你完成后更新
2. 你已同步更新 `sumai/CLAUDE.md` 反映 D020 闭环(L137 / L242-256),非常好
3. PM 完成审查后会统一 commit,不要自己提前 commit

### 命名容忍(已用)

Sensor Test 9 接受 3 种命名,你选了 `final_system` + `final_temperature`(85/68/70/56 处),完全合规。

### Follow-up(P2-P3 非紧急,延续 D019)

1. **Test 4 stub 激活**: 端点级集成测试(Flask client + LLM mock 抓 messages list,完整 TODO 已写)
2. **建议加 sensor `test_d020_no_legacy_d018ab_residue`**(P3): 防御未来误把 D018a/b 残留代码恢复
3. **test_rate_limiting.py 6 测试激活前需重写**(P2):mock 旧 API 已删
4. **TOCTOU 集成测试**(P2): 真连 MySQL InnoDB 验证 SELECT FOR UPDATE
5. **stream_en.py validate_and_deduct 单测**(P2)

---

## 给 @frontend 的上下文

- xuhua-wx tests/ 18/18 全绿,无前端回归
- D020 完全后端 prompt engineering,不动前端
- 真机回归建议:D020 上线后多轮"完全不一样"指令应得到与上轮 80%+ 不同的输出(footer 强约束 + 调温 + Qwen 3.6 Plus 多轮 instruction following 改善)

---

## 给 @devops 的上下文

- sumai 测试不进 CI(Founder 决定)
- 本轮新增 4 个 D020 active sensor(0 删除,只追加),test_multi_turn_history.py 从 ~430 行 → ~680 行
- 本地运行依赖:仅 stdlib(json/re/pathlib/textwrap),不需要 mysql/flask/redis/anthropic/openai
- 当前本地基线 = 生产期望基线:**97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed = 198 total**

---

## 给 @pm 的上下文

### 本轮(D020)完成清单 ✅

| 任务 | 状态 |
|---|---|
| Step 1 读 TEAM_CHAT 最新 + DECISIONS D020 + 检查 @backend 进度 | ✅ |
| Step 2 追加 4 个 D020 active sensor(~230 行) | ✅ |
| Step 3 全量回归(xuhua-wx 18 + sumai 97/0/96/3/2) | ✅ |
| Step 4 HARNESS_HEALTH 更新(+4 sensor 行 + D020 变更记录) | ✅ |
| Step 5 微信合规(无境外 LLM,无新依赖) | ✅ |
| Step 6 与 @backend 协同(@backend 21:42:53 完成实施 + 同步 sumai/CLAUDE.md) | ✅ |
| TEAM_CHAT 完成消息追加 | ✅ |
| Progress 三件套刷新 | ✅ |

### 给 PM 审查的关键点

1. **基线**: xuhua-wx 18/18 持平 ✅;sumai 97 passed / 0 failed ✅(超过预期 96 passed,可能 @backend 修复时附带修了某个测试)
2. **D020 sensor 4/4 PASS**: 全部远超阈值,实施扎实
3. **未自行 commit**:等 PM 审查统一 commit
4. **修改文件**:
   - `sumai/tests/test_multi_turn_history.py`(末尾追加 ~230 行,4 D020 sensor)
   - `.claude/agents/tester-progress/{current,completed,context-for-others}.md`(三件套)
   - `.team-brain/status/HARNESS_HEALTH.md`(2 处:Sensor 表 +4 行 + 最近变更记录)
   - `.team-brain/TEAM_CHAT.md`(本条追加,已附完成确认)
   - **@backend 同期改了**: `sumai/stream.py` + `sumai/stream_en.py`(D020 31 端点应用 + Pro 模型切换)+ `sumai/CLAUDE.md`(D020 闭环说明)

### 风险与后续

| 项 | 优先级 | 说明 |
|---|---|---|
| @backend progress 三件套停 16:21 | P1 | PM 监督 @backend 完成 D020 后更新三件套 |
| 真机回归 5 关键流程(D020 上线后) | **P1** | 强烈建议:D020 footer + 调温 + Qwen Plus 后,多轮"完全不一样"指令应得 80%+ 不同输出 |
| Test 4 stub 激活(端点级集成) | P2 | 等 sumai test 基础完善 |
| D018a/b 残余防御 sensor(P3) | P3 | 延续 D019 follow-up |

---

## 上次更新记录

- **2026-04-28 21:43 本轮 D020 收尾**: 4 D020 active sensor 全 PASS,xuhua-wx 18/18 / sumai 97 passed / 0 failed
- **2026-04-28 21:38 本轮 D020 启动**: 追加 4 D020 active sensor(2 PASS + 2 等 @backend),HARNESS_HEALTH 更新
- 2026-04-28 D019: 删 test_context_injection.py + 新建 test_multi_turn_history.py(3 active + 1 skip)
- 2026-04-28 D017+D018a: 删 test_complexity.py + 新建 test_context_injection.py(D019 已删)
- 2026-04-25 Wave 2 Round 3 D: R3-D 收尾
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + Round 3 草稿
- 2026-04-24 Session 3 Wave 1: 5 测试文件
- 2026-04-24 Session 2: sumai 185 测试骨架
- 2026-04-24 Session 初始化: tests/ + HARNESS_HEALTH.md
