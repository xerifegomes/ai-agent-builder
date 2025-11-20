'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, MessageSquare, AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react'

interface MetricsDashboardProps {
    agentId: string
    days?: number
}

export function MetricsDashboard({ agentId, days = 7 }: MetricsDashboardProps) {
    const [stats, setStats] = useState<any>(null)
    const [dailyData, setDailyData] = useState<any[]>([])
    const [topTools, setTopTools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMetrics()
    }, [agentId, days])

    const loadMetrics = async () => {
        try {
            const response = await fetch(`/api/agents/${agentId}/analytics?days=${days}`)
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
                setDailyData(data.dailyData)
                setTopTools(data.topTools)
            }
        } catch (error) {
            console.error('Error loading metrics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Carregando métricas...</div>
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversation?.count || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.message?.count || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.response_time?.avg ? `${Math.round(stats.response_time.avg)}ms` : 'N/A'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.message && stats?.error
                                ? `${Math.round(((stats.message.count - stats.error.count) / stats.message.count) * 100)}%`
                                : '100%'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Uso Diário */}
            <Card>
                <CardHeader>
                    <CardTitle>Uso Diário</CardTitle>
                    <CardDescription>Mensagens e conversas nos últimos {days} dias</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="message" stroke="#8884d8" name="Mensagens" />
                            <Line type="monotone" dataKey="conversation" stroke="#82ca9d" name="Conversas" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Top Tools */}
            {topTools.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tools Mais Usadas</CardTitle>
                        <CardDescription>Top 5 ferramentas por execuções</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topTools}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tool" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total" fill="#8884d8" name="Total" />
                                <Bar dataKey="success" fill="#82ca9d" name="Sucesso" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
