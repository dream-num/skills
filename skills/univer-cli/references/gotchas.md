# Gotchas

- `new`, `import`, and `export` success is not enough; inspect workbook-visible state before relying on it.
- `manifest.json` is file-level metadata only. It does not prove sheet names, sheet count, formulas, or changed cells.
- Local file identity is the workbook path such as `./budget.univer`, not `unitId`, `sessionId`, or manifest ids.
- Quote the full A1 range string for shell-sensitive worksheet names: `univer inspect range ./book.univer --range '工作表1!A1:J20'`.
- Shell pipelines can preserve row count while shifting headers or keys; verify headers, first sample rows, and key columns after writeback.
- `run` should stay bounded: touch explicit sheets and ranges, and return small structured evidence.
