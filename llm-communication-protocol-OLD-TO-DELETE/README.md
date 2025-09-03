# LLM Communication Protocol

A semantic protocol system that allows multiple LLMs (Claude, GPT, Gemini) to communicate while preserving meaning and preventing degradation across exchanges.

## Problem Solved

When LLMs communicate through pure text, meaning degrades like a game of telephone. Each exchange loses nuance and accumulates errors. This protocol preserves semantic structure, confidence levels, and uncertainty across LLM exchanges.

## Features

- **Semantic Preservation**: Maintains meaning integrity across multiple exchanges
- **Multi-LLM Support**: Works with Claude, GPT, and Gemini
- **Confidence Tracking**: Preserves and tracks confidence levels
- **Convergence Detection**: Identifies when LLMs reach consensus
- **Strength-Based Routing**: Leverages each LLM's unique capabilities
- **Semantic Drift Monitoring**: Detects and alerts on meaning degradation

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd llm-communication-protocol

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Basic Usage

```javascript
const ConversationManager = require('./conversation-manager');

// Initialize manager
const manager = new ConversationManager({
  maxRounds: 5,
  convergenceThreshold: 0.85
});

// Set up LLM clients
const participants = [
  { name: 'claude', client: new ClaudeClient(apiKey) },
  { name: 'gpt', client: new GPTClient(apiKey) }
];

// Start discussion
const result = await manager.facilitateDiscussion(
  "What are the implications of quantum computing?",
  participants
);

console.log('Consensus reached:', result.finalConsensus);
```

### Run Demo

```bash
# Run with mock clients (no API keys needed)
npm start

# Run with real APIs (requires .env configuration)
node demo.js
```

## Architecture

### Core Components

1. **message-format.js**: Standardized semantic message structure
   - SemanticMessage class for structured communication
   - MessageFormatter for LLM-specific formatting
   - Semantic comparison and validation

2. **llm-protocol.js**: Protocol handler and semantic extraction
   - Semantic extraction from natural language
   - LLM strength profiling and routing
   - Degradation measurement
   - Convergence detection

3. **conversation-manager.js**: Multi-LLM orchestration
   - Conversation lifecycle management
   - Round-robin and strategic messaging
   - Consensus synthesis
   - Event-driven architecture

## Message Structure

```javascript
{
  id: "msg_123",
  source: "claude",
  target: "gpt",
  content: {
    text: "Natural language message",
    semantics: { /* Extracted semantic structure */ },
    intents: [ /* Identified intents */ ],
    entities: [ /* Extracted entities */ ],
    concepts: [ /* Key concepts */ ],
    confidence: { /* Confidence scores */ }
  },
  metadata: {
    conversationId: "conv_456",
    uncertainty: { /* Areas of uncertainty */ },
    routing: { /* Routing preferences */ }
  }
}
```

## LLM Strength Profiles

The protocol leverages each LLM's strengths:

- **Claude**: Complex analysis, nuanced understanding, technical tasks
- **GPT**: Creative tasks, brainstorming, general conversation
- **Gemini**: Multimodal tasks, factual queries, structured data

## Event System

The ConversationManager emits events for monitoring:

```javascript
manager.on('conversation:created', ({ conversationId }) => {});
manager.on('round:started', ({ round }) => {});
manager.on('message:sent', ({ from, to, round }) => {});
manager.on('conversation:converged', ({ consensus }) => {});
manager.on('semantic:drift:critical', ({ drift }) => {});
```

## API Reference

### ConversationManager

```javascript
// Create conversation
const conversationId = manager.createConversation();

// Add participants
manager.addParticipant(conversationId, 'claude', claudeClient);

// Start conversation
const result = await manager.startConversation(
  conversationId,
  "Initial prompt",
  { maxRounds: 5 }
);

// Facilitate discussion (shorthand)
const discussion = await manager.facilitateDiscussion(
  "Topic",
  participants,
  config
);

// Mediate debate
const debate = await manager.mediateDebate(
  "Proposition",
  proClient,
  conClient
);

// Export conversation
const markdown = manager.exportConversation(conversationId, 'markdown');
```

### SemanticMessage

```javascript
// Create message
const message = new SemanticMessage({
  source: 'claude',
  content: { text: "Message text" }
});

// Add semantic fields
message.addIntent({ name: 'analysis', confidence: 0.9 });
message.addEntity({ text: 'AI', type: 'technology', value: 'artificial_intelligence' });
message.addConcept({ name: 'ethics', type: 'domain' });

// Compare semantics
const similarity = message1.compareSemantics(message2);

// Validate integrity
const validation = message.validateSemanticIntegrity();
```

## Configuration

Environment variables (.env):

```bash
# API Keys
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key

# Protocol Settings
MAX_ROUNDS=10
CONVERGENCE_THRESHOLD=0.85
SEMANTIC_THRESHOLD=0.70
TIMEOUT_PER_ROUND=60000
```

## Examples

### Two LLMs Discussing

```javascript
const result = await manager.facilitateDiscussion(
  "How can we solve climate change?",
  [
    { name: 'claude', client: claudeClient },
    { name: 'gpt', client: gptClient }
  ],
  { maxRounds: 6 }
);
```

### Structured Debate

```javascript
const debate = await manager.mediateDebate(
  "AI will replace most human jobs",
  claudeClient,  // Argues in favor
  gptClient,     // Argues against
  { maxRounds: 4 }
);

console.log('Winner:', debate.winner);
```

### Monitor Semantic Drift

```javascript
manager.on('semantic:drift:critical', ({ conversationId, drift }) => {
  console.log(`Critical drift detected: ${drift.value}`);
  // Take corrective action
});
```

## Success Metrics

The protocol successfully:

1. **Preserves Meaning**: >70% semantic similarity after 5 rounds
2. **Detects Convergence**: Identifies when LLMs reach consensus
3. **Prevents Degradation**: Alerts on critical semantic drift
4. **Leverages Strengths**: Routes tasks to appropriate LLMs

## Development

```bash
# Install dev dependencies
npm install --save-dev

# Run in development mode
npm run dev

# Run tests
npm test
```

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Semantic integrity is maintained
- All LLM clients follow the standard interface
- Tests pass for new features
- Documentation is updated