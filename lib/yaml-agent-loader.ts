import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface AgentYAMLConfig {
    agent: {
        id: string
        name: string
        description: string
        channel: string
        locale: string
        enabled: boolean
    }
    model: {
        provider: string
        model_name: string
        temperature: number
        top_p: number
        max_tokens: number
    }
    behavior: {
        persona: string
        channel_rules: string
        empathy_rules: string
        humanization: {
            typing_delay: boolean
            casual_language: boolean
            use_emojis: boolean
            variable_length: boolean
            natural_errors: boolean
            conversational_flow: boolean
        }
        goals: string[]
        constraints: string[]
        handoff_rules?: string
    }
    system_prompt_template: string
    examples: Array<{
        id: string
        description: string
        conversation: Array<{
            role: 'user' | 'assistant'
            text: string
        }>
    }>
    rag?: {
        enabled: boolean
        provider: string
        top_k: number
    }
    runtime?: {
        history: {
            max_turns: number
            trim_strategy: string
        }
    }
}

export class YAMLAgentLoader {
    private configsDir: string

    constructor(configsDir: string = path.join(process.cwd(), 'agents')) {
        this.configsDir = configsDir
    }

    /**
     * Load agent configuration from YAML file
     */
    loadConfig(agentId: string): AgentYAMLConfig {
        const yamlPath = path.join(this.configsDir, `${agentId}.yaml`)

        if (!fs.existsSync(yamlPath)) {
            throw new Error(`YAML config not found for agent: ${agentId}`)
        }

        const fileContents = fs.readFileSync(yamlPath, 'utf8')
        const config = yaml.load(fileContents) as AgentYAMLConfig

        return config
    }

    /**
     * Compile system prompt with context
     */
    compileSystemPrompt(
        config: AgentYAMLConfig,
        context: {
            conversation_history?: string
            knowledge_context?: string
            lead_context?: string
        } = {}
    ): string {
        let prompt = config.system_prompt_template

        // Simple template replacement (you can use a library like Handlebars for more complex templates)
        prompt = prompt.replace('{{agent.name}}', config.agent.name)
        prompt = prompt.replace('{{behavior.persona}}', config.behavior.persona)
        prompt = prompt.replace('{{behavior.channel_rules}}', config.behavior.channel_rules)
        prompt = prompt.replace('{{behavior.empathy_rules}}', config.behavior.empathy_rules)

        // Replace goals
        const goalsText = config.behavior.goals.map(g => `- ${g}`).join('\n')
        prompt = prompt.replace('{% for goal in behavior.goals %}\n  - {{goal}}\n  {% endfor %}', goalsText)

        // Replace constraints
        const constraintsText = config.behavior.constraints.map(c => `- ${c}`).join('\n')
        prompt = prompt.replace('{% for item in behavior.constraints %}\n  - {{item}}\n  {% endfor %}', constraintsText)

        // Replace context variables
        prompt = prompt.replace('{{conversation_history}}', context.conversation_history || 'Nenhum histórico ainda.')
        prompt = prompt.replace('{{knowledge_context}}', context.knowledge_context || 'Nenhuma informação adicional.')
        prompt = prompt.replace('{{lead_context}}', context.lead_context || '')

        return prompt
    }

    /**
     * Get conversation examples for few-shot learning
     */
    getExamples(config: AgentYAMLConfig, limit: number = 3): string {
        const examples = config.examples.slice(0, limit)

        return examples.map(ex => {
            const conversation = ex.conversation.map(msg =>
                `${msg.role === 'user' ? 'Cliente' : config.agent.name}: ${msg.text}`
            ).join('\n')

            return `[Exemplo: ${ex.description}]\n${conversation}\n`
        }).join('\n')
    }

    /**
     * Get humanization settings
     */
    getHumanizationSettings(config: AgentYAMLConfig) {
        return config.behavior.humanization
    }

    /**
     * Get model configuration
     */
    getModelConfig(config: AgentYAMLConfig) {
        return {
            model: config.model.model_name,
            temperature: config.model.temperature,
            top_p: config.model.top_p,
            max_tokens: config.model.max_tokens
        }
    }
}

// Export singleton instance
export const yamlAgentLoader = new YAMLAgentLoader()
