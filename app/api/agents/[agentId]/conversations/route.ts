import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

// GET - Fetch conversation history for an agent
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId } = await params
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        // Verify agent ownership
        const agent = await prisma.agent.findFirst({
            where: {
                id: agentId,
                userId: session.user.id
            }
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Fetch conversations from Memory table (WhatsApp conversations)
        const conversations = await prisma.memory.findMany({
            where: {
                agentId,
                metadata: {
                    not: {}
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        // Also fetch from Conversation table (web chat)
        const webConversations = await prisma.conversation.findMany({
            where: {
                agentId,
                userId: session.user.id
            },
            include: {
                messages: {
                    orderBy: {
                        id: 'asc'
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit
        })

        return NextResponse.json({
            whatsapp: conversations,
            web: webConversations
        })
    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}
