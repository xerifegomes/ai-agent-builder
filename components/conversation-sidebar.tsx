'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Search, Plus, MoreVertical, Trash2, Edit2, Archive, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Conversation {
    id: string
    title: string
    agentId: string
    agentName: string
    lastMessage?: string
    updatedAt: Date
    messageCount: number
}

interface ConversationSidebarProps {
    conversations: Conversation[]
    activeConversationId?: string
    onSelectConversation: (id: string) => void
    onNewConversation: () => void
    onDeleteConversation: (id: string) => void
    onRenameConversation: (id: string, newTitle: string) => void
}

export function ConversationSidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    onRenameConversation
}: ConversationSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')

    const filteredConversations = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const startEdit = (conv: Conversation) => {
        setEditingId(conv.id)
        setEditTitle(conv.title)
        setActiveMenu(null)
    }

    const saveEdit = (id: string) => {
        if (editTitle.trim()) {
            onRenameConversation(id, editTitle.trim())
        }
        setEditingId(null)
        setEditTitle('')
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditTitle('')
    }

    // Group conversations by date
    const groupedConversations = filteredConversations.reduce((groups, conv) => {
        const date = new Date(conv.updatedAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)

        let group = 'Mais antigas'
        if (date.toDateString() === today.toDateString()) {
            group = 'Hoje'
        } else if (date.toDateString() === yesterday.toDateString()) {
            group = 'Ontem'
        } else if (date > lastWeek) {
            group = 'Últimos 7 dias'
        }

        if (!groups[group]) {
            groups[group] = []
        }
        groups[group].push(conv)
        return groups
    }, {} as Record<string, Conversation[]>)

    const groupOrder = ['Hoje', 'Ontem', 'Últimos 7 dias', 'Mais antigas']

    return (
        <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Conversas</h2>
                    <Button
                        onClick={onNewConversation}
                        size="icon"
                        className="h-8 w-8 gradient-premium text-white shadow-md hover:shadow-lg transition-smooth"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar conversas..."
                        className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                {groupOrder.map(groupName => {
                    const groupConvs = groupedConversations[groupName]
                    if (!groupConvs || groupConvs.length === 0) return null

                    return (
                        <div key={groupName} className="mb-4">
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>{groupName}</span>
                            </div>

                            <div className="space-y-1">
                                <AnimatePresence mode="popLayout">
                                    {groupConvs.map((conv) => (
                                        <motion.div
                                            key={conv.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="relative group"
                                        >
                                            <button
                                                onClick={() => onSelectConversation(conv.id)}
                                                className={cn(
                                                    'w-full text-left px-3 py-3 rounded-lg transition-smooth',
                                                    'hover:bg-white dark:hover:bg-gray-800',
                                                    activeConversationId === conv.id
                                                        ? 'bg-white dark:bg-gray-800 shadow-sm border border-blue-200 dark:border-blue-900'
                                                        : 'border border-transparent'
                                                )}
                                            >
                                                {editingId === conv.id ? (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <Input
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveEdit(conv.id)
                                                                if (e.key === 'Escape') cancelEdit()
                                                            }}
                                                            onBlur={() => saveEdit(conv.id)}
                                                            className="h-7 text-sm"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <MessageSquare className="h-4 w-4 shrink-0 text-gray-400" />
                                                                <span className="font-medium text-sm truncate">
                                                                    {conv.title}
                                                                </span>
                                                            </div>

                                                            {/* Actions Menu */}
                                                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setActiveMenu(activeMenu === conv.id ? null : conv.id)
                                                                    }}
                                                                >
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>

                                                                <AnimatePresence>
                                                                    {activeMenu === conv.id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                                            className="absolute right-0 top-full mt-1 w-40 glass-strong rounded-lg shadow-xl overflow-hidden z-10"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <button
                                                                                onClick={() => startEdit(conv)}
                                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth"
                                                                            >
                                                                                <Edit2 className="h-3 w-3" />
                                                                                <span>Renomear</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    onDeleteConversation(conv.id)
                                                                                    setActiveMenu(null)
                                                                                }}
                                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                                <span>Deletar</span>
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                        {conv.lastMessage && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                                                                {conv.lastMessage}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                                            <span>{conv.agentName}</span>
                                                            <span>
                                                                {formatDistanceToNow(new Date(conv.updatedAt), {
                                                                    addSuffix: true,
                                                                    locale: ptBR
                                                                })}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )
                })}

                {filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={onNewConversation}
                                size="sm"
                                className="mt-4 gradient-premium text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Conversa
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
