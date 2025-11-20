import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAgentSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    systemPrompt: z.string().min(20).optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).optional(),
    isPublic: z.boolean().optional(),
})

export async function GET(
    req: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId } = await params

        const agent = await prisma.agent.findUnique({
            where: {
                id: agentId,
                userId: session.user.id,
            },
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        return NextResponse.json(agent)
    } catch (error) {
        console.error('Failed to fetch agent:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId } = await params
        const body = await req.json()
        const validation = updateAgentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        const agent = await prisma.agent.findUnique({
            where: {
                id: agentId,
                userId: session.user.id,
            },
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        const updatedAgent = await prisma.agent.update({
            where: { id: agentId },
            data: validation.data,
        })

        return NextResponse.json(updatedAgent)
    } catch (error) {
        console.error('Failed to update agent:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId } = await params

        const agent = await prisma.agent.findUnique({
            where: {
                id: agentId,
                userId: session.user.id,
            },
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        await prisma.agent.delete({
            where: { id: agentId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete agent:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
