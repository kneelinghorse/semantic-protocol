#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const command = process.argv[2];

if (command === 'generate') {
  console.log('🔍 Analyzing Prisma schema for semantic patterns...');
  
  // Run prisma generate with our generator
  exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
} else if (command === 'init') {
  // Add generator to schema.prisma
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: prisma/schema.prisma not found');
    console.log('Run this command in a project with Prisma initialized');
    process.exit(1);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  if (schema.includes('prisma-semantic-generator')) {
    console.log('✅ Semantic generator already configured');
    return;
  }
  
  const generatorBlock = `
generator semantic {
  provider = "prisma-semantic-generator"
  output   = "./generated/semantic"
}
`;
  
  // Add after the client generator
  const updatedSchema = schema.replace(
    /(generator\s+client\s*{[^}]+})/,
    `$1\n${generatorBlock}`
  );
  
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log('✅ Added semantic generator to schema.prisma');
  console.log('Run "npx prisma generate" to generate semantic mappings');
} else {
  console.log(`
Prisma Semantic Generator CLI

Usage:
  prisma-semantic init      Add generator to your schema.prisma
  prisma-semantic generate  Generate semantic mappings

Examples:
  npx prisma-semantic init
  npx prisma generate       (after init)
  `);
}