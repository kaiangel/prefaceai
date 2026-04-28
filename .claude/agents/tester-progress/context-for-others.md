# Tester(测试) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D017 三档下架 + D018a Stage 2 上下文注入
> 角色: tester

---

## 最新测试结果(D017 + D018a 基线 [2026-04-28])

| 测试项 | 结果 | 日期 |
|--------|------|------|
| xuhua-wx 全量(`pytest tests/`) | ✅ **18/18 PASSED**(持平) | 2026-04-28 |
| sumai 全量(`pytest tests/`) | ✅ **92 passed / 96 skipped / 3 xfailed / 2 xpassed** | 2026-04-28 |
| 合规(无境外 LLM) | ✅ PASS | 2026-04-28 |
| 架构(必需文件存在)| ✅ PASS | 2026-04-28 |
| 质量门(app.json 合法)| ✅ PASS | 2026-04-28 |
| Qwen 3.6 模型名合规 | ✅ PASS(`test_qwen_model_name_is_correct_in_config`)| 2026-04-28 |
| ~~complexity 三档 directive~~ | ❌ **D017 下架**(test_complexity.py 已删) | 2026-04-28 |
| **Stage 2 上下文注入(D018a)** | ✅ **3 active PASS + 1 skip stub**(test_context_injection.py)| 2026-04-28 |
| **wanxiangStream 用 Qwen** | ✅ PASS(`test_qwen_client::test_wanxiang_stream_uses_qwen`) | 2026-04-25 R3-D |
| TOCTOU xfail sensor | ⚠️ xfail(R3-B 已修保护,mock 局限,reason 已更新) | 2026-04-25 |
| 手动回归 5 关键流程 | 待做(强烈建议 D018a 后做) | — |
| 主包尺寸 | ~800 KB(< 2 MB)| 2026-04-25 |

---

## 错误模式沉淀

- 当前无 EP 记录(`.team-brain/knowledge/ERROR_PATTERNS.md` 占位中,随项目推进填入)

---

## 给 @backend 的上下文

### Stage 2 D018a 上下文注入 sensor 已就位 ✅
- `test_context_injection.py` 3 active test 静态扫 stream.py + stream_en.py:
  - `CONTEXT_INJECTION_TEMPLATE` / `CONTEXT_INJECTION_TEMPLATE_EN` 模板常量
  - `def resolve_context(data):` 签名 + `data.get('context_prompt')` + 5000 截断保护
  - resolve_context 隔离 exec 跑功能验证(None/空/6000 截断/5000 边界)
- 1 skip stub 端点级集成测试(`test_endpoints_inject_context_when_present`)等 Flask client + LLM mock 真实化

### Follow-up(P2 非紧急)
1. **Test 4 stub 激活**: 函数体内已写完整 TODO 断言代码,直接 uncomment 即可
2. **建议加 sensor `test_all_sse_endpoints_call_resolve_context`**: 静态扫所有 SSE 端点 generate() 内是否有 `ctx = resolve_context(data)`,防御未来新增端点漏注入

### R4+ 延续 follow-up(非本轮)
1. **test_rate_limiting.py 6 测试激活前需重写**(P2): mock 旧 validate_request_and_user / save_content_prompt_stream 已删,需改 mock validate_and_deduct / save_prompt_record
2. **TOCTOU 集成测试**(P2): 真连 MySQL InnoDB 验证 SELECT FOR UPDATE,另立 `test_race_condition_integration.py`
3. **stream_en.py validate_and_deduct 单测**(P2)

---

## 给 @frontend 的上下文

- xuhua-wx tests/ 18/18 全绿,无前端回归
- D018a `context_prompt` 字段名约定:**与后端一致用 `context_prompt`**(stream.py:40 / stream_en.py:42 `data.get('context_prompt', '')`)
- 3 轮 counter 由前端强制(后端不感知轮次,每次 stateless)
- 后端模板"【上下文】用户上一轮已得到的 prompt 是: ... 现在用户希望基于此继续优化"(stream.py:29-35) — UI 文案应与此对齐
- 真机回归建议加一条:"基于此继续优化"按钮第 1/2/3 次正常,第 4 次应被前端 disable

---

## 给 @devops 的上下文

- sumai 测试不进 CI(Founder 决定)
- 本轮删除 1 个测试文件 + 新增 1 个,合计 -3 + 4 = +1 test cases
- 本地运行依赖:仅 stdlib(re/pathlib/textwrap),不需要 mysql/flask/redis
- 生产 venv 跑 `pytest sumai/tests/` 仍可能暴露:
  - test_rate_limiting 6 个 fail(旧函数已删,需 R4+ 重写)
  - 已修正的 4 个 wanxiang 测试转为 PASS

---

## 给 @pm 的上下文

### 本轮(D017 + D018a)完成清单 ✅

| 任务 | 状态 |
|---|---|
| Phase 1 删除 test_complexity.py(D017) | ✅ |
| Phase 1 残留扫描 + README 清理 | ✅ |
| Phase 2 新建 test_context_injection.py(4 test) | ✅ |
| Phase 2 验证 @backend stream.py + stream_en.py 已实施 CONTEXT_INJECTION_TEMPLATE + resolve_context | ✅ |
| Phase 3 全量回归(xuhua-wx 18 + sumai 92/96/3/2) | ✅ |
| Phase 4 HARNESS_HEALTH 更新 | ✅ |
| TEAM_CHAT 完成消息追加 | ✅ |
| Progress 三件套刷新 | ✅ |

### 给 PM 审查的关键点

1. **基线持平**: sumai passed = 92(持平 R3-D),total +1
2. **未自行 commit**: 等 PM 审查统一 commit
3. **修改文件**:
   - `sumai/tests/test_complexity.py`(已 git rm,sumai 独立 repo)
   - `sumai/tests/test_context_injection.py`(新建)
   - `sumai/tests/README.md`(2 处更新)
   - `.claude/agents/tester-progress/{current,completed,context-for-others}.md`(三件套)
   - `.team-brain/status/HARNESS_HEALTH.md`
   - `.team-brain/TEAM_CHAT.md`(本条追加)

### 风险与后续

| 项 | 优先级 | 说明 |
|---|---|---|
| Test 4 stub 激活 | P2 | 等 sumai test 基础完善后 uncomment 即可 |
| test_rate_limiting 6 测试重写 | P2 | 延续 R3-D follow-up |
| TOCTOU 集成测试 | P2 | 延续 R3-D follow-up |
| 微信 DevTools 5 关键流程手动回归 | **P1** | D018a 上线"基于此继续优化"按钮后强烈建议 |

---

## 上次更新记录

- **2026-04-28 本轮**: D017 三档下架(删 test_complexity.py)+ D018a Stage 2 上下文注入 sensor(新建 test_context_injection.py 3 active + 1 skip)+ 全量回归 18 + 92/96/3/2
- 2026-04-25 Wave 2 Round 3 D: R3-D 收尾,测试基线 92/95/3/2,Wave 2 全部完成
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + test_complexity.py + TOCTOU 注释,命名冲突上报 PM
- 2026-04-24 Session 3 Wave 1: 5 测试文件 + TOCTOU 发现
- 2026-04-24: 多 Agent 系统初始化
