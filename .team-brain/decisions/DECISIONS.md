# 决策记录

> 维护者: PM
> 规则: 追加式,不删除历史决策

## 2026-04-24

### D001 - 多 Agent 协作系统从 xuhuastory 移植到 xuhua-wx
- **决策者**: Founder
- **理由**: 提升 2 人团队 + Claude Code 的协作效率
- **影响**: 新增 .team-brain/ / .claude/agents/ / .claude/skills/ / tests/ 目录
- **执行**: Coordinator(Opus 4.7)派 4 个 Sonnet 4.6 agent 并行 Phase 1

### D002 - 全部 spawn agent 使用 Sonnet 4.6
- **决策者**: Founder
- **理由**: Sonnet 4.6 性价比最高,Opus 保留给 Coordinator 做 review
- **影响**: 所有 subagent 调用强制 model: sonnet

### D003 - Resonance agent 独立(不与 xuhuastory 共享)
- **决策者**: Founder
- **理由**: 序话与 xuhuastory 是同一创始人的不同产品,营销需分开运营

### D004 - 不引入 GitHub Actions CI / 不加 eslint PostToolUse hook
- **决策者**: Coordinator(Founder 授权)
- **理由**: 微信小程序无 npm 生态 + .eslintrc.js 规则为空,eslint 空转

### D005 - Beachhead 锁定 "设计师 + 内容创作者 + 日常完成复杂任务人群"
- **决策者**: Founder
- **理由**: Session 1 战略讨论 + "上次放弃用序话是简单任务"用户洞察

### D006 - 多模型对比护城河限定中国大陆境内模型
- **决策者**: Founder
- **理由**: 微信小程序合规要求
- **影响范围**: 千问、豆包、混元、Kimi、智谱、MiniMax、小米 MiMo 等

### D007 - Sumai 后端代码以嵌套 git repo 方式共存于 xuhua-wx 目录
- **决策者**: Founder
- **日期**: 2026-04-24
- **背景**: sumai 是序话的真实后端代码(clone 自 `101.132.69.232:/home/git/sumai.git`,部署到 `https://www.duyueai.com`)。为了让 Claude Code Agent 能跨仓库做 API 契约分析,Founder 把 sumai clone 到 `/Users/kaisbabybook/WeChatProjects/xuhua-wx/sumai/`。
- **策略**:
  - `sumai/` 是**独立 git 仓库**(保留自己 `.git/`)
  - xuhua-wx 的 `.gitignore` 已排除 `/sumai/`,避免嵌套 commit
  - sumai 的改动各自 push 到 sumai repo
  - xuhua-wx 的改动 push 到 `shunshunyue/xuhua-wx`
- **影响**:
  - Backend agent 白名单扩展到 `sumai/**`(一个 Backend 管全栈)
  - Tester agent 测试范围扩展到 sumai 后端 + xuhua-wx 前端
  - 所有 Claude Code agent 可 Read sumai 代码,但 **.env 等敏感文件不读**

### D008 - Coordinator 兼任 PM Lead(subagent 层级限制)
- **决策者**: Founder
- **日期**: 2026-04-24
- **背景**: 实测发现 subagent 不能再 spawn 子子 agent。原 xhteam skill 设计"PM 作为 subagent 再 spawn teammates"不可行。
- **新架构**:
  ```
  Founder (你)
      ↓
  Coordinator + PM Lead (主会话 Opus 4.7)
     - 战略把关(Coordinator 原职)
     - 规划 / 拆解 / spawn teammates / 审查(PM 原职)
      ↓
  Teammates (subagents 一级,不能再 spawn)
     - @backend / @frontend / @tester / @devops / @resonance
  ```
- **影响**:
  - `.claude/agents/pm.md` 的"PM 作为独立 Lead"部分调整为"PM 是思维框架,由主会话承担执行"
  - xhteam skill 的"PM 作为 Agent Team Lead"由主会话(Coordinator)履行
  - 实际 spawn / 审查 / 修复循环都在主会话里完成
- **保留**: pm.md 的产品决策视角、需求过滤器、Beachhead 把关等职责仍然是 PM 角色的核心(主会话以 PM 视角工作时遵循)

---

(新决策往下追加)

### D009 - GitHub 前端仓库迁移到 kaiangel/prefaceai(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: 复用 Founder 个人账号下旧仓库 `kaiangel/prefaceai`(之前存微信小程序旧代码,决定清空复用),不继续用 `shunshunyue/xuhua-wx`
- **执行**: `git remote set-url origin git@github.com:kaiangel/prefaceai.git && git push -u origin main --force`(覆盖旧代码)
- **结果**: xuhua-wx 本地 main HEAD `722bcd4` 已 push,远程 main 指向此 commit

### D010 - 通义万相方案 Y + 下架 hunyuan(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: 查证发现前端 wanxiang 按钮调 `/wanxiangStream`(不存在)→ 404;前端 hunyuan 按钮调 `/hunyuanStream`(实际是通义万相 2.2 的 system prompt — 命名错位)
- **决策**: 方案 Y(后端规范化)+ 下架 hunyuan
  - sumai 新建 `/wanxiangStream`(复制 `/hunyuanStream` 实现)
  - sumai 可删 `/hunyuanStream`(hunyuan 前端下架后无调用)
  - 前端删除 hunyuan 按钮相关配置(modelNames / modelDescriptions / baseEndpoints)
- **理由**: 用户说 hunyuan 没在用 + 保留通义万相(真实体现合规境内模型聚合)
- **状态**: Wave 2 实施

### D011 - Qwen 差异化:免费用 Flash 3.6 / Pro 用 Plus 3.6(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **背景**: Session 2 发现 "qwen-plus-latest Pro 和免费仅 max_tokens 不同" 差异化弱
- **决策**:
  - 免费用户: `qwen3.6-flash-2026-04-16`(更快、更便宜、阶梯定价,2 元起/百万 tokens)
  - Pro 用户: `qwen3.6-plus-2026-04-02`(编程能力对标 Claude Opus 4.5,1M context)
  - max_tokens 保持不变(Pro=8630 / 免费=4096)
- **结果**: 真实产品差异化(模型不同 + max_tokens 不同)+ 合规(全 Qwen 境内)+ 成本可控
- **执行**: Wave 1 @backend 已完成

### D012 - Stage 1 启动方式:方案 B 并行(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **决策**: Stage 1 前端先行(UX 不依赖后端)+ 后端 system prompt 等 RED-001 迁移完成再改
- **理由**: 避免在 Claude + Qwen 两套 prompt 上都加 complexity 档,效率最高
- **执行**: Wave 1 @frontend 已完成前端部分;Wave 2 补后端 complexity 三档

### D013 - 红色警报 RED-001/002/003 处理:方案 B 并行(Session 3)
- **决策者**: Founder
- **日期**: 2026-04-24 Session 3
- **决策**: Stage 1 开工同时,背景处理红色警报,不串行
- **理由**: Stage 1 纯前端 UX 改动不依赖 sumai,可并行
- **状态**: RED-001 大部分完成(Wave 1);RED-002/003 Wave 2 + Founder 外部操作

---

(新决策往下追加)

---

## D014 · 微信支付商户证书暂不轮换(2026-04-24 Session 3)

**背景**: RED-003 发现 sumai/cert/apiclient_cert.p12 + apiclient_key.pem + TLS 证书已 commit 进 git 历史,PM 建议轮换。

**Founder 决策(2026-04-24 晚)**:
- **微信支付商户证书**: **暂不轮换**。当前付费用户仅几十人,有 SSH 访问权的人 Founder 确认可信(仅 Founder 本人 + Co-founder)。风险可接受。
- **TLS 证书**(duyueai.com / api.xuhuaai.com / prefaceai.net): **先记录到 PENDING.md,回头再做**。轮换简单无审核,但也非紧急。

**后续触发条件(轮换)**:
- 付费用户超 500 人,或
- 发现异常交易 / 证书被意外共享 / SSH 密钥泄露,或
- Stage 2+ 对外开放更多协作者前

**影响**:
- RED-003 外部任务排期:优先级降为 P3(原 P0)
- `git-filter-repo` 仍然可以做(清历史 + 把证书永远移出 git),但不再阻塞 Wave 2

---

## D015 · Wave 2 执行策略(2026-04-24 Session 3)

**决策**:
- 后端任务**串行**(方案 A):@backend 一个 teammate 依次做,避免文件冲突
- 执行顺序(4 轮):
  - Round 1(并行):@backend W2-1 RED-002 + @tester 基线测试 + @devops env 迁移指南草稿
  - Round 2(串行接力):@backend W2-5 TOCTOU + W2-2 方案 Y(合并)+ @frontend W2-3 前端路由核查 + @devops 指南定稿
  - Round 3(收尾):@backend W2-4 Stage 1 complexity 三档 + @tester W2-6 全量回归
- hunyuan 前端确认:Founder 说前端本就无 hunyuan 选项,W2-3 降级为"核查 pages/index/index.js 路由表"


---

## D016 · complexity 三档命名采用 quick/standard/professional(2026-04-24 Session 3 Wave 2 Round 1)

**背景**: @tester 在 Round 1 发现命名冲突:
- 前端 `pages/index/index.js:247-251` `complexityOptions` 实际 id: `quick / standard / professional`
- 旧 sumai `tests/test_sse_complexity_routing.py`(Stage 1 前占位): `quick / deep / professional`
- CLAUDE.md L375-380 描述中文"快速想法 / 深度创作 / 专业项目"(未明确英文 id)

**决策**: 采用 **`quick / standard / professional`**。
- 理由:以前端上线代码为准,前端已经在用户侧用起来,改前端成本更大
- `standard` 语义普适,避免与"deep thinking / reasoning"概念混淆
- 与 Wave 1 @frontend context-for-others 交接文档一致

**后续动作**:
- @backend W2-4 严格按 `quick / standard / professional` 实施
- @tester Round 2 合并或删除旧 `test_sse_complexity_routing.py`(含 deep 命名),避免双份维护
- `test_complexity.py` 已用 standard,Round 3 激活


---

## D017 · Stage 1 三档复杂度功能下架(2026-04-28)

**背景**:
- Stage 1 三档复杂度(快速想法 / 深度创作 / 专业项目)在 Wave 1 上线 UI + Wave 2 R3-A 上线后端 directive
- PM 报告 Founder 三个用户视角问题:standard 档空字符串=形同虚设;quick/professional 是软建议非硬约束;professional 末尾固定追加句让用户复制粘贴尴尬
- Founder 完成 5 人 Mom Test + Sean Ellis 40% 数据回来后,直接判断"鸡肋"

**决策**:
- 立即下架 Stage 1 三档复杂度
- 前端:删 complexity-selector + complexity-options + complexity-hint(WXML/WXSS/JS 三处)
- 后端:删 COMPLEXITY_DIRECTIVES dict + resolve_complexity 函数 + 端点内 directive 注入(stream.py + stream_en.py 31 端点)
- 测试:test_complexity.py 删除 + test_sse_is_pro_branch 内任何 complexity 相关断言清理
- 文档:KNOWN_ISSUES + PENDING + PROJECT_STATUS 同步标记 Stage 1 三档已下架

**保留**:
- Hero 文案"专业创作者的 AI Prompt 工作台"保留(定位文案是有效的,只是三档实施鸡肋)
- D016 命名决策记录保留(历史档案)

**为什么不"留着但改进"**:
- standard 档要"加点温和调整"+ quick 加 max_tokens 硬限制 + professional 去尾注 — 这是 "1 个鸡肋功能 + 3 个 patch" 反而增加技术债
- Stage 2 Investment 路径(Project / 版本 / 知识库)才是真正护城河,不该把工程精力浪费在 Stage 1 patch 上

---

## D018 · Stage 2 启动:第一个最小 Investment 补丁(2026-04-28)

**背景**:
- Session 1 战略文档明确 Stage 2(Week 3-6)是"最小 Investment 补丁"
- 5 人 Mom Test 数据 + Sean Ellis 40% 验证"复杂任务 beachhead"假设成立
- PM 推荐 3 个候选方案(Project 容器 / 上下文注入 / 知识库),按"轻 → 重"排序

**决策**:
- 先做 **C 方案 · 上下文注入(Conversational Refinement)**
- 工作量预估 3-5 天
- 既验证 Hooked 框架 Investment 阶段补丁的核心假设,又不引入 DB schema 大改

**为什么先做 C 不做 Project / 知识库**:
- C 是"低成本 Investment 验证":不动数据库 schema(只用现有 prompt_base + 上下文 chain),前端 UI 加一个按钮
- 如果 C 数据(用户点击率 + 二次优化转化率)好,再做 Project 容器(2-3 周)
- 如果 C 数据差,说明 Investment 路径假设需要重审,损失小

**待 Founder 拍板**:
- 是否同意先做 C
- C 的具体产品形态(按钮叫什么 / 上下文注入 system prompt 怎么写)


---

## D018a · Stage 2 C 方案产品细节(2026-04-28 Founder 拍板)

**承接 D018**,产品细节最终确认:

1. **按钮文案**:「✨ 基于此继续优化」
2. **迭代次数上限**:**3 轮**(不是 5 轮)
3. **上下文 system prompt 写法**(PM 草稿采纳):

```
【上下文】用户上一轮已得到的 prompt 是:
{上一轮 output}

现在用户希望基于此继续优化。请保留有效部分,
根据用户新的输入做改进/补充/调整。
```

4. **配额**:每轮迭代消耗 1 次用户 quota(免费 6 次/天 + Pro 不限)— 与初次生成等价

