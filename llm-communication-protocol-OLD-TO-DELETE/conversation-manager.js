/**
 * Conversation Manager for Multi-LLM Discussions
 * Orchestrates conversations between multiple LLMs while preserving semantics
 */

const LLMProtocol = require('./llm-protocol');
const { SemanticMessage } = require('./message-format');
const EventEmitter = require('events');

class ConversationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRounds: config.maxRounds || 10,
      convergenceThreshold: config.convergenceThreshold || 0.85,
      timeoutPerRound: config.timeoutPerRound || 60000,
      enableLogging: config.enableLogging !== false,
      ...config
    };
    
    this.protocol = new LLMProtocol(config.protocolConfig);
    this.conversations = new Map();
    this.activeConversations = new Set();
  }

  createConversation(id = null) {
    const conversationId = id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation = {
      id: conversationId,
      status: 'initialized',
      participants: new Set(),
      messages: [],
      rounds: [],
      startTime: null,
      endTime: null,
      metadata: {
        topic: null,
        initiator: null,
        convergenceHistory: [],
        semanticDrift: []
      }
    };
    
    this.conversations.set(conversationId, conversation);
    this.emit('conversation:created', { conversationId });
    
    return conversationId;
  }

  addParticipant(conversationId, llmName, llmClient) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    this.protocol.registerLLM(llmName, llmClient);
    conversation.participants.add(llmName);
    
    this.emit('participant:added', { conversationId, llmName });
  }

  async startConversation(conversationId, initialPrompt, config = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    if (conversation.participants.size < 2) {
      throw new Error('At least 2 participants required for conversation');
    }
    
    conversation.status = 'active';
    conversation.startTime = new Date().toISOString();
    conversation.metadata.topic = initialPrompt;
    this.activeConversations.add(conversationId);
    
    this.emit('conversation:started', { conversationId, initialPrompt });
    
    const semantics = await this.protocol.extractSemantics(initialPrompt, 'user');
    const initialMessage = new SemanticMessage({
      source: 'user',
      content: {
        text: initialPrompt,
        ...semantics
      },
      metadata: {
        conversationId: conversationId,
        initiator: true
      }
    });
    
    conversation.messages.push(initialMessage);
    
    try {
      await this.runConversation(conversationId, initialMessage, config);
    } catch (error) {
      this.emit('conversation:error', { conversationId, error: error.message });
      throw error;
    }
    
    return this.getConversationResult(conversationId);
  }

  async runConversation(conversationId, initialMessage, config = {}) {
    const conversation = this.conversations.get(conversationId);
    const maxRounds = config.maxRounds || this.config.maxRounds;
    
    let currentMessage = initialMessage;
    let roundCount = 0;
    let hasConverged = false;
    
    while (roundCount < maxRounds && !hasConverged) {
      roundCount++;
      
      this.emit('round:started', { conversationId, round: roundCount });
      
      const roundResult = await this.runConversationRound(
        conversationId,
        currentMessage,
        roundCount
      );
      
      conversation.rounds.push(roundResult);
      
      hasConverged = this.checkConvergence(roundResult);
      
      if (hasConverged) {
        conversation.metadata.convergenceHistory.push({
          round: roundCount,
          similarity: roundResult.convergence.similarity,
          consensus: roundResult.consensus
        });
        
        this.emit('conversation:converged', { 
          conversationId, 
          round: roundCount,
          consensus: roundResult.consensus
        });
        
        break;
      }
      
      currentMessage = this.selectNextMessage(roundResult);
      
      const drift = this.calculateSemanticDrift(conversation);
      conversation.metadata.semanticDrift.push({
        round: roundCount,
        drift: drift
      });
      
      if (drift.critical) {
        this.emit('semantic:drift:critical', { conversationId, drift });
        
        if (config.stopOnCriticalDrift) {
          break;
        }
      }
      
      this.emit('round:completed', { 
        conversationId, 
        round: roundCount,
        hasConverged,
        drift
      });
    }
    
    conversation.status = hasConverged ? 'converged' : 'completed';
    conversation.endTime = new Date().toISOString();
    this.activeConversations.delete(conversationId);
    
    this.emit('conversation:ended', { 
      conversationId, 
      status: conversation.status,
      rounds: roundCount,
      converged: hasConverged
    });
  }

  async runConversationRound(conversationId, message, roundNumber) {
    const conversation = this.conversations.get(conversationId);
    const participants = Array.from(conversation.participants);
    
    const targetLLM = this.protocol.selectBestLLM(
      message,
      participants.filter(p => p !== message.source)
    );
    
    const responses = new Map();
    const errors = [];
    
    for (const participant of participants) {
      if (participant === message.source) continue;
      
      try {
        const response = await this.protocol.sendMessage(message, participant);
        responses.set(participant, response);
        conversation.messages.push(response);
        
        this.emit('message:sent', {
          conversationId,
          from: message.source,
          to: participant,
          round: roundNumber
        });
      } catch (error) {
        errors.push({ participant, error: error.message });
        this.emit('message:error', {
          conversationId,
          participant,
          error: error.message
        });
      }
    }
    
    const consensus = this.protocol.synthesizeConsensus(responses);
    const convergence = this.protocol.detectConvergence([...responses.values()]);
    
    return {
      round: roundNumber,
      originalMessage: message,
      responses: responses,
      errors: errors,
      consensus: consensus,
      convergence: convergence,
      timestamp: new Date().toISOString()
    };
  }

  checkConvergence(roundResult) {
    if (!roundResult.convergence) return false;
    
    const hasHighSimilarity = roundResult.convergence.similarity >= this.config.convergenceThreshold;
    const hasConsensus = roundResult.consensus && 
                        roundResult.consensus.agreementLevel >= this.config.convergenceThreshold;
    
    return hasHighSimilarity && hasConsensus;
  }

  selectNextMessage(roundResult) {
    let bestResponse = null;
    let bestScore = 0;
    
    roundResult.responses.forEach((response, llmName) => {
      const integrity = response.validateSemanticIntegrity();
      const confidence = response.content.confidence.overall || 0.5;
      const score = integrity.score * confidence;
      
      if (score > bestScore) {
        bestScore = score;
        bestResponse = response;
      }
    });
    
    return bestResponse || roundResult.originalMessage;
  }

  calculateSemanticDrift(conversation) {
    if (conversation.messages.length < 2) {
      return { value: 0, critical: false };
    }
    
    const firstMessage = conversation.messages[0];
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    const degradation = this.protocol.measureSemanticDegradation(firstMessage, lastMessage);
    
    return {
      value: degradation.overallDegradation,
      critical: degradation.critical,
      warning: degradation.warning,
      details: degradation
    };
  }

  async facilitateDiscussion(topic, participants, config = {}) {
    const conversationId = this.createConversation();
    
    participants.forEach(({ name, client }) => {
      this.addParticipant(conversationId, name, client);
    });
    
    const result = await this.startConversation(conversationId, topic, config);
    
    return {
      conversationId,
      result,
      summary: this.getConversationSummary(conversationId)
    };
  }

  async mediateDebate(proposition, proLLM, conLLM, config = {}) {
    const conversationId = this.createConversation();
    
    this.addParticipant(conversationId, 'pro', proLLM);
    this.addParticipant(conversationId, 'con', conLLM);
    
    const debatePrompt = `Debate: ${proposition}. Pro argues in favor, Con argues against.`;
    
    const result = await this.startConversation(conversationId, debatePrompt, {
      ...config,
      maxRounds: config.maxRounds || 6
    });
    
    return {
      conversationId,
      proposition,
      result,
      winner: this.determineDebateWinner(conversationId)
    };
  }

  determineDebateWinner(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;
    
    const scores = new Map();
    
    conversation.messages.forEach(message => {
      if (message.source === 'user') return;
      
      const score = (message.content.confidence.overall || 0.5) * 
                   (message.validateSemanticIntegrity().score || 0.5);
      
      if (!scores.has(message.source)) {
        scores.set(message.source, []);
      }
      scores.get(message.source).push(score);
    });
    
    let winner = null;
    let bestAvgScore = 0;
    
    scores.forEach((scoreList, participant) => {
      const avgScore = scoreList.reduce((a, b) => a + b, 0) / scoreList.length;
      if (avgScore > bestAvgScore) {
        bestAvgScore = avgScore;
        winner = participant;
      }
    });
    
    return {
      winner,
      score: bestAvgScore,
      allScores: Object.fromEntries(scores)
    };
  }

  getConversationResult(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;
    
    const lastRound = conversation.rounds[conversation.rounds.length - 1];
    
    return {
      conversationId,
      status: conversation.status,
      totalRounds: conversation.rounds.length,
      totalMessages: conversation.messages.length,
      participants: Array.from(conversation.participants),
      converged: conversation.status === 'converged',
      finalConsensus: lastRound ? lastRound.consensus : null,
      semanticDrift: conversation.metadata.semanticDrift,
      duration: conversation.endTime ? 
        new Date(conversation.endTime) - new Date(conversation.startTime) : null
    };
  }

  getConversationSummary(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;
    
    const summary = this.protocol.getConversationSummary(conversationId);
    
    return {
      ...summary,
      topic: conversation.metadata.topic,
      status: conversation.status,
      duration: conversation.endTime ? 
        new Date(conversation.endTime) - new Date(conversation.startTime) : null,
      messageCount: conversation.messages.length,
      roundCount: conversation.rounds.length,
      finalDrift: conversation.metadata.semanticDrift.length > 0 ?
        conversation.metadata.semanticDrift[conversation.metadata.semanticDrift.length - 1] : null
    };
  }

  exportConversation(conversationId, format = 'json') {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;
    
    if (format === 'json') {
      return JSON.stringify(conversation, null, 2);
    }
    
    if (format === 'markdown') {
      let markdown = `# Conversation: ${conversationId}\n\n`;
      markdown += `**Topic:** ${conversation.metadata.topic}\n`;
      markdown += `**Status:** ${conversation.status}\n`;
      markdown += `**Participants:** ${Array.from(conversation.participants).join(', ')}\n\n`;
      
      markdown += `## Messages\n\n`;
      conversation.messages.forEach((message, index) => {
        markdown += `### Message ${index + 1} (${message.source})\n`;
        markdown += `${message.content.text}\n\n`;
        markdown += `**Confidence:** ${JSON.stringify(message.content.confidence)}\n\n`;
      });
      
      if (conversation.rounds.length > 0) {
        markdown += `## Consensus\n\n`;
        const lastRound = conversation.rounds[conversation.rounds.length - 1];
        if (lastRound.consensus) {
          markdown += `**Agreement Level:** ${lastRound.consensus.agreementLevel}\n`;
          markdown += `**Overall Confidence:** ${lastRound.consensus.overallConfidence}\n\n`;
        }
      }
      
      return markdown;
    }
    
    return conversation;
  }

  cleanupConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;
    
    if (this.activeConversations.has(conversationId)) {
      conversation.status = 'aborted';
      conversation.endTime = new Date().toISOString();
      this.activeConversations.delete(conversationId);
    }
    
    this.conversations.delete(conversationId);
    this.emit('conversation:cleanup', { conversationId });
    
    return true;
  }

  getActiveConversations() {
    return Array.from(this.activeConversations).map(id => ({
      id,
      ...this.getConversationSummary(id)
    }));
  }

  getAllConversations() {
    return Array.from(this.conversations.keys()).map(id => ({
      id,
      ...this.getConversationSummary(id)
    }));
  }
}

module.exports = ConversationManager;