import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Bot, MessageSquare, MoreVertical } from "lucide-react"
import { AgentActions } from "./agent-actions"

export default async function AgentsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const agents = await prisma.agent.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: {
                select: { conversations: true }
            }
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Agentes</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus agentes de IA e monitore seu desempenho.
                    </p>
                </div>
                <Link href="/agents/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agente
                    </Button>
                </Link>
            </div>

            {agents.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <Bot className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Nenhum agente criado</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Comece criando seu primeiro agente de IA personalizado para ajudar em suas tarefas.
                        </p>
                        <Link href="/agents/new">
                            <Button variant="outline">Criar Agente</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Card key={agent.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {agent.description || "Sem descrição"}
                                    </CardDescription>
                                </div>
                                <AgentActions agentId={agent.id} />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                                    <div className="flex items-center gap-1">
                                        <Bot className="h-4 w-4" />
                                        <span>{agent.model}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{agent._count.conversations} conversas</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
