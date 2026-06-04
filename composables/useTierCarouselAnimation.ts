import { computed, ref, type Ref } from "vue";

interface UseTierCarouselAnimationOptions<T> {
  tiers: Ref<T[]>;
  activeIndex: Ref<number>;
  currentTierLevel: Ref<number>;
  viewportWidth: Ref<number>;
  dragOffsetPx: Ref<number>;
  slotGapPx?: number;
}

interface VisibleItem<T> {
  tier: T;
  slot: number;
  offset: number;
  isLocked: boolean;
  isUnlocked: boolean;
  isVisuallyDemoted: boolean;
  isActiveTier: boolean;
  tierIndex: number;
}

const DEFAULT_VISIBLE_OFFSETS = [-3, -2, -1, 0, 1, 2, 3] as const;
const FORWARD_EDGE_VISIBLE_OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4] as const;
const BACKWARD_EDGE_VISIBLE_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3] as const;

export function useTierCarouselAnimation<T>(
  options: UseTierCarouselAnimationOptions<T>,
) {
  const {
    tiers,
    activeIndex,
    currentTierLevel,
    viewportWidth,
    dragOffsetPx,
    slotGapPx = 6,
  } = options;

  const centerIndex = ref(0);
  const animatedStep = ref(0);
  const trackTransitionEnabled = ref(false);
  const pendingCenterIndex = ref<number | null>(null);
  const visibleOffsets = ref<readonly number[]>(DEFAULT_VISIBLE_OFFSETS);
  const visibleTierIndices = ref<number[]>([]);

  function normalizeIndex(index: number) {
    const total = tiers.value.length;
    if (!total) {
      return 0;
    }

    return ((index % total) + total) % total;
  }

  function resolveMove(
    fromIndex: number,
    toIndex: number,
  ): { direction: 1 | -1; distance: number } {
    const total = tiers.value.length;
    if (total <= 1) {
      return { direction: 1, distance: 0 };
    }

    const forwardDistance = (toIndex - fromIndex + total) % total;
    const backwardDistance = (fromIndex - toIndex + total) % total;

    return forwardDistance <= backwardDistance
      ? { direction: 1, distance: forwardDistance }
      : { direction: -1, distance: backwardDistance };
  }

  function getTrackTransitionDurationMs(distance: number) {
    if (distance <= 1) {
      return 260;
    }

    return Math.min(520, 220 + distance * 90);
  }

  function resolveVisibleOffsets(direction: 1 | -1, distance: number) {
    if (distance >= 4) {
      return direction === 1
        ? FORWARD_EDGE_VISIBLE_OFFSETS
        : BACKWARD_EDGE_VISIBLE_OFFSETS;
    }

    return DEFAULT_VISIBLE_OFFSETS;
  }

  function syncVisibleTierIndices(center: number) {
    if (!tiers.value.length) {
      visibleTierIndices.value = [];
      return;
    }

    visibleTierIndices.value = visibleOffsets.value.map((offset) =>
      normalizeIndex(center + offset),
    );
  }

  function finishAnimatedMove() {
    if (pendingCenterIndex.value === null) {
      return;
    }

    const nextCenterIndex = pendingCenterIndex.value;
    centerIndex.value = nextCenterIndex;
    pendingCenterIndex.value = null;

    trackTransitionEnabled.value = false;
    animatedStep.value = 0;
    dragOffsetPx.value = 0;
    visibleOffsets.value = DEFAULT_VISIBLE_OFFSETS;
    syncVisibleTierIndices(nextCenterIndex);
  }

  function startAnimatedMove(targetIndex: number) {
    if (!tiers.value.length || pendingCenterIndex.value !== null) {
      return;
    }

    if (centerIndex.value === targetIndex) {
      return;
    }

    const move = resolveMove(centerIndex.value, targetIndex);
    if (move.distance <= 0) {
      return;
    }

    visibleOffsets.value = resolveVisibleOffsets(move.direction, move.distance);
    syncVisibleTierIndices(centerIndex.value);
    pendingCenterIndex.value = targetIndex;
    trackTransitionEnabled.value = true;
    animatedStep.value = move.direction * move.distance;
  }

  function resetAnimationState() {
    pendingCenterIndex.value = null;
    animatedStep.value = 0;
    trackTransitionEnabled.value = false;
    dragOffsetPx.value = 0;
    visibleOffsets.value = DEFAULT_VISIBLE_OFFSETS;
    centerIndex.value = activeIndex.value;
    syncVisibleTierIndices(centerIndex.value);
  }

  const isContentTransitioning = computed(
    () => pendingCenterIndex.value !== null,
  );

  const computedItemWidth = computed(() => {
    if (viewportWidth.value <= 0) {
      return 0;
    }

    return (viewportWidth.value - slotGapPx * 4) / 4;
  });

  const stepDistance = computed(() => {
    if (computedItemWidth.value <= 0) {
      return 0;
    }

    return computedItemWidth.value + slotGapPx;
  });

  const computedTrackWidth = computed(() => {
    if (computedItemWidth.value <= 0) {
      return 0;
    }

    return (
      computedItemWidth.value * visibleOffsets.value.length +
      slotGapPx * (visibleOffsets.value.length - 1)
    );
  });

  const baseTrackOffset = computed(() => {
    if (computedItemWidth.value <= 0 || viewportWidth.value <= 0) {
      return 0;
    }

    const centerSlot = visibleOffsets.value.indexOf(0);
    return (
      viewportWidth.value / 2 -
      (centerSlot * stepDistance.value + computedItemWidth.value / 2)
    );
  });

  const animatedOffset = computed(() => {
    if (animatedStep.value === 0) {
      return 0;
    }

    return -animatedStep.value * stepDistance.value;
  });

  const trackTransitionDurationMs = computed(() => {
    const distance = Math.abs(animatedStep.value);
    return getTrackTransitionDurationMs(distance);
  });

  const dragProgress = computed(() => {
    if (stepDistance.value <= 0) {
      return 0;
    }

    return Math.max(-1, Math.min(1, -dragOffsetPx.value / stepDistance.value));
  });

  const visibleItems = computed<VisibleItem<T>[]>(() => {
    if (
      !tiers.value.length ||
      visibleTierIndices.value.length !== visibleOffsets.value.length
    ) {
      return [];
    }

    return visibleOffsets.value.map((offset, slot) => {
      const index = visibleTierIndices.value[slot];
      const isUnlocked = index + 1 <= currentTierLevel.value;
      const isActiveTier = offset === 0;

      return {
        tier: tiers.value[index],
        slot,
        offset,
        isLocked: !isUnlocked,
        isUnlocked,
        isVisuallyDemoted: !isUnlocked && !isActiveTier,
        isActiveTier,
        tierIndex: index,
      };
    });
  });

  const carouselTrackStyle = computed(() => ({
    gap: `${slotGapPx}px`,
    width:
      computedTrackWidth.value > 0
        ? `${computedTrackWidth.value}px`
        : undefined,
    transform: `translateX(${baseTrackOffset.value + animatedOffset.value + dragOffsetPx.value}px)`,
    transition: trackTransitionEnabled.value
      ? `transform ${trackTransitionDurationMs.value}ms cubic-bezier(0.22,0.61,0.36,1)`
      : "none",
  }));

  const carouselItemStyle = computed(() => {
    if (computedItemWidth.value <= 0) {
      return undefined;
    }

    return {
      width: `${computedItemWidth.value}px`,
    };
  });

  return {
    centerIndex,
    animatedStep,
    trackTransitionEnabled,
    pendingCenterIndex,
    visibleItems,
    isContentTransitioning,
    trackTransitionDurationMs,
    dragProgress,
    carouselTrackStyle,
    carouselItemStyle,
    normalizeIndex,
    startAnimatedMove,
    finishAnimatedMove,
    resetAnimationState,
    syncVisibleTierIndices,
  };
}
