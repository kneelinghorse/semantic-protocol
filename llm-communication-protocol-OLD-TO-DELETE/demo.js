/**
 * Demo: Two LLMs Discussing a Topic with Semantic Preservation
 * Shows how the protocol prevents meaning degradation
 */

require('dotenv').config();
const ConversationManager = require('./conversation-manager');

// Mock LLM clients for demonstration
// In production, replace these with actual API clients
class MockClaudeClient {
  async send(message) {
    // Simulate Claude's analytical response style
    await this.simulateDelay();
    
    const response = {
      text: "From an analytical perspective, I observe that " + 
            "the topic involves complex interdependencies. " +
            "The key factors include systematic analysis, logical reasoning, " +
            "and evidence-based conclusions. Let me examine the nuances...",
      semantics: {
        primary_focus: ["analysis", "reasoning", "evidence"],
        confidence_areas: ["logical_structure", "factual_accuracy"],
        methodology: "systematic_examination"
      },
      intents: [
        { name: "analysis", confidence: 0.95, parameters: {} },
        { name: "explanation", confidence: 0.90, parameters: {} }
      ],
      entities: [
        { text: "interdependencies", type: "concept", value: "interdependencies", confidence: 0.85 },
        { text: "systematic analysis", type: "methodology", value: "systematic_analysis", confidence: 0.90 }
      ],
      confidence: {
        overall: 0.92,
        semantic_extraction: 0.88,
        intent_recognition: 0.95
      },
      reasoning: "Applied analytical framework to decompose the topic into core components"
    };
    
    return JSON.stringify(response);
  }
  
  simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
  }
}

class MockGPTClient {
  async send(message) {
    // Simulate GPT's creative response style
    await this.simulateDelay();
    
    const response = {
      text: "That's a fascinating perspective! Building on that, " +
            "we could explore creative approaches and innovative solutions. " +
            "What if we considered alternative viewpoints and novel connections? " +
            "The possibilities are quite intriguing...",
      semantics: {
        primary_focus: ["creativity", "innovation", "exploration"],
        confidence_areas: ["ideation", "connection_making"],
        methodology: "creative_synthesis"
      },
      intents: [
        { name: "creation", confidence: 0.88, parameters: {} },
        { name: "suggestion", confidence: 0.85, parameters: {} }
      ],
      entities: [
        { text: "innovative solutions", type: "concept", value: "innovation", confidence: 0.82 },
        { text: "alternative viewpoints", type: "approach", value: "alternatives", confidence: 0.80 }
      ],
      confidence: {
        overall: 0.85,
        semantic_extraction: 0.82,
        intent_recognition: 0.88
      },
      reasoning: "Synthesized creative extensions while maintaining semantic coherence"
    };
    
    return JSON.stringify(response);
  }
  
  simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
  }
}

class MockGeminiClient {
  async send(message) {
    // Simulate Gemini's balanced response style
    await this.simulateDelay();
    
    const response = {
      text: "Integrating both analytical and creative perspectives, " +
            "I see a balanced approach emerging. The data suggests " +
            "multiple valid pathways, each with distinct advantages. " +
            "Let's consider the practical implications...",
      semantics: {
        primary_focus: ["integration", "balance", "practicality"],
        confidence_areas: ["data_analysis", "multi_perspective"],
        methodology: "balanced_synthesis"
      },
      intents: [
        { name: "comparison", confidence: 0.83, parameters: {} },
        { name: "recommendation", confidence: 0.80, parameters: {} }
      ],
      entities: [
        { text: "balanced approach", type: "methodology", value: "balanced_approach", confidence: 0.85 },
        { text: "practical implications", type: "consideration", value: "practicality", confidence: 0.82 }
      ],
      confidence: {
        overall: 0.83,
        semantic_extraction: 0.80,
        intent_recognition: 0.85
      },
      reasoning: "Balanced multiple perspectives while maintaining semantic consistency"
    };
    
    return JSON.stringify(response);
  }
  
  simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
  }
}

// Real API client implementations (uncomment and configure with your API keys)
/*
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ClaudeClient {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }
  
  async send(message) {
    const response = await this.client.messages.create({
      model: 'claude-3-opus-20240229',
      messages: [message],
      max_tokens: 4096
    });
    return response.content[0].text;
  }
}

class GPTClient {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }
  
  async send(message) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [message],
      response_format: { type: "json_object" }
    });
    return response.choices[0].message.content;
  }
}

class GeminiClient {
  constructor(apiKey) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
  }
  
  async send(message) {
    const result = await this.model.generateContent(message.content);
    return result.response.text();
  }
}
*/

async function demonstrateTwoLLMDiscussion() {
  console.log('🚀 Starting LLM Communication Protocol Demo\n');
  console.log('=' . repeat(60));
  
  // Initialize conversation manager
  const manager = new ConversationManager({
    maxRounds: 5,
    convergenceThreshold: 0.80,
    enableLogging: true
  });
  
  // Set up event listeners for monitoring
  manager.on('conversation:created', ({ conversationId }) => {
    console.log(`\n📝 Conversation created: ${conversationId}`);
  });
  
  manager.on('round:started', ({ round }) => {
    console.log(`\n🔄 Round ${round} started`);
  });
  
  manager.on('message:sent', ({ from, to, round }) => {
    console.log(`  📨 Message: ${from} → ${to} (Round ${round})`);
  });
  
  manager.on('conversation:converged', ({ round, consensus }) => {
    console.log(`\n✅ Conversation converged at round ${round}!`);
    console.log(`  Agreement level: ${(consensus.agreementLevel * 100).toFixed(1)}%`);
  });
  
  manager.on('semantic:drift:critical', ({ drift }) => {
    console.log(`\n⚠️  Critical semantic drift detected: ${(drift.value * 100).toFixed(1)}%`);
  });
  
  // Demo 1: Two LLMs discussing AI Ethics
  console.log('\n' + '=' . repeat(60));
  console.log('Demo 1: Claude and GPT Discussing AI Ethics');
  console.log('=' . repeat(60));
  
  const ethicsDiscussion = await manager.facilitateDiscussion(
    "What are the key ethical considerations for deploying AI systems in healthcare?",
    [
      { name: 'claude', client: new MockClaudeClient() },
      { name: 'gpt', client: new MockGPTClient() }
    ],
    { maxRounds: 4 }
  );
  
  console.log('\n📊 Discussion Results:');
  console.log(`  Total rounds: ${ethicsDiscussion.result.totalRounds}`);
  console.log(`  Messages exchanged: ${ethicsDiscussion.result.totalMessages}`);
  console.log(`  Converged: ${ethicsDiscussion.result.converged ? 'Yes' : 'No'}`);
  
  if (ethicsDiscussion.result.finalConsensus) {
    console.log('\n🤝 Final Consensus:');
    console.log(`  Overall confidence: ${(ethicsDiscussion.result.finalConsensus.overallConfidence * 100).toFixed(1)}%`);
    console.log(`  Key concepts agreed upon:`);
    ethicsDiscussion.result.finalConsensus.concepts.forEach(concept => {
      console.log(`    - ${concept.name} (${(concept.consensus * 100).toFixed(0)}% agreement)`);
    });
  }
  
  // Demo 2: Three-way discussion about problem solving
  console.log('\n' + '=' . repeat(60));
  console.log('Demo 2: Three LLMs Solving a Complex Problem');
  console.log('=' . repeat(60));
  
  const problemSolving = await manager.facilitateDiscussion(
    "How can we design a sustainable city that balances technology, environment, and human well-being?",
    [
      { name: 'claude', client: new MockClaudeClient() },
      { name: 'gpt', client: new MockGPTClient() },
      { name: 'gemini', client: new MockGeminiClient() }
    ],
    { maxRounds: 6 }
  );
  
  console.log('\n📊 Problem-Solving Results:');
  console.log(`  Participants: ${problemSolving.result.participants.join(', ')}`);
  console.log(`  Total rounds: ${problemSolving.result.totalRounds}`);
  console.log(`  Final status: ${problemSolving.result.status}`);
  
  // Analyze semantic preservation
  if (problemSolving.result.semanticDrift && problemSolving.result.semanticDrift.length > 0) {
    const initialDrift = problemSolving.result.semanticDrift[0];
    const finalDrift = problemSolving.result.semanticDrift[problemSolving.result.semanticDrift.length - 1];
    
    console.log('\n📈 Semantic Preservation Analysis:');
    console.log(`  Initial drift: ${(initialDrift.drift.value * 100).toFixed(1)}%`);
    console.log(`  Final drift: ${(finalDrift.drift.value * 100).toFixed(1)}%`);
    console.log(`  Drift trend: ${finalDrift.drift.value < initialDrift.drift.value ? '✅ Improving' : '⚠️ Degrading'}`);
  }
  
  // Demo 3: Debate between two LLMs
  console.log('\n' + '=' . repeat(60));
  console.log('Demo 3: Structured Debate');
  console.log('=' . repeat(60));
  
  const debate = await manager.mediateDebate(
    "Remote work is more productive than office work",
    new MockClaudeClient(),  // Pro argument
    new MockGPTClient(),      // Con argument
    { maxRounds: 4 }
  );
  
  console.log('\n⚖️ Debate Results:');
  console.log(`  Proposition: "${debate.proposition}"`);
  console.log(`  Rounds: ${debate.result.totalRounds}`);
  if (debate.winner) {
    console.log(`  Winner: ${debate.winner.winner} (score: ${(debate.winner.score * 100).toFixed(1)}%)`);
  }
  
  // Export conversation for analysis
  console.log('\n' + '=' . repeat(60));
  console.log('💾 Exporting Conversations');
  console.log('=' . repeat(60));
  
  const markdown = manager.exportConversation(ethicsDiscussion.conversationId, 'markdown');
  console.log('\n📄 Sample export (first 500 chars):');
  console.log(markdown.substring(0, 500) + '...');
  
  // Cleanup
  manager.cleanupConversation(ethicsDiscussion.conversationId);
  manager.cleanupConversation(problemSolving.conversationId);
  manager.cleanupConversation(debate.conversationId);
  
  console.log('\n' + '=' . repeat(60));
  console.log('✨ Demo completed successfully!');
  console.log('=' . repeat(60));
}

// Demonstrate semantic preservation comparison
async function demonstrateSemanticPreservation() {
  console.log('\n' + '=' . repeat(60));
  console.log('🔬 Semantic Preservation Test');
  console.log('=' . repeat(60));
  
  const { SemanticMessage } = require('./message-format');
  
  // Create original message with rich semantics
  const originalMessage = new SemanticMessage({
    source: 'user',
    content: {
      text: 'AI systems must prioritize patient safety, data privacy, and equitable access.',
      intents: [
        { name: 'requirement', confidence: 0.95 },
        { name: 'ethical_consideration', confidence: 0.90 }
      ],
      entities: [
        { text: 'patient safety', type: 'concept', value: 'safety', confidence: 0.95 },
        { text: 'data privacy', type: 'concept', value: 'privacy', confidence: 0.93 },
        { text: 'equitable access', type: 'concept', value: 'equity', confidence: 0.91 }
      ],
      concepts: [
        { name: 'healthcare_ethics', type: 'domain', confidence: 0.88 },
        { name: 'ai_governance', type: 'framework', confidence: 0.85 }
      ]
    }
  });
  
  // Simulate degraded message (traditional text exchange)
  const degradedMessage = new SemanticMessage({
    source: 'llm1',
    content: {
      text: 'Yes, AI should be safe and private.',
      intents: [
        { name: 'agreement', confidence: 0.70 }
      ],
      entities: [
        { text: 'safe', type: 'quality', value: 'safety', confidence: 0.60 },
        { text: 'private', type: 'quality', value: 'privacy', confidence: 0.65 }
      ],
      concepts: []
    }
  });
  
  // Simulate preserved message (using protocol)
  const preservedMessage = new SemanticMessage({
    source: 'llm2',
    content: {
      text: 'Agreed. Patient safety remains paramount, with data privacy as a foundational requirement, while ensuring equitable access across all demographics.',
      intents: [
        { name: 'requirement', confidence: 0.92 },
        { name: 'ethical_consideration', confidence: 0.88 },
        { name: 'agreement', confidence: 0.90 }
      ],
      entities: [
        { text: 'patient safety', type: 'concept', value: 'safety', confidence: 0.94 },
        { text: 'data privacy', type: 'concept', value: 'privacy', confidence: 0.92 },
        { text: 'equitable access', type: 'concept', value: 'equity', confidence: 0.89 },
        { text: 'demographics', type: 'category', value: 'population_groups', confidence: 0.85 }
      ],
      concepts: [
        { name: 'healthcare_ethics', type: 'domain', confidence: 0.87 },
        { name: 'ai_governance', type: 'framework', confidence: 0.84 },
        { name: 'social_justice', type: 'principle', confidence: 0.82 }
      ]
    }
  });
  
  console.log('\n📊 Semantic Comparison:');
  
  const degradedComparison = originalMessage.compareSemantics(degradedMessage);
  console.log('\nTraditional Text Exchange (Degraded):');
  console.log(`  Intent preservation: ${(degradedComparison.intentOverlap * 100).toFixed(1)}%`);
  console.log(`  Entity preservation: ${(degradedComparison.entityOverlap * 100).toFixed(1)}%`);
  console.log(`  Concept preservation: ${(degradedComparison.conceptOverlap * 100).toFixed(1)}%`);
  console.log(`  Overall similarity: ${(degradedComparison.overallSimilarity * 100).toFixed(1)}%`);
  
  const preservedComparison = originalMessage.compareSemantics(preservedMessage);
  console.log('\nSemantic Protocol (Preserved):');
  console.log(`  Intent preservation: ${(preservedComparison.intentOverlap * 100).toFixed(1)}%`);
  console.log(`  Entity preservation: ${(preservedComparison.entityOverlap * 100).toFixed(1)}%`);
  console.log(`  Concept preservation: ${(preservedComparison.conceptOverlap * 100).toFixed(1)}%`);
  console.log(`  Overall similarity: ${(preservedComparison.overallSimilarity * 100).toFixed(1)}%`);
  
  const improvement = preservedComparison.overallSimilarity - degradedComparison.overallSimilarity;
  console.log(`\n🎯 Improvement: +${(improvement * 100).toFixed(1)}% semantic preservation`);
}

// Main execution
async function main() {
  try {
    // Run the main demonstration
    await demonstrateTwoLLMDiscussion();
    
    // Run semantic preservation test
    await demonstrateSemanticPreservation();
    
    console.log('\n🎉 All demonstrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during demonstration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  demonstrateTwoLLMDiscussion,
  demonstrateSemanticPreservation,
  MockClaudeClient,
  MockGPTClient,
  MockGeminiClient
};