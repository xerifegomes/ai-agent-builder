'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { motion } from 'framer-motion'
import { User, Bot, Copy, RotateCcw, Edit2, ThumbsUp, ThumbsDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RAGTransparencyPanel } from './rag-transparency-panel'
import type { Citation } from '@/lib/rag-advanced'

interface PremiumChatMessageProps {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    isStreaming?: boolean
    citations?: Citation[]
    onRegenerate?: () => void
    onEdit?: () => void
    onFeedback?: (type: 'positive' | 'negative') => void
    onViewDocument?: (documentId: string, chunkId: string) => void
}

export function PremiumChatMessage({
    role,
    content,
    timestamp,
    isStreaming = false,
    citations,
    onRegenerate,
    onEdit,
    onFeedback,
    onViewDocument
}: PremiumChatMessageProps) {
    const isUser = role === 'user'
    const [copied, setCopied] = useState(false)
    const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
    // New state for API interaction
    const [apiResponse, setApiResponse] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)




    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFeedback = (type: 'positive' | 'negative') => {
        setFeedback(type)
        onFeedback?.(type)
    }

    // Helper to retrieve auth token (cookie or localStorage)
    const getAuthToken = (): string | null => {
        // Try cookie named 'auth_token'
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/)
        if (match && match[1]) return match[1]
        // Fallback to localStorage key 'authToken'
        return localStorage.getItem('authToken')
    }

    // Async function to call backend API with token
    const fetchData = async () => {
        setLoading(true)
        setError(null)
        setApiResponse(null)
        try {
            const token = getAuthToken()
            if (!token) throw new Error('Auth token not found')
            const response = await fetch('/api/test', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) throw new Error(`API error: ${response.status}`)
            const data = await response.json()
            setApiResponse(JSON.stringify(data, null, 2))
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                'group flex w-full gap-4 px-6 py-6 transition-smooth',
                isUser ? 'flex-row-reverse bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800' : 'bg-white dark:bg-gray-900/50'
            )}
        >
            {/* Avatar */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={cn(
                    'flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full shadow-md transition-smooth',
                    isUser
                        ? 'gradient-premium text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300'
                )}
            >
                {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </motion.div>

            {/* Content */}
            <div className={cn('flex-1 space-y-2 overflow-hidden', isUser && 'text-right')}>
                {/* Message Content */}
                <div className={cn('prose prose-sm dark:prose-invert max-w-none break-words', isUser && 'text-left')}>
                    <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            pre: ({ node, ...props }) => (
                                <div className="relative group/code my-4">
                                    <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                                            onClick={() => {
                                                const text = (node?.children[0] as any)?.children[0]?.value || ''
                                                copyToClipboard(text)
                                            }}
                                        >
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <pre {...props} className="rounded-lg bg-gray-900 p-4 overflow-x-auto text-gray-100 scrollbar-thin" />
                                </div>
                            ),
                            code: ({ node, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match && !String(children).includes('\n')
                                return isInline ? (
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm text-red-500 dark:text-red-400 font-mono" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                                </div>
                            ),
                            th: ({ node, ...props }) => (
                                <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100" {...props} />
                            )
                        }}
                    >
                        {content}
                    </ReactMarkdown>

                    {/* Streaming Indicator */}
                    {isStreaming && !isUser && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1 mt-2"
                        >
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                        </motion.div>
                    )}
                </div>

                {/* Metadata and Actions */}
                <div className={cn('flex items-center gap-2 text-xs text-gray-400', isUser ? 'justify-end' : 'justify-start')}>
                    {timestamp && (
                        <span className="select-none">
                            {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}

                    {/* RAG Citations - Only for assistant messages */}
                    {role === 'assistant' && citations && citations.length > 0 && (
                        <RAGTransparencyPanel
                            citations={citations}
                            query=""
                            onViewDocument={onViewDocument}
                        />
                    )}

                    {/* Action Buttons */}
                    {!isStreaming && (
                        <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity', isUser && 'flex-row-reverse')}>
                            {/* Copy Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => copyToClipboard(content)}
                            >
                                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>

                            {/* Regenerate (Assistant only) */}
                            {!isUser && onRegenerate && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={onRegenerate}
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </Button>
                            )}

                            {/* Edit (User only) */}
                            {isUser && onEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={onEdit}
                                >
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            )}

                            {/* Feedback (Assistant only) */}
                            {!isUser && onFeedback && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800',
                                            feedback === 'positive' && 'text-green-500'
                                        )}
                                        onClick={() => handleFeedback('positive')}
                                    >
                                        <ThumbsUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            'h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800',
                                            feedback === 'negative' && 'text-red-500'
                                        )}
                                        onClick={() => handleFeedback('negative')}
                                    >
                                        <ThumbsDown className="h-3 w-3" />
                                    </Button>
                                </>
                            )}

                            {/* Test API Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 ml-2"
                                onClick={fetchData}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test API'}
                            </Button>
                        </div>
                    )}
                    {/* API Response Display */}
                    {error && <p className="text-sm text-red-500 mt-2">Error: {error}</p>}
                    {apiResponse && (
                        <pre className="mt-2 rounded bg-gray-100 dark:bg-gray-800 p-2 text-xs overflow-x-auto">
                            {apiResponse}
                        </pre>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
