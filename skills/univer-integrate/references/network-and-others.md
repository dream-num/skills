# Network and Optional Infrastructure

This reference covers the public surface of optional OSS packages in Univer `1.0.0-beta.0`. Do not register infrastructure a product does not use.

## HTTP and WebSocket

Register `UniverNetworkPlugin` and its Facade extension in manual Plugin Mode:

```ts
import { UniverNetworkPlugin } from '@univerjs/network';

import '@univerjs/network/facade';

univer.registerPlugin(UniverNetworkPlugin);
```

HTTP methods return Univer `HTTPResponse<T>` values:

```ts
const network = univerAPI.getNetwork();

const result = await network.get<{ name: string }>('/api/profile', {
  params: { id: 'user-1' },
});

await network.post('/api/workbooks', {
  body: { snapshot: workbook.save() },
});
```

The current methods are `get`, `post`, `put`, `delete`, `patch`, and `getSSE`. There is no `FNetwork.fetch` method. Check the installed request type declarations for headers, query parameters, body, and response details.

WebSocket lifecycle is observable:

```ts
const socket = univerAPI.createSocket('wss://example.com/events');

const opened = socket.open$.subscribe(() => socket.send('hello'));
const messages = socket.message$.subscribe((event) => {
  console.log(event.data);
});

opened.unsubscribe();
messages.unsubscribe();
socket.close();
```

Authenticate the connection and validate every inbound message before mapping it to a Command. A WebSocket is transport only; it is not the Univer collaboration protocol.

## Watermark

Register `UniverWatermarkPlugin` and import its Facade extension:

```ts
import '@univerjs/watermark/facade';

univerAPI.addWatermark('text', {
  content: 'Confidential',
  fontSize: 20,
  repeat: true,
});

univerAPI.deleteWatermark();
```

Image watermarks use `addWatermark('image', { url, width, height, ... })`. The watermark package depends on browser rendering and is not a headless Node feature.

## Action Recorder

`@univerjs/action-recorder` provides `UniverActionRecorderPlugin` and `ActionRecorderService`; it does not expose an Action Recorder Facade.

Inside DI-managed plugin code:

```ts
import { ActionRecorderService } from '@univerjs/action-recorder';

const recorder = injector.get(ActionRecorderService);
recorder.startRecording();

const subscription = recorder.recordedCommands$.subscribe((commands) => {
  console.log(commands);
});

recorder.completeRecording();
subscription.unsubscribe();
```

`completeRecording()` downloads the recorded JSON in the browser and then stops recording. `stopRecording()` clears the recorded command lists and returns `void`; do not expect either method to return the actions.

Only commands registered with `registerRecordedCommand` are captured. Mutations cannot be registered directly.

## Telemetry

`@univerjs/telemetry` exports the `ITelemetryService` DI identifier and interface. It does not ship a ready-made `UniverTelemetryPlugin` or vendor reporter.

Provide an application-owned class that implements `ITelemetryService` only when a registered feature requests it. Import the value identifier from `@univerjs/telemetry`, then add `[ITelemetryService, { useClass: AppTelemetryService }]` to the `override` array of the application's existing `createUniver` configuration.

The implementation is responsible for consent, redaction, identity, transport, retries, and vendor configuration.

## Debug tooling

`@univerjs/debugger`, `@univerjs/mockdata`, and `@univerjs/storybook` are workspace development packages, not production integration dependencies. Do not emit them into external application setups.
