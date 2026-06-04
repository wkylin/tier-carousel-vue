import { ref } from "vue";

export interface UseCarouselPointerDragOptions {
  /** Returns true when drag gestures should be ignored. */
  isLocked?: () => boolean;
  /** Called after a committed horizontal swipe. */
  onSwipeStep?: (step: -1 | 1) => void;
  /** Min horizontal movement to treat pointermove as horizontal drag. Default 8px. */
  horizontalDragThreshold?: number;
  /** Min swipe distance to commit a step on release. Default 28px. */
  swipeCommitThreshold?: number;
  /** Optional transform for deltaX to rendered drag offset. */
  resolveDragOffset?: (deltaX: number) => number;
}

export function useCarouselPointerDrag(
  options: UseCarouselPointerDragOptions = {},
) {
  const {
    isLocked,
    onSwipeStep,
    horizontalDragThreshold = 8,
    swipeCommitThreshold = 28,
    resolveDragOffset = (deltaX) => deltaX,
  } = options;

  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dragOffsetPx = ref(0);
  const isDragging = ref(false);
  const hasHorizontalDrag = ref(false);
  const suppressClick = ref(false);

  function releasePointerCapture(event: PointerEvent) {
    if (
      event.currentTarget instanceof HTMLElement &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    if (isLocked?.()) {
      return;
    }

    isDragging.value = true;
    hasHorizontalDrag.value = false;
    suppressClick.value = false;
    dragOffsetPx.value = 0;
    dragStartX.value = event.clientX;
    dragStartY.value = event.clientY;
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging.value) {
      return;
    }

    const deltaX = event.clientX - dragStartX.value;
    const deltaY = event.clientY - dragStartY.value;

    const isHorizontalDrag =
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > horizontalDragThreshold;

    if (isHorizontalDrag) {
      hasHorizontalDrag.value = true;
      event.preventDefault();
      if (
        event.currentTarget instanceof HTMLElement &&
        !event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    dragOffsetPx.value = hasHorizontalDrag.value ? resolveDragOffset(deltaX) : 0;
  }

  function onPointerUp(event: PointerEvent) {
    if (!isDragging.value) {
      return;
    }

    const deltaX = event.clientX - dragStartX.value;
    const deltaY = event.clientY - dragStartY.value;
    const horizontalSwipe =
      hasHorizontalDrag.value &&
      Math.abs(deltaX) > swipeCommitThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY);

    if (horizontalSwipe) {
      suppressClick.value = true;
      onSwipeStep?.(deltaX > 0 ? -1 : 1);
    } else {
      dragOffsetPx.value = 0;
    }

    isDragging.value = false;
    hasHorizontalDrag.value = false;
    releasePointerCapture(event);
  }

  function onPointerCancel(event: PointerEvent) {
    isDragging.value = false;
    hasHorizontalDrag.value = false;
    dragOffsetPx.value = 0;
    releasePointerCapture(event);
  }

  function consumeSuppressClick() {
    if (!suppressClick.value) {
      return false;
    }

    suppressClick.value = false;
    return true;
  }

  return {
    dragOffsetPx,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    consumeSuppressClick,
  };
}
