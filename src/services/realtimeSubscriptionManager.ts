import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Phase 1.1: Centralized Realtime Subscription Manager
 * 
 * Consolidates duplicate subscriptions to reduce RLS evaluation overhead.
 * Implements a single shared subscription per table with client-side filtering.
 * 
 * Expected Impact:
 * - Reduce subscription count by 83% (6 duplicate subscriptions → 1 shared)
 * - Reduce RLS evaluation overhead by 6x per change
 * - Reduce realtime query time from 11.9s → ~2s (83% improvement)
 */

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions {
  event?: PostgresEvent;
  schema?: string;
  filter?: string; // Server-side filter (e.g., 'activity_type=eq.autonomous_action')
  clientFilter?: (payload: any) => boolean; // Client-side filter function
}

interface ChannelData {
  channel: RealtimeChannel;
  subscribers: Set<(payload: any) => void>;
  reconnectAttempts: number;
}

/**
 * The local stack's Supabase emulator (local-sb) implements /realtime/v1 as a
 * NOOP broadcast stub — it never emits postgres_changes. Binding against it
 * makes supabase-js's realtime internals throw
 * "Cannot destructure property 'postgres_changes' of 'undefined'" on every
 * message, because the stub's replies don't match the v2 bind payload.
 *
 * The throw happens inside supabase-js, before our callback runs, so guarding
 * the callback cannot suppress it. The only real fix is to not bind. Callers
 * get a working no-op unsubscribe and must fetch data explicitly instead —
 * which UnifiedChat already does for tool calls (they come back on the
 * ai-chat response), so nothing is lost.
 */
const LOCAL_REALTIME_IS_STUB = (() => {
  if (typeof window === 'undefined') return true;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  // local-anon-key is the emulator's fixed key; real Supabase never uses it.
  return !key || key === 'local-anon-key';
})();

let _stubWarned = false;

class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private channels = new Map<string, ChannelData>();
  private readonly MAX_RECONNECT_DELAY = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  /**
   * Subscribe to table changes with automatic deduplication
   * 
   * @param tableName - Target table name
   * @param callback - Handler function for changes
   * @param options - Subscription configuration
   * @returns Unsubscribe function
   */
  subscribe(
    tableName: string,
    callback: (payload: any) => void,
    options: SubscriptionOptions = {}
  ): () => void {
    const {
      event = '*',
      schema = 'public',
      filter = '',
      clientFilter
    } = options;

    if (LOCAL_REALTIME_IS_STUB) {
      if (!_stubWarned) {
        _stubWarned = true;
        console.info(
          'ℹ️ Realtime disabled: the local Supabase emulator only stubs /realtime/v1 '
          + '(no postgres_changes). Subscriptions are no-ops here — data is fetched explicitly.'
        );
      }
      return () => {};
    }

    // Create unique channel key based on subscription parameters
    const channelKey = `${schema}.${tableName}:${event}:${filter}`;

    // Reuse existing channel or create new one
    if (!this.channels.has(channelKey)) {
      console.log(`📡 Creating shared subscription: ${channelKey}`);
      
      const channel = supabase
        .channel(`shared-${channelKey}`)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table: tableName,
            ...(filter && { filter }) // Add server-side filter if provided
          } as any,
          (payload) => {
            // Defensive: a malformed frame must never take down the app.
            if (!payload || typeof payload !== 'object') return;
            const channelData = this.channels.get(channelKey);
            if (!channelData) return;

            // Broadcast to all subscribers with optional client-side filtering
            channelData.subscribers.forEach(sub => {
              try {
                sub(payload);
              } catch (error) {
                console.error(`❌ Subscriber callback error for ${channelKey}:`, error);
              }
            });
          }
        )
        .subscribe((status) => {
          const channelData = this.channels.get(channelKey);
          if (!channelData) return;

          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to ${channelKey} (${channelData.subscribers.size} listeners)`);
            channelData.reconnectAttempts = 0; // Reset on successful connection
          } else if (status === 'CHANNEL_ERROR') {
            console.warn(`⚠️ Channel error for ${channelKey}, scheduling reconnect`);
            this.handleReconnect(channelKey, channelData);
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏱️ Subscription timeout for ${channelKey}`);
            this.handleReconnect(channelKey, channelData);
          }
        });

      this.channels.set(channelKey, {
        channel,
        subscribers: new Set(),
        reconnectAttempts: 0
      });
    }

    // Add subscriber to existing/new channel
    const channelData = this.channels.get(channelKey)!;
    
    // Wrap callback with client-side filter if provided
    const wrappedCallback = clientFilter
      ? (payload: any) => {
          if (clientFilter(payload)) {
            callback(payload);
          }
        }
      : callback;

    channelData.subscribers.add(wrappedCallback);
    console.log(`👤 Subscriber added to ${channelKey} (total: ${channelData.subscribers.size})`);

    // Return unsubscribe function
    return () => {
      channelData.subscribers.delete(wrappedCallback);
      console.log(`👋 Subscriber removed from ${channelKey} (remaining: ${channelData.subscribers.size})`);

      // Clean up channel if no more subscribers
      if (channelData.subscribers.size === 0) {
        console.log(`🧹 Removing unused channel: ${channelKey}`);
        supabase.removeChannel(channelData.channel);
        this.channels.delete(channelKey);
      }
    };
  }

  /**
   * Exponential backoff reconnection strategy (Phase 4.1)
   */
  private handleReconnect(channelKey: string, channelData: ChannelData) {
    const delay = Math.min(
      1000 * Math.pow(2, channelData.reconnectAttempts),
      this.MAX_RECONNECT_DELAY
    );
    channelData.reconnectAttempts++;

    console.log(`🔄 Reconnecting ${channelKey} in ${delay}ms (attempt ${channelData.reconnectAttempts})`);

    setTimeout(() => {
      if (this.channels.has(channelKey)) {
        console.log(`🔄 Attempting reconnect for ${channelKey}`);
        channelData.channel.subscribe();
      }
    }, delay);
  }

  /**
   * Get current subscription statistics
   */
  getStats(): {
    totalChannels: number;
    totalSubscribers: number;
    channels: Array<{ key: string; subscribers: number; reconnectAttempts: number }>;
  } {
    const channels = Array.from(this.channels.entries()).map(([key, data]) => ({
      key,
      subscribers: data.subscribers.size,
      reconnectAttempts: data.reconnectAttempts
    }));

    return {
      totalChannels: this.channels.size,
      totalSubscribers: channels.reduce((sum, ch) => sum + ch.subscribers, 0),
      channels
    };
  }

  /**
   * Cleanup all subscriptions (useful for testing or full reset)
   */
  cleanup() {
    console.log(`🧹 Cleaning up ${this.channels.size} realtime channels`);
    this.channels.forEach((data, key) => {
      supabase.removeChannel(data.channel);
      console.log(`✅ Removed channel: ${key}`);
    });
    this.channels.clear();
  }
}

// Export singleton instance
export const realtimeManager = RealtimeSubscriptionManager.getInstance();
