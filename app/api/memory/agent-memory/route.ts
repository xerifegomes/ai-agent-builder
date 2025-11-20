import { NextRequest, NextResponse } from 'next/server'
import { addMemory, getMemories, searchMemories, deleteMemory, clearAgentMemories } from '@/lib/db/memory'

// GET: Lista memórias de um agente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const type = searchParams.get('type')
    const query = searchParams.get('query')
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }
    
    let memories
    if (query) {
      memories = await searchMemories(agentId, query)
    } else {
      memories = await getMemories(agentId, type || undefined)
    }
    
    return NextResponse.json({ memories })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST: Adiciona memória
export async function POST(request: NextRequest) {
  try {
    const { agentId, key, value, type, embedding } = await request.json()
    
    if (!agentId || !key || !value || !type) {
      return NextResponse.json(
        { error: 'agentId, key, value, and type are required' },
        { status: 400 }
      )
    }
    
    const memory = await addMemory(agentId, key, value, type, embedding)
    return NextResponse.json({ memory })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add memory', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE: Remove memória ou limpa todas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const agentId = searchParams.get('agentId')
    const clear = searchParams.get('clear')
    
    if (clear === 'true' && agentId) {
      await clearAgentMemories(agentId)
      return NextResponse.json({ success: true, message: 'All memories cleared' })
    }
    
    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }
    
    await deleteMemory(id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete memory', details: errorMessage },
      { status: 500 }
    )
  }
}
