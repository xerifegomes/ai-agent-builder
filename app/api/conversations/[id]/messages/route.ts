import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/conversations/[id]/messages - Buscar mensagens de uma conversa
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const conversationId = params.id

        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId
            },
            orderBy: {
                timestamp: 'asc'
            }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/conversations/[id]/messages - Adicionar mensagem
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const conversationId = params.id
        const body = await request.json()
        const { role, content } = body

        if (!role || !content) {
            return NextResponse.json({ error: 'Role and content are required' }, { status: 400 })
        }

        // Verify conversation belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                role,
                content
            }
        })

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
