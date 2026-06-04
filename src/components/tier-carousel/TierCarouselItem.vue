<template>
  <button type="button" class="tier-item" :class="{ 'tier-item--active': isActiveTier }"
    :style="[itemStyle, motionStyle]" role="tab" :aria-selected="isActiveTier" @click="$emit('select', tier.id)">
    <span class="tier-icon-shell">
      <img :src="tier.icon" :alt="tier.name" class="tier-icon" :class="{ 'tier-icon--locked': isVisuallyDemoted }"
        draggable="false" loading="eager" decoding="async" />
      <img v-if="isLocked" :src="lockIcon" alt="Locked tier" class="tier-status-badge" draggable="false" loading="eager"
        decoding="async" />
      <img v-else :src="shieldIcon" alt="Unlocked tier" class="tier-status-badge" draggable="false" loading="eager"
        decoding="async" />
    </span>
    <span class="tier-label" :style="labelStyle">
      {{ tier.name }}
    </span>
  </button>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { LoyaltyTier } from "@/data/tiers";
import lockIcon from "@/assets/tier/lock.png";
import shieldIcon from "@/assets/tier/shield.png";

defineProps<{
  tier: LoyaltyTier;
  isActiveTier: boolean;
  isLocked: boolean;
  isVisuallyDemoted: boolean;
  itemStyle?: CSSProperties;
  motionStyle: CSSProperties;
  labelStyle: CSSProperties;
}>();

defineEmits<{
  select: [tierId: string];
}>();
</script>

<style scoped>
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
</style>
