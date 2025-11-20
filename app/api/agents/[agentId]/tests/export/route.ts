import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Exportar resultados de testes
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

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "json"

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
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (format === "csv") {
      // Gerar CSV
      const csv = [
        "Test ID,Input,Expected Output,Keywords,Last Execution,Passed,Duration (ms),Output",
        ...testCases.map((tc: {
          id: string;
          input: string;
          expectedOutput: string | null;
          keywords: string[];
          executions: Array<{
            executedAt: Date;
            passed: boolean;
            duration: number;
            output: string;
          }>;
        }) => {
          const lastExec = tc.executions[0]
          const keywords = tc.keywords
          return [
            tc.id,
            `"${tc.input.replace(/"/g, '""')}"`,
            `"${(tc.expectedOutput || "").replace(/"/g, '""')}"`,
            `"${keywords.join(", ")}"`,
            lastExec ? lastExec.executedAt.toISOString() : "",
            lastExec ? lastExec.passed : "",
            lastExec ? lastExec.duration : "",
            lastExec ? `"${lastExec.output.replace(/"/g, '""')}"` : "",
          ].join(",")
        }),
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="test-results-${params.agentId}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json(testCases, {
      headers: {
        "Content-Disposition": `attachment; filename="test-results-${params.agentId}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting test results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
