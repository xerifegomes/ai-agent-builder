# 🤖 → 👤 Guia: Tornando Agentes Mais Humanos

## 1. Personalidade Consistente

### ✅ System Prompt Humanizado
```
Você é Manú, corretora de imóveis de 32 anos, apaixonada pelo que faz.

PERSONALIDADE:
- Comunicativa e empática
- Usa emojis moderadamente (🏠 ✨ 😊)
- Faz perguntas genuínas sobre a vida do cliente
- Compartilha pequenas histórias relevantes

ESTILO DE CONVERSA:
- Natural e fluido (como WhatsApp real)
- Varia entre mensagens curtas e longas
- Usa "vc", "pq", "tb" ocasionalmente
- Faz pausas naturais (não responde tudo de uma vez)

COMPORTAMENTOS HUMANOS:
✓ "Opa, deixa eu ver aqui..."
✓ "Hmm, interessante! Me conta mais..."
✓ "Ah, entendi! Então você prefere..."
✗ "Como assistente de IA, posso..."
✗ "Aqui estão 5 opções numeradas..."
```

## 2. Timing e Ritmo Natural

### Implementar Delays Realistas
```typescript
// lib/whatsapp-human.ts
export async function sendHumanizedMessage(
  socket: WASocket,
  jid: string,
  text: string
) {
  // Simular "digitando..."
  await socket.sendPresenceUpdate('composing', jid)
  
  // Delay baseado no tamanho da mensagem
  const typingTime = Math.min(text.length * 50, 3000) // Max 3s
  await new Promise(resolve => setTimeout(resolve, typingTime))
  
  // Enviar mensagem
  await socket.sendMessage(jid, { text })
  
  // Marcar como "online" novamente
  await socket.sendPresenceUpdate('available', jid)
}

// Para mensagens longas, quebrar em partes
export async function sendInChunks(
  socket: WASocket,
  jid: string,
  text: string
) {
  const chunks = text.split('\n\n').filter(Boolean)
  
  for (const chunk of chunks) {
    await sendHumanizedMessage(socket, jid, chunk)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Pausa entre chunks
  }
}
```

## 3. Variação Linguística

### Evitar Padrões Repetitivos
```typescript
const greetings = [
  "Oi! Tudo bem?",
  "Olá! Como vai?",
  "E aí! Tudo certo?",
  "Opa! Beleza?",
  "Oi, tudo bom?"
]

const confirmations = [
  "Entendi!",
  "Ah, saquei!",
  "Certo, anotado!",
  "Perfeito!",
  "Boa!",
  "Show!"
]

const thinking = [
  "Deixa eu ver aqui...",
  "Hmm, vou verificar...",
  "Só um momento...",
  "Aguarda um pouquinho...",
  "Vou dar uma olhada..."
]

function getRandomResponse(array: string[]) {
  return array[Math.floor(Math.random() * array.length)]
}
```

## 4. Contexto Emocional

### Detectar e Responder a Emoções
```typescript
interface EmotionalContext {
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'high' | 'medium' | 'low'
  emotion?: 'excited' | 'frustrated' | 'confused' | 'happy'
}

function detectEmotion(message: string): EmotionalContext {
  const lowerMsg = message.toLowerCase()
  
  // Urgência
  const urgentWords = ['urgente', 'rápido', 'agora', 'hoje']
  const urgency = urgentWords.some(w => lowerMsg.includes(w)) ? 'high' : 'medium'
  
  // Sentimento
  const positiveWords = ['ótimo', 'perfeito', 'adorei', 'amei', 'legal']
  const negativeWords = ['problema', 'ruim', 'péssimo', 'difícil']
  
  let sentiment: EmotionalContext['sentiment'] = 'neutral'
  if (positiveWords.some(w => lowerMsg.includes(w))) sentiment = 'positive'
  if (negativeWords.some(w => lowerMsg.includes(w))) sentiment = 'negative'
  
  return { sentiment, urgency }
}

function adjustTone(baseResponse: string, context: EmotionalContext): string {
  if (context.sentiment === 'negative') {
    return `Entendo sua preocupação. ${baseResponse}`
  }
  if (context.sentiment === 'positive') {
    return `Que ótimo! ${baseResponse} 😊`
  }
  if (context.urgency === 'high') {
    return `Vou te ajudar já! ${baseResponse}`
  }
  return baseResponse
}
```

## 5. Erros Naturais (Ocasionais)

### Pequenas Imperfeições Humanas
```typescript
function addHumanImperfections(text: string): string {
  // Apenas 5% de chance de adicionar imperfeição
  if (Math.random() > 0.95) {
    const imperfections = [
      // Autocorreção
      (t: string) => t.replace(/\bvocê\b/, 'vc'),
      (t: string) => t.replace(/\bporque\b/, 'pq'),
      (t: string) => t.replace(/\btambém\b/, 'tb'),
      // Repetição (como se estivesse pensando)
      (t: string) => t.replace(/^/, 'Então, então... '),
      // Interjeição
      (t: string) => t.replace(/^/, 'Ah, ')
    ]
    
    const randomImperfection = imperfections[Math.floor(Math.random() * imperfections.length)]
    return randomImperfection(text)
  }
  return text
}
```

## 6. Memória de Conversa

### Referências Naturais ao Passado
```typescript
function addContextualReference(
  response: string,
  pastConversations: string[]
): string {
  if (pastConversations.length > 0 && Math.random() > 0.7) {
    const references = [
      "Como você tinha mencionado antes,",
      "Lembrando do que conversamos,",
      "Continuando nossa conversa,",
      "Sobre aquilo que você falou,"
    ]
    const ref = references[Math.floor(Math.random() * references.length)]
    return `${ref} ${response}`
  }
  return response
}
```

## 7. Quebra de Expectativas

### Não Seja Previsível
```typescript
function varyResponseStyle(message: string, history: Message[]): string {
  const lastResponses = history.slice(-3).filter(m => m.role === 'assistant')
  
  // Se últimas 2 respostas foram longas, faça uma curta
  const recentlyLong = lastResponses.every(r => r.content.length > 100)
  if (recentlyLong) {
    return message.split('.')[0] + '.' // Apenas primeira frase
  }
  
  // Se últimas 2 foram curtas, elabore mais
  const recentlyShort = lastResponses.every(r => r.content.length < 50)
  if (recentlyShort) {
    return `${message}\n\nDeixa eu te explicar melhor...`
  }
  
  return message
}
```

## 8. Implementação Completa

### Integração no WhatsApp Handler
```typescript
// lib/whatsapp.ts - Adicionar ao handleMessage

async handleMessage(msg: any) {
  // ... código existente ...
  
  // Detectar contexto emocional
  const emotionalContext = detectEmotion(fullContent)
  
  // Gerar resposta base
  const baseResponse = await chatWithOllama({
    model: agent.model,
    messages: contextMessages
  })
  
  let finalResponse = baseResponse.message.content
  
  // Humanizar resposta
  finalResponse = adjustTone(finalResponse, emotionalContext)
  finalResponse = addHumanImperfections(finalResponse)
  finalResponse = varyResponseStyle(finalResponse, conversationHistory)
  
  // Enviar com timing natural
  await sendHumanizedMessage(this.socket!, remoteJid, finalResponse)
}
```

## 9. Configuração por Agente

### Níveis de Humanização
```typescript
interface HumanizationConfig {
  useEmojis: boolean
  casualLanguage: boolean // "vc", "pq", etc
  addImperfections: boolean
  variableResponseLength: boolean
  emotionalResponses: boolean
  typingDelay: boolean
}

const manuConfig: HumanizationConfig = {
  useEmojis: true,
  casualLanguage: true,
  addImperfections: true,
  variableResponseLength: true,
  emotionalResponses: true,
  typingDelay: true
}

const carlosConfig: HumanizationConfig = {
  useEmojis: false, // Suporte técnico mais formal
  casualLanguage: false,
  addImperfections: false,
  variableResponseLength: true,
  emotionalResponses: true,
  typingDelay: true
}
```

## 10. Checklist de Humanização

### ✅ Antes de Lançar
- [ ] System prompt tem personalidade clara
- [ ] Agente varia tamanho de respostas
- [ ] Usa expressões naturais brasileiras
- [ ] Implementado delay de digitação
- [ ] Detecta e responde a emoções
- [ ] Faz perguntas de acompanhamento
- [ ] Admite quando não sabe
- [ ] Evita listas numeradas excessivas
- [ ] Não menciona ser IA
- [ ] Tem memória de conversas anteriores

## 📊 Métricas de Sucesso

**Como medir se está funcionando:**
1. **Taxa de Engajamento**: Clientes respondem mais?
2. **Tempo de Conversa**: Conversas mais longas = mais natural
3. **Feedback Direto**: "Você é uma pessoa real?"
4. **Taxa de Conversão**: Mais agendamentos/vendas

## 🎯 Resultado Esperado

**Antes:**
```
Bot: Olá! Como posso ajudá-lo hoje?
Cliente: Quero um apartamento
Bot: Claro! Aqui estão 5 opções:
1. Apartamento A - R$ 500k
2. Apartamento B - R$ 600k
...
```

**Depois:**
```
Manú: Oi! Tudo bem? 😊
Cliente: Quero um apartamento
Manú: Que legal! Me conta, é pra você morar ou investir?
Cliente: Morar
Manú: Ah, entendi! E você já tem uma região em mente? Ou quer que eu te ajude a escolher?
```

---

**Lembre-se:** O objetivo não é enganar, mas criar uma experiência mais natural e agradável!
