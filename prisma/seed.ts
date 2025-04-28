const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()
const SALT_ROUNDS = 10

async function main() {
  // Szuperadmin felhasználó létrehozása vagy frissítése
  const superadminEmail = 'admin@movaga.hu'
  const existingSuperadmin = await prisma.user.findUnique({
    where: { email: superadminEmail }
  })

  const hashedPassword = await hash('Admin123!', SALT_ROUNDS)

  if (existingSuperadmin) {
    // Ha létezik, frissítjük a szerepkörét és jelszavát
    await prisma.user.update({
      where: { email: superadminEmail },
      data: {
        role: 'SUPERADMIN',
        hashedPassword: hashedPassword
      }
    })
    console.log('Szuperadmin felhasználó frissítve')
  } else {
    // Ha nem létezik, létrehozzuk
    await prisma.user.create({
      data: {
        email: superadminEmail,
        name: 'Admin',
        hashedPassword: hashedPassword,
        role: 'SUPERADMIN'
      }
    })
    console.log('Szuperadmin felhasználó létrehozva')
  }

  // Teszt kategória létrehozása vagy frissítése
  const testCategorySlug = 'teszt-kategoria'
  const existingCategory = await prisma.category.findUnique({
    where: { slug: testCategorySlug }
  })

  if (existingCategory) {
    await prisma.category.update({
      where: { slug: testCategorySlug },
      data: {
        name: 'Teszt kategória',
        description: 'Ez egy teszt kategória'
      }
    })
    console.log('Teszt kategória frissítve')
  } else {
    await prisma.category.create({
      data: {
        name: 'Teszt kategória',
        description: 'Ez egy teszt kategória',
        slug: testCategorySlug
      }
    })
    console.log('Teszt kategória létrehozva')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 