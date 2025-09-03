/**
 * Core LLM Communication Protocol Handler
 * Manages semantic extraction, routing, and protocol operations
 */

const { SemanticMessage, MessageFormatter } = require('./message-format');

class LLMProtocol {
  constructor(config = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      semanticThreshold: config.semanticThreshold || 0.7,
      convergenceThreshold: config.convergenceThreshold || 0.85,
      ...config
    };
    
    this.llmClients = {};
    this.semanticCache = new Map();
    this.conversationHistory = new Map();
  }

  registerLLM(name, client) {
    this.llmClients[name] = {
      client: client,
      strengths: this.defineLLMStrengths(name),
      metrics: {
        totalMessages: 0,
        avgConfidence: 0,
        avgResponseTime: 0,
        semanticPreservation: 1.0
      }
    };
  }

  defineLLMStrengths(llmName) {
    const strengths = {
      claude: {
        analysis: 0.95,
        reasoning: 0.95,
        nuance: 0.90,
        creativity: 0.85,
        factual: 0.90,
        code: 0.95,
        bestFor: ['complex analysis', 'nuanced understanding', 'technical tasks']
      },
      gpt: {
        analysis: 0.85,
        reasoning: 0.85,
        nuance: 0.80,
        creativity: 0.95,
        factual: 0.85,
        code: 0.90,
        bestFor: ['creative tasks', 'brainstorming', 'general conversation']
      },
      gemini: {
        analysis: 0.85,
        reasoning: 0.85,
        nuance: 0.80,
        creativity: 0.85,
        factual: 0.90,
        code: 0.85,
        bestFor: ['multimodal tasks', 'factual queries', 'structured data']
      }
    };
    
    return strengths[llmName] || {
      analysis: 0.70,
      reasoning: 0.70,
      nuance: 0.70,
      creativity: 0.70,
      factual: 0.70,
      code: 0.70,
      bestFor: ['general tasks']
    };
  }

  async extractSemantics(text, source = 'unknown') {
    const cacheKey = `${source}:${text.substring(0, 100)}`;
    
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey);
    }
    
    const semantics = {
      intents: this.extractIntents(text),
      entities: this.extractEntities(text),
      concepts: this.extractConcepts(text),
      relations: this.extractRelations(text),
      confidence: this.calculateConfidence(text)
    };
    
    this.semanticCache.set(cacheKey, semantics);
    return semantics;
  }

  extractIntents(text) {
    const intents = [];
    
    const patterns = [
      { pattern: /\b(explain|describe|clarify)\b/gi, intent: 'explanation', confidence: 0.8 },
      { pattern: /\b(analyze|examine|investigate)\b/gi, intent: 'analysis', confidence: 0.85 },
      { pattern: /\b(create|build|generate)\b/gi, intent: 'creation', confidence: 0.8 },
      { pattern: /\b(compare|contrast|difference)\b/gi, intent: 'comparison', confidence: 0.75 },
      { pattern: /\b(suggest|recommend|propose)\b/gi, intent: 'recommendation', confidence: 0.8 },
      { pattern: /\b(solve|fix|resolve)\b/gi, intent: 'problem_solving', confidence: 0.85 },
      { pattern: /\b(what|how|why|when|where)\b/gi, intent: 'question', confidence: 0.7 }
    ];
    
    patterns.forEach(({ pattern, intent, confidence }) => {
      if (pattern.test(text)) {
        intents.push({
          name: intent,
          confidence: confidence,
          parameters: {},
          priority: 'medium'
        });
      }
    });
    
    if (intents.length === 0) {
      intents.push({
        name: 'general_discussion',
        confidence: 0.5,
        parameters: {},
        priority: 'low'
      });
    }
    
    return intents;
  }

  extractEntities(text) {
    const entities = [];
    
    const patterns = [
      { pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, type: 'proper_noun' },
      { pattern: /\b\d+(?:\.\d+)?\b/g, type: 'number' },
      { pattern: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, type: 'date' },
      { pattern: /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/gi, type: 'time' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
      { pattern: /https?:\/\/[^\s]+/g, type: 'url' }
    ];
    
    patterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        entities.push({
          text: match,
          type: type,
          value: match,
          position: text.indexOf(match),
          confidence: 0.7,
          metadata: {}
        });
      });
    });
    
    const techTerms = [
      'API', 'JSON', 'XML', 'HTTP', 'REST', 'GraphQL',
      'database', 'server', 'client', 'protocol', 'semantic'
    ];
    
    techTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = text.match(regex) || [];
      matches.forEach(match => {
        entities.push({
          text: match,
          type: 'technical_term',
          value: match.toLowerCase(),
          position: text.indexOf(match),
          confidence: 0.9,
          metadata: { category: 'technology' }
        });
      });
    });
    
    return entities;
  }

  extractConcepts(text) {
    const concepts = [];
    const words = text.toLowerCase().split(/\s+/);
    
    const conceptPatterns = {
      'communication': ['talk', 'speak', 'message', 'exchange', 'dialogue'],
      'understanding': ['comprehend', 'grasp', 'know', 'realize', 'understand'],
      'analysis': ['analyze', 'examine', 'study', 'investigate', 'explore'],
      'creation': ['create', 'build', 'make', 'develop', 'generate'],
      'improvement': ['improve', 'enhance', 'optimize', 'better', 'upgrade']
    };
    
    Object.entries(conceptPatterns).forEach(([concept, keywords]) => {
      const found = keywords.some(keyword => words.includes(keyword));
      if (found) {
        concepts.push({
          name: concept,
          type: 'abstract',
          definition: null,
          confidence: 0.7,
          relationships: [],
          attributes: {}
        });
      }
    });
    
    return concepts;
  }

  extractRelations(text) {
    const relations = [];
    
    const relationPatterns = [
      { pattern: /(\w+)\s+is\s+(\w+)/gi, predicate: 'is' },
      { pattern: /(\w+)\s+has\s+(\w+)/gi, predicate: 'has' },
      { pattern: /(\w+)\s+contains\s+(\w+)/gi, predicate: 'contains' },
      { pattern: /(\w+)\s+requires\s+(\w+)/gi, predicate: 'requires' },
      { pattern: /(\w+)\s+depends on\s+(\w+)/gi, predicate: 'depends_on' }
    ];
    
    relationPatterns.forEach(({ pattern, predicate }) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        relations.push({
          subject: match[1],
          predicate: predicate,
          object: match[2],
          confidence: 0.6,
          context: {}
        });
      });
    });
    
    return relations;
  }

  calculateConfidence(text) {
    const confidence = {};
    
    const uncertainWords = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'approximately'];
    const certainWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
    
    const uncertainCount = uncertainWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    
    const certainCount = certainWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    
    confidence.overall = Math.max(0.3, Math.min(1.0, 
      0.7 + (certainCount * 0.1) - (uncertainCount * 0.15)
    ));
    
    confidence.semantic_extraction = 0.75;
    confidence.intent_recognition = 0.8;
    confidence.entity_extraction = 0.7;
    
    return confidence;
  }

  selectBestLLM(message, availableLLMs) {
    const taskType = this.identifyTaskType(message);
    let bestLLM = null;
    let bestScore = 0;
    
    availableLLMs.forEach(llmName => {
      const strengths = this.llmClients[llmName].strengths;
      let score = 0;
      
      switch(taskType) {
        case 'analysis':
          score = strengths.analysis * 0.6 + strengths.reasoning * 0.4;
          break;
        case 'creative':
          score = strengths.creativity * 0.7 + strengths.nuance * 0.3;
          break;
        case 'factual':
          score = strengths.factual * 0.8 + strengths.reasoning * 0.2;
          break;
        case 'code':
          score = strengths.code * 0.9 + strengths.analysis * 0.1;
          break;
        default:
          score = (strengths.analysis + strengths.reasoning + strengths.creativity) / 3;
      }
      
      const metrics = this.llmClients[llmName].metrics;
      score *= metrics.semanticPreservation;
      
      if (score > bestScore) {
        bestScore = score;
        bestLLM = llmName;
      }
    });
    
    return bestLLM || availableLLMs[0];
  }

  identifyTaskType(message) {
    const intents = message.content.intents;
    const text = message.content.text.toLowerCase();
    
    if (intents.some(i => i.name === 'analysis' || i.name === 'examination')) {
      return 'analysis';
    }
    
    if (intents.some(i => i.name === 'creation' || i.name === 'generation')) {
      return 'creative';
    }
    
    if (text.includes('fact') || text.includes('data') || text.includes('statistic')) {
      return 'factual';
    }
    
    if (text.includes('code') || text.includes('program') || text.includes('function')) {
      return 'code';
    }
    
    return 'general';
  }

  async sendMessage(message, targetLLM) {
    const llmClient = this.llmClients[targetLLM];
    if (!llmClient) {
      throw new Error(`LLM ${targetLLM} not registered`);
    }
    
    const startTime = Date.now();
    const formatted = MessageFormatter.formatForLLM(message, targetLLM);
    
    try {
      const response = await llmClient.client.send(formatted);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(targetLLM, {
        responseTime: responseTime,
        success: true
      });
      
      return MessageFormatter.parseResponse(response, targetLLM);
    } catch (error) {
      this.updateMetrics(targetLLM, {
        responseTime: Date.now() - startTime,
        success: false
      });
      
      throw error;
    }
  }

  updateMetrics(llmName, data) {
    const metrics = this.llmClients[llmName].metrics;
    
    metrics.totalMessages++;
    
    if (data.responseTime) {
      metrics.avgResponseTime = (
        (metrics.avgResponseTime * (metrics.totalMessages - 1) + data.responseTime) /
        metrics.totalMessages
      );
    }
    
    if (data.confidence) {
      metrics.avgConfidence = (
        (metrics.avgConfidence * (metrics.totalMessages - 1) + data.confidence) /
        metrics.totalMessages
      );
    }
    
    if (data.semanticPreservation !== undefined) {
      metrics.semanticPreservation = data.semanticPreservation;
    }
  }

  measureSemanticDegradation(originalMessage, responseMessage) {
    const similarity = originalMessage.compareSemantics(responseMessage);
    
    const degradation = {
      intentLoss: 1 - similarity.intentOverlap,
      entityLoss: 1 - similarity.entityOverlap,
      conceptLoss: 1 - similarity.conceptOverlap,
      overallDegradation: 1 - similarity.overallSimilarity
    };
    
    degradation.acceptable = degradation.overallDegradation < 0.3;
    degradation.warning = degradation.overallDegradation >= 0.3 && degradation.overallDegradation < 0.5;
    degradation.critical = degradation.overallDegradation >= 0.5;
    
    return degradation;
  }

  detectConvergence(messages) {
    if (messages.length < 2) return false;
    
    const recentMessages = messages.slice(-3);
    const similarities = [];
    
    for (let i = 0; i < recentMessages.length - 1; i++) {
      const similarity = recentMessages[i].compareSemantics(recentMessages[i + 1]);
      similarities.push(similarity.overallSimilarity);
    }
    
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    
    return {
      converged: avgSimilarity >= this.config.convergenceThreshold,
      similarity: avgSimilarity,
      trend: similarities[similarities.length - 1] > similarities[0] ? 'improving' : 'degrading'
    };
  }

  async processConversationRound(conversationId, message, participantLLMs) {
    const responses = new Map();
    const errors = [];
    
    for (const llmName of participantLLMs) {
      try {
        const response = await this.sendMessage(message, llmName);
        responses.set(llmName, response);
        
        const degradation = this.measureSemanticDegradation(message, response);
        if (degradation.critical) {
          console.warn(`Critical semantic degradation from ${llmName}:`, degradation);
        }
      } catch (error) {
        errors.push({ llm: llmName, error: error.message });
      }
    }
    
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    
    this.conversationHistory.get(conversationId).push({
      round: this.conversationHistory.get(conversationId).length + 1,
      originalMessage: message,
      responses: responses,
      errors: errors,
      timestamp: new Date().toISOString()
    });
    
    return {
      responses: responses,
      errors: errors,
      convergence: this.detectConvergence([...responses.values()])
    };
  }

  synthesizeConsensus(responses) {
    const allIntents = new Map();
    const allEntities = new Map();
    const allConcepts = new Map();
    const confidences = [];
    
    responses.forEach((response, llmName) => {
      response.content.intents.forEach(intent => {
        const key = intent.name;
        if (!allIntents.has(key)) {
          allIntents.set(key, { count: 0, totalConfidence: 0, sources: [] });
        }
        const data = allIntents.get(key);
        data.count++;
        data.totalConfidence += intent.confidence;
        data.sources.push(llmName);
      });
      
      response.content.entities.forEach(entity => {
        const key = `${entity.type}:${entity.value}`;
        if (!allEntities.has(key)) {
          allEntities.set(key, { count: 0, entity: entity, sources: [] });
        }
        const data = allEntities.get(key);
        data.count++;
        data.sources.push(llmName);
      });
      
      response.content.concepts.forEach(concept => {
        const key = concept.name;
        if (!allConcepts.has(key)) {
          allConcepts.set(key, { count: 0, concept: concept, sources: [] });
        }
        const data = allConcepts.get(key);
        data.count++;
        data.sources.push(llmName);
      });
      
      if (response.content.confidence.overall) {
        confidences.push(response.content.confidence.overall);
      }
    });
    
    const consensusIntents = Array.from(allIntents.entries())
      .filter(([_, data]) => data.count >= Math.ceil(responses.size / 2))
      .map(([name, data]) => ({
        name: name,
        confidence: data.totalConfidence / data.count,
        consensus: data.count / responses.size,
        sources: data.sources
      }));
    
    const consensusEntities = Array.from(allEntities.entries())
      .filter(([_, data]) => data.count >= Math.ceil(responses.size / 2))
      .map(([_, data]) => ({
        ...data.entity,
        consensus: data.count / responses.size,
        sources: data.sources
      }));
    
    const consensusConcepts = Array.from(allConcepts.entries())
      .filter(([_, data]) => data.count >= Math.ceil(responses.size / 2))
      .map(([_, data]) => ({
        ...data.concept,
        consensus: data.count / responses.size,
        sources: data.sources
      }));
    
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
    
    return {
      intents: consensusIntents,
      entities: consensusEntities,
      concepts: consensusConcepts,
      overallConfidence: avgConfidence,
      agreementLevel: Math.min(
        consensusIntents.length > 0 ? consensusIntents[0].consensus : 0,
        avgConfidence
      )
    };
  }

  getConversationSummary(conversationId) {
    const history = this.conversationHistory.get(conversationId);
    if (!history) return null;
    
    const summary = {
      conversationId: conversationId,
      totalRounds: history.length,
      participants: new Set(),
      semanticDrift: [],
      convergenceTrend: [],
      finalConsensus: null
    };
    
    history.forEach(round => {
      round.responses.forEach((_, llmName) => {
        summary.participants.add(llmName);
      });
      
      if (round.convergence) {
        summary.convergenceTrend.push({
          round: round.round,
          similarity: round.convergence.similarity,
          converged: round.convergence.converged
        });
      }
    });
    
    if (history.length > 0) {
      const lastRound = history[history.length - 1];
      summary.finalConsensus = this.synthesizeConsensus(lastRound.responses);
    }
    
    return summary;
  }
}

module.exports = LLMProtocol;