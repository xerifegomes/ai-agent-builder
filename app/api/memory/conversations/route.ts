import { NextRequest, NextResponse } from 'next/server'
import { createConversation, listConversations, deleteConversation } from '@/lib/db/memory'

// GET: Lista conversas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    
    const conversations = await listConversations(agentId || undefined)
    return NextResponse.json({ conversations })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST: Cria nova conversa
export async function POST(request: NextRequest) {
  try {
    const { agentId, title, metadata } = await request.json()
    
    if (!agentId || !title) {
      return NextResponse.json(
        { error: 'agentId and title are required' },
        { status: 400 }
      )
    }
    
    const conversation = await createConversation(agentId, title, metadata)
    return NextResponse.json({ conversation })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create conversation', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE: Remove conversa
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }
    
    await deleteConversation(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: errorMessage },
      { status: 500 }
    )
  }
}
