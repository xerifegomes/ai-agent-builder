# AI Agent Builder Platform

Uma plataforma moderna e completa para criação, treinamento, gerenciamento e integração de agentes de IA personalizados.

![Dashboard Preview](https://placehold.co/1200x600/png?text=AI+Agent+Builder+Dashboard)

## 🚀 Funcionalidades

### 🤖 Criação e Gerenciamento de Agentes
- **Agent Builder Intuitivo**: Interface passo-a-passo para configurar nome, descrição, modelo (Ollama) e prompt do sistema.
- **Gerenciamento Completo**: Liste, edite e exclua seus agentes facilmente.
- **Teste em Tempo Real**: Chat integrado para testar e refinar o comportamento do seu agente instantaneamente.

### 🧠 Base de Conhecimento (RAG)
- **Upload de Documentos**: Treine seus agentes com PDFs, textos e outros arquivos.
- **Busca Semântica**: Utiliza RAG (Retrieval-Augmented Generation) para fornecer respostas baseadas no contexto dos seus documentos.

### 📊 Dashboard e Métricas
- **Visão Geral**: Acompanhe o desempenho e uso dos seus agentes.
- **Histórico de Conversas**: Revise interações passadas para melhoria contínua.

### 🔌 Integrações (Em Breve)
- Conecte seus agentes a plataformas populares como WhatsApp, Telegram, Discord e Slack.
- API REST para integrações personalizadas.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/).
- **Backend**: Next.js Server Actions, [Prisma ORM](https://www.prisma.io/).
- **Banco de Dados**: PostgreSQL (via Docker ou Supabase/Neon).
- **IA / LLM**: [Ollama](https://ollama.com/) (Llama 3, Mistral, etc.) para inferência local.
- **Autenticação**: [NextAuth.js](https://next-auth.js.org/) (v5).

## 📦 Pré-requisitos

- Node.js 18+
- Docker (para banco de dados local)
- Ollama instalado e rodando (para IA local)

## 🚀 Como Rodar Localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/ai-agent-builder.git
   cd ai-agent-builder
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_agent_db"
   NEXTAUTH_SECRET="sua-chave-secreta"
   ```

4. **Inicie o banco de dados (Docker)**
   ```bash
   docker-compose up -d
   ```

5. **Execute as migrações do Prisma**
   ```bash
   npx prisma migrate dev
   ```

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

7. **Acesse a aplicação**
   Abra `http://localhost:3000` no seu navegador.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT.
