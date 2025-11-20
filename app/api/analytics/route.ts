import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST - Registrar métrica
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { agentId, metric, value, metadata } = body

    // Verificar se o agente pertence ao usuário
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: session.user.id,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const analytic = await prisma.analytics.create({
      data: {
        agentId,
        metric,
        value,
        metadata,
      },
    })

    return NextResponse.json(analytic)
  } catch (error) {
    console.error("Error creating analytic:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Obter analytics
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")
    const metric = searchParams.get("metric")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: {
      agentId?: string
      metric?: string
      timestamp?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (agentId) {
      // Verificar se o agente pertence ao usuário
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId: session.user.id,
        },
      })

      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      where.agentId = agentId
    }

    if (metric) {
      where.metric = metric
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 1000,
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
