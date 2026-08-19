<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/daemon

English | 简体中文

Let multiple short-lived local processes reuse the same resident Node.js process and send JSON requests over a Unix socket or Windows named pipe.

It is intended for services with high startup costs or in-memory state that must survive across CLI invocations. If the logic can run directly in the current process, or an HTTP or queue-based service boundary already exists, this package is unnecessary.

## Installation

```bash
pnpm add @univer-cli/daemon
```

Requires Node.js 22.12 or higher.

## How to work

When the client makes a request:

1. It tries to connect to the specified socket.
2. It verifies the running daemon's identity and protocol.
3. If the socket is unavailable, it starts the entry provided by the application.
4. It waits for a compatibility handshake.
5. It sends a JSON request and returns the JSON response.

The package owns transport and lifecycle behavior. It does not define the application's business methods or resident state.

## Create daemon entry

```ts
import { createDaemonServer, DAEMON_SOCKET_ENV, type JsonValue } from "@univer-cli/daemon";

const socketPath = process.env[DAEMON_SOCKET_ENV];
if (!socketPath) throw new Error(`${DAEMON_SOCKET_ENV} is required`);

let value = 0;

const server = createDaemonServer({
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath,
  onShutdown: async () => {
    value = 0;
  },
});

server.handle("counter.add", async (payload) => {
  if (typeof payload !== "number") throw new Error("Expected a number");
  value += payload;
  return value satisfies JsonValue;
});

await server.listen();
```

Register every handler before `listen()`. `daemon.status` and `daemon.shutdown` are reserved methods and cannot be overridden by the application.

## Send request

```ts
import { createDaemonClient } from "@univer-cli/daemon";

const client = createDaemonClient({
  entry: new URL("./counter-daemon.js", import.meta.url),
  identity: { id: "my-cli", version: "1.2.0" },
  socketPath: "/tmp/my-cli.sock",
});

const result = await client.request("counter.add", 2);
```

Payloads and results must be JSON values. Request and startup timeouts can be configured independently. A timeout ends only the current client's wait; it does not terminate a daemon that has passed identity verification.

## Explicit lifecycle control

`createDaemonControl()` provides `status()`, `start()`, `restart()`, and `stop()`. Use it to expose explicit management commands or clean up resident processes during upgrades or application shutdown.

For the preset command, see [`@univer-cli/daemon-command`](./package-daemon-command.md).

## Identity and errors

Identity includes at least a stable application `id` and `version`, and may also include a build ID. The client does not reuse a process with an incompatible identity. Connection, handshake, protocol, timeout, and remote handler errors retain stable error codes so adapters can decide whether to suggest retrying, upgrading, or checking daemon logs.

## Responsibility boundaries

The package is responsible for socket framing, on-demand startup, compatibility handshakes, request/response handling, timeouts, and socket cleanup. The application is responsible for the entrypoint, socket path, business methods, state, credentials, and shutdown cleanup.
