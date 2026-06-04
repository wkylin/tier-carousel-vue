export type TierParticleKind = "dot" | "diamond" | "bar";

export interface TierSurprisePetal {
  id: number;
  angle: number;
  distance: number;
  delayMs: number;
  sizePx: number;
  spinDeg: number;
  color: string;
  kind: TierParticleKind;
}

export interface TierSurpriseBurst {
  id: number;
  x: number;
  y: number;
  petals: TierSurprisePetal[];
}

export interface TierEffectSkin {
  accent: string;
  glow: string;
  hint: string;
  vibration: number[];
  particleKinds: TierParticleKind[];
  particleCount: number;
  spreadMin: number;
  spreadMax: number;
}
