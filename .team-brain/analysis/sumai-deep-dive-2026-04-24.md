# Sumai 后端深度研读报告

> **来源**: Explore Agent (Sonnet 4.6) 于 2026-04-24 Session 2 产出
> **范围**: `/Users/kaisbabybook/WeChatProjects/xuhua-wx/sumai/`(clone 自 101.132.69.232:/home/git/sumai.git,部署到 https://www.duyueai.com)
> **用途**: Backend agent / Tester agent 的深度参考,以及 Stage 1 / 1-N 启动前的基线认知
> **备注**: 原报告 7000+ 字,本文件为完整归档;精华要点已提炼到 `.team-brain/knowledge/KNOWN_ISSUES.md` 和 `CLAUDE.md`

---

## 1. Quick Summary(Executive Summary)

sumai 是一个基于 **Python + Flask** 构建的单体后端服务,代码量极大(主文件 `mainv2.py` 共 3242 行,`stream.py` 2051 行,`stream_en.py` 8271 行),部署在裸机服务器 `101.132.69.232`,通过域名 `https://www.duyueai.com` 对外服务。核心产品是**"序话"提示词炼金术**——将用户输入通过 SSE 流式输出优化后的 AI 提示词,支持"文生文"(推理/Agent/通用 prompt)、"生图"(DALL-E/Flux/Midjourney)、"生视频"(可灵/Runway/即梦/Luma)等多种模型类型。

目前接入了两家 LLM 提供商:**Anthropic(Claude)** 和**阿里云通义千问(Qwen,通过 DashScope)**,均以硬编码 API Key 存在于代码文件中,无任何 `.env` 或配置管理,**是当前最高优先级安全隐患**。前端(微信小程序)调用后端的 `/wanxiangStream` 端点在 sumai 中**不存在**,是一个已知的孤儿调用。

---

## 2. 技术栈与目录结构

### 技术栈

| 层次 | 技术选型 |
|------|----------|
| 语言 | Python 3.10/3.11 |
| 框架 | Flask 3.0.2 + Flask-SocketIO 5.3.6 |
| 数据库 | MySQL(mysql-connector-python 8.3.0 和 mysqlclient 2.2.4 直连,无 ORM) |
| 缓存 / 队列 | Redis(host: 101.132.69.232,通过 rpush/lpop 实现简单队列) |
| 存储 | 阿里云 OSS(oss2,bucket: shangd-prod,CDN: cdn.duyueai.com) |
| AI SDK | anthropic==0.21.3, openai==1.14.2 |
| 支付 | wechatpayv3,stripe |
| 模板引擎 | Jinja2 |
| 其他 | python-dotenv==1.0.1(已装但未用),requests,beautifulsoup4,selenium,redis |
| WSGI | Supervisor 4.1.0 管理进程,端口 5000 |
| 反向代理 | 推测 Nginx(有 TLS 证书目录 `cert/`,无 nginx.conf 在仓库中) |
| CI/CD | 无任何 CI 配置 |

### 目录结构

```
sumai/
├── mainv2.py              # 主 Flask 应用,3242 行,注册蓝图,含所有主路由
├── stream.py              # 蓝图:中文版 SSE 流式端点,2051 行
├── stream_en.py           # 蓝图:英文版 SSE 流式端点,8271 行(最大文件)
├── note.py                # 蓝图:Redis 队列读写(内部运营用)
├── third_party_login.py   # 蓝图:Google 第三方登录
├── pay_stripe.py          # 蓝图:Stripe 境外支付
├── config.py              # 仅含一个空格,实际没有任何配置
├── requirements.txt       # Python 依赖清单
├── app.py_back            # 旧版本备份文件(废弃)
├── bigmodel/              # 各任务模块(bigmodel 版),含 prompt.py / prompt_pro.py
│   ├── prompt.py
│   └── prompt_pro.py
├── deepseek/              # DeepSeek 版模块(已废弃,当前指向 Qwen)
│   └── prompt.py
├── claude.py              # 旧版 Anthropic 调用封装(非主路由)
├── claude_*.py            # 各类型旧版 Claude 调用(历史文件)
├── moonshot.py            # Kimi(moonshot-v1-8k)调用封装(非主路由)
├── monitor_*.py           # 各类后台消费监控脚本
├── reset_used_num_job.py  # 定时重置用户次数
├── cert/                  # 🚨 TLS 证书目录(含微信支付证书,已提交到 git)
│   ├── www.duyueai.com.{key,pem}
│   ├── api.xuhuaai.com/
│   └── apiclient_*.pem
├── static/                # 静态文件
├── templates/             # Jinja2 HTML 模板
└── api_doc.md             # 简要接口文档(仅覆盖 history/favorite/unfavorite)
```

### 启动方式

```python
# mainv2.py 底部
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

生产环境通过 **Supervisor** 管理进程,配合 Nginx 反向代理。

---

## 3. API 端点完整清单

### 3.1 mainv2.py 主路由(30+ 端点)

| URL | 方法 | 核心入参 | 行号 | 说明 |
|-----|------|---------|------|------|
| `/code2session` | POST | `{"code": "..."}` | 1719 | **微信小程序登录** |
| `/userinfo` | POST | `{"openid": "..."}` | 1769 | **获取用户 Pro 状态 / remaining_count** |
| `/history` | GET | `openid`, `page`, `keyword` | 1999 | **历史记录列表(分页)** |
| `/history/detail` | GET | `share_id` | 2063 | **历史记录详情** |
| `/revoke_history` | POST | `openid`, `content` | 2105 | 撤回历史记录 + 退还次数 |
| `/favorite` | POST | `{"openid", "prompt_id"}` | 2150 | **收藏** |
| `/unfavorite` | POST | `{"openid", "prompt_id"}` | 2185 | **取消收藏** |
| `/my_favorites` | GET | `openid`, `page`, `keyword` | 2220 | 我的收藏列表 |
| `/labelSync` | POST/GET | `openid`, `sync_type`, `sync_key`, `sync_data` | 2286 | 🟡 半成品(POST=假成功,GET=404) |
| `/upload_image` | POST | multipart `file` | 3200 | **上传图片到阿里云 OSS** |
| `/update_user_info` | POST | `openid`, `nickname`, `headimgurl` | 3076 | 更新用户头像/昵称 |
| `/order_prepay` | POST | `openid`, JSON body | 1883 | **小程序下单** |
| `/notify_mini` | POST | 微信回调 body | 1940 | 微信支付回调(小程序) |
| `/pay_jsapi` | GET | `skuid` | 581 | JSAPI 支付下单(PC) |
| `/login` / `/callback` / `/logout` | GET | — | 397+ | PC 微信扫码登录流程 |
| `/login2` / `/callback2` | GET | — | 483+ | 公众号 JS 登录 |
| `/auth/wx/qrconnect` / `/auth/wx/callback` / `/auth/wx/check` | GET | — | 2341+ | PC 扫码登录 |
| `/xuhua_js` / `/xuhua_js_callback` / `/xuhua_pay*` | GET/POST | — | 2659+ | 序话公众号 JS / 支付流程 |
| `/upload_image_local` | POST | multipart `file` | 3149 | 上传图片到本地(备用) |
| `/tool` | GET | — | 1641 | APK 下载 |
| `/getKeyWords` | GET | — | 1709 | 获取关键词(通过 Redis) |
| `/botCallbackMini` | POST/GET | 复杂 form | 875 | 旧版生成回调(非主路由) |
| `/streamTest*` | GET | — | 988+ | 内部测试端点 |

### 3.2 stream.py 蓝图 — 中文版 SSE 端点(15 个)

所有端点支持 POST(form-data)和 GET(query string),核心参数:`openid`、`content`、`style`。

| URL | 行号 | 模型 | 类型标记 | 说明 |
|-----|------|------|---------|------|
| `/botPromptStream` | 24 | Claude | 文生文 / 通用模型 | **主力文生文端点** |
| `/botPromptStreamBak` | 135 | Claude | 文生文 | 备用版本 |
| `/reasoningStream` | 242 | Claude | 文生文 / 推理模型 | 推理提示词 |
| `/aiAgentStream` | 350 | Qwen | 文生文 / AI智能体 | **合规路径**(Qwen) |
| `/dalleStream` | 457 | Claude | 生图 / DALL-E | |
| `/fluxStream` | 565 | Claude | 生图 / FLUX | |
| `/midjourneyStream` | 673 | Claude | 生图 / Midjourney | |
| `/kelingStream` | 781 | Claude | 生视频 / 可灵 | |
| `/runwayStream` | 888 | Claude | 生视频 / Runway | |
| `/hunyuanStream` | 995 | Qwen | 生视频 / 混元 | **合规路径**(Qwen) |
| `/jimengpicStream` | 1104 | Claude | 生图 / 即梦 | |
| `/jimengvidStream` | 1213 | Claude | 生视频 / 即梦 | |
| `/lovartpicStream` | 1320 | Claude | 生图 / Luma | |
| `/lovartvidStream` | 1428 | Claude | 生视频 / Luma | |
| `/sora2Stream` | 1537 | Claude | 生视频 / Sora | |
| `/describeImageStream` | 1643 | Qwen(qwen3-vl-plus) | 图生文 / 识图 | **图生 prompt,合规**(Qwen vision) |

### 3.3 stream_en.py 蓝图 — 英文版 SSE 端点

完全镜像 stream.py,用英文 system prompt:`/botPromptStreamEN`、`/reasoningStreamEN`、`/aiAgentStreamEN` 等 15 个端点。

### 3.4 pay_stripe.py 蓝图

| URL | 方法 | 说明 |
|-----|------|------|
| `/create-session` | POST | Stripe Checkout Session 创建 |
| `/webhook` / `/webhook2` | POST | Stripe 支付回调 |
| `/stripe_pay` | GET | Stripe 支付页面 |

### 3.5 note.py 蓝图(内部 Redis 队列)

`/getNoteData`、`/getNoteData2`、`/addNoteData`、`/addNoteData2`、`/getNoteZQ`、`/addNoteZQ` 等(运营内部使用)。

### 3.6 third_party_login.py 蓝图

| URL | 方法 | 入参 | 说明 |
|-----|------|------|------|
| `/user/3th-login` | POST | `{"3th_id", "email", "origin"}` | Google 第三方登录(境外 Web) |

---

## 4. System Prompt 配置(Stage 1 关键)

### 4.1 当前 system prompt 存放位置

**全部硬编码在代码中,以 Python 字符串字面量形式存在**。无数据库存储,无配置文件,无 Jinja / f-string 模板系统。

| 文件 | 位置 |
|------|------|
| `stream.py` | 各 `generate()` 函数内部,`system = "..."` |
| `stream_en.py` | 同上 |
| `deepseek/prompt.py` | `conversation_call()`(非主路由) |
| `bigmodel/prompt.py` | 函数内(非主路由) |
| `claude_*.py` | 旧版历史文件 |

### 4.2 按 model_type / style 的路由

**第一层:端点选择(前端决定)**
前端通过调用不同 URL 决定 model_type:
- `/botPromptStream` → 文生文 / 通用模型
- `/reasoningStream` → 文生文 / 推理模型
- `/aiAgentStream` → 文生文 / AI智能体
- `/dalleStream` → 生图 / DALL-E
- 等等

**第二层:style 参数路由(在每个 generate() 内)**

```python
style = data.get('style', '').strip().lower()
if style == 'fun':
    if is_pro == 1:
        system = "..."  # 有趣-Pro 版
    else:
        system = "..."  # 有趣-免费版
if style == 'juicy':
    ...  # 有料-Pro / 有料-免费
# 默认("" 或 'practical'):使用预设 system
```

**style 取值枚举**:
- `""` / `"practical"` → 有用(默认)
- `"fun"` → 有趣
- `"juicy"` → 有料

**is_pro 二值**:
- `is_pro=0`(免费):较短、较简单
- `is_pro=1`(Pro):较长、更结构化

### 4.3 Stage 1 新增 `complexity` 参数的改动评估

**改动文件**:
- `stream.py`:每个 `generate()` 函数添加 `complexity` 读取 + "专业项目" if 分支,约 15-16 处
- `stream_en.py`:同上,约 14 处
- `mainv2.py`:无需(参数通过 query string 透传)

**改动模式**:
```python
style = data.get('style', '').strip().lower()
# 新增
complexity = data.get('complexity', 'quick').strip().lower()
# 在 if style == ... 内新增
if complexity == 'professional':
    system = PROFESSIONAL_SYSTEM_PROMPT
```

**整体规模评估**: **中等偏大**
- 15 个中文端点 × 3 style × 2 is_pro = 90 处 system prompt 分支
- 新增专业档 = 再加 15-16 个字符串常量
- **建议先提取为外部文件**(如 `prompts.py`),再统一加 complexity 分支

---

## 5. 境内 LLM 集成现状

### 5.1 当前接入的模型

| 提供商 | 模型 | 调用方式 | API Key 位置 | 用于端点 |
|--------|------|----------|-------------|---------|
| **阿里云通义千问** | `qwen-plus-latest`(对话)、`qwen3-vl-plus`(视觉) | OpenAI SDK,`base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"` | `stream.py` L1919,`deepseek/prompt.py` L21 | `/aiAgentStream`、`/hunyuanStream`、`/describeImageStream` + EN 版 |
| **Anthropic(Claude)** | `claude-haiku-4-5`(主力),`claude-3-haiku-20240307`(旧) | Anthropic Python SDK | `stream.py` L2040,`stream_en.py` L8259,`claude.py` L21 | 其他 12+ 个端点 |
| **Kimi(Moonshot)** | `moonshot-v1-8k` | OpenAI SDK 兼容 | `moonshot.py` L11 | **未接入主路由** |

### 5.2 境内合规 ≠ 完全合规

- **Anthropic(Claude)是境外服务商**,API Key 硬编码在 `stream.py` 和 `stream_en.py`,**主力模型**
- 这和 D006 决策"多模型限定中国大陆境内"**冲突**
- 虽然 `test_architecture.py` 检查前端代码无境外端点(通过),但**后端实际在调境外 API**
- **需迁移到 Qwen Flash 3.6 等合规模型**(见 KNOWN_ISSUES.md RED-001)

### 5.3 API Key 文件清单(不含具体值)

| 文件 | 变量/位置 | 提供商 |
|------|-----------|--------|
| `stream.py` L1919 | `api_key=` 内联 | Qwen |
| `stream.py` L2040 | `api_key=` 内联 | Anthropic |
| `stream_en.py` L8259 | `api_key=` 内联 | Anthropic |
| `claude.py` L21, L51 | `api_key=` 内联 | Anthropic(旧) |
| `deepseek/prompt.py` L21 | `api_key=` 内联 | Qwen |
| `deepseek/ins.py` L23 | `api_key=` 内联 | Qwen |
| `moonshot.py` L11 | `api_key=` 内联 | Kimi(未接入) |
| `mainv2.py` L3190-3191 | `OSS_ACCESS_KEY_ID`,`OSS_ACCESS_KEY_SECRET` | 阿里云 OSS |
| `pay_stripe.py` L12-13 | `STRIPE_SECRET_KEY`,`STRIPE_PUBLIC_KEY` | Stripe |
| `mainv2.py` L81 | `"password":` 内联 | MySQL |
| `mainv2.py` L2329 | `REDIS_PASSWORD` | Redis |
| `mainv2.py` L59/65/72 | `APP_SECRET`,`XUHUA_APP_SECRET`,`APP_SECRET_GH` | 微信 AppSecret |
| `mainv2.py` L93/96 | `CERT_SERIAL_NO`,`APIV3_KEY` | 微信支付 |

### 5.4 新增境内 LLM 的改动规模

**例如新增智谱 GLM 或百度文心**:
- `stream.py` 添加 `get_zhipu_client_and_config()` 约 15 行
- 每个需要支持的端点新增路由(复制最近似端点),约 130-200 行
- `mainv2.py` 无需改动(蓝图自动注册)

**估计: 新增一个 LLM ≈ 200-400 行新代码,改动 1 个文件(`stream.py`)**

---

## 6. 敏感文件清单(不含具体值)

### 6.1 .env 状况

- **不存在任何 `.env` / `.env.example`**
- `.gitignore` 正确排除了 `.env` 模式
- **但代码中不使用 `python-dotenv`**,所有凭证直接硬编码

### 6.2 含敏感信息的文件

| 文件 | 敏感信息类型 |
|------|-------------|
| `mainv2.py` | MySQL 密码、Redis 密码、微信 AppID/AppSecret(多个)、微信支付 MCHID/证书序列号/APIV3_KEY、OSS AccessKey |
| `stream.py` | Anthropic / Qwen API Key |
| `stream_en.py` | Anthropic API Key |
| `claude.py` | Anthropic API Key(旧) |
| `deepseek/prompt.py` + `deepseek/ins.py` | Qwen API Key |
| `moonshot.py` | Kimi API Key |
| `pay_stripe.py` | Stripe 生产密钥、MySQL 密码 |
| `third_party_login.py` | MySQL 密码 |
| `note.py` | Redis 密码 |
| `cert/apiclient_key.pem` | 🚨 微信支付商户私钥(生产) |
| `cert/apiclient_cert.p12` | 🚨 微信支付商户证书(P12) |
| `cert/www.duyueai.com.key` | 🚨 域名 TLS 私钥 |
| `cert/api.xuhuaai.com/*.key` | 🚨 序话域名 TLS 私钥 |

### 6.3 .gitignore 覆盖情况

- ✅ 排除: `.env`、`venv/`、`__pycache__/`、`.idea/`、`.DS_Store`、`*.log`
- ❌ **未排除**: `cert/` 目录 / `*.pem` / `*.key` / `*.p12`
- **结果**: 生产证书 + 微信支付私钥已进 git 历史(严重安全事件)

---

## 7. 测试套件评估

### 7.1 现有测试

仓库中 `*_test.py` 文件**全部是手动 print 脚本,不是标准测试**:

| 文件 | 实际内容 |
|------|----------|
| `base_tj_test.py` | 直接 call + print |
| `claude_0_test.py` | 同上 |
| `deepseek/*_test.py` | 同上 |
| `bigmodel/*_test.py` | 同上 |
| `black_words_test.py` | 同上 |

- **无 pytest / unittest** 结构(没有 `def test_*()` / `class Test*`)
- **无 CI 配置**(无 `.github/workflows/`)
- **无 API 集成测试**

### 7.2 建议的测试骨架(优先级)

1. **`test_endpoints.py`**: 用 Flask `app.test_client()` 测核心端点
   - `/code2session` / `/userinfo` / `/favorite` / `/unfavorite` / `/labelSync` / `/upload_image`
2. **`test_stream_validate.py`**: 测 `validate_request_and_user()` 边界条件
3. **`test_history_api.py`**: 测 `/history` 分页、搜索、筛选
4. **`test_payment_flows.py`**: 测 `/order_prepay` / `/notify_mini` 流程(含模拟回调)
5. **`test_stream_prompt_generation.py`**: 测 SSE 端点的流式产出结构(参数校验、style 路由、is_pro 分支)
6. **`test_compliance.py`**: 新增 — 检查代码里不出现 `api.openai.com` / `api.anthropic.com` 等境外端点(合规红线)

推荐 stack: `pytest` + `pytest-flask` + `unittest.mock`(不需要真实数据库连接)

---

## 8. 部署运维

### 8.1 部署方式

**裸机部署**,无 Docker,无 K8s,无 Serverless。

- 服务器: `101.132.69.232`(阿里云 ECS,上海)
- OS: Ubuntu 20.04
- Python: 3.10 / 3.11
- 进程管理: **Supervisor 4.1.0**
- 日志: `/home/www/sumai/demo.log`
- 上传目录: `/home/www/sumai/uploads`

### 8.2 Nginx / 反向代理

- 有 TLS 证书(`cert/www.duyueai.com.{key,pem}`,`cert/api.xuhuaai.com/`)
- **无 Nginx 配置在仓库中**
- 域名: `www.duyueai.com`、`api.xuhuaai.com`、`www.prefaceai.net`(境外)

### 8.3 日志 / 监控

- Flask 内置 logging → `/home/www/sumai/demo.log`
- **无 Sentry / Prometheus / APM**
- **无日志轮转配置**

### 8.4 部署流程

推测: `git pull` + `supervisorctl restart`。**无自动化 CI/CD**。

---

## 9. 前后端契约一致性检查

### 9.1 前端调用 → 后端存在

| 前端调用 | 后端状态 |
|---------|---------|
| `/code2session` | ✅ 存在 |
| `/userinfo` | ✅ 存在 |
| `/history` / `/history/detail` | ✅ 存在 |
| `/favorite` / `/unfavorite` / `/my_favorites` | ✅ 存在 |
| `/labelSync` | 🟡 存在但半成品 |
| `/order_prepay` | ✅ 存在 |
| `/upload_image` | ✅ 存在 |
| `/update_user_info` | ✅ 存在 |
| `/botPromptStream` | ✅ 存在 |
| `/reasoningStream` | ✅ 存在 |
| `/aiAgentStream` | ✅ 存在 |
| `/dalleStream` / `/fluxStream` / `/midjourneyStream` | ✅ 存在 |
| `/hunyuanStream` / `/kelingStream` / `/runwayStream` | ✅ 存在 |
| `/jimengpicStream` / `/jimengvidStream` | ✅ 存在 |
| `/lovartpicStream` / `/lovartvidStream` | ✅ 存在 |
| `/sora2Stream` | ✅ 存在 |
| `/describeImageStream` | ✅ 存在 |
| `/recent_generation` | ⚠️ **不存在**(孤儿) |
| `/wanxiangStream` | ⚠️ **不存在**(孤儿,影响通义万相功能) |

### 9.2 后端有但前端未调用(Stage 2/3 可能用到)

- `/revoke_history`、`/botPromptStreamBak`、`/test123`
- 所有 `*EN` 后缀端点
- PC Web 端点(`/login` / `/auth/wx/...` / `/xuhua_*`)

### 9.3 参数名 / 契约隐患

| 点 | 现状 | 风险 |
|---|------|------|
| `describeImageStream` 传参 | 前端 GET query,后端支持 GET/POST | GET 大 URL 长度限制风险 |
| `labelSync` GET | 前端期望返回数据,后端恒返 404 | 功能未完成,跨设备同步靠 /history |
| `favorite` prompt_id 类型 | 前端 `formatPromptId()` 转换,后端 SQL `%s` 参数化 | 低风险 |
| `upload_image` multipart | 前端 `wx.uploadFile` 参数名 `file`,后端 `request.files['file']` | ✅ 匹配 |

---

## 10. 结论与建议(Top 10 Backend Agent 必知事实)

1. **主入口是 `mainv2.py`,不是 `main.py`**(`main.py` 是旧版)。Flask app 在 L44 创建,蓝图注册在 L47-52
2. **SSE 流式核心在 `stream.py`(中文)和 `stream_en.py`(英文)**,每个端点独立 Flask 路由 + 内部 `generate()` 生成器
3. **System prompt 全部硬编码,无外部存储**。每端点 × 3 style × 2 is_pro = ~90 个独立字符串
4. **当前后端模型只有两家**:Anthropic Claude(`claude-haiku-4-5`,主力)和 Qwen(`qwen-plus-latest`/`qwen3-vl-plus`,用于 Agent/混元/识图)。Kimi 已有代码未接入
5. **数据库是 MySQL,无 ORM**。核心表:`p_user_base`(新版)、`prompt_base`(历史)。注意 `p_user_base` ≠ `user_base`(老版已废)
6. **所有凭证硬编码,没有 .env**,`python-dotenv` 装了没用 — 最高优先级安全债务
7. **`/labelSync` 半成品**:POST 假成功,GET 恒 404。跨设备同步实际靠 `/history` 带的 style 字段
8. **`/wanxiangStream` 孤儿**:前端调用后端没实现,通义万相功能生产环境是坏的
9. **用户鉴权在 `validate_request_and_user()`**:`stream.py` L1753,支持 3 种 openid 字段(`openid`/`openid_pc`/`openid_js`),Google 用户 `origin='google'`
10. **部署: 裸机 + Supervisor + Nginx**,无 Docker 无 CI/CD。`git pull` + `supervisorctl restart` 即部署

---

**报告来源**: Explore Agent (Sonnet 4.6) 2026-04-24 Session 2  
**下次刷新建议**: 重大重构后 / 每 3 个月一次
