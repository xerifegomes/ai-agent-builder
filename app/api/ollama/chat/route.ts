import { NextRequest, NextResponse } from 'next/server'
import ollama from '@/lib/ollama'

export async function POST(request: NextRequest) {
  try {
    const { model, messages, temperature = 0.7 } = await request.json()

    if (!model || !messages) {
      return NextResponse.json(
        { error: 'Model and messages are required' },
        { status: 400 }
      )
    }

    const stream = await ollama.chat({
      model,
      messages,
      stream: true,
      options: { temperature },
    })

    // Create a ReadableStream from the generator
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const part of stream) {
          const content = part.message.content
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Chat error:', errorMessage)
    return NextResponse.json(
      { error: 'Chat failed', details: errorMessage },
      { status: 500 }
    )
  }
}
