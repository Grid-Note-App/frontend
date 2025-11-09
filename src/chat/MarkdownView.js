import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownView({ content }) {
    return (
        <div className="markdown-body text-start">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem',
                                    marginBottom: '0.5rem',
                                }}
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className="bg-light rounded px-1 py-0" {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
