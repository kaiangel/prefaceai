# DevOps(运维) - 给其他角色的上下文

> 创建日期: 2026-04-24
> 上次更新: 2026-04-24 Session 3
> 角色: devops

---

## 环境状态

| 环境 | 状态 | 最近更新 |
|------|------|----------|
| 本地 xuhua-wx | ✅ 正常 | 2026-04-24 |
| sumai（本地副本） | ✅ 正常，RED-003 staged 待 commit | 2026-04-24 Session 3 |
| 微信开发版 | ✅ 正常 | 2026-04-24 |
| 微信体验版 | — | — |
| 微信正式版 | v0.9.6.8 | — |
| sumai 生产（duyueai.com） | ✅ 运行中 | — |

---

## 配置状态

- settings.json allow 清单: 21 条
- settings.local.json hooks: PreCommit + PrePush 已启用
- GitHub Actions CI: 未启用（Founder 决定，D004）
- sumai/.gitignore: 已更新（RED-003 规则追加，2026-04-24）

---

## sumai git 状态（重要）

**当前 sumai 仓库有 staged 但未 commit 的改动**（Wave 1 RED-003 成果）：

```
Changes to be committed:
  deleted:    .DS_Store
  modified:   .gitignore
  deleted:    bigmodel/.DS_Store
  deleted:    cert/api.xuhuaai.com/api.xuhuaai.com.key
  deleted:    cert/api.xuhuaai.com/api.xuhuaai.com.pem
  deleted:    cert/apiclient_cert.p12
  deleted:    cert/apiclient_cert.pem
  deleted:    cert/apiclient_key.pem
  deleted:    cert/prefaceai.net.key
  deleted:    cert/prefaceai.net.pem
  deleted:    cert/www.duyueai.com.key
  deleted:    cert/www.duyueai.com.pem
  deleted:    deepseek/.DS_Store
  deleted:    static/.DS_Store
```

**等待 PM 审查后由 Founder 执行 commit**。

---

## 待其他 Agent 注意

- **sumai 仓库独立**：改 sumai 代码必须在 `sumai/` 目录下 commit 到 sumai 的 remote（`101.132.69.232:/home/git/sumai.git`），不能 commit 到 xuhua-wx
- **cert/ 不要再往 sumai git 添加任何证书文件**：gitignore 已配置，违反了规则会被拦截
- **commit message 请遵循规范**：feat/fix/chore prefix + 具体内容（见 devops.md）
- **发布前必须跑 pytest**：PreCommit hook 已配置

---

## 发布前 checklist（未变动）

- [ ] git status 干净（无未提交改动）
- [ ] pytest tests/ 全绿
- [ ] @tester 5 关键流程手动回归通过
- [ ] 主包尺寸 < 2 MB
- [ ] project.config.json 版本号已 bump
- [ ] 清理本地 console.log / debug print
- [ ] TEAM_CHAT.md < 3000 行

---

## RED-003 后续（Founder 外部执行）

详见 `sumai/docs/RED-003_git_history_cleanup_guide.md`，关键步骤：

1. commit 当前 staged 改动
2. `git filter-repo` 清历史（破坏性，改写所有 commit hash）
3. force push 到 sumai remote
4. 通知 Co-founder 重新 clone
5. **轮换微信支付商户证书**（最高优先级）
6. 轮换 TLS 证书（duyueai.com / api.xuhuaai.com / prefaceai.net）
