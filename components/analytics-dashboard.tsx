"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, MessageSquare, AlertCircle, Clock, TrendingUp } from "lucide-react"

interface AnalyticsDashboardProps {
  agentId: string
}

interface DashboardData {
  stats: {
    totalConversations: number
    totalMessages: number
    totalErrors: number
    avgResponseTime: number
    successRate: number
  }
  dailyData: Array<{
    date: string
    conversations: number
    messages: number
    errors: number
    avgResponseTime: number
  }>
  topErrors: Array<{
    message: string
    count: number
  }>
}

export function AnalyticsDashboard({ agentId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, days])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/analytics?days=${days}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return <div>Carregando analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">Últimos {days} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Total enviadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Resposta do agente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">{data.stats.totalErrors} erros</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Atividade Diária */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Diária</CardTitle>
          <CardDescription>Conversas e mensagens por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.dailyData.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("pt-BR", { 
                    day: "2-digit", 
                    month: "short" 
                  })}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 bg-blue-500 rounded" 
                      style={{ width: `${(day.conversations / Math.max(...data.dailyData.map(d => d.conversations), 1)) * 100}%` }}
                    />
                    <span className="text-sm">{day.conversations} conversas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 bg-green-500 rounded" 
                      style={{ width: `${(day.messages / Math.max(...data.dailyData.map(d => d.messages), 1)) * 100}%` }}
                    />
                    <span className="text-sm">{day.messages} mensagens</span>
                  </div>
                </div>
                {day.errors > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {day.errors} erro{day.errors > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Erros */}
      {data.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Principais Erros
            </CardTitle>
            <CardDescription>Erros mais frequentes neste período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{error.message}</p>
                  </div>
                  <Badge variant="outline">{error.count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seletor de Período */}
      <div className="flex justify-center gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              days === d
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>
    </div>
  )
}
