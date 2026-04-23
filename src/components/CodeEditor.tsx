import { useEffect, useState, type ComponentProps, type ComponentType } from "react";

// We import Monaco only in the browser to avoid SSR pulling in monaco-editor's
// CSS assets (which Node can't load) and to prevent hydration mismatches.
type MonacoModule = typeof import("@monaco-editor/react");
type MonacoEditorComponent = MonacoModule["default"];

let editorPromise: Promise<MonacoEditorComponent> | null = null;
function loadEditor(): Promise<MonacoEditorComponent> {
  if (!editorPromise) {
    editorPromise = import("@monaco-editor/react").then((m) => m.default);
  }
  return editorPromise;
}

export type EditorProps = ComponentProps<MonacoEditorComponent>;

export function CodeEditor(props: EditorProps) {
  const [Editor, setEditor] = useState<ComponentType<EditorProps> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadEditor().then((Cmp) => {
      if (mounted) setEditor(() => Cmp);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Editor) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return <Editor {...props} />;
}

export type { OnMount } from "@monaco-editor/react";
