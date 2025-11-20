import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Slack, Globe, Code, Plug } from "lucide-react"

export default function IntegrationsPage() {
  const integrations = [
    {
      id: "discord",
      name: "Discord",
      description: "Conecte seu agente a um bot do Discord para interagir com usuários em canais.",
      icon: <MessageCircle className="h-8 w-8 text-indigo-500" />,
      connected: false,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Adicione seu agente aos workspaces do Slack para suporte interno da equipe.",
      icon: <Slack className="h-8 w-8 text-pink-500" />,
      connected: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Implante seu agente na API do WhatsApp Business.",
      icon: <MessageCircle className="h-8 w-8 text-green-500" />,
      connected: false,
    },
    {
      id: "telegram",
      name: "Telegram",
      description: "Crie um bot do Telegram alimentado pelo seu agente de IA.",
      icon: <MessageCircle className="h-8 w-8 text-blue-400" />,
      connected: false,
    },
    {
      id: "api",
      name: "REST API",
      description: "Acesse seu agente programaticamente via API REST padrão.",
      icon: <Code className="h-8 w-8 text-gray-600" />,
      connected: true,
    },
    {
      id: "web",
      name: "Widget Web",
      description: "Incorpore um widget de chat diretamente no seu site.",
      icon: <Globe className="h-8 w-8 text-blue-600" />,
      connected: true,
    },
    {
      id: "webhook",
      name: "Webhook Personalizado",
      description: "Conecte-se a qualquer plataforma via webhooks de entrada/saída.",
      icon: <Plug className="h-8 w-8 text-purple-600" />,
      connected: false,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrações</h2>
        <p className="text-gray-500">Conecte seus agentes de IA às plataformas onde seus usuários estão.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="flex flex-row items-start space-x-4 pb-2">
              <div className="bg-gray-100 p-2 rounded-lg">
                {integration.icon}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">{integration.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="min-h-[60px]">{integration.description}</CardDescription>
            </CardContent>
            <CardFooter>
              {integration.connected ? (
                <Button variant="outline" className="w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
                  Conectado
                </Button>
              ) : (
                <Button className="w-full">Conectar</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
