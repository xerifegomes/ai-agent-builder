"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Bot,
  Send,
  Loader2,
  Settings as SettingsIcon,
  MessageSquare,
  Save,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react"
import { ChatMessage } from "@/components/chat-message"

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface TestResult {
  id: number
  input: string
  output: string
  status: 'success' | 'error' | 'pending'
  duration: number
  timestamp: Date
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [agent, setAgent] = useState<any>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)

  const [mode, setMode] = useState<'chat' | 'config' | 'test'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [runningTests, setRunningTests] = useState(false)

  // Configurações do agente
  const [config, setConfig] = useState({
    name: '',
    description: '',
    model: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 500,
  })

  useEffect(() => {
    async function fetchAgent() {
      try {
        const response = await fetch(`/api/agents/${agentId}`)
        if (!response.ok) throw new Error('Failed to fetch agent')

        const data = await response.json()
        setAgent(data)
        setConfig({
          name: data.name,
          description: data.description || '',
          model: data.model,
          systemPrompt: data.systemPrompt || '',
          temperature: data.temperature,
          maxTokens: data.maxTokens,
        })
      } catch (error) {
        console.error('Error fetching agent:', error)
      } finally {
        setLoadingAgent(false)
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Enviar mensagem no chat (com streaming)
  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: config.systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content }
          ],
        }),
      })

      if (!response.ok) throw new Error('Network response was not ok')
      if (!response.body) throw new Error('No response body')

      // Adiciona mensagem vazia do assistente para começar o stream
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedContent = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })
        accumulatedContent += chunkValue

        // Atualiza a última mensagem com o conteúdo acumulado
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = accumulatedContent
          }
          return newMessages
        })
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao processar mensagem. Verifique se o Ollama está rodando.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  // Salvar configurações
  const saveConfig = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error('Failed to update agent')

      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Error updating agent:', error)
      alert('Erro ao salvar configurações.')
    }
  }

  // Executar bateria de testes
  const runTests = async () => {
    setRunningTests(true)
    setTestResults([])

    const testCases = [
      "Olá, como você pode me ajudar?",
      "Qual é o seu nome?",
      "Você pode explicar suas funcionalidades?",
    ]

    for (const testCase of testCases) {
      const startTime = Date.now()
      const testResult: TestResult = {
        id: Date.now(),
        input: testCase,
        output: '',
        status: 'pending',
        duration: 0,
        timestamp: new Date()
      }

      setTestResults(prev => [...prev, testResult])

      try {
        const response = await fetch('/api/ollama/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: config.systemPrompt },
              { role: 'user', content: testCase }
            ],
          }),
        })

        const data = await response.json()
        const duration = Date.now() - startTime

        setTestResults(prev => prev.map(t =>
          t.id === testResult.id
            ? { ...t, output: data.message || 'Sem resposta', status: 'success', duration }
            : t
        ))
      } catch {
        const duration = Date.now() - startTime
        setTestResults(prev => prev.map(t =>
          t.id === testResult.id
            ? { ...t, output: 'Erro ao executar teste', status: 'error', duration }
            : t
        ))
      }
    }

    setRunningTests(false)
  }

  if (loadingAgent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-bold">Agente não encontrado</h2>
        <Button onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{config.name}</h2>
            <p className="text-gray-500">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'chat' ? 'default' : 'outline'}
            onClick={() => setMode('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            variant={mode === 'test' ? 'default' : 'outline'}
            onClick={() => setMode('test')}
          >
            <Play className="h-4 w-4 mr-2" />
            Testes
          </Button>
          <Button
            variant={mode === 'config' ? 'default' : 'outline'}
            onClick={() => setMode('config')}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Modo Chat */}
      {mode === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversa com o Agente
            </CardTitle>
            <CardDescription>
              Interaja diretamente com {config.name} para testar suas respostas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 h-[500px] overflow-y-auto bg-gray-50 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Bot className="h-16 w-16 mb-4" />
                  <p className="text-center">Inicie uma conversa com {config.name}</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ))
              )}
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessages([])}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Conversa
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modo Testes */}
      {mode === 'test' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Bateria de Testes
                  </CardTitle>
                  <CardDescription>
                    Execute testes automáticos para validar o comportamento do agente
                  </CardDescription>
                </div>
                <Button
                  onClick={runTests}
                  disabled={runningTests}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {runningTests ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Testes
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Play className="h-12 w-12 mx-auto mb-3" />
                  <p>Clique em &ldquo;Executar Testes&rdquo; para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <Card key={result.id} className="border-l-4" style={{
                      borderLeftColor:
                        result.status === 'success' ? '#10b981' :
                          result.status === 'error' ? '#ef4444' : '#f59e0b'
                    }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                            {result.status === 'pending' && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
                            <span className="font-medium text-sm">
                              {result.status === 'success' ? 'Sucesso' :
                                result.status === 'error' ? 'Erro' : 'Executando...'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {result.duration}ms
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <Label className="text-xs text-gray-500">Entrada:</Label>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                            {result.input}
                          </p>
                        </div>
                        {result.output && (
                          <div>
                            <Label className="text-xs text-gray-500">Saída:</Label>
                            <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                              {result.output}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(t => t.status === 'success').length}
                    </div>
                    <div className="text-sm text-gray-500">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(t => t.status === 'error').length}
                    </div>
                    <div className="text-sm text-gray-500">Erros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.length > 0
                        ? Math.round(testResults.reduce((acc, t) => acc + t.duration, 0) / testResults.length)
                        : 0}ms
                    </div>
                    <div className="text-sm text-gray-500">Tempo Médio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modo Configuração */}
      {mode === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações do Agente
            </CardTitle>
            <CardDescription>
              Ajuste os parâmetros e comportamento do agente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config-name">Nome do Agente</Label>
              <Input
                id="config-name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-description">Descrição</Label>
              <Textarea
                id="config-description"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-model">Modelo Ollama</Label>
              <Input
                id="config-model"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-prompt">Prompt do Sistema</Label>
              <Textarea
                id="config-prompt"
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                className="font-mono text-sm"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="config-temp">Temperatura: {config.temperature}</Label>
                <input
                  id="config-temp"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Controla a criatividade (0 = conservador, 1 = criativo)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="config-tokens">Max Tokens: {config.maxTokens}</Label>
                <input
                  id="config-tokens"
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Limite de tokens na resposta</p>
              </div>
            </div>

            <Button onClick={saveConfig} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
