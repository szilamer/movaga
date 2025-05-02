const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('Ellenőrzöm a rendeléseket barionPaymentId alapján...');
    
    // Keresés barionPaymentId alapján
    const ordersWithBarionId = await prisma.order.findMany({
      where: {
        barionPaymentId: {
          not: null
        }
      }
    });
    
    console.log(`Találtam ${ordersWithBarionId.length} rendelést barionPaymentId-val:`);
    
    if (ordersWithBarionId.length > 0) {
      ordersWithBarionId.forEach(order => {
        console.log(`ID: ${order.id}`);
        console.log(`Státusz: ${order.status}`);
        console.log(`BarionPaymentId: ${order.barionPaymentId}`);
        console.log(`Létrehozva: ${order.createdAt}`);
        console.log(`Módosítva: ${order.updatedAt}`);
        console.log('-------------------');
      });
    }
    
    // Legutóbbi 5 rendelés ellenőrzése
    console.log('\nLegutóbbi 5 rendelés:');
    const recentOrders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    recentOrders.forEach(order => {
      console.log(`ID: ${order.id}`);
      console.log(`Státusz: ${order.status}`);
      console.log(`BarionPaymentId: ${order.barionPaymentId || 'nincs'}`);
      console.log(`Létrehozva: ${order.createdAt}`);
      console.log(`Módosítva: ${order.updatedAt}`);
      console.log('-------------------');
    });
    
  } catch (error) {
    console.error('Hiba történt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders(); 