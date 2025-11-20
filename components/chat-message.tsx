import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Bot, User, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ChatMessageProps {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp?: Date
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
    const isUser = role === 'user'
    const [copied, setCopied] = React.useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={cn(
            "flex w-full gap-4 p-4 transition-all",
            isUser ? "flex-row-reverse bg-white" : "bg-gray-50/50"
        )}>
            <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                isUser ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600"
            )}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={cn("flex-1 space-y-2 overflow-hidden", isUser && "text-right")}>
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            pre: ({ node, ...props }) => (
                                <div className="relative group my-4">
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                            onClick={() => {
                                                // Extract text from code block
                                                const text = (node?.children[0] as any)?.children[0]?.value || ''
                                                copyToClipboard(text)
                                            }}
                                        >
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <pre {...props} className="rounded-lg bg-gray-900 p-4 overflow-x-auto text-gray-100" />
                                </div>
                            ),
                            code: ({ node, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match && !String(children).includes('\n')
                                return isInline ? (
                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm text-red-500 font-mono" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
                {timestamp && (
                    <p className="text-xs text-gray-400 select-none">
                        {new Date(timestamp).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </div>
    )
}
