// Managed Univer inspect tool: sheet-neighborhood
// Run with: univer inspect <file.univer> --tool sheet-neighborhood --params <params.json|->
const __univerManagedInspectTool = true;

async function inspectSheetNeighborhoodTool({ params, context, univerAPI }) {
  params = requireObjectParams(params);
  const unitId = requireString(params, "unitId");
  const sheetName = requireString(params, "sheetName");
  const anchorA1 = typeof params.rangeA1 === "string" ? params.rangeA1 : requireString(params, "anchorA1");
  const beforeRows = readLimit(params.beforeRows, 3, 0, 100);
  const afterRows = readLimit(params.afterRows, 3, 0, 100);
  const beforeColumns = readLimit(params.beforeColumns, 2, 0, 50);
  const afterColumns = readLimit(params.afterColumns, 2, 0, 50);
  const unit = requireSheetUnit(context, unitId);
  const workbook = getWorkbook(univerAPI, unitId);
  const sheet = getSheet(workbook, sheetName);
  const used = getUsedBounds(sheet);
  const anchor = parseRangeA1(anchorA1);
  const bounds = expandBounds(anchor, beforeRows, afterRows, beforeColumns, afterColumns, used);
  const rangeA1 = boundsToA1(bounds);
  const include = readStringArray(params.include, ["cellFacts"]);
  const payload = readRangePayload(sheet, rangeA1, include);
  return envelope("sheet-neighborhood", {
    unitId,
    unitType: unit.type,
    sheetName,
    anchorA1,
    rangeA1
  }, {
    range: {
      sheetName,
      ...payload
    }
  }, payload.warnings, payload.truncated);
}
return await inspectSheetNeighborhoodTool({ params, context, univerAPI });

function baseEnvelope(id, target, evidence, warnings, truncated) {
  return {
    tool: { id, version: 1 },
    target,
    evidence,
    warnings: warnings ?? [],
    truncated: truncated === true
  };
}
function requireObjectParams(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Inspect params must be a JSON object.");
  }
  return value;
}
function requireString(params, name) {
  const value = params[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Inspect params require non-empty string " + name + ".");
  }
  return value;
}
function envelope(id, target, evidence, warnings, truncated) {
  return baseEnvelope(id, target, evidence, warnings, truncated);
}


function readStringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((entry) => typeof entry === "string");
}
function readLimit(value, fallback, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
function requireSheetUnit(context, unitId) {
  const unit = Array.isArray(context.units) ? context.units.find((entry) => entry.unitId === unitId) : null;
  if (unit == null) {
    throw new Error("Unknown unitId: " + unitId + ".");
  }
  if (unit.type !== "sheet") {
    throw new Error("Managed sheet inspect tools require a sheet unit. unitId " + unitId + " is type " + unit.type + ".");
  }
  return unit;
}
function getWorkbook(univerAPI, unitId) {
  const workbook = univerAPI.getWorkbook(unitId);
  if (workbook == null) {
    throw new Error("Workbook unit is not loaded: " + unitId + ".");
  }
  return workbook;
}
function getWorkbookSheets(workbook) {
  if (typeof workbook.getSheets !== "function") {
    throw new Error("Workbook facade does not expose getSheets().");
  }
  return workbook.getSheets();
}
function getSheet(workbook, sheetName) {
  const sheet = workbook.getSheetByName(sheetName);
  if (sheet == null) {
    throw new Error("Sheet not found: " + sheetName + ".");
  }
  return sheet;
}
function getSheetName(sheet) {
  return typeof sheet.getSheetName === "function" ? sheet.getSheetName() : "";
}
function getUsedBounds(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 0 || lastColumn < 0) {
    return { startRow: 0, startColumn: 0, endRow: -1, endColumn: -1, rowCount: 0, columnCount: 0 };
  }
  return {
    startRow: 0,
    startColumn: 0,
    endRow: lastRow,
    endColumn: lastColumn,
    rowCount: lastRow + 1,
    columnCount: lastColumn + 1
  };
}
function normalizeConditionalFormattingRule(rule, index, requestedBounds, warnings) {
  if (rule == null || typeof rule !== "object") {
    warnings.push("Unsupported conditional formatting rule shape at index " + index + ": non-object.");
    return null;
  }
  const ranges = Array.isArray(rule.ranges) ? rule.ranges.map((range) => normalizeRuntimeRange(range)).filter((range) => range !== null) : [];
  if (ranges.length === 0) {
    warnings.push("Conditional formatting rule at index " + index + " has no readable ranges.");
  }
  const intersectsRequestedRange = requestedBounds === null ? undefined : ranges.some((range) => rangesIntersect(range.bounds, requestedBounds));
  if (requestedBounds !== null && intersectsRequestedRange !== true) {
    return null;
  }
  const normalizedRule = normalizeConditionalRuleConfig(rule.rule, index, warnings);
  const normalized = {
    index,
    ...(typeof rule.cfId === "string" && rule.cfId.length > 0 ? { cfId: rule.cfId } : {}),
    ...(rule.priority === undefined ? {} : { priority: rule.priority }),
    ...(rule.order === undefined ? {} : { order: rule.order }),
    ...(rule.stopIfTrue === undefined ? {} : { stopIfTrue: rule.stopIfTrue === true }),
    ...(intersectsRequestedRange === undefined ? {} : { intersectsRequestedRange }),
    ranges: ranges.map((range) => ({ a1: range.a1, raw: range.raw })),
    rule: normalizedRule
  };
  return sortObject(normalized);
}
function normalizeRuntimeRange(range) {
  if (range == null || typeof range !== "object") {
    return null;
  }
  const startRow = readFiniteInteger(range.startRow);
  const startColumn = readFiniteInteger(range.startColumn);
  const endRow = readFiniteInteger(range.endRow);
  const endColumn = readFiniteInteger(range.endColumn);
  if (startRow === null || startColumn === null || endRow === null || endColumn === null) {
    return null;
  }
  const bounds = {
    startRow: Math.min(startRow, endRow),
    startColumn: Math.min(startColumn, endColumn),
    endRow: Math.max(startRow, endRow),
    endColumn: Math.max(startColumn, endColumn),
    rowCount: Math.abs(endRow - startRow) + 1,
    columnCount: Math.abs(endColumn - startColumn) + 1
  };
  return {
    a1: boundsToA1(bounds),
    bounds,
    raw: {
      endColumn: bounds.endColumn,
      endRow: bounds.endRow,
      startColumn: bounds.startColumn,
      startRow: bounds.startRow
    }
  };
}
function readFiniteInteger(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}
function rangesIntersect(a, b) {
  return a.startRow <= b.endRow && a.endRow >= b.startRow && a.startColumn <= b.endColumn && a.endColumn >= b.startColumn;
}
function normalizeConditionalRuleConfig(rule, index, warnings) {
  if (rule == null || typeof rule !== "object") {
    warnings.push("Unsupported conditional formatting rule shape at index " + index + ": missing rule config.");
    return { unsupported: true };
  }
  const type = typeof rule.type === "string" ? rule.type : "unknown";
  const common = {
    type,
    ...(typeof rule.subType === "string" ? { subType: rule.subType } : {}),
    ...(rule.operator === undefined ? {} : { operator: rule.operator }),
    ...(rule.value === undefined ? {} : { value: normalizeResourceValueForAgent(rule.value) }),
    ...(rule.isShowValue === undefined ? {} : { isShowValue: rule.isShowValue === true })
  };
  if (type === "highlightCell") {
    const style = normalizeSemanticStyle(rule.style);
    return sortObject({
      ...common,
      ...(Object.keys(style).length === 0 ? {} : { style })
    });
  }
  if (type === "dataBar" || type === "colorScale" || type === "iconSet") {
    return sortObject({
      ...common,
      ...(rule.config === undefined ? {} : { config: normalizeResourceValueForAgent(rule.config) })
    });
  }
  warnings.push("Unsupported conditional formatting rule shape at index " + index + ": " + type + ".");
  return sortObject({
    type,
    unsupported: true,
    raw: normalizeResourceValueForAgent(rule)
  });
}
function defaultSemanticStyleTraits() {
  return ["backgroundColor", "fontColor", "bold", "italic", "horizontalAlignment", "verticalAlignment", "wrapStrategy", "border"];
}
function readSheetRangeRequests(params) {
  if (Array.isArray(params.ranges)) {
    if (params.ranges.length === 0) {
      throw new Error("Inspect params ranges must contain at least one range.");
    }
    return params.ranges.map((entry, index) => {
      if (entry == null || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error("Inspect params ranges[" + index + "] must be an object.");
      }
      const sheetName = requireString(entry, "sheetName");
      const rangeA1 = normalizeRangeA1(requireString(entry, "rangeA1"));
      const label = entry.label;
      if (label !== undefined && (typeof label !== "string" || label.trim().length === 0)) {
        throw new Error("Inspect params ranges[" + index + "].label must be a non-empty string when provided.");
      }
      return {
        sheetName,
        rangeA1,
        ...(label === undefined ? {} : { label })
      };
    });
  }
  return [{
    sheetName: requireString(params, "sheetName"),
    rangeA1: normalizeRangeA1(requireString(params, "rangeA1"))
  }];
}
function countRangeCells(rangeA1) {
  const bounds = parseRangeA1(rangeA1);
  return bounds.rowCount * bounds.columnCount;
}
function normalizeRangeA1(rangeA1) {
  return boundsToA1(parseRangeA1(rangeA1));
}
function readRangePayload(sheet, rangeA1, include, styleTraits) {
  styleTraits = styleTraits ?? defaultSemanticStyleTraits();
  const range = sheet.getRange(rangeA1);
  const cache = {};
  const payload = {
    rangeA1,
    warnings: [],
    truncated: false
  };
  for (const field of include) {
    if (isRemovedRawValueField(field)) {
      throw new Error("Unsupported include field: " + field + ". Managed inspect evidence no longer exposes raw value fields; use value, displayValues, values, valueDetails, or cellData instead.");
    }
    if (field === "normalizedValues") {
      payload.normalizedValues = readNormalizedValuesForAgent(range, cache);
    } else if (field === "displayValues") {
      payload.displayValues = readCachedRangeMatrix(range, cache, "displayValues", "getDisplayValues");
    } else if (field === "values") {
      payload.values = readLogicalValuesForAgent(range, cache);
    } else if (field === "formulas") {
      const formulas = readCachedRangeMatrix(range, cache, "formulas", "getFormulas");
      if (!isEmptyFormulaMatrix(formulas)) {
        payload.formulas = formulas;
      }
    } else if (field === "numberFormats") {
      const numberFormats = readCachedRangeMatrix(range, cache, "numberFormats", "getNumberFormats");
      if (!isDefaultNumberFormatMatrix(numberFormats)) {
        payload.numberFormats = numberFormats;
      }
    } else if (field === "cellData") {
      payload.cellData = readCachedRangeMatrix(range, cache, "cellData", "getCellDataGrid");
    } else if (field === "valueDetails") {
      payload.valueDetails = readValueDetailsForAgent(range, cache);
    } else if (field === "semanticStyles") {
      const semanticStyles = readSemanticStylesForAgent(sheet, range, cache, styleTraits);
      if (!isEmptySemanticStyleMatrix(semanticStyles)) {
        payload.semanticStyles = semanticStyles;
      }
    } else if (field === "cellFacts") {
      // cellFacts is derived after all requested fields have been read.
    } else {
      payload.warnings.push("Unsupported include field ignored: " + field + ".");
    }
  }
  if (include.includes("cellFacts")) {
    payload.cells = readCellFactsForAgent(sheet, range, cache, rangeA1, styleTraits, include.includes("semanticStyles"));
  }
  const sizeMatrix = payload.cells ?? payload.normalizedValues ?? payload.displayValues ?? payload.values ?? payload.formulas ?? payload.valueDetails ?? payload.semanticStyles ?? payload.cellData ?? [];
  payload.rowCount = Array.isArray(sizeMatrix) ? sizeMatrix.length : 0;
  payload.columnCount = payload.rowCount > 0 && Array.isArray(sizeMatrix[0]) ? sizeMatrix[0].length : 0;
  return payload;
}
function readCellFactsForAgent(sheet, range, cache, rangeA1, styleTraits, includeSemanticStyles) {
  const values = readCachedRangeMatrix(range, cache, "values", "getValues");
  const storageValues = readCachedRangeMatrix(range, cache, "storageValues", "getRawValues");
  const displayValues = readCachedRangeMatrix(range, cache, "displayValues", "getDisplayValues");
  const cellData = readCachedRangeMatrix(range, cache, "cellData", "getCellDataGrid");
  const formulas = readCachedRangeMatrix(range, cache, "formulas", "getFormulas");
  const numberFormats = readCachedRangeMatrix(range, cache, "numberFormats", "getNumberFormats");
  const semanticStyles = includeSemanticStyles ? readSemanticStylesForAgent(sheet, range, cache, styleTraits) : [];
  const rowCount = readRangeRowCount(range, [values, storageValues, displayValues, cellData, formulas, numberFormats, semanticStyles]);
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const columnCount = readRangeColumnCount(range, rowIndex, [values, storageValues, displayValues, cellData, formulas, numberFormats, semanticStyles]);
    return Array.from({ length: columnCount }, (_, columnIndex) => {
      const cell = { a1: offsetA1(rangeA1, rowIndex, columnIndex) };
      const value = readLogicalCellValueForAgent(values, storageValues, cellData, rowIndex, columnIndex);
      const displayValue = readMatrixCell(displayValues, rowIndex, columnIndex);
      const formula = readMatrixCell(formulas, rowIndex, columnIndex);
      const numberFormat = readMatrixCell(numberFormats, rowIndex, columnIndex);
      const semanticStyle = compactSemanticStyle(readMatrixCell(semanticStyles, rowIndex, columnIndex));
      if (isNonEmptyValue(value)) {
        cell.value = value;
        cell.valueType = readCellValueType(value);
      }
      if (displayValue !== null && displayValue !== undefined && displayValue !== "") {
        cell.displayValue = displayValue;
      }
      if (formula !== null && formula !== undefined && formula !== "") {
        cell.formula = formula;
      }
      if (!isDefaultNumberFormat(numberFormat)) {
        cell.numberFormat = numberFormat;
      }
      if (semanticStyle && Object.keys(semanticStyle).length > 0) {
        cell.semanticStyle = semanticStyle;
      }
      return sortObject(cell);
    });
  });
}
function isRemovedRawValueField(field) {
  return field === "rawValues" || field === "rawValue" || field === "rawType";
}
function readRangeRowCount(range, matrices) {
  const rangeHeight = typeof range.getHeight === "function" ? range.getHeight() : 0;
  return Math.max(rangeHeight, ...matrices.map((matrix) => readMatrixRowCount(matrix)));
}
function readRangeColumnCount(range, rowIndex, matrices) {
  const rangeWidth = typeof range.getWidth === "function" ? range.getWidth() : 0;
  return Math.max(rangeWidth, ...matrices.map((matrix) => readMatrixColumnCount(matrix, rowIndex)));
}
function isEmptyFormulaMatrix(matrix) {
  return !Array.isArray(matrix) || matrix.every((row) => !Array.isArray(row) || row.every((value) => value === null || value === undefined || value === ""));
}
function isDefaultNumberFormatMatrix(matrix) {
  return !Array.isArray(matrix) || matrix.every((row) => !Array.isArray(row) || row.every((value) => isDefaultNumberFormat(value)));
}
function isDefaultNumberFormat(value) {
  return value === null || value === undefined || value === "" || value === "General";
}
function isEmptySemanticStyleMatrix(matrix) {
  return !Array.isArray(matrix) || matrix.every((row) => !Array.isArray(row) || row.every((value) => Object.keys(compactSemanticStyle(value)).length === 0));
}
function compactSemanticStyle(value) {
  if (value == null || typeof value !== "object") {
    return {};
  }
  const compact = {};
  for (const key of Object.keys(value)) {
    const entry = value[key];
    if ((key === "backgroundColor" && (entry === "#FFFFFF" || entry === "#fff" || entry === "#FFF" || entry === "")) ||
      (key === "fontColor" && (entry === "#000000" || entry === "#000" || entry === "")) ||
      (key === "horizontalAlignment" && (entry === "general" || entry === "")) ||
      (key === "verticalAlignment" && (entry === "middle" || entry === "")) ||
      (key === "wrapStrategy" && (entry === 0 || entry === ""))) {
      continue;
    }
    compact[key] = entry;
  }
  return sortObject(compact);
}
function offsetA1(rangeA1, rowOffset, columnOffset) {
  const bounds = parseRangeA1(rangeA1);
  return cellToA1(bounds.startRow + rowOffset, bounds.startColumn + columnOffset);
}
function readCachedRangeMatrix(range, cache, key, methodName) {
  if (!(key in cache)) {
    const reader = range[methodName];
    cache[key] = typeof reader === "function" ? reader.call(range) : [];
  }
  return cache[key];
}
function readOptionalRangeMatrix(range, cache, key, methodName, args) {
  if (!(key in cache)) {
    const reader = range[methodName];
    cache[key] = typeof reader === "function" ? reader.apply(range, args ?? []) : [];
  }
  return cache[key];
}
function readSemanticStylesForAgent(sheet, range, cache, styleTraits) {
  const unsupported = styleTraits.filter((trait) => !defaultSemanticStyleTraits().includes(trait));
  if (unsupported.length > 0) {
    throw new Error("Unsupported semantic style trait: " + unsupported.join(", ") + ".");
  }
  const styles = readOptionalRangeMatrix(range, cache, "cellStyles", "getCellStyles", ["cell"]);
  const backgrounds = readOptionalRangeMatrix(range, cache, "backgrounds", "getBackgrounds");
  const horizontalAlignments = readOptionalRangeMatrix(range, cache, "horizontalAlignments", "getHorizontalAlignments");
  const verticalAlignments = readOptionalRangeMatrix(range, cache, "verticalAlignments", "getVerticalAlignments");
  const wraps = readOptionalRangeMatrix(range, cache, "wraps", "getWraps");
  const matrices = [styles, backgrounds, horizontalAlignments, verticalAlignments, wraps];
  const rowCount = typeof range.getHeight === "function" ? range.getHeight() : Math.max(0, ...matrices.map((matrix) => readMatrixRowCount(matrix)));
  const columnCount = typeof range.getWidth === "function"
    ? range.getWidth()
    : Math.max(0, ...matrices.flatMap((matrix) => Array.from({ length: readMatrixRowCount(matrix) }, (_, row) => readMatrixColumnCount(matrix, row))));
  const startRow = typeof range.getRow === "function" ? range.getRow() : 0;
  const startColumn = typeof range.getColumn === "function" ? range.getColumn() : 0;
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const style = normalizeSemanticStyle(readMatrixCell(styles, rowIndex, columnIndex));
      const backgroundColor = normalizeColorForAgent(readMatrixCell(backgrounds, rowIndex, columnIndex));
      if (backgroundColor !== null && backgroundColor !== "") {
        style.backgroundColor = backgroundColor;
      }
      const horizontalAlignment = readMatrixCell(horizontalAlignments, rowIndex, columnIndex);
      if (horizontalAlignment !== null && horizontalAlignment !== undefined && horizontalAlignment !== "") {
        style.horizontalAlignment = horizontalAlignment;
      }
      const verticalAlignment = readMatrixCell(verticalAlignments, rowIndex, columnIndex);
      if (verticalAlignment !== null && verticalAlignment !== undefined && verticalAlignment !== "") {
        style.verticalAlignment = verticalAlignment;
      }
      const wrap = readMatrixCell(wraps, rowIndex, columnIndex);
      if (wrap !== null && wrap !== undefined) {
        style.wrap = wrap;
      }
      const cellRange = typeof sheet.getRange === "function" ? sheet.getRange(startRow + rowIndex, startColumn + columnIndex) : null;
      if (cellRange != null && typeof cellRange.getWrapStrategy === "function") {
        const wrapStrategy = cellRange.getWrapStrategy();
        if (wrapStrategy !== undefined && wrapStrategy !== null && wrapStrategy !== "") {
          style.wrapStrategy = wrapStrategy;
        }
      }
      const filtered = {};
      for (const trait of styleTraits) {
        if (style[trait] !== undefined) {
          filtered[trait] = style[trait];
        }
      }
      return sortObject(filtered);
    })
  );
}
function normalizeSemanticStyle(style) {
  const normalized = {};
  if (style == null || typeof style !== "object") {
    return normalized;
  }
  const sourceStyle = style._style && typeof style._style === "object" ? style._style : style;
  const backgroundColor = normalizeColorForAgent(sourceStyle.bg?.rgb ?? sourceStyle.backgroundColor);
  if (backgroundColor !== null && backgroundColor !== "") {
    normalized.backgroundColor = backgroundColor;
  }
  const fontColor = normalizeColorForAgent(sourceStyle.cl?.rgb ?? sourceStyle.fontColor);
  if (fontColor !== null && fontColor !== "") {
    normalized.fontColor = fontColor;
  }
  if (sourceStyle.bl !== undefined) {
    normalized.bold = sourceStyle.bl === true || sourceStyle.bl === 1;
  }
  if (sourceStyle.it !== undefined) {
    normalized.italic = sourceStyle.it === true || sourceStyle.it === 1;
  }
  const horizontalAlignment = sourceStyle.ht ?? sourceStyle.horizontalAlignment;
  if (horizontalAlignment !== undefined && horizontalAlignment !== null && horizontalAlignment !== "") {
    normalized.horizontalAlignment = horizontalAlignment;
  }
  const verticalAlignment = sourceStyle.vt ?? sourceStyle.verticalAlignment;
  if (verticalAlignment !== undefined && verticalAlignment !== null && verticalAlignment !== "") {
    normalized.verticalAlignment = verticalAlignment;
  }
  const wrapStrategy = sourceStyle.tb ?? sourceStyle.wrapStrategy;
  if (wrapStrategy !== undefined && wrapStrategy !== null && wrapStrategy !== "") {
    normalized.wrapStrategy = wrapStrategy;
  }
  if (sourceStyle.bd !== undefined && sourceStyle.bd !== null) {
    normalized.border = normalizeResourceValueForAgent(sourceStyle.bd);
  }
  return normalized;
}
function normalizeResourceValueForAgent(value) {
  if (typeof value === "string") {
    return normalizeColorForAgent(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeResourceValueForAgent);
  }
  if (value && typeof value === "object") {
    const normalized = {};
    for (const key of Object.keys(value).sort()) {
      if (key === "s" || key === "styleId" || key === "id" || value[key] === undefined) {
        continue;
      }
      normalized[key] = normalizeResourceValueForAgent(value[key]);
    }
    return sortObject(normalized);
  }
  return value;
}
function normalizeColorForAgent(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }
  const hex = /^#([0-9a-f]{6})$/iu.exec(value);
  if (hex?.[1] !== undefined) {
    return "#" + hex[1].toUpperCase();
  }
  const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/iu.exec(value);
  if (rgb === null) {
    return value;
  }
  return "#" + [rgb[1], rgb[2], rgb[3]].map((part) => Number(part).toString(16).toUpperCase().padStart(2, "0")).join("");
}
function sortObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] !== undefined) {
      sorted[key] = value[key];
    }
  }
  return sorted;
}
function readLogicalValuesForAgent(range, cache) {
  const values = readCachedRangeMatrix(range, cache, "values", "getValues");
  const storageValues = readCachedRangeMatrix(range, cache, "storageValues", "getRawValues");
  const cellData = readCachedRangeMatrix(range, cache, "cellData", "getCellDataGrid");
  const rowCount = Math.max(
    readMatrixRowCount(values),
    readMatrixRowCount(storageValues),
    readMatrixRowCount(cellData)
  );
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const columnCount = Math.max(
      readMatrixColumnCount(values, rowIndex),
      readMatrixColumnCount(storageValues, rowIndex),
      readMatrixColumnCount(cellData, rowIndex)
    );
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      readLogicalCellValueForAgent(values, storageValues, cellData, rowIndex, columnIndex)
    );
  });
}
function readLogicalCellValueForAgent(values, storageValues, cellData, rowIndex, columnIndex) {
  const cell = readMatrixCell(cellData, rowIndex, columnIndex);
  if (cell != null && typeof cell === "object" && "v" in cell) {
    return cell.v ?? null;
  }
  const storageValue = readMatrixCell(storageValues, rowIndex, columnIndex);
  if (storageValue !== null && storageValue !== undefined) {
    return storageValue;
  }
  return readMatrixCell(values, rowIndex, columnIndex);
}
function readNormalizedValuesForAgent(range, cache) {
  const values = readCachedRangeMatrix(range, cache, "values", "getValues");
  const storageValues = readCachedRangeMatrix(range, cache, "storageValues", "getRawValues");
  const displayValues = readCachedRangeMatrix(range, cache, "displayValues", "getDisplayValues");
  const cellData = readCachedRangeMatrix(range, cache, "cellData", "getCellDataGrid");
  const rowCount = Math.max(
    readMatrixRowCount(values),
    readMatrixRowCount(storageValues),
    readMatrixRowCount(displayValues),
    readMatrixRowCount(cellData)
  );
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const columnCount = Math.max(
      readMatrixColumnCount(values, rowIndex),
      readMatrixColumnCount(storageValues, rowIndex),
      readMatrixColumnCount(displayValues, rowIndex),
      readMatrixColumnCount(cellData, rowIndex)
    );
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      readNormalizedCellValueForAgent(values, storageValues, displayValues, cellData, rowIndex, columnIndex)
    );
  });
}
function readNormalizedCellValueForAgent(values, storageValues, displayValues, cellData, rowIndex, columnIndex) {
  const value = readMatrixCell(values, rowIndex, columnIndex);
  if (value !== null && value !== undefined) {
    return normalizeValueForAgent(value);
  }
  const storageValue = normalizeValueForAgent(readMatrixCell(storageValues, rowIndex, columnIndex));
  if (isNonEmptyValue(storageValue)) {
    return storageValue;
  }
  const displayValue = normalizeValueForAgent(readMatrixCell(displayValues, rowIndex, columnIndex));
  if (isNonEmptyValue(displayValue)) {
    return displayValue;
  }
  const cell = readMatrixCell(cellData, rowIndex, columnIndex);
  const richTextValue = normalizeValueForAgent(extractCellDataRichTextValue(cell));
  if (isNonEmptyValue(richTextValue)) {
    return richTextValue;
  }
  return normalizeValueForAgent(extractCellDataValue(cell));
}
function readValueDetailsForAgent(range, cache) {
  const values = readCachedRangeMatrix(range, cache, "values", "getValues");
  const storageValues = readCachedRangeMatrix(range, cache, "storageValues", "getRawValues");
  const displayValues = readCachedRangeMatrix(range, cache, "displayValues", "getDisplayValues");
  const cellData = readCachedRangeMatrix(range, cache, "cellData", "getCellDataGrid");
  const formulas = readCachedRangeMatrix(range, cache, "formulas", "getFormulas");
  const numberFormats = readCachedRangeMatrix(range, cache, "numberFormats", "getNumberFormats");
  const rowCount = Math.max(
    readMatrixRowCount(values),
    readMatrixRowCount(storageValues),
    readMatrixRowCount(displayValues),
    readMatrixRowCount(cellData),
    readMatrixRowCount(formulas),
    readMatrixRowCount(numberFormats)
  );
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const columnCount = Math.max(
      readMatrixColumnCount(values, rowIndex),
      readMatrixColumnCount(storageValues, rowIndex),
      readMatrixColumnCount(displayValues, rowIndex),
      readMatrixColumnCount(cellData, rowIndex),
      readMatrixColumnCount(formulas, rowIndex),
      readMatrixColumnCount(numberFormats, rowIndex)
    );
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      readCellValueDetailsForAgent(
        values,
        storageValues,
        displayValues,
        cellData,
        formulas,
        numberFormats,
        rowIndex,
        columnIndex
      )
    );
  });
}
function readCellValueDetailsForAgent(values, storageValues, displayValues, cellData, formulas, numberFormats, rowIndex, columnIndex) {
  const displayValue = readMatrixCell(displayValues, rowIndex, columnIndex);
  const value = readLogicalCellValueForAgent(values, storageValues, cellData, rowIndex, columnIndex);
  const formula = readMatrixCell(formulas, rowIndex, columnIndex);
  const detail = {
    value,
    valueType: readCellValueType(value),
    displayValue,
    numberFormat: readMatrixCell(numberFormats, rowIndex, columnIndex)
  };
  if (typeof formula === "string" && formula.length > 0) {
    detail.formula = formula;
  }
  return detail;
}
function extractCellDataRichTextValue(cellData) {
  if (cellData == null || typeof cellData !== "object") {
    return null;
  }
  const richText = cellData.p;
  if (richText == null || typeof richText !== "object") {
    return null;
  }
  const body = richText.body;
  if (body == null || typeof body !== "object") {
    return null;
  }
  return typeof body.dataStream === "string" ? body.dataStream : null;
}
function extractCellDataValue(cellData) {
  return cellData != null && typeof cellData === "object" && "v" in cellData ? cellData.v : null;
}
function readCellValueType(value) {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (value instanceof Date) {
    return "date";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}
function isNonEmptyValue(value) {
  return value !== null && value !== undefined && String(value).length > 0;
}
function normalizeValueForAgent(value) {
  if (typeof value !== "string") {
    return value;
  }
  const hasLeadingControl = isControlCharacter(value.charCodeAt(0));
  const hasTrailingControl = isControlCharacter(value.charCodeAt(value.length - 1));
  let normalized = "";
  let previousWasControl = false;
  for (const char of value) {
    if (isControlCharacter(char.charCodeAt(0))) {
      if (!previousWasControl) {
        normalized += " ";
      }
      previousWasControl = true;
      continue;
    }
    normalized += char;
    previousWasControl = false;
  }
  if (hasLeadingControl) {
    normalized = normalized.replace(/^ +/u, "");
  }
  if (hasTrailingControl) {
    normalized = normalized.replace(/ +$/u, "");
  }
  return normalized;
}
function isControlCharacter(charCode) {
  return (charCode >= 0 && charCode <= 31) || charCode === 127;
}
function readMatrixRowCount(matrix) {
  return Array.isArray(matrix) ? matrix.length : 0;
}
function readMatrixColumnCount(matrix, rowIndex) {
  return Array.isArray(matrix) && Array.isArray(matrix[rowIndex]) ? matrix[rowIndex].length : 0;
}
function normalizeValueForAgent(value) {
  if (typeof value !== "string") {
    return value;
  }
  const hasLeadingControl = /^[\u0000-\u001F\u007F]/u.test(value);
  const hasTrailingControl = /[\u0000-\u001F\u007F]$/u.test(value);
  let normalized = value.replace(/[\u0000-\u001F\u007F]+/gu, " ");
  if (hasLeadingControl) {
    normalized = normalized.replace(/^ +/u, "");
  }
  if (hasTrailingControl) {
    normalized = normalized.replace(/ +$/u, "");
  }
  return normalized;
}
function parseRangeA1(a1) {
  const parts = String(a1).split(":");
  const start = parseCellA1(parts[0]);
  const end = parts.length > 1 ? parseCellA1(parts[1]) : start;
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startColumn = Math.min(start.column, end.column);
  const endColumn = Math.max(start.column, end.column);
  return {
    startRow,
    startColumn,
    endRow,
    endColumn,
    rowCount: endRow - startRow + 1,
    columnCount: endColumn - startColumn + 1
  };
}
function parseCellA1(a1) {
  const match = /^([A-Za-z]+)([1-9][0-9]*)$/.exec(String(a1).trim());
  if (match == null) {
    throw new Error("Expected A1 cell notation, got " + a1 + ".");
  }
  return {
    row: Number(match[2]) - 1,
    column: columnNameToIndex(match[1])
  };
}
function columnNameToIndex(name) {
  let index = 0;
  for (const char of String(name).toUpperCase()) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}
function columnIndexToName(index) {
  let current = index + 1;
  let name = "";
  while (current > 0) {
    const modulo = (current - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    current = Math.floor((current - modulo) / 26);
  }
  return name;
}
function cellToA1(row, column) {
  return columnIndexToName(column) + String(row + 1);
}
function boundsToA1(bounds) {
  if (bounds.rowCount === 0 || bounds.columnCount === 0 || bounds.endRow < bounds.startRow || bounds.endColumn < bounds.startColumn) {
    return null;
  }
  const start = cellToA1(bounds.startRow, bounds.startColumn);
  const end = cellToA1(bounds.endRow, bounds.endColumn);
  return start === end ? start : start + ":" + end;
}
function expandBounds(bounds, beforeRows, afterRows, beforeColumns, afterColumns, used) {
  const maxRow = used.rowCount > 0 ? used.endRow : bounds.endRow + afterRows;
  const maxColumn = used.columnCount > 0 ? used.endColumn : bounds.endColumn + afterColumns;
  const startRow = Math.max(0, bounds.startRow - beforeRows);
  const startColumn = Math.max(0, bounds.startColumn - beforeColumns);
  const endRow = Math.min(maxRow, bounds.endRow + afterRows);
  const endColumn = Math.min(maxColumn, bounds.endColumn + afterColumns);
  return {
    startRow,
    startColumn,
    endRow,
    endColumn,
    rowCount: endRow - startRow + 1,
    columnCount: endColumn - startColumn + 1
  };
}
function listFormulaCells(formulas, bounds, limit) {
  const cells = [];
  if (!Array.isArray(formulas)) {
    return cells;
  }
  for (let rowIndex = 0; rowIndex < formulas.length; rowIndex += 1) {
    const row = Array.isArray(formulas[rowIndex]) ? formulas[rowIndex] : [];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const formula = row[columnIndex];
      if (typeof formula !== "string" || formula.length === 0) {
        continue;
      }
      const rowNumber = bounds.startRow + rowIndex;
      const columnNumber = bounds.startColumn + columnIndex;
      cells.push({
        a1: cellToA1(rowNumber, columnNumber),
        row: rowNumber,
        column: columnNumber,
        formula
      });
      if (cells.length >= limit) {
        return cells;
      }
    }
  }
  return cells;
}
function readMatrixCell(matrix, row, column) {
  return Array.isArray(matrix) && Array.isArray(matrix[row]) ? matrix[row][column] ?? null : null;
}

