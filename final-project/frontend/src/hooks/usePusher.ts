import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

/**
 * Pusher event handler type
 */
export type PusherEventHandler = (data: any) => void;

/**
 * Hook options
 */
export interface UsePusherOptions {
  /**
   * Channel name to subscribe to (e.g., 'event-1')
   */
  channelName: string | null;
  /**
   * Event name to listen for (e.g., 'poke')
   */
  eventName: string;
  /**
   * Handler function called when event is received
   */
  onEvent: PusherEventHandler;
  /**
   * Called when connection is established
   */
  onConnected?: () => void;
  /**
   * Called when connection fails
   */
  onError?: (error: Error) => void;
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Custom hook for Pusher real-time events
 * 
 * @example
 * ```tsx
 * usePusher({
 *   channelName: eventId ? `event-${eventId}` : null,
 *   eventName: 'poke',
 *   onEvent: (data) => {
 *     console.log('Poke received:', data);
 *   },
 * });
 * ```
 */
export function usePusher(options: UsePusherOptions): void {
  const {
    channelName,
    eventName,
    onEvent,
    onConnected,
    onError,
    debug = false,
  } = options;

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  
  // Use refs to store callbacks to avoid recreating Pusher instance
  const onEventRef = useRef(onEvent);
  const onConnectedRef = useRef(onConnected);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onEventRef.current = onEvent;
    onConnectedRef.current = onConnected;
    onErrorRef.current = onError;
  }, [onEvent, onConnected, onError]);

  const log = useCallback(
    (message: string, ...args: any[]) => {
      // Always log Pusher events for debugging
      console.log(`[usePusher] ${message}`, ...args);
    },
    []
  );

  // Initialize Pusher (only once)
  useEffect(() => {
    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      const error = new Error('Pusher configuration missing. Please set VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER');
      console.error('[usePusher] Configuration missing:', {
        VITE_PUSHER_KEY: !!pusherKey,
        VITE_PUSHER_CLUSTER: !!pusherCluster,
      });
      onErrorRef.current?.(error);
      return;
    }

    // Don't recreate if already initialized
    if (pusherRef.current) {
      log('Pusher already initialized, skipping');
      return;
    }

    log('Initializing Pusher', { 
      key: pusherKey.substring(0, 10) + '...', 
      cluster: pusherCluster,
      fullKey: pusherKey, // Log full key for debugging
    });

    // Warn if cluster mismatch (common issue)
    const expectedCluster = 'ap1'; // Should match backend
    if (pusherCluster !== expectedCluster) {
      console.warn(`[usePusher] ⚠️ Cluster mismatch! Frontend: ${pusherCluster}, Expected: ${expectedCluster}. This may cause connection issues.`);
    }

    try {
      // Initialize Pusher with same config as official example
      // Official example: new Pusher('key', { cluster: 'ap1' })
      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });
      
      // Enable logging for debugging (same as official example)
      // Pusher.logToConsole is a global setting
      if (debug && typeof (window as any).Pusher !== 'undefined') {
        (window as any).Pusher.logToConsole = true;
      }

      pusherRef.current = pusher;

      // Connection event handlers
      pusher.connection.bind('connected', () => {
        log('Pusher connected');
        onConnectedRef.current?.();
      });

      let errorReported = false;
      pusher.connection.bind('error', (error: any) => {
        console.error('[usePusher] Pusher connection error:', {
          type: error?.type,
          error: error?.error,
          data: error?.data,
          state: pusherRef.current?.connection.state,
        });
        
        // For WebSocketError, only report once and let Pusher handle reconnection
        if (error?.type === 'WebSocketError') {
          if (!errorReported) {
            console.warn('[usePusher] WebSocket error detected, Pusher will attempt to reconnect');
            errorReported = true;
            // Don't call onError for WebSocket errors - Pusher handles reconnection automatically
          }
          return;
        }
        
        // For other errors, report them
        if (!errorReported) {
          errorReported = true;
          onErrorRef.current?.(error);
        }
      });

      pusher.connection.bind('disconnected', () => {
        log('Pusher disconnected');
      });

      pusher.connection.bind('state_change', (states: any) => {
        log('Pusher state changed:', {
          previous: states.previous,
          current: states.current,
        });
      });

      return () => {
        log('Cleaning up Pusher connection');
        if (pusherRef.current) {
          pusherRef.current.disconnect();
          pusherRef.current = null;
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize Pusher');
      console.error('[usePusher] Initialization error:', err);
      onErrorRef.current?.(err);
    }
  }, [log]); // Remove onConnected, onError from dependencies

  // Subscribe to channel and bind event
  useEffect(() => {
    if (!pusherRef.current || !channelName) {
      log('Skipping subscription: pusher not initialized or channelName is null');
      return;
    }

    log('Subscribing to channel', channelName);

    try {
      // Unsubscribe from previous channel if exists
      if (channelRef.current && pusherRef.current) {
        log('Unsubscribing from previous channel before subscribing to new one');
        try {
          const prevChannelName = channelRef.current.name;
          channelRef.current.unbind_all();
          pusherRef.current.unsubscribe(prevChannelName);
        } catch (e) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }

      const channel = pusherRef.current.subscribe(channelName);
      
      console.log('[usePusher] Channel subscription initiated:', {
        channel: channelName,
        pusherState: pusherRef.current.connection.state,
      });

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('[usePusher] ✓ Successfully subscribed to channel', channelName);
        log('Successfully subscribed to channel', channelName);
      });

      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[usePusher] ✗ Subscription error:', {
          channel: channelName,
          error: error?.error || error,
          errorType: error?.type,
          errorData: error?.data,
        });
        onErrorRef.current?.(new Error(`Failed to subscribe to channel: ${channelName}`));
      });

      // Bind to the event (same as official example: channel.bind('my-event', function(data) {...}))
      const eventHandler = (data: any) => {
        console.log(`[usePusher] ✓ Event received: ${eventName}`, {
          channel: channelName,
          event: eventName,
          data,
          timestamp: new Date().toISOString(),
          dataStringified: JSON.stringify(data), // Log full data for debugging
        });
        log(`Event received: ${eventName}`, data);
        try {
          onEventRef.current(data);
          console.log(`[usePusher] ✓ Event handler executed successfully for ${eventName}`);
        } catch (error) {
          console.error(`[usePusher] ✗ Error in event handler for ${eventName}:`, error);
        }
      };
      
      // Bind event handler (same as official example)
      channel.bind(eventName, eventHandler);
      channelRef.current = channel;
      
      console.log(`[usePusher] Event handler bound for '${eventName}' on channel '${channelName}'`);

      return () => {
        log('Unsubscribing from channel', channelName);
        if (channelRef.current) {
          try {
            channelRef.current.unbind(eventName, eventHandler);
          } catch (e) {
            // Ignore unbind errors
          }
          if (pusherRef.current) {
            try {
              pusherRef.current.unsubscribe(channelName);
            } catch (e) {
              // Ignore unsubscribe errors
            }
          }
          channelRef.current = null;
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(`Failed to subscribe to channel: ${channelName}`);
      console.error('[usePusher] Subscription catch error:', err);
      onErrorRef.current?.(err);
    }
  }, [channelName, eventName, log]); // Remove onEvent, onError from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current && pusherRef.current) {
        log('Cleaning up on unmount');
        channelRef.current.unbind(eventName);
        pusherRef.current.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [eventName, log]);
}

