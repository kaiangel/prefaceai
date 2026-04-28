# PM(产品经理) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-25 Wave 2 全部完成后
> 角色: pm(Coordinator 兼任)

---

## 给所有 teammate 的 PM 视角共识

### 1. 产品决策的过滤器

任何产品层面变更先过三问:
1. Beachhead 命中吗?(设计师 / 内容创作者 / 日常复杂任务人群)
2. 强化 Counter-Positioning 吗?(多模型对比 / 中文深度 / 多模态统一 / 项目化 / 微信生态)
3. 合规红线不踩吗?(无境外 LLM 端点 / 境内模型 / 微信小程序约束)

不满足三问的建议 PM 会拒绝或要求重规划。

### 2. Wave 2 当前可见状态

- Round 1 ✅ RED-002 凭证外移 + 基线测试 + env 指南草稿
- Round 2 ✅ TOCTOU + 方案 Y + hunyuan 前端清理 + env 指南变量回填
- Round 3 ⏳ complexity 三档 system prompt + 剩余 11 端点切 validate_and_deduct + 前端透传 + 回归激活

### 3. 最新决策锚点(Session 3)

| # | 内容 | 影响 |
|---|---|---|
| D010 | 方案 Y + 下架 hunyuan | Round 2 已实施 |
| D011 | Qwen 差异化 flash/plus | Wave 1 RED-001 已实施 |
| D012 | Stage 1 方案 B(前端先行) | Wave 1 前端上线 UX,Round 3 后端跟进 |
| D014 | 微信支付证书暂不轮换 | RED-003 外部任务降级 P3 |
| D015 | Wave 2 四轮串行 | @backend 一人依次 W2-1→W2-5→W2-2→W2-4 |
| D016 | complexity = quick/standard/professional | 全项目命名统一,旧 deep 废弃 |

### 4. 已知地雷(不要碰)

- `pages/index/index.js` 3038 个 U+00A0(GRAY-006)— Edit 工具字符串匹配易失败,用字节级脚本或 Read 更大上下文
- sumai 废弃文件 `claude_*.py` / `bigmodel/` / `deepseek/` / `moonshot.py`(GRAY-004)— 别改也别 import
- sumai TEAM_CHAT 超 3000 行时需归档(目前 678 行,远未到)

### 5. Teammate 协作规则

- 不自己 commit,PM 审查通过后统一 commit + push
- 不越权改其他 agent 领地(backend 不改 tests/,frontend 不改 sumai/,tester 不改 .py 业务逻辑)
- 发现风险必须 SendMessage 上报,不猜测不假设
- 完成后必做:TEAM_CHAT 追加 + progress 三件套 + 相关 team-brain 文档

---

## PM 审查尺度

**直接通过**:
- 全部验收标准达成
- 文档更新齐全
- 无越权(或有越权但效果积极可放行,见 Round 1 @backend sensor 升级)

**要求修复**:
- 验收标准缺失
- 合规红线违反
- 文档缺失超过 2 项
- 测试回归

**Founder 决策**:
- 产品方向分歧
- 架构级变更
- 修复循环超 2 轮

---

## 上次更新记录

- 2026-04-24 Wave 2 Round 2: D016 裁决
- 2026-04-24: 多 Agent 系统初始化

---

## 2026-04-27 + 2026-04-28 同步 note

- **2026-04-27**:Stage 1 真机回归 + 三轮 UX hotfix(scroll-view enable-flex + display:flex 双开 bug,真因 GRAY-007 已纳入 KNOWN_ISSUES)。@frontend 主修,pm 角色未参与。详见 `daily-sync/2026-04-27.md`。
- **2026-04-28**:Founder 完成 5 人 Mom Test + Sean Ellis 40% 数据,验证"复杂任务 beachhead"假设;**D017 决策 Stage 1 三档复杂度下架**(Founder verdict "鸡肋");**D018 决策 Stage 2 启动**,先做 C 方案上下文注入。详见 `daily-sync/2026-04-28.md` + `decisions/DECISIONS.md`。
- 待 PM 出 spawn 拆解规划等 Founder "可以" 后,pm 角色可能被派发任务(详见 `handoffs/PENDING.md`)。

---

## 2026-04-28 PM(后续)· D018b 完成 + 诊断日志 + D019 即将启动

- **D018b 双 remote push**:sumai a36ebe0(directive 强化 + refine_instruction)+ xuhua-wx 764f408(方案 b 输入框 + 按钮 nowrap + counter 剩 2)
- **诊断日志**:xuhua-wx 11a15d6 加 8 处 [D018b] console.log,Founder 真机重测以观察 refine_instruction 是否端到端通
- **Founder 真机反馈**:输出几乎复述上一轮 → PM 诊断为"伪上下文注入"架构限制(directive 在 system 末尾优先级低,且"保留有效部分"措辞与"更换"指令矛盾)
- **D019 决定(2026-04-28 Founder 拍板)**: 改造为**真·多轮对话**(LLM 原生 chat completion 模式),user message 是用户的修改指示而不是再发原 idea。D018a/b 整套 directive 即将被 D019 替代,F-4 自动消失
- 待 PM 出 D019 拆解规划等 Founder "可以",pm 角色可能被派发任务
