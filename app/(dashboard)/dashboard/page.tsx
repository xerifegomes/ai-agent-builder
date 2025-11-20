"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MessageSquare, Settings, CheckCircle, X } from "lucide-react"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const created = searchParams.get('created')
    if (created === 'true') {
      // Usando requestAnimationFrame para evitar setState síncrono no efeito
      requestAnimationFrame(() => {
        setShowSuccess(true)
        // Remove notificação após 5 segundos
        setTimeout(() => setShowSuccess(false), 5000)
      })
    }
  }, [searchParams])

  // Dados mockados para agentes
  const agents = [
    { id: 1, name: "Bot de Suporte", description: "Responde perguntas gerais e FAQs", status: "Ativo", interactions: 1240 },
    { id: 2, name: "Assistente de Vendas", description: "Qualifica leads e agenda reuniões", status: "Treinando", interactions: 45 },
    { id: 3, name: "Assistente de RH", description: "Auxilia funcionários com políticas internas", status: "Inativo", interactions: 890 },
  ]

  return (
    <div className="space-y-8">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Agente criado com sucesso!</p>
              <p className="text-sm text-green-700">Seu novo agente está pronto para uso.</p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-500">Gerencie seus agentes de IA e monitore seu desempenho.</p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Criar Agente
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                agent.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                agent.status === 'Treinando' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {agent.status}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.interactions}</div>
              <p className="text-xs text-gray-500">Total de interações</p>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Settings className="mr-2 h-4 w-4" /> Configurar
                </Button>
              </Link>
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <MessageSquare className="mr-2 h-4 w-4" /> Conversar
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
        
        <Card className="flex flex-col items-center justify-center border-dashed border-2 shadow-none bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer min-h-[200px]">
          <Link href="/agents/new" className="flex flex-col items-center justify-center w-full h-full p-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Criar Novo Agente</h3>
            <p className="text-sm text-gray-500 text-center mt-1">Comece a construir um assistente de IA personalizado</p>
          </Link>
        </Card>
      </div>
    </div>
  )
}
