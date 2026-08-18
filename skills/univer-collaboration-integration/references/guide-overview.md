<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Univer Collaboration SDK 用户手册

Univer Collaboration SDK 提供 Univer 文档的服务端协同核心能力，内置 OT、协同版本管理、
快照与实时同步。
通过 Database Adapter、middleware 和事件机制，开发者可以自主选择数据库和基础设施，
接入现有的身份、权限及业务逻辑，灵活构建符合自身业务需求的协同服务。

## 先建立一条主线

```text
Univer Collaboration Client
→ Node Transport              接收 HTTP/WebSocket，运行应用的 HTTP middleware
→ UniverCollabEndpoint        处理前端协议、Session 和实时房间
→ UniverCollabService         处理协同数据、OT、revision 和 Unit 生命周期
→ Database Adapter            原子保存 snapshot、changeset 和 revision
```

这四层是一套服务端组装，不是四种可替代的接入方式。第一次接入时，先让这条链路完整运行，
再按产品需求增加 History、Thread Comment 或 Worktree。

## 推荐阅读顺序

1. [快速开始](./guide-quick-start.md)：运行 Quick Start 示例，用两个浏览器确认完整协同链路。
2. [搭建协同服务](./guide-integration.md)：独立启动服务，再通过 middleware 接入应用逻辑。
3. [身份与 middleware](./guide-identity-and-middleware.md)：理解 HTTP、WebSocket Session 和三层扩展点。
4. [生产运行](./guide-production.md)：选择持久化、部署网络入口、正确启停并定位问题。
5. [可选能力](./guide-extensions.md)：按需增加 History、Thread Comment 和 Worktree。

## 三类文档分别解决什么问题

| 资源 | 适合什么时候读 |
| --- | --- |
| 用户手册 | 完成跨 package 的接入任务，建立整体心智模型 |
| `examples` | 运行和对照一套真实的服务端与前端代码 |
| Package README | 查某个 package 的 API、middleware action、配置和资源所有权 |

用户手册不会重复列出每个 package 的完整 API。遇到具体 action、路由或构造参数时，再查看
对应 Package README。

## 应用仍然需要提供什么

- 从 Cookie、Session 或 Bearer token 得到稳定的业务 `userID`。
- 保存用户、ACL、租户、目录、名称、分享关系等产品数据。
- 提供“新建文档”等应用 API，并在其中创建协同 Unit。
- 在 Transport、Endpoint 和 Service middleware 中接入认证、权限、日志、trace 或外部集成。
- 选择持久化、备份、反向代理和部署拓扑。

前端传来的用户字段、`memberID` 或 revision 不能替代这些服务端边界。
