
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { testCaseSchema } from "@/lib/validations"

// PUT - Atualizar test case
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ agentId: string; testId: string }> }
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

    // Verificar se o test case pertence ao usuário
    const testCase = await prisma.testCase.findFirst({
      where: {
        id: params.testId,
        agentId: params.agentId,
        agent: {
          userId: session.user.id,
        },
      },
    })

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    const updatedTestCase = await prisma.testCase.update({
      where: { id: params.testId },
      data: {
        input,
        expectedOutput,
        keywords: keywords || [],
        description,
      },
    })

    return NextResponse.json(updatedTestCase)
  } catch (error) {
    console.error("Error updating test case:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Deletar test case
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ agentId: string; testId: string }> }
) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verificar se o test case pertence ao usuário
    const testCase = await prisma.testCase.findFirst({
      where: {
        id: params.testId,
        agentId: params.agentId,
        agent: {
          userId: session.user.id,
        },
      },
    })

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    await prisma.testCase.delete({
      where: { id: params.testId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting test case:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
