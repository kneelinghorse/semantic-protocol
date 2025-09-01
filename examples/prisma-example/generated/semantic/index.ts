import type { SemanticType, RenderContext } from '@kneelinghorse/semantic-protocol';

export interface UserSemantics {
    id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: true;
      isUnique: false;
      hasDefault: true;
    };
    email: {
      semantic: 'email' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"link","variant":"email","props":{"truncate":true}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: true;
      hasDefault: false;
    };
    password_hash: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    first_name: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    last_name: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    phone_number: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    subscription_tier: {
      semantic: 'premium' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"premium","props":{"icon":"star"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    is_premium: {
      semantic: 'premium' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"premium","props":{"icon":"star"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    premium_until: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    account_balance: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    monthly_revenue: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    total_spent: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    credit_limit: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    created_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    updated_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    last_login_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    email_verified_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    is_cancelled: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    cancelled_at: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    is_deleted: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    deleted_at: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    is_suspended: {
      semantic: 'cancellation' as SemanticType;
      confidence: 85;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    suspension_reason: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    orders: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: true;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    payments: {
      semantic: 'currency' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: true;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    profile: {
      semantic: 'premium' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"premium","props":{"icon":"star"}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
}

export interface ProfileSemantics {
    id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: true;
      isUnique: false;
      hasDefault: true;
    };
    user_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: true;
      hasDefault: false;
    };
    user: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    bio: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    avatar_url: {
      semantic: 'url' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"link","variant":"external","props":{"truncate":true}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    website_url: {
      semantic: 'url' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"link","variant":"external","props":{"truncate":true}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    linkedin_url: {
      semantic: 'url' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"link","variant":"external","props":{"truncate":true}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    twitter_handle: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    country: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    city: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    postal_code: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    profile_completion_percentage: {
      semantic: 'percentage' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"progress","variant":"compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    engagement_rate: {
      semantic: 'percentage' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"progress","variant":"compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    created_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    updated_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
}

export interface OrderSemantics {
    id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: true;
      isUnique: false;
      hasDefault: true;
    };
    order_number: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: true;
      hasDefault: false;
    };
    user_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    user: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    subtotal: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    tax_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    shipping_cost: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    total_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    discount_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    order_status: {
      semantic: 'status' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"status"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    payment_status: {
      semantic: 'status' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"status"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    shipping_status: {
      semantic: 'status' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"status"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    ordered_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    shipped_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    delivered_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    cancelled_at: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    is_cancelled: {
      semantic: 'cancellation' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    is_refunded: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    refund_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    items: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: true;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    payment: {
      semantic: 'currency' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
}

export interface OrderItemSemantics {
    id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: true;
      isUnique: false;
      hasDefault: true;
    };
    order_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    order: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    product_sku: {
      semantic: 'premium' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"premium","props":{"icon":"star"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    product_name: {
      semantic: 'premium' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"premium","props":{"icon":"star"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    unit_price: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    quantity: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    total_price: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    discount_percentage: {
      semantic: 'percentage' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"progress","variant":"compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    created_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
}

export interface PaymentSemantics {
    id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: true;
      isUnique: false;
      hasDefault: true;
    };
    payment_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: true;
      hasDefault: false;
    };
    order_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: true;
      hasDefault: false;
    };
    order: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    user_id: {
      semantic: 'identifier' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    user: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    currency: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    fee_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    net_amount: {
      semantic: 'currency' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    payment_method: {
      semantic: 'currency' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"text","variant":"currency-compact","props":{"precision":0}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    card_last_four: {
      semantic: 'identifier' as SemanticType;
      confidence: 80;
      renderInstruction: {"component":"text","variant":"mono-compact"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    payment_status: {
      semantic: 'status' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"badge","variant":"status"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    is_successful: {
      semantic: 'cancellation' as SemanticType;
      confidence: 85;
      renderInstruction: {"component":"badge","variant":"danger","props":{"size":"sm"}};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    is_failed: {
      semantic: 'danger' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"danger"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    failure_reason: {
      semantic: 'danger' as SemanticType;
      confidence: 90;
      renderInstruction: {"component":"badge","variant":"danger"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    processed_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: false;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
    created_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: true;
    };
    updated_at: {
      semantic: 'temporal' as SemanticType;
      confidence: 95;
      renderInstruction: {"component":"text","variant":"date-relative"};
      isRequired: true;
      isList: false;
      isId: false;
      isUnique: false;
      hasDefault: false;
    };
}
const semantics = {
  "User": {
    "id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": true,
      "isUnique": false,
      "hasDefault": true
    },
    "email": {
      "semantic": "email",
      "confidence": 95,
      "renderInstruction": {
        "component": "link",
        "variant": "email",
        "props": {
          "truncate": true
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": true,
      "hasDefault": false
    },
    "password_hash": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "first_name": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "last_name": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "phone_number": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "subscription_tier": {
      "semantic": "premium",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "premium",
        "props": {
          "icon": "star"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "is_premium": {
      "semantic": "premium",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "premium",
        "props": {
          "icon": "star"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "premium_until": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "account_balance": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "monthly_revenue": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "total_spent": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "credit_limit": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "created_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "updated_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "last_login_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "email_verified_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "is_cancelled": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "cancelled_at": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "is_deleted": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "deleted_at": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "is_suspended": {
      "semantic": "cancellation",
      "confidence": 85,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "suspension_reason": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "orders": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": true,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "payments": {
      "semantic": "currency",
      "confidence": 90,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": true,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "profile": {
      "semantic": "premium",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "premium",
        "props": {
          "icon": "star"
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    }
  },
  "Profile": {
    "id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": true,
      "isUnique": false,
      "hasDefault": true
    },
    "user_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": true,
      "hasDefault": false
    },
    "user": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "bio": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "avatar_url": {
      "semantic": "url",
      "confidence": 95,
      "renderInstruction": {
        "component": "link",
        "variant": "external",
        "props": {
          "truncate": true
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "website_url": {
      "semantic": "url",
      "confidence": 95,
      "renderInstruction": {
        "component": "link",
        "variant": "external",
        "props": {
          "truncate": true
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "linkedin_url": {
      "semantic": "url",
      "confidence": 95,
      "renderInstruction": {
        "component": "link",
        "variant": "external",
        "props": {
          "truncate": true
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "twitter_handle": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "country": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "city": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "postal_code": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "profile_completion_percentage": {
      "semantic": "percentage",
      "confidence": 95,
      "renderInstruction": {
        "component": "progress",
        "variant": "compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "engagement_rate": {
      "semantic": "percentage",
      "confidence": 95,
      "renderInstruction": {
        "component": "progress",
        "variant": "compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "created_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "updated_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    }
  },
  "Order": {
    "id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": true,
      "isUnique": false,
      "hasDefault": true
    },
    "order_number": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": true,
      "hasDefault": false
    },
    "user_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "user": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "subtotal": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "tax_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "shipping_cost": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "total_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "discount_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "order_status": {
      "semantic": "status",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "status"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "payment_status": {
      "semantic": "status",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "status"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "shipping_status": {
      "semantic": "status",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "status"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "ordered_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "shipped_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "delivered_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "cancelled_at": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "is_cancelled": {
      "semantic": "cancellation",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "is_refunded": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "refund_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "items": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": true,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "payment": {
      "semantic": "currency",
      "confidence": 90,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    }
  },
  "OrderItem": {
    "id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": true,
      "isUnique": false,
      "hasDefault": true
    },
    "order_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "order": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "product_sku": {
      "semantic": "premium",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "premium",
        "props": {
          "icon": "star"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "product_name": {
      "semantic": "premium",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "premium",
        "props": {
          "icon": "star"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "unit_price": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "quantity": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "total_price": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "discount_percentage": {
      "semantic": "percentage",
      "confidence": 95,
      "renderInstruction": {
        "component": "progress",
        "variant": "compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "created_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    }
  },
  "Payment": {
    "id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": true,
      "isUnique": false,
      "hasDefault": true
    },
    "payment_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": true,
      "hasDefault": false
    },
    "order_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": true,
      "hasDefault": false
    },
    "order": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "user_id": {
      "semantic": "identifier",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "user": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "currency": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "fee_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "net_amount": {
      "semantic": "currency",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "payment_method": {
      "semantic": "currency",
      "confidence": 90,
      "renderInstruction": {
        "component": "text",
        "variant": "currency-compact",
        "props": {
          "precision": 0
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "card_last_four": {
      "semantic": "identifier",
      "confidence": 80,
      "renderInstruction": {
        "component": "text",
        "variant": "mono-compact"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "payment_status": {
      "semantic": "status",
      "confidence": 95,
      "renderInstruction": {
        "component": "badge",
        "variant": "status"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "is_successful": {
      "semantic": "cancellation",
      "confidence": 85,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger",
        "props": {
          "size": "sm"
        }
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "is_failed": {
      "semantic": "danger",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "failure_reason": {
      "semantic": "danger",
      "confidence": 90,
      "renderInstruction": {
        "component": "badge",
        "variant": "danger"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "processed_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": false,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    },
    "created_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": true
    },
    "updated_at": {
      "semantic": "temporal",
      "confidence": 95,
      "renderInstruction": {
        "component": "text",
        "variant": "date-relative"
      },
      "isRequired": true,
      "isList": false,
      "isId": false,
      "isUnique": false,
      "hasDefault": false
    }
  }
} as const;

export const UserSemantics: UserSemantics = semantics.User;
export const ProfileSemantics: ProfileSemantics = semantics.Profile;
export const OrderSemantics: OrderSemantics = semantics.Order;
export const OrderItemSemantics: OrderItemSemantics = semantics.OrderItem;
export const PaymentSemantics: PaymentSemantics = semantics.Payment;

export default semantics;

// Utility functions
export function getFieldSemantic(modelName: string, fieldName: string): any {
  return (semantics as any)[modelName]?.[fieldName];
}

export function getHighConfidenceFields(modelName: string, threshold = 90): string[] {
  const modelSemantics = (semantics as any)[modelName];
  if (!modelSemantics) return [];
  
  return Object.entries(modelSemantics)
    .filter(([_, semantic]: [string, any]) => semantic.confidence >= threshold)
    .map(([fieldName]) => fieldName);
}

export function getFieldsBySemanticType(modelName: string, semanticType: SemanticType): string[] {
  const modelSemantics = (semantics as any)[modelName];
  if (!modelSemantics) return [];
  
  return Object.entries(modelSemantics)
    .filter(([_, semantic]: [string, any]) => semantic.semantic === semanticType)
    .map(([fieldName]) => fieldName);
}

export function getRenderInstruction(
  modelName: string, 
  fieldName: string, 
  context?: RenderContext
): any {
  const field = getFieldSemantic(modelName, fieldName);
  if (!field) return null;
  
  // If context is provided, re-analyze with that context
  if (context) {
    const { analyze } = require('@kneelinghorse/semantic-protocol');
    const result = analyze(fieldName, 'string', { context });
    return result.renderInstruction;
  }
  
  return field.renderInstruction;
}
