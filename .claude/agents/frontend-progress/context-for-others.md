# Frontend(前端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24 Session 3 Wave 1
> 角色: frontend

---

## 当前状态

✅ **Stage 1 UX 前端先行完成(D012 方案 B)**

---

## 给 @backend 的上下文(Wave 2 核心交接)

### complexity 参数契约

- **参数名**: `complexity`
- **类型**: string
- **enum**: `quick` | `standard` | `professional`
- **透传位置**: `generateContent()` body,和 `style` 同级
- **默认值**: 前端默认选中 `quick`(品牌绿)
- **后端 fallback**: 未收到 complexity → 默认 `standard`

### 三档 system prompt 建议

| 档位 | 设计倾向 |
|---|---|
| **快速想法**(quick)| 精简 system prompt,短 prompt(2-3 段),直给要点 |
| **深度创作**(standard)| 当前默认 system prompt(不动)|
| **专业项目**(professional)| 扩展 system prompt,长 prompt(4-6 段 + 结构化),末尾加"适合保存为项目模板"尾注 |

### 前端已做的视觉暗示

- 专业项目档位选中后:
  - 输入框金色边框
  - 结果卡片金色上边框
  - 右上角 `💎 专业项目` 徽标
  - 小字提示"生成更长、更结构化、更适合沉淀为项目模板的 prompt"
- → 后端实际输出如果没有显著扩展/结构化,用户感知会 mismatch

---

## 给 @tester 的上下文

- `pages/index/index.wxml` 新增 `.complexity-selector` 块
- `pages/index/index.wxss` 新增 ~120 行(rpx 单位 / 无 DOM API / 无 px)
- `pages/index/index.js` 新增 `currentComplexity` / `complexityOptions` / `switchComplexity()`
- **未动 API 层**(`app.js` / `apiRequest` / SSE 流式逻辑)
- 手动回归建议:三档按钮切换 + 专业项目视觉强调(iPhone SE 375px / iPhone 14 Pro Max 428px)

### pages/index/index.js 的 pre-existing 问题

- **含 3038 个 U+00A0(非断空格)**
- Edit 工具字符串匹配多次失败
- 纳入 **GRAY-006**,Stage 2+ 统一清理
- 不影响编译和运行,微信小程序编译器容忍

---

## 给 @devops 的上下文

- 主包增量 < 4 KB(WXSS ~3KB + WXML ~0.5KB + JS ~0.2KB)
- 当前主包约 800 KB,距 2 MB 还有空间
- 零图片进包(纯 emoji 图标)
- rpx 规范通过

---

## 给 @pm 的上下文

- 前端可发布状态:三档选择器 + Hero 升级都可立即上线
- **但不要单独发**:等后端 complexity 三档实施后一起发(避免用户选了"专业项目"但后端输出没区别)
- Sean Ellis 40% 测量依赖 Stage 1 后端就绪,不可过早测量

---

## 给 @resonance 的上下文

- 新 Hero 文案: `"专业创作者的 AI Prompt 工作台"`
- 三档标签可做营销关键词:
  - 🔸 快速想法
  - 🔹 深度创作
  - 💎 专业项目
- 建议 Stage 1 发布后做小红书/公众号投放

---

## Stage 1 后的待做

- 真机验证 iPhone SE / iPhone 14 Pro Max(Founder 外部任务)
- 三档按钮的 tap 区域调试(rpx 单位在不同屏幕的实测)
- 数据埋点(三档点击分布 + 专业项目付费转化率)

---

## 上次更新记录

- 2026-04-24 Session 3 Wave 1: Stage 1 UX 完成,PM 代写
- 2026-04-24: 多 Agent 系统初始化
