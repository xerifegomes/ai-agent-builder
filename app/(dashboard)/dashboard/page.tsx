import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MessageSquare, Settings } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

async function getAgents() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const agents = await prisma.agent.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      conversations: {
        include: {
          messages: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description || 'Sem descrição',
    status: agent.isPublic ? 'Público' : 'Privado',
    interactions: agent.conversations.reduce((acc, conv) => acc + conv.messages.length, 0)
  }))
}

export default async function DashboardPage() {
  const agents = await getAgents()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-500">Gerencie seus agentes de IA e monitore seu desempenho.</p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Criar Agente
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${agent.status === 'Público' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
                }`}>
                {agent.status}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.interactions}</div>
              <p className="text-xs text-gray-500">Total de interações</p>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Settings className="mr-2 h-4 w-4" /> Configurar
                </Button>
              </Link>
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <MessageSquare className="mr-2 h-4 w-4" /> Conversar
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        <Card className="flex flex-col items-center justify-center border-dashed border-2 shadow-none bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer min-h-[200px]">
          <Link href="/agents/new" className="flex flex-col items-center justify-center w-full h-full p-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Criar Novo Agente</h3>
            <p className="text-sm text-gray-500 text-center mt-1">Comece a construir um assistente de IA personalizado</p>
          </Link>
        </Card>
      </div>
    </div>
  )
}
