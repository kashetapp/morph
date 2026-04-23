import { lazy, Suspense, type ComponentProps } from "react";

// Lazy-load Monaco only on the client to avoid SSR/worker bundling issues
// and keep production from depending on a CDN at runtime.
const MonacoEditor = lazy(async () => {
  const [{ loader, default: Editor }, monaco, editorWorker, jsonWorker] = await Promise.all([
    import("@monaco-editor/react"),
    import("monaco-editor"),
    import("monaco-editor/esm/vs/editor/editor.worker?worker"),
    import("monaco-editor/esm/vs/language/json/json.worker?worker"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === "json") return new jsonWorker.default();
      return new editorWorker.default();
    },
  };
  loader.config({ monaco });

  return { default: Editor };
});

export type EditorProps = ComponentProps<typeof MonacoEditor>;

export function CodeEditor(props: EditorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          Loading editor…
        </div>
      }
    >
      <MonacoEditor {...props} />
    </Suspense>
  );
}

export type { OnMount } from "@monaco-editor/react";
