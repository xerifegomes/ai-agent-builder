import { NextRequest, NextResponse } from 'next/server'
import { processTXT, indexDocument } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const agentId = formData.get('agentId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    let doc
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === 'application/pdf') {
      const { processPDF } = await import('@/lib/rag')
      doc = await processPDF(buffer, file.name)
    } else {
      const content = await file.text()
      doc = processTXT(content, file.name)
    }

    // Indexa no vector store
    // Note: indexDocument in lib/rag.ts needs to be updated to accept agentId
    // For now, let's assume we update lib/rag.ts next.
    await indexDocument(doc, 'nomic-embed-text', agentId || undefined)

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        filename: doc.filename,
        chunks: doc.chunks.length,
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to upload document', details: errorMessage },
      { status: 500 }
    )
  }
}
