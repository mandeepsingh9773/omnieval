"use client";

import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Flatten a React tree (e.g. a highlighted <code> element) into plain text. */
function nodeToText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return nodeToText(
      (node as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => nodeToText(children), [children]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (non-secure context) — ignore.
    }
  }

  return (
    <div className="group relative">
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={copied ? "Copied code" : "Copy code"}
        onClick={copy}
        className="absolute top-1.5 right-1.5 z-10 text-code-foreground opacity-0 transition-opacity hover:bg-code-foreground/10 hover:text-code-foreground group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <Check className="text-status-success" /> : <Copy />}
      </Button>
      <pre className="!my-3 overflow-x-auto rounded-lg border border-code-border bg-code-background p-3 text-[0.8125rem] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ node: _node, className, children }) => {
    void _node;
    const isBlock =
      typeof className === "string" &&
      (className.includes("language-") || className.includes("hljs"));
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] before:content-none after:content-none">
        {children}
      </code>
    );
  },
  a: ({ children, ...props }) => (
    <a
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
