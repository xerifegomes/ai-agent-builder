'use client'

import { PremiumChatContainer } from '@/components/premium-chat-container'

export default function ChatDemoPage() {
    const handleSendMessage = async (message: string, conversationId: string) => {
        // Simular streaming de resposta do Ollama
        console.log('Enviando mensagem:', message, 'para conversa:', conversationId)

        // Aqui você integraria com a API do Ollama
        // Por enquanto, apenas um placeholder
        return Promise.resolve()
    }

    return (
        <div className="h-screen">
            <PremiumChatContainer
                agentId="demo-agent-id"
                agentName="Assistente Demo"
                systemPrompt="Você é um assistente útil e amigável."
                onSendMessage={handleSendMessage}
            />
        </div>
    )
}
