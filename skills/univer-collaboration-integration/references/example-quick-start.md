<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Quick Start

## Overview

最小可运行的 Sheet 实时协同示例。它使用固定用户、固定 Sheet 和 Memory Adapter，用于
快速确认 HTTP、WebSocket 和协同客户端链路能够正常工作。

```bash
pnpm example:quick-start
```

打开 <http://127.0.0.1:3010/?unit=quick-start-sheet&type=2>，再把完整 URL 复制到另一个浏览器。数据只保存在 Memory
Adapter 中，停止进程后丢失。

只需要阅读 `server/main.ts` 和 `web/main.ts`。固定 `demo-user` 和固定 allowed 只用于本地
教学。

## Server

```ts
import { createServer } from "node:http";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "quick-start-sheet";
const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "Quick Start Sheet",
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

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const transport = createNodeTransport();

transport.use(async (context, next) => {
  context.userID = "demo-user";
  await next();
});
transport.register(endpoint);

await service.createUnitFromData(
  { type: UniverType.UNIVER_SHEET, data: unitData },
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
server.on("upgrade", (request, socket, head) => {
  transport.handleUpgrade(request, socket, head);
});

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3010);
server.listen(port, host, () => {
  console.info(
    `Quick Start is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`,
  );
});
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
  "Open this URL in another browser and edit the same Sheet.";

const httpProtocol = location.protocol === "https:" ? "https" : "http";
const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const baseURL = `${httpProtocol}://${location.host}/universer-api`;

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
        collabWebSocketUrl: `${wsProtocol}://${location.host}/universer-api/comb/connect`,
        wsSessionTicketUrl: `${baseURL}/user/session-ticket`,
      },
    ],
    UniverCollaborationClientUIPlugin,
  ],
});
```
