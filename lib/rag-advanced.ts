import { generateEmbeddings } from './ollama'

export interface Chunk {
    id: string
    text: string
    startIndex: number
    endIndex: number
    metadata: {
        documentId: string
        filename: string
        chunkIndex: number
        pageNumber?: number
        section?: string
        [key: string]: any
    }
}

export interface SemanticChunkOptions {
    maxChunkSize?: number
    minChunkSize?: number
    overlapSize?: number
    splitBy?: 'sentence' | 'paragraph' | 'section'
}

/**
 * Semantic Chunking - Divide texto de forma inteligente
 * Prioriza divisões naturais (parágrafos, seções) ao invés de tamanho fixo
 */
export function semanticChunk(
    text: string,
    documentId: string,
    filename: string,
    options: SemanticChunkOptions = {}
): Chunk[] {
    const {
        maxChunkSize = 512,
        minChunkSize = 100,
        overlapSize = 50,
        splitBy = 'paragraph'
    } = options

    const chunks: Chunk[] = []
    let chunkIndex = 0

    if (splitBy === 'paragraph') {
        // Dividir por parágrafos (dupla quebra de linha)
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

        let currentChunk = ''
        let startIndex = 0

        for (const paragraph of paragraphs) {
            const trimmed = paragraph.trim()

            // Se adicionar este parágrafo exceder o tamanho máximo
            if (currentChunk.length + trimmed.length > maxChunkSize && currentChunk.length >= minChunkSize) {
                // Salvar chunk atual
                chunks.push({
                    id: `${documentId}_chunk_${chunkIndex}`,
                    text: currentChunk.trim(),
                    startIndex,
                    endIndex: startIndex + currentChunk.length,
                    metadata: {
                        documentId,
                        filename,
                        chunkIndex,
                    }
                })

                chunkIndex++

                // Começar novo chunk com overlap
                const words = currentChunk.split(/\s+/)
                const overlapWords = words.slice(-Math.floor(overlapSize / 5)) // ~5 chars por palavra
                currentChunk = overlapWords.join(' ') + ' ' + trimmed
                startIndex = startIndex + currentChunk.length - (overlapWords.join(' ').length + trimmed.length)
            } else {
                // Adicionar ao chunk atual
                currentChunk += (currentChunk ? '\n\n' : '') + trimmed
            }
        }

        // Adicionar último chunk
        if (currentChunk.trim().length >= minChunkSize) {
            chunks.push({
                id: `${documentId}_chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                startIndex,
                endIndex: startIndex + currentChunk.length,
                metadata: {
                    documentId,
                    filename,
                    chunkIndex,
                }
            })
        }
    } else if (splitBy === 'sentence') {
        // Dividir por sentenças
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

        let currentChunk = ''
        let startIndex = 0

        for (const sentence of sentences) {
            const trimmed = sentence.trim()

            if (currentChunk.length + trimmed.length > maxChunkSize && currentChunk.length >= minChunkSize) {
                chunks.push({
                    id: `${documentId}_chunk_${chunkIndex}`,
                    text: currentChunk.trim(),
                    startIndex,
                    endIndex: startIndex + currentChunk.length,
                    metadata: {
                        documentId,
                        filename,
                        chunkIndex,
                    }
                })

                chunkIndex++
                currentChunk = trimmed
                startIndex = startIndex + currentChunk.length
            } else {
                currentChunk += (currentChunk ? ' ' : '') + trimmed
            }
        }

        if (currentChunk.trim().length >= minChunkSize) {
            chunks.push({
                id: `${documentId}_chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                startIndex,
                endIndex: startIndex + currentChunk.length,
                metadata: {
                    documentId,
                    filename,
                    chunkIndex,
                }
            })
        }
    }

    return chunks
}

/**
 * Hybrid Search - Combina busca semântica (embeddings) com keyword search (BM25)
 */
export interface SearchResult {
    chunk: Chunk
    score: number
    semanticScore: number
    keywordScore: number
    embedding?: number[]
}

export async function hybridSearch(
    query: string,
    chunks: Chunk[],
    topK: number = 5,
    semanticWeight: number = 0.7
): Promise<SearchResult[]> {
    const keywordWeight = 1 - semanticWeight

    // 1. Semantic Search (via embeddings)
    const queryEmbedding = await generateEmbeddings('nomic-embed-text', query)

    const semanticScores = await Promise.all(
        chunks.map(async (chunk) => {
            // Gerar embedding do chunk se não existir
            const chunkEmbedding = await generateEmbeddings('nomic-embed-text', chunk.text)
            const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)

            return {
                chunk,
                semanticScore: similarity,
                embedding: chunkEmbedding
            }
        })
    )

    // 2. Keyword Search (BM25 simplificado)
    const keywordScores = bm25Search(query, chunks)

    // 3. Combinar scores
    const combinedResults: SearchResult[] = semanticScores.map((semantic, i) => ({
        chunk: semantic.chunk,
        semanticScore: semantic.semanticScore,
        keywordScore: keywordScores[i],
        score: (semantic.semanticScore * semanticWeight) + (keywordScores[i] * keywordWeight),
        embedding: semantic.embedding
    }))

    // 4. Ordenar e retornar top K
    return combinedResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
}

/**
 * BM25 Search - Algoritmo de ranking baseado em keywords
 */
function bm25Search(query: string, chunks: Chunk[]): number[] {
    const queryTerms = tokenize(query.toLowerCase())
    const k1 = 1.5 // Parâmetro de saturação de frequência
    const b = 0.75 // Parâmetro de normalização de comprimento

    // Calcular IDF (Inverse Document Frequency)
    const idf: Record<string, number> = {}
    const docCount = chunks.length

    queryTerms.forEach(term => {
        const docsWithTerm = chunks.filter(chunk =>
            tokenize(chunk.text.toLowerCase()).includes(term)
        ).length

        idf[term] = Math.log((docCount - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1)
    })

    // Calcular comprimento médio dos documentos
    const avgDocLength = chunks.reduce((sum, chunk) =>
        sum + tokenize(chunk.text).length, 0
    ) / docCount

    // Calcular score BM25 para cada chunk
    return chunks.map(chunk => {
        const docTerms = tokenize(chunk.text.toLowerCase())
        const docLength = docTerms.length

        let score = 0
        queryTerms.forEach(term => {
            const termFreq = docTerms.filter(t => t === term).length
            const numerator = termFreq * (k1 + 1)
            const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength))

            score += idf[term] * (numerator / denominator)
        })

        return score
    })
}

/**
 * Tokenização simples
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2) // Remover palavras muito curtas
}

/**
 * Cosine Similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Re-ranking - Reordena resultados usando critérios adicionais
 */
export interface RerankOptions {
    diversityWeight?: number
    recencyWeight?: number
    lengthPreference?: 'short' | 'medium' | 'long'
}

export function rerankDocuments(
    results: SearchResult[],
    query: string,
    options: RerankOptions = {}
): SearchResult[] {
    const {
        diversityWeight = 0.2,
        recencyWeight = 0.1,
        lengthPreference = 'medium'
    } = options

    // 1. Diversity - Penalizar documentos muito similares entre si
    const diversityScores = results.map((result, i) => {
        let diversityPenalty = 0

        results.slice(0, i).forEach(prevResult => {
            if (result.chunk.metadata.documentId === prevResult.chunk.metadata.documentId) {
                diversityPenalty += 0.3 // Penalizar chunks do mesmo documento
            }
        })

        return 1 - Math.min(diversityPenalty, 0.9)
    })

    // 2. Recency - Preferir documentos mais recentes
    const recencyScores = results.map(result => {
        const uploadedAt = result.chunk.metadata.uploadedAt as string | undefined
        if (!uploadedAt) return 0.5

        const daysSinceUpload = (Date.now() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60 * 24)
        return Math.exp(-daysSinceUpload / 30) // Decay exponencial (30 dias)
    })

    // 3. Length Preference
    const lengthScores = results.map(result => {
        const length = result.chunk.text.length

        if (lengthPreference === 'short') {
            return Math.exp(-length / 200)
        } else if (lengthPreference === 'long') {
            return Math.min(length / 500, 1)
        } else { // medium
            const ideal = 300
            return Math.exp(-Math.abs(length - ideal) / 200)
        }
    })

    // 4. Combinar scores
    const rerankedResults = results.map((result, i) => ({
        ...result,
        score: result.score * (1 - diversityWeight - recencyWeight) +
            diversityScores[i] * diversityWeight +
            recencyScores[i] * recencyWeight +
            lengthScores[i] * 0.1
    }))

    return rerankedResults.sort((a, b) => b.score - a.score)
}

/**
 * Geração de Citações
 */
export interface Citation {
    chunkId: string
    documentId: string
    filename: string
    text: string
    pageNumber?: number
    section?: string
    confidence: number
    format: string
}

export function generateCitations(
    chunks: SearchResult[],
    format: 'apa' | 'mla' | 'chicago' | 'simple' = 'simple'
): Citation[] {
    return chunks.map((result, index) => {
        const { chunk, score } = result
        const { documentId, filename, pageNumber, section } = chunk.metadata

        let formattedCitation = ''

        if (format === 'simple') {
            formattedCitation = `[${index + 1}] ${filename}`
            if (pageNumber) formattedCitation += `, p. ${pageNumber}`
            if (section) formattedCitation += `, ${section}`
        } else if (format === 'apa') {
            formattedCitation = `${filename}${pageNumber ? ` (p. ${pageNumber})` : ''}`
        } else if (format === 'mla') {
            formattedCitation = `"${filename}"${pageNumber ? ` ${pageNumber}` : ''}`
        } else if (format === 'chicago') {
            formattedCitation = `${filename}${pageNumber ? `, ${pageNumber}` : ''}`
        }

        return {
            chunkId: chunk.id,
            documentId: documentId as string,
            filename: filename as string,
            text: chunk.text.substring(0, 200) + '...',
            pageNumber: pageNumber as number | undefined,
            section: section as string | undefined,
            confidence: score,
            format: formattedCitation
        }
    })
}
