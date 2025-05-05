require('dotenv').config();
const { execSync } = require('child_process');

console.log('Seeding email templates...');

try {
  // Execute the seed script with appropriate TypeScript config
  execSync('npx ts-node --transpile-only --compiler-options \'{"module":"CommonJS"}\' prisma/seed-email-templates.ts', { 
    stdio: 'inherit' 
  });
  
  console.log('Email templates seeded successfully');
} catch (error) {
  console.error('Error seeding email templates:', error);
  process.exit(1);
} 