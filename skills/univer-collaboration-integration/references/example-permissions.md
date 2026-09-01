<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# Permissions

## Overview

展示应用如何把可信用户身份传给协同服务，并在服务端保护 Unit 读取、实时房间和变更提交。

```bash
pnpm example:permissions
```

打开 <http://127.0.0.1:3010>。页面提供两个固定演示账号：`editor` 可以编辑，`viewer` 只能
读取。切换账号会写入本地演示 Cookie；生产应用应替换为自己的 Session 或 Bearer token。

身份读取、两种角色和所有权限检查都顺序写在 `server/main.ts`。权限判断全部发生在服务端，
前端提示不是安全边界。

## Server

```ts
import { createServer, type IncomingMessage } from "node:http";
import express from "express";
import { LocaleType, type IWorkbookData } from "@univerjs/core";
import { MemoryDatabaseAdapter } from "@univerjs-pro/collaboration-database-memory";
import { UniverCollabEndpoint } from "@univerjs-pro/collaboration-endpoint";
import {
  CollabError,
  UniverCollabService,
} from "@univerjs-pro/collaboration-service";
import { createNodeTransport } from "@univerjs-pro/collaboration-transport-node";
import { ErrorCode, UniverType } from "@univerjs/protocol";

const UNIT_ID = "permissions-sheet";
const users = {
  editor: { userId: "user-editor", username: "editor", role: "editor" },
  viewer: { userId: "user-viewer", username: "viewer", role: "viewer" },
} as const;
type DemoUser = (typeof users)[keyof typeof users];

function currentUser(request: IncomingMessage): DemoUser | undefined {
  const name = request.headers.cookie?.match(
    /(?:^|;\s*)demo_user=(editor|viewer)(?:;|$)/u,
  )?.[1] as keyof typeof users | undefined;
  return name ? users[name] : undefined;
}
function canRead(userID: string) {
  return userID === users.editor.userId || userID === users.viewer.userId;
}
function canEdit(userID: string) {
  return userID === users.editor.userId;
}

const unitData: IWorkbookData = {
  id: UNIT_ID,
  rev: 1,
  name: "Permissions Sheet",
  appVersion: "",
  locale: LocaleType.EN_US,
  sheetOrder: ["sheet-1"],
  sheets: {
    "sheet-1": {
      id: "sheet-1",
      name: "Sheet 1",
      rowCount: 100,
      columnCount: 26,
      cellData: { 0: { 0: { v: "Try editor and viewer" } } },
    },
  },
  styles: {},
  resources: [],
};

const database = new MemoryDatabaseAdapter();
const service = new UniverCollabService({ dbAdapter: database });
const endpoint = new UniverCollabEndpoint(service);
const transport = createNodeTransport();
service.use("readUnitData", async (context, next) => {
  if (!canRead(context.userID))
    throw new CollabError("PERMISSION_DENIED", "Cannot read this Unit");
  await next();
});
service.use("submitChangeset", async (context, next) => {
  if (!canEdit(context.userID))
    throw new CollabError("PERMISSION_DENIED", "Cannot edit this Unit");
  await next();
});
service.use("applyChangeset", async (context, next) => {
  if (!canEdit(context.userID))
    throw new CollabError("PERMISSION_DENIED", "Cannot edit this Unit");
  await next();
});
endpoint.use("joinUnit", async (context, next) => {
  if (!canRead(context.session.userID))
    throw new CollabError("PERMISSION_DENIED", "Cannot join this Unit");
  await next();
});
transport.use(async (context, next) => {
  const user = currentUser(context.incomingMessage);
  if (!user) {
    context.response.statusCode = 401;
    context.response.end("Sign in first");
    return;
  }
  context.userID = user.userId;
  await next();
});
transport.register(endpoint);
await service.createUnitFromData(
  { type: UniverType.UNIVER_SHEET, data: unitData },
  { userID: users.editor.userId },
);

const app = express();
app.get("/login/:username", (request, response) => {
  if (
    request.params.username !== "editor" &&
    request.params.username !== "viewer"
  )
    return void response.sendStatus(404);
  response.setHeader(
    "Set-Cookie",
    `demo_user=${request.params.username}; Path=/; HttpOnly; SameSite=Lax`,
  );
  response.redirect(`/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`);
});
app.get("/universer-api/demo/me", (request, response) => {
  const user = currentUser(request);
  user
    ? response.json({ username: user.username, role: user.role })
    : response.sendStatus(401);
});
app.post(
  "/universer-api/authz/-/object/-/batch_allowed",
  express.json(),
  (request, response) => {
    const user = currentUser(request);
    if (!user) return void response.sendStatus(401);
    const body = request.body as {
      requests: Array<{ unitID: string; objectID: string; actions: unknown[] }>;
    };
    response.json({
      error: { code: ErrorCode.OK, message: "" },
      objectActions: body.requests.map((item) => ({
        unitID: item.unitID,
        objectID: item.objectID,
        actions: item.actions.map((action) => ({
          action,
          allowed: canEdit(user.userId),
        })),
      })),
    });
  },
);
app.get("/", (request, response, next) => {
  if (!currentUser(request)) return void response.redirect("/login/editor");
  next();
});
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
    `Permissions is running at http://${host}:${port}/?unit=${UNIT_ID}&type=${UniverType.UNIVER_SHEET}`,
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

const currentUser = (await fetch("/universer-api/demo/me").then((response) =>
  response.json(),
)) as { username: string; role: string };
document.querySelector<HTMLElement>("#toolbar")!.innerHTML =
  `<span>Current: ${currentUser.username} (${currentUser.role})</span><a href="/login/editor">Use editor</a><a href="/login/viewer">Use viewer</a>`;
document.querySelector<HTMLElement>("#status")!.textContent =
  currentUser.role === "editor"
    ? "This user can edit."
    : "The server rejects this user's edits.";
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
