import { create } from 'zustand';
import { AnalysisResult, RenderContext } from './semantic';
import { MissionSemantics } from './mission';

export type SchemaType = 'prisma' | 'json' | 'typescript' | 'sql' | 'csv';

interface PlaygroundStore {
  // Input state
  inputSchema: string;
  schemaType: SchemaType;

  // Analysis results
  semanticResults: AnalysisResult[];
  missionAnalysis?: MissionSemantics;

  // UI state
  selectedContext: RenderContext;
  isAnalyzing: boolean;
  showMissionMode: boolean;

  // Actions
  setInputSchema: (schema: string) => void;
  setSchemaType: (type: SchemaType) => void;
  setSemanticResults: (results: AnalysisResult[]) => void;
  setMissionAnalysis: (analysis: MissionSemantics | undefined) => void;
  setSelectedContext: (context: RenderContext) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  toggleMissionMode: () => void;

  // Stats
  decisionsEliminated: number;
  incrementDecisions: () => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  // Initial state
  inputSchema: '',
  schemaType: 'prisma',
  semanticResults: [],
  missionAnalysis: undefined,
  selectedContext: 'list',
  isAnalyzing: false,
  showMissionMode: false,
  decisionsEliminated: 0,

  // Actions
  setInputSchema: (schema) => set({ inputSchema: schema }),
  setSchemaType: (type) => set({ schemaType: type }),
  setSemanticResults: (results) => set({ semanticResults: results }),
  setMissionAnalysis: (analysis) => set({ missionAnalysis: analysis }),
  setSelectedContext: (context) => set({ selectedContext: context }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  toggleMissionMode: () => set((state) => ({ showMissionMode: !state.showMissionMode })),
  incrementDecisions: () => set((state) => ({
    decisionsEliminated: state.decisionsEliminated + 1
  }))
}));
