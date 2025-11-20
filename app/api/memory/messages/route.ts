import { NextRequest, NextResponse } from 'next/server'
import { addMessage, getMessages } from '@/lib/db/memory'

// GET: Lista mensagens de uma conversa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }
    
    const messages = await getMessages(conversationId)
    return NextResponse.json({ messages })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST: Adiciona mensagem a uma conversa
export async function POST(request: NextRequest) {
  try {
    const { conversationId, role, content, metadata } = await request.json()
    
    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      )
    }
    
    const message = await addMessage(conversationId, role, content, metadata)
    return NextResponse.json({ message })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add message', details: errorMessage },
      { status: 500 }
    )
  }
}
