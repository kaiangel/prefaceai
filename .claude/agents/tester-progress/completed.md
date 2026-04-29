# Tester(测试) - 已完成任务记录

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 21:38 D020 防御 sensor 4 个就位
> 角色: tester

---

## 已完成任务

### 2026-04-28 21:43 D020 防御 sensor 4/4 PASS(footer + 调温 + Pro 模型 + 31 端点应用)

**背景**: D019 v1 真机失败 → PM 地毯审查 4 真相(Pro 实际 deepseek-v3 文档过时;System Prompt B 2000+ 字符 schema 锁定;契约 100% 通但 LLM 受 system + 模型双重限制选保留 schema + 局部洗名字;不是工程 bug 是 prompt engineering + 模型选型)。

**D020 三件套修复**(Founder 拍板):
- A. history 非空时 system 末尾追加 MULTI_TURN_FOOTER 强约束指令
- B. 多轮 temperature 0.6 → 0.85(初次保持 0.6)
- C. Pro 模型 deepseek-v3 → qwen3.6-plus-2026-04-02(免费保持 qwen3.6-flash)

**Step 1 — 读上下文 + 检查 @backend 进度** ✅
- TEAM_CHAT 最新 + DECISIONS D020 全文
- stream.py / stream_en.py mtime Apr 28 21:35(@backend 在改),顶部常量 MULTI_TURN_FOOTER + MULTI_TURN_TEMPERATURE = 0.85 已就位
- 31 端点应用未完成(grep MULTI_TURN_FOOTER 引用 = 1)+ stream.py L317 仍 deepseek-v3-250324
- backend-progress 三件套停 16:21 D019 未刷新

**Step 2 — 追加 4 个 D020 active sensor(test_multi_turn_history.py 末尾 ~230 行)** ✅

| # | Test | 类型 | 最终状态 |
|---|------|------|--------|
| 6 | `test_d020_multi_turn_footer_constant_exists` | active 静态扫描 | ✅ **PASS** |
| 7 | `test_d020_multi_turn_temperature_is_increased` | active 静态扫描 | ✅ **PASS** |
| 8 | `test_d020_pro_model_is_qwen_not_deepseek` | active 静态扫描 | ✅ **PASS** |
| 9 | `test_d020_endpoints_apply_footer_when_history_present` | active 静态扫描(grep) | ✅ **PASS** |

**Test 6** zh 关键短语锁定:多轮对话特别处理 / 最高优先级 / 禁止用 / 换一个 / 完全不一样;en: multi-turn special handling / highest priority / do not use / completely different(忽略大小写)

**Test 7** MULTI_TURN_TEMPERATURE / _EN >= 0.8(D020 拍板 0.85),正则抽取浮点值 + float() 断言

**Test 8** 不含 deepseek-v3-250324 + 含 qwen3.6-plus-2026-04-02 + 含 qwen3.6-flash-2026-04-16

**Test 9** 31 端点 grep 计数:
- MULTI_TURN_FOOTER zh >= 18(1 def + 17 端点)+ MULTI_TURN_TEMPERATURE >= 18
- MULTI_TURN_FOOTER_EN en >= 15(1 def + 14 端点)+ MULTI_TURN_TEMPERATURE_EN >= 15
- final_system / system_with_footer / multi_turn_system 任一,zh >= 17 / en >= 14
- final_temperature / multi_turn_temperature / effective_temperature 任一,zh >= 17 / en >= 14

**Step 3 — 全量回归** ✅
- xuhua-wx 18/18 PASS(零回归)
- sumai **97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed = 198 total**(超过预期 96 passed,+5 vs D019 基线 92)
- 4 D020 sensor 全 PASS,远超阈值(MULTI_TURN_FOOTER 35/18,final_system 85/17,等)

**Step 4 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表 +4 行
- 合计行更新: 198 total / 97 passed / 0 failed
- 最近变更记录追加详细 D020 段(背景 + 4 sensor 设计 + 完成确认)

**Step 5 — TEAM_CHAT 完成消息追加 + 三件套刷新** ✅

**Step 6 — 与 @backend 协同**:启动检查发现 stream.py 21:35 mtime 在动,@backend 还在做 31 端点应用阶段。我编写 sensor + 文档过程中(21:38 → 21:43,5 分钟)@backend 完成所有改动,sumai/CLAUDE.md 同步更新到 D020 闭环。最终 4 sensor 全 PASS。

**关键测试数据**:

| 测试套 | D019 收尾基线 | D020 收尾(本轮) | 变化 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** ✅ | 持平 |
| sumai passed | 92 | **97 passed** ✅ | **+5** |
| sumai failed | 0 | **0** ✅ | 持平 |
| sumai total | 193 | **198** | +5 |

**实测 D020 grep 计数(全部远超 sensor 阈值)**:
- stream.py `MULTI_TURN_FOOTER` = 35 / `MULTI_TURN_TEMPERATURE` = 35
- stream_en.py `MULTI_TURN_FOOTER_EN` = 29 / `MULTI_TURN_TEMPERATURE_EN` = 29
- stream.py `final_system` = 85 / `final_temperature` = 68
- stream_en.py `final_system` = 70 / `final_temperature` = 56
- stream.py `qwen3.6-plus-2026-04-02` = 2 / stream_en.py = 1
- stream.py + stream_en.py `deepseek-v3-250324` = 0(完全清除)

---

### 2026-04-28 D019 真·多轮对话 messages history sensor(替代 D018a/b)

**Step 1 — 删除 D018a/b 测试** ✅
- `cd sumai && git rm tests/test_context_injection.py`(整个文件,5 active + 1 skip 全删)
- 原因: D018a/b system prompt 注入路线被 D019 真·多轮对话替代(Founder 真机反馈 LLM 仍复述不改写,真因是非真·多轮对话)
- `tests/README.md`:Stage 2 章节标题 D018a → D019,行替换为 test_multi_turn_history.py,D017 后下架清单追加 test_context_injection.py 历史档案

**Step 2 — 新建 `tests/test_multi_turn_history.py`(~370 行,4 test:3 active + 1 skip)** ✅

| # | 测试 | 类型 | 结果 |
|---|------|------|------|
| 1 | `test_d019_constants_and_function_exist` | active 静态扫描 | ✅ PASS |
| 2 | `test_d019_endpoints_extend_history_into_messages` | active 静态扫描 | ✅ PASS |
| 3 | `test_d019_role_whitelist_blocks_system_injection` | active 隔离 exec 功能 | ✅ PASS |
| 4 | `test_d019_endpoints_actually_call_llm_with_extended_history` | skip stub | ⏸️ SKIP |

**Test 1**:DEFAULT_REFINE_FALLBACK 常量(关键短语"明显改进")+ HISTORY_CHAR_BUDGET = 6000 + def resolve_history(data) 签名 + 函数体含 data.get('history') / json.loads / except / 'user'+'assistant' 白名单 / 5000 / HISTORY_CHAR_BUDGET 引用

**Test 2**:stream.py grep `resolve_history(data)` ≥17 + `conversation_history.extend(history)` ≥17;stream_en.py 同 ≥14

**Test 3**:隔离 exec 加载 resolve_history,namespace 预注入 DEFAULT_REFINE_FALLBACK + HISTORY_CHAR_BUDGET + json + re,验证 7 场景:
1. 缺 history 字段 → []
2. 空字符串 → []
3. 非法 JSON garbage → [](fallback 防 SSE 500)
4. role=system 注入 → [](白名单过滤)
5. 合法 user msg → 保留
6. 单 msg content 6000 字符 → 截断 ≤5050
7. 总长度 8000(4 turn × 2000) → 裁剪 ≤6500

**Test 4 skip**:端点级集成,完整 TODO 断言代码已写,uncomment 即激活

**Step 3 — 全量回归** ✅
- xuhua-wx 18 passed(持平)
- sumai **92 passed / 96 skipped / 3 xfailed / 2 xpassed**(passed 持平 D018a 基线 92,total 持平 193)

**Step 4 — HARNESS_HEALTH.md 更新** ✅
- D018a 行标 D019 (2026-04-28) 下架 + 新增 D019 行
- 合计行 sensor 计数说明更新
- 最近变更记录 D019 详细条目追加

**Step 5 — 微信合规** ✅(无境外 LLM,仅 stdlib)

**Step 6 — 与 @backend 协同** ✅
- 启动检查发现 @backend 已完成 D019 实施(stream.py 28 处含 resolve_history/DEFAULT_REFINE_FALLBACK/HISTORY_CHAR_BUDGET 引用)
- 直接进入测试阶段,无需等待
- Test 1+2 一次跑过;Test 3 首次 NameError(HISTORY_CHAR_BUDGET 未定义)→ 加 namespace 常量注入后跑过

---

### 2026-04-28 D017 三档下架 + D018a Stage 2 上下文注入(Phase 1+2 合并)

**Phase 1 — 三档相关测试清理(D017)** ✅
- 删除 `sumai/tests/test_complexity.py`(R3-D 创建的 3 active test,@backend 已删 stream.py 顶部 dict + 函数,sensor 凋零)
- 残留扫描清理 `sumai/tests/README.md` 旧表格条目(改为 D017 后下架记录 + Stage 2 章节)
- `test_sse_is_pro_branch.py:113 test_is_pro_determines_system_prompt_complexity` 保留(此处 complexity 指 max_tokens 精细度,非 D016 三档)

**Phase 2 — Stage 2 D018a 上下文注入测试 stub** ✅
- 新建 `sumai/tests/test_context_injection.py`(~250 行,4 test:3 active + 1 skip)
  - Test 1 模板常量 + 关键短语 + {previous_output} 占位符(zh + en 双覆盖)
  - Test 2 resolve_context 函数签名 + data.get('context_prompt') + 5000 截断
  - Test 3 隔离 exec 加载 resolve_context,验证 None/空/6000截断/边界5000(避免 import stream.py 顶部 anthropic + os.environ 崩)
  - Test 4 端点级集成测试 skip stub(完整 TODO 断言代码已写)

**Phase 3 — 全量回归** ✅
- xuhua-wx 18 passed(持平基线)
- sumai 92 passed / 96 skipped / 3 xfailed / 2 xpassed(passed 持平 R3-D 基线 92,skipped +1 因新 stub)

**Phase 4 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表 complexity 行标 D017 (2026-04-28) 下架
- 新增 D018a test_context_injection.py 行
- 最近变更记录详细条目追加

---

### 2026-04-25 Session 3 Wave 2 Round 3 D(R3-D 收尾,Wave 2 全部完成)

**任务 1 — 删除 test_sse_complexity_routing.py(D016 deep 命名废弃)** ✅
- `git rm sumai/tests/test_sse_complexity_routing.py`(6 个 test:2 passed + 4 skipped)
- 新 test_complexity.py(D016 quick/standard/professional)已替代

**任务 2 — 重写 test_complexity.py 并激活** ✅
- 完整重写 ~ 230 行(针对 @backend dict + resolve_complexity 静态扫描,而非 if-else 分支抽取)
- 取消 3 个 @pytest.mark.skip,3/3 PASS
- 用宽松正则 `_extract_dict_values()` 抽取 dict literal 三档 value 字符串

**任务 3 — 删除 test_validate_request_and_user.py** ✅
- `git rm sumai/tests/test_validate_request_and_user.py`(11 个 skip stub,旧函数 W2 R3-B 已删,no backward compatibility)

**任务 4 — TOCTOU xfail sensor 处理** ✅
- 维持 xfail(strict=False),reason 改为反映 R3-B 全 31 端点 SELECT FOR UPDATE 已就位 + mock 局限
- 文件头 docstring + 内部"Round 2 激活路线"注释段同步更新到 R3-D 状态

**任务 5 — hunyuan/wanxiang fallout 4 测试更新** ✅
- test_endpoints_exist::test_sse_video_endpoints_exist:替换 hunyuan→wanxiang
- test_sse_stream_structure::test_all_sse_endpoints_accept_both_methods:同上
- test_qwen_client::test_hunyuan_stream_uses_qwen → test_wanxiang_stream_uses_qwen(扫 def wanxiangStream)
- test_orphan_endpoints::test_wanxiang_stream_is_absent → test_wanxiang_stream_is_present(移除 xfail strict=True,正向断言)

**任务 6 — 全量回归** ✅
- xuhua-wx 18 passed(持平)
- sumai 92 passed / 95 skipped / 3 xfailed / 2 xpassed(passed +1, skipped -17 vs R1 基线)

**任务 7 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表格 +4 行(complexity 激活/wanxiang 三处 sensor)
- TOCTOU sensor 状态 + test_rate_limiting 警告
- 最近变更记录追加 R3-D

---

### 2026-04-24 Session 3 Wave 2 Round 1

**任务 A 基线测试**(2026-04-24 Wave 2 R1 end):
- xuhua-wx `pytest tests/` → **18/18 passed** ✅(持平)
- sumai `pytest tests/` → **91 passed / 112 skipped / 3 xfailed / 2 xpassed** ✅(比 Wave 1 的 89 passed **+2**,因 @backend W2-1 升级 RED-002 sensor)
- 基线时间戳: 2026-04-24

**任务 B Round 3 测试草稿**:
- 新建 `sumai/tests/test_complexity.py` ≈ 210 行
- 3 个 skip stub 完整断言:
  1. `test_complexity_quick_uses_shorter_prompt` — quick 段比 standard 段短
  2. `test_complexity_professional_includes_structure_hint` — professional 段含结构化关键词(中英文各一组)
  3. `test_complexity_default_fallback_to_standard` — 缺 complexity 时默认 standard,禁止默认为 quick/professional
- 覆盖 `/aiAgentStream` (中) + `/aiAgentStreamEN` (英)
- 运行 `pytest tests/test_complexity.py -v` → 3 skipped ✅
- sumai 全量测试 → 89 passed / 114 skipped / 3 xfailed / 2 xpassed ✅(core 数字无变化,仅 skip +3)

**任务 C TOCTOU 注释**:
- `test_rate_limiting.py::test_race_condition_sensor` docstring 追加 "Round 2 激活路线" 说明
- 未改 xfail 装饰器

**关键发现上报 PM**: complexity 三档命名冲突(quick/standard/professional vs quick/deep/professional)

---

### 2026-04-24 Session 3 Wave 1

**新建 5 个测试文件 / ~520 行**:

| 文件 | 行数 | 测试数 | 状态 |
|---|---|---|---|
| `sumai/tests/test_rate_limiting.py` | 220 | 6(5 normal + 1 xfail) | 激活 |
| `sumai/tests/test_history.py` | 85 | 4 skip stub | 等 mock |
| `sumai/tests/test_revoke_history.py` | 80 | 3 skip stub | 等 mock |
| `sumai/tests/test_describe_image_stream.py` | 105 | 4 skip stub | 等 mock |
| `sumai/tests/test_third_party_login.py` | 100 | 3 skip stub | 等 mock |

**2 个关键发现上报 PM**:
1. TOCTOU 竞争条件(P1,纳入 YELLOW-004)
2. `test_qwen_model_name_is_correct_in_config` 在 RED-001 迁移后 fail(PM 已代修)

---

### 2026-04-24 Session 2: sumai 测试骨架初始化

- Coordinator 代写 185 test case 骨架
- 覆盖 11 个 SSE 端点 + 订单 / 支付 / 会员状态 / 登录 / 历史

---

### 2026-04-24 Session 初始化

- 多 Agent 系统初始化
- `tests/` 三件套(architecture / quality_gates / compliance)+ HARNESS_HEALTH.md
- 18/18 PASS

---

## 上次更新记录

- **2026-04-28 21:43 D020 收尾**: 4 D020 active sensor 全 PASS,xuhua-wx 18 / sumai 97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed = 198 total
- **2026-04-28 21:38 D020**: 追加 4 D020 active sensor(2 PASS + 2 等 @backend),HARNESS_HEALTH 更新,xuhua-wx 18 / sumai 95+2/96/3/2
- **2026-04-28 D019**: 删 test_context_injection.py + 新建 test_multi_turn_history.py(3 active + 1 skip)+ HARNESS_HEALTH 更新
- 2026-04-28 D017+D018a: 删 test_complexity.py + 新建 test_context_injection.py(D019 已删)
- 2026-04-25 Wave 2 Round 3 D: R3-D 收尾 — 测试激活 + 旧测试删除 + W2-2 fallout + 全量回归
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + test_complexity.py + TOCTOU 注释
- 2026-04-24 Session 3 Wave 1: 5 测试文件 + TOCTOU 发现
- 2026-04-24 Session 2: sumai 185 test 骨架
- 2026-04-24: 多 Agent 系统初始化

---

## 2026-04-27 + 2026-04-28 同步 note

- **2026-04-27**:Stage 1 真机回归 + 三轮 UX hotfix(scroll-view enable-flex + display:flex 双开 bug,真因 GRAY-007 已纳入 KNOWN_ISSUES)。@frontend 主修,tester 角色未参与。详见 `daily-sync/2026-04-27.md`。
- **2026-04-28**:Founder 完成 5 人 Mom Test + Sean Ellis 40% 数据,验证"复杂任务 beachhead"假设;**D017 决策 Stage 1 三档复杂度下架**(Founder verdict "鸡肋");**D018 决策 Stage 2 启动**,先做 C 方案上下文注入。详见 `daily-sync/2026-04-28.md` + `decisions/DECISIONS.md`。
- 待 PM 出 spawn 拆解规划等 Founder "可以" 后,tester 角色可能被派发任务(详见 `handoffs/PENDING.md`)。
