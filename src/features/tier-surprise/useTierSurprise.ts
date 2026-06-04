import { computed, onScopeDispose, ref, type CSSProperties, type Ref } from "vue";
import type { LoyaltyTier } from "@/data/tiers";
import { useLongPress } from "../../../composables/useLongPress";
import { tierEffectSkins } from "./skins";
import type {
  TierEffectSkin,
  TierSurpriseBurst,
  TierSurprisePetal,
} from "./types";

export function useTierSurprise(
  activeTier: Ref<LoyaltyTier>,
  triggerRef: Ref<HTMLElement | null>,
) {
  const supportsVibration =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  const tierSurpriseBursts = ref<TierSurpriseBurst[]>([]);
  const isTierSurpriseShaking = ref(false);
  let tierSurpriseSeed = 0;
  const tierSurpriseTimers = new Map<number, number>();
  let tierSurpriseShakeTimer: number | null = null;

  const activeTierSkin = computed<TierEffectSkin>(
    () => tierEffectSkins[activeTier.value.id] ?? tierEffectSkins.bronze,
  );

  const surpriseHintText = computed(() => activeTierSkin.value.hint);

  const tierSurpriseTriggerStyle = computed<CSSProperties>(() => ({
    "--tier-surprise-accent": activeTierSkin.value.accent,
    "--tier-surprise-glow": activeTierSkin.value.glow,
  }));

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
        angle: Math.round(
          (360 / skin.particleCount) * index + (Math.random() * 22 - 11),
        ),
        distance: Math.round(
          skin.spreadMin + Math.random() * (skin.spreadMax - skin.spreadMin),
        ),
        delayMs: Math.round(Math.random() * 120),
        sizePx: Math.round(4 + Math.random() * 7),
        spinDeg: Math.round(Math.random() * 130 - 65),
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: skin.particleKinds[
          Math.floor(Math.random() * skin.particleKinds.length)
        ],
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

  function triggerTierSurpriseVibration() {
    if (supportsVibration) {
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
    const host = triggerRef.value;
    if (!host) {
      return;
    }

    const rect = host.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 14, Math.max(14, rect.width - 14));
    const y = clamp(event.clientY - rect.top, 14, Math.max(14, rect.height - 14));
    const burst = createTierSurpriseBurst(activeTier.value, x, y);

    tierSurpriseBursts.value = [...tierSurpriseBursts.value, burst];

    const timer = window.setTimeout(() => {
      tierSurpriseBursts.value = tierSurpriseBursts.value.filter(
        (item) => item.id !== burst.id,
      );
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

  function dispose() {
    if (tierSurpriseShakeTimer !== null) {
      window.clearTimeout(tierSurpriseShakeTimer);
      tierSurpriseShakeTimer = null;
    }

    for (const timer of tierSurpriseTimers.values()) {
      window.clearTimeout(timer);
    }
    tierSurpriseTimers.clear();
  }

  onScopeDispose(dispose);

  return {
    supportsVibration,
    tierSurpriseBursts,
    isTierSurpriseShaking,
    surpriseHintText,
    tierSurpriseTriggerStyle,
    tierSurpriseBurstStyle,
    tierSurprisePetalStyle,
    tierHeaderLongPressHandlers,
  };
}
