import { test, expect } from '@playwright/test';

test.describe('E-Commerce Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/ecommerce');
    await page.waitForSelector('[data-semantic-type="container"]');
  });

  test('should complete full checkout flow with semantic validation', async ({ page }) => {
    // Step 1: Add items to cart
    await test.step('Add products to cart', async () => {
      const addToCartButtons = page.locator('[data-semantic-intent="add-to-cart"]');
      await expect(addToCartButtons).toHaveCount(3);
      
      await addToCartButtons.first().click();
      await expect(page.locator('[data-semantic-context*="cart"]')).toContainText('1 item');
      
      await addToCartButtons.nth(1).click();
      await expect(page.locator('[data-semantic-context*="cart"]')).toContainText('2 items');
    });

    // Step 2: Navigate to checkout
    await test.step('Navigate to checkout', async () => {
      const checkoutButton = page.locator('[data-semantic-intent="checkout"]');
      await expect(checkoutButton).toHaveAttribute('data-semantic-type', 'action');
      await checkoutButton.click();
      
      await expect(page).toHaveURL(/.*checkout/);
      await expect(page.locator('[data-semantic-flow="checkout"]')).toBeVisible();
    });

    // Step 3: Fill shipping information
    await test.step('Complete shipping form', async () => {
      const shippingForm = page.locator('[data-semantic-context*="shipping"]');
      await expect(shippingForm).toHaveAttribute('data-semantic-type', 'input');
      
      await shippingForm.locator('[data-semantic-intent="collect"][data-field="name"]').fill('John Doe');
      await shippingForm.locator('[data-semantic-intent="collect"][data-field="email"]').fill('john@example.com');
      await shippingForm.locator('[data-semantic-intent="collect"][data-field="address"]').fill('123 Main St');
      await shippingForm.locator('[data-semantic-intent="collect"][data-field="city"]').fill('New York');
      await shippingForm.locator('[data-semantic-intent="collect"][data-field="zip"]').fill('10001');
      
      // Validate semantic relationships
      const formFields = await page.locator('[data-semantic-intent="collect"]').all();
      for (const field of formFields) {
        const validation = await field.getAttribute('data-semantic-validation');
        expect(validation).toBeTruthy();
      }
      
      await page.locator('[data-semantic-intent="continue"][data-semantic-step="shipping"]').click();
    });

    // Step 4: Fill payment information
    await test.step('Complete payment form', async () => {
      const paymentForm = page.locator('[data-semantic-context*="payment"]');
      await expect(paymentForm).toBeVisible();
      
      await paymentForm.locator('[data-semantic-intent="collect"][data-field="card-number"]').fill('4242 4242 4242 4242');
      await paymentForm.locator('[data-semantic-intent="collect"][data-field="expiry"]').fill('12/25');
      await paymentForm.locator('[data-semantic-intent="collect"][data-field="cvv"]').fill('123');
      
      // Check security indicators
      const securityBadge = page.locator('[data-semantic-security="encrypted"]');
      await expect(securityBadge).toBeVisible();
      
      await page.locator('[data-semantic-intent="continue"][data-semantic-step="payment"]').click();
    });

    // Step 5: Review order
    await test.step('Review order details', async () => {
      const reviewSection = page.locator('[data-semantic-context*="review"]');
      await expect(reviewSection).toBeVisible();
      
      // Verify semantic relationships between sections
      const orderSummary = page.locator('[data-semantic-type="display"][data-semantic-intent="summary"]');
      await expect(orderSummary).toContainText('Order Total');
      
      // Check that all required sections are linked
      const relatedSections = await page.locator('[data-semantic-relationships*="checkout-flow"]').count();
      expect(relatedSections).toBeGreaterThanOrEqual(3);
    });

    // Step 6: Submit order
    await test.step('Submit order', async () => {
      const submitButton = page.locator('[data-semantic-intent="submit"][data-semantic-critical="true"]');
      await expect(submitButton).toBeEnabled();
      
      // Verify button has proper semantic attributes
      await expect(submitButton).toHaveAttribute('data-semantic-type', 'action');
      await expect(submitButton).toHaveAttribute('data-semantic-context', expect.stringContaining('final'));
      
      await submitButton.click();
      
      // Wait for confirmation
      await expect(page.locator('[data-semantic-intent="confirmation"]')).toBeVisible();
      await expect(page).toHaveURL(/.*confirmation/);
    });

    // Step 7: Verify confirmation page
    await test.step('Verify confirmation semantics', async () => {
      const confirmationContainer = page.locator('[data-semantic-flow="confirmation"]');
      await expect(confirmationContainer).toBeVisible();
      
      // Check for order number
      const orderNumber = page.locator('[data-semantic-type="display"][data-semantic-intent="identifier"]');
      await expect(orderNumber).toContainText(/Order #\d+/);
      
      // Verify completion state
      const completionIndicator = page.locator('[data-semantic-state="completed"]');
      await expect(completionIndicator).toBeVisible();
    });
  });

  test('should handle validation errors with semantic feedback', async ({ page }) => {
    // Navigate directly to checkout
    await page.goto('/examples/ecommerce/checkout');
    
    // Try to submit without filling required fields
    const submitButton = page.locator('[data-semantic-intent="continue"]').first();
    await submitButton.click();
    
    // Check for semantic validation errors
    const validationErrors = page.locator('[data-semantic-type="feedback"][data-semantic-intent="error"]');
    await expect(validationErrors).toHaveCount(5); // Assuming 5 required fields
    
    // Verify error messages have proper context
    const firstError = validationErrors.first();
    await expect(firstError).toHaveAttribute('data-semantic-field', expect.any(String));
    await expect(firstError).toHaveAttribute('data-semantic-context', expect.stringContaining('validation'));
  });

  test('should maintain semantic state across navigation', async ({ page }) => {
    // Add item to cart
    await page.locator('[data-semantic-intent="add-to-cart"]').first().click();
    
    // Navigate to different page
    await page.goto('/examples/ecommerce/products');
    
    // Return to cart
    await page.goto('/examples/ecommerce/cart');
    
    // Verify semantic state persistence
    const cartState = await page.locator('[data-semantic-state="cart"]').getAttribute('data-semantic-items');
    expect(parseInt(cartState || '0')).toBeGreaterThan(0);
  });

  test('should handle semantic relationships in cart updates', async ({ page }) => {
    // Add multiple items
    const addButtons = page.locator('[data-semantic-intent="add-to-cart"]');
    await addButtons.first().click();
    await addButtons.nth(1).click();
    
    // Go to cart
    await page.goto('/examples/ecommerce/cart');
    
    // Update quantity
    const quantityInput = page.locator('[data-semantic-intent="update-quantity"]').first();
    await quantityInput.fill('3');
    
    // Verify related components update
    const priceDisplay = page.locator('[data-semantic-relationships*="cart-item"]');
    await expect(priceDisplay).toHaveAttribute('data-semantic-updated', 'true');
    
    // Remove item
    const removeButton = page.locator('[data-semantic-intent="remove"]').first();
    await removeButton.click();
    
    // Verify semantic state updates
    const cartItems = await page.locator('[data-semantic-type="container"][data-semantic-context*="cart-item"]').count();
    expect(cartItems).toBe(1);
  });

  test('should validate semantic accessibility attributes', async ({ page }) => {
    // Check all interactive elements have proper ARIA attributes
    const interactiveElements = page.locator('[data-semantic-type="action"], [data-semantic-type="input"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const semanticType = await element.getAttribute('data-semantic-type');
      
      if (semanticType === 'action') {
        await expect(element).toHaveAttribute('role', expect.stringMatching(/button|link/));
      } else if (semanticType === 'input') {
        await expect(element).toHaveAttribute('aria-label', expect.any(String));
      }
    }
  });
});