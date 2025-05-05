// Próbáljuk betölteni a bcrypt-et, ha nem sikerül, használjuk az auth.ts-ben lévő hashPassword függvényt
let hashPassword;
try {
  const { hash } = require('bcrypt');
  const SALT_ROUNDS = 10;
  hashPassword = async (password) => await hash(password, SALT_ROUNDS);
  console.log('Using bcrypt for password hashing');
} catch (error) {
  // Ha a bcrypt nem elérhető, használjuk a saját SHA-256 implementációt
  console.log('bcrypt not available, using built-in hash function');
  const { hashPassword: authHashPassword } = require('../src/lib/auth/auth');
  hashPassword = authHashPassword;
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Szuperadmin felhasználó létrehozása vagy frissítése
  const superadminEmail = 'admin@movaga.hu';
  const existingSuperadmin = await prisma.user.findUnique({
    where: { email: superadminEmail }
  });

  const hashedPassword = await hashPassword('Admin123!');

  if (existingSuperadmin) {
    // Ha létezik, frissítjük a szerepkörét és jelszavát
    await prisma.user.update({
      where: { email: superadminEmail },
      data: {
        role: 'SUPERADMIN',
        hashedPassword: hashedPassword
      }
    });
    console.log('Szuperadmin felhasználó frissítve');
  } else {
    // Ha nem létezik, létrehozzuk
    await prisma.user.create({
      data: {
        email: superadminEmail,
        name: 'Admin',
        hashedPassword: hashedPassword,
        role: 'SUPERADMIN'
      }
    });
    console.log('Szuperadmin felhasználó létrehozva');
  }

  // Teszt kategória létrehozása vagy frissítése
  const testCategorySlug = 'teszt-kategoria';
  const existingCategory = await prisma.category.findUnique({
    where: { slug: testCategorySlug }
  });

  if (existingCategory) {
    await prisma.category.update({
      where: { slug: testCategorySlug },
      data: {
        name: 'Teszt kategória',
        description: 'Ez egy teszt kategória'
      }
    });
    console.log('Teszt kategória frissítve');
  } else {
    await prisma.category.create({
      data: {
        name: 'Teszt kategória',
        description: 'Ez egy teszt kategória',
        slug: testCategorySlug
      }
    });
    console.log('Teszt kategória létrehozva');
  }

  // Find or create email templates
  const emailTemplates = [
    {
      name: 'Rendelés függőben',
      subject: 'Köszönjük a rendelésed! ({{orderNumber}})',
      content: `
        <h1>Köszönjük a rendelésed!</h1>
        <p>A rendelésedet sikeresen rögzítettük.</p>
        
        <h2>Rendelés részletei:</h2>
        <p>Rendelés azonosító: {{orderNumber}}</p>
        <p>Végösszeg: {{total}}</p>
        <p>Szállítási mód: {{shippingMethod}}</p>
        <p>Fizetési mód: {{paymentMethod}}</p>
        
        <p>Kérjük, végezd el a fizetést a megadott módon.</p>
        
        <p>Üdvözlettel,<br>MOVAGA csapata</p>
      `,
      triggerStatus: 'PENDING',
      isActive: true,
    },
    {
      name: 'Rendelés feldolgozás alatt',
      subject: 'A rendelésed feldolgozás alatt van ({{orderNumber}})',
      content: `
        <h1>A rendelésed feldolgozás alatt!</h1>
        <p>Megkaptuk a fizetésedet, a rendelésed feldolgozás alatt áll.</p>
        
        <h2>Rendelés részletei:</h2>
        <p>Rendelés azonosító: {{orderNumber}}</p>
        <p>Végösszeg: {{total}}</p>
        <p>Szállítási mód: {{shippingMethod}}</p>
        <p>Fizetési mód: {{paymentMethod}}</p>
        
        <p>Hamarosan megkezdjük a szállítás szervezését. Amint a rendelésed kiszállításra kerül, újabb értesítést küldünk.</p>
        
        <p>Üdvözlettel,<br>MOVAGA csapata</p>
      `,
      triggerStatus: 'PROCESSING',
      isActive: true,
    },
    {
      name: 'Rendelés kiszállítva',
      subject: 'A rendelésed útnak indult! ({{orderNumber}})',
      content: `
        <h1>A rendelésed útnak indult!</h1>
        <p>A rendelésedet átadtuk a szállító partnerünknek.</p>
        
        <h2>Rendelés részletei:</h2>
        <p>Rendelés azonosító: {{orderNumber}}</p>
        <p>Végösszeg: {{total}}</p>
        <p>Szállítási mód: {{shippingMethod}}</p>
        <p>Fizetési mód: {{paymentMethod}}</p>
        
        <p>A csomagot hamarosan kézbesíteni fogják a megadott szállítási címre.</p>
        
        <p>Üdvözlettel,<br>MOVAGA csapata</p>
      `,
      triggerStatus: 'SHIPPED',
      isActive: true,
    },
    {
      name: 'Rendelés teljesítve',
      subject: 'A rendelésed teljesítve! ({{orderNumber}})',
      content: `
        <h1>A rendelésed teljesítve!</h1>
        <p>A rendelésedet sikeresen kézbesítettük.</p>
        
        <h2>Rendelés részletei:</h2>
        <p>Rendelés azonosító: {{orderNumber}}</p>
        <p>Végösszeg: {{total}}</p>
        <p>Szállítási mód: {{shippingMethod}}</p>
        <p>Fizetési mód: {{paymentMethod}}</p>
        
        <p>Köszönjük, hogy a MOVAGA termékeit választottad! Reméljük, elégedett vagy a termékekkel.</p>
        
        <p>Üdvözlettel,<br>MOVAGA csapata</p>
      `,
      triggerStatus: 'COMPLETED',
      isActive: true,
    },
    {
      name: 'Rendelés törölve',
      subject: 'A rendelésed törölve lett ({{orderNumber}})',
      content: `
        <h1>A rendelésed törölve lett</h1>
        <p>Sajnálattal tájékoztatunk, hogy a rendelésedet törölnünk kellett.</p>
        
        <h2>Rendelés részletei:</h2>
        <p>Rendelés azonosító: {{orderNumber}}</p>
        <p>Végösszeg: {{total}}</p>
        
        <p>Ha kérdésed van a törlés okáról, kérjük, vedd fel velünk a kapcsolatot.</p>
        
        <p>Üdvözlettel,<br>MOVAGA csapata</p>
      `,
      triggerStatus: 'CANCELLED',
      isActive: true,
    },
  ];

  for (const template of emailTemplates) {
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        triggerStatus: template.triggerStatus,
      },
    });

    if (!existingTemplate) {
      await prisma.emailTemplate.create({
        data: template,
      });
      console.log(`Created email template for status: ${template.triggerStatus}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })