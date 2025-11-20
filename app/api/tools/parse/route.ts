import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FunctionCallParser } from '@/lib/tools/tool-system'
import { toolExecutor } from '@/lib/tools/tool-system'

// POST /api/tools/parse - Parse function call da resposta do LLM
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { text, autoExecute = false, conversationId, messageId } = body

        if (!text) {
            return NextResponse.json({ error: 'text is required' }, { status: 400 })
        }

        // Verificar se tem function call
        const hasFunctionCall = FunctionCallParser.hasFunctionCall(text)

        if (!hasFunctionCall) {
            return NextResponse.json({
                hasFunctionCall: false,
                cleanText: text
            })
        }

        // Extrair function call
        const functionCall = FunctionCallParser.parse(text)

        if (!functionCall) {
            return NextResponse.json({
                hasFunctionCall: false,
                cleanText: text,
                error: 'Failed to parse function call'
            })
        }

        // Remover function call do texto
        const cleanText = FunctionCallParser.removeFromText(text)

        // Auto-executar se solicitado
        let execution = null
        if (autoExecute) {
            try {
                execution = await toolExecutor.execute(
                    functionCall.tool,
                    functionCall.parameters,
                    { conversationId, messageId }
                )
            } catch (error: any) {
                console.error('Error auto-executing tool:', error)
            }
        }

        return NextResponse.json({
            hasFunctionCall: true,
            functionCall,
            cleanText,
            execution
        })
    } catch (error) {
        console.error('Error parsing function call:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
