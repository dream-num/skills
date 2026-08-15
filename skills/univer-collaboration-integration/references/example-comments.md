<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Comments

## Overview

在基础协同 Sheet 上增加 Thread Comment 的服务端存储、协议 Endpoint 和前端入口。

```bash
pnpm example:comments
```

打开 <http://127.0.0.1:3010/?unit=comments-sheet&type=2>，选择单元格并使用评论入口。`server/main.ts` 展示了
Comment Service 的独立 Adapter，以及 Comment Endpoint 如何通过 `roomHost` 复用主协同
Endpoint 的 Session 和 Unit room。

评论 anchor 仍随 Sheet 协同数据变化，评论正文和 solved 状态由 Comment Service 保存；两者
必须一起纳入业务数据生命周期。

## Server

```ts
import { createServer } from "node:http";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { MemoryCommentDatabaseAdapter } from "@univerjs-pro/collaboration-comment-database-memory";
import { UniverCommentEndpoint } from "@univerjs-pro/collaboration-comment-endpoint";
import { UniverCommentService } from "@univerjs-pro/collaboration-comment-service";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import { UniverCollabService } from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "comments-sheet";
const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "Comments Sheet",
  appVersion: "",
  locale: LocaleType.EN_US,
  sheetOrder: ["sheet-1"],
  sheets: {
    "sheet-1": {
      id: "sheet-1",
      name: "Sheet 1",
      rowCount: 100,
      columnCount: 26,
      cellData: { 0: { 0: { v: "Add a comment here" } } },
    },
  },
  styles: {},
  resources: [],
};

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const commentDatabase = new MemoryCommentDatabaseAdapter();
const commentService = new UniverCommentService({
  database: commentDatabase,
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
const transport = createNodeTransport();
transport.use(async (context, next) => {
  context.userID = "demo-user";
  await next();
});
transport.register(
  new UniverCommentEndpoint({ service: commentService, roomHost: endpoint }),
);
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
    `Comments is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`,
  ),
);
```

## Web

```ts
import { LocaleType, LogLevel, UserManagerService } from "@univerjs/core";
import { UniverCollaborationPlugin } from "@univerjs-pro/collaboration";
import { UniverCollaborationClientPlugin } from "@univerjs-pro/collaboration-client";
import CollaborationClientEnUS from "@univerjs-pro/collaboration-client/locale/en-US";
import {
  BrowserCollaborationSocketService,
  UniverCollaborationClientUIPlugin,
} from "@univerjs-pro/collaboration-client-ui";
import CollaborationClientUIEnUS from "@univerjs-pro/collaboration-client-ui/locale/en-US";
import { UniverLicensePlugin } from "@univerjs-pro/license";
import { UniverThreadCommentDataSourcePlugin } from "@univerjs-pro/thread-comment-datasource";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, defaultTheme, mergeLocales } from "@univerjs/presets";
import { UniverSheetsThreadCommentUIPlugin } from "@univerjs/sheets-thread-comment-ui";
import SheetsThreadCommentUIEnUS from "@univerjs/sheets-thread-comment-ui/locale/en-US";
import ThreadCommentUIEnUS from "@univerjs/thread-comment-ui/locale/en-US";
import "./styles.css";
import "@univerjs/preset-sheets-core/lib/index.css";
import "@univerjs-pro/collaboration-client-ui/lib/index.css";
import "@univerjs/sheets-thread-comment-ui/lib/index.css";
import "@univerjs/thread-comment-ui/lib/index.css";

document.querySelector<HTMLElement>("#status")!.textContent =
  "Select a cell and add a thread comment.";
const baseURL = `${location.protocol}//${location.host}/universer-api`;
const { univer } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      CollaborationClientEnUS,
      CollaborationClientUIEnUS,
      ThreadCommentUIEnUS,
      SheetsThreadCommentUIEnUS,
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
    UniverSheetsThreadCommentUIPlugin,
    UniverThreadCommentDataSourcePlugin,
  ],
});
univer.__getInjector().get(UserManagerService).setCurrentUser({
  userID: "demo-user",
  name: "Demo User",
  avatar: "",
  anonymous: false,
  canBindAnonymous: false,
  phone: "",
  email: "",
  createTimestamp: 0,
});
```
