<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Worktree

## Overview

展示如何在独立 draft 中协同编辑，并通过 ready、reopen 和 merge 管理修改进入 trunk 的过程。

```bash
pnpm example:worktree
```

打开 <http://127.0.0.1:3010/?unit=worktree-sheet&type=2&worktree=demo-worktree>。示例会创建固定的 `demo-worktree`，默认进入 draft；工具栏可
在 trunk/draft 间切换，并依次执行 Ready、Reopen 和 Merge。

只需要阅读 `server/main.ts` 和 `web/main.ts`。Worktree 有独立 Service、Adapter 和协同路径，
只与 trunk Endpoint 共享一次性 ticket store。

## Server

```ts
import { createServer } from "node:http";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import {
  MemorySessionTicketStore,
  UniverCollabEndpoint,
} from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { MemoryWorktreeDatabaseAdapter } from "@univerjs-pro/collaboration-worktree-database-memory";
import { UniverCollabWorktreeEndpoint } from "@univerjs-pro/collaboration-worktree-endpoint";
import { UniverCollabWorktreeService } from "@univerjs-pro/collaboration-worktree-service";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "worktree-sheet";
const WORKTREE_ID = "demo-worktree";
const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "Worktree Sheet",
  appVersion: "",
  locale: LocaleType.EN_US,
  sheetOrder: ["sheet-1"],
  sheets: {
    "sheet-1": {
      id: "sheet-1",
      name: "Sheet 1",
      rowCount: 100,
      columnCount: 26,
      cellData: { 0: { 0: { v: "Edit in draft, then merge" } } },
    },
  },
  styles: {},
  resources: [],
};

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const worktreeDatabase = new MemoryWorktreeDatabaseAdapter();
const worktreeService = new UniverCollabWorktreeService({
  trunk: { service, dbAdapter: database },
  dbAdapter: worktreeDatabase,
});
const ticketStore = new MemorySessionTicketStore();
const endpoint = new UniverCollabEndpoint(service, { ticketStore });
const worktreeEndpoint = new UniverCollabWorktreeEndpoint(worktreeService, {
  ticketStore,
});
const transport = createNodeTransport();
transport.use(async (context, next) => {
  context.userID = "demo-user";
  await next();
});
transport.register(endpoint);
transport.register(worktreeEndpoint);

await service.createUnitFromData(
  { type: UniverType.UNIVER_SHEET, data: unitData },
  { userID: "demo-user" },
);
await worktreeService.createWorktree(
  { worktreeID: WORKTREE_ID, units: [UNIT_ID] },
  { userID: "demo-user" },
);

const app = express();
app.post(
  "/universer-api/authz/-/object/-/batch_allowed",
  express.json(),
  (request, response) => {
    const body = request.body as {
      requests: Array<{ unitID: string; objectID: string; actions: unknown[] }>;
    };
    response.json({
      error: { code: ErrorCode.OK, message: "" },
      objectActions: body.requests.map((item) => ({
        unitID: item.unitID,
        objectID: item.objectID,
        actions: item.actions.map((action) => ({ action, allowed: true })),
      })),
    });
  },
);
app.use("/universer-api", (request, response) => {
  request.url = request.originalUrl;
  transport.handleRequest(request, response);
});
app.use(express.static("dist/web"));
const server = createServer(app);
server.on("upgrade", (request, socket, head) =>
  transport.handleUpgrade(request, socket, head),
);
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3010);
server.listen(port, host, () =>
  console.info(
    `Worktree is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}&worktree=${WORKTREE_ID}`,
  ),
);
```

## Web

```ts
import { LocaleType, LogLevel } from "@univerjs/core";
import { UniverCollaborationPlugin } from "@univerjs-pro/collaboration";
import { UniverCollaborationClientPlugin } from "@univerjs-pro/collaboration-client";
import CollaborationClientEnUS from "@univerjs-pro/collaboration-client/locale/en-US";
import {
  BrowserCollaborationSocketService,
  UniverCollaborationClientUIPlugin,
} from "@univerjs-pro/collaboration-client-ui";
import CollaborationClientUIEnUS from "@univerjs-pro/collaboration-client-ui/locale/en-US";
import {
  WorktreeClient,
  createWorktreeCollaborationConfig,
} from "@univerjs-pro/collaboration-worktree-client";
import { UniverLicensePlugin } from "@univerjs-pro/license";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, defaultTheme, mergeLocales } from "@univerjs/presets";
import "./styles.css";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";

const worktreeID = "demo-worktree";
const unitID = "worktree-sheet";
const client = new WorktreeClient({ origin: location.origin });
const worktree = await client.getWorktree(worktreeID);
const editingDraft = new URL(location.href).searchParams.has("worktree");
const editorURL = (draft: boolean) =>
  `/?unit=${unitID}&type=2${draft ? `&worktree=${worktreeID}` : ""}`;
document.querySelector<HTMLElement>("#toolbar")!.innerHTML =
  `<a href="${editorURL(false)}">Trunk</a><a href="${editorURL(true)}">Draft</a><span>Status: ${worktree.status}</span><button id="ready">Ready</button><button id="reopen">Reopen</button><button id="merge">Merge</button>`;
document.querySelector<HTMLElement>("#status")!.textContent = editingDraft
  ? "Editing the isolated draft."
  : "Viewing trunk.";
document.querySelector<HTMLButtonElement>("#ready")!.onclick = async () => {
  await client.markReady(worktreeID);
  location.reload();
};
document.querySelector<HTMLButtonElement>("#reopen")!.onclick = async () => {
  await client.reopenWorktree(worktreeID);
  location.href = editorURL(true);
};
document.querySelector<HTMLButtonElement>("#merge")!.onclick = async () => {
  await client.mergeWorktree(worktreeID);
  location.href = editorURL(false);
};

const baseURL = `${location.protocol}//${location.host}/universer-api`;
const collaboration = editingDraft
  ? createWorktreeCollaborationConfig({ origin: location.origin, worktreeID })
  : {
      snapshotServerUrl: `${baseURL}/snapshot`,
      collabSubmitChangesetUrl: `${baseURL}/comb`,
      collabWebSocketUrl: `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/universer-api/comb/connect`,
      wsSessionTicketUrl: `${baseURL}/user/session-ticket`,
    };
createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      CollaborationClientEnUS,
      CollaborationClientUIEnUS,
    ),
  },
  theme: defaultTheme,
  logLevel: LogLevel.WARN,
  collaboration: true,
  presets: [UniverSheetsCorePreset({ container: "app" })],
  plugins: [
    [
      UniverLicensePlugin,
      { license: import.meta.env.VITE_UNIVER_LICENSE || undefined },
    ],
    UniverCollaborationPlugin,
    [
      UniverCollaborationClientPlugin,
      {
        socketService: BrowserCollaborationSocketService,
        authzUrl: `${baseURL}/authz`,
        ...collaboration,
        sendChangesetTimeout: 200,
      },
    ],
    UniverCollaborationClientUIPlugin,
  ],
});
```
