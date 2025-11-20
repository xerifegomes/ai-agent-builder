import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/conversations - Listar conversas do usuário
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                messages: {
                    orderBy: {
                        timestamp: 'desc'
                    },
                    take: 1,
                    select: {
                        content: true,
                        timestamp: true
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        const formattedConversations = conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            agentId: conv.agentId,
            agentName: conv.agent.name,
            lastMessage: conv.messages[0]?.content.substring(0, 100),
            updatedAt: conv.updatedAt,
            messageCount: conv._count.messages
        }))

        return NextResponse.json(formattedConversations)
    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/conversations - Criar nova conversa
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { agentId, title } = body

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
        }

        // Verify agent belongs to user
        const agent = await prisma.agent.findFirst({
            where: {
                id: agentId,
                userId: session.user.id
            }
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        const conversation = await prisma.conversation.create({
            data: {
                userId: session.user.id,
                agentId,
                title: title || 'Nova Conversa'
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return NextResponse.json({
            id: conversation.id,
            title: conversation.title,
            agentId: conversation.agentId,
            agentName: conversation.agent.name,
            updatedAt: conversation.updatedAt,
            messageCount: 0
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating conversation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
