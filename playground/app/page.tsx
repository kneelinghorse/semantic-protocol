'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaygroundStore } from '@/lib/store';
import SchemaInput from '@/components/SchemaInput';
import { SemanticAnalyzer } from '@/components/SemanticAnalyzer';
import { ConfidenceMeters } from '@/components/ConfidenceMeters';
import { RenderPreview } from '@/components/RenderPreview';
import { CodeGenerator } from '@/components/CodeGenerator';
import { MissionMode } from '@/components/MissionMode';
import { SharePanel } from '@/components/SharePanel';
import { SchemaGallery } from '@/components/SchemaGallery';
import { Sparkles, Zap, Code2, Brain, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlaygroundPage() {
  const [mounted, setMounted] = useState(false);
  const [schemasAnalyzed, setSchemasAnalyzed] = useState(14247);
  const { 
    decisionsEliminated, 
    showMissionMode, 
    toggleMissionMode,
    semanticResults 
  } = usePlaygroundStore();

  useEffect(() => {
    setMounted(true);
    // Simulate counter
    const interval = setInterval(() => {
      setSchemasAnalyzed(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-cyan-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-violet-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Semantic Protocol Playground
              </h1>
              <Sparkles className="w-8 h-8 text-cyan-500" />
            </div>
            <p className="text-xl text-zinc-400 mb-8">
              Stop Guessing Which Component to Use
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <motion.div 
                className="flex items-center gap-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-zinc-300">
                  <span className="font-bold text-yellow-500">{schemasAnalyzed.toLocaleString()}</span> schemas analyzed today
                </span>
              </motion.div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-zinc-300">
                  <span className="font-bold text-purple-500">{decisionsEliminated.toLocaleString()}</span> decisions eliminated
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Mission Mode Toggle */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex justify-end">
          <button
            onClick={toggleMissionMode}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Rocket className="w-4 h-4" />
            {showMissionMode ? 'Hide' : 'Show'} Mission Mode
          </button>
        </div>
      </div>

      {/* Main Playground */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <SchemaInput />
            <SchemaGallery />
            {showMissionMode && <MissionMode />}
          </div>

          {/* Right Column - Analysis */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {semanticResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <SemanticAnalyzer />
                  <ConfidenceMeters />
                  <RenderPreview />
                  <CodeGenerator />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Share Panel */}
        {semanticResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <SharePanel />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Code2 className="w-4 h-4" />
              Built with Claude Code
            </div>
            <div className="flex gap-6">
              <a href="https://github.com/your-repo" className="text-sm text-zinc-400 hover:text-zinc-200">
                GitHub
              </a>
              <a href="https://npmjs.com/package/semantic-protocol" className="text-sm text-zinc-400 hover:text-zinc-200">
                NPM Package
              </a>
              <a href="#" className="text-sm text-zinc-400 hover:text-zinc-200">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}