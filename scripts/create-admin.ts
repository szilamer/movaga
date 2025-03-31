const { PrismaClient } = require('@prisma/client')
const { hashPassword } = require('../src/lib/auth')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@movaga.hu'
  const adminPassword = 'Admin123!'
  const hashedPassword = await hashPassword(adminPassword)

  try {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        hashedPassword: hashedPassword,
        role: 'ADMIN',
      },
    })
    console.log('Admin user created:', admin)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 