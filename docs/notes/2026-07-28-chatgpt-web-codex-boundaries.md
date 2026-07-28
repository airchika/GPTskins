# ChatGPT 网页改造成 Codex 式客户端：能力边界

日期：2026-07-28

## 结论

浏览器扩展可以大幅重做 ChatGPT 的本地界面，也可以通过 DOM 自动填入问题、读取页面上已经显示的回答。但这不等于拥有 Codex：

- 网页扩展控制的是页面表现和浏览器允许的交互。
- Codex 的核心是网页以外的本地代理：文件系统、Shell、工具循环、审批、沙箱、会话和变更追踪。
- 把 ChatGPT 网页内部接口当成自制 API 并不合适：接口未公开、随时会变化，而且个人版现行使用条款禁止自动或程序化抽取数据或输出。

## 三种实现路线

### 1. 在 `chatgpt.com` 上继续扩展 GPTskins

适合主题、布局、快捷键、辅助面板、消息标记和用户主动触发的页面增强。

限制：

- 只能改本机看到的 DOM/CSS，不能改变服务端模型、隐藏指令、账号配额或可用工具。
- ChatGPT 页面结构和私有网络接口不是稳定 API。
- 浏览器内容脚本不能任意读取本机文件或启动 PowerShell。

### 2. 自动操作 ChatGPT 网页

技术上可以用扩展或浏览器自动化提交问题并观察流式回答，但不应作为正式后端：

- 登录 Cookie、CSRF、风控和私有流式协议都可能变化。
- 自动抽取回答涉及现行条款限制。
- ChatGPT 订阅不是通用 API 套餐；官方 API 单独计费和管理。

### 3. 做自己的 Codex 客户端

这是更正确的方向。官方 Codex `app-server` 本来就是为富客户端和深度集成提供的接口，支持：

- ChatGPT OAuth / device-code 登录或 API key；
- thread、turn、流式 agent event 和历史记录；
- 审批、沙箱、命令执行、文件系统；
- skills、plugins、MCP 和配置。

前端可以是浏览器页面、扩展侧栏或桌面壳，但应由本机 `codex app-server` 提供受控的本地能力。若从普通网页连接本机服务，还需要严格处理 Origin、认证、端口暴露和权限范围。

另一条正式路线是 OpenAI Responses API。它支持有状态会话、内置工具、MCP 和自定义函数，适合从头搭建自己的 agent；其 API 账单与 ChatGPT 订阅分开。

## 真正的工程难点

不是聊天框，而是：

1. 怎样让模型以结构化方式请求工具；
2. 怎样限制可读写目录和可执行命令；
3. 怎样在危险操作前向用户审批；
4. 怎样把工具结果、错误和中断继续送回模型；
5. 怎样保存上下文、压缩历史、展示 diff 并处理并发；
6. 怎样保护 ChatGPT/OAuth 凭据和本机代理。

如果目标只是“完全自定义 Codex 的外观”，优先做 `app-server` 客户端。如果目标只是让 ChatGPT 网页更好用，继续把 GPTskins 保持为页面增强扩展，不承担本地执行和账号自动化。

## 官方资料

- Codex App Server：https://learn.chatgpt.com/docs/app-server
- Codex 沙箱与权限：https://learn.chatgpt.com/docs/sandboxing
- Responses API：https://developers.openai.com/api/docs/guides/migrate-to-responses
- OpenAI 使用条款：https://openai.com/policies/terms-of-use/
- ChatGPT 与 API 分开计费：https://help.openai.com/en/articles/8156019
