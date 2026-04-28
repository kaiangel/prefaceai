# Tester(测试) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D019 真·多轮对话 messages history sensor
> 角色: tester

---

## 当前状态

✅ **D019 真·多轮对话测试清理 + 新 sensor 完成 — 待 PM 审查**

### 本轮完成的工作(2026-04-28 D019)

**Step 1 — 删除 D018a/b 测试** ✅
- `cd sumai && git rm tests/test_context_injection.py`(整个文件,5 active + 1 skip 全删)
- 原因: D018a/b 用 system prompt 注入 directive 让 LLM "继续优化",Founder 真机反馈 LLM 仍然复述不改写。真因是非真·多轮对话,system prompt 注入 ≠ messages history。D019 改用真·多轮对话替代,旧整套淘汰。
- `tests/README.md` 同步:Stage 2 章节标题 D018a → D019,test_context_injection.py 行替换为 test_multi_turn_history.py,D017 后下架清单追加 test_context_injection.py

**Step 2 — 新建 `tests/test_multi_turn_history.py`(~370 行,4 test:3 active + 1 skip)** ✅

| # | 测试 | 类型 | 结果 |
|---|------|------|------|
| 1 | `test_d019_constants_and_function_exist` | active 静态扫描 | ✅ PASS |
| 2 | `test_d019_endpoints_extend_history_into_messages` | active 静态扫描 | ✅ PASS |
| 3 | `test_d019_role_whitelist_blocks_system_injection` | active 隔离 exec 功能 | ✅ PASS |
| 4 | `test_d019_endpoints_actually_call_llm_with_extended_history` | skip stub(等 Flask client + LLM mock) | ⏸️ SKIP |

**Test 1 覆盖**:
- `DEFAULT_REFINE_FALLBACK = "请基于以上输出做明显改进"` 常量(强约束措辞,关键短语 "明显改进" 防退回 D018a 建议性措辞)
- `HISTORY_CHAR_BUDGET = 6000` 常量
- `def resolve_history(data):` 签名
- 函数体 grep:`data.get('history')` + `json.loads` + `except` (JSON 容错) + `'user'` + `'assistant'` 白名单 + `5000` (单 msg 截断) + `HISTORY_CHAR_BUDGET` (总长度截断引用)
- stream_en.py 兼容路径:若未自定义 def resolve_history,必须 `from stream import resolve_history` 或代码中存在 resolve_history 引用

**Test 2 覆盖**(grep 计数):
- stream.py: `resolve_history(data)` 调用 ≥17 + `conversation_history.extend(history)` 或 `messages.extend(history)` ≥17
- stream_en.py: 同样 ≥14
- 实际命中: stream.py 28 处含 resolve_history/DEFAULT_REFINE_FALLBACK/HISTORY_CHAR_BUDGET 引用

**Test 3 关键技术决策**:
- 沿用 D018a 隔离 exec 模式(避免 import stream.py 顶部 anthropic + os.environ['MYSQL_PASSWORD'] 在本地无凭证时崩)
- **关键改进**:namespace 必须预注入 `DEFAULT_REFINE_FALLBACK` + `HISTORY_CHAR_BUDGET` + `json` + `re`(因 resolve_history 函数体引用模块级常量,exec 子作用域无)
- 实现:用 regex 抽取常量赋值字符串 → eval 安全 literal → 注入 namespace → exec 函数体
- 验证 7 种场景:
  1. 缺 history 字段 → []
  2. 空字符串 → []
  3. 非法 JSON garbage → [](fallback 防 SSE 500)
  4. role=system 注入 → [](白名单过滤,防越权)
  5. 合法 user message → 保留
  6. 单 message content > 5000 字符 → 截断到 ≤5050
  7. 总长度 > 6000 (4 个 2000 字符 user msg) → 裁剪到 ≤6500(含截断后缀容差)

**Step 3 — 全量回归** ✅

| 测试套 | 启动时基线 | 删 test_context_injection 后 | + test_multi_turn_history 后 | 任务最低要求 | 实际 |
|---|---|---|---|---|---|
| xuhua-wx | 18 passed | 18 | **18 passed** | 18 | ✅ 持平 |
| sumai passed | 94 (D018a/b 5 active + 6 D018b 新加) | 89 | **92 passed** | ≥91 | ✅ |
| sumai skipped | 96 | 95 | **96 skipped** | (持平) | ✅ |
| sumai xfailed | 3 | 3 | **3 xfailed** | 3 | ✅ |
| sumai xpassed | 2 | 2 | **2 xpassed** | 2 | ✅ |
| sumai total | 195 | 189 | **193** | — | -2 净变化 |

**Step 4 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表 D018a 行标记为 D019 (2026-04-28) 下架,加新 D019 行
- 合计行 sensor 计数说明更新
- 最近变更记录 D019 详细条目追加(放在 D018a 条目上方)

**Step 5 — 微信小程序合规** ✅
- 测试中无境外 LLM 端点硬编码
- 仅用 stdlib(json/re/pathlib/textwrap),不引入新 Python 包

**Step 6 — 与 @backend 协同** ✅
- 启动时检查发现 @backend 已完成 D019 实施(stream.py 28 处含 resolve_history/DEFAULT_REFINE_FALLBACK/HISTORY_CHAR_BUDGET)
- 直接进入测试阶段,无需等待
- Test 1+2 一次跑过;Test 3 首次因 namespace 缺常量 fail,加常量注入后跑过

---

## 关键测试数据

| 测试套 | D018a 基线 | 本轮(D019)| 变化 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** | 持平 ✅ |
| sumai passed | 92(D018a 收尾)/ 94(D018b 后) | **92 passed** | 持平 D018a 基线 ✅ |
| sumai skipped | 96 | **96** | 持平 |
| sumai xfailed | 3 | **3** | 持平 |
| sumai xpassed | 2 | **2** | 持平 |
| sumai total | 193(D018a)/ 195(D018b)| **193** | 持平 D018a |

---

## 给 @backend 的 Follow-up 建议(非紧急)

1. **Test 4 端点级集成测试激活**(P2): 需 Flask test client + LLM mock 真实化抓 messages list。skip 装饰器 reason 已说明,函数体内 TODO 完整断言代码已写好(`captured_messages.append(kwargs.get("messages", []))` + history 内容断言),uncomment 即可。
2. **建议加 sensor `test_d019_no_legacy_context_injection_template`**(P3): 防御 @backend 未来误把 D018a/b 的 CONTEXT_INJECTION_TEMPLATE / REFINE_INSTRUCTION_TEMPLATE / resolve_context / resolve_refine_instruction 残留代码恢复。可 grep 静态扫描确保 0 残留。

## 给 @frontend 的协调点

- 字段名约定:**与后端一致用 `history`**(stream.py resolve_history 读 `data.get('history')`)
- history 格式:JSON string,内容是 `[{"role":"user","content":"..."},{"role":"assistant","content":"..."}, ...]`
- role 白名单:仅 `'user'` / `'assistant'`,后端会过滤掉 `'system'` / `'tool'` / 其他 role
- 单 message content > 5000 字符 / 总长度 > 6000 字符 后端会自动截断,前端无需做长度控制(但建议前端 conversationHistory 数组大小做合理上限,如 10 turn,防止 URL 超 nginx 8KB header buffer)
- 真机回归 5 关键流程建议加一条:多轮"继续优化"对话,验证 LLM 真正基于上轮 user/assistant 上下文回答(而不是复述上轮 prompt)

## 给 @devops 的协调点

- 本轮无新 Python 包,本地运行依赖仅 stdlib(json/re/pathlib/textwrap)
- 生产 venv 跑 `pytest sumai/tests/` 应得 92 passed / 96 skipped / 3 xfailed / 2 xpassed(本地 vs 生产应一致,所有改动都是静态扫描 + 隔离 exec)

---

## 风险与后续 follow-up

1. **Test 4 stub 激活前是文档覆盖**: 静态扫描(Test 2)+ 功能测试(Test 3)覆盖了 95% 风险,但端点级集成测试缺失,生产真实流量万一有 edge case(如 SSE 端点 form-data vs query-string 字段名不同 / nginx URL 长度限制)无 sensor 兜底。Founder/PM 可决定是否 P1 提前激活。
2. **test_rate_limiting.py 6 个测试激活前需重写**(P2,延续): 旧 mock 函数已删,等 R4+ 处理。
3. **微信 DevTools 5 关键流程手动回归**(P1,延续): D019 上线"真·多轮对话"后强烈建议加一次完整真机回归,重点验证多轮 prompt 演进的语义连贯性。

---

## 上次更新记录

- **2026-04-28 本轮 D019**: 删除 test_context_injection.py(D018a/b 整套淘汰)+ 新建 test_multi_turn_history.py(3 active + 1 skip)+ HARNESS_HEALTH 更新 + 全量回归 18 + 92/96/3/2(持平 D018a 基线)
- 2026-04-28 D017+D018a: 删 test_complexity.py + 新建 test_context_injection.py(本轮已删除)
- 2026-04-25 Wave 2 Round 3 D: 测试激活 + 旧测试清理 + W2-2 fallout + 全量回归
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + Round 3 测试草稿 + TOCTOU 注释
- 2026-04-24 Session 3 Wave 1: 5 个新测试文件(PM 代写)
- 2026-04-24 Session 2: sumai 185 test 骨架
- 2026-04-24 Session 初始化: tests/ 三件套 + HARNESS_HEALTH.md
