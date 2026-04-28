# Tester(测试) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D017 三档下架 + D018a Stage 2 上下文注入(Phase 1+2 合并)
> 角色: tester

---

## 当前状态

✅ **D017 + D018a Phase 1+2 合并任务完成 — 待 PM 审查**

### 本轮完成的工作(2026-04-28)

**Phase 1 — 三档相关测试清理(D017)** ✅

1. **删除 `sumai/tests/test_complexity.py`**(R3-D 创建的 3 个 active 测试)
   - 启动时实测 sumai 已 89 passed + 3 failed:@backend 在我接手前已删 stream.py 顶部 `COMPLEXITY_DIRECTIVES` dict + `resolve_complexity` 函数,致 sensor 凋零
   - `cd sumai && git rm tests/test_complexity.py` 完成

2. **残留扫描** ✅
   - `grep -rn "COMPLEXITY_DIRECTIVES\|resolve_complexity\|complexity" sumai/tests/` → 测试代码 0 行残留
   - case-insensitive grep 命中两处:
     - (a) `sumai/tests/README.md` 旧表格,**已清理**(改为 D017 后已下架的 3 文件 + Stage 2 章节)
     - (b) `sumai/tests/test_sse_is_pro_branch.py:113` `def test_is_pro_determines_system_prompt_complexity` — 此处 "complexity" 指 prompt 精细度(max_tokens 控制),**与 D016/D017 三档无关**,保留

**Phase 2 — Stage 2 D018a 上下文注入测试 stub** ✅

新建 `sumai/tests/test_context_injection.py`(~250 行,4 个 test):

| # | 测试 | 类型 | 结果 |
|---|------|------|------|
| 1 | `test_context_injection_template_exists` | active 静态扫描 | ✅ PASS |
| 2 | `test_resolve_context_function_exists` | active 静态扫描 | ✅ PASS |
| 3 | `test_resolve_context_truncates_oversized_input` | active 功能(隔离 exec) | ✅ PASS |
| 4 | `test_endpoints_inject_context_when_present` | skip stub(等 Flask client + LLM mock) | ⏸️ SKIP |

**关键技术决策(Test 3)**:
- 不 import 整个 stream.py(顶部 `from anthropic import Anthropic` + `os.environ['MYSQL_PASSWORD']` 在本地无生产凭证时崩)
- 改用 regex 抽取 `def resolve_context(data):` 函数体源码 + `exec()` 到隔离 namespace,只跑纯函数逻辑
- 验证四种场景:None / 空串 / 6000 字符截断(≤5050)/ 边界 5000 字符不截断

**Phase 3 — 全量回归** ✅

| 测试套 | 启动时基线 | 删 test_complexity 后 | + test_context_injection 后 | 任务最低要求 | 实际 |
|---|---|---|---|---|---|
| xuhua-wx | 18 passed | 18 | **18 passed** | 18 | ✅ 持平 |
| sumai passed | 89(+3 failed) | 89 | **92 passed** | ≥89 | ✅ 持平 R3-D 基线 |
| sumai skipped | 95 | 95 | **96 skipped** | (95-3+1=93) | ✅ +1 |
| sumai xfailed | 3 | 3 | **3 xfailed** | 3 | ✅ |
| sumai xpassed | 2 | 2 | **2 xpassed** | 2 | ✅ |
| sumai total | 195(含 3 fail) | 189 | **193** | — | -2 净变化 |

**Phase 4 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表 `complexity 三档 directive (D016)` 行标记为 D017 (2026-04-28) 下架
- 新增 Stage 2 D018a `test_context_injection.py(3 active + 1 skip)` 行
- 最近变更记录追加本次 D017 清理 + D018a 新 sensor 详细条目

---

## 关键测试数据

| 测试套 | R3-D 基线 | 本轮(D017+D018a)| 变化 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** | 持平 ✅ |
| sumai passed | 92 | **92** | 持平 ✅(R3-D 后 @backend 让 3 fail,删后 89,加 3 active 后回到 92) |
| sumai skipped | 95 | **96** | +1(test_endpoints_inject_context_when_present skip) |
| sumai xfailed | 3 | **3** | 持平 |
| sumai xpassed | 2 | **2** | 持平 |
| sumai total | 192 | **193** | -1+4=+1(删 1 文件 3 test,加 1 文件 4 test) |

---

## 给 @backend 的 Follow-up 建议(非紧急)

1. **Test 4 端点级集成测试激活**(P2): 需 Flask test client + LLM mock 真实化。skip 装饰器 reason 已说明,函数体内已 TODO 写完整断言代码可直接 uncomment。
2. **建议加 sensor `test_all_sse_endpoints_call_resolve_context`**(P3): 静态扫所有 SSE 端点 generate() 内是否有 `ctx = resolve_context(data)` 行。可防御未来新增端点漏注入。当前 grep 命中 stream.py 12+ 处 + stream_en.py 13+ 处,人工已确认覆盖完整。

---

## 给 @frontend 的协调点

- `context_prompt` 字段名约定:**与后端一致用 `context_prompt`**(stream.py:40 `data.get('context_prompt', '')`)
- 3 轮 counter 由前端强制(后端不感知轮次,每次 stateless)
- 真机回归 5 关键流程建议加一条:"基于此继续优化"按钮第 4 次应被前端 disable

---

## 风险与后续 follow-up

1. **Test 4 stub 激活前是文档覆盖**: 静态扫描 + 功能测试覆盖了 90% 风险,但端点级集成测试缺失,生产真实流量万一有 edge case(如 form-data vs query-string 字段名不同)无 sensor 兜底。Founder/PM 可决定是否 P1 提前激活
2. **test_rate_limiting.py 6 个测试激活前需重写**(P2,延续): 旧 mock 函数已删,等 R4+ 处理
3. **微信 DevTools 5 关键流程手动回归**(P1,延续): D018a 新增"基于此继续优化"按钮后强烈建议加一次完整真机回归

---

## 上次更新记录

- **2026-04-28 本轮**: D017 三档下架(删 test_complexity.py)+ D018a Stage 2 上下文注入(新建 test_context_injection.py)+ 全量回归 18 + 92/96/3/2
- 2026-04-25 Wave 2 Round 3 D: 测试激活 + 旧测试清理 + W2-2 fallout + 全量回归
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + Round 3 测试草稿 + TOCTOU 注释
- 2026-04-24 Session 3 Wave 1: 5 个新测试文件(PM 代写)
- 2026-04-24 Session 2: sumai 185 test 骨架
- 2026-04-24 Session 初始化: tests/ 三件套 + HARNESS_HEALTH.md
