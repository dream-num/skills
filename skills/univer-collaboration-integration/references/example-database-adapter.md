<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Database Adapter

## Overview

在 Quick Start 的基础上把 Memory Adapter 换成 SQLite，展示协同数据如何在服务重启后
继续保留。

```bash
pnpm example:database-adapter
```

打开 <http://127.0.0.1:3010/?unit=persistent-sheet&type=2>。数据写入 `.data/collaboration.sqlite`，再次启动仍会读取同一个
Unit。需要清空演示数据时运行 `pnpm --filter @univerjs/collaboration-example-database-adapter reset`。

只需要对照 Quick Start 阅读 `server/main.ts`：主要变化就是把 Memory Adapter 换成 SQLite，
并在 Unit 不存在时创建一次。

## Server

```ts
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname } from "node:path";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { SQLiteDatabaseAdapter } from "@univerjs-pro/collaboration-database-sqlite";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import {
  CollabError,
  UniverCollabService,
} from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "persistent-sheet";
const filename = ".data/collaboration.sqlite";
const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "Persistent Sheet",
  appVersion: "",
  locale: LocaleType.EN_US,
  sheetOrder: ["sheet-1"],
  sheets: {
    "sheet-1": {
      id: "sheet-1",
      name: "Sheet 1",
      rowCount: 100,
      columnCount: 26,
      cellData: {},
    },
  },
  styles: {},
  resources: [],
};

await mkdir(dirname(filename), { recursive: true });
const database = new SQLiteDatabaseAdapter({ filename });
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const transport = createNodeTransport();
endpoint.use("connect", async (context, next) => {
  context.member.name = "Demo User";
  await next();
});
transport.use(async (context, next) => {
  context.userID = "demo-user";
  await next();
});
transport.register(endpoint);

try {
  await service.getUnit(
    { unitID: UNIT_ID, type: UniverType.UNIVER_SHEET, revision: 0 },
    { userID: "demo-user" },
  );
} catch (error) {
  if (!(error instanceof CollabError) || error.code !== "UNIT_NOT_FOUND")
    throw error;
  await service.createUnitFromData(
    { type: UniverType.UNIVER_SHEET, data: unitData },
    { userID: "demo-user" },
  );
}

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
    `Database Adapter is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`,
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
import { UniverLicensePlugin } from "@univerjs-pro/license";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, defaultTheme, mergeLocales } from "@univerjs/presets";
import "./styles.css";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";

document.querySelector<HTMLElement>("#status")!.textContent =
  "SQLite keeps this Sheet after the server restarts.";
const baseURL = `${location.protocol}//${location.host}/universer-api`;
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
        sendChangesetTimeout: 200,
        authzUrl: `${baseURL}/authz`,
        snapshotServerUrl: `${baseURL}/snapshot`,
        collabSubmitChangesetUrl: `${baseURL}/comb`,
        collabWebSocketUrl: `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/universer-api/comb/connect`,
        wsSessionTicketUrl: `${baseURL}/user/session-ticket`,
      },
    ],
    UniverCollaborationClientUIPlugin,
  ],
});
```
