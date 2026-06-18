# Managed Inspect Tool Resources

This directory contains product-managed inspect tool resources for `univer inspect --tool`. Do not
run these files directly or treat them as reusable scratch scripts.

Run managed tools through the public inspect runner:

```bash
univer inspect <file.univer> --tool <tool-id> --params <params.json|->
```

Use `--md` when evidence is easier to scan as Markdown. Use default JSON or `--json` for programmatic parsing.

Use `../references/evidence-tools.md` for routing guidance, output semantics, params handling, and
when to escalate from managed tools to a bounded readonly scratch probe.
