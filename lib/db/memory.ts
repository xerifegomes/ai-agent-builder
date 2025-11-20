import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Tipos para o sistema de memória
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, string | number | boolean>
}

export interface Conversation {
  id: string
  agentId: string
  title: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, string | number | boolean>
}

export interface AgentMemory {
  id: string
  agentId: string
  key: string
  value: string
  type: 'fact' | 'preference' | 'context' | 'instruction'
  timestamp: string
  embedding?: number[]
}

export interface DatabaseSchema {
  conversations: Conversation[]
  messages: Message[]
  memories: AgentMemory[]
}

// Caminho do arquivo de dados
const DB_PATH = join(process.cwd(), 'data', 'memory.json')

// Cria adapter para JSON
const adapter = new JSONFile<DatabaseSchema>(DB_PATH)

// Dados padrão
const defaultData: DatabaseSchema = {
  conversations: [],
  messages: [],
  memories: [],
}

// Instância do banco de dados
let db: Low<DatabaseSchema> | null = null

// Inicializa banco de dados
export async function getDB() {
  if (!db) {
    db = new Low(adapter, defaultData)
    await db.read()
    db.data ||= defaultData
    await db.write()
  }
  return db
}

// CRUD para Conversations
export async function createConversation(
  agentId: string,
  title: string,
  metadata?: Record<string, string | number | boolean>
): Promise<Conversation> {
  const database = await getDB()
  const conversation: Conversation = {
    id: uuidv4(),
    agentId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  }
  database.data.conversations.push(conversation)
  await database.write()
  return conversation
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const database = await getDB()
  return database.data.conversations.find(c => c.id === id)
}

export async function listConversations(agentId?: string): Promise<Conversation[]> {
  const database = await getDB()
  if (agentId) {
    return database.data.conversations.filter(c => c.agentId === agentId)
  }
  return database.data.conversations
}

export async function deleteConversation(id: string): Promise<void> {
  const database = await getDB()
  database.data.conversations = database.data.conversations.filter(c => c.id !== id)
  database.data.messages = database.data.messages.filter(m => m.conversationId !== id)
  await database.write()
}

// CRUD para Messages
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, string | number | boolean>
): Promise<Message> {
  const database = await getDB()
  const message: Message = {
    id: uuidv4(),
    conversationId,
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  }
  database.data.messages.push(message)
  
  // Atualiza timestamp da conversa
  const conversation = database.data.conversations.find(c => c.id === conversationId)
  if (conversation) {
    conversation.updatedAt = new Date().toISOString()
  }
  
  await database.write()
  return message
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const database = await getDB()
  return database.data.messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

// CRUD para Agent Memories
export async function addMemory(
  agentId: string,
  key: string,
  value: string,
  type: 'fact' | 'preference' | 'context' | 'instruction',
  embedding?: number[]
): Promise<AgentMemory> {
  const database = await getDB()
  const memory: AgentMemory = {
    id: uuidv4(),
    agentId,
    key,
    value,
    type,
    timestamp: new Date().toISOString(),
    embedding,
  }
  database.data.memories.push(memory)
  await database.write()
  return memory
}

export async function getMemories(agentId: string, type?: string): Promise<AgentMemory[]> {
  const database = await getDB()
  let memories = database.data.memories.filter(m => m.agentId === agentId)
  if (type) {
    memories = memories.filter(m => m.type === type)
  }
  return memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function searchMemories(agentId: string, query: string): Promise<AgentMemory[]> {
  const database = await getDB()
  const memories = database.data.memories.filter(m => m.agentId === agentId)
  
  // Busca simples por texto (pode ser melhorado com embeddings)
  return memories.filter(m => 
    m.key.toLowerCase().includes(query.toLowerCase()) ||
    m.value.toLowerCase().includes(query.toLowerCase())
  )
}

export async function deleteMemory(id: string): Promise<void> {
  const database = await getDB()
  database.data.memories = database.data.memories.filter(m => m.id !== id)
  await database.write()
}

export async function clearAgentMemories(agentId: string): Promise<void> {
  const database = await getDB()
  database.data.memories = database.data.memories.filter(m => m.agentId !== agentId)
  await database.write()
}
