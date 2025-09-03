#!/usr/bin/env node

import { SemanticProtocol, DataType } from './semantic-protocol';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const protocol = new SemanticProtocol();

// Simple CLI for semantic-protocol
const args = process.argv.slice(2);
const command = args[0];

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
);

if (!command || command === '--help' || command === '-h') {
  console.log(`
Semantic Protocol CLI v${packageJson.version}
Teaching software to understand itself

Usage:
  semantic-protocol <field_name:type> [context]
  semantic-protocol --version
  semantic-protocol --help

Examples:
  semantic-protocol user_email:string
  semantic-protocol account_balance:decimal list
  semantic-protocol created_at:timestamp detail

Contexts: list, detail, form, timeline (default: list)
`);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(packageJson.version);
  process.exit(0);
}

// Parse field input
try {
  const [fieldInput, context = 'list'] = args;
  let field;
  
  // Parse field format
  if (fieldInput.includes(':')) {
    const [name, type = 'string'] = fieldInput.split(':');
    field = { name, type: type as DataType };
  } else {
    field = { name: fieldInput, type: 'string' as DataType };
  }
  
  // Analyze the field
  const analysis = protocol.analyze(field, context as any);
  
  // Output results
  console.log(`\nField: ${field.name}`);
  console.log(`Type: ${field.type}`);
  console.log(`Context: ${context}`);
  console.log('\nSemantic Matches:');
  
  if (analysis.semantics && analysis.semantics.length > 0) {
    analysis.semantics.forEach((match: any) => {
      const semantic = match.semantic;
      console.log(`  ${semantic}: ${match.confidence}%`);
    });
  } else {
    console.log('  No semantic matches found');
  }
  
  if (analysis.bestMatch) {
    const semantic = analysis.bestMatch.semantic;
    console.log(`\nBest Match: ${semantic} (${analysis.bestMatch.confidence}%)`);
  }
  
  if (analysis.renderInstruction) {
    console.log('\nSuggested Rendering:');
    console.log(`  Component: ${analysis.renderInstruction.component}`);
    if (analysis.renderInstruction.variant) {
      console.log(`  Variant: ${analysis.renderInstruction.variant}`);
    }
    if (analysis.renderInstruction.props && Object.keys(analysis.renderInstruction.props).length > 0) {
      console.log(`  Props: ${JSON.stringify(analysis.renderInstruction.props)}`);
    }
  }
  
  console.log('');
} catch (error) {
  console.error('Error:', (error as Error).message);
  process.exit(1);
}