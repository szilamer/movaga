import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding email templates...');

  // Define the templates for different order statuses
  const templates = [
    {
      name: 'Order Confirmation',
      subject: 'Rendelés visszaigazolás - Movaga #{{orderNumber}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Köszönjük a rendelésed!</h2>
          <p>Kedves Vásárlónk!</p>
          <p>Köszönjük a rendelésedet a Movaga webáruházból. A rendelésed feldolgozás alatt áll.</p>
          <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
          <p><strong>Végösszeg:</strong> {{total}}</p>
          <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
          <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
          <p>Hamarosan értesítünk a rendelésed állapotának változásáról.</p>
          <p>Üdvözlettel,<br>A Movaga csapata</p>
        </div>
      `,
      triggerStatus: 'PENDING',
      isActive: true,
    },
    {
      name: 'Order Processing',
      subject: 'Rendelésed feldolgozás alatt - Movaga #{{orderNumber}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Rendelésed feldolgozás alatt</h2>
          <p>Kedves Vásárlónk!</p>
          <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed feldolgozása megkezdődött.</p>
          <p>A csapatunk éppen azon dolgozik, hogy a terméke(i)d a lehető leghamarabb becsomagolásra kerüljenek.</p>
          <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
          <p><strong>Végösszeg:</strong> {{total}}</p>
          <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
          <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
          <p>Amint a rendelésed feladásra kerül, újabb értesítést küldünk.</p>
          <p>Üdvözlettel,<br>A Movaga csapata</p>
        </div>
      `,
      triggerStatus: 'PROCESSING',
      isActive: true,
    },
    {
      name: 'Order Shipped',
      subject: 'Rendelésed kiszállítás alatt - Movaga #{{orderNumber}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Rendelésed úton van!</h2>
          <p>Kedves Vásárlónk!</p>
          <p>Örömmel értesítünk, hogy a #{{orderNumber}} számú rendelésed feladásra került és jelenleg úton van hozzád.</p>
          <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
          <p><strong>Végösszeg:</strong> {{total}}</p>
          <p><strong>Szállítási mód:</strong> {{shippingMethod}}</p>
          <p><strong>Fizetési mód:</strong> {{paymentMethod}}</p>
          <p>Hamarosan megérkezik a rendelésed a megadott címre.</p>
          <p>Köszönjük a türelmed!</p>
          <p>Üdvözlettel,<br>A Movaga csapata</p>
        </div>
      `,
      triggerStatus: 'SHIPPED',
      isActive: true,
    },
    {
      name: 'Order Completed',
      subject: 'Rendelésed teljesítve - Movaga #{{orderNumber}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Rendelésed sikeresen teljesítve!</h2>
          <p>Kedves Vásárlónk!</p>
          <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed sikeresen teljesítve lett.</p>
          <p>Reméljük, hogy elégedett vagy a termékekkel és a szolgáltatásunkkal!</p>
          <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
          <p><strong>Végösszeg:</strong> {{total}}</p>
          <p>Köszönjük, hogy a Movaga webáruházát választottad, és várjuk, hogy újra vásárolj nálunk!</p>
          <p>Üdvözlettel,<br>A Movaga csapata</p>
        </div>
      `,
      triggerStatus: 'COMPLETED',
      isActive: true,
    },
    {
      name: 'Order Cancelled',
      subject: 'Rendelésed törölve - Movaga #{{orderNumber}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333;">Rendelésed törölve lett</h2>
          <p>Kedves Vásárlónk!</p>
          <p>Értesítünk, hogy a #{{orderNumber}} számú rendelésed törölve lett.</p>
          <p>Ha nem te kérted a törlést, vagy bármilyen kérdésed van ezzel kapcsolatban, kérjük, vedd fel velünk a kapcsolatot az info@movaga.hu email címen.</p>
          <p><strong>Rendelés azonosító:</strong> #{{orderNumber}}</p>
          <p><strong>Végösszeg:</strong> {{total}}</p>
          <p>Üdvözlettel,<br>A Movaga csapata</p>
        </div>
      `,
      triggerStatus: 'CANCELLED',
      isActive: true,
    },
  ];

  // Create the templates if they don't exist
  for (const template of templates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        triggerStatus: template.triggerStatus,
      },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: template,
      });
      console.log(`Created email template: ${template.name}`);
    } else {
      console.log(`Email template already exists for status: ${template.triggerStatus}`);
    }
  }

  console.log('Email templates seeding completed');
}

main()
  .catch((e) => {
    console.error('Error seeding email templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 