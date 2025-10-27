<<<<<<< HEAD
import { Product } from '@/hooks/useProducts';

// Utility function to extract specifications from product names
export const extractSpecificationsFromName = (name: string): Record<string, string> => {
  const specs: Record<string, string> = {};

  // Extract RAM
  const ramMatch = name.match(/(\d+)GB RAM/i);
  if (ramMatch) {
    specs['RAM'] = `${ramMatch[1]}GB`;
  }

  // Extract Storage
  const storageMatch = name.match(/(\d+)GB ROM/i);
  if (storageMatch) {
    specs['Storage'] = `${storageMatch[1]}GB`;
  }

  // Extract Camera (main camera)
  const cameraMatches = name.match(/(\d+)MP/gi);
  if (cameraMatches && cameraMatches.length > 0) {
    // Get the highest MP (usually the main camera)
    const mpValues = cameraMatches.map(match => parseInt(match.match(/(\d+)/)?.[1] || '0'));
    const maxMP = Math.max(...mpValues);
    specs['Camera'] = `${maxMP}MP`;
  }

  // Extract Battery
  const batteryMatch = name.match(/(\d+)mAh/i);
  if (batteryMatch) {
    specs['Battery'] = `${batteryMatch[1]}mAh`;
  }

  // Extract Display Size
  const displayMatch = name.match(/(\d+\.?\d*)".*Display/i);
  if (displayMatch) {
    specs['Display Size'] = `${displayMatch[1]}"`;
  }

  // Extract Chipset/Processor
  const chipsetMatches = name.match(/(?:Snapdragon|MediaTek|Exynos|Kirin|A\d+|M\d+)\s+[\w\s]*(?:\d+|Pro|Ultra|Plus)*/gi);
  if (chipsetMatches) {
    specs['Processor'] = chipsetMatches[0];
  }

  return specs;
};

// Extract features from product name
export const extractFeaturesFromName = (name: string): string[] => {
  const features: string[] = [];

  if (name.includes('5G')) features.push('5G');
  if (name.includes('AMOLED')) features.push('AMOLED Display');
  if (name.includes('OLED')) features.push('OLED Display');
  if (name.includes('120Hz')) features.push('120Hz Display');
  if (name.includes('90Hz')) features.push('90Hz Display');
  if (name.includes('Fast Charging')) features.push('Fast Charging');
  if (name.includes('Wireless Charging')) features.push('Wireless Charging');
  if (name.includes('Water Resistant') || name.includes('IP')) features.push('Water Resistant');
  if (name.includes('Face ID') || name.includes('Face Unlock')) features.push('Face Unlock');
  if (name.includes('Fingerprint')) features.push('Fingerprint Scanner');
  if (name.includes('Dual SIM')) features.push('Dual SIM');
  if (name.includes('NFC')) features.push('NFC');

  return features;
};

// Extract brand from product name
export const extractBrandFromName = (name: string): string | null => {
  const brandPatterns = [
    /^Samsung/i,
    /^Apple/i,
    /^iPhone/i,
    /^Xiaomi/i,
    /^Huawei/i,
    /^OnePlus/i,
    /^Google/i,
    /^Oppo/i,
    /^Vivo/i,
    /^Realme/i,
    /^Nokia/i,
    /^Motorola/i,
    /^Sony/i,
    /^LG/i,
    /^Tecno/i,
    /^Infinix/i,
  ];

  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      // Special case for iPhone -> Apple
      if (match[0].toLowerCase() === 'iphone') {
        return 'Apple';
      }
      return match[0];
    }
  }

  return null;
};

// Get comprehensive product specifications
export const getProductSpecifications = (product: Product): Record<string, string> => {
  let specs: Record<string, string> = {};

  // First get specs from the specification field
  if (product.specification && typeof product.specification === 'object') {
    specs = { ...product.specification };
  }

  // Then merge with specs extracted from name
  const nameSpecs = extractSpecificationsFromName(product.name);
  specs = { ...specs, ...nameSpecs };

  return specs;
};

// Get comprehensive product features
export const getProductFeatures = (product: Product): string[] => {
  let features: string[] = [];

  // Get features from features field
  if (product.features) {
    if (Array.isArray(product.features)) {
      features = [...product.features];
    } else if (typeof product.features === 'string') {
      features = [product.features];
    }
  }

  // Get features from name
  const nameFeatures = extractFeaturesFromName(product.name);
  features = [...features, ...nameFeatures];

  // Remove duplicates
  return Array.from(new Set(features));
=======
import { Product } from '@/hooks/useProducts';

// Utility function to extract specifications from product names
export const extractSpecificationsFromName = (name: string): Record<string, string> => {
  const specs: Record<string, string> = {};

  // Extract RAM
  const ramMatch = name.match(/(\d+)GB RAM/i);
  if (ramMatch) {
    specs['RAM'] = `${ramMatch[1]}GB`;
  }

  // Extract Storage
  const storageMatch = name.match(/(\d+)GB ROM/i);
  if (storageMatch) {
    specs['Storage'] = `${storageMatch[1]}GB`;
  }

  // Extract Camera (main camera)
  const cameraMatches = name.match(/(\d+)MP/gi);
  if (cameraMatches && cameraMatches.length > 0) {
    // Get the highest MP (usually the main camera)
    const mpValues = cameraMatches.map(match => parseInt(match.match(/(\d+)/)?.[1] || '0'));
    const maxMP = Math.max(...mpValues);
    specs['Camera'] = `${maxMP}MP`;
  }

  // Extract Battery
  const batteryMatch = name.match(/(\d+)mAh/i);
  if (batteryMatch) {
    specs['Battery'] = `${batteryMatch[1]}mAh`;
  }

  // Extract Display Size
  const displayMatch = name.match(/(\d+\.?\d*)".*Display/i);
  if (displayMatch) {
    specs['Display Size'] = `${displayMatch[1]}"`;
  }

  // Extract Chipset/Processor
  const chipsetMatches = name.match(/(?:Snapdragon|MediaTek|Exynos|Kirin|A\d+|M\d+)\s+[\w\s]*(?:\d+|Pro|Ultra|Plus)*/gi);
  if (chipsetMatches) {
    specs['Processor'] = chipsetMatches[0];
  }

  return specs;
};

// Extract features from product name
export const extractFeaturesFromName = (name: string): string[] => {
  const features: string[] = [];

  if (name.includes('5G')) features.push('5G');
  if (name.includes('AMOLED')) features.push('AMOLED Display');
  if (name.includes('OLED')) features.push('OLED Display');
  if (name.includes('120Hz')) features.push('120Hz Display');
  if (name.includes('90Hz')) features.push('90Hz Display');
  if (name.includes('Fast Charging')) features.push('Fast Charging');
  if (name.includes('Wireless Charging')) features.push('Wireless Charging');
  if (name.includes('Water Resistant') || name.includes('IP')) features.push('Water Resistant');
  if (name.includes('Face ID') || name.includes('Face Unlock')) features.push('Face Unlock');
  if (name.includes('Fingerprint')) features.push('Fingerprint Scanner');
  if (name.includes('Dual SIM')) features.push('Dual SIM');
  if (name.includes('NFC')) features.push('NFC');

  return features;
};

// Extract brand from product name
export const extractBrandFromName = (name: string): string | null => {
  const brandPatterns = [
    /^Samsung/i,
    /^Apple/i,
    /^iPhone/i,
    /^Xiaomi/i,
    /^Huawei/i,
    /^OnePlus/i,
    /^Google/i,
    /^Oppo/i,
    /^Vivo/i,
    /^Realme/i,
    /^Nokia/i,
    /^Motorola/i,
    /^Sony/i,
    /^LG/i,
    /^Tecno/i,
    /^Infinix/i,
  ];

  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      // Special case for iPhone -> Apple
      if (match[0].toLowerCase() === 'iphone') {
        return 'Apple';
      }
      return match[0];
    }
  }

  return null;
};

// Get comprehensive product specifications
export const getProductSpecifications = (product: Product): Record<string, string> => {
  let specs: Record<string, string> = {};

  // First get specs from the specification field
  if (product.specification && typeof product.specification === 'object') {
    specs = { ...product.specification };
  }

  // Then merge with specs extracted from name
  const nameSpecs = extractSpecificationsFromName(product.name);
  specs = { ...specs, ...nameSpecs };

  return specs;
};

// Get comprehensive product features
export const getProductFeatures = (product: Product): string[] => {
  let features: string[] = [];

  // Get features from features field
  if (product.features) {
    if (Array.isArray(product.features)) {
      features = [...product.features];
    } else if (typeof product.features === 'string') {
      features = [product.features];
    }
  }

  // Get features from name
  const nameFeatures = extractFeaturesFromName(product.name);
  features = [...features, ...nameFeatures];

  // Remove duplicates
  return Array.from(new Set(features));
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
};