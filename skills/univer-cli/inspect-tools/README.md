# Univer CLI Managed Inspect Tool Package

This directory is a manifest-backed managed inspect tool package for the Univer CLI resolver.
Do not run these JavaScript files directly and do not copy them into SaC sidecars.
Run managed tools only through the CLI trust gate:

```bash
univer inspect <file.univer> --tool <tool-id> --params <params.json>
```

`--params -` also works with a JSON object on stdin. Do not pass inline JSON as the option value:
`--params '{}'` is treated as a file path named `{}`.

Use `univer inspect tools list --json` and `univer inspect tools resolve <tool-id> --json` to inspect provider selection and compatibility.
