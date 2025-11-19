import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getSyncQueue, 
  removeSyncQueueItem, 
  updateSyncQueueRetry 
} from '@/utils/offlineStorage';
import { toast } from 'sonner';

const MAX_RETRIES = 3;

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);

  const syncQueuedActions = async () => {
    if (!navigator.onLine) return;

    setIsSyncing(true);
    const queue = await getSyncQueue();
    setPendingItems(queue.length);

    if (queue.length === 0) {
      setIsSyncing(false);
      return;
    }

    console.log(`Syncing ${queue.length} queued actions...`);

    for (const item of queue) {
      try {
        let success = false;

        switch (item.action) {
          case 'cart':
            // Sync cart items
            const { error: cartError } = await supabase
              .from('cart_items')
              .upsert(item.data);
            success = !cartError;
            break;

          case 'wishlist':
            // Sync wishlist items
            const { error: wishlistError } = await supabase
              .from('wishlists')
              .upsert(item.data);
            success = !wishlistError;
            break;

          case 'review':
            // Sync reviews
            const { error: reviewError } = await supabase
              .from('reviews')
              .insert(item.data);
            success = !reviewError;
            break;
        }

        if (success) {
          await removeSyncQueueItem(item.id!);
          setPendingItems(prev => prev - 1);
          console.log(`Synced ${item.action} successfully`);
        } else {
          // Increment retry count
          const newRetries = item.retries + 1;
          if (newRetries >= MAX_RETRIES) {
            await removeSyncQueueItem(item.id!);
            console.error(`Failed to sync ${item.action} after ${MAX_RETRIES} retries`);
          } else {
            await updateSyncQueueRetry(item.id!, newRetries);
          }
        }
      } catch (error) {
        console.error(`Error syncing ${item.action}:`, error);
        const newRetries = item.retries + 1;
        if (newRetries >= MAX_RETRIES) {
          await removeSyncQueueItem(item.id!);
        } else {
          await updateSyncQueueRetry(item.id!, newRetries);
        }
      }
    }

    const remainingQueue = await getSyncQueue();
    if (remainingQueue.length === 0) {
      toast.success('All offline actions synced successfully');
    }

    setIsSyncing(false);
  };

  useEffect(() => {
    // Sync when coming back online
    const handleOnline = () => {
      console.log('Back online, syncing queued actions...');
      syncQueuedActions();
    };

    window.addEventListener('online', handleOnline);

    // Initial sync check
    if (navigator.onLine) {
      syncQueuedActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return {
    isSyncing,
    pendingItems,
    syncNow: syncQueuedActions,
  };
}
