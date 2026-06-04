<template>
  <div class="tier-drawer-content">
    <p>{{ tier.summary }}</p>

    <div class="tier-drawer-stats">
      <article>
        <span>Reward Points</span>
        <strong>{{ tier.reward.toLocaleString() }} pts</strong>
      </article>
      <article>
        <span>Monthly Progress</span>
        <strong>{{ tier.monthlyProgress }}</strong>
      </article>
      <article>
        <span>Lifetime Progress</span>
        <strong>{{ tier.lifetimeProgress }}</strong>
      </article>
      <article>
        <span>Next Update</span>
        <strong>{{ tier.nextUpdate }}</strong>
      </article>
    </div>

    <div class="tier-drawer-benefits">
      <h3>Included Benefits</h3>
      <ul>
        <li v-for="benefit in tier.benefits" :key="benefit.title">
          <span>{{ benefit.title }}</span>
          <strong>{{ benefit.value }}</strong>
          <small v-if="benefit.note">{{ benefit.note }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoyaltyTier } from "@/data/tiers";

defineProps<{
  tier: LoyaltyTier;
}>();
</script>

<style scoped>
.tier-drawer-content {
  padding: 16px 18px 22px;
}

.tier-drawer-content p {
  margin: 0;
  color: var(--ui-text-muted);
  line-height: 1.65;
}

.tier-drawer-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.tier-drawer-stats article,
.tier-drawer-benefits li {
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
}

.tier-drawer-stats article {
  padding: 13px;
}

.tier-drawer-stats span {
  color: var(--ui-text-soft);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.tier-drawer-stats strong {
  display: block;
  margin-top: 7px;
  overflow-wrap: anywhere;
  font-size: 1.05rem;
}

.tier-drawer-benefits {
  margin-top: 18px;
}

.tier-drawer-benefits h3 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.tier-drawer-benefits ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tier-drawer-benefits li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 12px;
  align-items: center;
  padding: 13px;
}

.tier-drawer-benefits span {
  color: var(--ui-text-muted);
}

.tier-drawer-benefits strong {
  text-align: right;
}

.tier-drawer-benefits small {
  grid-column: 1 / -1;
  color: var(--ui-text-soft);
}

@media (max-width: 640px) {
  .tier-drawer-content {
    padding-right: 14px;
    padding-left: 14px;
  }

  .tier-drawer-stats {
    grid-template-columns: 1fr;
  }

  .tier-drawer-benefits li {
    grid-template-columns: 1fr;
  }

  .tier-drawer-benefits strong {
    text-align: left;
  }
}
</style>
