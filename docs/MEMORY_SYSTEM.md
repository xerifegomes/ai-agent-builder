# Sistema de Memória Local

Sistema de persistência local implementado para armazenar memórias de agentes, conversas e mensagens.

## 🎯 Funcionalidades

### 1. **Agent Memory**
- Armazenamento de fatos, preferências, contexto e instruções
- Busca por palavra-chave
- Categorização por tipo (fact, preference, context, instruction)
- Timestamps automáticos

### 2. **Conversations**
- Histórico de conversas por agente
- Metadata customizável
- Tracking de criação e atualização

### 3. **Messages**
- Mensagens vinculadas a conversas
- Suporte para roles: user, assistant, system
- Ordenação cronológica

## 📂 Estrutura de Dados

### Memory Schema
```typescript
{
  id: string              // UUID único
  agentId: string        // ID do agente
  key: string            // Chave da memória
  value: string          // Valor/conteúdo
  type: 'fact' | 'preference' | 'context' | 'instruction'
  timestamp: string      // ISO timestamp
  embedding?: number[]   // Embedding vetorial (opcional)
}
```

### Conversation Schema
```typescript
{
  id: string
  agentId: string
  title: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, string | number | boolean>
}
```

### Message Schema
```typescript
{
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, string | number | boolean>
}
```

## 🔌 API Endpoints

### Agent Memory
- `GET /api/memory/agent-memory?agentId=xxx` - Lista memórias
- `GET /api/memory/agent-memory?agentId=xxx&type=fact` - Filtra por tipo
- `GET /api/memory/agent-memory?agentId=xxx&query=search` - Busca por palavra
- `POST /api/memory/agent-memory` - Adiciona memória
- `DELETE /api/memory/agent-memory?id=xxx` - Remove memória
- `DELETE /api/memory/agent-memory?agentId=xxx&clear=true` - Limpa todas

### Conversations
- `GET /api/memory/conversations?agentId=xxx` - Lista conversas
- `POST /api/memory/conversations` - Cria conversa
- `DELETE /api/memory/conversations?id=xxx` - Remove conversa

### Messages
- `GET /api/memory/messages?conversationId=xxx` - Lista mensagens
- `POST /api/memory/messages` - Adiciona mensagem

## 💾 Persistência

Dados armazenados em: `data/memory.json`

Usa **LowDB** para persistência JSON local com:
- Auto-save em cada operação
- Thread-safe
- Schema TypeScript completo

## 🚀 Como Usar

### Adicionar Memória
```typescript
const response = await fetch('/api/memory/agent-memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'my-agent',
    key: 'user_name',
    value: 'John Doe',
    type: 'fact'
  })
})
```

### Criar Conversa
```typescript
const response = await fetch('/api/memory/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'my-agent',
    title: 'Chat sobre produtos'
  })
})
```

### Adicionar Mensagem
```typescript
const response = await fetch('/api/memory/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conversation-id',
    role: 'user',
    content: 'Hello!'
  })
})
```

## 🔮 Melhorias Futuras

- [ ] Integração com embeddings para busca semântica
- [ ] Compressão automática de conversas antigas
- [ ] Export/import de memórias
- [ ] Backup automático
- [ ] Suporte a SQLite para performance
- [ ] Sincronização entre múltiplos agentes
- [ ] Sistema de tags e categorias avançado
