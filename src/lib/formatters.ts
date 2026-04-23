import yaml from "js-yaml";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export type Format = "json" | "yaml" | "xml";

export interface ParseResult {
  ok: boolean;
  data?: unknown;
  error?: { message: string; line?: number; column?: number };
}

export function detectFormat(input: string): Format {
  const t = input.trim();
  if (!t) return "json";
  if (t.startsWith("<")) return "xml";
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  // YAML heuristic: contains ": " at line starts or "- "
  if (/^(\s*[-\w"']+\s*:\s|\s*-\s)/m.test(t)) return "yaml";
  return "json";
}

export function parseInput(input: string, format: Format): ParseResult {
  const text = input.trim();
  if (!text) return { ok: true, data: undefined };
  try {
    if (format === "json") {
      return { ok: true, data: JSON.parse(text) };
    }
    if (format === "yaml") {
      return { ok: true, data: yaml.load(text) };
    }
    if (format === "xml") {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });
      return { ok: true, data: parser.parse(text) };
    }
    return { ok: false, error: { message: "Unsupported format" } };
  } catch (e: unknown) {
    const err = e as { message?: string; mark?: { line: number; column: number } };
    const msg = err.message || String(e);
    // JSON error line extraction
    const m = /position (\d+)/.exec(msg);
    let line: number | undefined;
    let column: number | undefined;
    if (m) {
      const pos = parseInt(m[1], 10);
      const before = text.slice(0, pos);
      line = before.split("\n").length;
      column = pos - before.lastIndexOf("\n");
    }
    if (err.mark) {
      line = err.mark.line + 1;
      column = err.mark.column + 1;
    }
    return { ok: false, error: { message: msg, line, column } };
  }
}

export function stringify(data: unknown, format: Format, pretty = true): string {
  if (data === undefined) return "";
  if (format === "json") {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }
  if (format === "yaml") {
    return yaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true });
  }
  if (format === "xml") {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      format: pretty,
      indentBy: "  ",
    });
    // wrap primitive in <root>
    const wrapped =
      typeof data === "object" && data !== null && !Array.isArray(data)
        ? data
        : { root: data };
    return builder.build(wrapped);
  }
  return "";
}

export function languageOf(format: Format): string {
  if (format === "json") return "json";
  if (format === "yaml") return "yaml";
  return "xml";
}
