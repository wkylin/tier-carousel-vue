import { computed, type Ref } from "vue";

const TIER_THEME_COLORS: Record<string, string> = {
  iron: "#64748b",
  copper: "#b87333",
  bronze: "#c26a2e",
  silver: "#94a3b8",
  gold: "#d4a017",
  platinum: "#42d3c8",
  diamond: "#38bdf8",
  titanium: "#8b5cf6",
};

interface UseTierCarouselThemeOptions {
  activeIndex: Ref<number>;
  dragProgress: Ref<number>;
  normalizeIndex: (index: number) => number;
  getTierByIndex: (index: number) => { id?: string } | undefined;
}

export function useTierCarouselTheme(options: UseTierCarouselThemeOptions) {
  const { activeIndex, dragProgress, normalizeIndex, getTierByIndex } = options;

  function getTierThemeColor(index: number) {
    const tier = getTierByIndex(index);
    return TIER_THEME_COLORS[tier?.id ?? ""] ?? "#0ea5e9";
  }

  function hexToRgb(hex: string) {
    const normalized = hex.replace("#", "");
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : normalized;
    const parsed = Number.parseInt(value, 16);

    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  function interpolateColor(from: string, to: string, progress: number) {
    const fromRgb = hexToRgb(from);
    const toRgb = hexToRgb(to);
    const mix = (start: number, end: number) =>
      Math.round(start + (end - start) * progress);

    return `rgb(${mix(fromRgb.r, toRgb.r)}, ${mix(fromRgb.g, toRgb.g)}, ${mix(
      fromRgb.b,
      toRgb.b,
    )})`;
  }

  function withAlpha(color: string, alpha: number) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  const backgroundTheme = computed(() => {
    const currentColor = getTierThemeColor(activeIndex.value);
    const targetIndex =
      dragProgress.value >= 0
        ? normalizeIndex(activeIndex.value + 1)
        : normalizeIndex(activeIndex.value - 1);
    const targetColor = getTierThemeColor(targetIndex);
    const progress = Math.min(1, Math.abs(dragProgress.value));
    const mixedColor = interpolateColor(currentColor, targetColor, progress);

    return {
      primary: mixedColor,
      soft: withAlpha(mixedColor, 0.16),
      faint: withAlpha(mixedColor, 0.06),
    };
  });

  const carouselViewportStyle = computed(() => ({
    "--tier-theme-color": backgroundTheme.value.primary,
    "--tier-theme-soft": backgroundTheme.value.soft,
    "--tier-theme-faint": backgroundTheme.value.faint,
  }));

  return {
    backgroundTheme,
    carouselViewportStyle,
  };
}
