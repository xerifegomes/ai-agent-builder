import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAgentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    model: z.string().min(1, "Model is required"),
    systemPrompt: z.string().min(20, "System prompt must be at least 20 characters"),
    webSearch: z.boolean().default(false),
    codeInterpreter: z.boolean().default(false),
})

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = createAgentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        const { name, description, model, systemPrompt } = validation.data

        const agent = await prisma.agent.create({
            data: {
                userId: session.user.id,
                name,
                description,
                model,
                systemPrompt,
                // Future capabilities can be stored in metadata or separate fields if schema allows
                // For now schema has specific fields, let's check schema again.
                // Schema has: name, description, model, systemPrompt, temperature, topP, topK, maxTokens, isPublic
                // webSearch and codeInterpreter are not in schema yet, maybe store in metadata or ignore for now.
            },
        })

        return NextResponse.json(agent, { status: 201 })
    } catch (error) {
        console.error('Failed to create agent:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const agents = await prisma.agent.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(agents)
    } catch (error) {
        console.error('Failed to fetch agents:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
