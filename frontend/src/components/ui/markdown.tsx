"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-white mt-6 mb-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-white mt-5 mb-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold text-white mt-3 mb-2 first:mt-0">
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-gray-300 leading-relaxed mb-4 last:mb-0">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-300 leading-relaxed">{children}</li>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),

        // Code
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono text-violet-400">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-white/5 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-white/5 rounded-lg p-4 mb-4 overflow-x-auto">
            {children}
          </pre>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-violet-500/50 pl-4 py-1 my-4 text-gray-400 italic">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => <hr className="border-white/10 my-6" />,

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic text-gray-200">{children}</em>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/5">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-white/10">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold text-white">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-gray-300">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
