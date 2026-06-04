<template>
  <div class="tier-carousel-skeleton" :class="{ 'tier-carousel-skeleton--active': active }" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean;
}>();
</script>

<style scoped>
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
