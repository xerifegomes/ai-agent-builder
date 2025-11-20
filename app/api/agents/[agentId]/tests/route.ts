import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

import { testCaseSchema } from "@/lib/validations"

// GET - Listar todos os test cases de um agente
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

    const testCases = await prisma.testCase.findMany({
      where: {
        agentId: params.agentId,
        agent: {
          userId: session.user.id,
        },
      },
      include: {
        executions: {
          orderBy: { executedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Parse keywordsJson - REMOVED: Native array support
    // const testCasesWithKeywords = testCases.map((tc: { ... }) => ({ ...tc, keywords: JSON.parse(tc.keywordsJson) as string[] }))

    return NextResponse.json(testCases)
  } catch (error) {
    console.error("Error fetching test cases:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Criar novo test case
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const body = await req.json()
    const validation = testCaseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 })
    }

    const { input, expectedOutput, keywords, description } = validation.data

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

    const testCase = await prisma.testCase.create({
      data: {
        agentId: params.agentId,
        input,
        expectedOutput,
        keywords: keywords || [],
        description,
      },
    })

    return NextResponse.json(testCase)
  } catch (error) {
    console.error("Error creating test case:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
