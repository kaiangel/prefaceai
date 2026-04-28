# Tester(测试) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 D019 真·多轮对话 messages history sensor
> 角色: tester

---

## 最新测试结果(D019 基线 [2026-04-28])

| 测试项 | 结果 | 日期 |
|--------|------|------|
| xuhua-wx 全量(`pytest tests/`) | ✅ **18/18 PASSED**(持平) | 2026-04-28 |
| sumai 全量(`pytest tests/`) | ✅ **92 passed / 96 skipped / 3 xfailed / 2 xpassed** | 2026-04-28 |
| 合规(无境外 LLM) | ✅ PASS | 2026-04-28 |
| 架构(必需文件存在)| ✅ PASS | 2026-04-28 |
| 质量门(app.json 合法)| ✅ PASS | 2026-04-28 |
| Qwen 3.6 模型名合规 | ✅ PASS(`test_qwen_model_name_is_correct_in_config`)| 2026-04-28 |
| ~~complexity 三档 directive~~ | ❌ **D017 下架**(test_complexity.py 已删) | 2026-04-28 |
| ~~Stage 2 上下文注入(D018a/b system prompt 注入)~~ | ❌ **D019 下架**(test_context_injection.py 已删) | 2026-04-28 |
| **Stage 2 D019 真·多轮对话(messages history)** | ✅ **3 active PASS + 1 skip stub**(test_multi_turn_history.py)| 2026-04-28 |
| **wanxiangStream 用 Qwen** | ✅ PASS(`test_qwen_client::test_wanxiang_stream_uses_qwen`) | 2026-04-25 R3-D |
| TOCTOU xfail sensor | ⚠️ xfail(R3-B 已修保护,mock 局限,reason 已更新) | 2026-04-25 |
| 手动回归 5 关键流程 | 待做(强烈建议 D019 后做) | — |
| 主包尺寸 | ~800 KB(< 2 MB)| 2026-04-25 |

---

## 错误模式沉淀

- 当前无 EP 记录(`.team-brain/knowledge/ERROR_PATTERNS.md` 占位中,随项目推进填入)

---

## 给 @backend 的上下文

### Stage 2 D019 真·多轮对话 sensor 已就位 ✅
- `test_multi_turn_history.py` 3 active test 静态扫 stream.py:
  - `DEFAULT_REFINE_FALLBACK = "请基于以上输出做明显改进"` 常量 + 关键短语"明显改进"防退回 D018a 建议性
  - `HISTORY_CHAR_BUDGET = 6000` 常量
  - `def resolve_history(data):` 签名 + `data.get('history')` + `json.loads`/`except` (JSON 容错) + `'user'`/`'assistant'` 白名单 + `5000` 单 msg 截断 + `HISTORY_CHAR_BUDGET` 总长度截断引用
  - stream.py 17 + stream_en.py 14 = 31 端点 grep:`resolve_history(data)` ≥17/14 调用 + `conversation_history.extend(history)` ≥17/14 注入
- 隔离 exec 跑 resolve_history:None/空/非法 JSON/role=system 注入/合法 user msg/单 msg 5000 截断/总长度 6000 裁剪 7 场景全验证
- 1 skip stub 端点级集成测试(`test_d019_endpoints_actually_call_llm_with_extended_history`)等 Flask client + LLM mock 真实化抓 messages list

### Follow-up(P2-P3 非紧急)
1. **Test 4 stub 激活**: 函数体内已写完整 TODO 断言代码(`captured_messages.append(kwargs.get("messages", []))` + history 内容反向断言),直接 uncomment 即可。
2. **建议加 sensor `test_d019_no_legacy_d018ab_residue`**(P3): 防御 @backend 未来误把 D018a/b 的 CONTEXT_INJECTION_TEMPLATE / REFINE_INSTRUCTION_TEMPLATE / resolve_context / resolve_refine_instruction 残留代码恢复。一行 grep 静态扫描确保 0 残留。

### R4+ 延续 follow-up(非本轮)
1. **test_rate_limiting.py 6 测试激活前需重写**(P2): mock 旧 validate_request_and_user / save_content_prompt_stream 已删,需改 mock validate_and_deduct / save_prompt_record
2. **TOCTOU 集成测试**(P2): 真连 MySQL InnoDB 验证 SELECT FOR UPDATE,另立 `test_race_condition_integration.py`
3. **stream_en.py validate_and_deduct 单测**(P2)

---

## 给 @frontend 的上下文

- xuhua-wx tests/ 18/18 全绿,无前端回归
- D019 字段名约定:**与后端一致用 `history`**(stream.py resolve_history 读 `data.get('history')`)
- history 格式:**JSON string**,内容是 `[{"role":"user","content":"..."},{"role":"assistant","content":"..."}, ...]`
- role 白名单:仅 `'user'` / `'assistant'`,后端会过滤掉 `'system'` / `'tool'` / 其他 role(防注入越权)
- 单 message content > 5000 字符 / 总长度 > 6000 字符 后端会自动截断,前端无需做长度控制(但建议前端 conversationHistory 数组大小做合理上限,如 10 turn,防止 URL 超 nginx 8KB header buffer 导致 414)
- 真机回归建议加一条:多轮"继续优化"对话(2-3 轮),验证 LLM 真正基于上轮 user/assistant 上下文 真·多轮回答(而不是复述上轮 prompt 表面应付)

---

## 给 @devops 的上下文

- sumai 测试不进 CI(Founder 决定)
- 本轮删除 1 个测试文件 + 新增 1 个,合计 -6 + 4 = -2 test cases(净 -2)
- 本地运行依赖:仅 stdlib(json/re/pathlib/textwrap),不需要 mysql/flask/redis/anthropic/openai
- 生产 venv 跑 `pytest sumai/tests/` 仍可能暴露:
  - test_rate_limiting 6 个 fail(旧函数已删,需 R4+ 重写)
  - 已修正的 4 个 wanxiang 测试转为 PASS
- 本地基线: **92 passed / 96 skipped / 3 xfailed / 2 xpassed**

---

## 给 @pm 的上下文

### 本轮(D019)完成清单 ✅

| 任务 | 状态 |
|---|---|
| Step 1 删除 test_context_injection.py(D018a/b 整套淘汰) | ✅ |
| Step 1 README.md 同步(Stage 2 章节 + 历史档案) | ✅ |
| Step 2 新建 test_multi_turn_history.py(4 test:3 active + 1 skip) | ✅ |
| Step 2 验证 @backend stream.py D019 已实施(28 处 grep 命中) | ✅ |
| Step 3 全量回归(xuhua-wx 18 + sumai 92/96/3/2) | ✅ |
| Step 4 HARNESS_HEALTH 更新(D018a 行 → D019 下架,新增 D019 行,变更记录) | ✅ |
| Step 5 微信合规(无境外 LLM,无新依赖) | ✅ |
| Step 6 与 @backend 协同(实测发现已完成,直接进 Step 2) | ✅ |
| TEAM_CHAT 完成消息追加 | ✅ |
| Progress 三件套刷新 | ✅ |

### 给 PM 审查的关键点

1. **基线持平**: sumai passed = 92(持平 D018a 基线),total 持平 193,zero net regression
2. **未自行 commit**: 等 PM 审查统一 commit
3. **修改文件**:
   - `sumai/tests/test_context_injection.py`(已 git rm,sumai 独立 repo)
   - `sumai/tests/test_multi_turn_history.py`(新建,~370 行)
   - `sumai/tests/README.md`(2 处更新:Stage 2 章节标题 + 历史档案追加)
   - `.claude/agents/tester-progress/{current,completed,context-for-others}.md`(三件套)
   - `.team-brain/status/HARNESS_HEALTH.md`(2 处:Sensor 表 + 最近变更记录)
   - `.team-brain/TEAM_CHAT.md`(本条追加,见下方 SendMessage)

### 风险与后续

| 项 | 优先级 | 说明 |
|---|---|---|
| Test 4 stub 激活 | P2 | 等 sumai test 基础完善后 uncomment 即可 |
| D019 残余防御 sensor(防 D018a/b 复活) | P3 | 一行 grep 即可,本轮未加 |
| test_rate_limiting 6 测试重写 | P2 | 延续 R3-D follow-up |
| TOCTOU 集成测试 | P2 | 延续 R3-D follow-up |
| 微信 DevTools 5 关键流程手动回归 | **P1** | D019 上线"真·多轮对话"后强烈建议,验证 LLM 真正基于上轮上下文回答 |

---

## 上次更新记录

- **2026-04-28 本轮 D019**: 删除 test_context_injection.py + 新建 test_multi_turn_history.py(3 active + 1 skip)+ HARNESS_HEALTH 更新 + 全量回归 18 + 92/96/3/2 持平 D018a 基线
- 2026-04-28 D017+D018a: 删 test_complexity.py + 新建 test_context_injection.py(本轮已删除)
- 2026-04-25 Wave 2 Round 3 D: R3-D 收尾,测试基线 92/95/3/2,Wave 2 全部完成
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + test_complexity.py + TOCTOU 注释,命名冲突上报 PM
- 2026-04-24 Session 3 Wave 1: 5 测试文件 + TOCTOU 发现
- 2026-04-24: 多 Agent 系统初始化
