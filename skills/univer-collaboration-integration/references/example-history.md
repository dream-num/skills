<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# History

## Overview

在基础协同链路之外增加 History Service、History Endpoint 和浏览器历史入口。

```bash
pnpm example:history
```

打开 <http://127.0.0.1:3010/?unit=history-sheet&type=2>，编辑后点击页面上方的 `History` 查看版本。这个示例刻意把
History 作为可选派生能力：`server/main.ts` 先组装 core，再 attach History，并按
认证 → History Endpoint → Collaboration Endpoint 的顺序注册。

History 索引与 core 数据使用不同 Adapter；生产环境需要分别纳入持久化和备份策略。

## Server

```ts
import { createServer } from "node:http";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { SQLiteHistoryDatabaseAdapter } from "@univerjs-pro/collaboration-history-database-sqlite";
import { UniverHistoryEndpoint } from "@univerjs-pro/collaboration-history-endpoint";
import { UniverHistoryService } from "@univerjs-pro/collaboration-history-service";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "history-sheet";
const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "History Sheet",
  appVersion: "",
  locale: LocaleType.EN_US,
  sheetOrder: ["sheet-1"],
  sheets: {
    "sheet-1": {
      id: "sheet-1",
      name: "Sheet 1",
      rowCount: 100,
      columnCount: 26,
      cellData: { 0: { 0: { v: "Edit, then open History" } } },
    },
  },
  styles: {},
  resources: [],
};

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const historyDatabase = new SQLiteHistoryDatabaseAdapter({
  filename: ":memory:",
});
const historyService = new UniverHistoryService({
  collabService: service,
  dbAdapter: historyDatabase,
  userProvider: {
    async getUsers(userIDs) {
      return userIDs.includes("demo-user")
        ? [
            {
              userID: "demo-user",
              name: "Demo User",
              avatar: "",
              anonymous: false,
              canBindAnonymous: false,
              phone: "",
              email: "",
              createTimestamp: 0,
            },
          ]
        : [];
    },
  },
});
historyService.attach(service);

const transport = createNodeTransport();
transport.use(async (context, next) => {
  context.userID = "demo-user";
  await next();
});
transport.register(new UniverHistoryEndpoint(historyService));
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
server.on("upgrade", (request, socket, head) =>
  transport.handleUpgrade(request, socket, head),
);
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3010);
server.listen(port, host, () =>
  console.info(
    `History is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`,
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
  ToggleEditHistoryOperation,
  UniverEditHistoryLoaderPlugin,
} from "@univerjs-pro/edit-history-loader";
import EditHistoryLoaderEnUS from "@univerjs-pro/edit-history-loader/locale/en-US";
import EditHistoryViewerEnUS from "@univerjs-pro/edit-history-viewer/locale/en-US";
import { UniverLicensePlugin } from "@univerjs-pro/license";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, defaultTheme, mergeLocales } from "@univerjs/presets";
import "./styles.css";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";
import "@univerjs-pro/edit-history-viewer/lib/index.css";

document.querySelector<HTMLElement>("#toolbar")!.innerHTML =
  '<button id="history">History</button>';
document.querySelector<HTMLElement>("#status")!.textContent =
  "Edit the Sheet, then click History.";
const baseURL = `${location.protocol}//${location.host}/universer-api`;
const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      CollaborationClientEnUS,
      CollaborationClientUIEnUS,
      EditHistoryLoaderEnUS,
      EditHistoryViewerEnUS,
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
    [
      UniverEditHistoryLoaderPlugin,
      { historyListServerUrl: `${baseURL}/history`, univerContainerId: "app" },
    ],
  ],
});

document.querySelector<HTMLButtonElement>("#history")!.onclick = () =>
  univerAPI.executeCommand(ToggleEditHistoryOperation.id);
```
