import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function TreeView({ data, name = "root", depth = 0 }: { data: unknown; name?: string; depth?: number }) {
  return <Node name={name} value={data} depth={depth} isRoot />;
}

function Node({
  name,
  value,
  depth,
  isRoot = false,
}: {
  name: string | number;
  value: unknown;
  depth: number;
  isRoot?: boolean;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (value === null) return <Leaf name={name} display="null" cls="text-muted-foreground" isRoot={isRoot} />;
  if (typeof value === "string")
    return <Leaf name={name} display={`"${value}"`} cls="text-[#a5d6a7]" isRoot={isRoot} />;
  if (typeof value === "number")
    return <Leaf name={name} display={String(value)} cls="text-[#ffb86c]" isRoot={isRoot} />;
  if (typeof value === "boolean")
    return <Leaf name={name} display={String(value)} cls="text-[#bd93f9]" isRoot={isRoot} />;

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [i, v] as const)
    : Object.entries(value as Record<string, unknown>);

  const bracket = isArray ? ["[", "]"] : ["{", "}"];

  return (
    <div className="text-[12.5px] leading-6 mono">
      <div
        className="flex cursor-pointer items-center gap-1 rounded px-1 hover:bg-white/5"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
        {!isRoot && <span className="text-[#82aaff]">{typeof name === "string" ? `"${name}"` : name}</span>}
        {!isRoot && <span className="text-muted-foreground">:</span>}
        <span className="text-muted-foreground">{bracket[0]}</span>
        {!open && (
          <span className="text-muted-foreground/70 italic">
            {entries.length} {isArray ? "items" : "keys"}
          </span>
        )}
        {!open && <span className="text-muted-foreground">{bracket[1]}</span>}
      </div>
      {open && (
        <div className="ml-4 border-l border-border/40 pl-3">
          {entries.map(([k, v]) => (
            <Node key={String(k)} name={k} value={v} depth={depth + 1} />
          ))}
          <div className="text-muted-foreground">{bracket[1]}</div>
        </div>
      )}
    </div>
  );
}

function Leaf({
  name,
  display,
  cls,
  isRoot,
}: {
  name: string | number;
  display: string;
  cls: string;
  isRoot?: boolean;
}) {
  return (
    <div className="flex gap-1 px-1 text-[12.5px] leading-6 mono">
      {!isRoot && (
        <>
          <span className="text-[#82aaff]">{typeof name === "string" ? `"${name}"` : name}</span>
          <span className="text-muted-foreground">:</span>
        </>
      )}
      <span className={cls}>{display}</span>
    </div>
  );
}
