# SDK Boundaries

Use this chapter to decide where a capability belongs before choosing a package or writing an
adapter. [简体中文](./sdk-boundaries.zh-CN.md)

## Ownership matrix

| Product need | Owner | Why |
| --- | --- | --- |
| Office content model and editing | Univer/Core/Pro | Defines Unit models, plugins, Facade, commands, and mutations |
| Browser Office UI | Univer/Core/Pro | Owns content UI and rendering plugins |
| Authoritative collaborative state | Collaboration SDK | Owns snapshot, changeset, revision, OT, and idempotency |
| Collaboration HTTP/WebSocket protocol | Collaboration SDK | Transport and Endpoint implement the supported client protocol |
| Headless content execution | CLI SDK | Composes standard Node content plugins and explicit execution |
| Agent collaboration state | CLI SDK runtime + Collaboration SDK authority | Runtime manages a bounded client state machine; server remains authoritative |
| Office import/export | CLI SDK unit exchange | Converts Office wire formats and UnitData |
| Inspection and visual evidence | CLI SDK | Inspection, render runtime, screenshot, and Unit-specific lint |
| Users and authentication | Product application | SDKs consume trusted identity but do not define account policy |
| ACL and tenancy | Product application | Policy applies through product APIs and SDK middleware |
| Space/Node/Resource hierarchy | Product application | Product navigation is not collaboration content state |
| Worktree catalog and review product | Product application | Worktree SDK owns draft mechanics, not task management UX |
| Backups, deployment, observability | Product application | Operational policy belongs to the deployed product |

## Univer/Core/Pro

Univer is a plugin-based content engine. Presets are curated plugin assemblies; explicit plugin mode
offers more control. Do not register the same capability through both paths. Keep all coupled
`@univerjs/*` and `@univerjs-pro/*` packages on the same exact version.

Use Facade for ordinary application authoring. Facade prepares and executes commands. Use lower
layers only for plugin development or a feature unavailable through Facade. Never treat a snapshot
as mutable live state.

`univer-sdk-skills` and official documentation are authoritative for this layer. When their API
examples differ from the target release cohort, preserve their architectural knowledge but verify
the exact call against current declarations or a cohort-matched canonical application.

## Collaboration SDK

The only supported collaboration route is:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

These are complementary layers, not alternatives. The legacy Univer Server integration is
deprecated and unsupported; do not use it for new applications.

Optional collaboration domains remain separate:

- **History** derives human-facing history from confirmed revisions; it is not content authority.
- **Thread Comment** owns threads and replies; anchors may refer to content without moving content
  ownership.
- **Worktree** owns isolated draft, ready/reopen/discard/evaluate/merge lifecycle; the application
  owns the task catalog and review experience.

Each optional domain has its own Service, Endpoint, Adapter, and middleware boundaries even when it
reuses Transport, authentication, or a physical database file.

## CLI SDK

CLI SDK packages are explicit capabilities, not a complete product framework:

| Capability | Responsibility | Important limit |
| --- | --- | --- |
| headless Univer | Standard Node content plugin assembly | No snapshot/revision/commit ownership |
| collaboration runtime | Explicit single-Unit load, pull, execute, commit | No product auth, target, or background sync policy |
| runtime/worker pool | Exclusive reuse of expensive stateful runtime | Application owns opaque key and target |
| content execution | Bind Facade code to an explicit Unit | Does not resolve product targets |
| content inspection | Read structured Sheet, Doc, Slide content | Do not claim unsupported Unit coverage |
| unit exchange | Office ↔ UnitData conversion | Application chooses collaborative or offline destination |
| render runtime | Render materialized UnitData | Does not load authoritative content |
| unit screenshot | Produce structured image output | Use Unit-specific capture targets |
| layout lint | Conservative layout checks | Current verified rules are Slide-only |

Command packages are thin presentation presets over capability packages. Product-specific commands,
authentication, and target resolution stay in the application.

## Unit types are not interchangeable APIs

The integrated architecture supports Sheet, Doc, Slide, Board, and Base. Individual features have
narrower evidence:

- Sheet has ranges, cells, tables, charts, formulas, and sheet blocks.
- Doc has document structure, paragraphs, pagination, and rich text behavior.
- Slide has pages, shapes, layout facts, and the currently verified layout lint surface.
- Board has an open-canvas model and its own render targets.
- Base has tables, fields, records, views, and formula-shape behavior.

Never infer that a capability validated for one Unit works for another. State the Unit scope and
release cohort next to every runnable recipe.

## Rules that prevent ownership leaks

- A Collaboration Database Adapter never authenticates, performs OT, or broadcasts.
- Collaboration Service never depends on Endpoint, Transport, or a concrete adapter.
- CLI runtime never becomes a Workspace catalog or credential store.
- Product ACL never trusts identity or revision copied from a client payload.
- Product and collaboration stores never rely on an assumed shared transaction.
- Browser automatic collaboration and CLI manual collaboration never run in one headless instance.
- External side effects never run in retryable collaboration stages without an idempotent/outbox
  design.
