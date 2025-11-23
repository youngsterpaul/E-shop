import React, { createContext, useContext, ReactNode } from 'react';

/**
 * A/B Test Provider Component
 * Wraps the app to enable A/B testing across all components
 * 
 * Usage in App.tsx:
 * <ABTestProvider>
 *   <App />
 * </ABTestProvider>
 */

interface ABTestContextType {
  isEnabled: boolean;
}

const ABTestContext = createContext<ABTestContextType>({
  isEnabled: process.env.NODE_ENV === 'production'
});

interface ABTestProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function ABTestProvider({ children, enabled = process.env.NODE_ENV === 'production' }: ABTestProviderProps) {
  return (
    <ABTestContext.Provider value={{ isEnabled: enabled }}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTestContext() {
  return useContext(ABTestContext);
}

/**
 * Example A/B Test Component
 * Shows how to implement an A/B test for any feature
 */
export function ExampleABTest() {
  // This is just an example - delete or modify as needed
  // const { variant, trackConversion, isVariant } = useABTest({
  //   testId: 'hero-button-color',
  //   variants: ['blue', 'green', 'red'],
  //   weights: [0.5, 0.25, 0.25]
  // });

  // return (
  //   <div>
  //     {isVariant('blue') && <button className="bg-blue-500">Buy Now</button>}
  //     {isVariant('green') && <button className="bg-green-500">Buy Now</button>}
  //     {isVariant('red') && <button className="bg-red-500">Buy Now</button>}
  //   </div>
  // );
  
  return null;
}
