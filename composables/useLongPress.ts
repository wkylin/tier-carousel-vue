import { getCurrentScope, onScopeDispose, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";

export interface UseLongPressOptions {
  /** Hold duration in ms before a long press fires. Default 500. */
  delay?: number;
  /** Movement (px) past which the gesture is treated as a swipe/scroll and cancels the long press. Default 10. */
  moveTolerance?: number;
  /** Fire a short haptic pulse the moment a long press is recognised. Default true. */
  haptic?: boolean;
}

export interface UseLongPressCallbacks {
  /** Held still for `delay` without moving past `moveTolerance`. */
  onLongPress?: (event: PointerEvent) => void;
  /** Released before the long-press timer fired and without moving past `moveTolerance`. */
  onTap?: (event: PointerEvent) => void;
}

/**
 * Recognises tap vs. long press from a single pointer-event stream, so a list
 * item can do "tap to open / long press to enter pin mode" without binding a
 * native `@click` (which would ghost-fire after a long press on mobile).
 *
 * The returned object is keyed by event name, spread it onto an element with
 * `v-on`. Build a fresh binding per list item so each row tracks its own timer.
 *
 * ```vue
 * <li v-on="bind(pin)">…</li>
 * ```
 */
export function useLongPress(
  callbacks: UseLongPressCallbacks,
  options: UseLongPressOptions = {},
) {
  const { delay = 500, moveTolerance = 10, haptic = true } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let longPressed = false;
  let activeId: number | null = null;

  function clear() {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = null;
    activeId = null;
  }

  function pointerdown(event: PointerEvent) {
    // Already tracking a primary pointer — ignore extra fingers.
    if (activeId !== null) {
      return;
    }
    activeId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    longPressed = false;

    // Prevent text selection during the hold gesture.
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    document.addEventListener("selectstart", preventSelect, { capture: true });

    // Schedule a vibrate pattern: start a short pulse when the timer fires.
    // vibrate() must be called in a user-gesture stack, so we use a
    // pattern trick: pointerdown is a gesture — schedule [delay, 15] so
    // the device is silent for `delay`ms then pulses 15ms, matching the
    // long-press threshold without needing a setTimeout callback.
    //
    // Chrome blocks (and logs) vibrate() until the page has been activated by a
    // real gesture, so skip it before first activation to avoid the warning.
    const activated = navigator.userActivation?.hasBeenActive ?? true;
    if (haptic && activated && navigator.vibrate) {
      navigator.vibrate([delay, 0, 15]);
    }

    timer = setTimeout(() => {
      longPressed = true;
      timer = null;
      callbacks.onLongPress?.(event);
    }, delay);
  }

  function preventSelect(event: Event) {
    event.preventDefault();
  }

  function releaseSelect() {
    document.removeEventListener("selectstart", preventSelect, {
      capture: true,
    });
    // Clear any accidental selection that snuck through.
    window.getSelection()?.removeAllRanges();
  }

  function pointermove(event: PointerEvent) {
    if (event.pointerId !== activeId || timer === null) {
      return;
    }
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) > moveTolerance) {
      navigator.vibrate?.(0);
      releaseSelect();
      clear();
    }
  }

  function pointerup(event: PointerEvent) {
    if (event.pointerId !== activeId) {
      return;
    }
    const wasLongPress = longPressed;
    if (!wasLongPress) {
      navigator.vibrate?.(0);
    }
    releaseSelect();
    clear();
    if (!wasLongPress) {
      callbacks.onTap?.(event);
    }
  }

  function pointercancel(event: PointerEvent) {
    if (event.pointerId !== activeId) {
      return;
    }
    navigator.vibrate?.(0);
    releaseSelect();
    clear();
  }

  function contextmenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Only register cleanup when called inside an active effect scope (e.g. setup).
  // Mirrors VueUse's tryOnScopeDispose so calling outside a scope is a harmless no-op.
  if (getCurrentScope()) {
    onScopeDispose(clear);
  }

  return { pointerdown, pointermove, pointerup, pointercancel, contextmenu };
}

export type LongPressHandlers = ReturnType<typeof useLongPress>;

export interface UseLongPressListOptions<T> extends UseLongPressOptions {
  /** Stable identity for an item. Handlers are cached and disposed by this key. */
  key: (item: T) => string | number;
  /** Tapped (released before the long-press timer) — receives the live item. */
  onTap?: (item: T, event: PointerEvent) => void;
  /** Held past `delay` without moving — receives the live item. */
  onLongPress?: (item: T, event: PointerEvent) => void;
}

/**
 * Long-press handling for a *list* of items, where each row needs its own
 * gesture timer but the list itself changes over time (tab switches, fetches).
 *
 * Wraps {@link useLongPress} with a keyed cache so handlers are built once per
 * item and reused across renders, instead of re-created every frame by `v-on`.
 * A `watchEffect` keeps the cache in sync with the source: new items get a
 * binding, removed ones are dropped. Because the first run is synchronous (still
 * in setup scope), each binding's `onScopeDispose` registers against the
 * component scope correctly.
 *
 * Callbacks always resolve the *current* item by key at call time, so a stale
 * closure can never act on outdated data after the list updates.
 *
 * ```vue
 * const { getHandlers } = useLongPressList(() => props.outcomes ?? [], {
 *   key: (o) => o.outcomeCode,
 *   onTap: (o) => emit("outcome-click", o),
 *   onLongPress: (o) => emit("outcome-long-press", o),
 * })
 * // <button v-on="getHandlers(outcome)">
 * ```
 */
export function useLongPressList<T>(
  items: MaybeRefOrGetter<T[] | undefined>,
  options: UseLongPressListOptions<T>,
) {
  const { key, onTap, onLongPress, ...pressOptions } = options;
  const cache = new Map<string | number, LongPressHandlers>();

  // Resolve the live item by key at call time so callbacks never fire with a
  // stale snapshot captured when the handler was first built.
  function current(id: string | number): T | undefined {
    return toValue(items)?.find((item) => key(item) === id);
  }

  watchEffect(() => {
    const list = toValue(items) ?? [];
    const present = new Set(list.map(key));
    for (const id of cache.keys()) {
      if (!present.has(id)) cache.delete(id);
    }
    for (const item of list) {
      const id = key(item);
      if (cache.has(id)) continue;
      cache.set(
        id,
        useLongPress(
          {
            onTap: (event) => {
              const live = current(id);
              if (live) onTap?.(live, event);
            },
            onLongPress: (event) => {
              const live = current(id);
              if (live) onLongPress?.(live, event);
            },
          },
          pressOptions,
        ),
      );
    }
  });

  /** Pointer-event handlers for `item`, spread onto the element with `v-on`. */
  function getHandlers(item: T): LongPressHandlers {
    return cache.get(key(item))!;
  }

  return { getHandlers };
}
