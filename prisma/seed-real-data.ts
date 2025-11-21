import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding...')

    // Get or create user
    let user = await prisma.user.findFirst()
    if (!user) {
        console.log('Creating default user...')
        user = await prisma.user.create({
            data: {
                email: 'dev@oconnector.tech',
                name: 'Dev User',
                password: 'password'
            }
        })
    }

    console.log(`✅ User: ${user.email}`)

    // Create Agents
    console.log('\n📦 Creating agents...')

    const manu = await prisma.agent.upsert({
        where: { id: 'manu-agent' },
        update: {},
        create: {
            id: 'manu-agent',
            userId: user.id,
            name: 'Manú - Corretora Digital',
            description: 'Especialista em qualificação de leads e agendamento de visitas imobiliárias.',
            model: 'llama3.1:8b',
            systemPrompt: `### SYSTEM INSTRUCTION ###

VOCÊ É:
Manú, a Consultora Imobiliária Virtual da imobiliária [NOME_DA_IMOBILIÁRIA]. Você é uma corretora sênior, especialista em encontrar o imóvel perfeito e guiar o cliente com segurança.

SEU OBJETIVO:
Engajar o cliente em uma conversa natural, entender o que ele busca (qualificação), tirar dúvidas sobre os imóveis listados e, SEMPRE que possível, converter a conversa em um agendamento de visita ou proposta.`,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxTokens: 2048,
        }
    })

    const carlos = await prisma.agent.upsert({
        where: { id: 'carlos-agent' },
        update: {},
        create: {
            id: 'carlos-agent',
            userId: user.id,
            name: 'Carlos - Suporte Técnico',
            description: 'Especialista em resolver problemas técnicos de software e hardware.',
            model: 'llama3.1:8b',
            systemPrompt: `Você é Carlos, um especialista em suporte técnico com 10 anos de experiência. Você é paciente, didático e sempre busca resolver o problema do cliente de forma clara e eficiente. Use linguagem simples e evite jargões técnicos desnecessários.`,
            temperature: 0.5,
            topP: 0.9,
            topK: 40,
            maxTokens: 1024,
        }
    })

    const sofia = await prisma.agent.upsert({
        where: { id: 'sofia-agent' },
        update: {},
        create: {
            id: 'sofia-agent',
            userId: user.id,
            name: 'Sofia - Consultora Financeira',
            description: 'Especialista em planejamento financeiro pessoal e investimentos.',
            model: 'llama3.1:8b',
            systemPrompt: `Você é Sofia, uma consultora financeira certificada. Você ajuda pessoas a organizarem suas finanças, criar orçamentos e planejar investimentos. Seja empática, educativa e sempre priorize a educação financeira do cliente.`,
            temperature: 0.6,
            topP: 0.9,
            topK: 40,
            maxTokens: 1536,
        }
    })

    const pedro = await prisma.agent.upsert({
        where: { id: 'pedro-agent' },
        update: {},
        create: {
            id: 'pedro-agent',
            userId: user.id,
            name: 'Pedro - Assistente de Vendas',
            description: 'Especialista em vendas consultivas e relacionamento com clientes.',
            model: 'llama3.1:8b',
            systemPrompt: `Você é Pedro, um vendedor consultivo experiente. Você foca em entender as necessidades do cliente antes de oferecer soluções. Seja persuasivo mas não agressivo, e sempre busque criar valor para o cliente.`,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxTokens: 1024,
        }
    })

    console.log(`✅ Created 4 agents: ${manu.name}, ${carlos.name}, ${sofia.name}, ${pedro.name}`)

    // Create Conversations
    console.log('\n💬 Creating conversations...')

    const conv1 = await prisma.conversation.create({
        data: {
            userId: user.id,
            agentId: manu.id,
            title: 'Interesse em Apartamento 3 Quartos',
            messages: {
                create: [
                    {
                        role: 'user',
                        content: 'Olá, vi um apartamento de 3 quartos no site. Ainda está disponível?'
                    },
                    {
                        role: 'assistant',
                        content: 'Olá! Tudo bem? Sim, temos várias opções de apartamentos de 3 quartos disponíveis! 🏠 Você está buscando em alguma região específica? E é para morar ou investimento?'
                    },
                    {
                        role: 'user',
                        content: 'É para morar, prefiro zona sul. Qual a faixa de preço?'
                    },
                    {
                        role: 'assistant',
                        content: 'Perfeito! Na zona sul temos opções a partir de R$ 650.000. Você já tem uma ideia de orçamento ou gostaria de ver algumas opções primeiro? 😊'
                    }
                ]
            }
        }
    })

    const conv2 = await prisma.conversation.create({
        data: {
            userId: user.id,
            agentId: carlos.id,
            title: 'Problema com Impressora',
            messages: {
                create: [
                    {
                        role: 'user',
                        content: 'Minha impressora não está conectando ao WiFi'
                    },
                    {
                        role: 'assistant',
                        content: 'Entendo sua frustração. Vamos resolver isso juntos! Primeiro, me diga: qual é o modelo da sua impressora?'
                    },
                    {
                        role: 'user',
                        content: 'É uma HP DeskJet 2720'
                    },
                    {
                        role: 'assistant',
                        content: 'Ótimo! A HP DeskJet 2720 é bem tranquila de configurar. Vamos fazer o seguinte: 1) Certifique-se que a impressora está ligada. 2) Pressione o botão WiFi por 3 segundos até a luz começar a piscar. Conseguiu fazer isso?'
                    }
                ]
            }
        }
    })

    const conv3 = await prisma.conversation.create({
        data: {
            userId: user.id,
            agentId: sofia.id,
            title: 'Planejamento de Aposentadoria',
            messages: {
                create: [
                    {
                        role: 'user',
                        content: 'Tenho 35 anos e quero começar a planejar minha aposentadoria'
                    },
                    {
                        role: 'assistant',
                        content: 'Que ótimo que você está pensando nisso agora! Aos 35 anos, você tem um horizonte de tempo excelente para construir um patrimônio sólido. Me conta: você já tem algum investimento ou está começando do zero?'
                    },
                    {
                        role: 'user',
                        content: 'Tenho apenas poupança, uns R$ 20 mil'
                    },
                    {
                        role: 'assistant',
                        content: 'Perfeito! Você já tem uma reserva inicial, isso é ótimo. Vamos estruturar seu planejamento em 3 etapas: 1) Reserva de emergência (6 meses de despesas), 2) Investimentos de médio prazo, 3) Previdência privada. Quanto você gasta por mês em média?'
                    }
                ]
            }
        }
    })

    console.log(`✅ Created ${3} conversations`)

    // Create Memories
    console.log('\n🧠 Creating memories...')

    await prisma.memory.createMany({
        data: [
            {
                agentId: manu.id,
                content: 'Cliente prefere imóveis na zona sul, orçamento até R$ 800.000',
                metadata: { type: 'preference', category: 'location' }
            },
            {
                agentId: manu.id,
                content: 'Cliente tem 2 filhos, precisa de 3 quartos mínimo',
                metadata: { type: 'requirement', category: 'family' }
            },
            {
                agentId: carlos.id,
                content: 'Cliente usa Windows 11 e tem dificuldade com configurações de rede',
                metadata: { type: 'context', category: 'technical' }
            },
            {
                agentId: sofia.id,
                content: 'Cliente tem perfil conservador, prefere renda fixa',
                metadata: { type: 'preference', category: 'investment' }
            },
            {
                agentId: pedro.id,
                content: 'Cliente é dono de pequena empresa, busca soluções B2B',
                metadata: { type: 'context', category: 'business' }
            }
        ]
    })

    console.log(`✅ Created 5 memories`)

    // Create Test Cases
    console.log('\n🧪 Creating test cases...')

    await prisma.testCase.createMany({
        data: [
            {
                agentId: manu.id,
                description: 'Qualificação de Lead - Orçamento',
                input: 'Quanto custa um apartamento de 2 quartos?',
                expectedOutput: 'Resposta com faixa de preço e pergunta sobre localização preferida',
                keywords: ['orçamento', 'preço', 'apartamento']
            },
            {
                agentId: carlos.id,
                description: 'Diagnóstico de Problema - WiFi',
                input: 'Internet está lenta',
                expectedOutput: 'Perguntas de diagnóstico sobre velocidade contratada e dispositivos conectados',
                keywords: ['internet', 'wifi', 'lenta']
            },
            {
                agentId: sofia.id,
                description: 'Orientação Financeira - Iniciante',
                input: 'Como começar a investir?',
                expectedOutput: 'Explicação sobre reserva de emergência e perfil de investidor',
                keywords: ['investir', 'iniciante', 'financeiro']
            }
        ]
    })

    console.log(`✅ Created 3 test cases`)

    console.log('\n🎉 Seeding completed successfully!')
    console.log('\nSummary:')
    console.log(`- 4 Agents`)
    console.log(`- 3 Conversations`)
    console.log(`- 5 Memories`)
    console.log(`- 3 Test Cases`)
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
