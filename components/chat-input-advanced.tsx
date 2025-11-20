'use client'

import React, { useState, useRef, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputAdvancedProps {
    onSend: (message: string, files?: File[]) => void
    disabled?: boolean
    placeholder?: string
    suggestions?: string[]
    maxLength?: number
}

export function ChatInputAdvanced({
    onSend,
    disabled = false,
    placeholder = 'Digite sua mensagem...',
    suggestions = [],
    maxLength = 4000
}: ChatInputAdvancedProps) {
    const [input, setInput] = useState('')
    const [files, setFiles] = useState<File[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [commandHistory, setCommandHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        if (!input.trim() || disabled) return

        onSend(input, files.length > 0 ? files : undefined)
        setCommandHistory(prev => [input, ...prev].slice(0, 50)) // Keep last 50 commands
        setInput('')
        setFiles([])
        setHistoryIndex(-1)

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }

        // Navigate command history with arrow keys
        if (e.key === 'ArrowUp' && input === '' && commandHistory.length > 0) {
            e.preventDefault()
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
            setHistoryIndex(newIndex)
            setInput(commandHistory[newIndex])
        }

        if (e.key === 'ArrowDown' && historyIndex >= 0) {
            e.preventDefault()
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            setInput(newIndex >= 0 ? commandHistory[newIndex] : '')
        }

        // Show suggestions on '/'
        if (e.key === '/' && input === '') {
            setShowSuggestions(true)
        }

        // Hide suggestions on Escape
        if (e.key === 'Escape') {
            setShowSuggestions(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setFiles(prev => [...prev, ...selectedFiles])
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const useSuggestion = (suggestion: string) => {
        setInput(suggestion)
        setShowSuggestions(false)
        textareaRef.current?.focus()
    }

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)

        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }

    const charCount = input.length
    const isNearLimit = charCount > maxLength * 0.8

    return (
        <div className="relative">
            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 glass rounded-lg shadow-xl overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                <Sparkles className="h-3 w-3" />
                                <span>Sugestões de prompts</span>
                            </div>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => useSuggestion(suggestion)}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth text-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Attachments */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 flex flex-wrap gap-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={index}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                            >
                                <Paperclip className="h-3 w-3" />
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5 transition-smooth"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Container */}
            <div className="relative flex items-end gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-smooth focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                {/* Attach File Button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.md,.doc,.docx,image/*"
                />

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    rows={1}
                    className={cn(
                        'flex-1 resize-none bg-transparent outline-none text-sm',
                        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                        'scrollbar-thin',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                />

                {/* Character Count */}
                {isNearLimit && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            'absolute top-1 right-14 text-xs',
                            charCount >= maxLength ? 'text-red-500' : 'text-gray-400'
                        )}
                    >
                        {charCount}/{maxLength}
                    </motion.span>
                )}

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || !input.trim()}
                    size="icon"
                    className={cn(
                        'shrink-0 h-9 w-9 gradient-premium text-white shadow-md transition-smooth',
                        (!input.trim() || disabled) && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {disabled ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> para enviar
                    {' • '}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Shift+Enter</kbd> para nova linha
                </span>
                <span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑</kbd> histórico
                </span>
            </div>
        </div>
    )
}
