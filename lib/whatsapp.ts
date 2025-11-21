import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    WASocket,
    ConnectionState,
    downloadMediaMessage
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'
import { prisma } from './prisma'
import { chatWithOllama } from './ollama'

// Global state to hold the socket and QR code
// In a production environment, this should be managed by a separate worker service
// or a robust state management system, as Next.js serverless functions are stateless.
// However, for a local "dev" server or a long-running Node process, this global hack works.
declare global {
    var whatsappSocket: WASocket | undefined
    var whatsappQr: string | undefined
    var whatsappStatus: string
    var isConnecting: boolean
}

if (!global.whatsappStatus) {
    global.whatsappStatus = 'disconnected'
}

if (global.isConnecting === undefined) {
    global.isConnecting = false
}

const AUTH_FOLDER = 'whatsapp_auth'

export class WhatsAppService {
    private socket: WASocket | undefined

    constructor() {
        this.socket = global.whatsappSocket
    }

    async connect() {
        if (this.socket || global.isConnecting) return

        try {
            global.isConnecting = true
            const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
            const { version } = await fetchLatestBaileysVersion()

            const sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }) as any,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }) as any),
                },
                browser: ['AI Agent Builder', 'Chrome', '1.0.0'],
                generateHighQualityLinkPreview: true,
            })

            global.whatsappSocket = sock
            this.socket = sock

            sock.ev.on('creds.update', saveCreds)

            sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update

                if (qr) {
                    try {
                        global.whatsappQr = await QRCode.toDataURL(qr)
                        global.whatsappStatus = 'waiting_for_scan'
                    } catch (err) {
                        console.error('Failed to generate QR code', err)
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
                    console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)

                    global.whatsappStatus = 'disconnected'
                    global.whatsappSocket = undefined
                    this.socket = undefined
                    global.whatsappQr = undefined
                    global.isConnecting = false

                    if (shouldReconnect) {
                        this.connect()
                    }
                } else if (connection === 'open') {
                    console.log('opened connection')
                    global.whatsappStatus = 'connected'
                    global.whatsappQr = undefined
                    global.isConnecting = false
                }
            })

            sock.ev.on('messages.upsert', async (m) => {
                console.log(`[WhatsApp] Messages upsert: ${m.type}, count: ${m.messages.length}`)
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe && msg.message) {
                            console.log('replying to', msg.key.remoteJid)
                            await this.handleMessage(msg)
                        }
                    }
                }
            })
        } catch (error) {
            console.error('Error connecting to WhatsApp:', error)
            global.isConnecting = false
        }
    }

    async downloadMedia(msg: any): Promise<{ path: string, mimeType: string } | null> {
        try {
            const messageType = Object.keys(msg.message)[0]
            if (!['imageMessage', 'audioMessage', 'videoMessage', 'documentMessage'].includes(messageType)) {
                return null
            }

            const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
                logger: pino({ level: 'silent' }) as any,
                reuploadRequest: this.socket!.updateMediaMessage
            })
            const extension = messageType === 'imageMessage' ? 'jpg' :
                messageType === 'audioMessage' ? 'ogg' :
                    messageType === 'videoMessage' ? 'mp4' : 'bin'

            const filename = `whatsapp_media_${Date.now()}.${extension}`
            const filepath = `/tmp/${filename}`

            const fs = await import('fs')
            fs.writeFileSync(filepath, buffer)

            console.log(`[WhatsApp] Media downloaded: ${filepath}`)
            return {
                path: filepath,
                mimeType: msg.message[messageType]?.mimetype || 'application/octet-stream'
            }
        } catch (error) {
            console.error('[WhatsApp] Error downloading media:', error)
            return null
        }
    }

    async handleMessage(msg: any) {
        try {
            const remoteJid = msg.key.remoteJid
            if (!remoteJid) {
                console.log('[WhatsApp] Message ignored: no remoteJid')
                return
            }

            // Extract text content
            let textContent = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption || ''

            // Check for audio
            const hasAudio = !!msg.message?.audioMessage
            const hasImage = !!msg.message?.imageMessage
            const hasVideo = !!msg.message?.videoMessage

            console.log(`[WhatsApp] Message from ${remoteJid} - Text: "${textContent}", Audio: ${hasAudio}, Image: ${hasImage}, Video: ${hasVideo}`)

            // Process audio transcription
            if (hasAudio) {
                console.log('[WhatsApp] Processing audio message...')
                const media = await this.downloadMedia(msg)
                if (media) {
                    try {
                        const { transcribeAudio } = await import('./whisper')
                        const transcription = await transcribeAudio(media.path)
                        textContent = `[Áudio transcrito]: ${transcription}`
                        console.log(`[WhatsApp] Audio transcribed: ${transcription}`)

                        // Clean up temp file
                        const fs = await import('fs')
                        fs.unlinkSync(media.path)
                    } catch (error) {
                        console.error('[WhatsApp] Transcription failed:', error)
                        textContent = '[Áudio recebido, mas não foi possível transcrever]'
                    }
                }
            }

            // Process image analysis
            let imageAnalysis = ''
            if (hasImage) {
                console.log('[WhatsApp] Processing image message...')
                const media = await this.downloadMedia(msg)
                if (media) {
                    try {
                        const { analyzePropertyImage } = await import('./vision')
                        imageAnalysis = await analyzePropertyImage(media.path)
                        console.log(`[WhatsApp] Image analyzed: ${imageAnalysis.substring(0, 100)}...`)

                        // Clean up temp file
                        const fs = await import('fs')
                        fs.unlinkSync(media.path)
                    } catch (error) {
                        console.error('[WhatsApp] Image analysis failed:', error)
                        imageAnalysis = '[Imagem recebida, mas não foi possível analisar]'
                    }
                }
            }

            // Combine all content
            const fullContent = [
                textContent,
                imageAnalysis ? `\n\n[Análise da imagem]:\n${imageAnalysis}` : ''
            ].filter(Boolean).join('')

            if (!fullContent.trim()) {
                console.log('[WhatsApp] Message ignored: no processable content')
                return
            }

            // Find an agent to respond
            const agent = await prisma.agent.findFirst({
                orderBy: { updatedAt: 'desc' }
            })

            if (!agent) {
                console.log('[WhatsApp] No agent found to reply')
                return
            }

            console.log(`[WhatsApp] Using agent: ${agent.name} (${agent.id})`)

            // Load YAML configuration if available
            let yamlConfig: any = null
            let humanizationConfig: any = null
            try {
                const { yamlAgentLoader } = await import('./yaml-agent-loader')
                yamlConfig = yamlAgentLoader.loadConfig('manu-corretora')
                humanizationConfig = yamlConfig.behavior.humanization
                console.log('[WhatsApp] Loaded YAML configuration for agent')
            } catch (error) {
                console.log('[WhatsApp] No YAML config found, using database config')
            }

            // Detect emotional context
            const { detectEmotion } = await import('./humanization')
            const emotionalContext = detectEmotion(fullContent)
            console.log(`[WhatsApp] Emotional context: ${JSON.stringify(emotionalContext)}`)

            // Retrieve conversation context from memory
            let contextMessages: any[] = []
            let conversationHistory = ''
            let recentResponses: string[] = []

            try {
                const { conversationMemory } = await import('./conversation-memory')
                const relevantContext = await conversationMemory.retrieveContext({
                    phoneNumber: remoteJid,
                    currentMessage: fullContent,
                    topK: 3
                })

                if (relevantContext.length > 0) {
                    console.log(`[WhatsApp] Retrieved ${relevantContext.length} relevant past conversations`)
                    conversationHistory = relevantContext.join('\n\n')

                    // Extract recent assistant responses for variation
                    recentResponses = relevantContext
                        .filter((ctx: string) => ctx.includes('Agente:'))
                        .map((ctx: string) => ctx.split('Agente:')[1]?.trim() || '')
                        .filter(Boolean)
                }
            } catch (error) {
                console.error('[WhatsApp] Failed to retrieve memory context:', error)
            }

            // Compile system prompt
            let systemPrompt = agent.systemPrompt || 'You are a helpful assistant.'

            if (yamlConfig) {
                const { yamlAgentLoader } = await import('./yaml-agent-loader')
                systemPrompt = yamlAgentLoader.compileSystemPrompt(yamlConfig, {
                    conversation_history: conversationHistory || 'Primeira conversa com este cliente.',
                    knowledge_context: 'Informações do sistema disponíveis via RAG.'
                })

                // Add few-shot examples
                const examples = yamlAgentLoader.getExamples(yamlConfig, 2)
                if (examples) {
                    systemPrompt += `\n\n[EXEMPLOS DE CONVERSA]\n${examples}`
                }
            } else if (conversationHistory) {
                systemPrompt += `\n\n[Contexto de conversas anteriores]:\n${conversationHistory}`
            }

            contextMessages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: fullContent }
            ]

            // Generate response using Ollama
            console.log('[WhatsApp] Sending to Ollama...')
            const modelConfig = yamlConfig?.model || { model_name: agent.model }

            const response = await chatWithOllama({
                model: modelConfig.model_name || agent.model,
                messages: contextMessages
            })

            let replyText = response.message.content
            console.log(`[WhatsApp] Ollama response: ${replyText}`)

            // Humanize response
            if (humanizationConfig) {
                const { humanizeResponse, sendHumanizedMessage, splitIntoChunks } = await import('./humanization')

                replyText = humanizeResponse(replyText, humanizationConfig, {
                    emotionalContext,
                    recentResponses
                })

                console.log(`[WhatsApp] Humanized response: ${replyText}`)

                // Send with typing delay and split into chunks if needed
                if (this.socket) {
                    const chunks = splitIntoChunks(replyText, 300)

                    for (const chunk of chunks) {
                        await sendHumanizedMessage(this.socket, remoteJid, chunk, humanizationConfig)

                        // Small delay between chunks
                        if (chunks.length > 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000))
                        }
                    }

                    console.log('[WhatsApp] Reply sent with humanization')
                }
            } else {
                // Send without humanization
                if (this.socket) {
                    await this.socket.sendMessage(remoteJid, { text: replyText })
                    console.log('[WhatsApp] Reply sent successfully')
                }
            }

            // Store conversation in memory
            try {
                const { conversationMemory } = await import('./conversation-memory')
                await conversationMemory.storeConversation({
                    phoneNumber: remoteJid,
                    agentId: agent.id,
                    userMessage: fullContent,
                    agentResponse: replyText,
                    metadata: {
                        hasAudio,
                        hasImage,
                        hasVideo,
                        emotionalContext
                    }
                })
                console.log('[WhatsApp] Conversation stored in memory')
            } catch (error) {
                console.error('[WhatsApp] Failed to store conversation:', error)
            }

        } catch (error) {
            console.error('[WhatsApp] Error handling message:', error)
        }
    }

    async disconnect() {
        if (this.socket) {
            this.socket.end(undefined)
            global.whatsappSocket = undefined
            this.socket = undefined
            global.whatsappStatus = 'disconnected'
            global.whatsappQr = undefined
            global.isConnecting = false
        }
    }

    getStatus() {
        return {
            status: global.whatsappStatus,
            qr: global.whatsappQr
        }
    }
}

export const whatsappService = new WhatsAppService()
