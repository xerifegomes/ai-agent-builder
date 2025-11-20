import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Iniciando seed do banco de dados...")

    // Criar usuário superadmin
    const hashedPassword = await bcrypt.hash("dev@123456", 10)

    const superadmin = await prisma.user.upsert({
        where: { email: "dev@oconnector.tech" },
        update: {
            password: hashedPassword,
            role: "SUPERADMIN",
            name: "Super Admin",
        },
        create: {
            email: "dev@oconnector.tech",
            password: hashedPassword,
            role: "SUPERADMIN",
            name: "Super Admin",
        },
    })

    console.log("✅ Superadmin criado:", superadmin.email)
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
