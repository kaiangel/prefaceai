# Tester(测试) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24 Session 3 Wave 1
> 角色: tester

---

## 当前状态

✅ **Wave 1 完成,sumai 测试套 89 passed / 111 skipped / 3 xfailed / 2 xpassed**

---

## 给 @backend 的上下文

### TOCTOU 竞争条件(P1,Wave 2 前修复)

- **位置**: `validate_request_and_user()` SELECT + `save_content_prompt_stream()` UPDATE
- **问题**: 两个独立 DB 连接,无事务保护 → 并发可能 lost update(用户多扣次数)
- **修复方案**: `SELECT ... FOR UPDATE` + 同 transaction,或用 Redis 分布式锁
- **传感器**: `test_rate_limiting.py::test_race_condition_sensor` 已标 xfail,修复后移除 xfail

### 测试套现状(sumai/tests)

- 运行:`cd sumai && python -m pytest tests/ -v`
- 共 205 个 test case
- 89 passed(核心功能)
- 111 skipped(未实现 / 依赖 mock / 有前置)
- 3 xfailed(预期失败,含 1 race_condition_sensor)
- 2 xpassed(意外通过,建议观察后改 passed)

### 给你的模型名合规测试

- `test_sse_is_pro_branch.py::test_qwen_model_name_is_correct_in_config` 强制期望:
  - `qwen3.6-plus-2026-04-02`(Pro)
  - `qwen3.6-flash-2026-04-16`(免费)
- 改模型名必须同步改此测试

---

## 给 @frontend 的上下文

- sumai 测试改动不影响前端
- 前端 xuhua-wx/tests/ 仍 18/18 全绿
- Wave 2 三档 complexity 后端实施后,建议补前端 e2e 手动测试 checklist

---

## 给 @devops 的上下文

- sumai 测试不进 CI(Founder 决定暂不引入)
- 本地运行依赖:`pytest` / `requests` / 不需数据库(都是静态代码扫描 / mock)
- RED-003 证书问题:测试套无法验证 git 历史清理,需 Founder 外部 git-filter-repo 后手动 verify

---

## 给 @pm 的上下文

- Wave 1 新测试文件 5 个(tests/test_rate_limiting.py 激活,其余 4 个 skip stub)
- 待 @backend 提供 mock 基础后激活:
  - test_history.py(4 stub)
  - test_revoke_history.py(3 stub)
  - test_describe_image_stream.py(4 stub)
  - test_third_party_login.py(3 stub)

---

## 待激活清单(Wave 2+)

1. TOCTOU race_condition_sensor → 改事务后变 passed
2. test_describe_image_stream 完整实现
3. test_third_party_login 如果有 mock 要激活
4. Stage 2 后端 complexity 三档 system prompt 测试

---

## 上次更新记录

- 2026-04-24 Session 3 Wave 1: 5 个新测试文件 + TOCTOU 发现,PM 代写
- 2026-04-24 Session 2: sumai 185 test 骨架建立
- 2026-04-24: 多 Agent 系统初始化
