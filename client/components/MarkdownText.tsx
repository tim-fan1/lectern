import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// need css for katex
import "katex/dist/katex.min.css";
import { CodeProps } from "react-markdown/lib/ast-to-react";
import * as themes from "react-syntax-highlighter/dist/cjs/styles/prism";
import SyntaxHighlighterProps from "react-syntax-highlighter";

export type TextProps = {
    text: string;
    className?: string;
};

// library code from https://www.npmjs.com/package/react-markdown
// this component takes in code props and renders it,
// either with syntax highlighting when a name is included
// or as a <code> element </code> for inline code
function code({ node, inline, className, children, ...props }: CodeProps) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
        <SyntaxHighlighter
            style={themes.pojoaque}
            language={match[1]}
            customStyle={{ textAlign: "left" }}
            // horrible bit of casting due to weirdly conflicting types :(
            {...(props as SyntaxHighlighterProps)}
        >
            {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
}

export const MarkdownText = ({ text, className }: TextProps) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{ code }}
            className={className}
        >
            {text}
        </ReactMarkdown>
    );
};
