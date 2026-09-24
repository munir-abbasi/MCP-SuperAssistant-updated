// hooks/useEventBus.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { eventBus } from '../events/event-bus';
import type { EventMap, EventCallback } from '../events/event-types';
import { createLogger } from '@extension/shared/lib/logger';

// Hook for listening to events

const logger = createLogger('UseEventBus');

export function useEventListener<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedCallback = (data: EventMap[K]) => {
      try {
        callbackRef.current(data);
      } catch (error) {
        logger.error(`Error in event listener for ${String(event)}:`, error);
      }
    };

    const unsubscribe = eventBus.on(event, wrappedCallback);

    return unsubscribe;
  }, [event]);
}

// Hook for emitting events
export function useEventEmitter() {
  return useCallback(<K extends keyof EventMap>(event: K, data: EventMap[K]) => {
    try {
      eventBus.emit(event, data);
    } catch (error) {
      logger.error(`Error emitting event ${String(event)}:`, error);
    }
  }, []);
}

// Hook for one-time event listening
export function useEventOnce<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>) {
  const callbackRef = useRef(callback);
  const hasTriggered = useRef(false);
  callbackRef.current = callback;

  useEffect(() => {
    if (hasTriggered.current) return;

    const wrappedCallback = (data: EventMap[K]) => {
      if (hasTriggered.current) return;
      hasTriggered.current = true;

      try {
        callbackRef.current(data);
      } catch (error) {
        logger.error(`Error in once listener for ${String(event)}:`, error);
      }
    };

    const unsubscribe = eventBus.once(event, wrappedCallback);

    return unsubscribe;
  }, [event]); // Only re-subscribe if event name changes
}

// Hook for event-driven state synchronization
export function useEventSync<T, K extends keyof EventMap>(
  event: K,
  initialValue: T,
  extractor: (eventData: EventMap[K]) => T,
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEventListener(event, data => {
    try {
      const newValue = extractor(data);
      setValue(newValue);
    } catch (error) {
      logger.error(`Error extracting value from event ${String(event)}:`, error);
    }
  });

  return value;
}

// Hook for conditional event listening
export function useConditionalEventListener<K extends keyof EventMap>(
  event: K,
  callback: EventCallback<EventMap[K]>,
  condition: boolean,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!condition) return;

    const wrappedCallback = (data: EventMap[K]) => {
      try {
        callbackRef.current(data);
      } catch (error) {
        logger.error(`Error in conditional listener for ${String(event)}:`, error);
      }
    };

    const unsubscribe = eventBus.on(event, wrappedCallback);

    return unsubscribe;
  }, [event, condition]);
}

// Hook for multiple event listening
export function useMultipleEventListeners(
  eventCallbacks: Partial<{ [K in keyof EventMap]: EventCallback<EventMap[K]> }>,
) {
  const eventCallbacksRef = useRef(eventCallbacks);
  eventCallbacksRef.current = eventCallbacks;

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    Object.entries(eventCallbacksRef.current).forEach(([event, callback]) => {
      if (callback) {
        const eventName = event as keyof EventMap;
        const typedCallback = callback as EventCallback<EventMap[keyof EventMap]>; // General type for safety

        const wrappedCallback = (data: EventMap[keyof EventMap]) => {
          try {
            typedCallback(data);
          } catch (error) {
            logger.error(`Error in listener for ${String(eventName)}:`, error);
          }
        };
        unsubscribers.push(eventBus.on(eventName, wrappedCallback));
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventCallbacks]);
}
