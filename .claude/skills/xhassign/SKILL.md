---
name: xhassign
description: 给同事指派任务并开干 — 读取群聊和所有相关文档，理解任务后开始执行
disable-model-invocation: true
allowed-tools: Bash Read Write Edit Grep Glob
argument-hint: [同事角色，如 backend、frontend、tester、devops、resonance]
---

# 同事接活开干

作为指定角色的同事，接收任务并开始执行。

**用法**：先粘贴 PM 派发的任务内容，然后执行 `/xhassign backend`（或其他角色名）

`$ARGUMENTS` 指定当前 Agent 的角色身份。

## 执行步骤

### 1. 确认角色身份

你现在是 **$ARGUMENTS**。以该角色的身份和职责范围来执行后续工作。

### 2. 读取群聊

仔细阅读 `.team-brain/TEAM_CHAT.md`。

**群聊内容通常很长**，需要尽可能读取最新、尽可能多的行数（500-1000 行起），确保不遗漏任何与自己任务相关的上下文。

### 3. 读取所有相关文档

读取所有在群聊中提到的、对应的以及必要的相关文档，包括但不限于：
- 自己的 progress 文件（`.claude/agents/{自己的角色}-progress/`）
- PM 派发的任务描述和验收标准
- 任务涉及的代码文件和技术文档
- 相关的 team-brain 文档

### 4. 确保理解

确认自己完全理解了任务背景、需求、预期产出和验收标准。

**如果有任何困惑或不理解的地方，先提出来，不要带着疑问开干。**

### 5. 开干

理解无误后，开始执行任务。
