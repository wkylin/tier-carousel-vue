<template>
  <div class="tier-dots" aria-hidden="true">
    <span v-for="(tier, index) in tiers" :key="tier.id" class="tier-dots__dot"
      :class="{ 'tier-dots__dot--active': index === activeIndex }"></span>
  </div>
</template>

<script setup lang="ts">
import type { LoyaltyTier } from "@/data/tiers";

defineProps<{
  tiers: LoyaltyTier[];
  activeIndex: number;
}>();
</script>

<style scoped>
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
</style>
