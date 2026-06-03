<template>
  <main class="app-shell">
    <section class="demo-panel" aria-labelledby="page-title">
      <div class="page-heading">
        <p class="eyebrow">Vue 3 interaction demo</p>
        <div class="page-title-row">
          <h1 id="page-title">Tier Carousel</h1>
          <button
            type="button"
            class="tier-info-button"
            aria-label="Open tier details"
            title="Tier details"
            @click="isTierDrawerOpen = true"
          >
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

      <section class="tier-card" aria-live="polite">
        <div class="tier-card__header">
          <img :src="activeTier.icon" :alt="activeTier.name" />
          <div>
            <span>Selected Tier</span>
            <h2>{{ activeTier.name }}</h2>
          </div>
        </div>

        <p>{{ activeTier.summary }}</p>

        <div class="tier-metrics">
          <article class="tier-metric">
            <span>Reward Points</span>
            <strong>{{ activeTier.reward.toLocaleString() }} pts</strong>
          </article>
          <article class="tier-metric">
            <span>Monthly Progress</span>
            <strong>{{ activeTier.monthlyProgress }}</strong>
          </article>
          <article class="tier-metric">
            <span>Lifetime Progress</span>
            <strong>{{ activeTier.lifetimeProgress }}</strong>
          </article>

          <article v-for="benefit in activeTier.benefits" :key="benefit.title" class="tier-metric">
            <span>{{ benefit.title }}</span>
            <strong>{{ benefit.value }}</strong>
          </article>
        </div>
      </section>
    </section>

    <AppDrawer
      v-model="isTierDrawerOpen"
      side="bottom"
      panel-id="tier-details-drawer"
      aria-label="Selected tier details"
      panel-class="tier-details-drawer"
    >
      <template #header="{ close }">
        <div class="tier-drawer-header">
          <div class="tier-drawer-handle" aria-hidden="true"></div>
          <div class="tier-drawer-title">
            <img :src="activeTier.icon" :alt="activeTier.name" />
            <div>
              <span>Tier {{ activeTier.code }}</span>
              <h2>{{ activeTier.name }} Benefits</h2>
            </div>
          </div>
          <button
            type="button"
            class="tier-drawer-close"
            aria-label="Close tier details"
            title="Close"
            @click="close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </template>

      <div class="tier-drawer-content">
        <p>{{ activeTier.summary }}</p>

        <div class="tier-drawer-stats">
          <article>
            <span>Reward Points</span>
            <strong>{{ activeTier.reward.toLocaleString() }} pts</strong>
          </article>
          <article>
            <span>Monthly Progress</span>
            <strong>{{ activeTier.monthlyProgress }}</strong>
          </article>
          <article>
            <span>Lifetime Progress</span>
            <strong>{{ activeTier.lifetimeProgress }}</strong>
          </article>
          <article>
            <span>Next Update</span>
            <strong>{{ activeTier.nextUpdate }}</strong>
          </article>
        </div>

        <div class="tier-drawer-benefits">
          <h3>Included Benefits</h3>
          <ul>
            <li v-for="benefit in activeTier.benefits" :key="benefit.title">
              <span>{{ benefit.title }}</span>
              <strong>{{ benefit.value }}</strong>
              <small v-if="benefit.note">{{ benefit.note }}</small>
            </li>
          </ul>
        </div>
      </div>
    </AppDrawer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppDrawer from "@/components/AppDrawer.vue";
import LoyaltyTierCarousel from "@/components/LoyaltyTierCarousel.vue";
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
