import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import ollama from "ollama"

// const ollama = new Ollama({ host: "http://localhost:11434" }) // Removed instantiation

// POST - Executar test case
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string; testId: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Buscar test case e agent
    const testCase = await prisma.testCase.findFirst({
      where: {
        id: params.testId,
        agentId: params.agentId,
        agent: {
          userId: session.user.id,
        },
      },
      include: {
        agent: true,
      },
    })

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    const startTime = Date.now()

    // Executar o teste com Ollama
    const response = await ollama.chat({
      model: testCase.agent.model,
      messages: [
        {
          role: "system",
          content: testCase.agent.systemPrompt || "Você é um assistente útil.",
        },
        {
          role: "user",
          content: testCase.input,
        },
      ],
      options: {
        temperature: testCase.agent.temperature,
        top_p: testCase.agent.topP,
        top_k: testCase.agent.topK,
      },
    })

    const duration = Date.now() - startTime
    const output = response.message.content

    // Verificar se passou
    const keywords = testCase.keywords
    let passed = true

    if (testCase.expectedOutput) {
      passed = output.toLowerCase().includes(testCase.expectedOutput.toLowerCase())
    } else if (keywords.length > 0) {
      passed = keywords.some(keyword =>
        output.toLowerCase().includes(keyword.toLowerCase())
      )
    }

    // Salvar execução
    const execution = await prisma.testExecution.create({
      data: {
        testCaseId: params.testId,
        output,
        passed,
        duration,
      },
    })

    return NextResponse.json({
      ...execution,
      testCase: {
        ...testCase,
        keywords,
      },
    })
  } catch (error) {
    console.error("Error executing test case:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
