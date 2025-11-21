import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

/**
 * Transcribe audio using Cloudflare Workers AI Whisper model
 * Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) {
        console.error('[Whisper] Missing Cloudflare credentials')
        throw new Error('Cloudflare credentials not configured')
    }

    try {
        const formData = new FormData()
        formData.append('file', fs.createReadStream(audioPath))

        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/openai/whisper`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    ...formData.getHeaders()
                }
            }
        )

        if (response.data?.result?.text) {
            console.log('[Whisper] Transcription successful')
            return response.data.result.text
        }

        throw new Error('No transcription returned')
    } catch (error) {
        console.error('[Whisper] Transcription error:', error)
        throw error
    }
}

/**
 * Fallback: Use local Whisper via Ollama (if available)
 * Note: Ollama doesn't natively support Whisper, this would require a separate service
 */
export async function transcribeAudioLocal(audioPath: string): Promise<string> {
    // This would require setting up a separate Whisper service
    // For now, we'll just return a placeholder
    console.warn('[Whisper] Local transcription not implemented, use Cloudflare Workers AI')
    throw new Error('Local Whisper not available, please configure Cloudflare Workers AI')
}
