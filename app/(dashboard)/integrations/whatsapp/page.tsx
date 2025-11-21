"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Smartphone, CheckCircle2, LogOut, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function WhatsAppIntegrationPage() {
    const router = useRouter()
    const [status, setStatus] = useState<string>('loading')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/integrations/whatsapp')
            const data = await response.json()
            setStatus(data.status)
            setQrCode(data.qr || null)
        } catch (error) {
            console.error('Failed to fetch status:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 3000)
        return () => clearInterval(interval)
    }, [])

    const handleDisconnect = async () => {
        if (!confirm("Tem certeza que deseja desconectar?")) return

        try {
            setLoading(true)
            await fetch('/api/integrations/whatsapp', { method: 'DELETE' })
            await fetchStatus()
        } catch (error) {
            console.error('Failed to disconnect:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/integrations">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">WhatsApp Web</h2>
                    <p className="text-gray-500">Conecte seu agente via QR Code</p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-green-600" />
                        Status da Conexão
                    </CardTitle>
                    <CardDescription>
                        Escaneie o QR Code com seu aplicativo do WhatsApp para conectar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
                    {loading && status === 'loading' ? (
                        <div className="flex flex-col items-center text-gray-500">
                            <Loader2 className="h-12 w-12 animate-spin mb-4 text-green-600" />
                            <p>Iniciando serviço do WhatsApp...</p>
                        </div>
                    ) : status === 'connected' ? (
                        <div className="flex flex-col items-center text-green-600">
                            <div className="bg-green-100 p-4 rounded-full mb-4">
                                <CheckCircle2 className="h-16 w-16" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Conectado com Sucesso!</h3>
                            <p className="text-gray-600 text-center max-w-sm mb-6">
                                Seu agente agora está respondendo automaticamente às mensagens recebidas neste número.
                            </p>
                            <Button variant="destructive" onClick={handleDisconnect}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Desconectar
                            </Button>
                        </div>
                    ) : status === 'waiting_for_scan' && qrCode ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-lg shadow-lg border mb-6">
                                <Image
                                    src={qrCode}
                                    alt="WhatsApp QR Code"
                                    width={256}
                                    height={256}
                                    className="w-64 h-64"
                                />
                            </div>
                            <div className="text-center space-y-2 text-sm text-gray-600">
                                <p>1. Abra o WhatsApp no seu celular</p>
                                <p>2. Toque em Menu ou Configurações e selecione <b>Aparelhos Conectados</b></p>
                                <p>3. Toque em <b>Conectar um aparelho</b></p>
                                <p>4. Aponte seu celular para esta tela para capturar o código</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <Loader2 className="h-12 w-12 animate-spin mb-4" />
                            <p>Gerando QR Code...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
