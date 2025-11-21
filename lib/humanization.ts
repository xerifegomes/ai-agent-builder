import type { WASocket } from '@whiskeysockets/baileys'

interface EmotionalContext {
    sentiment: 'positive' | 'negative' | 'neutral'
    urgency: 'high' | 'medium' | 'low'
    emotion?: 'excited' | 'frustrated' | 'confused' | 'happy' | 'worried'
}

interface HumanizationConfig {
    typing_delay: boolean
    casual_language: boolean
    use_emojis: boolean
    variable_length: boolean
    natural_errors: boolean
    conversational_flow: boolean
}

/**
 * Detect emotional context from user message
 */
export function detectEmotion(message: string): EmotionalContext {
    const lowerMsg = message.toLowerCase()

    // Detect urgency
    const urgentWords = ['urgente', 'rápido', 'agora', 'hoje', 'já', 'imediato']
    const urgency = urgentWords.some(w => lowerMsg.includes(w)) ? 'high' : 'medium'

    // Detect sentiment
    const positiveWords = ['ótimo', 'perfeito', 'adorei', 'amei', 'legal', 'show', 'massa', 'top']
    const negativeWords = ['problema', 'ruim', 'péssimo', 'difícil', 'frustrado', 'chato', 'caro']

    let sentiment: EmotionalContext['sentiment'] = 'neutral'
    let emotion: EmotionalContext['emotion'] | undefined

    if (positiveWords.some(w => lowerMsg.includes(w))) {
        sentiment = 'positive'
        emotion = lowerMsg.includes('adorei') || lowerMsg.includes('amei') ? 'excited' : 'happy'
    }

    if (negativeWords.some(w => lowerMsg.includes(w))) {
        sentiment = 'negative'
        emotion = lowerMsg.includes('frustrado') ? 'frustrated' : 'worried'
    }

    // Detect confusion
    if (lowerMsg.includes('não entendi') || lowerMsg.includes('como assim') || lowerMsg.includes('?')) {
        emotion = 'confused'
    }

    return { sentiment, urgency, emotion }
}

/**
 * Adjust response tone based on emotional context
 */
export function adjustTone(baseResponse: string, context: EmotionalContext): string {
    let adjusted = baseResponse

    if (context.sentiment === 'negative') {
        // Add empathy prefix
        const empathyPrefixes = [
            'Entendo sua preocupação.',
            'Imagino como deve ser frustrante.',
            'Compreendo perfeitamente.',
            'Sei como é difícil.'
        ]
        const prefix = empathyPrefixes[Math.floor(Math.random() * empathyPrefixes.length)]
        adjusted = `${prefix} ${baseResponse}`
    }

    if (context.sentiment === 'positive' && context.emotion === 'excited') {
        // Match enthusiasm
        const enthusiasticPrefixes = [
            'Que ótimo!',
            'Que legal!',
            'Maravilha!',
            'Show!'
        ]
        const prefix = enthusiasticPrefixes[Math.floor(Math.random() * enthusiasticPrefixes.length)]
        adjusted = `${prefix} ${baseResponse}`
    }

    if (context.urgency === 'high') {
        // Show responsiveness
        adjusted = `Vou te ajudar já! ${baseResponse}`
    }

    return adjusted
}

/**
 * Add casual language variations
 */
export function addCasualLanguage(text: string, enabled: boolean): string {
    if (!enabled || Math.random() > 0.3) return text // Only 30% of the time

    const replacements: [RegExp, string][] = [
        [/\bvocê\b/gi, 'vc'],
        [/\bporque\b/gi, 'pq'],
        [/\btambém\b/gi, 'tb'],
        [/\bestá\b/gi, 'tá'],
        [/\bpara\b/gi, 'pra']
    ]

    let result = text
    // Apply only one random replacement
    const randomReplacement = replacements[Math.floor(Math.random() * replacements.length)]
    result = result.replace(randomReplacement[0], randomReplacement[1])

    return result
}

/**
 * Vary response length based on conversation history
 */
export function varyResponseLength(
    response: string,
    recentResponses: string[]
): string {
    if (recentResponses.length < 2) return response

    const avgLength = recentResponses.reduce((sum, r) => sum + r.length, 0) / recentResponses.length

    // If recent responses were long, make this one shorter
    if (avgLength > 150) {
        const sentences = response.split(/[.!?]+/).filter(Boolean)
        return sentences.slice(0, Math.max(1, Math.floor(sentences.length / 2))).join('. ') + '.'
    }

    // If recent responses were short, keep full response
    return response
}

/**
 * Send message with human-like typing delay
 */
export async function sendHumanizedMessage(
    socket: WASocket,
    jid: string,
    text: string,
    config: HumanizationConfig
) {
    if (config.typing_delay) {
        // Show "typing..." indicator
        await socket.sendPresenceUpdate('composing', jid)

        // Calculate typing time based on message length (50ms per character, max 3s)
        const typingTime = Math.min(text.length * 50, 3000)
        await new Promise(resolve => setTimeout(resolve, typingTime))
    }

    // Send message
    await socket.sendMessage(jid, { text })

    // Mark as available again
    await socket.sendPresenceUpdate('available', jid)
}

/**
 * Split long messages into natural chunks
 */
export function splitIntoChunks(text: string, maxLength: number = 200): string[] {
    if (text.length <= maxLength) return [text]

    const chunks: string[] = []
    const paragraphs = text.split('\n\n').filter(Boolean)

    let currentChunk = ''

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim())
            currentChunk = paragraph
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim())
    }

    return chunks
}

/**
 * Add natural conversation starters
 */
export function addConversationalFlow(text: string, enabled: boolean): string {
    if (!enabled || Math.random() > 0.2) return text // Only 20% of the time

    const starters = [
        'Então,',
        'Olha,',
        'Veja bem,',
        'Deixa eu te explicar,',
        'Ah,',
        'Hmm,'
    ]

    const starter = starters[Math.floor(Math.random() * starters.length)]
    return `${starter} ${text.charAt(0).toLowerCase()}${text.slice(1)}`
}

/**
 * Main humanization function
 */
export function humanizeResponse(
    response: string,
    config: HumanizationConfig,
    context: {
        emotionalContext: EmotionalContext
        recentResponses: string[]
    }
): string {
    let humanized = response

    // Adjust tone based on emotion
    humanized = adjustTone(humanized, context.emotionalContext)

    // Add casual language
    if (config.casual_language) {
        humanized = addCasualLanguage(humanized, true)
    }

    // Vary length
    if (config.variable_length) {
        humanized = varyResponseLength(humanized, context.recentResponses)
    }

    // Add conversational flow
    if (config.conversational_flow) {
        humanized = addConversationalFlow(humanized, true)
    }

    return humanized
}
