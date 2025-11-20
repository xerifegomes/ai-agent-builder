import { prisma } from './prisma'

/**
 * Analytics Tracker - Coleta e armazena métricas do agente
 */
export class AnalyticsTracker {
    private agentId: string
    private buffer: Array<{
        metric: string
        value: number
        metadata?: any
    }> = []
    private flushInterval: NodeJS.Timeout | null = null

    constructor(agentId: string, autoFlush = true) {
        this.agentId = agentId

        if (autoFlush) {
            // Flush automático a cada 30 segundos
            this.flushInterval = setInterval(() => {
                this.flush()
            }, 30000)
        }
    }

    /**
     * Registra uma métrica
     */
    track(metric: string, value: number, metadata?: any) {
        this.buffer.push({ metric, value, metadata })

        // Flush se buffer estiver muito grande
        if (this.buffer.length >= 100) {
            this.flush()
        }
    }

    /**
     * Flush do buffer para o banco de dados
     */
    async flush() {
        if (this.buffer.length === 0) return

        const data = this.buffer.map(item => ({
            agentId: this.agentId,
            metric: item.metric,
            value: item.value,
            metadata: item.metadata || {}
        }))

        this.buffer = []

        try {
            await prisma.analytics.createMany({ data })
        } catch (error) {
            console.error('Error flushing analytics:', error)
            // Re-adicionar ao buffer em caso de erro
            this.buffer.push(...data.map(d => ({
                metric: d.metric,
                value: d.value,
                metadata: d.metadata
            })))
        }
    }

    /**
     * Para o tracker e faz flush final
     */
    async stop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval)
            this.flushInterval = null
        }
        await this.flush()
    }

    /**
     * Helpers para métricas comuns
     */

    trackConversation(conversationId: string) {
        this.track('conversation', 1, { conversationId })
    }

    trackMessage(messageId: string, role: 'user' | 'assistant') {
        this.track('message', 1, { messageId, role })
    }

    trackResponseTime(milliseconds: number, messageId?: string) {
        this.track('response_time', milliseconds, { messageId })
    }

    trackTokens(tokens: number, type: 'input' | 'output', messageId?: string) {
        this.track(`tokens_${type}`, tokens, { messageId })
    }

    trackError(error: string, context?: any) {
        this.track('error', 1, { error, ...context })
    }

    trackToolExecution(toolName: string, success: boolean, duration: number) {
        this.track('tool_execution', success ? 1 : 0, { toolName, duration })
    }

    trackRAGQuery(documentsRetrieved: number, duration: number) {
        this.track('rag_query', documentsRetrieved, { duration })
    }
}

/**
 * Analytics Aggregator - Agrega e analisa métricas
 */
export class AnalyticsAggregator {
    /**
     * Busca métricas agregadas por período
     */
    static async getMetrics(
        agentId: string,
        startDate: Date,
        endDate: Date,
        metrics?: string[]
    ) {
        const where: any = {
            agentId,
            timestamp: {
                gte: startDate,
                lte: endDate
            }
        }

        if (metrics && metrics.length > 0) {
            where.metric = { in: metrics }
        }

        const data = await prisma.analytics.findMany({
            where,
            orderBy: { timestamp: 'asc' }
        })

        return data
    }

    /**
     * Calcula estatísticas agregadas
     */
    static async getStats(agentId: string, days: number = 7) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const data = await this.getMetrics(agentId, startDate, new Date())

        // Agrupar por métrica
        const byMetric: Record<string, number[]> = {}
        data.forEach(item => {
            if (!byMetric[item.metric]) {
                byMetric[item.metric] = []
            }
            byMetric[item.metric].push(item.value)
        })

        // Calcular estatísticas
        const stats: Record<string, any> = {}

        Object.entries(byMetric).forEach(([metric, values]) => {
            stats[metric] = {
                count: values.length,
                sum: values.reduce((a, b) => a + b, 0),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                p50: this.percentile(values, 0.5),
                p95: this.percentile(values, 0.95),
                p99: this.percentile(values, 0.99)
            }
        })

        return stats
    }

    /**
     * Calcula percentil
     */
    private static percentile(values: number[], p: number): number {
        const sorted = [...values].sort((a, b) => a - b)
        const index = Math.ceil(sorted.length * p) - 1
        return sorted[Math.max(0, index)]
    }

    /**
     * Agrupa métricas por dia
     */
    static async getDailyMetrics(agentId: string, days: number = 7) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const data = await this.getMetrics(agentId, startDate, new Date())

        // Agrupar por dia e métrica
        const dailyData: Record<string, Record<string, number>> = {}

        data.forEach(item => {
            const date = new Date(item.timestamp).toISOString().split('T')[0]

            if (!dailyData[date]) {
                dailyData[date] = {}
            }

            if (!dailyData[date][item.metric]) {
                dailyData[date][item.metric] = 0
            }

            dailyData[date][item.metric] += item.value
        })

        // Converter para array
        return Object.entries(dailyData).map(([date, metrics]) => ({
            date,
            ...metrics
        }))
    }

    /**
     * Calcula taxa de sucesso
     */
    static async getSuccessRate(agentId: string, days: number = 7) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const data = await this.getMetrics(agentId, startDate, new Date(), ['message', 'error'])

        const messages = data.filter(d => d.metric === 'message').length
        const errors = data.filter(d => d.metric === 'error').length

        return {
            total: messages,
            errors,
            successRate: messages > 0 ? ((messages - errors) / messages) * 100 : 100
        }
    }

    /**
     * Top tools mais usados
     */
    static async getTopTools(agentId: string, days: number = 7, limit: number = 5) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const data = await this.getMetrics(agentId, startDate, new Date(), ['tool_execution'])

        // Contar por tool
        const toolCounts: Record<string, { total: number; success: number }> = {}

        data.forEach(item => {
            const toolName = (item.metadata as any)?.toolName
            if (!toolName) return

            if (!toolCounts[toolName]) {
                toolCounts[toolName] = { total: 0, success: 0 }
            }

            toolCounts[toolName].total++
            if (item.value === 1) {
                toolCounts[toolName].success++
            }
        })

        // Converter para array e ordenar
        return Object.entries(toolCounts)
            .map(([tool, counts]) => ({
                tool,
                total: counts.total,
                success: counts.success,
                successRate: (counts.success / counts.total) * 100
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit)
    }
}

// Singleton para tracker global
const trackers = new Map<string, AnalyticsTracker>()

export function getTracker(agentId: string): AnalyticsTracker {
    if (!trackers.has(agentId)) {
        trackers.set(agentId, new AnalyticsTracker(agentId))
    }
    return trackers.get(agentId)!
}

export function stopAllTrackers() {
    trackers.forEach(tracker => tracker.stop())
    trackers.clear()
}
