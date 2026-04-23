import { createFileRoute } from "@tanstack/react-router";
import { DataFormatter } from "@/components/DataFormatter";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Data Formatter — JSON, YAML & XML beautifier for developers" },
      {
        name: "description",
        content:
          "Fast, in-browser tool to format, validate, and convert JSON, YAML and XML. Syntax highlighting, tree view, and instant conversion.",
      },
      { property: "og:title", content: "Data Formatter" },
      {
        property: "og:description",
        content: "Beautify, validate and convert JSON, YAML and XML — instantly in your browser.",
      },
    ],
  }),
});

function Index() {
  return <DataFormatter />;
}
