import { NextResponse } from 'next/server'
import { listOllamaModels } from '@/lib/ollama'

export async function GET() {
  try {
    const models = await listOllamaModels()
    return NextResponse.json({ models })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch models. Make sure Ollama is running on http://localhost:11434' },
      { status: 500 }
    )
  }
}
