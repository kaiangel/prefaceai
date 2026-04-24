# Harness 健康度看板

> 上次更新: 2026-04-24 Session 3 Wave 1
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
| 速率限制 | test_rate_limiting.py(6 tests) | ✅ 5 passed + 1 xfail |
| TOCTOU 竞争 | test_race_condition_sensor | ⚠️ xfail(等 @backend 修事务) |
| /history | test_history.py(4 stub) | ⏸️ skip(等 mock) |
| /revoke_history | test_revoke_history.py(3 stub) | ⏸️ skip(等 mock) |
| /describeImageStream | test_describe_image_stream.py(4 stub) | ⏸️ skip(等 mock) |
| 第三方登录 | test_third_party_login.py(3 stub) | ⏸️ skip(等 mock) |
| SSE 端点骨架 | test_sse_* 系列 | 部分 passed,部分 skip |

**合计**: 205 个 test case,**89 passed / 111 skipped / 3 xfailed / 2 xpassed**

---

## 错误模式防护率

- 已记录错误模式: **0 个**(未来 `.team-brain/knowledge/ERROR_PATTERNS.md` 追加)
- 有工程化防护 (Sensor/Hook): **0 个**
- 仅文档记录: **0 个**
- **防护率**: **N/A**(无错误模式记录)

### 已知警报 vs Sensor

| 警报 ID | 严重度 | Sensor 状态 |
|---|---|---|
| RED-001 | 🔴 P0 | ✅ 已解决 + 模型名 sensor 已激活 |
| RED-002 | 🔴 P0 | ❌ 无 sensor(凭证硬编码扫描建议 Wave 2 加)|
| RED-003 | 🔴 P0 | ⚠️ gitignore 已补救,git 历史清理需 Founder 外部 |
| YELLOW-001 | 🟡 P1 | ❌ 无 sensor(方案 Y Wave 2 实施后可加)|
| YELLOW-004 (TOCTOU) | 🟡 P1 | ⚠️ xfail sensor 已就位,等 @backend 修 |
| GRAY-006 (U+00A0) | 🟢 P3 | ❌ 无 sensor,Stage 2+ 清理 |

---

## TEAM_CHAT 文件状态

| 指标 | 值 |
|------|-----|
| 当前行数 | ~300(Session 3 Wave 1 完成后大量追加) |
| 上次归档 | 从未 |
| 状态 | 🟢 健康 (< 3,000 行) |

---

## Harness 评分

| 维度 | Session 2 | Session 3 | 目标 | 说明 |
|------|:----:|:----:|:----:|------|
| Guides(前馈)| 7/10 | **8/10** | 8/10 | CLAUDE.md + sumai/CLAUDE.md + 7 角色文件 + MULTI_AGENT_PORTING_GUIDE + RED-003 guide |
| Sensors(反馈)| 4/10 | **6/10** | 6/10 | xuhua-wx 18 test + sumai 205 test(89 passed)+ 模型名 sensor 激活 |
| 计算性控制 | 3/10 | **4/10** | 5/10 | PreCommit hook + 部分合规 sensor;缺 file whitelist 越权检测 |
| 编排设计 | 7/10 | **8/10** | 8/10 | xhteam Wave 1 实战 dogfood 成功(4 teammate 并行全通过)|

**总分**: Session 2 21/40 → Session 3 **26/40**,达到目标水位

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
