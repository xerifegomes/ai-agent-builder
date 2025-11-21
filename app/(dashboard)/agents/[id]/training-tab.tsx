"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Download, MessageSquare, BookOpen } from "lucide-react"

interface TrainingExample {
    id: string
    content: string
    metadata: {
        type: string
        input: string
        output: string
        notes?: string
        createdBy?: string
    }
    createdAt: string
}

interface TrainingTabProps {
    agentId: string
}

export function TrainingTab({ agentId }: TrainingTabProps) {
    const [examples, setExamples] = useState<TrainingExample[]>([])
    const [conversations, setConversations] = useState<any>({ whatsapp: [], web: [] })
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)

    const [newExample, setNewExample] = useState({
        input: '',
        output: '',
        notes: ''
    })

    useEffect(() => {
        fetchTrainingData()
    }, [agentId])

    async function fetchTrainingData() {
        try {
            setLoading(true)
            const [examplesRes, conversationsRes] = await Promise.all([
                fetch(`/api/agents/${agentId}/training`),
                fetch(`/api/agents/${agentId}/conversations?limit=20`)
            ])

            if (examplesRes.ok) {
                const data = await examplesRes.json()
                setExamples(data)
            }

            if (conversationsRes.ok) {
                const data = await conversationsRes.json()
                setConversations(data)
            }
        } catch (error) {
            console.error('Error fetching training data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function addExample() {
        if (!newExample.input || !newExample.output) {
            alert('Input e output são obrigatórios')
            return
        }

        try {
            setAdding(true)
            const response = await fetch(`/api/agents/${agentId}/training`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExample)
            })

            if (response.ok) {
                setNewExample({ input: '', output: '', notes: '' })
                fetchTrainingData()
            }
        } catch (error) {
            console.error('Error adding example:', error)
        } finally {
            setAdding(false)
        }
    }

    async function deleteExample(id: string) {
        if (!confirm('Tem certeza que deseja deletar este exemplo?')) return

        try {
            const response = await fetch(`/api/agents/${agentId}/training?id=${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchTrainingData()
            }
        } catch (error) {
            console.error('Error deleting example:', error)
        }
    }

    function exportTrainingData() {
        const jsonl = examples.map(ex => JSON.stringify({
            messages: [
                { role: 'user', content: ex.metadata.input },
                { role: 'assistant', content: ex.metadata.output }
            ]
        })).join('\n')

        const blob = new Blob([jsonl], { type: 'application/jsonl' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `training-data-${agentId}.jsonl`
        a.click()
    }

    function importFromConversation(userMsg: string, assistantMsg: string) {
        setNewExample({
            input: userMsg,
            output: assistantMsg,
            notes: 'Importado de conversa'
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loading) {
        return <div className="p-8 text-center">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            {/* Add New Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Exemplo de Treinamento</CardTitle>
                    <CardDescription>
                        Ensine o agente com exemplos de input/output esperados
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="input">Input (Mensagem do Usuário)</Label>
                        <Textarea
                            id="input"
                            placeholder="Ex: Quanto custa um apartamento de 2 quartos?"
                            value={newExample.input}
                            onChange={(e) => setNewExample({ ...newExample, input: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="output">Output Esperado (Resposta do Agente)</Label>
                        <Textarea
                            id="output"
                            placeholder="Ex: Temos apartamentos de 2 quartos a partir de R$ 350.000..."
                            value={newExample.output}
                            onChange={(e) => setNewExample({ ...newExample, output: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Input
                            id="notes"
                            placeholder="Ex: Resposta padrão para consulta de preços"
                            value={newExample.notes}
                            onChange={(e) => setNewExample({ ...newExample, notes: e.target.value })}
                        />
                    </div>
                    <Button onClick={addExample} disabled={adding}>
                        <Plus className="h-4 w-4 mr-2" />
                        {adding ? 'Adicionando...' : 'Adicionar Exemplo'}
                    </Button>
                </CardContent>
            </Card>

            {/* Training Examples List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Exemplos de Treinamento ({examples.length})</CardTitle>
                        <CardDescription>Dados para fine-tuning do modelo</CardDescription>
                    </div>
                    {examples.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportTrainingData}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportar JSONL
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {examples.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            Nenhum exemplo de treinamento ainda. Adicione exemplos acima.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {examples.map((example) => (
                                <div key={example.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Input:</span>
                                                <p className="text-sm mt-1">{example.metadata.input}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Output:</span>
                                                <p className="text-sm mt-1">{example.metadata.output}</p>
                                            </div>
                                            {example.metadata.notes && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Notas:</span>
                                                    <p className="text-sm mt-1 text-gray-600">{example.metadata.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteExample(example.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Criado em {new Date(example.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Conversation History */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Conversas</CardTitle>
                    <CardDescription>
                        Revise conversas anteriores e importe como exemplos de treinamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* WhatsApp Conversations */}
                        {conversations.whatsapp.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    WhatsApp ({conversations.whatsapp.length})
                                </h4>
                                <div className="space-y-3">
                                    {conversations.whatsapp.slice(0, 10).map((conv: any) => (
                                        <div key={conv.id} className="border rounded-lg p-3 space-y-2">
                                            <p className="text-sm">{conv.content}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">
                                                    {conv.metadata?.phoneNumber} • {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                                {conv.metadata?.userMessage && conv.metadata?.agentResponse && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => importFromConversation(
                                                            conv.metadata.userMessage,
                                                            conv.metadata.agentResponse
                                                        )}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Importar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Web Conversations */}
                        {conversations.web.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Chat Web ({conversations.web.length})
                                </h4>
                                <div className="space-y-3">
                                    {conversations.web.slice(0, 5).map((conv: any) => (
                                        <div key={conv.id} className="border rounded-lg p-3">
                                            <p className="text-sm font-medium mb-2">{conv.title}</p>
                                            <div className="space-y-1">
                                                {conv.messages.slice(-2).map((msg: any) => (
                                                    <p key={msg.id} className="text-xs text-gray-600">
                                                        <span className="font-medium">{msg.role}:</span> {msg.content.substring(0, 100)}...
                                                    </p>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400 mt-2 block">
                                                {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {conversations.whatsapp.length === 0 && conversations.web.length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                                Nenhuma conversa encontrada ainda.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
