import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/conversations/[id] - Atualizar conversa
export async function PATCH(
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
        const { title } = body

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

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                title: title || conversation.title,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating conversation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/conversations/[id] - Deletar conversa
export async function DELETE(
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

        // Delete conversation (messages will be cascade deleted)
        await prisma.conversation.delete({
            where: { id: conversationId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting conversation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
