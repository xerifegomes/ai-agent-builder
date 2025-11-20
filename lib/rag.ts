import * as pdfParse from 'pdf-parse'
import { generateEmbeddings } from './ollama'
import { createVectorStore } from './chroma-vector-store'

// Define um ID de coleção padrão para documentos que não pertencem a um agente específico.
const GLOBAL_AGENT_ID = '_global'

export interface ProcessedDocument {
  id: string
  filename: string
  content: string
  chunks: string[]
  metadata: {
    pageCount?: number
    uploadedAt: string
  }
}

// Divide texto em chunks
export function chunkText(text: string, chunkSize: number = 500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }

  return chunks
}

// Processa PDF
export async function processPDF(buffer: Buffer, filename: string): Promise<ProcessedDocument> {
  // @ts-expect-error - pdf-parse has module resolution issues
  const parse = pdfParse.default || pdfParse
  const data = await parse(buffer)
  const chunks = chunkText(data.text)

  return {
    id: Date.now().toString(),
    filename,
    content: data.text,
    chunks,
    metadata: {
      pageCount: data.numpages,
      uploadedAt: new Date().toISOString(),
    },
  }
}

// Processa TXT
export function processTXT(content: string, filename: string): ProcessedDocument {
  const chunks = chunkText(content)

  return {
    id: Date.now().toString(),
    filename,
    content,
    chunks,
    metadata: {
      uploadedAt: new Date().toISOString(),
    },
  }
}

// Indexa documento no vector store, usando um ID global se nenhum agente for especificado.
export async function indexDocument(doc: ProcessedDocument, embeddingModel: string = 'nomic-embed-text', agentId: string = GLOBAL_AGENT_ID) {
  const store = createVectorStore(agentId)
  
  for (let i = 0; i < doc.chunks.length; i++) {
    const chunk = doc.chunks[i]
    const embedding = await generateEmbeddings(embeddingModel, chunk)

    await store.addDocument({
      id: `${doc.id}_chunk_${i}`,
      text: chunk,
      embedding,
      metadata: {
        documentId: doc.id,
        filename: doc.filename,
        chunkIndex: i,
        ...doc.metadata,
      },
    }, agentId)
  }
}

// RAG: Busca contexto relevante para um agente específico ou no armazenamento global.
export async function retrieveContext(
  query: string,
  topK: number = 3,
  embeddingModel: string = 'nomic-embed-text',
  agentId: string = GLOBAL_AGENT_ID
) {
  const store = createVectorStore(agentId)
  const queryEmbedding = await generateEmbeddings(embeddingModel, query)
  const results = await store.search(queryEmbedding, topK)

  return results.map(doc => doc.text).join('\n\n')
}

// RAG: Gera resposta com contexto, agora ciente do agente.
export async function ragQuery(query: string, model: string, topK: number = 3, agentId: string = GLOBAL_AGENT_ID) {
  const context = await retrieveContext(query, topK, undefined, agentId)

  return {
    context,
    augmentedQuery: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer based on the context above:`,
  }
}
