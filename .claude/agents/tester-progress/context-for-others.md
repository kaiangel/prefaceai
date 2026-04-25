# Tester(测试) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 Round 3 D
> 角色: tester

---

## 最新测试结果(Wave 2 R3-D 收尾基线 [2026-04-25])

| 测试项 | 结果 | 日期 |
|--------|------|------|
| xuhua-wx 全量(`pytest tests/`) | ✅ **18/18 PASSED**(持平) | 2026-04-25 R3-D |
| sumai 全量(`pytest tests/`) | ✅ **92 passed / 95 skipped / 3 xfailed / 2 xpassed** | 2026-04-25 R3-D |
| 合规(无境外 LLM) | ✅ PASS | 2026-04-25 |
| 架构(必需文件存在)| ✅ PASS | 2026-04-25 |
| 质量门(app.json 合法)| ✅ PASS | 2026-04-25 |
| Qwen 3.6 模型名合规 | ✅ PASS(`test_qwen_model_name_is_correct_in_config`)| 2026-04-25 |
| **complexity 三档 directive** | ✅ **3/3 PASS**(`test_complexity.py`,R3-D 激活) | 2026-04-25 |
| **wanxiangStream 用 Qwen** | ✅ PASS(`test_qwen_client::test_wanxiang_stream_uses_qwen`,R3-D 替换 hunyuan) | 2026-04-25 |
| TOCTOU xfail sensor | ⚠️ xfail(R3-B 已修保护,mock 局限,reason 已更新) | 2026-04-25 |
| 手动回归 5 关键流程 | 待做 | — |
| 主包尺寸 | ~800 KB(< 2 MB,R3-C 增量 ~145B)| 2026-04-25 |

---

## 错误模式沉淀

- 当前无 EP 记录(`.team-brain/knowledge/ERROR_PATTERNS.md` 占位中,随项目推进填入)

---

## 给 @backend 的上下文

### Wave 2 测试线全部完成 ✅
- **R3-A complexity 三档 system prompt** → `test_complexity.py` 3/3 PASS,sensor 已就位
- **R3-B 全 31 端点 SELECT FOR UPDATE TOCTOU 修复** → mock 不能验证(局限),保留 xfail
- **W2-2 方案 Y(/wanxiangStream 替换 /hunyuanStream)** → 4 个 fallout 测试已修正

### R4+ 你可能需要的测试 follow-up(非紧急)

1. **test_rate_limiting.py 6 个测试需重写**(P2):
   - 全部 mock 旧 `validate_request_and_user` / `save_content_prompt_stream`(已删除)
   - 本地 skipif(SUMAI_DEPS_AVAILABLE) 整体 skip,生产 venv 装依赖后激活会 6 个 fail
   - 重写为 mock `validate_and_deduct` / `save_prompt_record`,user_info 5-tuple 结构兼容
   - 文件头 docstring 已加警告
2. **TOCTOU 集成测试**(P2):
   - 真连 MySQL InnoDB 验证 SELECT FOR UPDATE 有效
   - 另立 `test_race_condition_integration.py`,不放 mock 文件
3. **stream_en.py validate_and_deduct 单测**(P2):
   - R3-B 在 stream_en.py 新增了独立 validate_and_deduct(从 stream.py 复制)
   - 当前无单独 sensor,可加 `test_stream_en_validate_and_deduct_returns_compatible_tuple`
4. **建议新增 sensor**(@backend 可顺手加,我帮审查):
   - `test_no_old_validate_request_and_user_remaining` — 全文搜 sumai/*.py 无 def 残留
   - `test_no_old_save_content_prompt_stream_remaining` — 同上
   - `test_complexity_directives_dict_complete` — 静态扫三档键齐全(已被 test_complexity.py Test 1 覆盖,可不重复)
   - `test_all_sse_endpoints_inject_directive` — 扫所有端点 conversation_history.append 含 COMPLEXITY_DIRECTIVES

---

## 给 @frontend 的上下文

- xuhua-wx tests/ 18/18 全绿,无前端回归
- R3-C 透传 complexity 完成后,前端无新增测试需求
- 端到端联调可在真机进行(R3-C context 给的建议:iPhone 选"💎 专业项目"档,期望生成更长结构化 prompt)

---

## 给 @devops 的上下文

- sumai 测试不进 CI(Founder 决定暂不引入)
- R3-D 删除 2 个测试文件,新增 0 个,合计 -16 test cases
- 本地运行依赖:仅 stdlib(re/pathlib),不需要 mysql/flask/redis(那部分都走 SUMAI_DEPS_AVAILABLE skipif)
- 生产部署后建议在生产 venv 跑一次 `pytest sumai/tests/`,可能暴露:
  - test_rate_limiting 6 个 fail(旧函数已删,需 R4+ 重写)
  - test_endpoints_exist / test_sse_stream_structure / test_qwen_client / test_orphan_endpoints 中已修正的 4 个 wanxiang 测试转为 PASS

---

## 给 @pm 的上下文

### Wave 2 测试线完成清单 ✅

| 任务 | R 轮 | 状态 |
|---|---|---|
| 基线测试记录 | R1 | ✅ |
| TOCTOU xfail sensor 注释 | R1 | ✅ |
| test_complexity.py 3 stub 草稿 | R1 | ✅ |
| TOCTOU sensor reason 更新(R3-B 后) | R3-D | ✅ |
| test_complexity.py 重写 + 激活(D016 dict 实施) | R3-D | ✅ |
| 删除 deep 命名废弃文件 | R3-D | ✅ |
| 删除旧 validate_request_and_user 测试 | R3-D | ✅ |
| W2-2 fallout 4 测试更新 | R3-D | ✅ |
| 全量回归 + HARNESS_HEALTH 更新 | R3-D | ✅ |

### 风险与后续

| 项 | 优先级 | 说明 |
|---|---|---|
| test_rate_limiting 6 测试重写 | P2 | 本地 skip,生产 venv 激活会 fail。R4+ 处理,文档已警告 |
| TOCTOU 集成测试 | P2 | mock 不够,需真连 MySQL。R4+ |
| 微信 DevTools 5 关键流程手动回归 | P1 | Wave 2 全部完成后可做(R3-C 给了真机验证建议) |

---

## 上次更新记录

- 2026-04-25 Wave 2 Round 3 D: R3-D 收尾,测试基线 92/95/3/2,Wave 2 全部完成
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + test_complexity.py + TOCTOU 注释,命名冲突上报 PM
- 2026-04-24 Session 3 Wave 1: 5 个新测试文件 + TOCTOU 发现
- 2026-04-24 Session 3 Wave 2 Round 1
- 2026-04-24: 多 Agent 系统初始化
