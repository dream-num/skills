<!-- generated-by: generate-sdk-integration-skill; do not edit -->

# @univer-cli/unit-exchange

在 Node.js 中把 Office 文件转换为 Univer UnitData，或把 UnitData 写成 Office 文件。package 直接调用
`@univerjs-pro/uexcli`，并在内部完成 exchange wire、Snapshot 和 SheetBlock 转换；调用方不需要理解这些内部格式。

当前支持：

| Unit  | 导入                              | 导出           |
| ----- | --------------------------------- | -------------- |
| Sheet | XLS、XLSX、XLSM、CSV、TSV         | XLSX、CSV、TSV |
| Base  | XLS、XLSX                         | XLSX、CSV、TSV |
| Doc   | DOC、DOCX                         | DOCX           |
| Slide | PPT、PPTX、PPTM、PPSX、PPSM、POTX | PPTX           |

## 安装

```bash
pnpm add @univer-cli/unit-exchange
```

需要 Node.js 22.12 或更高版本。`@univerjs-pro/uexcli` 会安装当前平台对应的 native binary。

## 导入

```ts
import { createUnitExchange } from "@univer-cli/unit-exchange";
import { UniverInstanceType } from "@univerjs/core";

const exchange = createUnitExchange();
const imported = await exchange.importFile({
  sourcePath: "/tmp/report.xlsx",
  unitType: UniverInstanceType.UNIVER_SHEET,
});

imported.data; // IWorkbookData
```

`unitType` 使用 Univer SDK 的 `UniverInstanceType`。XLS/XLSX 可以导入为 Sheet 或 Base；其他格式必须使用与其
内容对应的 Unit 类型。

## 导出

```ts
import { UnitExchangeFormat, createUnitExchange } from "@univer-cli/unit-exchange";
import { UniverInstanceType } from "@univerjs/core";

const exchange = createUnitExchange();
const result = await exchange.exportFile({
  unit: {
    type: UniverInstanceType.UNIVER_SHEET,
    data: workbookData,
  },
  format: UnitExchangeFormat.XLSX,
  outputPath: "/tmp/report-output",
});

result.outputPath; // /tmp/report-output
```

`format` 与 `outputPath` 分离。输出文件不需要扩展名，实际格式只由 `UnitExchangeFormat` 决定。当前的类型声明与
runtime 校验都要求 Sheet/Base 使用 XLSX/CSV/TSV、Doc 使用 DOCX、Slide 使用 PPTX。CSV/TSV 可分别用
`sheetName` 选择 Sheet worksheet、用 `tableName` 选择 Base table。导入和导出可用
`formulaCalculationMode: "forced" | "when_empty" | "no"` 控制 converter 的公式计算策略；省略时沿用
converter 默认值。

## 职责范围

本 package 不依赖面向浏览器的 `@univerjs-pro/exchange-client`，只定义当前 Node capability 所需的
`UnitExchangeFormat`。它不负责 URL 下载、Workspace 认证、`.univer` 生命周期、远程 Unit 创建、Commander
参数和终端输出；这些行为由 application 组合。

导入返回普通 UnitData，可以直接交给 Collaboration SDK 的 `createUnitFromData()`。plugin resources 已包含在
UnitData/Snapshot meta 中；公共 interface 不接受额外的 resources 字典。
