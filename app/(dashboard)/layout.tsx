import Link from "next/link"
import { Bot, LayoutDashboard, Settings, Plug, BookOpen, Cpu, Database, Brain, HardDrive, LogOut } from "lucide-react"
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"

export const runtime = 'nodejs'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-900 text-white p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Bot className="h-8 w-8 text-blue-400" />
          <h1 className="text-xl font-bold">AgentBuilder</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/agents/new" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Bot className="h-5 w-5" />
            Novo Agente
          </Link>
          <Link href="/ollama" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Cpu className="h-5 w-5" />
            Chat Ollama
          </Link>
          <Link href="/rag" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Database className="h-5 w-5" />
            Sistema RAG
          </Link>
          <Link href="/memory" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <HardDrive className="h-5 w-5" />
            Sistema de Memória
          </Link>
          <Link href="/ml" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Brain className="h-5 w-5" />
            ML & LoRA
          </Link>
          <Link href="/integrations" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Plug className="h-5 w-5" />
            Integrações
          </Link>
          <Link href="/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium">{session.user.name || 'Usuário'}</p>
                <p className="text-xs text-gray-400">{session.user.email}</p>
              </div>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <button
                type="submit"
                className="text-gray-400 hover:text-white transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
