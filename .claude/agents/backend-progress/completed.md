# Backend(后端) - 已完成任务记录

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (D020 多轮 footer + 调温 + Pro 切 Qwen)
> 角色: backend

---

## 已完成任务

### [2026-04-28] D020 · Stage 2 真·多轮对话二次修复(D019 v1 真机失败诊断后)✅

- **任务编号**: D020 backend(独占,@tester 同轮预先添加 4 个防御 sensor)
- **决策依据**: D020(2026-04-28 PM 地毯审查 + Founder 拍板"听你的做")— D019 v1 真机仍失败诊断
- **背景**:
  - 真因 1: Pro 路径用 `deepseek-v3-250324`(stream.py L279)不是 Qwen,文档过时未提
  - 真因 2: System Prompt B 是 2000+ 字符 schema 锁定,完全无 multi-turn handling
  - 真因 3: D019 契约 100% 通,但 LLM 选"保留 schema + 局部洗名字"
- **PM 审查 SOP**: 必须地毯审查(memory feedback_carpet_code_review.md)

#### 修改文件清单

| 文件 | 改动摘要 | 净行数 |
|---|---|---|
| `sumai/stream.py` | 顶部新增 `MULTI_TURN_FOOTER` + `MULTI_TURN_TEMPERATURE = 0.85` 常量(D019 基础设施之后) · 17 端点(16 标准 + 1 describeImageStream 4-空格)拼装时按 history 切 final_system/final_temperature · botPromptStreamBak Pro 路径切 qwen3.6-plus(原 deepseek-v3-250324)+ DashScope client · 51 处 [D020] print 日志 | +约 380 |
| `sumai/stream_en.py` | EN 版镜像:`MULTI_TURN_FOOTER_EN` + `MULTI_TURN_TEMPERATURE_EN = 0.85` · 14 端点同步切换 · 42 处 [D020] EN 日志 | +约 300 |
| `sumai/CLAUDE.md` | LLM 模型表全面更正:全部 16 端点底层 LLM 改为 Qwen 3.6 Plus / Flash · `botPromptStreamBak` 标注 D020 切换说明 · `/wanxiangStream` 加入(D010 方案 Y 已上线) · `/hunyuanStream` 标注下架 · LLM 集成现状段重写(qwen-plus-latest / claude-haiku-4-5 历史字样修正) · RED-001/002 + YELLOW-001 标记 ✅ 已解决 · 新增"已弃用模式"段落(get_claude_client_and_config + deepseek-v3 死代码) | 净 +约 50 |

#### Step 总览

1. **Fix 1 顶部常量** → `MULTI_TURN_FOOTER`(zh)+ `MULTI_TURN_FOOTER_EN`(en)+ 各自 `MULTI_TURN_TEMPERATURE` = 0.85
2. **Fix 2 31 端点切换** → 每端点 if history 拼 footer + 温度 0.85,else 保持 system + 温度 0.6;chat completion 调用切 `temperature=final_temperature`
3. **Fix 3 botPromptStreamBak Pro 切 qwen3.6-plus** → 仅改 if is_pro == 1 分支内的 client + model_name(免费豆包路径完全不动)
4. **Fix 4 sumai/CLAUDE.md 文档同步** → 6 大段落更新(状态 / 端点表 / LLM 集成 / RED-001 / RED-002 / YELLOW-001)
5. **Fix 5 [D020] 详细 print 日志** → 每端点 ≥ 2 处(模式启用 + 最终调用)

#### 批量改造方法

写 `/tmp/d020_apply.py` Python 脚本一次性精确替换:
- 模式 A:30 处 8-空格 D019 注入块(stream.py 16 + stream_en.py 14)
- 模式 B:1 处 4-空格 describeImageStream(stream.py)
- 模式 C:1 处 botPromptStreamBak Pro 模型切换(stream.py)
- 替换前后均做计数 + 必备符号 + 禁忌字样验证(任一失败 abort 不写文件)
- 用普通字符串(非 raw)写 replacement,避开 raw string `\\"` 转义陷阱(v1 踩过坑,v2 修复)

避免 31 次手动 Edit 累积出错风险。

#### grep 计数验证(全部匹配预期)

| 文件 | 符号 | 实际 | 期望 |
|---|---|---|---|
| stream.py | `MULTI_TURN_FOOTER` | 35 | ≥ 18 ✅ |
| stream.py | `MULTI_TURN_TEMPERATURE` | 35 | ≥ 18 ✅ |
| stream.py | `final_temperature` | 68 | 17 × 4 = 68 ✅ 精确 |
| stream.py | `[D020]` 日志 | 51 | ≥ 34 ✅ |
| stream.py | `qwen3.6-plus-2026-04-02` | 2 | 2 ✅ |
| stream.py | `qwen3.6-flash-2026-04-16` | 1 | 1 ✅ |
| stream.py | `temperature=temperature,` | 0 | = 0 ✅ |
| stream.py | `deepseek-v3-250324` | 0 | = 0 ✅ |
| stream_en.py | `MULTI_TURN_FOOTER_EN` | 29 | ≥ 15 ✅ |
| stream_en.py | `MULTI_TURN_TEMPERATURE_EN` | 29 | ≥ 15 ✅ |
| stream_en.py | `final_temperature` | 56 | 14 × 4 = 56 ✅ 精确 |
| stream_en.py | `[D020]` 日志 | 42 | ≥ 28 ✅ |
| stream_en.py | `temperature=temperature,` | 0 | = 0 ✅ |
| stream_en.py | `deepseek-v3-250324` | 0 | = 0 ✅ |

**禁忌检查**:
- `.format(` 残留 = 0 ✅(D018a P0 永久红线)
- D018a/b `CONTEXT_INJECTION_TEMPLATE` / `REFINE_INSTRUCTION_TEMPLATE` 残留 = 0 ✅
- raw string 错误转义 `\"` 残留 = 0 ✅

#### 基线测试

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK** ✅
- `pytest sumai/tests/` → **97 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed**(基线 92 passed +5,@tester 同轮添加的 D020 sensor 全 PASS)
- `pytest tests/` → **18 passed** ✅(持平)

#### 关键设计决策

1. **footer 是叠加,不是替换** — D019 基础设施完整保留,footer 仅在 history 非空时拼到 system 末尾
2. **`final_system` / `final_temperature` 局部变量** — 不动 system / temperature 原变量(避免影响其他逻辑)
3. **botPromptStreamBak 保守改造** — 只动 if is_pro == 1 分支内 4 行(切 client + model + 温度 + max),不动外层 doubao client + 不动后面 system prompt 字符串
4. **describeImageStream 4-空格特殊处理** — D020 切换在 generate() 外(端点函数顶层),`final_system` / `final_temperature` 被 generate() 闭包捕获,内 chat call 切到 final_temperature(模型用 `qwen3-vl-plus`)
5. **`request.path` 自动取端点名** — 避免硬编码 31 处
6. **batch script 严格验证** — 替换前后做计数 + 必备符号 + 禁忌字样检查,任一失败 abort

#### 给其他角色的契约

- **@frontend**: D020 完全是后端内部行为,前端契约 0 改动(`history` 字段格式不变)。后端日志 `[D020]` 前缀 + `[D019]` 前缀(已部署),Founder 真机调试时 grep 两个 tag 即可看到完整对话流
- **@tester**: 4 个 D020 sensor 已 PASS(test_multi_turn_history.py),原 D019 sensor 共 8 active 全 PASS + 1 skip stub(等 Flask test client + LLM mock)
- **@devops**: 无新环境变量(QWEN_API_KEY 已存在),无新依赖,部署 = 单独 sumai 后端 push + supervisorctl restart

#### 已完成的子任务

- [x] Fix 1 stream.py + stream_en.py 顶部 D020 常量
- [x] Fix 2 31 端点拼装时按 history 切换(16 zh 标准 + 1 zh describeImage + 14 en = 31)
- [x] Fix 3 botPromptStreamBak Pro deepseek-v3 → qwen3.6-plus(D011 闭环)
- [x] Fix 4 sumai/CLAUDE.md 6 段更正
- [x] Fix 5 [D020] 详细 print 日志(每端点 ≥ 2 处)
- [x] py_compile + pytest 全过
- [x] grep 计数 + 禁忌检查全过

#### 验收标准达成

| # | 验收 | 状态 |
|---|---|---|
| 1 | MULTI_TURN_FOOTER + MULTI_TURN_TEMPERATURE 常量(zh + en 各一份) | ✅ |
| 2 | 31 端点 history 非空时拼 footer + 切 0.85 温度,初次完全不变 | ✅ |
| 3 | deepseek-v3-250324 全清零,Pro 切 qwen3.6-plus-2026-04-02 | ✅ |
| 4 | 免费保持 qwen3.6-flash-2026-04-16 不变 | ✅ |
| 5 | sumai/CLAUDE.md LLM 模型表全面修正 | ✅ |
| 6 | [D020] 详细 print 日志(每端点 ≥ 2 处) | ✅ |
| 7 | py_compile + pytest 不倒退 | ✅ |

---

### [2026-04-28] D019 · Stage 2 真·多轮对话改造 ✅

- **任务编号**: D019 backend(并行 spawn 3 teammate 之一,与 @frontend / @tester 并行)
- **决策依据**: D019(2026-04-28 PM)— Founder 真机 D018b 反馈"感觉没什么区别"
- **背景**: D018a/b 伪上下文注入(system 末尾追加 directive)被 Qwen 视作软建议忽略;
  改造为 LLM 原生 chat completion 多轮对话(history extend)是真正解决方案
- **PM 审查 SOP**: 必须地毯审查(memory feedback_carpet_code_review.md)

#### 修改文件清单

| 文件 | 改动摘要 | 行数变化 |
|---|---|---|
| `sumai/stream.py` | 顶部:D018a/b 整套删除(`CONTEXT_INJECTION_TEMPLATE` / `REFINE_INSTRUCTION_TEMPLATE` / `resolve_context` / `resolve_refine_instruction`)+ 新增 D019 基础设施(`DEFAULT_REFINE_FALLBACK` 常量 + `HISTORY_CHAR_BUDGET=6000` + `resolve_history()` 函数 + `_log_d019_assembly()` helper)· 17 端点 7 行 D018b 注入块整体替换为 D019 6 行 history extend 模式 · save_prompt_record 加 [D019] 响应完成日志 | 净 +約 60 |
| `sumai/stream_en.py` | EN 版同步:`CONTEXT_INJECTION_TEMPLATE_EN` / `REFINE_INSTRUCTION_TEMPLATE_EN` 删除 + EN 版 D019 基础设施 + 14 端点替换 + EN save_prompt_record [D019] 日志 | 净 +約 50 |

详细产出 + 验证 + 给其他角色的契约 → `current.md`(等 PM 审查后 PM 把本次摘要从 current 移到 completed)

#### Step 总览

1. **Step 1 删 D018a/b 整套** → 顶部常量 + 函数 + 31 端点 7 行注入块 完全清除(grep 残留 = 0)
2. **Step 2 新增 D019 基础设施** → DEFAULT_REFINE_FALLBACK + HISTORY_CHAR_BUDGET + resolve_history + _log_d019_assembly
3. **Step 3 31 端点 history extend** → 17 (zh) + 14 (en) = 31 处统一注入
4. **Step 3.5 /describeImageStream 4 空格特殊处理** → 单独适配
5. **Step 4 详细 [D019] 日志全覆盖** → 27 (zh) + 23 (en) = 50 处 [D019] 日志
6. **Step 5 grep 验证** → 全部匹配预期
7. **Step 6 P0 安全严守** → role 白名单 + JSON 容错 + 三层截断防御

#### 测试基线

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK** ✅
- `pytest sumai/tests/` → **92 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed** ✅
  - test_multi_turn_history.py 4 sensor: 3 PASS + 1 SKIP(等 Flask client + LLM mock)
- `pytest tests/`(xuhua-wx 根)→ **18 passed** ✅

#### Smoke 验证 resolve_history(8 用例直接 exec 函数体)

- ✅ 空 / 非法 JSON / 空字符串 → []
- ✅ role=system 被白名单拦截
- ✅ 单 message 6000 字 → 截断到 5008(5000 + "...(已截断)" 8 字)
- ✅ 总长 12000(8×1500)→ 裁剪到 4 turn(总长 ≤ 6000)
- ✅ list 形式直接接收(不强制 JSON 字符串)

详细产出见 `current.md`,审查通过后 PM 把内容从 current 转移到此处。

---

### [2026-04-28] D018b · Stage 2 上下文注入 真机反馈修复 ✅

- **任务编号**: D018b backend(并行 spawn 2 teammate 之一,与 @frontend 并行)
- **决策依据**: D018b(2026-04-28 PM)— Founder 真机反馈 4 项 + 选方案 b
- **背景**: D018a 实施后真机反馈"继续优化变化不大,Qwen 没听 directive";同时缺用户输入框
- **PM 审查 SOP**: 必须地毯审查(memory 已记)。本轮严禁退回 .format()(D018a P0 fix 不能回滚)

#### 修改文件清单

| 文件 | 改动摘要 | 行数变化 |
|---|---|---|
| `sumai/stream.py` | 顶部:CONTEXT_INJECTION_TEMPLATE 措辞强化(加 {refine_instruction_block} 占位符)+ 新增 REFINE_INSTRUCTION_TEMPLATE + resolve_refine_instruction 函数 · 17 端点 ctx 注入从 1 行升级到 4 行(组装 refine_block + 双 .replace) | +約 80 净增 |
| `sumai/stream_en.py` | 同上(EN 版,REFINE_INSTRUCTION_TEMPLATE_EN + 14 端点) | +約 65 净增 |
| `sumai/tests/test_context_injection.py` | 新增 2 个 active sensor(test_refine_instruction_template_exists / test_resolve_refine_instruction_function_exists)+ 扩展原 P0 .format() 防御覆盖 REFINE | +約 130 净增 |

#### Fix 1 验证(强化措辞关键词)

zh:
```
$ grep -E "明显改写|不要复述|明显升级" stream.py
(全部命中,且只在 CONTEXT_INJECTION_TEMPLATE 内)
```

en:
```
$ grep -E "substantially rewrite|Do NOT|clearly upgraded" stream_en.py
(全部命中,且只在 CONTEXT_INJECTION_TEMPLATE_EN 内)
```

#### Fix 2 验证(新增常量 + 函数)

```
stream.py:    REFINE_INSTRUCTION_TEMPLATE      = 18 (1 def + 17 端点)  ✅
stream.py:    resolve_refine_instruction       = 18 (1 def + 17 端点)  ✅
stream_en.py: REFINE_INSTRUCTION_TEMPLATE_EN   = 15 (1 def + 14 端点)  ✅
stream_en.py: resolve_refine_instruction       = 15 (1 def + 14 端点)  ✅
```

#### Fix 3 验证(31 端点新注入模式 + .format 0 残余)

```
$ grep -c "ctx = resolve_context" stream.py     → 17 ✅
$ grep -c "ctx = resolve_context" stream_en.py  → 14 ✅
$ grep -E "TEMPLATE\.format|TEMPLATE_EN\.format|REFINE_INSTRUCTION_TEMPLATE\.format|REFINE_INSTRUCTION_TEMPLATE_EN\.format" stream.py stream_en.py
(0 行,P0 防御就位)
$ grep -E "final_system = system \+ CONTEXT_INJECTION_TEMPLATE" stream.py stream_en.py
(0 行,旧 1-行 pattern 全部清除)
```

#### Fix 4 验证(test_context_injection.py 新 sensor)

```
$ pytest tests/test_context_injection.py -v
test_context_injection_template_exists                  PASSED  (扩展 P0 .format 防御覆盖 REFINE)
test_resolve_context_function_exists                    PASSED  (无变更)
test_resolve_context_truncates_oversized_input          PASSED  (无变更)
test_endpoints_inject_context_when_present              SKIPPED (无变更,等 Flask test client)
test_refine_instruction_template_exists                 PASSED  🆕 D018b
test_resolve_refine_instruction_function_exists         PASSED  🆕 D018b
======================== 5 passed, 1 skipped in 0.03s ==========================
```

#### 编译 + 全量测试基线

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK**
- `pytest sumai/tests/` → **94 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed**(基线 92 + 2 D018b 新 sensor,无回归)
- `pytest tests/` (xuhua-wx 根) → **18 passed**(持平 ✅)

#### 关键设计点

1. **D018b 措辞强化**: 从"建议性"(D018a)升级为"约束性"(明显改写 / 不要复述 / 明显升级 / clearly upgraded)
   — Founder 真机反馈 Qwen 不听 D018a directive,需要更强约束。
2. **refine_instruction 字段可选**: 用户跳过填写 → resolve_refine_instruction 返 None → refine_block 为空字符串
   → directive 内 `{refine_instruction_block}` 被替换为空 → 等同纯 D018b 措辞强化版,
   不强制用户必须填写。
3. **1000 字符截断**: refine_instruction 比 context_prompt 短得多(用户随手写的几句指令),
   保守上限 1000 字符,防御恶意超长输入吃光 max_tokens。
4. **.replace() 严格执行(D018a P0 防御)**: 全 4 处 .replace 调用,严禁 .format()。
   用户上一轮 prompt + 用户继续优化要求都可能含 `{` `}` (如 JSON / Python f-string / 模板变量),
   .format() 会 KeyError 崩溃。本轮代码 + sensor 双重防御。
5. **6 个新增/修改占位符**:
   - CONTEXT_INJECTION_TEMPLATE 多了 `{refine_instruction_block}`(替代 D018a 的简结尾)
   - REFINE_INSTRUCTION_TEMPLATE 含 `{instruction}`
   - 注入逻辑两步 .replace:① `{previous_output}` ② `{refine_instruction_block}`(可空)
6. **不动 system prompt 字符串本身**:仍然只在末尾追加 directive 块,Stage 1 删除不影响 prompt 质量。
7. **不动 validate_and_deduct + save_prompt_record + 路由 routing**。
8. **不动其他 sumai/tests/ 文件** — 只在 test_context_injection.py 内新增 2 个 test 函数。
9. **不引入新 Python 包** — 只用 stdlib + 已有 anthropic/openai。

#### 唯一特殊端点

`/describeImageStream`(stream.py)的 ctx 注入仍是 **4 空格缩进**(在 generate() 函数外的 endpoint handler 内,
不在 generate 闭包里),其余 30 端点都是 8 空格缩进。本轮单独处理这 1 处。

#### 给 @frontend 的契约总结

新增字段 `refine_instruction`(string,可选):
- 用户在方案 b 输入框写"重点调慢节奏"等;为空时不影响 directive 注入(向后兼容 D018a 前端)
- 1000 字符上限(后端会截断)
- 起步 counter 剩 2(D018b: MAX 3 - 1 初次 = 2 继续优化次)— 后端不感知 counter

---

### [2026-04-28] Stage 2 Phase 1(三档下架 D017)+ Phase 2(C 方案 上下文注入 D018a)合并 ✅

- **任务编号**: Stage 2 backend(并行 spawn 3 teammate 之一)
- **决策依据**: D017(三档鸡肋下架)+ D018(Stage 2 启动 C 方案)+ D018a(细节锁:按钮 / 上限 3 轮 / system prompt PM 草稿)

#### 修改文件清单

| 文件 | 改动摘要 | 行数变化 |
|---|---|---|
| `sumai/stream.py` | Phase 1: 删 `COMPLEXITY_DIRECTIVES` dict + `resolve_complexity()` + 17 处端点引用 · Phase 2: 加 `CONTEXT_INJECTION_TEMPLATE` + `resolve_context()` + 17 处端点 ctx 注入(每处从 1 行变 3 行) | +約 30 净增 |
| `sumai/stream_en.py` | 同上(EN 版,`CONTEXT_INJECTION_TEMPLATE_EN` + 14 端点) | +約 25 净增 |

#### Phase 1 验证(grep 残余必须为 0)

```
$ grep -rn "COMPLEXITY_DIRECTIVES\|resolve_complexity\|test_complexity" --include="*.py"
(空,0 行)
```

#### Phase 2 验证(CONTEXT_INJECTION 引用计数)

```
stream.py:    CONTEXT_INJECTION_TEMPLATE   = 18 (1 定义 + 17 端点)  ✅
stream.py:    resolve_context              = 18 (1 定义 + 17 端点)  ✅
stream_en.py: CONTEXT_INJECTION_TEMPLATE_EN = 15 (1 定义 + 14 端点) ✅
stream_en.py: resolve_context              = 15 (1 定义 + 14 端点)  ✅
```

#### 编译 + 测试基线

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK**
- `pytest sumai/tests/` → **89 passed / 95 skipped / 3 xfailed / 2 xpassed / 0 failed**(基线 92 - test_complexity 删除 3 stub = 89,无回归)

#### 关键设计点

1. **后端不感知轮次**: 只检查 `context_prompt` 字段是否存在,不维护 round counter,前端 D018a 的 3 轮上限完全靠前端 counter 强制
2. **Fallback 友好**: 不传 / 传空 / 传 None / 全空白 → `resolve_context()` 返 None → 端点行为完全等同改动前
3. **5000 字符截断**: 防止上一轮巨大 output 吃光 max_tokens
4. **不动 system prompt 字符串本身**: 只在末尾追加上下文 block,Stage 1 删除不影响 prompt 质量
5. **stream_en.py 的英文上下文模板独立**: `[Context] The prompt the user obtained from the previous round is: ...`,保持英文 LLM 输出语言一致性
6. **不引入新依赖**: 只用 stdlib

#### 唯一特殊端点

`/describeImageStream`(stream.py L1736)的 ctx 注入是 4 空格缩进(在 generate() 函数外的 endpoint handler 内,不在 generate 闭包里),其余 30 端点都是 8 空格缩进。这与 Stage 1 改动模式完全一致,只是替换语句不同。

---

### [2026-04-25 10:30] W2-4 (R3-A) Stage 1 complexity 三档 + R3-B 全端点切换 + 旧函数删除 ✅

- **任务编号**: R3-A + R3-B (Wave 2 Round 3,合并改 stream.py/stream_en.py — Wave 2 后端最后一轮)
- **KNOWN_ISSUE**: D016 命名 + YELLOW-004 TOCTOU 全端点收尾

#### 修改文件清单

| 文件 | 改动摘要 | 增减行 |
|---|---|---|
| `sumai/stream.py` | 顶部加 COMPLEXITY_DIRECTIVES dict + resolve_complexity() · 17 端点切到 validate_and_deduct + save_prompt_record · 17 处 conversation_history 注入 directive · 删除老 validate_request_and_user (53 行) + 老 save_content_prompt_stream (108 行) | -130 净减 |
| `sumai/stream_en.py` | 同上(EN 版,COMPLEXITY_DIRECTIVES_EN + 14 端点)+ 新增本模块独立 validate_and_deduct + save_prompt_record(从 stream.py 复制)+ 删除老两个函数 | +30 净增 |

#### 关键变更

**A. R3-A · Stage 1 complexity 三档(D016)**

- `COMPLEXITY_DIRECTIVES` dict 在模块级定义(stream.py 顶部 + stream_en.py 顶部 EN 版),三键 `quick / standard / professional`
- standard directive 为空字符串 → 等同当前默认行为(fallback 友好,前端不传或传无效值都走此分支)
- quick directive: "请精简输出,只给 3-5 段核心 prompt,跳过详细思考步骤说明"
- professional directive: "请输出更结构化、更长的 prompt(6-10 段),包含小标题分节、关键参考资料引用、变量槽位标记。末尾追加 💎 项目模板尾注"
- `resolve_complexity(data)` 函数: 解析 complexity 参数,无效值 fallback 到 'standard'
- 每个端点的 `conversation_history.append({"role": "system", "content": system})` 替换为 `system + COMPLEXITY_DIRECTIVES.get(resolve_complexity(data), "")` 形式
- 全部 31 端点(stream.py 17 + stream_en.py 14)都已注入 directive
- **不复制 system prompt 字符串** — 原 90 个 system prompt 一字未改,只是末尾追加 directive

**B. R3-B · 旧 API 完全切换 + 删除**

- `validate_request_and_user` 调用全部切换:
  - stream.py: 14 处 → validate_and_deduct
  - stream_en.py: 14 处 → validate_and_deduct
- `save_content_prompt_stream` 调用全部切换:
  - stream.py: 14 处(其中 describeImageStream 是多行调用)→ save_prompt_record
  - stream_en.py: 14 处 → save_prompt_record
- stream_en.py 新增本模块独立的 `validate_and_deduct` + `save_prompt_record` 函数(从 stream.py 复制实现,只 diff 是用 stream_en.py 自己的 connect_to_db())
- **删除**老 `validate_request_and_user` (stream.py L1976-2028 + stream_en.py L8306-8356) — 共 ~106 行
- **删除**老 `save_content_prompt_stream` (stream.py L2031-2138 + stream_en.py L8359-8466) — 共 ~216 行
- 留一行注释说明 "no backward compatibility — 旧函数不保留,任何残留调用都会 NameError 暴露"

**C. 全端点 TOCTOU 保护就位**

- W2-5 时只切了 3 端点(/aiAgentStream / /botPromptStream / /wanxiangStream),其余 11 端点 + stream_en.py 全部 14 端点仍用旧 race-window 函数
- **R3-B 后**: stream.py 17 端点 + stream_en.py 14 端点 = 31 端点全部使用 SELECT FOR UPDATE 行锁 + 同事务 UPDATE
- YELLOW-004 TOCTOU 已彻底解决,可标 ✅

**D. Google 用户 + is_pro 回落逻辑保留**

- stream_en.py 的 validate_and_deduct 完整保留 origin='google' 分支(走 pro_num + normal_num)
- is_pro 回落(pro 用完返普通 + 奖 3 次)逻辑保留
- 错误消息字符串完全沿用旧版(中文,与原 stream_en.py 风格一致 — stream_en.py 业务错误消息一直是中文,因为前端展示走中文 toast)

#### 测试结果

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **ALL OK**
- `pytest sumai/tests/` → **91 passed / 112 skipped / 3 xfailed / 2 xpassed / 0 failed**(与 Wave 2 R1+R2 基线一致 ✅)
- `pytest tests/` (xuhua-wx 根) → **18 passed**(基线持平 ✅)
- test_complexity.py 3 stub 仍 SKIPPED(等 @tester R3-D 激活)

#### 数据正确性审计(31 端点对账)

| 文件 | @bp.route 端点数 | conversation_history.append directive 注入 | validate_and_deduct 调用 | save_prompt_record 调用 |
|---|---|---|---|---|
| stream.py | 17 | 17 | 17 | 17 (+1 def) |
| stream_en.py | 14 | 14 | 14 | 14 (+1 def) |
| **合计** | **31** | **31** | **31** | **31** |

每行数字相等 = 每个端点都齐备 4 项变更 ✅

#### 风险 / 注意事项

1. **stream_en.py 业务错误消息保持中文不变**: stream_en.py 的 validate 错误消息原本就是中文(`"次数已用完，请购买pro会员"` 等),前端展示也是中文 toast。我的 validate_and_deduct EN 版保持一致,不改国际化策略(那是单独工程)
2. **resolve_complexity 防御**: 任何无效 complexity 值都 fallback 到 'standard',对前端 bug / 攻击 friendly
3. **directive 中文版用了 emoji 💎**: professional 档尾注含 emoji,与 sumai 现有 system prompt 风格一致(很多 system prompt 已含 emoji)。如 PM 觉得 emoji 应避免,5 分钟可改
4. **describeImageStream 特殊**: 该端点 `conversation_history.append` 在外层(不在 generate 闭包内),directive 注入位置自然落在外层,但语义不变(只是更早 read 一次 data)
5. **test_validate_request_and_user.py(11 SKIPPED)激活后会 fail**: 因函数已删。@tester R3-D 需重命名 + 改 import + 更新 mock,见 current.md 详细交接

#### 未做(移交下游)

- **@frontend R3-C**: 已并行 spawn,前端透传 complexity 到 generateContent() body
- **@tester R3-D**: 等 @frontend + @backend 完成后激活全量回归 + test_complexity 3 stub 激活 + 旧 test 改名

---

### [2026-04-24 23:45] W2-2 方案 Y + W2-5 TOCTOU 事务修复 ✅

- **任务编号**: W2-2 + W2-5 (Wave 2 Round 2,合并一次改 stream.py/stream_en.py)
- **KNOWN_ISSUE**: YELLOW-001 方案 Y + YELLOW-004 TOCTOU

#### 修改文件清单

| 文件 | 改动摘要 | 增减行 |
|---|---|---|
| `sumai/stream.py` | /hunyuanStream → /wanxiangStream(新建 + 原注释) · validate_and_deduct + save_prompt_record 新函数 · 3 端点切新函数 | +199 净增 |
| `sumai/stream_en.py` | /hunyuanStreamEN → /wanxiangStreamEN(纯路由名替换) · 注释新增 | +2 净增 |

#### 关键变更

**A. 方案 Y(D010 · YELLOW-001)**

- 复制 `/hunyuanStream` 的完整实现(system prompt / style 分支 / is_pro 分支全部保留,一字未改)作为新的 `/wanxiangStream`
- 删除原 `/hunyuanStream` 函数 + `@route`,留一行注释"/hunyuanStream 在 2026-04-24 Wave 2 Round 2 下架(方案 Y,D010),功能并入 /wanxiangStream"
- stream_en.py 同理处理 `/hunyuanStreamEN` → `/wanxiangStreamEN`
- **事实确认**: 原 `/hunyuanStream` 的 system prompt 写的是"通义万相 2.2"(张艺谋+侯孝贤+库布里克+MoE+VBench 那套),命名一直错位 — 方案 Y 让命名回归正确
- 原 save 调用保存的 model_name 也就是"万相"(不是"混元"),方案 Y 后保持不变

**B. TOCTOU 事务修复(W2-5 · YELLOW-004)**

- 新增 `validate_and_deduct(data, cost=1)` — stream.py L1764
  - 同 conn + `conn.start_transaction()`
  - `SELECT id, limit_num - used_num AS num, is_pro, origin, pro_num, normal_num FROM p_user_base WHERE openid=... FOR UPDATE`
  - Google 用户(origin='google')走 pro_num+normal_num 逻辑
  - 额度检查 < cost → rollback + 错误返回
  - UPDATE(根据 origin 走 google/非 google 分支)
  - is_pro 回落逻辑(pro 次数用完返普通 + 奖 3 次)保留
  - `conn.commit()`
  - 返回 `(is_valid, error_message, user_info)`,user_info 与旧 validate_request_and_user 兼容
  - 异常 → rollback + "服务繁忙" 错误返回
- 新增 `save_prompt_record(content, response, openid, model_type, model_name, style)` — stream.py L1905
  - 仅 INSERT prompt_base(不扣次数)
  - 配套 validate_and_deduct 使用(避免重复扣)
- 已切换到新 API 的 3 个端点:
  - `/botPromptStream` L42 / L131-132
  - `/aiAgentStream` L369 / L453-454
  - `/wanxiangStream` L1014 / L1096-1097
- 旧 `validate_request_and_user` / `save_content_prompt_stream` 保留原签名 + 实现,服务 11 个尚未切换端点(Round 3 @backend 统一切完)
- stream_en.py TOCTOU 暂缓(Round 3 统一处理)

**C. 为什么 streaming 过程不持锁**

- validate_and_deduct 在 streaming 开始**之前** commit(不在 yield 循环中持事务),避免长事务锁表
- 如果 streaming 中途失败,用户被扣了次数但没拿到 prompt — 由前端/用户调用 `/revoke_history` 补偿(sumai 已有此端点)
- 这是**扣了就扣,失败由补偿**的策略,权衡"并发安全"和"长事务锁风险"的工程取舍

#### 测试结果

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **ALL OK**
- `pytest sumai/tests/` → **91 passed / 112 skipped / 3 xfailed / 2 xpassed / 0 failed**(与 Wave 2 R1 基线一致)
- 方案 Y 删除 `/hunyuanStream` 本应在完整 venv 里让 4 个测试 FAIL/XPASS(见 context-for-others.md 详细清单),但当前 pytest 环境缺 flask/redis/wechatpayv3 相关 fixture 被 skip,基线未破。Round 3 @tester 全量回归时需更新这 4 个测试。

#### 未做(移交下游)

- @frontend W2-3: 核查 pages/index/index.js 的 hunyuan 路由残留(Founder 说前端已隐藏,但需实际代码核查)
- @backend W2-4(Round 3): Stage 1 complexity 三档 system prompt(15 个 SSE 端点)
- @backend Round 3: 把剩余 11 个端点 + stream_en.py 全部切换到 validate_and_deduct/save_prompt_record,并删除旧 validate_request_and_user/save_content_prompt_stream
- @tester Round 3: 更新 4 个 hunyuan→wanxiang 相关测试,TOCTOU sensor 决定保留 mock 版 xfail 还是写集成测试版

---

### [2026-04-24 22:30] W2-1 · RED-002 凭证外移 + app.secret_key 强密钥 ✅

- **任务编号**: W2-1 (Wave 2 Round 1)
- **KNOWN_ISSUE**: RED-002 + 子项 app.secret_key 弱密钥

#### 修改文件清单

| 文件 | 改动摘要 | 代码行变化 |
|------|---------|----------|
| `sumai/.env.example` | 🆕 新建,声明 27 个环境变量 + 注释 | +99 |
| `sumai/.env` | 🆕 新建(不入 git),本地开发真实值 | +51 |
| `sumai/mainv2.py` | 顶部加 load_dotenv,22 处凭证改 os.environ / os.getenv,删除 json_test 死代码 secret | ~50 行重构 |
| `sumai/note.py` | 加 load_dotenv,Redis 凭证改 env | ~5 行 |
| `sumai/pay_stripe.py` | 加 load_dotenv,Stripe + MySQL 凭证改 env | ~10 行 |
| `sumai/stream.py` | 加 load_dotenv,db_config + Qwen + Volcengine + Anthropic 改 env | ~15 行 |
| `sumai/stream_en.py` | 加 load_dotenv,db_config + Qwen + Anthropic 改 env | ~10 行 |
| `sumai/tests/test_code2session.py` | 更新 `test_code2session_uses_correct_mini_appid`,改为断言 env 读取而非硬编码文本 | ~15 行 |

#### 关键变更

**A. 27 个环境变量声明** (详见 `context-for-others.md` 完整清单):
- Flask: `FLASK_SECRET_KEY` (64 字符 hex 强随机)
- MySQL × 5: HOST / PORT / USER / PASSWORD / DATABASE
- Redis × 3: HOST / PORT / PASSWORD
- LLM × 3: QWEN_API_KEY / ANTHROPIC_API_KEY / VOLCENGINE_API_KEY
- 微信: OPEN / XUHUA / GH / MINI 各 2-3 个
- 微信支付: MCHID / PRIVATE_KEY_PATH / CERT_SERIAL_NO / APIV3_KEY
- OSS × 4: AccessKey ID/Secret, Endpoint, Bucket
- Stripe × 3: SECRET_KEY / PUBLIC_KEY / DOMAIN

**B. 严格 vs 宽松读取策略**:
- 敏感 key / secret: `os.environ['FOO']`(强读,未设置即启动失败 → 防止弱默认上生产)
- 地址类常量(host/port/endpoint): `os.getenv('FOO', default)` 带合理默认值

**C. app.secret_key 强密钥**:
- 旧: `'123456qwerty'`(弱密钥,PC Web session 可被暴力破解伪造)
- 新: `os.environ['FLASK_SECRET_KEY']` = 64 字符 hex random (生成命令: `python3 -c "import secrets; print(secrets.token_hex(32))"`)
- ⚠️ 生产切换后 web session cookie 失效(PC 扫码登录用户需重新登录),小程序无影响

**D. json_test 死代码清理**:
- `mainv2.py:1659` `/json_test` 原实现为完全死代码(`return ""` 位于函数开头),包含第三方 merchant secret 硬编码
- 已删除死代码块,只保留 `return ""`

**E. 废弃文件保留硬编码说明** (GRAY-004 范围,本次不处理):
- `sumai/claude_*.py` / `bigmodel/` / `deepseek/` / `moonshot.py` 里仍有 Anthropic / Qwen key 硬编码
- 这些文件**未被主路由 import**,属 GRAY-004 清理任务
- `test_no_sk_ant_api_key` / `test_no_sk_qwen_api_key` 仍 xfail(命中废弃文件),预期行为

#### 测试结果

- `python3 -m py_compile mainv2.py note.py pay_stripe.py stream.py stream_en.py` → ALL OK
- `pytest tests/`:
  - **91 passed** (基线 89,+2 因 `.env.example` 出现 → `test_env_example_exists_or_warn` pass + 更新的 test_code2session 验证 env 变量存在)
  - 112 skipped (flask 本地未装,需 app fixture 的测试 skip)
  - 3 xfailed (故意 xfail:claude_*.py 里废弃文件硬编码,属 GRAY-004)
  - 2 xpassed (原本就 xpass)
  - **0 failed**
- `.env` git check-ignore 确认生效:`.gitignore:27:.env`

#### 剩余工作(移交下游)

- @devops · 生产部署: 在 `/etc/supervisor/conf.d/sumai.conf` 或 systemd EnvironmentFile 设置 27 个变量 (详情看 `sumai/docs/RED-002_env_migration_guide.md` 草稿)
- @devops · 生产 venv 确认 `python-dotenv>=1.0.1` 已装 (requirements.txt 已含)
- Founder · 切换生产 FLASK_SECRET_KEY 前,确认允许 Web 端用户一次性重登
- GRAY-004 后续任务:废弃文件(claude_*.py / bigmodel / deepseek / moonshot.py)里的硬编码 key 清理

---

### [2026-04-24] RED-001 · Anthropic Claude → Qwen 3.6 全量迁移 ✅

- **完成时间**: 2026-04-24 (Wave 1)
- **影响文件**: `sumai/stream.py`, `sumai/stream_en.py`

#### 详细变更

**stream.py**
- `get_openai_client_and_config()` 函数:更新模型名为 `qwen3.6-plus-2026-04-02`(Pro)和 `qwen3.6-flash-2026-04-16`(免费)
- `/test123` 端点 L1952:`get_claude_client_and_config` → `get_openai_client_and_config`
- `/test123` generate() 函数:Anthropic SDK (`client.messages.stream`) → OpenAI SDK (`client.chat.completions.create(stream=True)`)

**stream_en.py**
- 新增 `get_openai_client_and_config()` 函数(在 `get_claude_client_and_config` 之前),Qwen 3.6 配置
- 10 个端点调用从 `get_claude_client_and_config` → `get_openai_client_and_config`
- 11 个 generate() 函数(包含 Midjourney/Lovart 各1个变体)从 Anthropic SDK → OpenAI SDK

#### 测试结果

- `python3 -m py_compile stream.py stream_en.py` → OK
- `pytest tests/` → 18/18 PASS

#### Bug 修复(附带)

- stream_en.py 原先有 4 个端点(dalleStreamEN/hunyuanStreamEN/runwayStreamEN/kelingStreamEN)调用未定义的 `get_openai_client_and_config` 函数,本次新增函数定义修复此 pre-existing bug

---

## 上次更新记录

- 2026-04-24 22:30: W2-1 RED-002 凭证外移 + 强密钥 完成
- 2026-04-24: RED-001 Anthropic → Qwen 3.6 全量迁移 完成
- 2026-04-24: 多 Agent 系统初始化

---

## 2026-04-27 + 2026-04-28 同步 note

- **2026-04-27**:Stage 1 真机回归 + 三轮 UX hotfix(scroll-view enable-flex + display:flex 双开 bug,真因 GRAY-007 已纳入 KNOWN_ISSUES)。@frontend 主修,backend 角色未参与。详见 `daily-sync/2026-04-27.md`。
- **2026-04-28**:Founder 完成 5 人 Mom Test + Sean Ellis 40% 数据,验证"复杂任务 beachhead"假设;**D017 决策 Stage 1 三档复杂度下架**(Founder verdict "鸡肋");**D018 决策 Stage 2 启动**,先做 C 方案上下文注入。详见 `daily-sync/2026-04-28.md` + `decisions/DECISIONS.md`。
- 待 PM 出 spawn 拆解规划等 Founder "可以" 后,backend 角色可能被派发任务(详见 `handoffs/PENDING.md`)。
