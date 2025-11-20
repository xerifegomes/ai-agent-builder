import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { toolRegistry, toolExecutor } from '@/lib/tools/tool-system'
import { builtInTools } from '@/lib/tools/built-in-tools'

// Registrar tools built-in na inicialização
builtInTools.forEach(tool => toolRegistry.register(tool))

// GET /api/tools - Listar tools disponíveis
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const tools = category
            ? toolRegistry.listByCategory(category)
            : toolRegistry.list()

        return NextResponse.json({
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                category: tool.category,
                requiresConfirmation: tool.requiresConfirmation,
                parameters: Object.keys(tool.parameters.shape)
            })),
            systemPrompt: toolRegistry.toSystemPrompt()
        })
    } catch (error) {
        console.error('Error listing tools:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/tools/execute - Executar uma tool
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { toolName, parameters, conversationId, messageId } = body

        if (!toolName || !parameters) {
            return NextResponse.json(
                { error: 'toolName and parameters are required' },
                { status: 400 }
            )
        }

        // Executar tool
        const execution = await toolExecutor.execute(toolName, parameters, {
            conversationId,
            messageId
        })

        return NextResponse.json(execution)
    } catch (error: any) {
        console.error('Error executing tool:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
