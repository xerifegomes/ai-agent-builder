import { Ollama } from 'ollama'

// Inicializa cliente Ollama
const ollama = new Ollama({ host: 'http://localhost:11434' })

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  top_p?: number
}

// Lista modelos disponíveis no Ollama
export async function listOllamaModels(): Promise<OllamaModel[]> {
  try {
    const response = await ollama.list()
    return response.models.map((model) => ({
      name: model.name,
      size: model.size,
      digest: model.digest,
      modified_at: typeof model.modified_at === 'string' ? model.modified_at : new Date(model.modified_at).toISOString(),
    }))
  } catch (error) {
    console.error('Error listing Ollama models:', error)
    throw new Error('Failed to connect to Ollama. Make sure it is running.')
  }
}

// Chat com modelo Ollama (sem stream)
export async function chatWithOllama(options: ChatOptions) {
  try {
    const response = await ollama.chat({
      model: options.model,
      messages: options.messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
      },
    })
    return response
  } catch (error) {
    console.error('Error chatting with Ollama:', error)
    throw error
  }
}

// Stream de chat com modelo Ollama
export async function* streamChatWithOllama(options: ChatOptions) {
  try {
    const stream = await ollama.chat({
      model: options.model,
      messages: options.messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
      },
    })

    for await (const part of stream) {
      yield part.message.content
    }
  } catch (error) {
    console.error('Error streaming chat with Ollama:', error)
    throw error
  }
}

// Gera embeddings usando Ollama
export async function generateEmbeddings(model: string, text: string) {
  try {
    const response = await ollama.embeddings({
      model: model || 'nomic-embed-text',
      prompt: text,
    })
    return response.embedding
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

export default ollama
