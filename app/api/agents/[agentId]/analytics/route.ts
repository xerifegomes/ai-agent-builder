import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Dashboard de analytics agregado
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verificar se o agente pertence ao usuário
    const agent = await prisma.agent.findFirst({
      where: {
        id: params.agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "7")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Buscar todas as métricas
    const analytics = await prisma.analytics.findMany({
      where: {
        agentId: params.agentId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: "asc" },
    })

    // Agregar dados
    const conversations = analytics.filter(a => a.metric === "conversation")
    const messages = analytics.filter(a => a.metric === "message")
    const responseTimes = analytics.filter(a => a.metric === "response_time")
    const errors = analytics.filter(a => a.metric === "error")

    // Estatísticas gerais
    const stats = {
      totalConversations: conversations.length,
      totalMessages: messages.length,
      totalErrors: errors.length,
      avgResponseTime: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, a) => sum + a.value, 0) / responseTimes.length)
        : 0,
      successRate: messages.length > 0
        ? Math.round(((messages.length - errors.length) / messages.length) * 100)
        : 100,
    }

    // Dados por dia
    const dailyData = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayAnalytics = analytics.filter(
        a => a.timestamp >= date && a.timestamp < nextDate
      )

      dailyData.push({
        date: date.toISOString().split("T")[0],
        conversations: dayAnalytics.filter(a => a.metric === "conversation").length,
        messages: dayAnalytics.filter(a => a.metric === "message").length,
        errors: dayAnalytics.filter(a => a.metric === "error").length,
        avgResponseTime: dayAnalytics.filter(a => a.metric === "response_time").length > 0
          ? Math.round(
            dayAnalytics
              .filter(a => a.metric === "response_time")
              .reduce((sum, a) => sum + a.value, 0) /
            dayAnalytics.filter(a => a.metric === "response_time").length
          )
          : 0,
      })
    }

    // Top erros
    const errorMessages: { message: string; count: number }[] = []
    errors.forEach(error => {
      const errorMsg = (error.metadata as { error?: string })?.error || "Unknown error"
      const existing = errorMessages.find(e => e.message === errorMsg)
      if (existing) {
        existing.count++
      } else {
        errorMessages.push({ message: errorMsg, count: 1 })
      }
    })
    errorMessages.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      stats,
      dailyData,
      topErrors: errorMessages.slice(0, 5),
    })
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
