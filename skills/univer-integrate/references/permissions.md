# Permission Facades

The Sheets Facade in Univer `1.0.0-beta.0` exposes workbook, worksheet, and range permissions. Preset Mode registers it automatically; Plugin Mode needs `@univerjs/sheets` plus:

```ts
import '@univerjs/sheets/facade';
```

Permission writes are asynchronous when they update authorization data. Await them and handle failures.

## Workbook permission

```ts
const workbook = univerAPI.getActiveWorkbook();
if (!workbook) throw new Error('No active workbook');

const permission = workbook.getWorkbookPermission();

await permission.setMode('viewer');
await permission.setMode('editor');
await permission.setMode('commenter');
await permission.setMode('owner');

await permission.setReadOnly();
await permission.setEditable();

await permission.setPoint(
  univerAPI.Enum.WorkbookPermissionPoint.Print,
  false,
);

const canEdit = permission.canEdit();
const snapshot = permission.getSnapshot();
```

`setMode` applies a predefined set of workbook permission points. Use `setPoint` when the product needs a narrower policy.

## Worksheet protection

```ts
const worksheet = workbook.getActiveSheet();
const permission = worksheet.getWorksheetPermission();

if (!permission.isProtected()) {
  await permission.protect({
    name: 'Approved data',
    allowViewByOthers: true,
  });
}

await permission.setMode('readOnly');

// Later:
await permission.unprotect();
```

Worksheet modes are `editable`, `readOnly`, and `filterOnly`. `protect` rejects an already-protected worksheet; call `isProtected()` or `unprotect()` first.

When `allowedUsers` is provided, each id must already resolve to a collaborator for that workbook:

```ts
await permission.protect({
  name: 'Finance editors',
  allowedUsers: ['user-1', 'user-2'],
  allowViewByOthers: false,
});
```

This API creates authorization data through the configured `IAuthzIoService`. Configure a real authorization backend before relying on collaborator restrictions.

## Range protection

```ts
const range = worksheet.getRange('B2:D20');
const permission = range.getRangePermission();

const rule = await permission.protect({
  name: 'Calculated cells',
  allowViewByOthers: true,
});

console.log(rule.id, rule.permissionId, rule.ranges);

const rules = await permission.listRules();
await permission.unprotect();
```

`isProtected()` returns true when any protection rule intersects the range. `unprotect()` removes all intersecting rules.

For large sheets, skip collaborator lookups when only rule geometry is needed:

```ts
const rules = await permission.listRules({ ignoreCollaborators: true });
```

## Rules and boundaries

- Protection is not password-based worksheet encryption.
- Do not use removed `setLocked`-style range APIs.
- Do not mutate protection models directly; use the permission Facades so authorization resources and sheet rules stay aligned.
- Client-side UI restrictions are not a security boundary. Enforce access again on the server for shared or sensitive data.
- Test the configured authorization service and current user identity before shipping collaborator-specific policies.
