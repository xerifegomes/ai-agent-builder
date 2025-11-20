"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, Loader2, Database } from "lucide-react"

interface OllamaModelResponse {
  name: string
  size: number
  digest: string
  modified_at: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function OllamaPage() {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingModels, setLoadingModels] = useState(true)

  // Carrega modelos disponíveis
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/ollama/models')
        const data = await response.json()
        if (data.models) {
          setModels(data.models.map((m: OllamaModelResponse) => m.name))
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name)
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()
      
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chat Local Ollama</h2>
        <p className="text-gray-500">Converse com seus modelos Ollama hospedados localmente.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Seleção de Modelo
            </CardTitle>
            <CardDescription>Escolha um modelo Ollama</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : models.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum modelo encontrado. Certifique-se de que o Ollama está em execução.</p>
            ) : (
              <div className="space-y-2">
                <Label>Modelos Disponíveis</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>{models.length} modelos carregados</span>
            </div>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Interface de Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 h-[400px] overflow-y-auto bg-gray-50 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-20">Inicie uma conversa...</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                        : 'bg-white text-gray-900 mr-auto max-w-[80%]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="resize-none"
                rows={2}
              />
              <Button onClick={sendMessage} disabled={loading || !selectedModel} className="px-6">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
