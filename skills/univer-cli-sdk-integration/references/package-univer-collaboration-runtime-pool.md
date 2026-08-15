<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/univer-collaboration-runtime-pool

在独立 worker process 中按 application-owned opaque key 创建、独占分配、缓存和回收
`UniverCollaborationRuntime`。它把 collaboration runtime 的完整 interface 代理到 lease，并复用
`@univer-cli/generic-keyed-instance-pool` 的 single-flight、FIFO、TTL 和 LRU 生命周期。

本 package 不定义 Workspace、Worktree、URL、认证、target-to-key 算法、daemon method 或 Commander
command。Worker entry 在 runtime 所在进程创建 Backend、读取凭证并构造 Univer。

## 安装与运行要求

```bash
pnpm add \
  @univer-cli/univer-collaboration-runtime-pool \
  @univer-cli/univer-collaboration-runtime \
  @univer-cli/headless-univer \
  @univerjs/core
```

需要 Node.js 22.12 或更高版本。Application 必须提供一个已经编译为 JavaScript、可由 Node.js 动态导入的
worker entry；entry 中负责提供 collaboration Backend 和 Univer factory。标准装配可以使用
`@univer-cli/headless-univer`；完全自定义 factory 时，worker 使用的 Univer packages 由 application
直接声明。

## 使用

先定义由 application 拥有、可通过 Node.js IPC clone 的 cold-create init：

```ts
// runtime-init.ts
import type { UniverInstanceType } from "@univerjs/core";

export interface RuntimeInit {
  readonly unitId: string;
  readonly unitType: UniverInstanceType;
  readonly server: {
    readonly snapshotServerUrl: string;
    readonly collabSubmitChangesetUrl: string;
    readonly collabWebSocketUrl: string;
    readonly wsSessionTicketUrl: string;
  };
}
```

Application worker entry 在 worker 内创建 Backend 和 Univer：

```ts
// worker.ts
import {
  createCollaborationServerAdapter,
  createUniverCollaborationRuntimeFactory,
} from "@univer-cli/univer-collaboration-runtime";
import { defineUniverCollaborationRuntimeWorker } from "@univer-cli/univer-collaboration-runtime-pool";
import { createStandardHeadlessUniverFactory } from "@univer-cli/headless-univer";
import type { RuntimeInit } from "./runtime-init.js";

const createUniver = createStandardHeadlessUniverFactory({
  license: process.env.UNIVER_LICENSE ?? "",
});

export default defineUniverCollaborationRuntimeWorker({
  async createRuntime(init: RuntimeInit) {
    const backend = createCollaborationServerAdapter({
      ...init.server,
      httpRequest: async (input, requestInit) =>
        await fetch(input, {
          ...requestInit,
          headers: {
            ...Object.fromEntries(new Headers(requestInit?.headers)),
            authorization: `Bearer ${process.env.ACCESS_TOKEN ?? ""}`,
          },
        }),
    });
    return await createUniverCollaborationRuntimeFactory({
      backend,
      createUniver,
    }).load(init.unitId, init.unitType);
  },
});
```

调用方：

```ts
import { UniverInstanceType } from "@univerjs/core";
import { createUniverCollaborationRuntimePool } from "@univer-cli/univer-collaboration-runtime-pool";
import type { RuntimeInit } from "./runtime-init.js";

const pool = createUniverCollaborationRuntimePool<RuntimeInit>({
  entry: new URL("./worker.js", import.meta.url),
});
const init: RuntimeInit = {
  unitId: "book-1",
  unitType: UniverInstanceType.UNIVER_SHEET,
  server: {
    snapshotServerUrl: "https://example.com/universer-api/snapshot",
    collabSubmitChangesetUrl: "https://example.com/universer-api/comb",
    collabWebSocketUrl: "wss://example.com/universer-api/comb/connect",
    wsSessionTicketUrl: "https://example.com/universer-api/user/session-ticket",
  },
};
const lease = await pool.acquire({
  key: "server-a:book-1:sheet",
  init,
});

try {
  const pull = await lease.pull();
  if (pull.status === "conflict") throw new Error(pull.conflict.message);
  const write = await lease.execute({
    mode: "write",
    code: 'workbook.getActiveSheet().getRange("A1").setValue("ready"); return "ready";',
  });
  const commit = await lease.commit();
  console.log(write.value, commit);
} catch (error) {
  await lease.invalidate();
  throw error;
} finally {
  await lease.release();
}

await pool.close();
```

`release()` 结束 exclusive lease 并保留健康 worker/runtime。默认 idle TTL 为 5 分钟，默认最多 resident
20 个实例；可用 `cache.idleTtlMs` 和 `cache.maxEntries` 覆盖。相同 key 的等待者按 FIFO 获得 lease，不同
key 可以并行。

## Pool options

| Option               | 默认值                 | 行为                                                                 |
| -------------------- | ---------------------- | -------------------------------------------------------------------- |
| `cache.maxEntries`   | `20`                   | resident worker/runtime 上限；满载且没有 idle 实例时 acquire 失败。  |
| `cache.idleTtlMs`    | `300000`（5 分钟）     | idle lease 对应实例的保留时间。                                      |
| `openTimeoutMs`      | `30000`（30 秒）       | worker 启动、导入 entry 和创建 runtime 的总等待时间。                |
| `operationTimeoutMs` | `30000`（30 秒）       | 每次代理 operation 的等待时间；超时会使当前实例不可继续复用。        |
| `env`                | 继承当前 `process.env` | 显式提供时作为 worker process 的环境。                               |
| `onEvent`            | 无                     | 接收 create、cache hit、eviction、operation timing 和 failure 事件。 |

`entry` 必须指向已经构建的 JavaScript module。`init` 只在 cold create 或实例失效后重建时发送；相同 key 已有
resident runtime 时，后续 acquire 的 `init` 不会替换现有配置。`onEvent` observer 抛错不会改变 pool 行为。

## Mutation replacement

`replacePendingMutations()` 用调用者提供的完整 protocol mutation 数组替换全部 pending。它允许改变数量、
顺序、id 和 data。Runtime 与 pool 都不判断 replacement 是否与已经作用于内存 Unit 的原 mutations 等价，
也不会自动 reload 或 invalidate。调用者若不能保证等价，应在完成 commit/retry 后自行 `invalidate()`；否则
`release()` 表示接受当前 runtime 继续复用。

Worker crash、operation timeout、protocol error、closed runtime 和 load failure 会 poison 当前 lease；此时
`release()` 等同于 `invalidate()`。业务层对未确认 commit、conflict 和是否继续复用拥有最终策略。
普通 write code 错误不会自动 poison lease：错误原样返回，调用者可以通过 `getPendingMutations()` 比较执行
前后的 mutation 快照，再选择 `replacePendingMutations()`、`release()` 或 `invalidate()`。

## 公共导出

Package root：

- `createUniverCollaborationRuntimePool()`；
- `UniverCollaborationRuntimePool`、`UniverCollaborationRuntimeLease` 与 acquire/options/event 类型；
- collaboration runtime 的 operation/result/state 类型；
- `UniverCollaborationRuntimePoolError`。

`worker` 子路径：

- `defineUniverCollaborationRuntimeWorker()`；
- `UniverCollaborationRuntimeWorkerDefinition`。

本 package 执行调用者提供的 JavaScript code，不是安全沙箱。不要执行不可信 code。
