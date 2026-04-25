# Frontend(前端) - 当前任务

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 09:30 Session 3 Wave 2 Round 3
> 角色: frontend

---

## 当前状态

✅ **R3-C 任务完成**(前端透传 complexity 到 SSE)

### Wave 2 Round 3 (R3-C) 完成的工作

**目标**:把 `this.data.currentComplexity`(`quick` / `standard` / `professional`)透传到所有 SSE 调用,后端 R3-A 即可读取并应用三档 system prompt directive。

**契约(D016)**:
- 字段名:`complexity`
- 取值:`quick` | `standard` | `professional`
- 默认:前端默认 `quick`(未改);后端未收到 → fallback `standard`

**改动 1: generateContent() POST body**(`pages/index/index.js` L2358)
- 在 `wx.request` 的 `data` 对象里加 `complexity: this.data.currentComplexity`,与 `style` 同级
- 该函数路由到 14 个 SSE 端点(由 `getApiEndpoint(modelName, currentStyle)` 决定 URL):
  - botPromptStream / reasoningStream / aiAgentStream
  - dalleStream / fluxStream / jimengpicStream / lovartpicStream / midjourneyStream
  - kelingStream / jimengvidStream / lovartvidStream / runwayStream / wanxiangStream / sora2Stream
- **一处改动覆盖 14 个端点**

**改动 2: generateImageDescription() GET URL query**(`pages/index/index.js` L473-474)
- 在 URL 拼接处追加 `&complexity=${encodeURIComponent(this.data.currentComplexity)}`
- 覆盖 `/describeImageStream` 端点

**全扫确认**:全项目仅 2 处 `enableChunked: true` 调用(L528 / L2371),都已加 complexity。

### 改动文件

| 文件 | 改动 | 字节增量 |
|---|---|---|
| `pages/index/index.js` | L473-474 加 GET URL query · L2358 加 POST body 字段 | +~145 B |
| **总计** | **+~145 B** | < 200 字节,远 < 100 字节预算放宽到 200 |

### 验证

| 项 | 结果 |
|---|---|
| `node --check pages/index/index.js` | ✅ SYNTAX OK |
| `pytest tests/` | ✅ **18 passed**(与 Wave 2 R2 基线一致,零回归) |
| grep `complexity` 出现位置 | L242 / L243 / L250 / L253 / L473-474 / L2358 共 7 处 |
| `currentComplexity` 默认值 | ✅ `'quick'`(未改) |
| URL endpoint | ✅ 未改,只加 query / body 字段 |
| 主包尺寸 | ✅ 增量 ~145 B |
| 微信小程序合规 | ✅ 无 DOM / 无 px / 无 npm |

### 与 @backend R3-A 联调期

- **@backend R3-A 完成后**:用户在三档之间切换(quick / standard / professional),后端读取 `complexity` 并应用对应 system prompt directive,生成结果应有差异
- **回归 fallback 路径**:即使 @backend R3-A 未上线,后端读不到 `complexity` 字段不会报错(标准 form/query 解析容错)
- **建议手动验证**:Founder 真机测试 — 切到"专业项目"档发一条文字 prompt,观察生成结果长度 / 结构是否比"快速想法"明显更长更结构化

### NBSP (GRAY-006) 处理

本次改动两处都在纯 ASCII 区域,Edit 工具直接成功匹配,无需走 Python 字节级脚本。GRAY-006 仍未清理,按 Stage 2+ 计划处理。

---

## 上次更新记录

- 2026-04-25 09:30: Wave 2 R3 R3-C 完成(complexity 透传 SSE)
- 2026-04-24 21:44: Wave 2 R2 W2-3 完成(hunyuan 残留清理 + 通义万相路由确认)
- 2026-04-24 Session 3: Wave 1 完成,PM 代写 progress
- 2026-04-24 Session 2: 初始化
