<template>
  <main class="app-shell">
    <section class="demo-panel" aria-labelledby="page-title">
      <div class="page-heading">
        <p class="eyebrow">Vue 3 interaction demo</p>
        <div class="page-title-row">
          <h1 id="page-title">Tier Carousel</h1>
          <button type="button" class="tier-info-button" aria-label="Open tier details" title="Tier details"
            @click="isTierDrawerOpen = true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v7" />
              <path d="M12 7h.01" />
            </svg>
          </button>
        </div>
        <p>
          Click a tier to select it, drag horizontally with mouse or touch to
          move between tiers, and use global Left/Right arrow keys to switch.
        </p>
      </div>

      <LoyaltyTierCarousel v-model="activeTierId" :tiers="loyaltyTiers" :current-tier-level="currentTierLevel" />

      <TierSummaryCard :tier="activeTier" />
    </section>

    <AppDrawer v-model="isTierDrawerOpen" side="bottom" panel-id="tier-details-drawer"
      aria-label="Selected tier details" panel-class="tier-details-drawer">
      <template #header="{ close }">
        <TierDrawerHeader :tier="activeTier" @close="close" />
      </template>

      <TierDrawerContent :tier="activeTier" />
    </AppDrawer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppDrawer from "@/components/AppDrawer.vue";
import LoyaltyTierCarousel from "@/components/LoyaltyTierCarousel.vue";
import TierDrawerHeader from "@/components/tier-details/TierDrawerHeader.vue";
import TierDrawerContent from "@/components/tier-details/TierDrawerContent.vue";
import TierSummaryCard from "@/components/tier-summary/TierSummaryCard.vue";
import {
  CURRENT_TIER_ID,
  loyaltyTiers,
} from "@/data/tiers";

const activeTierId = ref(CURRENT_TIER_ID);
const isTierDrawerOpen = ref(false);
const currentTierLevel = 3;

const activeTier = computed(
  () =>
    loyaltyTiers.find((tier) => tier.id === activeTierId.value) ??
    loyaltyTiers[0],
);
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding: 32px 16px;
  background:
    radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.18), transparent 38%),
    linear-gradient(135deg, #111827 0%, #101318 48%, #171923 100%);
}

.demo-panel {
  width: min(100%, 860px);
  margin: 0 auto;
}

.page-heading {
  max-width: 680px;
  margin: 0 auto 24px;
  text-align: center;
}

.page-title-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 100%;
}

.page-heading h1 {
  margin: 6px 0 10px;
  font-size: clamp(2rem, 6vw, 4.5rem);
  line-height: 0.95;
  letter-spacing: 0;
}

.page-heading p {
  margin: 0;
  color: var(--ui-text-muted);
  line-height: 1.65;
}

.eyebrow {
  color: var(--ui-accent) !important;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tier-info-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  margin-top: 2px;
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

.tier-info-button:hover {
  border-color: color-mix(in srgb, var(--ui-accent) 58%, var(--ui-border));
  background: rgba(34, 211, 238, 0.14);
  transform: translateY(-1px);
}

.tier-info-button:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-focus-ring) 35%, transparent);
}

.tier-info-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

:deep(.tier-details-drawer) {
  width: min(100%, 860px);
  margin: 0 auto;
  background:
    radial-gradient(circle at 18% 0%, rgba(34, 211, 238, 0.18), transparent 42%),
    linear-gradient(180deg, #151922 0%, #0f131a 100%);
}

@media (max-width: 640px) {
  .app-shell {
    padding: 24px 10px;
  }

  .page-title-row {
    display: flex;
  }

  .page-heading h1 {
    min-width: 0;
    font-size: clamp(2rem, 14vw, 3.7rem);
  }

  .tier-info-button {
    width: 34px;
    height: 34px;
  }
}
</style>
