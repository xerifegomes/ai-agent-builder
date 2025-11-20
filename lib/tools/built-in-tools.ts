import { z } from 'zod'
import { evaluate } from 'mathjs'
import type { ToolDefinition, ToolResult } from './tool-system'

/**
 * Calculator Tool - Executa cálculos matemáticos
 */
export const calculatorTool: ToolDefinition = {
    name: 'calculator',
    description: 'Executa cálculos matemáticos complexos. Suporta operações aritméticas, funções trigonométricas, logaritmos, etc.',
    category: 'computation',
    parameters: z.object({
        expression: z.string().describe('Expressão matemática a ser calculada (ex: "2 + 2", "sin(pi/2)", "sqrt(16)")'),
    }),
    execute: async (params): Promise<ToolResult> => {
        try {
            const result = evaluate(params.expression)

            return {
                success: true,
                result: {
                    expression: params.expression,
                    answer: result,
                    formatted: `${params.expression} = ${result}`
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Erro ao calcular: ${error.message}`
            }
        }
    }
}

/**
 * Web Search Tool - Busca informações na web
 */
export const webSearchTool: ToolDefinition = {
    name: 'web_search',
    description: 'Busca informações atualizadas na web. Use para responder perguntas sobre eventos recentes, notícias, ou informações que não estão na base de conhecimento.',
    category: 'search',
    parameters: z.object({
        query: z.string().describe('Termo de busca'),
        num_results: z.number().optional().describe('Número de resultados (padrão: 5)')
    }),
    execute: async (params): Promise<ToolResult> => {
        try {
            // Usar DuckDuckGo Instant Answer API (gratuita, sem API key)
            const query = encodeURIComponent(params.query)
            const response = await fetch(
                `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`
            )

            if (!response.ok) {
                throw new Error('Falha na busca web')
            }

            const data = await response.json()

            // Extrair resultados relevantes
            const results: any[] = []

            if (data.AbstractText) {
                results.push({
                    title: data.Heading || 'Resumo',
                    snippet: data.AbstractText,
                    url: data.AbstractURL
                })
            }

            if (data.RelatedTopics) {
                data.RelatedTopics.slice(0, params.num_results || 5).forEach((topic: any) => {
                    if (topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0],
                            snippet: topic.Text,
                            url: topic.FirstURL
                        })
                    }
                })
            }

            if (results.length === 0) {
                return {
                    success: false,
                    error: 'Nenhum resultado encontrado'
                }
            }

            return {
                success: true,
                result: {
                    query: params.query,
                    results,
                    summary: results.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join('\n\n')
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Erro na busca web: ${error.message}`
            }
        }
    }
}

/**
 * Code Executor Tool - Executa código JavaScript de forma segura
 */
export const codeExecutorTool: ToolDefinition = {
    name: 'code_executor',
    description: 'Executa código JavaScript de forma segura em um ambiente isolado. Use para testar snippets de código, fazer transformações de dados, etc.',
    category: 'code',
    requiresConfirmation: true,
    parameters: z.object({
        code: z.string().describe('Código JavaScript a ser executado'),
        timeout: z.number().optional().describe('Timeout em ms (padrão: 5000)')
    }),
    execute: async (params): Promise<ToolResult> => {
        try {
            const timeout = params.timeout || 5000

            // Criar função isolada
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor
            const fn = new AsyncFunction('console', params.code)

            // Capturar console.log
            const logs: string[] = []
            const mockConsole = {
                log: (...args: any[]) => logs.push(args.map(String).join(' ')),
                error: (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' ')),
                warn: (...args: any[]) => logs.push('WARN: ' + args.map(String).join(' '))
            }

            // Executar com timeout
            const result = await Promise.race([
                fn(mockConsole),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
                )
            ])

            return {
                success: true,
                result: {
                    output: result,
                    logs: logs.join('\n'),
                    code: params.code
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Erro na execução: ${error.message}`
            }
        }
    }
}

/**
 * Current Time Tool - Retorna data/hora atual
 */
export const currentTimeTool: ToolDefinition = {
    name: 'current_time',
    description: 'Retorna a data e hora atual. Use quando precisar de informações temporais atualizadas.',
    category: 'other',
    parameters: z.object({
        timezone: z.string().optional().describe('Timezone (ex: "America/Sao_Paulo", padrão: UTC)')
    }),
    execute: async (params): Promise<ToolResult> => {
        try {
            const now = new Date()
            const timezone = params.timezone || 'UTC'

            const formatted = now.toLocaleString('pt-BR', {
                timeZone: timezone,
                dateStyle: 'full',
                timeStyle: 'long'
            })

            return {
                success: true,
                result: {
                    timestamp: now.toISOString(),
                    formatted,
                    timezone,
                    unix: Math.floor(now.getTime() / 1000)
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Erro ao obter horário: ${error.message}`
            }
        }
    }
}

/**
 * JSON Parser Tool - Parse e valida JSON
 */
export const jsonParserTool: ToolDefinition = {
    name: 'json_parser',
    description: 'Faz parse e valida strings JSON. Útil para processar dados estruturados.',
    category: 'other',
    parameters: z.object({
        json_string: z.string().describe('String JSON a ser parseada'),
        pretty: z.boolean().optional().describe('Formatar output (padrão: false)')
    }),
    execute: async (params): Promise<ToolResult> => {
        try {
            const parsed = JSON.parse(params.json_string)
            const output = params.pretty
                ? JSON.stringify(parsed, null, 2)
                : JSON.stringify(parsed)

            return {
                success: true,
                result: {
                    parsed,
                    formatted: output,
                    type: Array.isArray(parsed) ? 'array' : typeof parsed
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: `JSON inválido: ${error.message}`
            }
        }
    }
}

// Exportar todas as tools
export const builtInTools = [
    calculatorTool,
    webSearchTool,
    codeExecutorTool,
    currentTimeTool,
    jsonParserTool
]
