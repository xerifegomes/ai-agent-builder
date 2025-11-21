import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Trigger connection if disconnected
        const status = whatsappService.getStatus()
        if (status.status === 'disconnected') {
            whatsappService.connect()
        }

        return NextResponse.json(whatsappService.getStatus())
    } catch (error) {
        console.error('Failed to get WhatsApp status:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await whatsappService.disconnect()
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to disconnect WhatsApp:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
