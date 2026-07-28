# Voyager 的 LaTeX 可复制源码功能

日期：2026-07-29

检查对象：本机 Edge 中安装的 GPT Voyager `1.7.3`，扩展 ID `ofhnmgjaffpdldimjdenjoneocicolfi`。

## 结论

这项功能不是从 ChatGPT 的流式网络响应中抓取 LaTeX，而是从已经渲染好的页面 DOM 中读取公式携带的隐藏语义源码：

- 首选 `annotation[encoding="application/x-tex"]` 的 `textContent`；
- 备用 `[data-math]` 属性值。

KaTeX/MathML 渲染通常把可视公式与原始 TeX 一起放进 `semantics` 节点。例如页面看见的是排版后的分式，但隐藏的 `annotation` 仍保存 `\frac{a}{b}`。

## 所在文件

扩展目录：

`C:\Users\Administrator\AppData\Local\Microsoft\Edge\User Data\Default\Extensions\ofhnmgjaffpdldimjdenjoneocicolfi\1.7.3_0`

关键文件：

`assets/conversationHook.ts-CDybdVeN.js`

该文件由 `manifest.json` 以 `run_at: document_start`、`world: MAIN` 注入 ChatGPT 页面。使用 MAIN world 是因为它需要覆盖页面实际调用的 Clipboard API。

## 执行过程

1. 扫描 DOM，收集 `application/x-tex` annotation 和 `data-math` 中的 LaTeX。
2. 覆盖 `navigator.clipboard.write` 与 `navigator.clipboard.writeText`。
3. 用户点击 ChatGPT 的复制按钮时，拦截 `text/plain` 和 `text/html`。
4. 根据收集到的原始公式，把复制文本中的行内公式恢复成 `$...$`，块公式恢复成 `$$...$$`。
5. 通过归一化比较和长度限制避免误改剪贴板。

同一文件后半段确实还覆盖了 `fetch` 和 `XMLHttpRequest`，但它只匹配 `/backend-api/conversation/{uuid}` 并保存对话 JSON；这是单独的会话捕获逻辑，不是 LaTeX 复制功能的数据来源。

`katex-config.js` 也不是抓取逻辑，它只抑制特定 KaTeX 警告。
