# Backend(后端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (D020 多轮 footer + 调温 + Pro 切 Qwen)
> 角色: backend

---

## 当前状态速览

[2026-04-28] **D020 真·多轮对话二次修复 完成**(承接 D019 v1 真机失败诊断):

- ✨ 新增 `MULTI_TURN_FOOTER` + `MULTI_TURN_TEMPERATURE = 0.85`(zh/en 各一份),history 非空时拼到 system 末尾,强约束 LLM 严格按用户最新指令重做
- ✨ 31 端点 generate() 内拼装时按 history 切 `final_system` / `final_temperature`,初次模式完全不变(向后兼容)
- ✨ `botPromptStreamBak` Pro 路径切换 `deepseek-v3-250324` → `qwen3.6-plus-2026-04-02`(D011 闭环,免费保持 `qwen3.6-flash` + 豆包路径不动)
- ✨ `sumai/CLAUDE.md` LLM 模型表全面修正(qwen-plus-latest / claude-haiku-4-5 / deepseek-v3 历史字样修正,D011 + D020 简要说明)
- ✨ [D020] 详细 print 日志(每端点 ≥ 2 处,Founder 强制要求,stream.py 51 处 + stream_en.py 42 处)
- ✅ 全文 0 处 `.format()`(D018a P0 永久红线)
- ✅ deepseek-v3-250324 全清零
- ✅ 不动 D019 基础设施(`resolve_history` / `_log_d019_assembly` / role 白名单 / JSON 容错完整保留)
- ✅ py_compile + pytest 97 passed(基线 92 + @tester 预先添加的 4 个 D020 sensor + 1 dup_user sensor 全 PASS,无回归)

### D019 状态(本次保留 + 叠加 footer)

- ✅ D019 真·多轮对话基础设施 100% 保留(messages 顺序 `[system+footer, ...history, current_user]`)
- ✅ D018a/b 整套已在 D019 时清除(本次未涉及)
- ✅ history JSON 解析 / role 白名单 / 三层截断 全保留

---

## API 契约变更清单(本次 D019,**重要 — 前端契约破坏式变更**)

### 🆕 新增字段: `history`

| 字段 | 类型 | 取值 | 透传位置 | 后端 fallback |
|---|---|---|---|---|
| `history` | string(JSON) 或 list | 完整对话历史 `[{role, content}]`,role ∈ {user, assistant} | SSE GET query 或 POST form/body,与 `openid` / `content` 同级 | 未传 / 空 / 非法 JSON / 全 system role → 走初次生成路径(等同 Stage 1) |

**端点覆盖**: 全部 31 个 SSE 端点(stream.py 17 + stream_en.py 14)。

### ❌ 废弃字段: `context_prompt` + `refine_instruction`

| 字段 | 旧(D018b) | 新(D019) |
|---|---|---|
| `context_prompt` | 上一轮 LLM 输出 | **后端不再读**,前端继续传也会被静默忽略 |
| `refine_instruction` | 用户继续优化要求 | **后端不再读**,前端继续传也会被静默忽略 |

**前端实施提示**(@frontend 同轮 spawn 处理):

```javascript
// pages/index/index.js 推荐 conversationHistory 数组管理
data: {
  conversationHistory: [],  // 维护完整对话历史 [{role, content}, ...]
  refinementRound: 0,
  MAX_REFINEMENT_ROUNDS: 2,  // 起步剩 2,初次生成 +1 = 共 3 次
}

generateContent() {
  const body = {
    openid: app.globalData.openid,
    content: this.data.userInput,
    style: this.data.selectedStyle || '',
    // 🆕 D019: 只在继续优化时传 history
    history: this.data.refinementRound > 0
      ? JSON.stringify(this.data.conversationHistory)
      : '',
    // ❌ context_prompt / refine_instruction 已废弃,不要传
  };
  // ...
}

onConfirmRefine() {
  // 用户输入指令(可空,空时用 DEFAULT_REFINE_FALLBACK)
  const instruction = this.data.refineInstructionInput || '请基于以上输出做明显改进';
  // append 上一轮 assistant + 当前 user 指令
  this.setData({
    conversationHistory: [
      ...this.data.conversationHistory,
      {role: 'assistant', content: this.data.lastOutput},
      {role: 'user', content: instruction},
    ],
    refinementRound: this.data.refinementRound + 1,
  });
  this.generateContent();  // 触发新一轮 SSE
}
```

### history 字段格式示例

第 1 轮(初次生成):
```
history = ''  // 或不传
content = "我要做个 3D 飞机引擎"
```

第 2 轮(继续优化):
```json
history = JSON.stringify([
  {"role": "user", "content": "我要做个 3D 飞机引擎"},
  {"role": "assistant", "content": "你是冯·卡门 ... (上一轮 LLM 输出 C)"},
  {"role": "user", "content": "更换场域和角色,改为侯孝贤的家庭场景"}
])
content = "更换场域和角色,改为侯孝贤的家庭场景"  // 与 history 最后一条 user 同步
```

注意:**当前 user(=content)是 history 最后一条 user 的副本**(后端会两个都收到,
后端把 history extend 后再 append content,所以 LLM 看到的 messages 最后是 content)。
前端可选择:把当前 user 也放在 history 最后,后端 extend 后会出现"两条相同 user"
(LLM 会忽略其中一条),或者 history 不包含当前 user(后端 extend 完恰好接 content)。
**推荐后者**(history 不含当前 user,只含历史对话,content 是当前 user)。

### 后端行为矩阵

| `history` 字段 | content | 后端 messages 拼装 |
|---|---|---|
| 不传 / 空 / 全空白 | "abc" | `[system, user("abc")]` (初次生成) |
| `[{user:A, assistant:B}]` | "C" | `[system, user(A), assistant(B), user(C)]` (真多轮) |
| 含 `role:system` | "C" | system role 被白名单过滤,等同上面 (拒绝注入) |
| 非法 JSON 字符串 | "C" | `[system, user("C")]` (降级到初次生成,不报错) |
| 总长度 > 6000 字符 | "C" | 从最早 turn 开始裁剪,最终 `[system, ...裁剪后 history, user("C")]` |
| 单 message > 5000 字符 | "C" | 该 message 截断到 5000 + "...(已截断)" 后缀 |

### 防御截断三层

- 单 message content > 5000 字符 → 截断 + "...(已截断)" / "...(truncated)" 后缀
- history 总字符数 > HISTORY_CHAR_BUDGET (6000) → 从最早 turn 开始裁剪
- Qwen 3.6 Plus max_tokens=8630 → 留 ~2500 字符给 system + 当前 user

**后端不感知轮次**: 只看 `history` 字段是否非空。轮次上限(D019: 起步剩 2 次,共 3 次)由前端
counter 强制。后端 messages 最长 = 1 system + 5 history + 1 current = **7 turns**。

### 跨语言端点

英文版端点(`*StreamEN`)同理透传 `history`,后端用同一个 `resolve_history()` 函数(纯 Python
逻辑无中英区别);只有 `_log_d019_assembly` helper 的日志内容是英文。

---

## 给 @frontend 的契约(D019 实施提示)

### 状态机重构建议

```
初始态:        conversationHistory=[], refinementRound=0
  ↓ 初次生成 onGeneratePrompt
生成中:        SSE 流式接收
  ↓ SSE 完成
有结果态:      lastOutput=完整 LLM 输出 C
  ↓ 用户点「✨ 基于此继续优化(剩 N 次)」
展开输入框:    showRefineInput=true
  ↓ 用户写指令(或跳过) + 点「✓ 确认优化」
触发态:        把 [{user:A, assistant:C, user:R}] 塞进 conversationHistory,
              refinementRound +1, 触发 onGeneratePrompt
  ↓ generateContent() 自动带 history JSON
新一轮 SSE:    后端真多轮,LLM 看到完整对话基于具体反馈生成
```

### 重置点

`onInputChange`(用户改主输入)→ 视为新主题 → reset:
- `conversationHistory: []`
- `refinementRound: 0`
- `showRefineInput: false`
- `refineInstructionInput: ''`

### Token 增长说明(给 Founder 解释)

每轮 history 增加 1 user + 1 assistant ≈ 2-4KB(Qwen 输出 1-2KB/轮)。
3 轮上限内总 history ≤ 6KB,加 system prompt(2-4KB)+ 当前 user(<1KB)≈ 总 10KB,
Qwen 3.6 Plus max_tokens=8630 token ≈ 25KB 字符,**安全余量充足**。

---

## 给 @tester 的回归点

### 任务关系

@tester 同轮已完成:
- 删除 `tests/test_context_injection.py`(D018a/b sensor 已废弃)
- 新建 `tests/test_multi_turn_history.py`(4 sensor)
  - `test_d019_constants_and_function_exist` ✅ PASS
  - `test_d019_endpoints_extend_history_into_messages` ✅ PASS
  - `test_d019_role_whitelist_blocks_system_injection` ✅ PASS
  - `test_d019_endpoints_actually_call_llm_with_extended_history` ⏸️ SKIP(等 Flask client mock)

### 全量回归基线

`pytest sumai/tests/` 应得 **92 passed / 96 skipped / 3 xfailed / 2 xpassed / 0 failed**
(D018b 收尾 94 - 5 删 + 3 加 = 92,符合预期)。
`pytest tests/`(xuhua-wx 根)应得 **18 passed**(持平)。

任何**新增**的失败都是回归 — 立即报警。

### 真机回归建议(给 Founder)

1. 主流程:输入主题"3D 飞机引擎"→ 生成 → 复制不报错
2. 继续优化(关键回归点!):
   - 点「✨ 基于此继续优化(剩 2 次)」→ 输入"换为侯孝贤家庭场景" → 确认
   - **真机验证**:LLM 输出 E **应该**真的换了场景和角色,不再像 D018b 那样复述 C
3. 多轮(剩 1 次):再输入"角色改为父亲" → 确认 → LLM 应基于 E 继续改
4. 上限(剩 0 次):按钮消失,显示"已达 3 轮迭代上限"
5. 改主题输入:counter 重置剩 2 次,history 清空
6. 后端日志验证:`tail -f /home/www/sumai/demo.log | grep [D019]`,
   能看到完整一次对话流(请求开始 → role 序列 → 拼装完成 → 响应完成)

---

## 给 @devops 的部署变更

- D019 是 sumai 内的**纯代码改动**,**无新增环境变量**
- 只需 `git pull + supervisorctl restart sumai`
- 完全向后兼容:
  - 旧前端不传 `history` → 后端等同 Stage 1 初次生成
  - 旧前端继续传 `context_prompt` / `refine_instruction` → 后端**静默忽略**(不会 500)
  - 后端可先于前端部署,前端可先于后端部署
- 推荐部署顺序:**先后端再前端**(后端老前端兼容,前端老后端新字段被忽略也没问题)
- 真机日志放量监控:`tail -f /home/www/sumai/demo.log | grep [D019]` 验证日志量正常

---

## 给 PM: KNOWN_ISSUES / DECISIONS 状态更新建议

可在 KNOWN_ISSUES.md / DECISIONS.md 标:
- **D020 多轮 footer + 调温 + Pro 切 Qwen ✅ backend 已完成**(待 PM 地毯审查 → 统一 commit)
- KNOWN_ISSUES Stage 2 D019 v1 verdict 段:可加补充行"D020 修复已上线 backend,待真机验证"
- 不动 RED-001 / RED-002 / RED-003 状态(D020 不涉及)
- sumai/CLAUDE.md L424 RED-001 段已标 ✅ 已解决(Wave 1 + D020 闭环)— 可同步 KNOWN_ISSUES
- D018a P0 fix `.format()` → `.replace()` 不再相关(D020 不用任何 format,用字符串拼接)

PENDING.md 可标:
- D020 backend ✅(本次完成,4 个 D020 sensor 全过 + 1 dup_user sensor 全过)
- D020 真机验证 — 等 PM 统一 commit 后 push 到 sumai 远程,Founder 真机回归"禁止 X"指令场景

PM 地毯审查关注点(memory feedback_carpet_code_review.md):
1. ✅ MULTI_TURN_FOOTER 文案是否足够强约束(对照 Founder 真机失败案例:NASA JPL / 冯·卡门 / 帕森斯)
2. ✅ 31 端点全部一致替换(grep `final_temperature` = 17×4 / 14×4 精确匹配)
3. ✅ messages 顺序 `[system+footer, ...history, current_user]` 严守(看 _log_d019_assembly role 序列)
4. ✅ describeImageStream 4-空格特殊处理(generate() 外切 final_system,内 chat call 用 final_temperature)
5. ✅ botPromptStreamBak Pro 切 qwen3.6-plus(免费豆包路径完全不动)
6. ✅ deepseek-v3-250324 全清零(grep = 0)
7. ✅ 0 处 `.format()`(D018a P0 永久红线)
8. ✅ [D020] 日志全覆盖(每端点 ≥ 2 处:模式启用 + 最终调用)
9. ✅ sumai/CLAUDE.md 文档同步(qwen-plus-latest / claude-haiku-4-5 历史字样修正)
10. ✅ 不引入新 Python 包,不动 D019 基础设施,不动 system prompt 字符串本身

---

## 历史变更记录

### [2026-04-28] D020 多轮 footer + 调温 + Pro 切 Qwen + sumai/CLAUDE.md 同步(本次)

详见 `current.md` + `completed.md`。**保留**。

### [2026-04-28] D019 真·多轮对话改造

详见 `completed.md`。**保留**(D019 基础设施被 D020 叠加使用)。

### [2026-04-28] D018b 真机反馈修复

D018a 措辞强化 + refine_instruction 字段。**D019 已替代,本节作废**。

### [2026-04-28] Stage 2 Phase 1 + Phase 2 合并 spawn(D017 三档下架 + D018a C 方案上下文注入)

complexity 三档(D016)在 31 端点的实施 — Phase 1 全部回滚 ✅。
CONTEXT_INJECTION_TEMPLATE + resolve_context — **D019 已删除**。

### [2026-04-25 10:30] W2-4 R3-A + R3-B(Wave 2 收尾)

complexity 三档(D016)在 31 端点就位 — D017 已下架。
全端点切到 validate_and_deduct + save_prompt_record,旧函数完全删除 — **保留**。

### [2026-04-24 23:45] W2-2 方案 Y + W2-5 TOCTOU(Round 2)

/wanxiangStream 新建,/hunyuanStream 下架。
3 端点切到 validate_and_deduct(其余 11 + stream_en.py 14 在 R3-B 收尾)— **保留**。

### [2026-04-24 22:30] W2-1 RED-002 凭证外移

主文件全部外移到 `.env`,27 个环境变量清单(部署关键)— **保留**。

### [2026-04-24] RED-001 — Anthropic → Qwen 3.6 全量迁移 — **保留**

---

## 上次更新记录

- 2026-04-28: **D019 真·多轮对话改造完成**(本次)
- 2026-04-28: D018b 真机反馈修复完成(已被 D019 取代)
- 2026-04-28: Stage 2 Phase 1 + Phase 2 合并完成(D017 + D018a)
- 2026-04-25 10:30: R3-A + R3-B 完成
- 2026-04-24 23:45: W2-5 + W2-2 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成
