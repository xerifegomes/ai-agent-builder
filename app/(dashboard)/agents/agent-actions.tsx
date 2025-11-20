"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash, Loader2 } from "lucide-react"

interface AgentActionsProps {
    agentId: string
}

export function AgentActions({ agentId }: AgentActionsProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.")) {
            return
        }

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Falha ao excluir agente")
            }

            router.refresh()
        } catch (error) {
            console.error("Erro ao excluir agente:", error)
            alert("Erro ao excluir agente. Tente novamente.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <Link href={`/agents/${agentId}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash className="mr-2 h-4 w-4" />
                    )}
                    <span>Excluir</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
