# Backend(后端) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24
> 角色: backend

---

## 当前状态

RED-001 迁移完成。sumai 后端已全面切换到 Qwen 3.6，不再调 Anthropic。

## 关键变更（给 @frontend / @tester 看）

### RED-001 完成的变更（stream.py + stream_en.py）

- **模型替换**: 所有 Anthropic `claude-haiku-4-5` 调用已替换为 Qwen 3.6 系列
  - 免费用户：`qwen3.6-flash-2026-04-16`（max_tokens=4096, temperature=0.6）
  - Pro 用户：`qwen3.6-plus-2026-04-02`（max_tokens=8630, temperature=0.6）
- **API 端点**: 全部走 `https://dashscope.aliyuncs.com/compatible-mode/v1`（境内合规）
- **System prompt**: 一字未改，全部保留原始内容
- **SSE 响应格式**: 完全不变（`data: {json}\n\n`），前端无需改动
- **涉及文件**: `sumai/stream.py` 和 `sumai/stream_en.py`

### 重要发现（供参考）

- stream_en.py 原来有 4 个端点（dalleStreamEN/hunyuanStreamEN/runwayStreamEN/kelingStreamEN）调用了不存在的 `get_openai_client_and_config` 函数（已是 bug）。本次迁移通过添加该函数定义修复了此 bug。
- stream.py 的生产端点原来已经使用 Qwen，只有 `/test123`（测试端点）使用 Anthropic，本次已迁移。
- 两个文件中的 `get_claude_client_and_config` 函数定义保留（无调用，死代码），不影响运行。

---

## 上次更新记录

- 2026-04-24: RED-001 完成
- 2026-04-24: 多 Agent 系统初始化
