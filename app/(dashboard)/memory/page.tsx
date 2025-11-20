"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Plus, Trash2, Search, MessageSquare, Database, Sparkles } from "lucide-react"

interface Memory {
  id: string
  agentId: string
  key: string
  value: string
  type: 'fact' | 'preference' | 'context' | 'instruction'
  timestamp: string
}

interface Conversation {
  id: string
  agentId: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function MemoryPage() {
  const [agentId] = useState('default-agent')
  const [memories, setMemories] = useState<Memory[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Form para adicionar memória
  const [newMemory, setNewMemory] = useState<{
    key: string
    value: string
    type: 'fact' | 'preference' | 'context' | 'instruction'
  }>({
    key: '',
    value: '',
    type: 'fact',
  })

  const loadMemories = async () => {
    try {
      const response = await fetch(`/api/memory/agent-memory?agentId=${agentId}`)
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Failed to load memories:', error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/memory/conversations?agentId=${agentId}`)
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  // Carrega memórias e conversas
  useEffect(() => {
    loadMemories()
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const addMemory = async () => {
    if (!newMemory.key || !newMemory.value) return

    setLoading(true)
    try {
      const response = await fetch('/api/memory/agent-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, ...newMemory }),
      })

      if (response.ok) {
        setNewMemory({ key: '', value: '', type: 'fact' })
        loadMemories()
      }
    } catch (error) {
      console.error('Failed to add memory:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory/agent-memory?id=${id}`, { method: 'DELETE' })
      loadMemories()
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const clearAllMemories = async () => {
    if (!confirm('Are you sure you want to clear all memories?')) return
    
    try {
      await fetch(`/api/memory/agent-memory?agentId=${agentId}&clear=true`, { method: 'DELETE' })
      loadMemories()
    } catch (error) {
      console.error('Failed to clear memories:', error)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      loadMemories()
      return
    }

    try {
      const response = await fetch(`/api/memory/agent-memory?agentId=${agentId}&query=${searchQuery}`)
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Failed to search memories:', error)
    }
  }

  const filteredMemories = memories.filter(m =>
    m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema de Memória</h2>
          <p className="text-gray-500">Memória local persistente para agentes de IA.</p>
        </div>
        <Button variant="destructive" onClick={clearAllMemories}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar Tudo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              {memories.length}
            </CardTitle>
            <CardDescription>Total de Memórias</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              {conversations.length}
            </CardTitle>
            <CardDescription>Conversas</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              {agentId}
            </CardTitle>
            <CardDescription>Agente Ativo</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Memória
            </CardTitle>
            <CardDescription>Armazene fatos, preferências ou contexto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memory-key">Chave</Label>
              <Input
                id="memory-key"
                placeholder="ex: nome_usuario, cor_favorita"
                value={newMemory.key}
                onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory-value">Valor</Label>
              <Textarea
                id="memory-value"
                placeholder="Conteúdo da memória..."
                value={newMemory.value}
                onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory-type">Tipo</Label>
              <select
                id="memory-type"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                value={newMemory.type}
                onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as typeof newMemory.type })}
              >
                <option value="fact">Fato</option>
                <option value="preference">Preferência</option>
                <option value="context">Contexto</option>
                <option value="instruction">Instrução</option>
              </select>
            </div>

            <Button onClick={addMemory} disabled={loading} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Memória
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Memórias
            </CardTitle>
            <CardDescription>Encontre informações armazenadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar chave ou valor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMemories()}
              />
              <Button onClick={searchMemories}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Conversas Recentes</Label>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma conversa ainda</p>
                ) : (
                  conversations.slice(0, 5).map((conv) => (
                    <div key={conv.id} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 truncate">{conv.title}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memórias Armazenadas ({filteredMemories.length})
          </CardTitle>
          <CardDescription>Todas as memórias de {agentId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMemories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma memória armazenada ainda</p>
            ) : (
              filteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{memory.key}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        memory.type === 'fact' ? 'bg-blue-100 text-blue-700' :
                        memory.type === 'preference' ? 'bg-purple-100 text-purple-700' :
                        memory.type === 'context' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {memory.type === 'fact' ? 'Fato' :
                         memory.type === 'preference' ? 'Preferência' :
                         memory.type === 'context' ? 'Contexto' : 'Instrução'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{memory.value}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(memory.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMemory(memory.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
