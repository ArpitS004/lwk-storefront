import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "api");

const IMPORT_RE = /(from\s+|import\()\s*['"](\.[^'"]+)['"]/g;

function resolveImport(fileDir, importPath) {
  const base = path.extname(importPath) ? importPath : null;
  if (base) return null; // already has an extension, leave alone

  const abs = path.join(fileDir, importPath);

  if (fs.existsSync(abs + ".ts") || fs.existsSync(abs + ".tsx")) {
    return importPath + ".js";
  }
  if (fs.existsSync(path.join(abs, "index.ts"))) {
    return importPath + "/index.js";
  }
  return null; // couldn't resolve, leave alone and warn
}

function fixFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const fileDir = path.dirname(filePath);
  let changed = false;

  const out = src.replace(IMPORT_RE, (match, prefix, importPath) => {
    const fixed = resolveImport(fileDir, importPath);
    if (fixed === null) {
      if (!path.extname(importPath)) {
        console.warn("  COULD NOT RESOLVE:", importPath, "in", path.relative(process.cwd(), filePath));
      }
      return match;
    }
    changed = true;
    return match.replace(importPath, fixed);
  });

  if (changed) {
    fs.writeFileSync(filePath, out, "utf8");
    console.log("fixed:", path.relative(process.cwd(), filePath));
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      fixFile(full);
    }
  }
}

walk(ROOT);
console.log("Done.");
