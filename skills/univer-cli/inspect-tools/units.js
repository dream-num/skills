// Managed Univer inspect tool: units
// Run with: univer inspect <file.univer> --tool units --params <params.json|->
const __univerManagedInspectTool = true;

async function inspectUnitsTool({ params, context }) {
  requireObjectParams(params);
  return envelope("units", { targetPath: context.targetPath }, {
    targetPath: context.targetPath,
    sidecarPath: context.sidecarPath,
    units: context.units
  }, [], false);
}
return await inspectUnitsTool({ params, context, univerAPI });

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

