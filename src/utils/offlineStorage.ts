import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  products: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
  categories: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
  images: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
    };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      action: 'cart' | 'wishlist' | 'review';
      data: any;
      timestamp: number;
      retries: number;
    };
    autoIncrement: true;
  };
}

const DB_NAME = 'smartkenya-offline';
const DB_VERSION = 1;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      // Images store
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'url' });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    },
  });

  return dbInstance;
}

// Products
export async function cacheProducts(products: any[]) {
  const db = await initOfflineDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  
  const timestamp = Date.now();
  const expiresAt = timestamp + CACHE_DURATION;

  await Promise.all(
    products.map(product =>
      store.put({
        id: product.product_id,
        data: product,
        timestamp,
        expiresAt,
      })
    )
  );

  await tx.done;
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await initOfflineDB();
  const now = Date.now();
  const allProducts = await db.getAll('products');
  
  // Filter out expired products
  const validProducts = allProducts.filter(p => p.expiresAt > now);
  
  return validProducts.map(p => p.data);
}

export async function getCachedProduct(productId: string): Promise<any | null> {
  const db = await initOfflineDB();
  const cached = await db.get('products', productId);
  
  if (!cached) return null;
  
  // Check if expired
  if (cached.expiresAt < Date.now()) {
    await db.delete('products', productId);
    return null;
  }
  
  return cached.data;
}

// Categories
export async function cacheCategories(categories: any[]) {
  const db = await initOfflineDB();
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  
  const timestamp = Date.now();
  const expiresAt = timestamp + CACHE_DURATION;

  await Promise.all(
    categories.map(category =>
      store.put({
        id: category.id.toString(),
        data: category,
        timestamp,
        expiresAt,
      })
    )
  );

  await tx.done;
}

export async function getCachedCategories(): Promise<any[]> {
  const db = await initOfflineDB();
  const allCategories = await db.getAll('categories');
  
  return allCategories.map(c => c.data);
}

// Images
export async function cacheImage(url: string, blob: Blob) {
  try {
    const db = await initOfflineDB();
    await db.put('images', {
      url,
      blob,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to cache image:', error);
  }
}

export async function getCachedImage(url: string): Promise<string | null> {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('images', url);
    
    if (!cached) return null;
    
    return URL.createObjectURL(cached.blob);
  } catch (error) {
    console.error('Failed to get cached image:', error);
    return null;
  }
}

// Sync Queue
export async function addToSyncQueue(action: 'cart' | 'wishlist' | 'review', data: any) {
  const db = await initOfflineDB();
  await db.add('syncQueue', {
    action,
    data,
    timestamp: Date.now(),
    retries: 0,
  });
}

export async function getSyncQueue() {
  const db = await initOfflineDB();
  return await db.getAll('syncQueue');
}

export async function removeSyncQueueItem(id: number) {
  const db = await initOfflineDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueRetry(id: number, retries: number) {
  const db = await initOfflineDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.retries = retries;
    await db.put('syncQueue', item);
  }
}

// Cleanup
export async function cleanupExpiredCache() {
  const db = await initOfflineDB();
  const now = Date.now();

  // Clean products
  const products = await db.getAll('products');
  const expiredProducts = products.filter(p => p.expiresAt < now);
  await Promise.all(expiredProducts.map(p => db.delete('products', p.id)));

  // Clean old images (keep for 7 days)
  const images = await db.getAll('images');
  const oldImages = images.filter(img => now - img.timestamp > 7 * 24 * 60 * 60 * 1000);
  await Promise.all(oldImages.map(img => db.delete('images', img.url)));

  console.log(`Cleaned up ${expiredProducts.length} expired products and ${oldImages.length} old images`);
}

// Get cache statistics
export async function getCacheStats() {
  const db = await initOfflineDB();
  const [products, categories, images, syncQueue] = await Promise.all([
    db.count('products'),
    db.count('categories'),
    db.count('images'),
    db.count('syncQueue'),
  ]);

  return {
    products,
    categories,
    images,
    pendingSync: syncQueue,
  };
}
