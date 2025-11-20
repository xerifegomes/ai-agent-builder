'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, ExternalLink, Copy, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Citation } from '@/lib/rag-advanced'

interface RAGTransparencyPanelProps {
    citations: Citation[]
    query: string
    onViewDocument?: (documentId: string, chunkId: string) => void
}

export function RAGTransparencyPanel({
    citations,
    query,
    onViewDocument
}: RAGTransparencyPanelProps) {
    const [expanded, setExpanded] = useState(true)
    const [selectedCitation, setSelectedCitation] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (citations.length === 0) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-4"
        >
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <CardTitle className="text-lg">Fontes Consultadas</CardTitle>
                            <Badge variant="secondary" className="ml-2">
                                {citations.length} {citations.length === 1 ? 'documento' : 'documentos'}
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className="h-8 w-8 p-0"
                        >
                            {expanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <CardDescription className="text-sm">
                        Esta resposta foi gerada usando informações dos seguintes documentos
                    </CardDescription>
                </CardHeader>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardContent className="space-y-3 pt-0">
                                {citations.map((citation, index) => (
                                    <motion.div
                                        key={citation.chunkId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card
                                            className={cn(
                                                'transition-all cursor-pointer hover:shadow-md',
                                                selectedCitation === citation.chunkId
                                                    ? 'border-blue-500 dark:border-blue-400 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-700'
                                            )}
                                            onClick={() => setSelectedCitation(
                                                selectedCitation === citation.chunkId ? null : citation.chunkId
                                            )}
                                        >
                                            <CardContent className="p-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                                                                <span className="font-medium text-sm truncate">
                                                                    {citation.filename}
                                                                </span>
                                                            </div>
                                                            {(citation.pageNumber || citation.section) && (
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    {citation.pageNumber && (
                                                                        <span>Página {citation.pageNumber}</span>
                                                                    )}
                                                                    {citation.section && (
                                                                        <span>• {citation.section}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Confidence Badge */}
                                                    <Badge
                                                        variant={citation.confidence > 0.7 ? 'default' : 'secondary'}
                                                        className="shrink-0"
                                                    >
                                                        {Math.round(citation.confidence * 100)}% relevante
                                                    </Badge>
                                                </div>

                                                {/* Preview Text */}
                                                <AnimatePresence>
                                                    {selectedCitation === citation.chunkId && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                                                        >
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 italic">
                                                                "{citation.text}"
                                                            </p>

                                                            {/* Citation Format */}
                                                            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                                                                <span className="flex-1 truncate">{citation.format}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        copyToClipboard(citation.format, citation.chunkId)
                                                                    }}
                                                                >
                                                                    {copiedId === citation.chunkId ? (
                                                                        <Check className="h-3 w-3" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            {/* Actions */}
                                                            {onViewDocument && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-3 w-full"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onViewDocument(citation.documentId, citation.chunkId)
                                                                    }}
                                                                >
                                                                    <ExternalLink className="h-3 w-3 mr-2" />
                                                                    Ver documento completo
                                                                </Button>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}

                                {/* Summary */}
                                <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Clique em uma fonte para ver mais detalhes e a citação formatada
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    )
}
