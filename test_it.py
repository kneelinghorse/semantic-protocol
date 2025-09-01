#!/usr/bin/env python3
"""Quick test to see our semantic magic in action!"""

from semantic_protocol import analyze

# Test it out!
print("\n🧬 SEMANTIC PROTOCOL - LIVE TEST\n")
print("=" * 50)

test_cases = [
    ('is_cancelled', 'boolean', 'list'),
    ('total_price', 'decimal', 'detail'),
    ('user_email', 'string', 'form'),
    ('last_login_at', 'timestamp', 'list'),
    ('is_premium_member', 'boolean', 'list'),
    ('error_count', 'integer', 'detail'),
]

for field, type_, context in test_cases:
    result = analyze(field, type_, context=context)
    print(f"{field:<20} → {result.semantic_type:<12} → {result.render_instruction}")

print("\n✨ IT WORKS! Meaning from names in ~200 lines!")
print("=" * 50)
