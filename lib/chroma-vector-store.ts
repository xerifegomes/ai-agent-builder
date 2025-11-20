import { ChromaClient, Collection } from "chromadb"
import { prisma } from "./prisma"

interface VectorDocument {
  id: string
  text: string
  embedding?: number[]
  metadata: Record<string, string | number | boolean>
}

class ChromaVectorStore {
  private client: ChromaClient
  private collection: Collection | null = null
  private collectionName: string

  constructor(collectionName: string = "default") {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    })
    this.collectionName = collectionName
  }

  // Inicializa a coleção
  async initialize() {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
      })
    }
    return this.collection
  }

  // Adiciona documento com embedding
  async addDocument(doc: VectorDocument, agentId?: string) {
    await this.initialize()
    
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    // Adicionar ao ChromaDB
    await this.collection.add({
      ids: [doc.id],
      documents: [doc.text],
      embeddings: doc.embedding ? [doc.embedding] : undefined,
      metadatas: [doc.metadata as Record<string, string | number | boolean>],
    })

    // Persistir no banco de dados se agentId fornecido
    if (agentId && doc.embedding) {
      await prisma.document.create({
        data: {
          id: doc.id,
          agentId,
          content: doc.text,
          metadata: doc.metadata,
          embeddingJson: JSON.stringify(doc.embedding),
          collectionName: this.collectionName,
        },
      })
    }
  }

  // Busca por similaridade
  async search(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: Record<string, string | number | boolean>
  ): Promise<VectorDocument[]> {
    await this.initialize()
    
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: filter,
    })

    if (!results.ids[0] || !results.documents[0] || !results.metadatas[0]) {
      return []
    }

    return results.ids[0].map((id, i) => ({
      id,
      text: results.documents[0]?.[i] || "",
      embedding: results.embeddings?.[0]?.[i] as number[] | undefined,
      metadata: (results.metadatas[0]?.[i] as Record<string, string | number | boolean>) || {},
    }))
  }

  // Lista todos os documentos
  async getAllDocuments(): Promise<VectorDocument[]> {
    await this.initialize()
    
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    const results = await this.collection.get()

    if (!results.ids) {
      return []
    }

    return results.ids.map((id, i) => ({
      id,
      text: results.documents?.[i] || "",
      embedding: results.embeddings?.[i] as number[] | undefined,
      metadata: (results.metadatas?.[i] as Record<string, string | number | boolean>) || {},
    }))
  }

  // Remove documento
  async removeDocument(id: string, agentId?: string) {
    await this.initialize()
    
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    await this.collection.delete({
      ids: [id],
    })

    // Remover do banco de dados se agentId fornecido
    if (agentId) {
      await prisma.document.deleteMany({
        where: {
          id,
          agentId,
        },
      })
    }
  }

  // Limpa todos os documentos
  async clear(agentId?: string) {
    await this.initialize()
    
    if (!this.collection) {
      throw new Error("Collection not initialized")
    }

    // Limpar ChromaDB
    await this.client.deleteCollection({ name: this.collectionName })
    this.collection = null
    await this.initialize()

    // Limpar banco de dados se agentId fornecido
    if (agentId) {
      await prisma.document.deleteMany({
        where: {
          agentId,
          collectionName: this.collectionName,
        },
      })
    }
  }

  // Restaura documentos do banco de dados para ChromaDB
  async restoreFromDatabase(agentId: string) {
    const documents = await prisma.document.findMany({
      where: {
        agentId,
        collectionName: this.collectionName,
      },
    })

    for (const doc of documents) {
      const embedding = JSON.parse(doc.embeddingJson) as number[]
      await this.addDocument({
        id: doc.id,
        text: doc.content,
        embedding,
        metadata: doc.metadata as Record<string, string | number | boolean>,
      })
    }

    return documents.length
  }
}

// Factory function para criar store por agente
export function createVectorStore(agentId: string, collectionName?: string) {
  return new ChromaVectorStore(collectionName || `agent_${agentId}`)
}

export type { VectorDocument }
export { ChromaVectorStore }
