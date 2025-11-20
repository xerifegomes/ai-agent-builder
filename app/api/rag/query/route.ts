import { NextRequest, NextResponse } from 'next/server'
import { ragQuery } from '@/lib/rag'
import ollama from '@/lib/ollama'

export async function POST(request: NextRequest) {
  try {
    const { query, model = 'llama3.1:8b', topK = 3, agentId } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Busca contexto relevante, usando o agentId se fornecido.
    const { context, augmentedQuery } = await ragQuery(query, model, topK, agentId)

    // Gera resposta com contexto
    const response = await ollama.chat({
      model,
      messages: [
        { role: 'user', content: augmentedQuery },
      ],
      stream: false,
    })

    return NextResponse.json({
      answer: response.message.content,
      context,
      model,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'RAG query failed', details: errorMessage },
      { status: 500 }
    )
  }
}
