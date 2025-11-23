# A/B Testing System Documentation

## Overview

The A/B Testing system allows you to test different versions of features, layouts, or content to determine which performs better with users.

## Setup

The A/B Testing system is already integrated into your app via the `ABTestProvider` in `main.tsx`.

## How to Use

### 1. Import the Hook

```typescript
import { useABTest } from '@/hooks/useABTest';
```

### 2. Define Your Test

```typescript
const { variant, trackConversion, isVariant } = useABTest({
  testId: 'hero-button-test',
  variants: ['control', 'variant-a', 'variant-b'],
  weights: [0.5, 0.25, 0.25] // Optional: 50% control, 25% each variant
});
```

### 3. Render Different Variants

```typescript
return (
  <div>
    {isVariant('control') && (
      <button className="bg-primary">Buy Now</button>
    )}
    {isVariant('variant-a') && (
      <button className="bg-secondary">Shop Now</button>
    )}
    {isVariant('variant-b') && (
      <button className="bg-accent">Get Started</button>
    )}
  </div>
);
```

### 4. Track Conversions

```typescript
<button onClick={() => {
  // Your button logic
  trackConversion(29.99); // Optional: pass conversion value
}}>
  Buy Now
</button>
```

## Example Use Cases

### Test Different Hero Layouts

```typescript
const { isVariant, trackConversion } = useABTest({
  testId: 'hero-layout',
  variants: ['single-image', 'carousel', 'video']
});

return (
  <>
    {isVariant('single-image') && <SingleImageHero />}
    {isVariant('carousel') && <CarouselHero />}
    {isVariant('video') && <VideoHero />}
  </>
);
```

### Test CTA Button Colors

```typescript
const { variant } = useABTest({
  testId: 'cta-color',
  variants: ['blue', 'green', 'red']
});

return (
  <button className={`bg-${variant}-500`}>
    Add to Cart
  </button>
);
```

### Test Product Card Layouts

```typescript
const { isVariant, trackConversion } = useABTest({
  testId: 'product-card-layout',
  variants: ['compact', 'detailed', 'minimal']
});
```

## Viewing Results

A/B test data is stored in localStorage. You can access it via:

```typescript
import { getABTestResults } from '@/hooks/useABTest';

const results = getABTestResults();
console.log(results);
```

### Integration with Google Analytics

The system automatically sends events to Google Analytics if available:

- `ab_test_assigned` - When a user is assigned to a variant
- `ab_test_conversion` - When a conversion is tracked

## Best Practices

1. **Test One Thing at a Time**: Only change one element per test
2. **Run Tests Long Enough**: Collect data for at least 7-14 days
3. **Sufficient Sample Size**: Ensure each variant gets enough traffic
4. **Clear Hypothesis**: Know what you're testing and why
5. **Statistical Significance**: Don't draw conclusions too early

## API Reference

### `useABTest(config)`

**Parameters:**
- `testId` (string): Unique identifier for the test
- `variants` (string[]): Array of variant names
- `weights` (number[], optional): Distribution weights (must sum to 1)

**Returns:**
- `variant` (string): Current user's assigned variant
- `trackConversion(value?)` (function): Track a conversion event
- `isVariant(name)` (function): Check if current variant matches name

### `getABTestResults()`

Returns all A/B test events from localStorage.

### `clearABTestData(testId?)`

Clears A/B test data. If `testId` is provided, only clears that test.

## Cleanup

To remove an A/B test after completion:

```typescript
import { clearABTestData } from '@/hooks/useABTest';

// Clear specific test
clearABTestData('hero-button-test');

// Clear all tests
clearABTestData();
```
