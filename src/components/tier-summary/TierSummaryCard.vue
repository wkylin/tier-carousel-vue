<template>
  <section class="tier-card" aria-live="polite">
    <div class="tier-card__header">
      <div ref="tierSurpriseTriggerRef" class="tier-surprise-trigger"
        :class="{ 'tier-surprise-trigger--shake': isTierSurpriseShaking }" :style="tierSurpriseTriggerStyle"
        aria-label="Long press tier badge for a surprise" v-on="tierHeaderLongPressHandlers">
        <img :src="tier.icon" :alt="tier.name" />
        <div class="tier-surprise-layer" aria-hidden="true">
          <div v-for="burst in tierSurpriseBursts" :key="burst.id" class="tier-surprise-burst"
            :style="tierSurpriseBurstStyle(burst)">
            <span class="tier-surprise-core"></span>
            <span class="tier-surprise-wave"></span>
            <i v-for="petal in burst.petals" :key="petal.id" class="tier-surprise-petal"
              :class="`tier-surprise-petal--${petal.kind}`" :style="tierSurprisePetalStyle(petal)"></i>
          </div>
        </div>
      </div>

      <div class="tier-card__header-copy">
        <span>Selected Tier</span>
        <h2>{{ tier.name }}</h2>
        <p class="tier-surprise-hint">{{ surpriseHintText }}</p>
        <p v-if="!supportsVibration" class="tier-surprise-capability-hint">
          当前设备不支持震动反馈，将仅展示视觉惊喜效果
        </p>
      </div>
    </div>

    <p>{{ tier.summary }}</p>

    <div class="tier-metrics">
      <article class="tier-metric">
        <span>Reward Points</span>
        <strong>{{ tier.reward.toLocaleString() }} pts</strong>
      </article>
      <article class="tier-metric">
        <span>Monthly Progress</span>
        <strong>{{ tier.monthlyProgress }}</strong>
      </article>
      <article class="tier-metric">
        <span>Lifetime Progress</span>
        <strong>{{ tier.lifetimeProgress }}</strong>
      </article>

      <article v-for="benefit in tier.benefits" :key="benefit.title" class="tier-metric">
        <span>{{ benefit.title }}</span>
        <strong>{{ benefit.value }}</strong>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef } from "vue";
import type { LoyaltyTier } from "@/data/tiers";
import { useTierSurprise } from "@/features/tier-surprise/useTierSurprise";

const props = defineProps<{
  tier: LoyaltyTier;
}>();

const tierRef = toRef(props, "tier");
const tierSurpriseTriggerRef = ref<HTMLElement | null>(null);

const {
  supportsVibration,
  tierSurpriseBursts,
  isTierSurpriseShaking,
  surpriseHintText,
  tierSurpriseTriggerStyle,
  tierSurpriseBurstStyle,
  tierSurprisePetalStyle,
  tierHeaderLongPressHandlers,
} = useTierSurprise(tierRef, tierSurpriseTriggerRef);
</script>

<style scoped>
.tier-card {
  margin: 24px auto 0;
  padding: 20px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: rgba(15, 19, 26, 0.78);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
}

.tier-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tier-card__header-copy {
  min-width: 0;
}

.tier-card__header img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.tier-surprise-trigger {
  position: relative;
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  background: radial-gradient(circle at 50% 42%, var(--tier-surprise-glow), transparent 72%);
}

.tier-surprise-trigger::before {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--tier-surprise-accent) 44%, transparent);
  border-radius: inherit;
  content: "";
}

.tier-surprise-trigger--shake {
  animation: tier-surprise-trigger-shake 430ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.tier-surprise-trigger img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.tier-surprise-layer {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.tier-surprise-burst {
  position: absolute;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
}

.tier-surprise-core {
  position: absolute;
  left: -6px;
  top: -6px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: radial-gradient(circle, #ffffff 0%, var(--tier-surprise-accent) 62%, transparent 78%);
  box-shadow: 0 0 18px var(--tier-surprise-glow);
  animation: tier-surprise-core-pop 540ms ease-out forwards;
}

.tier-surprise-wave {
  position: absolute;
  left: -3px;
  top: -3px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--tier-surprise-accent) 72%, #ffffff);
  opacity: 0.92;
  animation: tier-surprise-wave-expand 760ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
}

.tier-surprise-petal {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  background: var(--tier-petal-color);
  animation: tier-surprise-petal-burst 980ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--tier-petal-delay);
}

.tier-surprise-petal--dot {
  width: var(--tier-petal-size);
  height: var(--tier-petal-size);
  border-radius: 999px;
}

.tier-surprise-petal--diamond {
  width: calc(var(--tier-petal-size) * 1.18);
  height: calc(var(--tier-petal-size) * 1.18);
  border-radius: 2px;
}

.tier-surprise-petal--bar {
  width: calc(var(--tier-petal-size) * 0.66);
  height: calc(var(--tier-petal-size) * 2.2);
  border-radius: 999px;
}

.tier-surprise-hint {
  margin: 6px 0 0;
  color: color-mix(in srgb, var(--ui-accent) 74%, var(--ui-text-soft));
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.35;
}

.tier-surprise-capability-hint {
  margin: 5px 0 0;
  color: color-mix(in srgb, #f59e0b 72%, var(--ui-text-soft));
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.35;
}

.tier-card__header span,
.tier-metric span {
  color: var(--ui-text-soft);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tier-card__header h2 {
  margin: 2px 0 0;
  font-size: 1.65rem;
}

.tier-card p {
  margin: 16px 0;
  color: var(--ui-text-muted);
  line-height: 1.7;
}

.tier-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 0;
}

.tier-metric {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}

.tier-metric strong {
  display: block;
  margin-top: 6px;
  font-size: 1.1rem;
  font-weight: 800;
}

.tier-metrics .tier-metric:last-child {
  grid-column: 1 / -1;
}

@media (max-width: 640px) {
  .tier-metrics {
    grid-template-columns: 1fr;
  }

  .tier-surprise-hint {
    font-size: 0.74rem;
  }

  .tier-surprise-capability-hint {
    font-size: 0.69rem;
  }
}

@keyframes tier-surprise-core-pop {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }

  25% {
    transform: scale(1.24);
    opacity: 1;
  }

  100% {
    transform: scale(0.84);
    opacity: 0;
  }
}

@keyframes tier-surprise-wave-expand {
  0% {
    transform: scale(0.4);
    opacity: 0.95;
  }

  100% {
    transform: scale(11);
    opacity: 0;
  }
}

@keyframes tier-surprise-petal-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--tier-petal-angle)) translateX(0) rotate(0deg) scale(0.34);
  }

  16% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: rotate(var(--tier-petal-angle)) translateX(var(--tier-petal-distance)) rotate(var(--tier-petal-spin)) scale(0.92);
  }
}

@keyframes tier-surprise-trigger-shake {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  18% {
    transform: translate3d(-1.4px, 0.6px, 0) scale(1.02);
  }

  36% {
    transform: translate3d(1.9px, -0.4px, 0) scale(1.02);
  }

  54% {
    transform: translate3d(-1.1px, 0.45px, 0) scale(1.01);
  }

  72% {
    transform: translate3d(0.8px, -0.35px, 0) scale(1.005);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}
</style>
