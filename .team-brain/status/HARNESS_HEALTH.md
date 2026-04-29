# Harness 健康度看板

> 上次更新: 2026-04-28 21:43 D020 防御 sensor(@tester)— footer + 调温 + Pro 模型切换 4 sensor **全 PASS** ✅(@backend 21:42:53 完成 31 端点应用 + Pro 模型切换 + sumai/CLAUDE.md 同步更新)
> 更新者: PM(Coordinator 兼 PM)
> 更新频率: 每周一次,或每个重大 TASK 完成后

---

## Sensor 覆盖率

### xuhua-wx 前端(tests/)

| 架构规则 | 文档记录 (Guide) | 自动化测试 (Sensor) | Hook 强制 |
|---------|:---:|:---:|:---:|
| 必需文件存在 | ✅ | ✅ test_architecture | PreCommit |
| 7 角色 progress | ✅ | ✅ test_architecture | PreCommit |
| API base URL 一致性 | ✅ | ✅ test_architecture | PreCommit |
| 境外 LLM 端点禁令(合规) | ✅ | ✅ test_architecture | PreCommit |
| .team-brain 目录结构 | ✅ | ✅ test_architecture | PreCommit |
| TEAM_CHAT header 完整 | ✅ | ✅ test_architecture | PreCommit |
| HARNESS_HEALTH.md 存在 | ✅ | ✅ test_architecture | PreCommit |
| test_error_patterns 存在 | ✅ | ✅ test_architecture | PreCommit |
| 8 xh* skills 存在 | ✅ | ✅ test_architecture | PreCommit |
| XUHUA_SKILL_TRIGGERS 重命名 | ✅ | ✅ test_architecture | PreCommit |
| app.json 合法 | ✅ | ✅ test_quality_gates | PreCommit |
| page 四件套完整 | ✅ | ✅ test_quality_gates | PreCommit |
| tabBar 图标存在 | ✅ | ✅ test_quality_gates | PreCommit |
| pages/ 无 backup 文件 | ✅ | ✅ test_quality_gates | PreCommit |
| .gitignore 排除内部文档 | ✅ | ✅ test_quality_gates | PreCommit |

**合计**: 15 条 sensor,18/18 pytest PASS

### sumai 后端(sumai/tests/)

| 维度 | Sensor | 状态 |
|---|---|---|
| Qwen 3.6 模型名合规 | test_qwen_model_name_is_correct_in_config | ✅ passed(Session 3 迁移后 PM 代修) |
| 速率限制 | test_rate_limiting.py(6 tests) | ⏸️ 全文件 skip(本地无 mysql.connector) + 1 xfail TOCTOU sensor;**激活前需重写**(Mock 旧 validate_request_and_user 已删) |
| TOCTOU 竞争 | test_race_condition_sensor | ⚠️ xfail(全 31 端点 SELECT FOR UPDATE 已就位 R3-B,mock 不能模拟 MySQL 行锁,集成测试待 R4+) |
| /history | test_history.py(4 stub) | ⏸️ skip(等 mock) |
| /revoke_history | test_revoke_history.py(3 stub) | ⏸️ skip(等 mock) |
| /describeImageStream | test_describe_image_stream.py(4 stub) | ⏸️ skip(等 mock) |
| 第三方登录 | test_third_party_login.py(3 stub) | ⏸️ skip(等 mock) |
| SSE 端点骨架 | test_sse_* 系列 | 部分 passed,部分 skip |
| ~~complexity 三档 directive(D016)~~ | ~~test_complexity.py~~ | ❌ **D017 (2026-04-28) 下架** — Founder verdict "鸡肋",@backend 删 stream.py 顶部 dict + 函数,@tester 删测试文件 |
| ~~Stage 2 上下文注入(D018a/b system prompt 注入)~~ | ~~test_context_injection.py~~ | ❌ **D019 (2026-04-28) 下架** — Founder 真机反馈 D018a/b directive 注入 LLM 仍复述不改写,真因是非真·多轮对话;改用 messages history extend(下方 D019 sensor) |
| **Stage 2 D019 真·多轮对话 (messages history)** | test_multi_turn_history.py(3 active + 1 skip) | ✅ **3/3 active passed + 1 skip stub**(DEFAULT_REFINE_FALLBACK + HISTORY_CHAR_BUDGET + def resolve_history + 31 端点 extend grep + role 白名单/JSON 容错/单 5000+总 6000 截断 隔离 exec 验证) |
| **Stage 2 D020 multi-turn footer 常量(防误删/简化)** | test_d020_multi_turn_footer_constant_exists | ✅ **PASS**(MULTI_TURN_FOOTER + MULTI_TURN_FOOTER_EN 顶部定义,关键短语锁定:zh "多轮对话特别处理"/"最高优先级"/"禁止用 X"/"换一个"/"完全不一样";en "multi-turn special handling"/"highest priority"/"do not use"/"completely different") |
| **Stage 2 D020 multi-turn temperature 调高** | test_d020_multi_turn_temperature_is_increased | ✅ **PASS**(MULTI_TURN_TEMPERATURE = 0.85 + EN 同步,>= 0.8 阈值,鼓励 LLM 跳出"复述上轮"概率分布) |
| **Stage 2 D020 Pro 模型 qwen3.6-plus(防回归 deepseek-v3)** | test_d020_pro_model_is_qwen_not_deepseek | ✅ **PASS**(`deepseek-v3-250324` 0 hits 完全清除,`qwen3.6-plus-2026-04-02` 已切换,`qwen3.6-flash-2026-04-16` 免费分支保留) |
| **Stage 2 D020 31 端点应用 footer + 调温** | test_d020_endpoints_apply_footer_when_history_present | ✅ **PASS**(stream.py MULTI_TURN_FOOTER 35 / MULTI_TURN_TEMPERATURE 35;stream_en.py MULTI_TURN_FOOTER_EN 29 / MULTI_TURN_TEMPERATURE_EN 29;final_system zh 85 / en 70;final_temperature zh 68 / en 56 — 全部远超阈值) |
| **/wanxiangStream 注册存在** | test_orphan_endpoints::test_wanxiang_stream_is_present | ✅ R3-D xfail 已移除,改为正向断言(本地 skip 因缺 app fixture,生产 venv pass) |
| **wanxiangStream 用 Qwen(合规)** | test_qwen_client::test_wanxiang_stream_uses_qwen | ✅ passed(R3-D 替代旧 test_hunyuan_stream_uses_qwen) |
| **/hunyuanStream 已下架** | test_endpoints_exist + test_sse_stream_structure 列表 | ✅ R3-D 已替换为 /wanxiangStream(本地 skip,生产 venv pass) |

**合计**: 198 个 test case,**97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed**(D020 收尾 [2026-04-28 21:43]。新增 test_d020_multi_turn_footer_constant_exists / test_d020_multi_turn_temperature_is_increased / test_d020_pro_model_is_qwen_not_deepseek / test_d020_endpoints_apply_footer_when_history_present 共 4 个 active sensor 全 PASS;@backend 21:42:53 完成 31 端点 footer + 调温应用 + Pro 模型切换 deepseek-v3 → qwen3.6-plus(stream.py + stream_en.py)+ sumai/CLAUDE.md D020 闭环同步。passed +5 vs D019 基线 92,total +5 vs D019 193。)

---

## 错误模式防护率

- 已记录错误模式: **0 个**(未来 `.team-brain/knowledge/ERROR_PATTERNS.md` 追加)
- 有工程化防护 (Sensor/Hook): **0 个**
- 仅文档记录: **0 个**
- **防护率**: **N/A**(无错误模式记录)

### 已知警报 vs Sensor(Wave 2 收官 2026-04-25)

| 警报 ID | 严重度 | Sensor 状态 |
|---|---|---|
| RED-001 | ✅ 已解 | 模型名 sensor 已激活(Wave 1) |
| RED-002 | ✅ 已解 | test_code2session 升级为 RED-002 sensor(Wave 2 R1)|
| RED-003 | 🟢 D014 P3 | gitignore 已补救,git 历史清理 + 证书轮换暂不(Founder 决策)|
| YELLOW-001 | ✅ 已解 | 方案 Y 实施 + test_orphan_endpoints + test_qwen_client wanxiang sensor 激活(Wave 2 R2+R3-D)|
| YELLOW-004 (TOCTOU) | ✅ 已解 | 全 31 端点 SELECT FOR UPDATE,xfail 保留(mock 限制,reason 已更新)|
| GRAY-006 (U+00A0) | 🟢 P3 | 无 sensor,Stage 2+ 清理 |

---

## TEAM_CHAT 文件状态

| 指标 | 值 |
|------|-----|
| 当前行数 | ~300(Session 3 Wave 1 完成后大量追加) |
| 上次归档 | 从未 |
| 状态 | 🟢 健康 (< 3,000 行) |

---

## Harness 评分

| 维度 | Session 2 | Session 3 Wave 1 | Wave 2 收官 | 目标 | 说明 |
|------|:----:|:----:|:----:|:----:|------|
| Guides(前馈)| 7/10 | 8/10 | **9/10** | 9/10 | + sumai/docs/RED-002 env 迁移指南 772 行 + RED-003 D014 banner + Wave 2 daily-sync |
| Sensors(反馈)| 4/10 | 6/10 | **7/10** | 7/10 | sumai 92 passed(complexity directive 3 sensor 激活,旧 deep 命名 + 旧函数 stub 清理 -28)|
| 计算性控制 | 3/10 | 4/10 | **5/10** | 5/10 | + RED-002 sensor(test_code2session 升级)+ TOCTOU SELECT FOR UPDATE 全 31 端点 + complexity dict sensor |
| 编排设计 | 7/10 | 8/10 | **9/10** | 9/10 | xhteam 三轮 dogfood(Wave 1 4 + Wave 2 R1+R2+R3 共 9 = 13 teammate)0 修复全通过 |

**总分**: Session 2 21/40 → Session 3 Wave 1 26/40 → **Wave 2 收官 30/40**,达到全部目标水位

---

## 待提升项(优先级排序)

1. **P1** - Wave 2 @backend 修 TOCTOU → xfail sensor 转 passed
2. **P1** - RED-002 完成后加凭证硬编码扫描 sensor
3. **P1** - xhteam 第二轮 dogfood(Wave 2)
4. **P2** - file whitelist 越权检测加入 test_architecture.py
5. **P2** - 微信小程序尺寸限制 quality gate(主包 2MB / 总包 20MB)
6. **P3** - 代码重复检测(Markdown 渲染在 4 处重复,GRAY-003)
7. **P3** - U+00A0 扫描 sensor(pages/index/index.js 3038 个,GRAY-006)

---

## 最近变更记录

- **2026-04-28 21:43 D020 收尾 — 4 sensor 全 PASS(@tester + @backend 协同)**:
  - **背景**: D019 v1 真机失败 → PM 地毯审查 4 真相:Pro 实际 deepseek-v3(非 Qwen 3.6 Plus,文档过时);System Prompt B 是 2000+ 字符 schema 锁定无 multi-turn handling;D019 契约 100% 通,LLM 行为受 system + 模型双重限制选"保留 schema + 局部洗名字";不是工程 bug 是 prompt engineering + 模型选型问题。
  - **D020 三件套修复**(Founder 拍板"听你的做"):(A)history 非空时 system 末尾追加 MULTI_TURN_FOOTER 强约束指令;(B)多轮 temperature 0.6 → 0.85(history 非空时调温,初次保持 0.6);(C)Pro 模型 deepseek-v3 → qwen3.6-plus-2026-04-02(免费保持 qwen3.6-flash-2026-04-16)。
  - **新增 4 个 active sensor 追加到 `tests/test_multi_turn_history.py`**(总 ~680 行):
    - `test_d020_multi_turn_footer_constant_exists`: stream.py + stream_en.py 顶部 MULTI_TURN_FOOTER / _EN 常量定义存在;关键短语锁定 — zh `多轮对话特别处理` / `最高优先级` / `禁止用` / `换一个` / `完全不一样`,en `multi-turn special handling` / `highest priority` / `do not use` / `completely different`(防误删/简化)→ ✅ **PASS**
    - `test_d020_multi_turn_temperature_is_increased`: stream.py + stream_en.py MULTI_TURN_TEMPERATURE / _EN 常量值 >= 0.8(D020 拍板 0.85,防回滚到 0.6 单档)→ ✅ **PASS**
    - `test_d020_pro_model_is_qwen_not_deepseek`: stream.py + stream_en.py 不含 `deepseek-v3-250324`,含 `qwen3.6-plus-2026-04-02`(Pro)+ `qwen3.6-flash-2026-04-16`(免费)— 防回归 deepseek-v3 / 漏切 / 漏接 EN 版 → ✅ **PASS**
    - `test_d020_endpoints_apply_footer_when_history_present`: 31 端点(zh 17 + en 14)grep 计数 — MULTI_TURN_FOOTER 引用 >= 18 / MULTI_TURN_TEMPERATURE >= 18 / MULTI_TURN_FOOTER_EN >= 15 / MULTI_TURN_TEMPERATURE_EN >= 15;final_system / system_with_footer / multi_turn_system 变量名 zh >= 17 / en >= 14;final_temperature / multi_turn_temperature / effective_temperature 变量名 zh >= 17 / en >= 14(防漏接端点 / 命名误差)→ ✅ **PASS**
  - **实测 D020 grep 计数(全部远超 sensor 阈值)**:
    - stream.py `MULTI_TURN_FOOTER` = **35** / `MULTI_TURN_TEMPERATURE` = **35**(阈值 18)
    - stream_en.py `MULTI_TURN_FOOTER_EN` = **29** / `MULTI_TURN_TEMPERATURE_EN` = **29**(阈值 15)
    - stream.py `final_system` = **85** / `final_temperature` = **68**(阈值 17)
    - stream_en.py `final_system` = **70** / `final_temperature` = **56**(阈值 14)
    - stream.py `qwen3.6-plus-2026-04-02` = **2** / stream_en.py = **1**
    - stream.py + stream_en.py `deepseek-v3-250324` = **0**(完全清除)
  - **协同时间线**:
    - 21:36 @tester 启动,发现 stream.py + stream_en.py mtime 21:35 刚动,顶部常量已就位但 31 端点未应用
    - 21:38 @tester 追加 4 sensor + 跑回归(2 PASS / 2 FAIL,反映实时进度)
    - 21:42:53 @backend 完成 31 端点应用 + Pro 模型切换 + sumai/CLAUDE.md D020 闭环同步
    - 21:43 @tester 重跑回归 4/4 PASS,确认 D020 sensor 闭环
  - **基线**: xuhua-wx 18/18 passed(持平,零回归) | sumai **97 passed / 0 failed / 96 skipped / 3 xfailed / 2 xpassed = 198 total**(passed +5 vs D019 基线 92,total +5 vs D019 193)
  - **风险提示**: @backend `backend-progress` 三件套时间戳停在 16:21 D019,**未刷新到 D020** — 建议 PM 监督 @backend 完成 D020 三件套刷新
  - **预期效果(待真机验证)**: D020 上线后真机多轮"完全不一样"指令应得到与上轮 80%+ 不同的输出(footer 强约束 + 调温 + Qwen 3.6 Plus 多轮 instruction following 改善)。建议 Founder/PM 触发真机回归 5 关键流程 + 1 多轮"完全不一样"测试。

- **2026-04-28 D019 真·多轮对话 messages history(@tester)**:
  - **删除 `tests/test_context_injection.py`**(D018a/b 整套 system prompt 注入测试,5 active + 1 skip):D018a/b 用 system prompt 注入 context_prompt + refine_instruction 让 LLM "继续优化",Founder 真机反馈仍然复述不改写 — 真因是非真·多轮对话,LLM 缺乏"前一轮我说过什么、用户的反馈"的真实上下文。D019 改用 messages history extend(真·多轮对话)替代,旧测试整套淘汰。
  - **新建 `tests/test_multi_turn_history.py`**(~370 行,4 test:3 active + 1 skip stub):
    - Test 1 active 静态扫描:`DEFAULT_REFINE_FALLBACK = "请基于以上输出做明显改进"` 常量(强约束措辞防退回 D018a 建议性) + `HISTORY_CHAR_BUDGET = 6000` 常量 + `def resolve_history(data):` 签名 + `data.get('history')` + `json.loads`/`except` + `'user'`/`'assistant'` 白名单 + `5000` + `HISTORY_CHAR_BUDGET` 引用
    - Test 2 active 静态扫描:stream.py 17 + stream_en.py 14 = 31 端点全部 grep `resolve_history(data)` 调用 + `conversation_history.extend(history)` 追加(实际 28+ 处命中)
    - Test 3 active 隔离 exec:从 stream.py 抽取 resolve_history 函数体 + 注入 DEFAULT_REFINE_FALLBACK/HISTORY_CHAR_BUDGET/json/re 到 namespace,验证 None/空/非法 JSON fallback []/role=system 白名单过滤 []/合法 user message 保留/单 msg 5000 截断 ≤5050/总长度 6000 裁剪
    - Test 4 skip stub:端点级集成测试(Flask client + LLM mock 抓 messages list,完整 TODO 断言已写,uncomment 即激活)
  - **README.md 同步**:`test_context_injection.py` 行替换为 `test_multi_turn_history.py`;Stage 2 章节标题从 D018a 改为 D019;D017 后下架清单追加 `test_context_injection.py` 历史档案
  - **基线**: xuhua-wx 18 passed(持平) | sumai 92 passed / 96 skipped / 3 xfailed / 2 xpassed(passed 持平 D018a 基线 92,total/skipped 持平 — 删 5 active + 1 skip,加 3 active + 1 skip)
  - **协调**: @backend 已实施 stream.py 顶部 DEFAULT_REFINE_FALLBACK + HISTORY_CHAR_BUDGET + def resolve_history(含 D019 print 日志 `[D019][resolve_history]` 前缀);28+ 处 grep 命中 (resolve_history + extend)。EN 端点共享 stream.py 的函数(import 复用)。Test 3 隔离 exec 跑通验证 resolve_history 行为符合白名单 + 截断设计。

- **2026-04-28 D017 三档下架 + D018a Stage 2 上下文注入(@tester Phase 1+2 合并)**:
  - **Phase 1(D017)**:
    - 删除 `tests/test_complexity.py`(R3-D 创建的 3 个 active 测试,因 @backend 已删 stream.py 顶部 COMPLEXITY_DIRECTIVES dict + resolve_complexity 函数,sensor 凋零)
    - 残留扫描 0 行(README.md 旧条目已清理为 D017 后下架记录 + Stage 2 章节)
    - test_sse_is_pro_branch.py 中 `test_is_pro_determines_system_prompt_complexity` 保留(此处 "complexity" 指 max_tokens 精细度,与 D016/D017 三档无关)
  - **Phase 2(D018a Stage 2 C 方案上下文注入)**:
    - 新建 `tests/test_context_injection.py`(~250 行,4 test:3 active + 1 skip stub)
    - Test 1 模板常量存在(zh `CONTEXT_INJECTION_TEMPLATE` + en `CONTEXT_INJECTION_TEMPLATE_EN`,含【上下文】/[Context] + 继续优化/refine + {previous_output} 占位符)
    - Test 2 `def resolve_context(data):` 签名 + `data.get('context_prompt')` 字段读取 + 5000 字符截断保护
    - Test 3 隔离 exec 加载 resolve_context(避免 import stream.py 顶部 anthropic + os.environ 崩溃),验证 None/空串/6000 截断/边界 5000
    - Test 4 端点级注入集成测试(skip stub,等 Flask client + LLM mock 真实化,断言代码已写完整 TODO)
  - **基线**: xuhua-wx 18 passed(持平) | sumai 92 passed / 96 skipped / 3 xfailed / 2 xpassed(passed 持平 R3-D 基线 92,skipped +1 因新 stub)
  - **协调**: @backend stream.py + stream_en.py 顶部 CONTEXT_INJECTION_TEMPLATE + resolve_context 已实施,grep 命中 12+ 端点 generate() 注入,覆盖完整

- **2026-04-25 Session 3 Wave 2 Round 3 D(@tester R3-D 收尾)**:
  - 删除 `tests/test_sse_complexity_routing.py`(D016 后 deep 命名废弃,新 test_complexity.py 已替代)
  - 删除 `tests/test_validate_request_and_user.py`(11 stub 全死代码,旧函数 W2 R3-B 已删除)
  - 激活 `tests/test_complexity.py` 3 个 test(取消 skip + 重写为针对 COMPLEXITY_DIRECTIVES dict 的静态断言),3/3 PASS
  - W2-2 fallout 4 个测试更新:
    - `test_endpoints_exist::test_sse_video_endpoints_exist` 替换 /hunyuanStream → /wanxiangStream
    - `test_sse_stream_structure::test_all_sse_endpoints_accept_both_methods` 同上
    - `test_qwen_client::test_hunyuan_stream_uses_qwen` 重命名 + 改扫 `def wanxiangStream`
    - `test_orphan_endpoints::test_wanxiang_stream_is_absent` 移除 xfail strict=True,重命名为 `test_wanxiang_stream_is_present`,正向断言端点存在
  - TOCTOU sensor xfail 保留,reason 更新为"全 31 端点 SELECT FOR UPDATE 已就位 R3-B,mock 不能模拟行锁,集成测试待 R4+"
  - test_rate_limiting 文件头 docstring 更新,警告"本地全 skip,生产 venv 激活前需重写为新 API mock"
  - 基线: xuhua-wx 18 passed(持平) | sumai 92 passed / 95 skipped / 3 xfailed / 2 xpassed(passed +1, skipped -17 vs Wave 2 R1 基线)

- **2026-04-24 Session 3 Wave 2 Round 2**:
  - @backend 新增 `validate_and_deduct` + `save_prompt_record`(stream.py L1764/L1905),SELECT FOR UPDATE + 同事务,**消除 TOCTOU 基础**(3 端点先行切换,Round 3 扩展全部)
  - @backend 方案 Y 实施:/wanxiangStream + /wanxiangStreamEN 新建,/hunyuanStream + /hunyuanStreamEN 删除下架
  - @frontend 前端 hunyuan 残留清除(pages/index/index.js 6 处 + wxml 1 处 + cdn.js 1 处)
  - @devops RED-002 env 迁移指南扩至 772 行(27 变量 + 12 步部署 checklist + D016 说明)
  - D016 complexity 命名裁决 → `quick/standard/professional`
  - 测试基线保持 91 passed(sumai)/ 18/18(xuhua-wx),零回归

- **2026-04-24 Session 3 Wave 2 Round 1**: 
  - @tester 基线测试:xuhua-wx 18/18 passed ✅ / sumai **91 passed 115 skipped 3 xfailed 2 xpassed** ✅(基线**提升**: +2 passed,因 @backend W2-1 同步升级了 test_code2session RED-002 sensor)
  - test_complexity.py 3 skip stub 已就位(Round 3 激活,等 @backend W2-4 实施三档 system prompt)
  - test_rate_limiting.py TOCTOU xfail sensor 注释加 Round 2 激活路线
  - 发现 complexity 三档命名冲突(quick/standard/professional vs quick/deep/professional),已上报 PM 裁决

- **2026-04-24 Session 3 Wave 1**: 
  - 4 个 teammate 并行产出全通过审查
  - sumai test 套扩至 205(新增 test_rate_limiting 6 + 4 stub 文件)
  - TOCTOU xfail sensor 就位
  - test_qwen_model_name sensor 激活(模型名合规)
  - Harness 评分从 21/40 → 26/40

- **2026-04-24 Session 2**: 
  - sumai 185 test 骨架建立
  - sumai/CLAUDE.md 592 行编写完成
  - sumai-deep-dive 报告归档

- **2026-04-24 Day 1**: Phase 1-4 PORTING 完成
  - Phase 1 基础骨架(.team-brain/ / .claude/agents/ 21 progress / settings.json / tests 三件套 / HARNESS_HEALTH.md 自身)
  - Phase 2 核心内容(CLAUDE.md + 7 角色 md + 3 专属 skills)
  - Phase 3 Sensor 覆盖基础架构规则(15 条 test)
  - Phase 4 收尾 18/18 PASS
