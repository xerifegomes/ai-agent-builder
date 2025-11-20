'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Download, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PremiumChatMessage } from './premium-chat-message'
import { ChatInputAdvanced } from './chat-input-advanced'
import { ConversationSidebar } from './conversation-sidebar'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
}

interface Conversation {
    id: string
    title: string
    agentId: string
    agentName: string
    lastMessage?: string
    updatedAt: Date
    messageCount: number
}

interface PremiumChatContainerProps {
    agentId: string
    agentName: string
    systemPrompt?: string
    onSendMessage: (message: string, conversationId: string) => Promise<void>
}

export function PremiumChatContainer({
    agentId,
    agentName,
    systemPrompt,
    onSendMessage
}: PremiumChatContainerProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load conversations on mount
    useEffect(() => {
        loadConversations()
    }, [])

    // Load messages when conversation changes
    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId)
        }
    }, [activeConversationId])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Dark mode toggle
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/conversations')
            if (response.ok) {
                const data = await response.json()
                setConversations(data)

                // Auto-select first conversation or create new one
                if (data.length > 0 && !activeConversationId) {
                    setActiveConversationId(data[0].id)
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error)
        }
    }

    const loadMessages = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`)
            if (response.ok) {
                const data = await response.json()
                setMessages(data.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                })))
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        }
    }

    const createNewConversation = async () => {
        try {
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, title: 'Nova Conversa' })
            })

            if (response.ok) {
                const newConv = await response.json()
                setConversations(prev => [newConv, ...prev])
                setActiveConversationId(newConv.id)
                setMessages([])
            }
        } catch (error) {
            console.error('Error creating conversation:', error)
        }
    }

    const deleteConversation = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setConversations(prev => prev.filter(c => c.id !== id))
                if (activeConversationId === id) {
                    const remaining = conversations.filter(c => c.id !== id)
                    setActiveConversationId(remaining[0]?.id || null)
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
        }
    }

    const renameConversation = async (id: string, newTitle: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            })

            if (response.ok) {
                setConversations(prev =>
                    prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
                )
            }
        } catch (error) {
            console.error('Error renaming conversation:', error)
        }
    }

    const handleSendMessage = async (content: string, files?: File[]) => {
        if (!activeConversationId) {
            await createNewConversation()
            // Wait a bit for the conversation to be created
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        const conversationId = activeConversationId!

        // Add user message to UI
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])

        // Save user message to DB
        try {
            await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'user', content })
            })
        } catch (error) {
            console.error('Error saving user message:', error)
        }

        // Add empty assistant message for streaming
        const assistantMessageId = (Date.now() + 1).toString()
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsStreaming(true)

        // Call the onSendMessage handler (which will handle streaming)
        try {
            await onSendMessage(content, conversationId)
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: 'Erro ao processar mensagem. Verifique se o Ollama está rodando.' }
                        : msg
                )
            )
        } finally {
            setIsStreaming(false)
        }

        // Reload conversations to update last message
        loadConversations()
    }

    const exportConversation = async (format: 'pdf' | 'markdown' | 'json') => {
        // TODO: Implement export functionality
        console.log('Exporting as:', format)
    }

    const promptSuggestions = [
        'Explique como funciona...',
        'Qual a diferença entre...',
        'Me ajude a criar...',
        'Analise este código...'
    ]

    return (
        <div className="flex h-screen bg-gradient-mesh">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-80 shrink-0"
                    >
                        <ConversationSidebar
                            conversations={conversations}
                            activeConversationId={activeConversationId || undefined}
                            onSelectConversation={setActiveConversationId}
                            onNewConversation={createNewConversation}
                            onDeleteConversation={deleteConversation}
                            onRenameConversation={renameConversation}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="glass border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">{agentName}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activeConversationId
                                    ? conversations.find(c => c.id === activeConversationId)?.title
                                    : 'Selecione ou crie uma conversa'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDarkMode(!darkMode)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => exportConversation('markdown')}
                                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Download className="h-5 w-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="w-20 h-20 gradient-premium rounded-full flex items-center justify-center mb-6 shadow-xl"
                            >
                                <span className="text-3xl">🤖</span>
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-2">Olá! Como posso ajudar?</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Faça uma pergunta ou escolha uma sugestão abaixo
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-2xl">
                                {promptSuggestions.map((suggestion, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleSendMessage(suggestion)}
                                        className="glass hover-lift p-4 rounded-xl text-left transition-smooth"
                                    >
                                        <p className="text-sm font-medium">{suggestion}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {messages.map((message) => (
                                <PremiumChatMessage
                                    key={message.id}
                                    role={message.role}
                                    content={message.content}
                                    timestamp={message.timestamp}
                                    isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="glass border-t border-gray-200 dark:border-gray-700 p-6">
                    <ChatInputAdvanced
                        onSend={handleSendMessage}
                        disabled={isLoading || isStreaming}
                        suggestions={promptSuggestions}
                    />
                </div>
            </div>
        </div>
    )
}
