# Collaboration Guide

Univer Pro collaboration loads persisted server units, exchanges edits with Universer, displays collaborators and sync state, and can enable offline editing and edit history.

## Preferred Sheets setup

Use the collaboration preset after `UniverSheetsAdvancedPreset`:

```bash
npm install @univerjs/preset-sheets-collaboration@1.0.0-beta.0
```

```ts
import { UniverSheetsCollaborationPreset } from '@univerjs/preset-sheets-collaboration';
import UniverPresetSheetsCollaborationEnUS from '@univerjs/preset-sheets-collaboration/locales/en-US';

import '@univerjs/preset-sheets-collaboration/lib/index.css';

const collaborationPreset = UniverSheetsCollaborationPreset({
  universerEndpoint: 'https://your-universer.example.com',
  univerContainerId: 'app',
  enableOfflineEditing: true,
  enableSingleActiveInstanceLock: true,
  enableFrontendLog: false,
});
```

Set `collaboration: true` in the top-level `createUniver` options, merge the preset locale, and append `collaborationPreset` after the Advanced preset. Pass `collaboration: true` to OSS feature presets that expose that option, such as the Drawing preset. The current collaboration preset composes `UniverCollaborationPlugin`, `UniverCollaborationClientPlugin`, `UniverCollaborationClientUIPlugin`, `UniverEditHistoryLoaderPlugin`, the browser socket service, and both collaboration Facade entries.

## Manual Plugin Mode

Use this only when a preset cannot express the required composition. Register the license before this stack:

```ts
import { UniverCollaborationPlugin } from '@univerjs-pro/collaboration';
import { UniverCollaborationClientPlugin } from '@univerjs-pro/collaboration-client';
import {
  BrowserCollaborationSocketService,
  UniverCollaborationClientUIPlugin,
} from '@univerjs-pro/collaboration-client-ui';

import '@univerjs-pro/collaboration-client/facade';
import '@univerjs-pro/collaboration-client-ui/facade';

const universerEndpoint = 'https://your-universer.example.com';
const websocketEndpoint = 'wss://your-universer.example.com';

univer.registerPlugin(UniverCollaborationPlugin);
univer.registerPlugin(UniverCollaborationClientPlugin, {
  socketService: BrowserCollaborationSocketService,
  enableOfflineEditing: true,
  enableSingleActiveInstanceLock: false,
  enableAuthServer: true,
  authzUrl: `${universerEndpoint}/universer-api/authz`,
  snapshotServerUrl: `${universerEndpoint}/universer-api/snapshot`,
  collabSubmitChangesetUrl: `${universerEndpoint}/universer-api/comb`,
  collabWebSocketUrl: `${websocketEndpoint}/universer-api/comb/connect`,
  loginUrlKey: `${universerEndpoint}/universer-api/oidc/authpage`,
  uploadFileServerUrl: `${universerEndpoint}/universer-api/stream/file/upload`,
  signUrlServerUrl: `${universerEndpoint}/universer-api/file/{fileID}/sign-url`,
  downloadEndpointUrl: `${universerEndpoint}/`,
  wsSessionTicketUrl: `${universerEndpoint}/universer-api/user/session-ticket`,
  startFormulaLimitUrl: `${universerEndpoint}/universer-api/license/formula/limit/start`,
  getFormulaLimitStatusUrl: `${universerEndpoint}/universer-api/license/formula/limit/status`,
  releaseFormulaLimitUrl: `${universerEndpoint}/universer-api/license/formula/limit/done`,
  sendChangesetTimeout: 200,
});
univer.registerPlugin(UniverCollaborationClientUIPlugin);
```

`socketService` is required. Supplying `BrowserCollaborationSocketService` already selects the browser implementation; do not redundantly bind `ICollaborationSocketService` through `override`.

## Load a server unit

Do not create a blank local unit with the same ID. Load the server snapshot and initialize collaboration:

```ts
import { UniverInstanceType } from '@univerjs/core';

const unitModel = await univerAPI.loadServerUnit(
  unitId,
  UniverInstanceType.UNIVER_SHEET,
);
if (!unitModel) throw new Error('The shared workbook could not be loaded');
```

Or use the typed collaboration facade:

```ts
const collaboration = univerAPI.getCollaboration();
const workbook = await collaboration.loadSheetAsync(unitId);
```

`FCollaboration` also has `loadDocAsync`, `loadSlideAsync`, `loadBaseAsync`, `loadBoardAsync`, and `loadPdfAsync`. `univerAPI.loadServerUnitOfRevision(...)` loads a specific persisted revision when that workflow requires one.

## Observe and flush state

```ts
const collaboration = univerAPI.getCollaboration();

const membersSubscription = collaboration.subscribeCollaborators(unitId, (members) => {
  renderCollaborators(members);
});

const statusSubscription = univerAPI.addEvent(
  univerAPI.Event.CollaborationStatusChanged,
  ({ unitId: changedUnitId, status }) => {
    renderSyncStatus(changedUnitId, status);
  },
);

const status = collaboration.getCollaborationStatus(unitId);
await collaboration.flush(unitId, { timeout: 30_000 });

membersSubscription.dispose();
statusSubscription.dispose();
```

Current status values are `NOT_COLLAB`, `SYNCED`, `PENDING`, `AWAITING`, `AWAITING_WITH_PENDING`, `FETCH_MISS`, `CONFLICT`, and `OFFLINE`. `flush` resolves when pending changes reach `SYNCED`; it rejects on timeout or an unrecoverable current status.

Keep subscriptions for as long as their owning UI is mounted, then dispose them. Do not add an arbitrary delay as a substitute for `flush`.

## Create a persisted unit

Creating a new collaborative unit is a server API operation. The current Universer route shape is:

```text
POST /universer-api/snapshot/{unitType}/unit/-/create
```

Send the matching `UniverInstanceType`, name, and creator; use the returned `unitID` with the loading APIs above. Authenticate and authorize this request according to the deployment rather than exposing privileged credentials in the browser.

## Custom transport

For a non-browser transport, supply a class implementing the current narrow service contract:

```ts
interface ICollaborationSocketService {
  createSocket(url: string): Promise<ICollaborationSocket | null>;
}
```

`ICollaborationSocket` carries the collaboration protocol observables and `send`/`close` methods. Reuse the repository's environment implementation whenever possible; do not implement an old `connect`/`disconnect`/`onMessage` interface.

## Collaborative thread comments

The current published package name is `@univerjs-pro/thread-comment-datasource`:

```ts
import { UniverThreadCommentDataSourcePlugin } from '@univerjs-pro/thread-comment-datasource';

univer.registerPlugin(UniverThreadCommentDataSourcePlugin);
```
