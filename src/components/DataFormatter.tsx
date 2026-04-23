import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { CodeEditor as Editor, type OnMount } from "@/components/CodeEditor";
import {
  Sparkles,
  Minimize2,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Braces,
  Network,
  ListTree,
  FileCode2,
} from "lucide-react";
import {
  detectFormat,
  languageOf,
  parseInput,
  stringify,
  type Format,
} from "@/lib/formatters";
import { TreeView } from "./TreeView";

const FORMATS: { value: Format; label: string; icon: React.ReactNode }[] = [
  { value: "json", label: "JSON", icon: <Braces className="h-3.5 w-3.5" /> },
  { value: "yaml", label: "YAML", icon: <ListTree className="h-3.5 w-3.5" /> },
  { value: "xml", label: "XML", icon: <Network className="h-3.5 w-3.5" /> },
];

const SAMPLE = `{
  "app": "Data Formatter",
  "version": "1.0.0",
  "features": ["beautify", "minify", "convert", "validate"],
  "premium": true,
  "stats": { "users": 12480, "rating": 4.9 }
}`;

export function DataFormatter() {
  const [input, setInput] = useState<string>(SAMPLE);
  const [inputFormat, setInputFormat] = useState<Format>("json");
  const [outputFormat, setOutputFormat] = useState<Format>("json");
  const [view, setView] = useState<"raw" | "tree">("raw");
  const [copied, setCopied] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // auto-detect
  useEffect(() => {
    if (!autoDetect) return;
    const detected = detectFormat(input);
    setInputFormat((prev) => (prev !== detected ? detected : prev));
  }, [input, autoDetect]);

  const parsed = useMemo(() => parseInput(input, inputFormat), [input, inputFormat]);

  const output = useMemo(() => {
    if (!parsed.ok || parsed.data === undefined) return "";
    try {
      return stringify(parsed.data, outputFormat, true);
    } catch (e) {
      return `// Conversion error: ${(e as Error).message}`;
    }
  }, [parsed, outputFormat]);

  const handleFormat = useCallback(() => {
    if (parsed.ok && parsed.data !== undefined) {
      setInput(stringify(parsed.data, inputFormat, true));
    }
  }, [parsed, inputFormat]);

  const handleMinify = useCallback(() => {
    if (parsed.ok && parsed.data !== undefined) {
      setInput(stringify(parsed.data, inputFormat, false));
    }
  }, [parsed, inputFormat]);

  const handleClear = () => setInput("");

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // Drag & drop
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInput(text);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleFormat();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        handleMinify();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleFormat, handleMinify]);

  const status = parsed.ok
    ? { label: "Valid", tone: "ok" as const }
    : { label: "Invalid", tone: "err" as const };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 bg-surface/70 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <FileCode2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Data Formatter</h1>
            <p className="text-[13px] text-muted-foreground">JSON · YAML · XML — beautify, validate, convert</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-[13px] text-muted-foreground md:flex">
          <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
          <span>format</span>
          <span className="mx-2 text-border">·</span>
          <Kbd>Ctrl</Kbd>+<Kbd>Shift</Kbd>+<Kbd>M</Kbd>
          <span>minify</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-surface/40 px-6 py-2.5">
        <FormatSelector
          value={inputFormat}
          onChange={(f) => {
            setAutoDetect(false);
            setInputFormat(f);
          }}
          label="Input"
        />
        <button
          onClick={() => {
            const tmp = inputFormat;
            setInputFormat(outputFormat);
            setOutputFormat(tmp);
            setInput(output || input);
            setAutoDetect(false);
          }}
          className="group flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-surface text-muted-foreground transition-all hover:border-primary/50 hover:text-primary"
          title="Swap"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
        </button>
        <FormatSelector value={outputFormat} onChange={setOutputFormat} label="Output" />

        <div className="mx-2 h-6 w-px bg-border" />

        <ToolbarButton onClick={handleFormat} icon={<Sparkles className="h-3.5 w-3.5" />} primary>
          Format
        </ToolbarButton>
        <ToolbarButton onClick={handleMinify} icon={<Minimize2 className="h-3.5 w-3.5" />}>
          Minify
        </ToolbarButton>
        <ToolbarButton onClick={handleClear} icon={<Trash2 className="h-3.5 w-3.5" />}>
          Clear
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-3">
          <StatusBadge ok={status.tone === "ok"} label={status.label} />
        </div>
      </div>

      {/* Split */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
        {/* Input */}
        <div
          className="flex min-h-0 flex-col border-b border-border/60 md:border-b-0 md:border-r"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <PaneHeader
            label="Input"
            sub={
              autoDetect
                ? `auto-detected · ${inputFormat.toUpperCase()}`
                : inputFormat.toUpperCase()
            }
            right={
              <button
                onClick={() => setAutoDetect((v) => !v)}
                className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                  autoDetect
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                AUTO
              </button>
            }
          />
          <div className="relative min-h-0 flex-1">
            <Editor
              height="100%"
              theme="vs-dark"
              language={languageOf(inputFormat)}
              value={input}
              onChange={(v) => setInput(v ?? "")}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              options={editorOptions}
            />
          </div>
          {!parsed.ok && parsed.error && (
            <div className="flex items-start gap-2 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="mono">
                {parsed.error.line ? `Line ${parsed.error.line}: ` : ""}
                {parsed.error.message}
              </div>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex min-h-0 flex-col">
          <PaneHeader
            label="Output"
            sub={outputFormat.toUpperCase()}
            right={
              <div className="flex items-center gap-1">
                <ViewToggle view={view} setView={setView} />
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            }
          />
          <div className="relative min-h-0 flex-1">
            {view === "raw" ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={languageOf(outputFormat)}
                value={output}
                options={{ ...editorOptions, readOnly: true }}
              />
            ) : (
              <div className="h-full overflow-auto bg-[#1e1e1e] p-4">
                {parsed.ok && parsed.data !== undefined ? (
                  <TreeView data={parsed.data} />
                ) : (
                  <div className="text-sm text-muted-foreground mono">No data to display</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const editorOptions = {
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 15,
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorSmoothCaretAnimation: "on" as const,
  padding: { top: 14, bottom: 14 },
  renderLineHighlight: "all" as const,
  lineNumbersMinChars: 3,
  tabSize: 2,
  automaticLayout: true,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
};

function PaneHeader({
  label,
  sub,
  right,
}: {
  label: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 bg-surface/50 px-4 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {label}
        </span>
        {sub && <span className="text-[11px] text-muted-foreground mono">{sub}</span>}
      </div>
      {right}
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon,
  children,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        primary
          ? "flex h-9 items-center gap-1.5 rounded-md bg-gradient-primary px-3.5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.97]"
          : "flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-[0.97]"
      }
    >
      {icon}
      {children}
    </button>
  );
}

function FormatSelector({
  value,
  onChange,
  label,
}: {
  value: Format;
  onChange: (f: Format) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex rounded-md border border-border bg-surface p-0.5">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-[13px] font-medium transition-all ${
              value === f.value
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  setView,
}: {
  view: "raw" | "tree";
  setView: (v: "raw" | "tree") => void;
}) {
  return (
    <div className="flex rounded-md border border-border bg-surface p-0.5">
      {(["raw", "tree"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
            view === v ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
        ok
          ? "border-success/40 bg-success/10 text-success"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-foreground mono">
      {children}
    </kbd>
  );
}
