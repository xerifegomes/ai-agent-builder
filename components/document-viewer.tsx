'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, X, ZoomIn, ZoomOut, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DocumentViewerProps {
    documentId: string
    filename: string
    content: string
    highlightedChunks?: Array<{
        startIndex: number
        endIndex: number
        chunkId: string
    }>
    onClose: () => void
}

export function DocumentViewer({
    documentId,
    filename,
    content,
    highlightedChunks = [],
    onClose
}: DocumentViewerProps) {
    const [zoom, setZoom] = useState(100)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentHighlight, setCurrentHighlight] = useState(0)

    // Encontrar todas as ocorrências da busca
    const searchMatches = searchQuery.length > 2
        ? Array.from(content.matchAll(new RegExp(searchQuery, 'gi')))
        : []

    const goToNextHighlight = () => {
        if (currentHighlight < highlightedChunks.length - 1) {
            setCurrentHighlight(currentHighlight + 1)
            scrollToChunk(highlightedChunks[currentHighlight + 1].chunkId)
        }
    }

    const goToPrevHighlight = () => {
        if (currentHighlight > 0) {
            setCurrentHighlight(currentHighlight - 1)
            scrollToChunk(highlightedChunks[currentHighlight - 1].chunkId)
        }
    }

    const scrollToChunk = (chunkId: string) => {
        const element = document.getElementById(chunkId)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Renderizar conteúdo com highlights
    const renderContent = () => {
        if (highlightedChunks.length === 0) {
            return <div className="whitespace-pre-wrap">{content}</div>
        }

        const parts: React.ReactNode[] = []
        let lastIndex = 0

        // Ordenar chunks por startIndex
        const sortedChunks = [...highlightedChunks].sort((a, b) => a.startIndex - b.startIndex)

        sortedChunks.forEach((chunk, index) => {
            // Adicionar texto antes do chunk
            if (chunk.startIndex > lastIndex) {
                parts.push(
                    <span key={`text-${index}`}>
                        {content.substring(lastIndex, chunk.startIndex)}
                    </span>
                )
            }

            // Adicionar chunk destacado
            parts.push(
                <mark
                    key={chunk.chunkId}
                    id={chunk.chunkId}
                    className={cn(
                        'bg-yellow-200 dark:bg-yellow-900 px-1 rounded transition-all',
                        currentHighlight === index && 'ring-2 ring-blue-500'
                    )}
                >
                    {content.substring(chunk.startIndex, chunk.endIndex)}
                </mark>
            )

            lastIndex = chunk.endIndex
        })

        // Adicionar texto restante
        if (lastIndex < content.length) {
            parts.push(
                <span key="text-end">
                    {content.substring(lastIndex)}
                </span>
            )
        }

        return <div className="whitespace-pre-wrap">{parts}</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold truncate">{filename}</h2>
                            <p className="text-xs text-gray-500">
                                {highlightedChunks.length} {highlightedChunks.length === 1 ? 'trecho destacado' : 'trechos destacados'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar no documento..."
                            className="pl-9 h-9"
                        />
                        {searchMatches.length > 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                {searchMatches.length} resultados
                            </span>
                        )}
                    </div>

                    {/* Navigation */}
                    {highlightedChunks.length > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPrevHighlight}
                                disabled={currentHighlight === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                                {currentHighlight + 1} / {highlightedChunks.length}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextHighlight}
                                disabled={currentHighlight === highlightedChunks.length - 1}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-6 scrollbar-thin"
                    style={{ fontSize: `${zoom}%` }}
                >
                    <div className="max-w-3xl mx-auto">
                        {renderContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                            {content.length.toLocaleString()} caracteres • {content.split(/\s+/).length.toLocaleString()} palavras
                        </span>
                        <span>
                            Use Ctrl+F para buscar no documento
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
