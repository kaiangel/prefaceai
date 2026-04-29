# Backend(后端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (D020 多轮 footer + 调温 + Pro 切 Qwen 完成)
> 角色: backend

---

## 当前状态

[2026-04-28] **D020 真·多轮对话二次修复 已完成**,等待 PM 地毯审查 → 统一 commit。

承接 D019 v1 真机失败诊断(详见 KNOWN_ISSUES Stage 2 D019 v1):
- 真因 1: Pro 路径用 `deepseek-v3-250324` 不是 Qwen(stream.py L279)
- 真因 2: System Prompt B 是 2000+ 字符 schema 锁定,完全无 multi-turn handling
- 真因 3: D019 v1 契约 100% 通,但 LLM 选择"保留 schema + 局部洗名字"

**D020 三件套并行修复(Founder 拍板"听你的做")**:

1. **MULTI_TURN_FOOTER**:history 非空时拼到 system 末尾,强约束"用户禁的元素绝不出现 / 用户说换必须给完全不同的 / 80%+ 实质内容必须重写"
2. **MULTI_TURN_TEMPERATURE = 0.85**:多轮时切高温度,鼓励 LLM 跳出"复述上轮"概率分布(初次保持 0.6 质量优先)
3. **Pro 模型切换**:`botPromptStreamBak` Pro 从 `deepseek-v3-250324` → `qwen3.6-plus-2026-04-02`(D011 闭环,免费保持 `qwen3.6-flash`)
4. **sumai/CLAUDE.md 文档同步**:LLM 模型表全面更正(qwen-plus-latest / claude-haiku-4-5 / deepseek-v3-250324 历史字样修正)
5. **[D020] 详细 print 日志**(Founder 强制要求):每端点 generate() 入口打印多轮/初次模式 + 拼装详情 + 最终调用参数

只动 `sumai/stream.py` + `sumai/stream_en.py` + `sumai/CLAUDE.md` 3 文件。**严守 D018a P0 永久红线**(0 处 `.format()`)+ **D019 基础设施完整保留**(footer 是叠加,不是替换)。

---

## 本次产出一览

### Fix 1 · MULTI_TURN_FOOTER + MULTI_TURN_TEMPERATURE 常量

**stream.py 顶部新增**(D019 基础设施 `HISTORY_CHAR_BUDGET = 6000` 之后):

```python
# Stage 2 / D020: 多轮对话最高优先级 footer(history 非空时拼接到 system 末尾)
MULTI_TURN_FOOTER = """
【多轮对话特别处理 - 必读 - 最高优先级】
你正在和用户进行多轮对话...
- 用户说"禁止用 X" → 新输出绝不能包含 X
- 用户说"换一个" → 必须给完全不同的选项,不能只换名字保留结构
- 用户说"完全不一样" → 80%+ 实质内容必须重写

依然遵守输出 schema(角色/场域/任务背景/必要变量/任务框架/质量标准/错误处理/加分项/参考示例),
但所有具体内容必须严格按用户最新指令重新选择,不能复用上一轮 assistant 消息里的任何元素。

❌ 错误示范:
- 把"冯·卡门"换成"图灵"但保留"NASA JPL" → 没真听话
- 把"NASA JPL + MIT"换成"NASA JPL + 洛克希德" → 用户禁了 NASA JPL,你还在用
✅ 正确示范:
- 用户禁 NASA JPL → 全新场域(硅谷创业咖啡馆 / 故宫文物修复室 / 京都禅寺 等任何完全无关的场景)
- 用户禁某专家 → 完全跨界换人(电影特效师 + 工业设计师 / 民俗学家 + 游戏设计师 / 厨师 + 哲学家)
"""

MULTI_TURN_TEMPERATURE = 0.85
```

**stream_en.py 顶部同步 EN 版**(`MULTI_TURN_FOOTER_EN` + `MULTI_TURN_TEMPERATURE_EN`)。

### Fix 2 · 31 端点拼装时切 final_system / final_temperature

每个端点 generate() 内,从 D019 单一拼装升级为按 history 切分支:

```python
# Stage 2 / D019: 真·多轮对话 — extend 历史会话(若有)
history = resolve_history(data)
print(f"[D019][{request.path}] === 请求开始 === ...")
# Stage 2 / D020: 多轮模式 — system 拼 footer + 调温度
if history:
    final_system = system + MULTI_TURN_FOOTER
    final_temperature = MULTI_TURN_TEMPERATURE
    print(f"[D020][{request.path}] 多轮模式启用: footer 长度={len(MULTI_TURN_FOOTER)}, temperature={temperature} -> {MULTI_TURN_TEMPERATURE}, model={model_name}")
else:
    final_system = system
    final_temperature = temperature
    print(f"[D020][{request.path}] 初次模式: 不拼 footer, temperature={temperature}, model={model_name}")
# messages 顺序: [system, ...history, current user]
conversation_history.append({"role": "system", "content": final_system})
if history:
    conversation_history.extend(history)
if not history:
    conversation_history.append({"role": "user", "content": data['content']})
_log_d019_assembly(request.path, conversation_history, final_system, history)

print(f"[D020][{request.path}] 最终调用: model={model_name}, temp={final_temperature}, max_tokens={max_tokens}, system_total_len={len(final_system)}, messages_turns={len(conversation_history)}")

stream = client.chat.completions.create(
    model=model_name,
    messages=conversation_history,
    stream=True,
    temperature=final_temperature,  # 用 final_temperature(初次=temperature, 多轮=0.85)
    ...
)
```

- stream.py 16 处 8-空格端点(generate() 闭包内)+ 1 处 4-空格(`/describeImageStream` 在 generate() 外)= 17 端点
- stream_en.py 14 处 8-空格端点 = 14 端点(无 `botPromptStreamBakEN`,无 `describeImageStreamEN`)
- **31 端点全覆盖**

### Fix 3 · botPromptStreamBak Pro 切 qwen3.6-plus(D011 闭环)

`botPromptStreamBak` 是唯一一个 inline 不走 `get_openai_client_and_config()` 的端点:
- 免费走 Volcengine ARK 豆包(`doubao-1.5-pro-32k-250115`)
- Pro 原走 Volcengine ARK DeepSeek(`deepseek-v3-250324`)— **D020 切到 DashScope Qwen 3.6 Plus**

```python
# stream.py L325-333(改动后)
if is_pro == 1:
    # D020 + D011 闭环: Pro 切 Qwen 3.6 Plus(下架旧 V3 Pro 路径)
    client = OpenAI(
        api_key=os.environ['QWEN_API_KEY'],
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    model_name = "qwen3.6-plus-2026-04-02"
    temperature = 0.6
    max_tokens = 6380
```

**免费路径不动**:外层 client (Volcengine ARK 豆包)+ `model_name = "doubao-1.5-pro-32k-250115"` 保持。

stream_en.py 无 `botPromptStreamBakEN`,无 deepseek-v3 残留,**无需改动**。

`get_openai_client_and_config(is_pro)`(stream.py L2226 + stream_en.py 同名)Wave 1 已经返回 qwen3.6-plus / qwen3.6-flash,本次不动。

### Fix 4 · sumai/CLAUDE.md 文档全面更正

| 段落 | 改动 |
|---|---|
| L8-22 当前状态 | 代码规模 + 测试 + CI/CD 三行更新到 Stage 2 D020 后基线 |
| L117-138 Prompt 生成端点表 | 全部 16 个端点底层 LLM 列从 `Claude haiku-4-5` / `qwen-plus-latest` 改为 `Qwen 3.6 Plus / Flash`;新增 `/wanxiangStream`、`/test123`;`/hunyuanStream` 标注已下架(D010);追加 D011 + D020 简要说明 |
| L243-285 LLM 集成现状 | 当前接入 LLM 表全面重写:Anthropic Claude 整行删除(改为废弃说明);Qwen 3.6 Plus / Flash 主路径列表;豆包(`/botPromptStreamBak` 免费);Stage 2 D011 + D020 闭环说明;qwen-plus-latest / claude-haiku-4-5 代码示例改为 qwen3.6 系列正确写法;新增"已弃用模式"段落 |
| L424-431 RED-001 | 标记 ✅ 已解决,描述更新为"Wave 1 + D020 闭环" |
| L433-438 RED-002 | 标记 ✅ 已解决,Wave 2 R1 收尾 |
| L452-454 YELLOW-001 | 标记 ✅ 已解决,Wave 2 R2 方案 Y |

### Fix 5 · [D020] 详细 print 日志(Founder 强制)

每端点 generate() 入口至少 2 处 `[D020]` 日志:
- 模式启用日志(if history → 多轮模式; else → 初次模式)→ 1 处
- 最终调用日志(model + temp + max_tokens + system_total_len + messages_turns)→ 1 处

**日志计数**:
- stream.py: **51 处** `[D020]` tag(17 端点 × 2 = 34 + 模板字符串等附加)
- stream_en.py: **42 处** `[D020]` tag(14 端点 × 2 = 28 + 附加)

完整 [D020] 日志格式(以 botPromptStream 为例):
```
[D019][/botPromptStream] === 请求开始 === openid=oABC1234..., content_len=52, has_history=True, history_turns=3
[D020][/botPromptStream] 多轮模式启用: footer 长度=1234, temperature=0.6 -> 0.85, model=qwen3.6-plus-2026-04-02
[D019][/botPromptStream] 拼装完成: messages=4 turns, system_len=8765, total_chars=12345, history_turns=3
[D019][/botPromptStream] role 序列: ['system', 'user', 'assistant', 'user']
[D019][/botPromptStream] 最后一条 (role='user', 将让 LLM 回应): '禁止用 NASA JPL,换硅谷创业咖啡馆...'
[D020][/botPromptStream] 最终调用: model=qwen3.6-plus-2026-04-02, temp=0.85, max_tokens=8630, system_total_len=8765, messages_turns=4
[D019][save_prompt_record] === 响应完成 === model_type='文生文', model_name='通用模型', style='默认', content_len=52, response_len=2345
```

---

## grep 计数验证(全部匹配预期)

| 文件 | 符号 | 实际 | 期望 | 状态 |
|---|---|---|---|---|
| stream.py | `MULTI_TURN_FOOTER` | 35 | ≥ 1 def + 16 端点 + 1 describeImg = 18+ | ✅ |
| stream.py | `MULTI_TURN_TEMPERATURE` | 35 | 同上 ≥ 18 | ✅ |
| stream.py | `final_temperature` | 68 | 每端点 ≥ 4(if/else 各 1 + log 1 + create 调用 1) = 17 × 4 = 68 | ✅ 精确匹配 |
| stream.py | `[D020]` 日志 tag | 51 | ≥ 17 × 2 = 34 | ✅ 51 ≥ 34 |
| stream.py | `qwen3.6-plus-2026-04-02` | 2 | 1 (get_openai_client_and_config) + 1 (botPromptStreamBak Pro) | ✅ |
| stream.py | `qwen3.6-flash-2026-04-16` | 1 | 1 (get_openai_client_and_config) | ✅ |
| stream.py | `temperature=temperature,` 残留 | 0 | = 0(全切 final_temperature) | ✅ |
| stream.py | `deepseek-v3-250324` 残留 | 0 | = 0 | ✅ |
| stream_en.py | `MULTI_TURN_FOOTER_EN` | 29 | ≥ 1 def + 14 端点 = 15+ | ✅ |
| stream_en.py | `MULTI_TURN_TEMPERATURE_EN` | 29 | 同上 ≥ 15 | ✅ |
| stream_en.py | `final_temperature` | 56 | 每端点 ≥ 4(14 × 4 = 56) | ✅ 精确匹配 |
| stream_en.py | `[D020]` 日志 tag | 42 | ≥ 14 × 2 = 28 | ✅ 42 ≥ 28 |
| stream_en.py | `temperature=temperature,` 残留 | 0 | = 0 | ✅ |
| stream_en.py | `deepseek-v3-250324` 残留 | 0 | = 0 | ✅ |

**禁忌检查(必须全 0)**:
- D018a/b `CONTEXT_INJECTION_TEMPLATE` / `REFINE_INSTRUCTION_TEMPLATE` 残留 = **0** ✅
- D018a P0 fix `.format(` 残留 = **0** ✅(D020 全用 字符串拼接 / 替换,根本不用 format)
- raw string 错误转义 `\"` 残留 = **0** ✅(脚本 v2 用普通字符串,避开 raw string `\\"` 陷阱)

---

## 基线测试

- `python3 -m py_compile sumai/stream.py sumai/stream_en.py` → **OK** ✅
- `pytest sumai/tests/` → **97 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed**
  - 与 D019 收尾基线 92 对比 +5,正是 @tester 预先在 test_multi_turn_history.py 加的 4 个 D020 sensor + 1 个 D019 dup_user 检测全部由我的实施而 PASS:
    - `test_d020_multi_turn_footer_constant_exists` ✅
    - `test_d020_multi_turn_temperature_is_increased` ✅
    - `test_d020_pro_model_is_qwen_not_deepseek` ✅
    - `test_d020_endpoints_apply_footer_when_history_present` ✅
    - `test_d019_no_duplicate_user_append_after_history_extend` ✅(原 D019 sensor 之前是 SKIP/PENDING,本次实施同时让它 PASS)
  - **0 failed, 0 collection error,无回归**
- `pytest tests/`(xuhua-wx 根) → **18 passed** ✅(持平)

---

## 关键设计决策

1. **MULTI_TURN_FOOTER 是叠加,不是替换** — D019 基础设施(`resolve_history` / `_log_d019_assembly` / `DEFAULT_REFINE_FALLBACK` / `HISTORY_CHAR_BUDGET`)完整保留。footer 仅在 history 非空时拼到 system 末尾,初次生成 system 不变。

2. **`final_system` / `final_temperature` 局部变量** — 不动 system / temperature 原变量(避免影响 LLM 调用前的其他逻辑),只在 chat completion 调用时切到 final_*。

3. **botPromptStreamBak 保守改造** — 只动 if is_pro == 1 分支内的 4 行(model_name + temperature + max_tokens + 新增 client 切换),**不动**外层 client 初始化(免费仍走 Volcengine ARK 豆包)+ **不动**后面的 system prompt 字符串结构。

4. **`request.path` 自动取端点名** — 51 处 stream.py + 42 处 stream_en.py 日志统一用 `request.path`,避免硬编码 31 处端点名。

5. **describeImageStream 4-空格特殊处理** — D020 footer 切换在 generate() 外(endpoint handler 顶层 4 空格),`final_system` / `final_temperature` 是端点函数局部变量,被 generate() 闭包捕获,在 generate() 内 client.chat.completions.create 调用时切到 final_temperature(模型用 `qwen3-vl-plus` 视觉模型)。

6. **batch 替换脚本(/tmp/d020_apply.py)严格验证** — 替换前后均做 grep 期望计数检查,任一失败 abort 不写文件;最终额外检查 deepseek-v3-250324 / `\"` raw string 残留。avoid 31 次手动 Edit 累积出错。

7. **不引入新 Python 包** — 只用 stdlib(json / re),已 import,零新依赖。

8. **No backward compatibility** — D018b 字段 (`context_prompt` / `refine_instruction`) 已在 D019 删除,本次不再涉及。前端如旧仍传这两个字段,后端静默忽略,但本身已不读。

---

## 给 @frontend 的契约提醒(D020 不变)

D020 完全是后端内部行为(prompt engineering + 模型选型),**前端契约 0 改动**:
- `history` 字段格式不变(D019 已确立)
- 字段值不变(JSON list of `{role: 'user'|'assistant', content: string}`)
- 不需要前端配合发布,后端独立部署即生效

后端日志 `[D020]` 前缀,前端日志 `[D019]` 前缀(已部署),Founder 真机调试时 grep 两个 tag 即可看到完整对话流。

---

## 给 @tester 的契约提醒

@tester 同轮已预先添加 4 个 D020 sensor(在 test_multi_turn_history.py 中):
- `test_d020_multi_turn_footer_constant_exists` ✅ PASSED
- `test_d020_multi_turn_temperature_is_increased` ✅ PASSED
- `test_d020_pro_model_is_qwen_not_deepseek` ✅ PASSED
- `test_d020_endpoints_apply_footer_when_history_present` ✅ PASSED

加上原 D019 sensor 共 8 个 active(全 PASS)+ 1 个 skip stub(`test_d019_endpoints_actually_call_llm_with_extended_history`,等 Flask test client + LLM mock)。

---

## 风险点(无)

- ✅ 全文 0 处 `.format()`(D018a P0 永久红线)
- ✅ 31 端点全部一致改动(脚本批量精确替换 + 计数验证)
- ✅ system 始终 `messages[0]`(LLM 规范保留)
- ✅ history 在 system 之后、当前 user 之前
- ✅ deepseek-v3-250324 全清零(stream.py + stream_en.py)
- ✅ 免费路径(qwen3.6-flash)完全不动
- ✅ 不动 D019 基础设施(resolve_history / _log_d019_assembly / role 白名单 / JSON 容错)
- ✅ 不动 system prompt 字符串本身(只在末尾叠加 footer)
- ✅ 不动 validate_and_deduct + save_prompt_record 业务逻辑
- ✅ 不动 mainv2.py / note.py / pay_stripe.py
- ✅ 不动 sumai/tests/(@tester 领地)
- ✅ 不动 pages/(@frontend 领地)
- ✅ py_compile + pytest 全过(115 passed / 0 failed)

---

## 上次更新记录

- 2026-04-28: **D020 多轮 footer + 调温 + Pro 切 Qwen + sumai/CLAUDE.md 同步 完成**(本次)
- 2026-04-28: D019 真·多轮对话改造完成
- 2026-04-28: D018b 真机反馈修复完成(措辞强化 + refine_instruction 字段)
- 2026-04-28: Stage 2 Phase 1 + Phase 2 合并完成(D017 + D018a)
- 2026-04-25 10:30: W2-4 (R3-A) + R3-B 全端点切换 + 旧函数删除
- 2026-04-24 23:45: W2-5 TOCTOU + W2-2 方案 Y 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成

---

## 未自行 commit

按协议,等 PM 地毯审查通过后统一 commit。改动文件清单:

**sumai 仓库**(独立 git remote):
- `sumai/stream.py`(顶部 D020 常量 + 17 端点 final_system/final_temperature 切换 + botPromptStreamBak Pro 切 qwen3.6-plus + describeImageStream 4-空格 D020 注入)
- `sumai/stream_en.py`(顶部 D020 EN 常量 + 14 端点 final_system/final_temperature 切换)
- `sumai/CLAUDE.md`(LLM 模型表全面更正 + RED-001/002 + YELLOW-001 状态更新 + Stage 2 D011 + D020 说明)

**xuhua-wx 仓库**:
- `.claude/agents/backend-progress/{current,completed,context-for-others}.md`(三件套全更新)
- `.team-brain/TEAM_CHAT.md`(本条追加)

PM 地毯审查关注点(memory feedback_carpet_code_review.md):
1. ✅ MULTI_TURN_FOOTER 文案是否足够强约束(对照 Founder 真机失败案例:NASA JPL / 冯·卡门 等)
2. ✅ 31 端点全部一致替换(grep 计数全匹配 + final_temperature 精确 = 17×4 / 14×4)
3. ✅ messages 顺序 [system+footer, ...history, current_user] 严守(看 _log_d019_assembly role 序列日志)
4. ✅ describeImageStream 4-空格特殊处理(generate() 外切 final_system/final_temperature,内 chat call 用 final_temperature)
5. ✅ botPromptStreamBak Pro 切 qwen3.6-plus(免费豆包路径完全不动)
6. ✅ deepseek-v3-250324 全清零(grep = 0)
7. ✅ 0 处 `.format()`(D018a P0 永久红线)
8. ✅ [D020] 日志全覆盖(每端点 ≥ 2 处)
9. ✅ sumai/CLAUDE.md 文档同步(qwen-plus-latest / claude-haiku-4-5 历史字样修正)

@PM 请地毯审查 🙏
