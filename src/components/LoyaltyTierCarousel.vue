<template>
  <div ref="viewportRef" class="tier-carousel" role="tablist" aria-label="Loyalty tiers" :style="carouselViewportStyle"
    @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel">
    <div class="tier-carousel__viewport">
      <div class="tier-carousel__track" :style="carouselTrackStyle" @transitionend="onTrackTransitionEnd">
        <TierCarouselItem v-for="item in visibleItems" :key="`tier-${item.slot}-${item.tierIndex}`" :tier="item.tier"
          :is-active-tier="item.isActiveTier" :is-locked="item.isLocked" :is-visually-demoted="item.isVisuallyDemoted"
          :item-style="carouselItemStyle" :motion-style="carouselItemMotionStyle(item.offset)"
          :label-style="tierLabelStyle(item)" @select="onItemClick" />
      </div>
    </div>

    <TierCarouselDots :tiers="tiers" :active-index="activeIndex" />
    <TierCarouselSkeleton :active="isContentTransitioning" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
  type CSSProperties,
} from "vue";
import type { LoyaltyTier } from "@/data/tiers";
import { useCarouselPointerDrag } from "../../composables/useCarouselPointerDrag";
import { useTierCarouselAnimation } from "../../composables/useTierCarouselAnimation";
import { useTierCarouselTheme } from "../../composables/useTierCarouselTheme";
import TierCarouselItem from "./tier-carousel/TierCarouselItem.vue";
import TierCarouselDots from "./tier-carousel/TierCarouselDots.vue";
import TierCarouselSkeleton from "./tier-carousel/TierCarouselSkeleton.vue";

const SLOT_GAP_PX = 6;

const props = defineProps<{
  tiers: LoyaltyTier[];
  modelValue: string;
  currentTierLevel: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const viewportRef = ref<HTMLElement | null>(null);
const viewportWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
let transitionFallbackTimer: number | null = null;

const activeIndex = computed(() => {
  const index = props.tiers.findIndex((tier) => tier.id === props.modelValue);
  return index >= 0 ? index : 0;
});

const tiersRef = computed(() => props.tiers);
const currentTierLevel = computed(() => props.currentTierLevel);

let pendingCenterIndexRef: Ref<number | null> | null = null;

const {
  dragOffsetPx,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  consumeSuppressClick,
} = useCarouselPointerDrag({
  isLocked: () => pendingCenterIndexRef?.value !== null,
  onSwipeStep: (step) => {
    if (trackTransitionEnabled.value) {
      trackTransitionEnabled.value = false;
    }
    emitRelativeStep(step);
  },
});

const {
  centerIndex,
  animatedStep,
  trackTransitionEnabled,
  pendingCenterIndex,
  visibleItems,
  isContentTransitioning: isContentTransitioningBase,
  trackTransitionDurationMs,
  dragProgress,
  carouselTrackStyle,
  carouselItemStyle,
  normalizeIndex,
  startAnimatedMove: startAnimatedMoveCore,
  finishAnimatedMove: finishAnimatedMoveCore,
  resetAnimationState,
  syncVisibleTierIndices,
} = useTierCarouselAnimation<LoyaltyTier>({
  tiers: tiersRef,
  activeIndex,
  currentTierLevel,
  viewportWidth,
  dragOffsetPx,
  slotGapPx: SLOT_GAP_PX,
});

pendingCenterIndexRef = pendingCenterIndex;

const isContentTransitioning = computed(
  () => isContentTransitioningBase.value || isDragging.value,
);

const { carouselViewportStyle } = useTierCarouselTheme({
  activeIndex,
  dragProgress,
  normalizeIndex,
  getTierByIndex: (index) => props.tiers[index],
});

function onItemClick(tierId: string) {
  if (consumeSuppressClick()) {
    return;
  }

  if (pendingCenterIndex.value !== null) {
    return;
  }

  emit("update:modelValue", tierId);
}

function onTrackTransitionEnd(event: TransitionEvent) {
  if (
    event.target !== event.currentTarget ||
    event.propertyName !== "transform"
  ) {
    return;
  }

  if (pendingCenterIndex.value === null) {
    return;
  }

  clearTransitionFallbackTimer();
  finishAnimatedMoveCore();
}

function onGlobalKeyDown(event: KeyboardEvent) {
  if (shouldIgnoreGlobalArrowKey(event)) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    emitRelativeStep(-1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    emitRelativeStep(1);
  }
}

function emitRelativeStep(step: -1 | 1) {
  if (!props.tiers.length || pendingCenterIndex.value !== null) {
    return;
  }

  const nextIndex = normalizeIndex(activeIndex.value + step);
  emit("update:modelValue", props.tiers[nextIndex].id);
}

function startAnimatedMove(targetIndex: number) {
  const previousPending = pendingCenterIndex.value;
  startAnimatedMoveCore(targetIndex);
  if (pendingCenterIndex.value === null || pendingCenterIndex.value === previousPending) {
    return;
  }

  clearTransitionFallbackTimer();
  transitionFallbackTimer = window.setTimeout(
    finishAnimatedMoveCore,
    trackTransitionDurationMs.value + 80,
  );
}

function clearTransitionFallbackTimer() {
  if (transitionFallbackTimer === null) {
    return;
  }

  window.clearTimeout(transitionFallbackTimer);
  transitionFallbackTimer = null;
}

function motionProfile(offset: number) {
  const distance = Math.abs(offset);
  if (distance === 0) {
    return { scale: 1.12, opacity: 1 };
  }
  if (distance === 1) {
    return { scale: 0.9, opacity: 0.9 };
  }
  if (distance === 2) {
    return { scale: 0.76, opacity: 0.75 };
  }
  return { scale: 0.7, opacity: 0.55 };
}

function carouselItemMotionStyle(offset: number): CSSProperties {
  const visualOffset =
    trackTransitionEnabled.value && animatedStep.value !== 0
      ? offset - animatedStep.value
      : offset;
  const profile = motionProfile(visualOffset);
  const activeTierTranslateY = visualOffset === 0 ? "0.5rem" : "0";

  return {
    transform: `translateY(${activeTierTranslateY}) scale(${profile.scale})`,
    opacity: profile.opacity,
    willChange: trackTransitionEnabled.value ? "transform, opacity" : "auto",
    backfaceVisibility: "hidden",
    transformStyle: "preserve-3d",
    transition: trackTransitionEnabled.value
      ? `transform ${trackTransitionDurationMs.value}ms cubic-bezier(0.22,0.61,0.36,1), opacity ${trackTransitionDurationMs.value}ms cubic-bezier(0.22,0.61,0.36,1)`
      : "none",
  };
}

function tierLabelStyle(item: {
  isVisuallyDemoted: boolean;
  isActiveTier: boolean;
}) {
  if (item.isVisuallyDemoted) {
    return { color: "var(--ui-text-soft)" };
  }

  return {
    color: item.isActiveTier
      ? "var(--ui-text)"
      : "color-mix(in srgb, var(--ui-text) 72%, transparent)",
  };
}

function shouldIgnoreGlobalArrowKey(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  if (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  ) {
    return true;
  }

  return false;
}

watch(
  activeIndex,
  (index) => {
    if (!props.tiers.length) {
      return;
    }

    if (centerIndex.value === index && pendingCenterIndex.value === null) {
      return;
    }

    startAnimatedMove(index);
  },
  { immediate: true },
);

watch(
  () => props.tiers,
  () => {
    clearTransitionFallbackTimer();
    resetAnimationState();
  },
  { immediate: true },
);

watch(
  () => props.tiers.map((tier) => tier.icon),
  (icons) => {
    icons.forEach((icon) => {
      const preloaded = new Image();
      preloaded.src = icon;
      if (typeof preloaded.decode === "function") {
        void preloaded.decode().catch(() => undefined);
      }
    });
  },
  { immediate: true },
);

onMounted(() => {
  if (!viewportRef.value) {
    return;
  }

  const updateWidth = () => {
    viewportWidth.value = viewportRef.value?.clientWidth ?? 0;
  };

  updateWidth();
  centerIndex.value = activeIndex.value;
  syncVisibleTierIndices(centerIndex.value);
  resizeObserver = new ResizeObserver(updateWidth);
  resizeObserver.observe(viewportRef.value);
  window.addEventListener("keydown", onGlobalKeyDown);
});

onBeforeUnmount(() => {
  clearTransitionFallbackTimer();
  window.removeEventListener("keydown", onGlobalKeyDown);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
.tier-carousel {
  position: relative;
  padding: 12px 4px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 50% 0%, var(--tier-theme-soft), transparent 58%),
    linear-gradient(110deg,
      var(--tier-theme-faint),
      transparent 46%,
      var(--tier-theme-faint));
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  transition: background 160ms linear;
  overflow: clip;
}

.tier-carousel:active {
  cursor: grabbing;
}

.tier-carousel__viewport {
  overflow: hidden;
}

.tier-carousel__track {
  display: flex;
  align-items: end;
  will-change: transform;
}
</style>
