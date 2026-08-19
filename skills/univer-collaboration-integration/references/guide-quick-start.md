<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# 快速开始

第一次接入先运行仓库中的 Quick Start。它使用固定用户、固定 Sheet 和 Memory Adapter，目标
只有一个：确认浏览器、HTTP、WebSocket、Endpoint、Service 和 OT 全部连通。

## 运行

准备 Node.js 22 及以上版本和 pnpm，然后在仓库根目录执行：

```bash
pnpm install
pnpm example:quick-start
```

打开：

<http://127.0.0.1:3010/?unit=quick-start-sheet&type=2>

把完整 URL 复制到另一个浏览器或无痕窗口。在任一窗口编辑，另一个窗口应实时出现相同
修改。

## 只读两份源码

- [`examples/quick-start/server/main.ts`](./example-quick-start.md#server)：Transport、
  Endpoint、Service 和 Memory Adapter 的最小组装，以及 Node HTTP server 如何转交 request
  和 WebSocket upgrade。
- [`examples/quick-start/web/main.ts`](./example-quick-start.md#web)：Univer
  Collaboration plugins 和四个协议地址的配置。

这个示例为了缩短代码，固定使用 `demo-user`，并让前端权限查询全部返回 allowed。数据只在
内存中，停止进程后会丢失。这些都不是生产配置。

## 成功后怎么走

- 要搭建自己的服务：继续阅读[搭建协同服务](./guide-integration.md)。
- 要先验证重启后数据仍在：运行 `pnpm example:database-adapter`，并阅读
  [Database Adapter example](./example-database-adapter.md#overview)。
- 要看登录和读写权限：运行 `pnpm example:permissions`，并阅读
  [Permissions example](./example-permissions.md#overview)。
- 要增加版本历史、评论或 Worktree：查看[可选能力](./guide-extensions.md)。

如果两个窗口没有同步，不要先改 OT 或 Service API。按[生产运行](./guide-production.md#按现象定位问题)
从 HTTP、ticket、WebSocket、JOIN 和 submit 逐层检查。
