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

      <section class="tier-card" aria-live="polite">
        <div class="tier-card__header">
          <div ref="tierSurpriseTriggerRef" class="tier-surprise-trigger"
            :class="{ 'tier-surprise-trigger--shake': isTierSurpriseShaking }" :style="tierSurpriseTriggerStyle"
            aria-label="Long press tier badge for a surprise" v-on="tierHeaderLongPressHandlers">
            <img :src="activeTier.icon" :alt="activeTier.name" />
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
            <h2>{{ activeTier.name }}</h2>
            <p class="tier-surprise-hint">{{ surpriseHintText }}</p>
            <p v-if="!supportsVibration" class="tier-surprise-capability-hint">
              当前设备不支持震动反馈，将仅展示视觉惊喜效果
            </p>
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

    <AppDrawer v-model="isTierDrawerOpen" side="bottom" panel-id="tier-details-drawer"
      aria-label="Selected tier details" panel-class="tier-details-drawer">
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
          <button type="button" class="tier-drawer-close" aria-label="Close tier details" title="Close" @click="close">
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
import { computed, onBeforeUnmount, ref, type CSSProperties } from "vue";
import AppDrawer from "@/components/AppDrawer.vue";
import LoyaltyTierCarousel from "@/components/LoyaltyTierCarousel.vue";
import {
  CURRENT_TIER_ID,
  type LoyaltyTier,
  loyaltyTiers,
} from "@/data/tiers";
import { useLongPress } from "../composables/useLongPress";

const activeTierId = ref(CURRENT_TIER_ID);
const isTierDrawerOpen = ref(false);
const currentTierLevel = 3;
const supportsVibration =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
const tierSurpriseTriggerRef = ref<HTMLElement | null>(null);
const tierSurpriseBursts = ref<TierSurpriseBurst[]>([]);
const isTierSurpriseShaking = ref(false);
let tierSurpriseSeed = 0;
const tierSurpriseTimers = new Map<number, number>();
let tierSurpriseShakeTimer: number | null = null;

const activeTier = computed(
  () =>
    loyaltyTiers.find((tier) => tier.id === activeTierId.value) ??
    loyaltyTiers[0],
);

type TierParticleKind = "dot" | "diamond" | "bar";

interface TierSurprisePetal {
  id: number;
  angle: number;
  distance: number;
  delayMs: number;
  sizePx: number;
  spinDeg: number;
  color: string;
  kind: TierParticleKind;
}

interface TierSurpriseBurst {
  id: number;
  x: number;
  y: number;
  petals: TierSurprisePetal[];
}

interface TierEffectSkin {
  accent: string;
  glow: string;
  hint: string;
  vibration: number[];
  particleKinds: TierParticleKind[];
  particleCount: number;
  spreadMin: number;
  spreadMax: number;
}

const tierEffectSkins: Record<string, TierEffectSkin> = {
  iron: {
    accent: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.4)",
    hint: "长按徽章触发钢铁流星雨",
    vibration: [18, 24, 24],
    particleKinds: ["dot", "bar"],
    particleCount: 14,
    spreadMin: 54,
    spreadMax: 92,
  },
  copper: {
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.38)",
    hint: "长按徽章触发铜焰喷发",
    vibration: [20, 30, 40],
    particleKinds: ["dot", "diamond"],
    particleCount: 16,
    spreadMin: 58,
    spreadMax: 98,
  },
  bronze: {
    accent: "#fb923c",
    glow: "rgba(251, 146, 60, 0.4)",
    hint: "长按徽章触发青铜礼花",
    vibration: [24, 34, 58, 28],
    particleKinds: ["dot", "diamond", "bar"],
    particleCount: 18,
    spreadMin: 64,
    spreadMax: 108,
  },
  silver: {
    accent: "#cbd5e1",
    glow: "rgba(203, 213, 225, 0.42)",
    hint: "长按徽章触发银霜碎星",
    vibration: [26, 36, 62, 28],
    particleKinds: ["diamond", "bar"],
    particleCount: 20,
    spreadMin: 68,
    spreadMax: 116,
  },
  gold: {
    accent: "#facc15",
    glow: "rgba(250, 204, 21, 0.48)",
    hint: "长按徽章触发鎏金雨",
    vibration: [30, 44, 72, 36],
    particleKinds: ["dot", "diamond"],
    particleCount: 22,
    spreadMin: 74,
    spreadMax: 126,
  },
  platinum: {
    accent: "#5eead4",
    glow: "rgba(94, 234, 212, 0.45)",
    hint: "长按徽章触发铂光冲击",
    vibration: [32, 46, 78, 32, 24],
    particleKinds: ["diamond", "bar", "dot"],
    particleCount: 24,
    spreadMin: 78,
    spreadMax: 132,
  },
  diamond: {
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.46)",
    hint: "长按徽章触发钻辉裂变",
    vibration: [36, 52, 92, 38, 28],
    particleKinds: ["diamond", "diamond", "bar", "dot"],
    particleCount: 28,
    spreadMin: 84,
    spreadMax: 146,
  },
  titanium: {
    accent: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.5)",
    hint: "长按徽章触发泰坦超新星",
    vibration: [42, 58, 108, 46, 34],
    particleKinds: ["diamond", "bar", "dot", "diamond"],
    particleCount: 32,
    spreadMin: 92,
    spreadMax: 162,
  },
};

const activeTierSkin = computed<TierEffectSkin>(
  () => tierEffectSkins[activeTier.value.id] ?? tierEffectSkins.bronze,
);

const surpriseHintText = computed(() => activeTierSkin.value.hint);

const tierSurpriseTriggerStyle = computed<CSSProperties>(() => ({
  "--tier-surprise-accent": activeTierSkin.value.accent,
  "--tier-surprise-glow": activeTierSkin.value.glow,
}));

function createTierSurpriseBurst(
  tier: LoyaltyTier,
  x: number,
  y: number,
): TierSurpriseBurst {
  const skin = tierEffectSkins[tier.id] ?? tierEffectSkins.bronze;
  const colors = [
    skin.accent,
    "#f8fafc",
    "#f59e0b",
    "#38bdf8",
    "#22c55e",
    "#fb7185",
  ];
  const petals: TierSurprisePetal[] = Array.from(
    { length: skin.particleCount },
    (_, index) => ({
      id: index,
      angle: Math.round((360 / skin.particleCount) * index + (Math.random() * 22 - 11)),
      distance: Math.round(skin.spreadMin + Math.random() * (skin.spreadMax - skin.spreadMin)),
      delayMs: Math.round(Math.random() * 120),
      sizePx: Math.round(4 + Math.random() * 7),
      spinDeg: Math.round(Math.random() * 130 - 65),
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: skin.particleKinds[Math.floor(Math.random() * skin.particleKinds.length)],
    }),
  );

  tierSurpriseSeed += 1;

  return {
    id: tierSurpriseSeed,
    x,
    y,
    petals,
  };
}

function tierSurpriseBurstStyle(burst: TierSurpriseBurst): CSSProperties {
  return {
    left: `${burst.x}px`,
    top: `${burst.y}px`,
  };
}

function tierSurprisePetalStyle(petal: TierSurprisePetal): CSSProperties {
  return {
    "--tier-petal-angle": `${petal.angle}deg`,
    "--tier-petal-distance": `${petal.distance}px`,
    "--tier-petal-delay": `${petal.delayMs}ms`,
    "--tier-petal-size": `${petal.sizePx}px`,
    "--tier-petal-spin": `${petal.spinDeg}deg`,
    "--tier-petal-color": petal.color,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function triggerTierSurpriseVibration() {
  if (supportsVibration) {
    // Stop delayed haptic from pointerdown, then fire a clear long-press pulse pattern.
    navigator.vibrate(0);
    navigator.vibrate(activeTierSkin.value.vibration);
  }
}

function triggerTierSurpriseShake() {
  isTierSurpriseShaking.value = true;
  if (tierSurpriseShakeTimer !== null) {
    window.clearTimeout(tierSurpriseShakeTimer);
  }

  tierSurpriseShakeTimer = window.setTimeout(() => {
    isTierSurpriseShaking.value = false;
    tierSurpriseShakeTimer = null;
  }, 460);
}

function onTierHeaderLongPress(event: PointerEvent) {
  const host = tierSurpriseTriggerRef.value;
  if (!host) {
    return;
  }

  const rect = host.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 14, Math.max(14, rect.width - 14));
  const y = clamp(event.clientY - rect.top, 14, Math.max(14, rect.height - 14));
  const burst = createTierSurpriseBurst(activeTier.value, x, y);

  tierSurpriseBursts.value = [...tierSurpriseBursts.value, burst];

  const timer = window.setTimeout(() => {
    tierSurpriseBursts.value = tierSurpriseBursts.value.filter((item) => item.id !== burst.id);
    tierSurpriseTimers.delete(burst.id);
  }, 1220);
  tierSurpriseTimers.set(burst.id, timer);

  triggerTierSurpriseShake();
  triggerTierSurpriseVibration();
}

const tierHeaderLongPressHandlers = useLongPress(
  {
    onLongPress: onTierHeaderLongPress,
  },
  {
    delay: 640,
    moveTolerance: 4,
    haptic: supportsVibration,
  },
);

onBeforeUnmount(() => {
  if (tierSurpriseShakeTimer !== null) {
    window.clearTimeout(tierSurpriseShakeTimer);
    tierSurpriseShakeTimer = null;
  }

  for (const timer of tierSurpriseTimers.values()) {
    window.clearTimeout(timer);
  }

  tierSurpriseTimers.clear();
});
</script>
