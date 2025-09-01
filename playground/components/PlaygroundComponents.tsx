'use client';

import { motion } from 'framer-motion';
import { usePlaygroundStore } from '@/lib/store';
import { 
  Sparkles, Copy, Check, Mail, Calendar, DollarSign, 
  Star, Hash, Globe, Phone, MapPin, User, Shield,
  Database, Code, Zap, Brain
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { analyzeMission } from '@/lib/mission';

// Semantic Analyzer Component
export function SemanticAnalyzer() {
  const { semanticResults } = usePlaygroundStore();
  
  if (!semanticResults.length) return null;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h3 className="text-lg font-semibold mb-4">Semantic Analysis</h3>
      <div className="space-y-3">
        {semanticResults.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getSemanticIcon(result.semantic_type || 'unknown')}
              <div>
                <div className="font-mono text-sm">{result.field || 'unknown'}</div>
                <div className="text-xs text-zinc-500">{result.dataType || 'unknown'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{result.semantic_type || 'unknown'}</div>
              <div className="text-xs text-zinc-500">{result.confidence}% confidence</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Confidence Meters Component
export function ConfidenceMeters() {
  const { semanticResults } = usePlaygroundStore();
  
  if (!semanticResults.length) return null;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h3 className="text-lg font-semibold mb-4">Confidence Levels</h3>
      <div className="space-y-3">
        {semanticResults.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="font-mono">{result.field || 'unknown'}</span>
              <span className={getConfidenceColor(result.confidence)}>
                {result.confidence}%
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                className={`h-full ${getConfidenceGradient(result.confidence)}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Code Generator Component
export function CodeGenerator() {
  const { semanticResults, selectedContext } = usePlaygroundStore();
  const [copied, setCopied] = useState(false);
  
  if (!semanticResults.length) return null;

  const generateCode = () => {
    return semanticResults.map(r => 
      `<SemanticField field="${r.field}" type="${r.semantic_type}" context="${selectedContext}" />`
    ).join('\n');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Generated Code</h3>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-zinc-950 rounded-lg overflow-x-auto">
        <code className="text-sm text-zinc-300 font-mono">
          {generateCode()}
        </code>
      </pre>
    </div>
  );
}

// Mission Mode Component
export function MissionMode() {
  const { inputSchema } = usePlaygroundStore();
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeMissionMode = () => {
    if (inputSchema) {
      const result = analyzeMission(inputSchema);
      setAnalysis(result);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-800/50 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-purple-300">Mission Analysis</h3>
      </div>
      
      <button
        onClick={analyzeMissionMode}
        className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
      >
        Analyze Mission Type
      </button>

      {analysis && (
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-zinc-400">Mission Type:</span>
            <span className="ml-2 text-purple-300 font-medium">{analysis.semantics.type}</span>
          </div>
          <div>
            <span className="text-zinc-400">Confidence:</span>
            <span className="ml-2 text-purple-300">{analysis.semantics.confidence}%</span>
          </div>
          <div>
            <span className="text-zinc-400">Complexity:</span>
            <span className="ml-2 text-purple-300">{analysis.semantics.complexity}</span>
          </div>
          <div>
            <span className="text-zinc-400">Est. Time:</span>
            <span className="ml-2 text-purple-300">{analysis.semantics.estimatedTime}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Schema Gallery Component
export function SchemaGallery() {
  const { setInputSchema, setSchemaType } = usePlaygroundStore();
  
  const examples = [
    {
      name: 'E-commerce',
      type: 'prisma' as const,
      schema: `model Product {
  id          String
  name        String
  price       Decimal
  sku         String
  in_stock    Boolean
  created_at  DateTime
}`
    },
    {
      name: 'User Profile',
      type: 'typescript' as const,
      schema: `interface UserProfile {
  userId: string;
  email: string;
  phoneNumber: string;
  birthDate: Date;
  isPremium: boolean;
}`
    }
  ];

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Examples</h3>
      <div className="grid grid-cols-2 gap-3">
        {examples.map(ex => (
          <button
            key={ex.name}
            onClick={() => {
              setInputSchema(ex.schema);
              setSchemaType(ex.type);
              toast.success(`Loaded ${ex.name} example`);
            }}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-all"
          >
            <div className="text-sm font-medium">{ex.name}</div>
            <div className="text-xs text-zinc-500 mt-1">{ex.type}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Stub components for missing ones
export function RenderPreview() {
  return <div />;
}

export function SharePanel() {
  return <div />;
}

// Helper functions
function getSemanticIcon(type: string | null) {
  if (!type) return <Database className="w-4 h-4 text-zinc-500" />;
  
  const icons: Record<string, any> = {
    email: <Mail className="w-4 h-4 text-blue-500" />,
    temporal: <Calendar className="w-4 h-4 text-green-500" />,
    currency: <DollarSign className="w-4 h-4 text-yellow-500" />,
    premium: <Star className="w-4 h-4 text-purple-500" />,
    identifier: <Hash className="w-4 h-4 text-gray-500" />,
    url: <Globe className="w-4 h-4 text-cyan-500" />,
    phone: <Phone className="w-4 h-4 text-orange-500" />,
    address: <MapPin className="w-4 h-4 text-red-500" />,
    name: <User className="w-4 h-4 text-indigo-500" />,
    status: <Shield className="w-4 h-4 text-pink-500" />,
    percentage: <Zap className="w-4 h-4 text-orange-500" />,
    danger: <Sparkles className="w-4 h-4 text-red-500" />,
    cancellation: <Code className="w-4 h-4 text-red-500" />
  };
  return icons[type] || <Database className="w-4 h-4 text-zinc-500" />;
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 90) return 'text-green-400';
  if (confidence >= 70) return 'text-blue-400';
  if (confidence >= 50) return 'text-yellow-400';
  return 'text-zinc-400';
}

function getConfidenceGradient(confidence: number) {
  if (confidence >= 90) return 'bg-gradient-to-r from-green-600 to-green-400';
  if (confidence >= 70) return 'bg-gradient-to-r from-blue-600 to-blue-400';
  if (confidence >= 50) return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
  return 'bg-gradient-to-r from-zinc-600 to-zinc-400';
}