# Tester(测试) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 Round 3 D(R3-D 收尾,Wave 2 全部完成)
> 角色: tester

---

## 当前状态

✅ **Wave 2 Round 3 D 任务完成 — Wave 2 测试线全部收官**

### Round 3 D 完成的工作(2026-04-25)

**任务 1 — 删除 test_sse_complexity_routing.py(deep 命名废弃)** ✅
- D016 命名裁决后,旧 deep 命名废弃
- 新 test_complexity.py(quick/standard/professional)已替代
- `git rm sumai/tests/test_sse_complexity_routing.py`

**任务 2 — 重写 test_complexity.py 三个测试以匹配 dict 实施 + 激活** ✅
- @backend R3-A 用模块级 `COMPLEXITY_DIRECTIVES` dict + `resolve_complexity()`,**不是** if-else 分支
- 重写为静态扫描 dict literal value,通过正则抽取 quick/standard/professional 字符串
- 3 个 test 取消 @pytest.mark.skip,全部 PASS
  - `test_complexity_quick_uses_shorter_prompt`: 三档齐全 + quick 含精简关键词 + quick < professional 长度 + standard 为空
  - `test_complexity_professional_includes_structure_hint`: professional 含结构化关键词(中英)
  - `test_complexity_default_fallback_to_standard`: resolve_complexity 函数存在 + data.get('complexity', 'standard') 默认 + 三档校验 tuple + return 'standard' fallback + 无错误默认值

**任务 3 — 删除 test_validate_request_and_user.py(11 stub 死代码)** ✅
- 旧 `validate_request_and_user` 函数已被 W2 R3-B 删除
- 11 个 skip stub 已无意义(激活会 NameError),按 no backward compatibility 原则直接删除文件
- `git rm sumai/tests/test_validate_request_and_user.py`

**任务 4 — TOCTOU xfail sensor 处理** ✅
- 维持 `@pytest.mark.xfail(strict=False)` 装饰器
- reason 更新为:"全 31 个 SSE 端点已用 validate_and_deduct(SELECT FOR UPDATE + 同事务)实施 TOCTOU 保护(R3-B 完成),mock 不能模拟 MySQL InnoDB 行锁,集成测试需 R4+"
- 同时更新 `test_rate_limiting.py` 顶部 docstring,警告整个文件 mock 旧函数,激活前需重写为新 API
- 内部"Round 2 激活路线"注释段更新为 R3-D 状态回顾

**任务 5 — hunyuan/wanxiang fallout 处理** ✅
- `test_endpoints_exist.py::test_sse_video_endpoints_exist`: /hunyuanStream → /wanxiangStream
- `test_sse_stream_structure.py::test_all_sse_endpoints_accept_both_methods`: 同上
- `test_qwen_client.py::test_hunyuan_stream_uses_qwen` → `test_wanxiang_stream_uses_qwen`(扫 `def wanxiangStream`)
- `test_orphan_endpoints.py::test_wanxiang_stream_is_absent` → `test_wanxiang_stream_is_present`(移除 xfail strict=True,正向断言)

**任务 6 — 全量回归** ✅
- xuhua-wx: `pytest tests/ -v --cache-clear` → **18 passed**(持平基线)
- sumai: `pytest tests/ --cache-clear` → **92 passed / 95 skipped / 3 xfailed / 2 xpassed**
  - vs Wave 2 R1 基线 91/112/3/2:passed +1, skipped -17(删除 17 stub + 激活 3 + 测试净变化)

**任务 7 — HARNESS_HEALTH.md 更新** ✅
- Sensor 表格新增 4 行(complexity/wanxiang/qwen-wanxiang/hunyuan 下架)
- TOCTOU sensor 状态更新
- test_rate_limiting 状态加注释
- 最近变更记录追加 R3-D 条目

---

## 关键测试数据

| 测试套 | 基线(R1) | R3-D 后 | 变化 |
|---|---|---|---|
| xuhua-wx | 18 passed | **18 passed** | 持平 ✅ |
| sumai passed | 91 | **92** | +1 ✅ |
| sumai skipped | 112 | **95** | -17(删 17 + 激活 3 抵消) |
| sumai xfailed | 3 | **3** | 持平 |
| sumai xpassed | 2 | **2** | 持平 |
| sumai total | 208 | **192** | -16(2 文件删除) |

---

## 风险与后续 follow-up

1. **test_rate_limiting.py 6 个测试激活前需重写**(P2): 全部 mock 旧 validate_request_and_user / save_content_prompt_stream,旧函数已删。本地 skipif(SUMAI_DEPS_AVAILABLE) 整体 skip,生产 venv 激活会 6 个 fail。已在 docstring 标警告,留待 R4+。
2. **TOCTOU 集成测试缺失**(P2): mock 不能验证 MySQL 行锁,生产保护已就位但缺真实并发回归。R4+ 任务。
3. **几个 test_orphan_endpoints test_wanxiang_frontend_calls_exist 仍命中前端** ✅ 设计如此(YELLOW-001 前端侧验证),保留。

---

## 上次更新记录

- 2026-04-25 Wave 2 Round 3 D(本轮): 测试激活 + 旧测试清理 + W2-2 fallout 修正 + 全量回归
- 2026-04-24 Session 3 Wave 2 Round 1: 基线 + Round 3 测试草稿 + TOCTOU 注释
- 2026-04-24 Session 3 Wave 1: 5 个新测试文件(PM 代写)
- 2026-04-24 Session 2: sumai 185 test 骨架
- 2026-04-24 Session 初始化: tests/ 三件套 + HARNESS_HEALTH.md
