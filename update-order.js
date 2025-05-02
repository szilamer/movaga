const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOrder() {
  try {
    console.log('Rendelés frissítése...');
    
    // A frissítendő rendelés azonosítója
    const orderId = 'cma5im9e30002vr3jf1bg8ynh';
    
    // Állapot frissítése
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' }
    });
    
    console.log('Rendelés sikeresen frissítve:');
    console.log(`ID: ${updatedOrder.id}`);
    console.log(`Státusz: ${updatedOrder.status}`);
    console.log(`BarionPaymentId: ${updatedOrder.barionPaymentId}`);
    console.log(`Módosítva: ${updatedOrder.updatedAt}`);
  } catch (error) {
    console.error('Hiba történt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrder(); 