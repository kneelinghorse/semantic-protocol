'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePlaygroundStore } from '@/lib/store';
import { FileCode2, Database, Code, FileJson, Table } from 'lucide-react';
import { SemanticProtocol } from '@/lib/semantic';
import toast from 'react-hot-toast';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';

const schemaTypes = [
  { id: 'prisma', label: 'Prisma', icon: Database },
  { id: 'typescript', label: 'TypeScript', icon: Code },
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'sql', label: 'SQL', icon: FileCode2 },
  { id: 'csv', label: 'CSV', icon: Table },
];

export default function SchemaInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    inputSchema,
    schemaType,
    setInputSchema,
    setSchemaType,
    setSemanticResults,
    setIsAnalyzing,
    incrementDecisions,
  } = usePlaygroundStore();

  const analyzeSchema = async () => {
    if (!inputSchema.trim()) {
      toast.error('Please enter a schema to analyze');
      return;
    }

    setIsAnalyzing(true);
    toast.loading('Analyzing your schema...', { id: 'analyzing' });

    // Simulate async analysis
    setTimeout(() => {
      try {
        const protocol = new SemanticProtocol();
        const fields = parseSchema(inputSchema, schemaType);
        const results = fields.map(field => {
          const fieldDef = { 
            name: field.name, 
            type: field.type as any 
          };
          const semantic = protocol.analyze(fieldDef, 'list');
          // Count decisions eliminated
          if (semantic.metadata.confidence > 70) {
            incrementDecisions();
          }
          return semantic;
        });

        setSemanticResults(results);
        setIsAnalyzing(false);
        toast.success(`Analyzed ${results.length} fields!`, { id: 'analyzing' });
      } catch (error) {
        toast.error('Failed to analyze schema', { id: 'analyzing' });
        setIsAnalyzing(false);
      }
    }, 1000);
  };

  const parseSchema = (schema: string, type: string) => {
    const fields: Array<{ name: string; type: string }> = [];
    
    if (type === 'prisma') {
      const lines = schema.split('\n');
      lines.forEach(line => {
        const match = line.match(/^\s*(\w+)\s+(\w+)/);
        if (match && !line.includes('model') && !line.includes('}')) {
          fields.push({ name: match[1], type: match[2] });
        }
      });
    } else if (type === 'typescript') {
      const lines = schema.split('\n');
      lines.forEach(line => {
        const match = line.match(/^\s*(\w+):\s*([^;]+)/);
        if (match) {
          fields.push({ name: match[1], type: match[2].trim() });
        }
      });
    } else if (type === 'json') {
      try {
        const parsed = JSON.parse(schema);
        Object.entries(parsed).forEach(([key, value]) => {
          fields.push({ name: key, type: typeof value });
        });
      } catch {
        toast.error('Invalid JSON');
      }
    }
    
    return fields;
  };

  useEffect(() => {
    if (textareaRef.current && inputSchema) {
      Prism.highlightElement(textareaRef.current);
    }
  }, [inputSchema, schemaType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 rounded-xl border border-zinc-800 p-6"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Input Schema</h2>
        <div className="flex gap-2">
          {schemaTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSchemaType(type.id as any)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                  ${schemaType === type.id 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={inputSchema}
          onChange={(e) => setInputSchema(e.target.value)}
          placeholder={getPlaceholder(schemaType)}
          className="w-full h-64 p-4 bg-zinc-950 text-zinc-100 font-mono text-sm rounded-lg border border-zinc-800 focus:border-violet-500 focus:outline-none resize-none"
          spellCheck={false}
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={() => {
              setInputSchema('');
              setSemanticResults([]);
            }}
            className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <motion.button
        onClick={analyzeSchema}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium rounded-lg hover:from-violet-700 hover:to-cyan-700 transition-all"
      >
        Analyze Schema ✨
      </motion.button>
    </motion.div>
  );
}

function getPlaceholder(type: string) {
  const placeholders: Record<string, string> = {
    prisma: `model User {
  id            String
  email         String
  full_name     String
  date_of_birth DateTime
  is_premium    Boolean
  account_balance Decimal
}`,
    typescript: `interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth: Date;
  isPremium: boolean;
  accountBalance: number;
}`,
    json: `{
  "id": "123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "isPremium": true,
  "accountBalance": 1000.00
}`,
    sql: `CREATE TABLE users (
  id VARCHAR(255),
  email VARCHAR(255),
  full_name VARCHAR(255),
  date_of_birth DATE,
  is_premium BOOLEAN,
  account_balance DECIMAL(10,2)
);`,
    csv: `id,email,full_name,date_of_birth,is_premium,account_balance
123,user@example.com,John Doe,1990-01-01,true,1000.00`
  };
  
  return placeholders[type] || placeholders.prisma;
}