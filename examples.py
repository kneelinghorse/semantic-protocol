"""
Semantic Protocol Examples - See the magic in action!

This file demonstrates how the Semantic Protocol automatically understands
your data and knows how to display it.
"""

from semantic_protocol import SemanticProtocol, analyze, identify, render
import json


def example_1_basic_usage():
    """The simplest usage - just pass field names"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Basic Semantic Recognition")
    print("="*60)
    
    # Just field names - the protocol understands their meaning
    fields = [
        'is_cancelled',
        'price',
        'created_at',
        'email',
        'user_id',
        'completion_percentage',
        'is_premium',
        'error_message'
    ]
    
    print("\nField → Semantic Type:")
    print("-"*40)
    for field in fields:
        semantic = identify(field)
        print(f"{field:25} → {semantic}")


def example_2_context_aware_rendering():
    """Same data, different contexts, different rendering"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Context-Aware Rendering")
    print("="*60)
    
    field = 'subscription_status'
    contexts = ['list', 'detail', 'form', 'timeline']
    
    print(f"\nHow '{field}' renders in different contexts:")
    print("-"*40)
    
    for context in contexts:
        instruction = render(field, 'enum', context)
        print(f"{context:10} → {instruction}")


def example_3_full_analysis():
    """Complete semantic analysis with confidence scores"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Full Semantic Analysis")
    print("="*60)
    
    # Analyze a field completely
    result = analyze(
        field_name='monthly_payment_amount',
        field_type='decimal',
        field_value=1299.99,
        context='detail'
    )
    
    print(f"\nAnalyzing: 'monthly_payment_amount'")
    print("-"*40)
    print(f"Semantic Type:    {result.semantic_type}")
    print(f"Render:          {result.render_instruction}")
    print(f"Confidence:      {result.confidence:.0%}")
    print(f"\nAll Matches:")
    for sem_type, conf in result.metadata['all_matches'].items():
        print(f"  {sem_type:15} {conf:.0%}")


def example_4_database_schema():
    """Analyze an entire database schema"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Database Schema Analysis")
    print("="*60)
    
    # Simulated database schema
    schema = [
        {'name': 'id', 'type': 'uuid'},
        {'name': 'email', 'type': 'string'},
        {'name': 'is_active', 'type': 'boolean'},
        {'name': 'is_premium', 'type': 'boolean'},
        {'name': 'subscription_price', 'type': 'decimal'},
        {'name': 'last_login_at', 'type': 'timestamp'},
        {'name': 'cancellation_date', 'type': 'date'},
        {'name': 'completion_rate', 'type': 'float'},
        {'name': 'status', 'type': 'enum'},
        {'name': 'referral_code', 'type': 'string'},
    ]
    
    protocol = SemanticProtocol()
    results = protocol.batch_analyze(schema, context='list')
    
    print("\nSchema Analysis (List Context):")
    print("-"*60)
    print(f"{'Field':<20} {'Type':<10} {'Semantic':<15} {'Render':<20}")
    print("-"*60)
    
    for field in schema:
        name = field['name']
        type_ = field['type']
        result = results[name]
        print(f"{name:<20} {type_:<10} {result.semantic_type:<15} {result.render_instruction:<20}")


def example_5_smart_form_builder():
    """Automatically build appropriate form inputs"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Automatic Form Builder")
    print("="*60)
    
    # Form fields with mixed types
    form_fields = [
        {'name': 'user_email', 'type': 'string', 'required': True},
        {'name': 'password', 'type': 'string', 'required': True},
        {'name': 'birth_date', 'type': 'date', 'required': False},
        {'name': 'monthly_income', 'type': 'decimal', 'required': True},
        {'name': 'accept_terms', 'type': 'boolean', 'required': True},
        {'name': 'referral_source', 'type': 'enum', 'required': False},
        {'name': 'bio', 'type': 'text', 'required': False},
    ]
    
    print("\nAuto-Generated Form Components:")
    print("-"*50)
    
    for field in form_fields:
        result = analyze(field['name'], field['type'], context='form')
        required = "required" if field.get('required') else "optional"
        print(f"{field['name']:20} → {result.render_instruction:20} ({required})")


def example_6_migration_helper():
    """Help migrate from manual UI decisions to semantic"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Migration Helper")
    print("="*60)
    
    # Show how manual decisions can be replaced
    manual_decisions = {
        'is_cancelled': 'RedBadge',          # Manual: specific component
        'price': 'CurrencyDisplay',          # Manual: specific component
        'created_at': 'DateFormatter',       # Manual: specific component
        'user_status': 'StatusIndicator',    # Manual: specific component
    }
    
    print("\nMigration from Manual to Semantic:")
    print("-"*60)
    print(f"{'Field':<15} {'Old (Manual)':<20} {'New (Semantic)':<25}")
    print("-"*60)
    
    for field, old_component in manual_decisions.items():
        semantic_render = render(field, context='list')
        print(f"{field:<15} {old_component:<20} {semantic_render:<25}")
    
    print("\n✨ Benefit: Consistency across all similar fields!")


def example_7_realtime_analysis():
    """Analyze data in real-time as it arrives"""
    print("\n" + "="*60)
    print("EXAMPLE 7: Real-Time Data Analysis")
    print("="*60)
    
    # Simulated real-time data stream
    data_stream = [
        {'user_id': '123', 'action': 'login', 'timestamp': '2024-01-01T10:00:00'},
        {'user_id': '123', 'action': 'view_premium', 'is_premium': False},
        {'user_id': '123', 'action': 'purchase', 'amount': 99.99},
        {'user_id': '123', 'action': 'upgrade', 'is_premium': True},
        {'user_id': '123', 'action': 'cancel', 'is_cancelled': True},
    ]
    
    print("\nReal-Time Semantic Understanding:")
    print("-"*60)
    
    for event in data_stream:
        print(f"\nEvent: {event['action']}")
        for key, value in event.items():
            if key != 'action':
                result = analyze(key, field_value=value, context='timeline')
                if result.confidence > 0.8:
                    print(f"  {key}: {result.semantic_type} → {result.render_instruction}")


def main():
    """Run all examples"""
    print("\n" + "🧬"*30)
    print("SEMANTIC PROTOCOL DEMONSTRATION")
    print("Understanding meaning, not just types")
    print("🧬"*30)
    
    example_1_basic_usage()
    example_2_context_aware_rendering()
    example_3_full_analysis()
    example_4_database_schema()
    example_5_smart_form_builder()
    example_6_migration_helper()
    example_7_realtime_analysis()
    
    print("\n" + "="*60)
    print("SUMMARY: Why This Matters")
    print("="*60)
    
    print("""
The Semantic Protocol replaces thousands of manual decisions with
automatic understanding. Instead of:

    if field_name == 'is_cancelled':
        return CancellationBadge()
    elif field_name == 'is_terminated':
        return TerminationBadge()
    elif field_name == 'is_expired':
        return ExpirationBadge()
    # ... hundreds more conditions

You just have:

    result = analyze(field_name)
    return render_component(result.render_instruction)

This scales infinitely, works across languages, and maintains
perfect consistency. It's not just cleaner code - it's a fundamental
shift in how we build UIs.
    """)
    
    print("\n🚀 The future: UIs that understand your data automatically.")
    print("="*60)


if __name__ == "__main__":
    main()
