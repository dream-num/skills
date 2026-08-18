<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/resource-library

提供 target-neutral 的视觉资源目录、检索、SVG 读取、cache 和批量导出能力。它使用稳定的
`<registryId>/<resourceId>` handle，并把 manifest 校验、搜索索引、下载与 cache 协调隐藏在一份小型
Interface 后面。

这里的 resource 是可发现并导出的视觉素材，不是 Workspace 的 Resource 产品对象，也不是 Univer Unit
snapshot 中的 plugin resource。

## 安装

```bash
pnpm add @univer-cli/resource-library
```

Node.js 版本要求为 `>=22.12.0`。

Package 不依赖 Commander，也不包含默认素材目录。调用方可以注入自己的 manifest 和 I/O adapters，或使用
package root 提供的 Node.js adapters。

## 公共 API

```ts
import {
  createResourceLibrary,
  type ResourceCache,
  type ResourceDownloader,
  type ResourceExportResult,
  type ResourceLibrary,
  type ResourceOutput,
} from "@univer-cli/resource-library";

export function createApplicationResourceLibrary(options: {
  manifest: unknown;
  cache: ResourceCache;
  downloader: ResourceDownloader;
  output: ResourceOutput;
}): ResourceLibrary {
  return createResourceLibrary(options);
}

export async function exportMatches(library: ResourceLibrary): Promise<ResourceExportResult> {
  const found = library.find({
    queries: ["rocket", "startup"],
    registries: ["icons"],
    limit: 20,
  });
  const first = found.resources.at(0);
  if (first !== undefined) await library.read({ handle: first.handle });
  return await library.export({
    handles: found.resources.map((resource) => resource.handle),
    destination: "./assets",
  });
}
```

`find()` 对每个 query 做 NFKC、大小写与空白归一化，然后在 name、description、group、tag 和
keyword 中执行 substring 匹配；多个 query 和多个 registry filter 都使用 OR 语义。结果按 manifest
策展顺序稳定排序，公开结果不包含下载 URL 或内部搜索索引。

批量 `export()` 会逐项结算，不回滚已经成功的文件。调用方应同时检查 `exported` 和 `failed`。

## Node.js adapters

Package root 提供 Node.js lazy factory：

如果使用官方默认目录，application 还需要直接安装它：

```bash
pnpm add @univerjs-pro/cli-assets
```

```ts
import { createRequire } from "node:module";
import { join } from "node:path";
import { createNodeResourceLibraryFactory } from "@univer-cli/resource-library";

const require = createRequire(import.meta.url);
const applicationHome = join(process.cwd(), ".my-cli");
const openLibrary = createNodeResourceLibraryFactory({
  manifestPath: require.resolve("@univerjs-pro/cli-assets/manifest.json"),
  cacheRoot: join(applicationHome, "cache", "resources"),
});

const registries = openLibrary().listRegistries();
```

Factory 在第一次调用时才读取和解析 manifest，并在当前进程内复用同一个 library。`manifestPath` 和
`cacheRoot` 必须由 application 决定；package 不读取 `UNIVER_HOME` 或其他产品配置。`cacheRoot` 必须是
绝对路径且不能是 filesystem root。

Node downloader 默认只接受 HTTPS，限制 redirect、30 秒 timeout、10 MiB response、UTF-8 和 SVG 根。
Filesystem cache 使用临时文件与 atomic rename 写入；有效 cache 命中不会联网，也没有 TTL。

## 默认目录

默认目录由独立数据 package `@univerjs-pro/cli-assets` 提供，不是本 package 的依赖。Application 应直接安装
兼容版本，并通过公开的 `./manifest.json` subpath 注入路径；使用 custom manifest 时不需要安装该数据 package。

## 明确不负责

- Commander command、stdout/stderr、help 或 process exit code。
- Application home、环境变量、默认 manifest 和 root program composition。
- Workspace Resource、认证、HTTP、Blob、ACL 或 Worktree。
- Univer Unit plugin resource 的加载、保存与生命周期。
- SVG sanitizer、renderer、`compile-svg` 或远程素材的 license/provenance。

Manifest 是 trusted configuration。Package 会验证 HTTPS 和支持的 image/reference shape，但 custom manifest
仍能指定任意 HTTPS host；返回的 SVG 也只是经过大小、UTF-8 和根元素检查的未净化文本。需要 inline/render
时，consumer 必须执行自己的安全处理。
