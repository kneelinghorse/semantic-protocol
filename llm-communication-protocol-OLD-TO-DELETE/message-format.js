/**
 * Semantic Message Format for LLM Communication
 * Preserves meaning, confidence, and uncertainty across exchanges
 */

class SemanticMessage {
  constructor({
    id = null,
    source = null,
    target = null,
    timestamp = new Date().toISOString(),
    content = {},
    metadata = {}
  } = {}) {
    this.id = id || this.generateId();
    this.source = source;
    this.target = target;
    this.timestamp = timestamp;
    this.content = this.normalizeContent(content);
    this.metadata = this.normalizeMetadata(metadata);
  }

  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  normalizeContent(content) {
    return {
      text: content.text || '',
      semantics: content.semantics || {},
      intents: content.intents || [],
      entities: content.entities || [],
      relations: content.relations || [],
      concepts: content.concepts || [],
      confidence: content.confidence || {}
    };
  }

  normalizeMetadata(metadata) {
    return {
      conversationId: metadata.conversationId || null,
      parentMessageId: metadata.parentMessageId || null,
      llmModel: metadata.llmModel || null,
      llmVersion: metadata.llmVersion || null,
      processingTime: metadata.processingTime || null,
      tokens: metadata.tokens || {},
      uncertainty: metadata.uncertainty || {},
      context: metadata.context || {},
      routing: metadata.routing || {}
    };
  }

  addSemanticField(field) {
    if (!this.content.semantics[field.name]) {
      this.content.semantics[field.name] = [];
    }
    
    this.content.semantics[field.name].push({
      value: field.value,
      type: field.type || 'unknown',
      confidence: field.confidence || 0.5,
      source: field.source || 'extraction',
      context: field.context || {}
    });
  }

  addIntent(intent) {
    this.content.intents.push({
      name: intent.name,
      confidence: intent.confidence || 0.5,
      parameters: intent.parameters || {},
      priority: intent.priority || 'medium'
    });
  }

  addEntity(entity) {
    this.content.entities.push({
      text: entity.text,
      type: entity.type,
      value: entity.value || entity.text,
      position: entity.position || null,
      confidence: entity.confidence || 0.5,
      metadata: entity.metadata || {}
    });
  }

  addRelation(relation) {
    this.content.relations.push({
      subject: relation.subject,
      predicate: relation.predicate,
      object: relation.object,
      confidence: relation.confidence || 0.5,
      context: relation.context || {}
    });
  }

  addConcept(concept) {
    this.content.concepts.push({
      name: concept.name,
      type: concept.type || 'general',
      definition: concept.definition || null,
      confidence: concept.confidence || 0.5,
      relationships: concept.relationships || [],
      attributes: concept.attributes || {}
    });
  }

  setConfidence(aspect, value) {
    this.content.confidence[aspect] = Math.max(0, Math.min(1, value));
  }

  setUncertainty(aspect, details) {
    this.metadata.uncertainty[aspect] = {
      level: details.level || 'medium',
      reason: details.reason || 'unspecified',
      alternatives: details.alternatives || [],
      confidence: details.confidence || 0.5
    };
  }

  setRouting(llmStrengths) {
    this.metadata.routing = {
      preferredLLM: llmStrengths.preferred || null,
      reasoning: llmStrengths.reasoning || null,
      alternatives: llmStrengths.alternatives || [],
      taskType: llmStrengths.taskType || 'general'
    };
  }

  toJSON() {
    return {
      id: this.id,
      source: this.source,
      target: this.target,
      timestamp: this.timestamp,
      content: this.content,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new SemanticMessage(json);
  }

  calculateSemanticHash() {
    const semanticCore = {
      intents: this.content.intents.map(i => i.name).sort(),
      entities: this.content.entities.map(e => `${e.type}:${e.value}`).sort(),
      concepts: this.content.concepts.map(c => c.name).sort(),
      relations: this.content.relations.map(r => 
        `${r.subject}-${r.predicate}-${r.object}`
      ).sort()
    };
    
    return Buffer.from(JSON.stringify(semanticCore)).toString('base64');
  }

  compareSemantics(otherMessage) {
    const thisHash = this.calculateSemanticHash();
    const otherHash = otherMessage.calculateSemanticHash();
    
    const similarity = {
      identical: thisHash === otherHash,
      intentOverlap: this.calculateOverlap(
        this.content.intents.map(i => i.name),
        otherMessage.content.intents.map(i => i.name)
      ),
      entityOverlap: this.calculateOverlap(
        this.content.entities.map(e => e.value),
        otherMessage.content.entities.map(e => e.value)
      ),
      conceptOverlap: this.calculateOverlap(
        this.content.concepts.map(c => c.name),
        otherMessage.content.concepts.map(c => c.name)
      )
    };
    
    similarity.overallSimilarity = (
      similarity.intentOverlap * 0.3 +
      similarity.entityOverlap * 0.3 +
      similarity.conceptOverlap * 0.4
    );
    
    return similarity;
  }

  calculateOverlap(set1, set2) {
    const intersection = set1.filter(x => set2.includes(x));
    const union = [...new Set([...set1, ...set2])];
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  validateSemanticIntegrity() {
    const issues = [];
    
    if (this.content.intents.length === 0) {
      issues.push('No intents identified');
    }
    
    if (Object.keys(this.content.confidence).length === 0) {
      issues.push('No confidence scores provided');
    }
    
    const lowConfidenceItems = [
      ...this.content.intents.filter(i => i.confidence < 0.3),
      ...this.content.entities.filter(e => e.confidence < 0.3),
      ...this.content.concepts.filter(c => c.confidence < 0.3)
    ];
    
    if (lowConfidenceItems.length > 0) {
      issues.push(`${lowConfidenceItems.length} items with low confidence (<0.3)`);
    }
    
    return {
      valid: issues.length === 0,
      issues: issues,
      score: Math.max(0, 1 - (issues.length * 0.2))
    };
  }
}

class MessageFormatter {
  static formatForLLM(message, targetLLM) {
    const formatted = {
      role: 'system',
      content: this.buildPrompt(message, targetLLM)
    };
    
    if (targetLLM === 'claude') {
      formatted.temperature = 0.7;
      formatted.max_tokens = 4096;
    } else if (targetLLM === 'gpt') {
      formatted.temperature = 0.7;
      formatted.max_tokens = 4096;
      formatted.response_format = { type: "json_object" };
    } else if (targetLLM === 'gemini') {
      formatted.temperature = 0.7;
      formatted.maxOutputTokens = 4096;
    }
    
    return formatted;
  }

  static buildPrompt(message, targetLLM) {
    const semanticContext = JSON.stringify(message.content.semantics, null, 2);
    const intents = message.content.intents.map(i => 
      `- ${i.name} (confidence: ${i.confidence})`
    ).join('\n');
    const entities = message.content.entities.map(e => 
      `- ${e.type}: ${e.value} (confidence: ${e.confidence})`
    ).join('\n');
    
    return `You are participating in a semantic communication protocol with other LLMs.

ORIGINAL MESSAGE: ${message.content.text}

SEMANTIC STRUCTURE:
${semanticContext}

IDENTIFIED INTENTS:
${intents}

IDENTIFIED ENTITIES:
${entities}

CONFIDENCE LEVELS:
${JSON.stringify(message.content.confidence, null, 2)}

UNCERTAINTY AREAS:
${JSON.stringify(message.metadata.uncertainty, null, 2)}

Please respond while:
1. Preserving the semantic structure provided
2. Maintaining or adjusting confidence levels based on your analysis
3. Clearly indicating any areas of uncertainty
4. Building upon the concepts and relations identified
5. Providing your response in both natural language and semantic structure

Format your response as JSON with the following structure:
{
  "text": "Your natural language response",
  "semantics": { /* Enhanced semantic structure */ },
  "intents": [ /* Updated intent list */ ],
  "entities": [ /* Updated entity list */ ],
  "confidence": { /* Your confidence assessments */ },
  "reasoning": "Brief explanation of your semantic choices"
}`;
  }

  static parseResponse(response, sourceLLM) {
    try {
      let parsed;
      
      if (typeof response === 'string') {
        parsed = JSON.parse(response);
      } else {
        parsed = response;
      }
      
      const message = new SemanticMessage({
        source: sourceLLM,
        content: {
          text: parsed.text || '',
          semantics: parsed.semantics || {},
          intents: parsed.intents || [],
          entities: parsed.entities || [],
          relations: parsed.relations || [],
          concepts: parsed.concepts || [],
          confidence: parsed.confidence || {}
        },
        metadata: {
          llmModel: sourceLLM,
          reasoning: parsed.reasoning || ''
        }
      });
      
      return message;
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return new SemanticMessage({
        source: sourceLLM,
        content: {
          text: response.toString(),
          confidence: { parsing: 0.1 }
        },
        metadata: {
          error: error.message
        }
      });
    }
  }
}

module.exports = {
  SemanticMessage,
  MessageFormatter
};