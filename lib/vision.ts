import axios from 'axios'
import fs from 'fs'

/**
 * Analyze image using LLaVA vision model via Ollama
 */
export async function analyzeImage(imagePath: string, prompt: string = 'Descreva esta imagem em detalhes.'): Promise<string> {
    try {
        // Read image and convert to base64
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')

        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llava:latest',
            prompt: prompt,
            images: [base64Image],
            stream: false
        })

        if (response.data?.response) {
            console.log('[Vision] Image analysis successful')
            return response.data.response
        }

        throw new Error('No analysis returned')
    } catch (error) {
        console.error('[Vision] Image analysis error:', error)
        throw error
    }
}

/**
 * Analyze image with specific real estate context for Manú
 */
export async function analyzePropertyImage(imagePath: string): Promise<string> {
    const prompt = `Você é uma corretora de imóveis experiente. Analise esta imagem e descreva:
1. Tipo de ambiente (sala, quarto, cozinha, fachada, etc.)
2. Características principais (tamanho aparente, acabamento, iluminação)
3. Estado de conservação
4. Pontos positivos que podem ser destacados para um cliente
5. Possíveis melhorias ou pontos de atenção

Seja objetiva e profissional.`

    return analyzeImage(imagePath, prompt)
}
