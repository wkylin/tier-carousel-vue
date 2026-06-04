<template>
  <div class="tier-drawer-header">
    <div class="tier-drawer-handle" aria-hidden="true"></div>
    <div class="tier-drawer-title">
      <img :src="tier.icon" :alt="tier.name" />
      <div>
        <span>Tier {{ tier.code }}</span>
        <h2>{{ tier.name }} Benefits</h2>
      </div>
    </div>
    <button type="button" class="tier-drawer-close" aria-label="Close tier details" title="Close"
      @click="$emit('close')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LoyaltyTier } from "@/data/tiers";

defineProps<{
  tier: LoyaltyTier;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.tier-drawer-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 28px 18px 12px;
  border-bottom: 1px solid var(--ui-border);
}

.tier-drawer-handle {
  position: absolute;
  top: 12px;
  left: 50%;
  width: 112px;
  height: 8px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.72);
  transform: translateX(-50%);
}

.tier-drawer-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.tier-drawer-title img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.tier-drawer-title span {
  color: var(--ui-text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.tier-drawer-title h2 {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  font-size: 1.25rem;
  line-height: 1.15;
}

.tier-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  color: var(--ui-text);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.tier-drawer-close:hover {
  border-color: color-mix(in srgb, var(--ui-accent) 58%, var(--ui-border));
  background: rgba(34, 211, 238, 0.14);
  transform: translateY(-1px);
}

.tier-drawer-close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-focus-ring) 35%, transparent);
}

.tier-drawer-close svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

@media (max-width: 640px) {
  .tier-drawer-header {
    padding-right: 14px;
    padding-left: 14px;
  }
}
</style>
