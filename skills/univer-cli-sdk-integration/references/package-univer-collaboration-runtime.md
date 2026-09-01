<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-collaboration-runtime

在 Node.js 进程中创建绑定单个 Univer Unit 的 headless collaboration runtime。调用者显式执行
`execute()`、`fetch()`、`pull()` 和 `commit()`；本 package 负责 Snapshot/UnitData 加载、mutation
捕获、OT、revision、pending/awaiting 状态及 changeset 幂等 identity。

本 package 不提供 Commander command、runtime pool、worker、daemon、Workspace/Worktree target 或用户认证策略。

## 安装与运行要求

```bash
pnpm add @univer-cli/univer-collaboration-runtime
```

需要 Node.js 22.12 或更高版本。Runtime 会安装手动 collaboration kernel，但不会替调用者注册目标 Unit
的内容插件或业务插件。大多数 Node.js application 可以使用
`@univer-cli/headless-univer` 的标准生产装配；高级用户仍可完全实现自己的 `UniverFactory`。

## 核心状态

每个 runtime 只绑定一个 Unit。理解以下状态后再决定何时 `release`、retry 或关闭实例：

| 状态                | 含义                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `baseRevision`      | 已确认且已经应用到当前 Unit 的最高服务端 revision。              |
| `knownHeadRevision` | 最近一次 fetch 得知的服务端 head；可能高于 `baseRevision`。      |
| pending mutations   | 已经修改内存内容、尚未组成待提交 changeset 的本地 mutations。    |
| awaiting changeset  | 已经获得稳定 `sid/reqId`、提交结果尚未最终确认的本地 changeset。 |
| buffered changesets | fetch 得到但尚未通过 pull 应用到当前 Unit 的远端 changesets。    |

本地 write 不推进 `baseRevision`：

```text
当前内存内容 = confirmed(baseRevision) + awaiting local + pending local
```

## 使用标准 Headless Univer

这个组合还需要直接安装标准 factory：

```bash
pnpm add @univer-cli/headless-univer
```

```ts
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createUniverCollaborationRuntimeFactory,
  type CollaborationRuntimeBackend,
  type UniverCollaborationRuntimeFactory,
} from "@univer-cli/univer-collaboration-runtime";

export function createRuntimeFactory(
  backend: CollaborationRuntimeBackend,
): UniverCollaborationRuntimeFactory {
  return createUniverCollaborationRuntimeFactory({
    backend,
    createUniver: createStandardHeadlessUniverFactory({
      license: process.env.UNIVER_LICENSE ?? "",
    }),
  });
}
```

标准 factory 负责固定的内容插件、locale、license、formula 和 network 装配，并通过
`embedPluginConfig` 直接接收 `UniverEmbedPlugin` config。Snapshot Adapter、依赖它的 Provider、Backend、认证及手动
fetch/pull/commit workflow 仍由 collaboration runtime 和 application 所有。

需要跨 Unit 加载时，application 可以通过 factory 的 `snapshotServerService` option 注入与
`@univerjs-pro/collaboration` 的 `ISnapshotServerService` 兼容的 adapter。传入该 option 后，
`UniverFactoryContext.resolveSnapshotService` 会解析当前 Univer 使用的 `SnapshotService`，供 Embed Provider
延迟加载 referenced Unit。Resolver 只能由 Provider 在 `createUniver()` 返回之后调用；在 factory 执行期间调用会
以 load error 失败。

Runtime 不解释 ResourceRef、Workspace scope 或认证。Snapshot adapter、Embed Provider 和 scope policy 由
application 实现；runtime 只保证 Host 与 referenced Units 使用同一个 Univer/Collaboration container。

## 使用自定义 Backend

`CollaborationRuntimeBackend` 是存储与 transport port。高级使用者可以从本地文件、数据库或其他系统
提供 UnitData checkpoint；runtime 不要求数据必须来自 HTTP server。

自定义 Univer 示例直接 import Univer plugins，因此 application 需要把这些 packages 声明为直接依赖：

```bash
pnpm add @univerjs/core @univerjs/docs @univerjs/engine-render
```

下面的 `loadCheckpoint()`、`loadChangesets()` 和 `storeChangeset()` 分别代表 application 的 checkpoint
读取、连续 changeset 读取和幂等提交函数；它们的返回值必须满足 `CollaborationRuntimeBackend` handle 类型。

```ts
import { Univer, UniverInstanceType } from "@univerjs/core";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import {
  createUniverCollaborationRuntimeFactory,
  type CollaborationRuntimeBackend,
} from "@univer-cli/univer-collaboration-runtime";

const backend: CollaborationRuntimeBackend = {
  async open({ unitId, unitType }) {
    return {
      format: "unit-data",
      getConnectionState: () => "online",
      getUnitData: async () => loadCheckpoint(unitId, unitType),
      fetchChangesets: (from, to) => loadChangesets(unitId, from, to),
      submitChangeset: (draft) => storeChangeset(unitId, unitType, draft),
      close: async () => undefined,
    };
  },
};

const factory = createUniverCollaborationRuntimeFactory({
  backend,
  createUniver() {
    const univer = new Univer();
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverDocsPlugin);
    return univer;
  },
});

const runtime = await factory.load("doc-1", UniverInstanceType.UNIVER_DOC);
try {
  const pulled = await runtime.pull();
  if (pulled.status === "conflict") throw new Error(pulled.conflict.message);

  const write = await runtime.execute({
    mode: "write",
    code: `
      await univerAPI.executeCommand("doc.mutation.rename-doc", {
        unitId: "doc-1",
        name: "Draft"
      });
    `,
  });
  console.log(write.mutations, runtime.getState());

  const commit = await runtime.commit();
  console.log(commit);
} finally {
  await runtime.close();
}
```

`getUnitData()` 返回 materialized UnitData checkpoint 及其后的连续 confirmed changesets。另一种
`format: "snapshot"` handle 返回现有协议的 `IGetUnitOnRevResponse` 和 Sheet/Base blocks；runtime 使用
Collaboration SDK 的公开 transformer 生成 UnitData。两种格式严格二选一。

## 连接 Collaboration Server

Package root 同时提供 Collaboration Server 的 HTTP/WebSocket adapter：

下面的完整组合使用标准 Headless Univer，并直接引用 `UniverInstanceType`：

```bash
pnpm add @univer-cli/headless-univer @univerjs/core
```

```ts
import { UniverInstanceType } from "@univerjs/core";
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import {
  createCollaborationServerAdapter,
  createUniverCollaborationRuntimeFactory,
  type UniverCollaborationRuntimeFactory,
} from "@univer-cli/univer-collaboration-runtime";

function createServerRuntimeFactory(
  getAccessToken: () => Promise<string>,
): UniverCollaborationRuntimeFactory {
  const backend = createCollaborationServerAdapter({
    snapshotServerUrl: "https://example.com/universer-api/snapshot",
    collabSubmitChangesetUrl: "https://example.com/universer-api/comb",
    collabWebSocketUrl: "wss://example.com/universer-api/comb/connect",
    wsSessionTicketUrl: "https://example.com/universer-api/user/session-ticket",
    httpRequest: async (input, init) =>
      await fetch(input, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers)),
          authorization: `Bearer ${await getAccessToken()}`,
        },
      }),
  });

  return createUniverCollaborationRuntimeFactory({
    backend,
    createUniver: createStandardHeadlessUniverFactory({
      license: process.env.UNIVER_LICENSE ?? "",
    }),
  });
}

const factory = createServerRuntimeFactory(async () => process.env.ACCESS_TOKEN ?? "");
const runtime = await factory.load("workbook-1", UniverInstanceType.UNIVER_SHEET);
try {
  await runtime.pull();
} finally {
  await runtime.close();
}
```

所有 Snapshot、block、fetch-missing、ticket 和 submit HTTP 请求都经过 `httpRequest`。Bearer token、
Cookie jar、刷新 token、签名、代理和 HTTP retry 均由调用者在这里组合。WebSocket 使用 ticket endpoint
返回的一次性 ticket，不另行接收 header callback。

同一个 server adapter 创建的多个 Unit handle 共享一条 WebSocket。连接会执行 HELLO、按 Unit JOIN、
heartbeat，并在意外断开后用新 ticket 重连和重新 JOIN。最后一个 handle 关闭时才关闭共享连接。

## 推荐的单回合流程

`pull()` 自己会 fetch，因此正常写入流程不需要先单独调用 `fetch()`。下面的 helper 在执行用户代码前同步远端，
并在 commit 发现新 revision 时再 pull、transform 和重试一次：

```ts
import type {
  CollaborationCommitResult,
  UniverCollaborationRuntime,
} from "@univer-cli/univer-collaboration-runtime";

async function executeOneRound(
  runtime: UniverCollaborationRuntime,
  code: string,
): Promise<CollaborationCommitResult> {
  const initialPull = await runtime.pull();
  if (initialPull.status === "conflict") throw new Error(initialPull.conflict.message);

  await runtime.execute({ mode: "write", code });
  let commit = await runtime.commit();
  if (commit.status !== "pull-required") return commit;

  const pulled = await runtime.pull();
  if (pulled.status === "conflict") throw new Error(pulled.conflict.message);
  commit = await runtime.commit();
  return commit;
}
```

调用方仍需检查最终 commit status：`confirmed` 和 `nothing-to-commit` 已完成；`retry` 或 `unknown` 可以在同一
runtime 上再次 `commit()`，它会保留原 `sid/reqId`；`pull-required` 表示重试期间服务端再次前进；`conflict`
需要停止写入并由 application 决定导出、关闭或重新加载。需要在提交前外置图片等内容时，在 `execute()` 与
`commit()` 之间读取并调用 `replacePendingMutations()`。

## 手动协同语义

- `execute({ mode: "write" })` 立即修改内存内容，并把本次 mutation 加入 pending；不会自动提交。
- `exportUnitData()` 返回包含已注册插件资源的当前完整、可持久化 UnitData。
- `getPendingMutations()` 返回当前 pending mutations 的快照；write 失败后由调用者检查并决定恢复、提交或
  `close()`。
- `replacePendingMutations()` 显式替换全部 pending protocol mutations；允许 application 在 commit 前完成
  图片 externalization 等 workflow。
- `execute({ mode: "read" })` 阻止持久化 command/mutation。传入 `fromCollab` 等 option 不能绕过限制。
- Read 和 write execution 都不能通过 Facade 创建或 dispose 顶层 Unit。Host-owned Embed descriptor 可以通过
  `createEmbed()` 创建，并由 application 注册的 Provider 只读加载 Source Unit；任何明确写向其他 `unitId`
  的调用者 mutation 都会失败，不会静默丢弃。唯一例外是 Formula engine 为非主 Host 产生的 last-value cache
  mutation：它只更新当前进程的计算投影，不进入主 Unit 的 pending changeset；主 Host 的同类 cache mutation 仍会捕获。
- `fetch()` 只获取并校验远端连续 changesets，更新 buffer，不修改 Unit 内容或 `baseRevision`。
- `pull()` 会 fetch、按 awaiting → pending 的顺序执行 OT，再应用远端 changesets。匹配本地
  `(sid, reqId)` 的自身 echo 只确认 revision，不重复执行本地 mutation。
- `commit()` 在没有 awaiting 时先 fetch；若远端已前进，返回 `pull-required`。否则把当前全部 pending
  组成一个 changeset，不按大小或 Unit 类型拆分。
- `retry`/`unknown` 保留 awaiting identity。没有发生 pull 时，下一次 commit 原样重发；pull 协调了并发
  changesets 后，会保留相同 identity，并使用 OT 后的新 `baseRev`/payload。
- `permission-denied`、`invalid-changeset` 和 transform failure 进入 terminal conflict。此后只允许
  `getState()`、read、`exportUnitData()` 和 `close()`。
- canonical ACK/echo 不一致或 remote mutation replay 失败表示内存内容已无法安全复用；runtime 会立即释放
  Backend handle 和 Univer，并以 protocol/load error 拒绝该操作。
- 所有公开异步操作在单个 runtime 内串行执行。`close()` 不会隐式 pull 或 commit。

Runtime 不比较 replacement 与原 pending 的语义，也不因此标记 reload、限制后续 operation 或自动关闭
Univer。调用者调用 replacement 即声明两组 mutations 对当前内存内容等价。若调用者无法保证等价，应在
完成 commit/retry 后自行 `close()`；使用 runtime pool 时则自行 `invalidate()`。错误 replacement 造成的
内容偏差由调用者负责。

`execute({ mode: "write" })` 抛错时也不会自动关闭 runtime。原错误返回调用者；已经产生的 mutations 仍可
通过 `getPendingMutations()` 查看。调用者可以直接 `close()`，也可以比较执行前后的快照后自行处理。

Runtime 不跨进程保存 awaiting/offline queue，也不提供 presence、cursor、selection 或后台自动
pull/commit。当前不支持需要重载历史 revision 的 `RevertRevisionMutation`：本地执行会被拒绝，远端
changeset 会在修改当前 Unit 前返回 protocol error。

## 用户提供的 Univer

`createUniver()` 每次 `load()` 调用一次，返回尚未加载目标 Unit 的独占实例。所有权转移给 runtime，
`close()` 或 load 失败时由 runtime dispose。Runtime replay 完 checkpoint 与初始 revision gap 后，会等待
已经安装的公式模块把最新计算结果应用完成；自定义 Univer 没有安装公式模块时跳过该步骤。

调用者必须为目标类型注册内容插件：

- Sheet：`UniverSheetsPlugin`
- Doc：`UniverRenderEnginePlugin` 和 `UniverDocsPlugin`
- Slide：`UniverSlidesPlugin`
- Base：`UniverBasesPlugin`
- Board：`UniverBoardsPlugin`

可以继续注册自定义 Facade 和业务插件。不要注册会自动同步的 collaboration client plugin，否则会与
手动 `fetch/pull/commit` 状态机竞争。自定义 mutation 若存在并发冲突，还必须向 Collaboration SDK 注册
对应 transform algorithm；未注册 algorithm 默认按不冲突处理，runtime 无法自动判断其安全性。

## 公共导出

Package root：

- `createUniverCollaborationRuntimeFactory()`
- `createCollaborationServerAdapter()` 与 `CollaborationServerConfig`、`CollaborationHttpRequest`
- `UniverCollaborationRuntime` 及 execute/fetch/pull/commit/state/result 类型
- `CollaborationRuntimeBackend`、两种 handle、checkpoint 和 submit result 类型
- `CollaborationRuntimeError`

本 package 执行的是调用者提供的 JavaScript code，不是安全沙箱。不要执行不可信 code。
