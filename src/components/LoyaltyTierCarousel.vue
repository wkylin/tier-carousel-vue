<template>
  <div ref="viewportRef" class="tier-carousel" role="tablist" aria-label="Loyalty tiers" :style="carouselViewportStyle"
    @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel">
    <div class="tier-carousel__viewport">
      <div class="tier-carousel__track" :style="carouselTrackStyle" @transitionend="onTrackTransitionEnd">
        <button v-for="item in visibleItems" :key="`tier-${item.slot}-${item.tierIndex}`" type="button"
          class="tier-item" :class="{ 'tier-item--active': item.isActiveTier }"
          :style="[carouselItemStyle, carouselItemMotionStyle(item.offset)]" role="tab"
          :aria-selected="item.isActiveTier" @click="onItemClick(item.tier.id)">
          <span class="tier-icon-shell">
            <img :src="item.tier.icon" :alt="item.tier.name" class="tier-icon"
              :class="{ 'tier-icon--locked': item.isVisuallyDemoted }" draggable="false" loading="eager"
              decoding="async" />
            <img v-if="item.isLocked" :src="lockIcon" alt="Locked tier" class="tier-status-badge" draggable="false"
              loading="eager" decoding="async" />
            <img v-else :src="shieldIcon" alt="Unlocked tier" class="tier-status-badge" draggable="false"
              loading="eager" decoding="async" />
          </span>
          <span class="tier-label" :style="tierLabelStyle(item)">
            {{ item.tier.name }}
          </span>
        </button>
      </div>
    </div>

    <div class="tier-dots" aria-hidden="true">
      <span v-for="(tier, index) in tiers" :key="tier.id" :class="{ 'tier-dots__dot--active': index === activeIndex }"
        class="tier-dots__dot"></span>
    </div>

    <div class="tier-carousel-skeleton" :class="{ 'tier-carousel-skeleton--active': isContentTransitioning }"
      aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from "vue";
import type { LoyaltyTier } from "@/data/tiers";
import lockIcon from "@/assets/tier/lock.png";
import shieldIcon from "@/assets/tier/shield.png";

const props = defineProps<{
  tiers: LoyaltyTier[];
  modelValue: string;
  currentTierLevel: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const dragStartX = ref(0);
const dragStartY = ref(0);
const dragOffsetPx = ref(0);
const isDragging = ref(false);
const hasHorizontalDrag = ref(false);
const suppressClick = ref(false);
const slotGapPx = 6;
const viewportRef = ref<HTMLElement | null>(null);
const viewportWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;
let transitionFallbackTimer: number | null = null;

const centerIndex = ref(0);
const animatedStep = ref(0);
const trackTransitionEnabled = ref(false);
const pendingCenterIndex = ref<number | null>(null);
const defaultVisibleOffsets = [-3, -2, -1, 0, 1, 2, 3] as const;
const forwardEdgeVisibleOffsets = [-3, -2, -1, 0, 1, 2, 3, 4] as const;
const backwardEdgeVisibleOffsets = [-4, -3, -2, -1, 0, 1, 2, 3] as const;
const visibleOffsets = ref<readonly number[]>(defaultVisibleOffsets);
const visibleTierIndices = ref<number[]>([]);

const activeIndex = computed(() => {
  const index = props.tiers.findIndex((tier) => tier.id === props.modelValue);
  return index >= 0 ? index : 0;
});
const isContentTransitioning = computed(
  () => pendingCenterIndex.value !== null || isDragging.value,
);

const tierThemeColors: Record<string, string> = {
  iron: "#64748b",
  copper: "#b87333",
  bronze: "#c26a2e",
  silver: "#94a3b8",
  gold: "#d4a017",
  platinum: "#42d3c8",
  diamond: "#38bdf8",
  titanium: "#8b5cf6",
};

function getTrackTransitionDurationMs(distance: number) {
  if (distance <= 1) {
    return 260;
  }

  return Math.min(520, 220 + distance * 90);
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

function normalizeIndex(index: number) {
  const total = props.tiers.length;
  if (!total) {
    return 0;
  }

  return ((index % total) + total) % total;
}

function resolveMove(
  fromIndex: number,
  toIndex: number,
): { direction: 1 | -1; distance: number } {
  const total = props.tiers.length;
  if (total <= 1) {
    return { direction: 1, distance: 0 };
  }

  const forwardDistance = (toIndex - fromIndex + total) % total;
  const backwardDistance = (fromIndex - toIndex + total) % total;

  return forwardDistance <= backwardDistance
    ? { direction: 1, distance: forwardDistance }
    : { direction: -1, distance: backwardDistance };
}

function emitRelativeStep(step: -1 | 1) {
  if (!props.tiers.length || pendingCenterIndex.value !== null) {
    return;
  }

  const nextIndex = normalizeIndex(activeIndex.value + step);

  emit("update:modelValue", props.tiers[nextIndex].id);
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

function onItemClick(tierId: string) {
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }

  if (pendingCenterIndex.value !== null) {
    return;
  }

  emit("update:modelValue", tierId);
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) {
    return;
  }

  if (pendingCenterIndex.value !== null) {
    return;
  }

  isDragging.value = true;
  hasHorizontalDrag.value = false;
  suppressClick.value = false;
  dragOffsetPx.value = 0;
  trackTransitionEnabled.value = false;
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
    Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8;

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
    Math.abs(deltaX) > 28 &&
    Math.abs(deltaX) > Math.abs(deltaY);

  if (horizontalSwipe) {
    suppressClick.value = true;
    emitRelativeStep(deltaX > 0 ? -1 : 1);
  } else {
    dragOffsetPx.value = 0;
  }

  isDragging.value = false;
  hasHorizontalDrag.value = false;
  if (
    event.currentTarget instanceof HTMLElement &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  ) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

function onPointerCancel(event: PointerEvent) {
  isDragging.value = false;
  hasHorizontalDrag.value = false;
  dragOffsetPx.value = 0;
  if (
    event.currentTarget instanceof HTMLElement &&
    event.currentTarget.hasPointerCapture(event.pointerId)
  ) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

function resolveDragOffset(deltaX: number) {
  return deltaX;
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

  finishAnimatedMove();
}

function finishAnimatedMove() {
  if (pendingCenterIndex.value === null) {
    return;
  }

  const nextCenterIndex = pendingCenterIndex.value;
  centerIndex.value = nextCenterIndex;
  pendingCenterIndex.value = null;

  clearTransitionFallbackTimer();
  trackTransitionEnabled.value = false;
  animatedStep.value = 0;
  dragOffsetPx.value = 0;
  visibleOffsets.value = defaultVisibleOffsets;
  syncVisibleTierIndices(nextCenterIndex);
}

function clearTransitionFallbackTimer() {
  if (transitionFallbackTimer === null) {
    return;
  }

  window.clearTimeout(transitionFallbackTimer);
  transitionFallbackTimer = null;
}

function startAnimatedMove(targetIndex: number) {
  if (!props.tiers.length || pendingCenterIndex.value !== null) {
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
  clearTransitionFallbackTimer();
  transitionFallbackTimer = window.setTimeout(
    finishAnimatedMove,
    getTrackTransitionDurationMs(move.distance) + 80,
  );
}

function resolveVisibleOffsets(direction: 1 | -1, distance: number) {
  if (distance >= 4) {
    return direction === 1
      ? forwardEdgeVisibleOffsets
      : backwardEdgeVisibleOffsets;
  }

  return defaultVisibleOffsets;
}

function syncVisibleTierIndices(center: number) {
  if (!props.tiers.length) {
    visibleTierIndices.value = [];
    return;
  }

  visibleTierIndices.value = visibleOffsets.value.map((offset) =>
    normalizeIndex(center + offset),
  );
}

watch(
  () => props.tiers,
  () => {
    clearTransitionFallbackTimer();
    pendingCenterIndex.value = null;
    animatedStep.value = 0;
    trackTransitionEnabled.value = false;
    dragOffsetPx.value = 0;
    visibleOffsets.value = defaultVisibleOffsets;
    centerIndex.value = activeIndex.value;
    syncVisibleTierIndices(centerIndex.value);
  },
  { immediate: true },
);

const visibleItems = computed(() => {
  if (
    !props.tiers.length ||
    visibleTierIndices.value.length !== visibleOffsets.value.length
  ) {
    return [] as Array<{
      tier: LoyaltyTier;
      slot: number;
      offset: number;
      isLocked: boolean;
      isUnlocked: boolean;
      isVisuallyDemoted: boolean;
      isActiveTier: boolean;
      tierIndex: number;
    }>;
  }

  return visibleOffsets.value.map((offset, slot) => {
    const index = visibleTierIndices.value[slot];
    const isUnlocked = index + 1 <= props.currentTierLevel;
    const isActiveTier = offset === 0;

    return {
      tier: props.tiers[index],
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

const backgroundTheme = computed(() => {
  const currentColor = getTierThemeColor(activeIndex.value);
  const targetIndex =
    dragProgress.value >= 0
      ? normalizeIndex(activeIndex.value + 1)
      : normalizeIndex(activeIndex.value - 1);
  const targetColor = getTierThemeColor(targetIndex);
  const progress = Math.min(1, Math.abs(dragProgress.value));
  const mixedColor = interpolateColor(currentColor, targetColor, progress);

  return {
    primary: mixedColor,
    soft: withAlpha(mixedColor, 0.16),
    faint: withAlpha(mixedColor, 0.06),
  };
});

const carouselViewportStyle = computed(() => ({
  "--tier-theme-color": backgroundTheme.value.primary,
  "--tier-theme-soft": backgroundTheme.value.soft,
  "--tier-theme-faint": backgroundTheme.value.faint,
}));

const carouselItemStyle = computed(() => {
  if (computedItemWidth.value <= 0) {
    return undefined;
  }

  return {
    width: `${computedItemWidth.value}px`,
  };
});

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

const carouselTrackStyle = computed(() => ({
  gap: `${slotGapPx}px`,
  width:
    computedTrackWidth.value > 0 ? `${computedTrackWidth.value}px` : undefined,
  transform: `translateX(${baseTrackOffset.value + animatedOffset.value + dragOffsetPx.value
    }px)`,
  transition: trackTransitionEnabled.value
    ? `transform ${trackTransitionDurationMs.value}ms cubic-bezier(0.22,0.61,0.36,1)`
    : "none",
}));

function getTierThemeColor(index: number) {
  const tier = props.tiers[index];
  return tierThemeColors[tier?.id ?? ""] ?? "#0ea5e9";
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
      : normalized;
  const parsed = Number.parseInt(value, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function interpolateColor(from: string, to: string, progress: number) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * progress);

  return `rgb(${mix(fromRgb.r, toRgb.r)}, ${mix(fromRgb.g, toRgb.g)}, ${mix(
    fromRgb.b,
    toRgb.b,
  )})`;
}

function withAlpha(color: string, alpha: number) {
  return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
}

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

.tier-item {
  position: relative;
  display: flex;
  min-width: 0;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
  border: 0;
  border-radius: 12px;
  color: inherit;
  background: transparent;
  contain: layout paint;
  cursor: pointer;
  transform-origin: bottom;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.tier-item:focus,
.tier-item:focus-visible,
.tier-item:active {
  outline: none;
  box-shadow: none;
  background: transparent;
}

.tier-icon-shell {
  position: relative;
  display: block;
  width: 64px;
  height: 64px;
  transform: translateZ(0);
}

.tier-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  backface-visibility: hidden;
  transform: translateZ(0);
  -webkit-user-drag: none;
  transition:
    filter 220ms ease,
    opacity 220ms ease;
}

.tier-icon--locked {
  filter: grayscale(1) saturate(0.72) brightness(0.8);
  opacity: 0.62;
}

.tier-status-badge {
  position: absolute;
  right: -0.35rem;
  top: 1.95rem;
  z-index: 1;
  width: 16px;
  height: 16px;
  object-fit: contain;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.tier-label {
  max-width: 100%;
  margin-top: 4px;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tier-item--active .tier-label {
  margin-top: 12px;
}

.tier-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
}

.tier-dots__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-text) 28%, transparent);
  transition:
    width 180ms ease,
    background 180ms ease;
}

.tier-dots__dot--active {
  width: 16px;
  background: var(--ui-text);
}

.tier-carousel-skeleton {
  display: grid;
  grid-template-columns: 1fr 0.72fr 0.48fr;
  gap: 6px;
  height: 4px;
  margin-top: 12px;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.tier-carousel-skeleton--active {
  opacity: 1;
  transform: translateY(0);
}

.tier-carousel-skeleton span {
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-text) 10%, transparent);
}

.tier-carousel-skeleton span::after {
  display: block;
  width: 45%;
  height: 100%;
  content: "";
  background: linear-gradient(90deg,
      transparent,
      color-mix(in srgb, var(--tier-theme-color) 55%, transparent),
      transparent);
  animation: tier-carousel-shimmer 720ms ease-in-out infinite;
}

@keyframes tier-carousel-shimmer {
  from {
    transform: translateX(-120%);
  }

  to {
    transform: translateX(260%);
  }
}
</style>
