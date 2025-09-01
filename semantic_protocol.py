"""
Semantic Protocol: Universal meaning recognition for data

A simple protocol that understands what your data means and how to display it.
No frameworks. No dependencies. Just pure functions.
"""

from typing import Dict, Tuple, Optional, Any, Callable
from dataclasses import dataclass
import re


# ============================================================================
# CORE PROTOCOL
# ============================================================================

@dataclass
class SemanticResult:
    """The universal response format"""
    semantic_type: str
    render_instruction: str
    confidence: float
    metadata: Dict[str, Any]
    
    def __str__(self):
        return f"{self.semantic_type} → {self.render_instruction} ({self.confidence:.0%})"


class SemanticProtocol:
    """
    The Semantic Protocol: Teaching computers to understand meaning.
    
    This is the entire protocol. ~100 lines that replace thousands of 
    manual UI decisions.
    """
    
    def __init__(self):
        # Semantic identification rules - these recognize meaning
        self.semantic_rules = {
            'cancellation': self._is_cancellation,
            'currency': self._is_currency,
            'temporal': self._is_temporal,
            'premium': self._is_premium,
            'identifier': self._is_identifier,
            'status': self._is_status,
            'percentage': self._is_percentage,
            'email': self._is_email,
            'url': self._is_url,
            'danger': self._is_danger,
        }
        
        # Render mapping - semantic + context = instruction
        self.render_map = {
            # Cancellation patterns
            ('cancellation', 'list'): 'badge:danger',
            ('cancellation', 'detail'): 'alert:warning',
            ('cancellation', 'form'): 'toggle:danger',
            ('cancellation', 'timeline'): 'event:critical',
            
            # Currency patterns
            ('currency', 'list'): 'text:currency-compact',
            ('currency', 'detail'): 'text:currency-full',
            ('currency', 'form'): 'input:currency',
            ('currency', 'timeline'): 'chart:financial',
            
            # Temporal patterns
            ('temporal', 'list'): 'text:relative-time',
            ('temporal', 'detail'): 'text:absolute-datetime',
            ('temporal', 'form'): 'input:datepicker',
            ('temporal', 'timeline'): 'marker:timestamp',
            
            # Premium/Special patterns
            ('premium', 'list'): 'badge:gold',
            ('premium', 'detail'): 'card:elevated',
            ('premium', 'form'): 'toggle:premium',
            
            # Status patterns
            ('status', 'list'): 'badge:status',
            ('status', 'detail'): 'card:status',
            ('status', 'form'): 'select:status',
            
            # Identifier patterns
            ('identifier', 'list'): 'text:monospace',
            ('identifier', 'detail'): 'text:copyable',
            ('identifier', 'form'): 'input:readonly',
            
            # Percentage patterns
            ('percentage', 'list'): 'progress:compact',
            ('percentage', 'detail'): 'progress:detailed',
            ('percentage', 'form'): 'slider:percentage',
            
            # Email patterns
            ('email', 'list'): 'link:email',
            ('email', 'detail'): 'link:email-full',
            ('email', 'form'): 'input:email',
            
            # URL patterns
            ('url', 'list'): 'link:external',
            ('url', 'detail'): 'link:preview',
            ('url', 'form'): 'input:url',
            
            # Danger patterns
            ('danger', 'list'): 'badge:danger',
            ('danger', 'detail'): 'alert:danger',
            ('danger', 'form'): 'warning:inline',
        }
    
    # ========================================================================
    # SEMANTIC IDENTIFICATION RULES
    # ========================================================================
    
    def _is_cancellation(self, field: Dict) -> float:
        """Identifies cancellation/termination semantics"""
        name = field.get('name', '').lower()
        keywords = ['cancel', 'terminate', 'expire', 'revoke', 'void', 'delete']
        
        if any(kw in name for kw in keywords):
            return 0.95
        if field.get('type') == 'boolean' and 'is_' in name and any(kw in name for kw in ['inactive', 'disabled']):
            return 0.85
        return 0.0
    
    def _is_currency(self, field: Dict) -> float:
        """Identifies monetary/financial semantics"""
        name = field.get('name', '').lower()
        type_ = field.get('type', '').lower()
        
        currency_words = ['price', 'amount', 'balance', 'cost', 'fee', 'payment', 'salary', 'revenue']
        
        if type_ in ['decimal', 'money', 'currency']:
            return 0.95
        if any(word in name for word in currency_words):
            return 0.90
        if type_ in ['float', 'double', 'number'] and any(word in name for word in ['usd', 'eur', 'gbp']):
            return 0.85
        return 0.0
    
    def _is_temporal(self, field: Dict) -> float:
        """Identifies time-related semantics"""
        name = field.get('name', '').lower()
        type_ = field.get('type', '').lower()
        
        if type_ in ['timestamp', 'datetime', 'date', 'time']:
            return 0.95
        if name.endswith('_at') or name.endswith('_on'):
            return 0.90
        if any(word in name for word in ['created', 'updated', 'modified', 'deleted', 'last_', 'next_']):
            return 0.85
        return 0.0
    
    def _is_premium(self, field: Dict) -> float:
        """Identifies premium/special tier semantics"""
        name = field.get('name', '').lower()
        
        premium_words = ['premium', 'pro', 'vip', 'gold', 'platinum', 'elite', 'plus']
        
        if any(word in name for word in premium_words):
            return 0.90
        if 'tier' in name and field.get('value') in ['premium', 'pro', 'gold']:
            return 0.85
        return 0.0
    
    def _is_identifier(self, field: Dict) -> float:
        """Identifies ID/key semantics"""
        name = field.get('name', '').lower()
        
        if name in ['id', 'uid', 'uuid', 'guid']:
            return 0.95
        if name.endswith('_id') or name.endswith('_key'):
            return 0.90
        if 'identifier' in name or 'reference' in name:
            return 0.85
        return 0.0
    
    def _is_status(self, field: Dict) -> float:
        """Identifies status/state semantics"""
        name = field.get('name', '').lower()
        
        if 'status' in name or 'state' in name:
            return 0.95
        if name in ['active', 'enabled', 'visible', 'published']:
            return 0.85
        if field.get('type') == 'enum' and name in ['type', 'kind', 'category']:
            return 0.80
        return 0.0
    
    def _is_percentage(self, field: Dict) -> float:
        """Identifies percentage semantics"""
        name = field.get('name', '').lower()
        value = field.get('value')
        
        if 'percent' in name or 'pct' in name or name.endswith('_rate'):
            return 0.95
        if 'ratio' in name or 'factor' in name:
            return 0.85
        if isinstance(value, (int, float)) and 0 <= value <= 1:
            return 0.70
        return 0.0
    
    def _is_email(self, field: Dict) -> float:
        """Identifies email semantics"""
        name = field.get('name', '').lower()
        value = field.get('value', '')
        
        if 'email' in name or 'mail' in name:
            return 0.95
        if isinstance(value, str) and '@' in value and '.' in value:
            return 0.90
        return 0.0
    
    def _is_url(self, field: Dict) -> float:
        """Identifies URL semantics"""
        name = field.get('name', '').lower()
        value = field.get('value', '')
        
        if 'url' in name or 'link' in name or 'website' in name:
            return 0.95
        if isinstance(value, str) and (value.startswith('http') or value.startswith('www')):
            return 0.90
        return 0.0
    
    def _is_danger(self, field: Dict) -> float:
        """Identifies danger/warning semantics"""
        name = field.get('name', '').lower()
        
        danger_words = ['error', 'fail', 'critical', 'severe', 'fatal', 'emergency', 'breach']
        
        if any(word in name for word in danger_words):
            return 0.90
        if field.get('type') == 'boolean' and 'is_' in name and any(word in name for word in ['blocked', 'banned', 'suspended']):
            return 0.85
        return 0.0
    
    # ========================================================================
    # CORE PROTOCOL METHODS
    # ========================================================================
    
    def analyze(self, 
                field_name: str, 
                field_type: str = 'string',
                field_value: Optional[Any] = None,
                context: str = 'list') -> SemanticResult:
        """
        The main protocol method: analyze a field and return semantic understanding.
        
        This single method replaces thousands of manual UI decisions.
        """
        field = {
            'name': field_name,
            'type': field_type,
            'value': field_value
        }
        
        # Find the best semantic match
        best_semantic = 'default'
        best_confidence = 0.0
        
        for semantic_type, rule_func in self.semantic_rules.items():
            confidence = rule_func(field)
            if confidence > best_confidence:
                best_confidence = confidence
                best_semantic = semantic_type
        
        # Get render instruction
        render_key = (best_semantic, context)
        render_instruction = self.render_map.get(render_key, f'text:plain')
        
        # Build metadata
        metadata = {
            'field': field_name,
            'type': field_type,
            'context': context,
            'all_matches': {}
        }
        
        # Include all semantic matches for transparency
        for semantic_type, rule_func in self.semantic_rules.items():
            conf = rule_func(field)
            if conf > 0:
                metadata['all_matches'][semantic_type] = conf
        
        return SemanticResult(
            semantic_type=best_semantic,
            render_instruction=render_instruction,
            confidence=best_confidence if best_confidence > 0 else 1.0,
            metadata=metadata
        )
    
    def batch_analyze(self, fields: list, context: str = 'list') -> Dict[str, SemanticResult]:
        """Analyze multiple fields at once"""
        results = {}
        for field in fields:
            if isinstance(field, dict):
                name = field.get('name', 'unknown')
                type_ = field.get('type', 'string')
                value = field.get('value')
            else:
                name = str(field)
                type_ = 'string'
                value = None
            
            results[name] = self.analyze(name, type_, value, context)
        
        return results
    
    def get_supported_semantics(self) -> list:
        """List all supported semantic types"""
        return list(self.semantic_rules.keys())
    
    def get_supported_contexts(self) -> list:
        """List all supported rendering contexts"""
        contexts = set()
        for key in self.render_map.keys():
            contexts.add(key[1])
        return sorted(list(contexts))


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

# Global instance for simple usage
_protocol = SemanticProtocol()

def analyze(field_name: str, field_type: str = 'string', 
            field_value: Any = None, context: str = 'list') -> SemanticResult:
    """Quick analysis using the global protocol instance"""
    return _protocol.analyze(field_name, field_type, field_value, context)

def identify(field_name: str, field_type: str = 'string') -> str:
    """Just get the semantic type"""
    result = _protocol.analyze(field_name, field_type)
    return result.semantic_type

def render(field_name: str, field_type: str = 'string', context: str = 'list') -> str:
    """Just get the render instruction"""
    result = _protocol.analyze(field_name, field_type, context=context)
    return result.render_instruction


# ============================================================================
# SELF-TEST
# ============================================================================

if __name__ == "__main__":
    print("🧬 Semantic Protocol v0.1.0")
    print("=" * 60)
    
    # Test cases showing the power of semantic understanding
    test_fields = [
        ('is_cancelled', 'boolean', None, 'list'),
        ('is_cancelled', 'boolean', None, 'detail'),
        ('total_price', 'decimal', 99.99, 'list'),
        ('created_at', 'timestamp', None, 'list'),
        ('user_id', 'uuid', None, 'detail'),
        ('subscription_status', 'enum', None, 'form'),
        ('email_address', 'string', 'user@example.com', 'list'),
        ('completion_rate', 'float', 0.85, 'detail'),
        ('is_premium', 'boolean', True, 'list'),
        ('error_count', 'integer', 5, 'list'),
    ]
    
    print("\nSemantic Analysis Results:")
    print("-" * 60)
    
    for field_name, field_type, value, context in test_fields:
        result = analyze(field_name, field_type, value, context)
        print(f"{field_name:20} ({context:8}) → {result}")
    
    print("\n✨ That's it! ~200 lines that understand meaning.")
