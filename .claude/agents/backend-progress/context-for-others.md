# Backend(后端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-28 (Stage 2 Phase 1 + Phase 2 合并完成)
> 角色: backend

---

## 当前状态速览

[2026-04-28] **Stage 2 backend 工作完成**(D017 三档下架 + D018a C 方案 上下文注入合并):

- 🗑️ Phase 1: 三档复杂度后端实施全部清理(0 残余)
- ✨ Phase 2: 上下文注入 (`context_prompt` 字段)在全 31 SSE 端点就位
- ✅ py_compile 通过,pytest 89 passed 无回归
- 🔄 待 PM 审查后统一 commit

---

## API 契约变更清单(本次 Phase 1 + Phase 2)

### 🗑️ 移除的契约(Phase 1 / D017): complexity 字段

| 字段 | 状态 | 后端处理 |
|---|---|---|
| `complexity` (`quick` / `standard` / `professional`) | **已下架** | 后端不再读取此字段。前端继续传也无副作用(Flask `data.get` 未取 → 自然忽略) |

**影响**: 旧前端如仍传 `complexity` 字段,后端会**静默忽略**(向后无破坏)。但生成行为不再因此字段不同 — 三档 directive 已删除。

### 🆕 新增的契约(Phase 2 / D018a): context_prompt 字段

| 字段 | 类型 | 取值 | 透传位置 | 后端 fallback |
|---|---|---|---|---|
| `context_prompt` | string | 上一轮生成的 prompt 全文(用户点「✨ 基于此继续优化」时传) | SSE GET query 或 POST form,与 `style` 同级 | 未传 / 空串 / None / 全空白 → 不注入(等同当前) |

**端点覆盖**: 全部 31 个 SSE 端点(stream.py 17 + stream_en.py 14)。

**注入逻辑**(后端三行):

```python
ctx = resolve_context(data)
final_system = system + CONTEXT_INJECTION_TEMPLATE.format(previous_output=ctx) if ctx else system
conversation_history.append({"role": "system", "content": final_system})
```

**注入模板**(中文版,英文版同结构):

```
【上下文】用户上一轮已得到的 prompt 是:
{previous_output}

现在用户希望基于此继续优化。请保留有效部分,
根据用户新的输入做改进/补充/调整。
```

**防御截断**: `context_prompt` 超过 5000 字符 → 截断到 5000 + 尾部加 `...(已截断)` / `...(truncated)`。

**后端不感知轮次**: 只看 `context_prompt` 字段是否存在 + 非空。轮次上限 3(D018a)由前端 counter 强制。

---

## 给 @frontend 的契约(D018a 上下文注入)

```javascript
// pages/index/index.js 的 generateContent() body
{
  openid: app.globalData.openid,
  content: this.data.userInput,
  style: this.data.selectedStyle || '',
  context_prompt: this.data.refineCounter > 0 ? this.data.lastOutput : '',  // 🆕 D018a
  // ... 其他字段
}
```

**前端职责**:
- 用户点「✨ 基于此继续优化」按钮 → counter +1,把 `lastOutput` 塞进下次 generateContent 的 `context_prompt`
- counter 达到 3 → 禁用按钮(D018a 上限)
- 用户重新输入(新 session)→ counter 归零,清空 `context_prompt`
- 删除 Stage 1 三档 UI(complexity 选项 + selectedComplexity state + 透传字段)

**后端不要求 counter 信息** — 第 1 / 2 / 3 轮在后端看完全一样,都是"有 context_prompt 就注入"。

英文版端点(`*StreamEN`)同理透传 `context_prompt`,后端用英文上下文 block。

---

## 给 @tester 的交接(测试 sensor)

### 1. 删除已完成

`sumai/tests/test_complexity.py` 已删(只剩无害 .pyc 缓存),建议:
- 跑一次 `pytest --cache-clear` 自动清理 .pyc
- 或手动 `rm sumai/tests/__pycache__/test_complexity*.pyc`

### 2. 建议新增 `sumai/tests/test_context_injection.py`

| Test 名 | 用途 | 实施提示 |
|---|---|---|
| `test_context_injection_template_exists` | 静态扫源码确认 stream.py 顶部含 `CONTEXT_INJECTION_TEMPLATE = """..."""` | regex `r'CONTEXT_INJECTION_TEMPLATE\s*=\s*"""'` |
| `test_context_injection_template_en_exists` | 同上 stream_en.py(`CONTEXT_INJECTION_TEMPLATE_EN`) | 同上 |
| `test_resolve_context_returns_none_for_empty` | 静态扫源码确认 `resolve_context` fallback 路径 | regex 找两条 `if not raw: return None` / `if not value: return None` |
| `test_resolve_context_truncates_at_5000` | 确认防御截断逻辑存在 | regex 找 `len(value) > 5000` |
| `test_all_sse_endpoints_inject_context_zh` | 扫 stream.py 所有 SSE 端点都含 `ctx = resolve_context(data)` | grep -c 应得 ≥ 18(1 定义 + 17 端点) |
| `test_all_sse_endpoints_inject_context_en` | 扫 stream_en.py | grep -c 应得 ≥ 15(1 定义 + 14 端点) |
| `test_no_complexity_directives_remaining` | 全文搜 `COMPLEXITY_DIRECTIVES` 应为 0 | grep -c 应得 0 |
| `test_no_resolve_complexity_remaining` | 全文搜 `resolve_complexity` 应为 0 | 同 |

### 3. 全量回归基线

跑 `pytest sumai/tests/` 应得 **89 passed**(基线 92 - test_complexity 删 3 = 89)。任何**新增**的失败都是回归 — 立即报警。

新加的 `test_context_injection.py` sensor 全 PASS 后,数字会上升到 ~97 passed(89 + 8 新 sensor)。

### 4. 集成测试(可选 P3)

mock 集成测试:模拟前端发 POST 到 `/botPromptStream` 带 `context_prompt='上一轮 prompt 文本'`,断言:
- LLM 收到的 system prompt 包含 `【上下文】用户上一轮已得到的 prompt 是:` 字符串
- 不带 `context_prompt` 时不含此字符串

需要 mock `client.chat.completions.create`。

---

## 给 @devops: 无新增部署变更

- Phase 1 + Phase 2 是 sumai 内的纯代码改动,**无新增环境变量**
- 只需 `git pull + supervisorctl restart sumai`
- 完全向后兼容:
  - 旧前端不传 `context_prompt` → 等同当前行为
  - 旧前端仍传 `complexity` → 后端静默忽略,行为不再分化
- 部署顺序无要求(后端可先于前端,前端可先于后端)

---

## 给 PM: KNOWN_ISSUES / DECISIONS 状态更新建议

可在 KNOWN_ISSUES.md / DECISIONS.md 标:
- **D017 三档下架 ✅ backend 已完成**(待 PM commit + @frontend / @tester 同轮完成后整体上线)
- **D018a C 方案上下文注入 ✅ backend 已完成**(待前端 + 测试同轮完成后整体上线)
- 不动 RED-001 / RED-002 / RED-003 状态

PENDING.md 可标:
- Stage 2 backend Phase 1 + Phase 2 ✅(本次完成)
- Stage 2 frontend Phase 1 + Phase 2 — 等 @frontend 同轮 spawn 完成
- Stage 2 tester Phase 1 + Phase 2 — 等 @tester 同轮 spawn 完成

---

## 历史变更记录

### [2026-04-28] Stage 2 Phase 1 + Phase 2 合并 spawn(本次)

详见 `current.md` + `completed.md`。

### [2026-04-25 10:30] W2-4 R3-A + R3-B(Wave 2 收尾)

- complexity 三档(D016)在 31 端点就位 — **本次 Phase 1 已全部回滚**
- 全端点切到 validate_and_deduct + save_prompt_record,旧函数完全删除 — **保留**

### [2026-04-24 23:45] W2-2 方案 Y + W2-5 TOCTOU(Round 2)

- /wanxiangStream 新建,/hunyuanStream 下架
- 3 端点切到 validate_and_deduct(其余 11 + stream_en.py 14 在 R3-B 收尾)— **保留**

### [2026-04-24 22:30] W2-1 RED-002 凭证外移

主文件全部外移到 `.env`,27 个环境变量清单(部署关键)— **保留**

### [2026-04-24] RED-001 — Anthropic → Qwen 3.6 全量迁移 — **保留**

---

## 上次更新记录

- 2026-04-28: **Stage 2 Phase 1 + Phase 2 合并完成**
- 2026-04-25 10:30: R3-A + R3-B 完成(本次 R3-A 部分被 D017 回滚)
- 2026-04-24 23:45: W2-5 + W2-2 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成
