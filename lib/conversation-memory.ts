import { ChromaClient } from 'chromadb'
import { generateEmbeddings } from './ollama'
import { prisma } from './prisma'

const COLLECTION_NAME = 'whatsapp_conversations'

/**
 * Conversation Memory Service
 * Stores and retrieves conversation history using ChromaDB
 */
export class ConversationMemory {
    private client: ChromaClient
    private collection: any

    constructor() {
        const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
        this.client = new ChromaClient({ path: chromaUrl })
    }

    async initialize() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: COLLECTION_NAME,
                metadata: { description: 'WhatsApp conversation history with embeddings' }
            })
            console.log('[Memory] ChromaDB collection initialized')
        } catch (error) {
            console.error('[Memory] Failed to initialize ChromaDB:', error)
            throw error
        }
    }

    /**
     * Store a conversation turn (user message + agent response)
     */
    async storeConversation(params: {
        phoneNumber: string
        agentId: string
        userMessage: string
        agentResponse: string
        metadata?: Record<string, any>
    }) {
        try {
            if (!this.collection) await this.initialize()

            const { phoneNumber, agentId, userMessage, agentResponse, metadata = {} } = params

            // Create a combined text for embedding
            const combinedText = `User: ${userMessage}\nAgent: ${agentResponse}`

            // Generate embedding
            const embedding = await generateEmbeddings('nomic-embed-text', combinedText)

            // Create unique ID
            const id = `${phoneNumber}_${Date.now()}`

            // Store in ChromaDB
            await this.collection.add({
                ids: [id],
                embeddings: [embedding],
                documents: [combinedText],
                metadatas: [{
                    phoneNumber,
                    agentId,
                    userMessage,
                    agentResponse,
                    timestamp: new Date().toISOString(),
                    ...metadata
                }]
            })

            console.log(`[Memory] Stored conversation for ${phoneNumber}`)

            // Also store in database for persistence
            await prisma.memory.create({
                data: {
                    agentId,
                    content: combinedText,
                    metadata: {
                        phoneNumber,
                        userMessage,
                        agentResponse,
                        timestamp: new Date().toISOString(),
                        ...metadata
                    }
                }
            })

        } catch (error) {
            console.error('[Memory] Failed to store conversation:', error)
        }
    }

    /**
     * Retrieve relevant past conversations
     */
    async retrieveContext(params: {
        phoneNumber: string
        currentMessage: string
        topK?: number
    }): Promise<string[]> {
        try {
            if (!this.collection) await this.initialize()

            const { phoneNumber, currentMessage, topK = 3 } = params

            // Generate embedding for current message
            const queryEmbedding = await generateEmbeddings('nomic-embed-text', currentMessage)

            // Search for similar conversations
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: topK,
                where: { phoneNumber }
            })

            if (!results.documents || !results.documents[0]) {
                return []
            }

            // Return relevant conversation snippets
            const contexts = results.documents[0].map((doc: string, i: number) => {
                const metadata = results.metadatas?.[0]?.[i]
                const timestamp = metadata?.timestamp ? new Date(metadata.timestamp).toLocaleDateString('pt-BR') : 'Data desconhecida'
                return `[Conversa anterior em ${timestamp}]:\n${doc}`
            })

            console.log(`[Memory] Retrieved ${contexts.length} relevant conversations for ${phoneNumber}`)
            return contexts

        } catch (error) {
            console.error('[Memory] Failed to retrieve context:', error)
            return []
        }
    }

    /**
     * Get conversation summary for a phone number
     */
    async getConversationSummary(phoneNumber: string): Promise<string> {
        try {
            if (!this.collection) await this.initialize()

            const results = await this.collection.get({
                where: { phoneNumber },
                limit: 10
            })

            if (!results.metadatas || results.metadatas.length === 0) {
                return 'Nenhuma conversa anterior encontrada.'
            }

            const messages = results.metadatas.map((meta: any) => meta.userMessage).filter(Boolean)
            const uniqueTopics = [...new Set(messages)]

            return `Cliente já conversou ${results.metadatas.length} vezes. Tópicos: ${uniqueTopics.slice(0, 5).join(', ')}`

        } catch (error) {
            console.error('[Memory] Failed to get summary:', error)
            return ''
        }
    }

    /**
     * Clear conversation history for a phone number
     */
    async clearHistory(phoneNumber: string) {
        try {
            if (!this.collection) await this.initialize()

            // ChromaDB doesn't support direct deletion by metadata filter
            // We need to get IDs first, then delete
            const results = await this.collection.get({
                where: { phoneNumber }
            })

            if (results.ids && results.ids.length > 0) {
                await this.collection.delete({
                    ids: results.ids
                })
                console.log(`[Memory] Cleared ${results.ids.length} conversations for ${phoneNumber}`)
            }

        } catch (error) {
            console.error('[Memory] Failed to clear history:', error)
        }
    }
}

// Singleton instance
export const conversationMemory = new ConversationMemory()
