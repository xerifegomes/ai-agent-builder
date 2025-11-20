import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmbeddings } from '@/lib/ollama'
import { createVectorStore } from '@/lib/chroma-vector-store'
import {
    semanticChunk,
    hybridSearch,
    rerankDocuments,
    generateCitations,
    type Chunk,
    type SearchResult
} from '@/lib/rag-advanced'

// POST /api/rag/query-advanced - Query RAG com citações
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            query,
            agentId,
            topK = 5,
            semanticWeight = 0.7,
            citationFormat = 'simple',
            rerankOptions = {}
        } = body

        if (!query || !agentId) {
            return NextResponse.json(
                { error: 'Query and agentId are required' },
                { status: 400 }
            )
        }

        // Verificar se o agente pertence ao usuário
        const agent = await prisma.agent.findFirst({
            where: {
                id: agentId,
                userId: session.user.id
            }
        })

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Buscar documentos do agente
        const documents = await prisma.document.findMany({
            where: {
                agentId
            }
        })

        if (documents.length === 0) {
            return NextResponse.json({
                context: '',
                citations: [],
                chunks: [],
                message: 'No documents found for this agent'
            })
        }

        // Criar chunks semânticos de todos os documentos
        const allChunks: Chunk[] = []

        for (const doc of documents) {
            const chunks = semanticChunk(
                doc.content,
                doc.id,
                (doc.metadata as any)?.filename || 'Unknown',
                {
                    maxChunkSize: 512,
                    minChunkSize: 100,
                    overlapSize: 50,
                    splitBy: 'paragraph'
                }
            )

            // Adicionar metadata adicional
            chunks.forEach(chunk => {
                chunk.metadata = {
                    ...chunk.metadata,
                    ...(doc.metadata as any),
                    uploadedAt: doc.createdAt.toISOString()
                }
            })

            allChunks.push(...chunks)
        }

        // Hybrid Search
        const searchResults = await hybridSearch(
            query,
            allChunks,
            topK * 2, // Buscar mais para re-ranking
            semanticWeight
        )

        // Re-ranking
        const rerankedResults = rerankDocuments(
            searchResults,
            query,
            rerankOptions
        ).slice(0, topK)

        // Gerar citações
        const citations = generateCitations(rerankedResults, citationFormat)

        // Montar contexto
        const context = rerankedResults
            .map((result, i) => `[${i + 1}] ${result.chunk.text}`)
            .join('\n\n')

        // Retornar resultados
        return NextResponse.json({
            context,
            citations,
            chunks: rerankedResults.map(r => ({
                ...r.chunk,
                score: r.score,
                semanticScore: r.semanticScore,
                keywordScore: r.keywordScore
            })),
            stats: {
                totalDocuments: documents.length,
                totalChunks: allChunks.length,
                searchedChunks: searchResults.length,
                returnedChunks: rerankedResults.length
            }
        })
    } catch (error) {
        console.error('Error in advanced RAG query:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/rag/query-advanced - Get document content for viewer
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('documentId')
        const agentId = searchParams.get('agentId')

        if (!documentId || !agentId) {
            return NextResponse.json(
                { error: 'documentId and agentId are required' },
                { status: 400 }
            )
        }

        // Verificar ownership
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                agentId,
                agent: {
                    userId: session.user.id
                }
            }
        })

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        return NextResponse.json({
            id: document.id,
            content: document.content,
            metadata: document.metadata,
            createdAt: document.createdAt
        })
    } catch (error) {
        console.error('Error fetching document:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
