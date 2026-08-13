# SDK and capability boundaries

## Select by responsibility

| Need | Select |
| --- | --- |
| Embed or extend Sheet, Doc, Slide, Board, or Base | Univer/Core/Pro plugins, presets, and Facade |
| Persist and synchronize authoritative collaborative content | Collaboration SDK |
| Run a bounded content task in Node or an Agent worker | CLI SDK headless and collaboration runtime |
| Store users, ACL, folders, resources, sharing, and product operations | Product application |
| Import or export Office content | CLI SDK unit exchange capability |
| Inspect stored content | CLI SDK content inspection |
| Render or capture screenshots | CLI SDK render runtime and screenshot capability |
| Check Slide layout | CLI SDK layout lint; do not generalize it to other Units |

## Supported collaboration route

Use the self-hosted Collaboration SDK chain:

```text
Node Transport → Collaboration Endpoint → Collaboration Service → Database Adapter
```

The legacy Univer Server integration is deprecated and unsupported. Do not select it for new apps,
document its installation, or combine it with the supported chain.

## Univer/Core/Pro rules

- Prefer Facade for application-level content operations.
- Use plugin and DI extension points for genuine product extensions.
- Change live state through Facade or commands; never edit snapshots in place.
- Avoid registering a plugin twice through both a preset and a manual plugin list.
- Keep all version-coupled packages on the same exact release.

## Collaboration package roles

- Service is the network-independent collaboration authority.
- Node Transport is the generic HTTP/WebSocket ingress.
- Endpoint implements the Univer client protocol and realtime Session behavior.
- Database Adapters preserve atomic snapshot, revision, changeset, and idempotency contracts.
- History is a derived view over confirmed revisions, not the content authority.
- Thread Comment owns comment threads; its anchors can refer to Unit content without moving content
  ownership into the comment store.
- Worktree owns isolated draft lifecycle and merge; the product application still owns catalog and
  review-product behavior.

## CLI package roles

- Headless factory assembles the standard Node content runtime. It does not own collaboration.
- Collaboration runtime binds one Unit and exposes explicit load/fetch/pull/execute/commit state.
- Runtime pool and worker pool manage expensive stateful instances; application keys and targets
  remain opaque and product-owned.
- Content execution binds Facade code to a known Unit.
- Content inspection reads Sheet, Doc, or Slide models without changing them.
- Unit exchange converts Office files and UnitData.
- Render runtime materializes UnitData in a browser environment.
- Screenshot captures supported Unit output; layout lint currently contains verified Slide rules.

## Unit scope

The architecture supports Sheet, Doc, Slide, Board, and Base. Capability coverage is narrower:

- Do not apply Sheet ranges, formulas, or cell APIs to other Units.
- Do not claim Doc pagination or Slide layout rules for Board or Base.
- Do not claim content inspection support beyond the Unit types documented by its current package.
- Label every recipe with the Unit types validated by its source and release cohort.

## Application-owned seams

The SDKs intentionally do not standardize:

- Cookie, token, OAuth, or account storage;
- Space, Node, Resource, trash, recent items, or sharing models;
- mapping a user-facing target to Unit and Worktree identifiers;
- reliable business workflows across product and collaboration stores;
- deployment secrets, backups, observability, and product policy.

Implement those seams once in the product application and inject them into Transport, Endpoint,
Service, CLI target adapters, and command presentation as appropriate.
