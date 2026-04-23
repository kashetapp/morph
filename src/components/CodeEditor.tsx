import { useEffect, useRef, type ChangeEvent, type UIEvent } from "react";

// Lightweight, SSR-safe code editor: textarea with synced line numbers.
// Replaces Monaco to avoid bundling .css/worker assets that break Cloudflare
// Worker SSR and produce 404s in production.

export type OnMount = (editor: { focus: () => void }) => void;

export interface EditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  onMount?: OnMount;
  language?: string;
  height?: string | number;
  theme?: string;
  options?: {
    readOnly?: boolean;
    fontSize?: number;
    tabSize?: number;
  };
}

export function CodeEditor({
  value,
  onChange,
  onMount,
  options,
  height = "100%",
}: EditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const readOnly = options?.readOnly ?? false;
  const fontSize = options?.fontSize ?? 13;
  const tabSize = options?.tabSize ?? 2;

  useEffect(() => {
    if (taRef.current && onMount) {
      onMount({ focus: () => taRef.current?.focus() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineCount = Math.max(1, value.split("\n").length);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  const handleScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !readOnly) {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const indent = " ".repeat(tabSize);
      const next = value.substring(0, start) + indent + value.substring(end);
      onChange?.(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + indent.length;
      });
    }
  };

  return (
    <div
      className="relative flex h-full w-full overflow-hidden bg-[#1e1e1e] font-mono"
      style={{ height, fontSize }}
    >
      <div
        ref={gutterRef}
        aria-hidden
        className="select-none overflow-hidden whitespace-pre py-3.5 pl-3 pr-2 text-right text-[#6b7280] leading-[1.55]"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
      >
        {lines}
      </div>
      <textarea
        ref={taRef}
        value={value}
        readOnly={readOnly}
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        wrap="off"
        className="flex-1 resize-none overflow-auto whitespace-pre bg-transparent py-3.5 pl-2 pr-4 text-[#d4d4d4] leading-[1.55] outline-none"
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          tabSize,
        }}
      />
    </div>
  );
}
