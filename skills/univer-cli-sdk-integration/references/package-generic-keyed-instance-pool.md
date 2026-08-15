<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/generic-keyed-instance-pool

按 application-owned opaque key 创建、独占分配、缓存和回收有状态 Instance。适合创建成本高、需要按
key 复用、同一时间只能被一个调用方使用并且必须显式销毁的对象。

本 package 只管理进程内 raw Instance 的 keyed lifecycle，不包含 worker、IPC、RPC、方法代理或业务
operation abstraction。

## 安装

需要 Node.js 22.12 或更高版本。

```bash
pnpm add @univer-cli/generic-keyed-instance-pool
```

## 完整示例

```ts
import {
  createGenericKeyedInstancePool,
  type ManagedInstanceFactory,
} from "@univer-cli/generic-keyed-instance-pool";

interface MyInit {
  readonly name: string;
}

interface MyInstance {
  doSomething(): Promise<string>;
}

class DefaultMyInstance implements MyInstance {
  #callCount = 0;
  #closed = false;

  public constructor(private readonly name: string) {}

  public async doSomething(): Promise<string> {
    if (this.#closed) throw new Error(`Instance "${this.name}" is closed`);
    this.#callCount += 1;
    return `${this.name}: call ${this.#callCount}`;
  }

  public async close(): Promise<void> {
    this.#closed = true;
  }
}

const factory: ManagedInstanceFactory<MyInstance, MyInit> = {
  async create({ init }) {
    return new DefaultMyInstance(init.name);
  },

  async destroy({ instance }) {
    if (!(instance instanceof DefaultMyInstance)) {
      throw new TypeError("Unknown MyInstance implementation");
    }
    await instance.close();
  },
};

const pool = createGenericKeyedInstancePool({
  factory,
  cache: {
    idleTtlMs: 60_000,
    maxEntries: 20,
  },
});

const first = await pool.acquire({
  key: "instance-a",
  init: { name: "Instance A" },
});

try {
  console.log(await first.instance.doSomething()); // Instance A: call 1
} finally {
  await first.release();
}

const second = await pool.acquire({
  key: "instance-a",
  // Instance 已经 resident，因此本次 init 不会被使用。
  init: { name: "ignored" },
});

try {
  console.log(await second.instance.doSomething()); // Instance A: call 2
} finally {
  await second.release();
}

await pool.close();
```

第一次 acquire 使用 `init` 创建 Instance。`release()` 只解除独占并允许复用，不销毁 Instance；相同
key 的下一次 acquire 得到同一个对象。确定对象不应继续复用时使用 `invalidate()`：

```ts
const lease = await pool.acquire({ key, init });

try {
  await lease.instance.doSomething();
} catch (error) {
  await lease.invalidate();
  throw error;
}
```

## 责任合同

Pool 保证：

- 相同 key 同时最多存在一个 active lease，等待者按 FIFO 获得 lease。
- 同 key cold create single-flight，不同 key 可以并行创建和使用。
- `release()` 后的 Instance 可以交给下一个 waiter 或进入 idle cache。
- `invalidate()` 永久移除当前 Instance，并调用 factory `destroy()`。
- 默认最多 resident 20 个 Instance，idle 5 分钟后回收。
- 容量满时优先回收全局最久未使用的 idle Instance。
- `close()` 拒绝新的和等待中的 acquire，并销毁 resident Instance。

调用方保证：

- 所有 Instance 操作都发生在 acquire 与 release/invalidate 之间。
- 所有异步操作 settle 后才结束 lease。
- Lease 结束后不再使用保存下来的 Instance reference。
- 自己决定同一 lease 内是否允许并发调用 Instance 方法。
- 只有认为 Instance 状态健康时才调用 `release()`；状态不可信时调用 `invalidate()`。

Pool 不包装、拦截、串行化或校验 Instance 上的方法。由于 `lease.instance` 是 raw reference，release 后
禁止使用主要由 Interface 合同约束，无法在运行时完全阻止。

## 公共导出

- `createGenericKeyedInstancePool()`。
- `KeyedInstancePool<TInstance, TInit>`。
- `InstanceLease<TInstance>`。
- `ManagedInstanceFactory<TInstance, TInit>`。
- `InstanceAcquireInput<TInit>`、`ManagedInstanceInput<TInstance>`。
- `InstancePoolCacheOptions`、`InstancePoolEvent`。
- `InstancePoolError` 与稳定 Pool error codes。

本 package 不负责 worker、remote transport、业务方法、target-to-key 算法、持久化、认证、commit、retry
或 transaction。需要其他运行位置时，调用方可以另外实现返回本地 proxy 的
`ManagedInstanceFactory`；这不属于当前 package 的内置能力。
