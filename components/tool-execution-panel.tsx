'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calculator,
    Globe,
    Code,
    Clock,
    FileJson,
    Play,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Copy,
    Check
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ToolExecution } from '@/lib/tools/tool-system'

interface ToolExecutionPanelProps {
    executions: ToolExecution[]
    onRetry?: (execution: ToolExecution) => void
}

const toolIcons: Record<string, any> = {
    calculator: Calculator,
    web_search: Globe,
    code_executor: Code,
    current_time: Clock,
    json_parser: FileJson
}

const toolColors: Record<string, string> = {
    calculator: 'text-blue-600 dark:text-blue-400',
    web_search: 'text-green-600 dark:text-green-400',
    code_executor: 'text-purple-600 dark:text-purple-400',
    current_time: 'text-orange-600 dark:text-orange-400',
    json_parser: 'text-pink-600 dark:text-pink-400'
}

export function ToolExecutionPanel({ executions, onRetry }: ToolExecutionPanelProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (executions.length === 0) {
        return null
    }

    return (
        <div className="my-4 space-y-3">
            <AnimatePresence mode="popLayout">
                {executions.map((execution, index) => {
                    const Icon = toolIcons[execution.toolName] || Play
                    const iconColor = toolColors[execution.toolName] || 'text-gray-600'
                    const isExpanded = expandedId === execution.id
                    const isSuccess = execution.result.success

                    return (
                        <motion.div
                            key={execution.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={cn(
                                'border-l-4 transition-all',
                                isSuccess
                                    ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                                    : 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={cn(
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                isSuccess ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                                            )}>
                                                <Icon className={cn('h-5 w-5', iconColor)} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="text-base">
                                                        {execution.toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </CardTitle>
                                                    {isSuccess ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>

                                                <CardDescription className="text-xs">
                                                    {new Date(execution.timestamp).toLocaleTimeString('pt-BR')}
                                                    {execution.result.metadata?.executionTime && (
                                                        <span className="ml-2">
                                                            • {execution.result.metadata.executionTime}ms
                                                        </span>
                                                    )}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedId(isExpanded ? null : execution.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <CardContent className="pt-0 space-y-3">
                                                {/* Parameters */}
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                        Parâmetros:
                                                    </div>
                                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                                        <pre className="text-xs overflow-x-auto">
                                                            {JSON.stringify(execution.parameters, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>

                                                {/* Result */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            {isSuccess ? 'Resultado:' : 'Erro:'}
                                                        </div>
                                                        {isSuccess && execution.result.result && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-xs"
                                                                onClick={() => copyToClipboard(
                                                                    JSON.stringify(execution.result.result, null, 2),
                                                                    execution.id
                                                                )}
                                                            >
                                                                {copiedId === execution.id ? (
                                                                    <>
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        Copiado
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="h-3 w-3 mr-1" />
                                                                        Copiar
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className={cn(
                                                        'rounded-lg p-3',
                                                        isSuccess
                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                            : 'bg-red-100 dark:bg-red-900/30'
                                                    )}>
                                                        {isSuccess ? (
                                                            <div className="space-y-2">
                                                                {/* Formatted result based on tool type */}
                                                                {execution.toolName === 'calculator' && execution.result.result?.formatted && (
                                                                    <div className="text-lg font-mono font-semibold">
                                                                        {execution.result.result.formatted}
                                                                    </div>
                                                                )}

                                                                {execution.toolName === 'web_search' && execution.result.result?.summary && (
                                                                    <div className="text-sm whitespace-pre-wrap">
                                                                        {execution.result.result.summary}
                                                                    </div>
                                                                )}

                                                                {execution.toolName === 'code_executor' && (
                                                                    <div className="space-y-2">
                                                                        {execution.result.result?.logs && (
                                                                            <div>
                                                                                <div className="text-xs font-medium mb-1">Console:</div>
                                                                                <pre className="text-xs bg-black/10 dark:bg-black/30 p-2 rounded">
                                                                                    {execution.result.result.logs}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                        {execution.result.result?.output !== undefined && (
                                                                            <div>
                                                                                <div className="text-xs font-medium mb-1">Output:</div>
                                                                                <pre className="text-xs">
                                                                                    {JSON.stringify(execution.result.result.output, null, 2)}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Default: show raw result */}
                                                                {!['calculator', 'web_search', 'code_executor'].includes(execution.toolName) && (
                                                                    <pre className="text-xs overflow-x-auto">
                                                                        {JSON.stringify(execution.result.result, null, 2)}
                                                                    </pre>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-red-700 dark:text-red-300">
                                                                {execution.result.error}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Retry button for failed executions */}
                                                {!isSuccess && onRetry && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onRetry(execution)}
                                                        className="w-full"
                                                    >
                                                        <Play className="h-3 w-3 mr-2" />
                                                        Tentar Novamente
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
