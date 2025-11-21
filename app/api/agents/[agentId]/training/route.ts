import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

// GET - List training examples for an agent
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

        // Fetch training examples from Memory table
        const trainingExamples = await prisma.memory.findMany({
            where: {
                agentId,
                metadata: {
                    path: ['type'],
                    equals: 'training'
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(trainingExamples)
    } catch (error) {
        console.error('Error fetching training examples:', error)
        return NextResponse.json(
            { error: 'Failed to fetch training examples' },
            { status: 500 }
        )
    }
}

// POST - Add new training example
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { agentId } = await params
        const body = await request.json()
        const { input, output, notes } = body

        if (!input || !output) {
            return NextResponse.json(
                { error: 'Input and output are required' },
                { status: 400 }
            )
        }

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

        // Create training example
        const trainingExample = await prisma.memory.create({
            data: {
                agentId,
                content: `Input: ${input}\nOutput: ${output}`,
                metadata: {
                    type: 'training',
                    input,
                    output,
                    notes: notes || '',
                    createdBy: session.user.email
                }
            }
        })

        return NextResponse.json(trainingExample, { status: 201 })
    } catch (error) {
        console.error('Error creating training example:', error)
        return NextResponse.json(
            { error: 'Failed to create training example' },
            { status: 500 }
        )
    }
}

// DELETE - Remove training example
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const exampleId = searchParams.get('id')

        if (!exampleId) {
            return NextResponse.json(
                { error: 'Example ID is required' },
                { status: 400 }
            )
        }

        // Verify ownership through agent
        const example = await prisma.memory.findFirst({
            where: {
                id: exampleId,
                agent: {
                    userId: session.user.id
                }
            }
        })

        if (!example) {
            return NextResponse.json({ error: 'Example not found' }, { status: 404 })
        }

        await prisma.memory.delete({
            where: { id: exampleId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting training example:', error)
        return NextResponse.json(
            { error: 'Failed to delete training example' },
            { status: 500 }
        )
    }
}
