# Backend(后端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 10:30 (Wave 2 Round 3 完成 — Wave 2 后端收尾)
> 角色: backend

---

## 当前状态

[2026-04-25 10:30] **Wave 2 Round 3 完成**:
- R3-A · Stage 1 complexity 三档 system prompt(D016)在全 31 端点就位
- R3-B · 全端点切到 validate_and_deduct + save_prompt_record,旧函数完全删除
- TOCTOU 全端点保护就位(stream.py + stream_en.py 31 端点都用 SELECT FOR UPDATE)

**Wave 2 后端工作全部完成**,等 @tester R3-D 全量回归。

---

## API 契约变更清单(本次 R3-A + R3-B)

### 🆕 新增前后端契约: complexity 参数(D016)

| 字段 | 类型 | 取值 | 透传位置 | 后端 fallback |
|---|---|---|---|---|
| `complexity` | string | `quick` / `standard` / `professional` | SSE GET query 或 POST form,与 `style` 同级 | 未传或无效值 → `standard`(等同当前默认行为) |

**前端实施(@frontend R3-C 已并行 spawn)**:
- `pages/index/index.js` 的 generateContent() body 加 `complexity: this.data.selectedComplexity || 'standard'`
- 前端已有 complexityOptions(quick / standard / professional)定义在 L245-258(Wave 1 完成)

**后端行为**:
- standard 档 → 系统 prompt 末尾不追加 directive(行为完全等同当前)
- quick 档 → 末尾追加"精简到 3-5 段,跳过详细思考步骤"directive
- professional 档 → 末尾追加"6-10 段结构化 + 项目模板尾注"directive

**端点覆盖**: 全部 31 个 SSE 端点(stream.py 17 + stream_en.py 14)都已生效

### 🔄 内部 API 重构: 旧函数删除(no backward compatibility)

| 旧函数(已删) | 新函数(替代) | 行为差异 |
|---|---|---|
| `validate_request_and_user(data)` | `validate_and_deduct(data, cost=1)` | 新函数同时扣次数,SELECT FOR UPDATE 行锁,事务安全 |
| `save_content_prompt_stream(...)` | `save_prompt_record(...)` | 新函数只 INSERT,不再扣 used_num(已在 validate_and_deduct 扣) |

**任何残留的旧函数调用都会 NameError**,这是有意的:让残留 bug 立即暴露而非静默回退。

---

### 给 @frontend R3-C: complexity 透传契约

```javascript
// pages/index/index.js 的 generateContent() body
{
  openid: app.globalData.openid,
  content: this.data.userInput,
  style: this.data.selectedStyle || '',  // 已有
  complexity: this.data.selectedComplexity || 'standard',  // 🆕 新增
  // ... 其他字段
}
```

**关键**:
- 前端不传 complexity → 后端 fallback 'standard'(当前行为)
- 前端传无效值(如 'deep' / 'pro')→ 后端 fallback 'standard'(防御编程)
- 前端传 'professional' → 用户会看到结构化的长 prompt + 末尾 💎 项目模板尾注

英文版端点(*StreamEN)同理透传。

---

### 给 @tester R3-D: 测试激活 / 修正清单

#### 1. test_complexity.py 3 个 stub(等激活)

| Test | 状态 | 激活方式 | 风险 |
|---|---|---|---|
| `test_complexity_default_fallback_to_standard` | 激活后 PASS ✅ | 直接取消 skip 标记 | 无 — `resolve_complexity()` 内有 `data.get('complexity', 'standard')`,正则匹配通过 |
| `test_complexity_quick_uses_shorter_prompt` | 激活后 FAIL ⚠️ | 需调整 extractor 逻辑 | 我的实施用 `COMPLEXITY_DIRECTIVES` dict,不是 if-else 分支,extractor 找不到 `complexity == 'quick'` 块 |
| `test_complexity_professional_includes_structure_hint` | 激活后 FAIL ⚠️ | 同上 | 同上 |

**推荐做法**: 把 Test 1 / Test 2 改写为针对 dict 的断言:
```python
# Test 1 改写:
import importlib.util
spec = importlib.util.spec_from_file_location("stream", SUMAI_ROOT / "stream.py")
# ... 或更简单:静态扫源码找 COMPLEXITY_DIRECTIVES dict 的 quick value 字符串
import re
match = re.search(r"'quick'\s*:\s*\"([^\"]*?)\"", stream_py)
quick_dir = match.group(1) if match else ""
match = re.search(r"'professional'\s*:\s*\"([^\"]*?)\"", stream_py)
pro_dir = match.group(1) if match else ""
assert len(quick_dir) > 0 and len(pro_dir) > 0
assert len(quick_dir) < len(pro_dir)  # quick 比 professional 短

# Test 2 改写:
zh_keywords = ["结构化", "分节", "模板", "章节"]
assert any(kw in pro_dir for kw in zh_keywords)
```

#### 2. test_validate_request_and_user.py(11 SKIPPED)激活后全部 FAIL ⚠️

**根因**: 旧 `validate_request_and_user` 函数已删。

**修正建议**:
- 重命名文件为 `test_validate_and_deduct.py`
- 全文件 sed `validate_request_and_user` → `validate_and_deduct`
- 注意 user_info 元组结构: 旧函数返回 5-tuple `(num, is_pro, origin, pro_num, normal_num)`,新函数返回 `(num_before_deduction, is_pro, origin, pro_num, normal_num)` — 字段相同,语义相容,大部分 mock 可不变
- mock fixture 需新增对 `conn.start_transaction` / `cursor.execute(SELECT ... FOR UPDATE)` / `cursor.execute(UPDATE ...)` / `conn.commit` 的处理(因为新函数不只 SELECT,还会 UPDATE)
- **注意 cost 参数**: `validate_and_deduct(data, cost=1)`,默认 cost=1 与旧函数语义一致

#### 3. test_endpoints_exist.py / test_sse_stream_structure.py / test_qwen_client.py / test_orphan_endpoints.py — Round 2 fallout

这 4 个测试在 W2-2 方案 Y 后(/hunyuanStream 删除 + /wanxiangStream 新建)在生产 venv 会 FAIL/XPASS。详见 Round 2 backend completed.md 给的清单。

R3-D 全量回归一并修正。

#### 4. TOCTOU sensor 全端点就位

stream.py + stream_en.py 全 31 端点都用 SELECT FOR UPDATE。`test_rate_limiting.py::test_race_condition_sensor` 仍 xfail (mock 限制)。

**推荐**: 保持 xfail + 更新 reason 为:
> "全 31 端点已用 validate_and_deduct(SELECT FOR UPDATE)实施 TOCTOU 保护(R3-B 完成)。mock 不能模拟 MySQL 行锁,集成测试才能真实验证。本 sensor 保留以记录此约束。"

#### 5. 新增 sensor 建议

- `test_complexity_directives_dict_complete` — 静态扫描 stream.py 含 `COMPLEXITY_DIRECTIVES = {` 且三键齐全
- `test_complexity_directives_en_dict_complete` — 同上 stream_en.py
- `test_resolve_complexity_returns_standard_for_invalid` — 静态扫源码确认 fallback 'standard' 路径
- `test_all_sse_endpoints_inject_directive` — 扫所有端点的 conversation_history.append 都含 `COMPLEXITY_DIRECTIVES`
- `test_no_old_validate_request_and_user_remaining` — 全文搜 sumai/*.py 无 def validate_request_and_user 残留
- `test_no_old_save_content_prompt_stream_remaining` — 同上
- `test_validate_and_deduct_used_in_all_endpoints` — 全 31 端点的 SSE generate 函数都用 validate_and_deduct

---

### 给 @devops: 无新增部署变更

- R3-A + R3-B 是 sumai 内的纯代码改动,无新增环境变量
- 只需 `git pull + supervisorctl restart sumai`
- W2-1 RED-002 的 27 个 env 变量仍是唯一部署前置
- complexity 参数透传 → 后端兼容 fallback,即使前端先于后端部署,旧前端不传 complexity 也工作正常

---

### 给 PM: KNOWN_ISSUES 状态更新建议

可在 KNOWN_ISSUES.md 标:
- **YELLOW-004 TOCTOU 全端点修复 ✅**(R3-B 完成,31 端点全用 SELECT FOR UPDATE,mock sensor 可持续 xfail)
- 不可标 RED-001 (Anthropic 残留少量代码,见 GRAY-004 废弃文件)
- 不可标 RED-002 (主文件已外移,GRAY-004 废弃文件仍含 key)
- RED-003 D014 已豁免(几十付费用户 + SSH 可信)

PENDING.md 可标:
- Stage 1 后端 complexity 三档 ✅(我做完了)
- Stage 1 前端 complexity 透传 — 等 @frontend R3-C 完成

---

## 历史变更记录

### [2026-04-25 10:30] W2-4 R3-A + R3-B(本次)

详见 `current.md` + `completed.md`。

### [2026-04-24 23:45] W2-2 方案 Y + W2-5 TOCTOU(Round 2)

- /wanxiangStream 新建,/hunyuanStream 下架
- 3 端点切到 validate_and_deduct(其余 11 + stream_en.py 14 在 R3-B 收尾)

### [2026-04-24 22:30] W2-1 RED-002 凭证外移

主文件全部外移到 `.env`,27 个环境变量清单(部署关键)见下:

```bash
# === Flask ===
FLASK_SECRET_KEY=  # 64 字符 hex,python3 -c "import secrets; print(secrets.token_hex(32))"

# === MySQL ===
MYSQL_HOST=101.132.69.232  # 有默认值
MYSQL_PORT=3306             # 有默认值
MYSQL_USER=root             # 有默认值
MYSQL_PASSWORD=             # 强读!必填
MYSQL_DATABASE=sumai        # 有默认值

# === Redis ===
REDIS_HOST=101.132.69.232   # 有默认值
REDIS_PORT=6379             # 有默认值
REDIS_PASSWORD=             # 强读!必填

# === LLM ===
QWEN_API_KEY=               # 强读!必填
ANTHROPIC_API_KEY=          # 可空(死代码)
VOLCENGINE_API_KEY=         # 强读!仅测试端点

# === 微信开放平台(PC) ===
WECHAT_OPEN_APP_ID=
WECHAT_OPEN_APP_SECRET=
WECHAT_OPEN_REDIRECT_URI=   # 有默认值

# === 序话 PC 扫码 ===
WECHAT_XUHUA_APP_ID=
WECHAT_XUHUA_APP_SECRET=
WECHAT_XUHUA_REDIRECT_URI=

# === 公众号服务号 ===
WECHAT_GH_APP_ID=
WECHAT_GH_APP_SECRET=
WECHAT_GH_REDIRECT_URI=

# === 小程序 ===
WECHAT_MINI_APP_ID=
WECHAT_MINI_APP_SECRET=

# === 微信支付 ===
WECHAT_PAY_MCHID=
WECHAT_PAY_PRIVATE_KEY_PATH=/home/www/sumai/cert/apiclient_key.pem
WECHAT_PAY_CERT_SERIAL_NO=
WECHAT_PAY_APIV3_KEY=

# === 阿里云 OSS ===
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_ENDPOINT=               # 有默认值
OSS_BUCKET_NAME=            # 有默认值

# === Stripe ===
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_DOMAIN=              # 有默认值
```

### [2026-04-24] RED-001 — Anthropic → Qwen 3.6 全量迁移

---

## 上次更新记录

- 2026-04-25 10:30: **R3-A + R3-B 完成 — Wave 2 后端收尾**
- 2026-04-24 23:45: W2-5 + W2-2 完成
- 2026-04-24 22:30: W2-1 RED-002 完成
- 2026-04-24: RED-001 完成
