import { z } from 'zod'

/**
 * Tool Definition - Define uma ferramenta que o LLM pode usar
 */
export interface ToolDefinition {
    name: string
    description: string
    parameters: z.ZodObject<any>
    execute: (params: any) => Promise<ToolResult>
    category?: 'computation' | 'search' | 'code' | 'file' | 'api' | 'other'
    requiresConfirmation?: boolean
}

/**
 * Tool Result - Resultado da execução de uma tool
 */
export interface ToolResult {
    success: boolean
    result?: any
    error?: string
    metadata?: {
        executionTime?: number
        tokensUsed?: number
        [key: string]: any
    }
}

/**
 * Tool Execution - Registro de execução de uma tool
 */
export interface ToolExecution {
    id: string
    toolName: string
    parameters: any
    result: ToolResult
    timestamp: Date
    conversationId?: string
    messageId?: string
}

/**
 * Tool Registry - Gerencia todas as tools disponíveis
 */
export class ToolRegistry {
    private tools: Map<string, ToolDefinition> = new Map()

    /**
     * Registra uma nova tool
     */
    register(tool: ToolDefinition) {
        this.tools.set(tool.name, tool)
    }

    /**
     * Busca uma tool pelo nome
     */
    get(name: string): ToolDefinition | undefined {
        return this.tools.get(name)
    }

    /**
     * Lista todas as tools
     */
    list(): ToolDefinition[] {
        return Array.from(this.tools.values())
    }

    /**
     * Lista tools por categoria
     */
    listByCategory(category: string): ToolDefinition[] {
        return this.list().filter(tool => tool.category === category)
    }

    /**
     * Gera schema OpenAI-compatible para function calling
     */
    toOpenAISchema(): any[] {
        return this.list().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: zodToJsonSchema(tool.parameters)
            }
        }))
    }

    /**
     * Gera prompt de system com descrição das tools
     */
    toSystemPrompt(): string {
        const toolDescriptions = this.list().map(tool => {
            const params = Object.entries(tool.parameters.shape)
                .map(([key, schema]: [string, any]) => {
                    const type = schema._def.typeName.replace('Zod', '').toLowerCase()
                    const desc = schema.description || ''
                    return `  - ${key} (${type}): ${desc}`
                })
                .join('\n')

            return `### ${tool.name}\n${tool.description}\n\nParâmetros:\n${params}`
        }).join('\n\n')

        return `Você tem acesso às seguintes ferramentas (tools):

${toolDescriptions}

Para usar uma ferramenta, responda no formato JSON:
\`\`\`json
{
  "tool": "nome_da_ferramenta",
  "parameters": {
    "param1": "valor1",
    "param2": "valor2"
  }
}
\`\`\`

Após usar uma ferramenta, você receberá o resultado e poderá continuar a conversa.`
    }
}

/**
 * Tool Executor - Executa tools e gerencia o ciclo de vida
 */
export class ToolExecutor {
    private registry: ToolRegistry
    private executions: ToolExecution[] = []

    constructor(registry: ToolRegistry) {
        this.registry = registry
    }

    /**
     * Executa uma tool
     */
    async execute(
        toolName: string,
        parameters: any,
        options?: {
            conversationId?: string
            messageId?: string
            skipValidation?: boolean
        }
    ): Promise<ToolExecution> {
        const tool = this.registry.get(toolName)

        if (!tool) {
            throw new Error(`Tool "${toolName}" not found`)
        }

        // Validar parâmetros
        if (!options?.skipValidation) {
            try {
                tool.parameters.parse(parameters)
            } catch (error: any) {
                return {
                    id: generateId(),
                    toolName,
                    parameters,
                    result: {
                        success: false,
                        error: `Invalid parameters: ${error.message}`
                    },
                    timestamp: new Date(),
                    ...options
                }
            }
        }

        // Executar tool
        const startTime = Date.now()
        let result: ToolResult

        try {
            result = await tool.execute(parameters)
            result.metadata = {
                ...result.metadata,
                executionTime: Date.now() - startTime
            }
        } catch (error: any) {
            result = {
                success: false,
                error: error.message || 'Unknown error',
                metadata: {
                    executionTime: Date.now() - startTime
                }
            }
        }

        // Registrar execução
        const execution: ToolExecution = {
            id: generateId(),
            toolName,
            parameters,
            result,
            timestamp: new Date(),
            ...options
        }

        this.executions.push(execution)

        return execution
    }

    /**
     * Busca execuções por conversa
     */
    getExecutionsByConversation(conversationId: string): ToolExecution[] {
        return this.executions.filter(e => e.conversationId === conversationId)
    }

    /**
     * Limpa histórico de execuções
     */
    clearHistory() {
        this.executions = []
    }
}

/**
 * Function Call Parser - Extrai chamadas de função da resposta do LLM
 */
export class FunctionCallParser {
    /**
     * Detecta se a resposta contém uma chamada de função
     */
    static hasFunctionCall(text: string): boolean {
        // Procurar por JSON com "tool" e "parameters"
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/i)
        if (!jsonMatch) return false

        try {
            const parsed = JSON.parse(jsonMatch[1])
            return parsed.tool && parsed.parameters
        } catch {
            return false
        }
    }

    /**
     * Extrai chamada de função da resposta
     */
    static parse(text: string): { tool: string; parameters: any } | null {
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/i)
        if (!jsonMatch) return null

        try {
            const parsed = JSON.parse(jsonMatch[1])
            if (parsed.tool && parsed.parameters) {
                return {
                    tool: parsed.tool,
                    parameters: parsed.parameters
                }
            }
        } catch {
            return null
        }

        return null
    }

    /**
     * Remove a chamada de função do texto
     */
    static removeFromText(text: string): string {
        return text.replace(/```json\s*\{[\s\S]*?\}\s*```/gi, '').trim()
    }
}

/**
 * Helpers
 */
function generateId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function zodToJsonSchema(schema: z.ZodObject<any>): any {
    const shape = schema.shape
    const properties: any = {}
    const required: string[] = []

    Object.entries(shape).forEach(([key, value]: [string, any]) => {
        const zodType = value._def.typeName

        let type = 'string'
        if (zodType === 'ZodNumber') type = 'number'
        if (zodType === 'ZodBoolean') type = 'boolean'
        if (zodType === 'ZodArray') type = 'array'
        if (zodType === 'ZodObject') type = 'object'

        properties[key] = {
            type,
            description: value.description || ''
        }

        if (!value.isOptional()) {
            required.push(key)
        }
    })

    return {
        type: 'object',
        properties,
        required
    }
}

// Singleton instance
export const toolRegistry = new ToolRegistry()
export const toolExecutor = new ToolExecutor(toolRegistry)
