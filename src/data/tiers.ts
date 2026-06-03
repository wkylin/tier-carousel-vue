import ironIcon from "@/assets/tier/iron.png";
import copperIcon from "@/assets/tier/copper.png";
import bronzeIcon from "@/assets/tier/bronze.png";
import silverIcon from "@/assets/tier/silver.png";
import goldIcon from "@/assets/tier/gold.png";
import platinumIcon from "@/assets/tier/platinum.png";
import diamondIcon from "@/assets/tier/diamond.png";
import titaniumIcon from "@/assets/tier/titanium.png";

export type LoyaltyTier = {
  id: string;
  code: string;
  name: string;
  icon: string;
  reward: number;
  summary: string;
  monthlyProgress: string;
  lifetimeProgress: string;
  nextUpdate: string;
  benefits: Array<{
    title: string;
    value: string;
    note?: string;
  }>;
};

export const CURRENT_TIER_ID = "bronze";

export const loyaltyTiers: LoyaltyTier[] = [
  {
    id: "iron",
    code: "I",
    name: "Iron",
    icon: ironIcon,
    reward: 0,
    summary: "Entry tier with starter tasks and baseline weekly rewards.",
    monthlyProgress: "300",
    lifetimeProgress: "6,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "500 pts" },
      { title: "Personalized Gift", value: "Starter Avatar" },
    ],
  },
  {
    id: "copper",
    code: "II",
    name: "Copper",
    icon: copperIcon,
    reward: 100,
    summary: "Unlock improved weekly task multipliers.",
    monthlyProgress: "300",
    lifetimeProgress: "6,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "1,000 pts" },
      { title: "Personalized Gift", value: "Copper Avatar" },
    ],
  },
  {
    id: "bronze",
    code: "III",
    name: "Bronze",
    icon: bronzeIcon,
    reward: 220,
    summary: "Bronze users gain broader reward pools.",
    monthlyProgress: "1,500",
    lifetimeProgress: "30,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "1,800 pts" },
      { title: "Personalized Gift", value: "Bronze Avatar" },
    ],
  },
  {
    id: "silver",
    code: "IV",
    name: "Silver",
    icon: silverIcon,
    reward: 450,
    summary: "Silver tier includes extra task refresh slots.",
    monthlyProgress: "7,500",
    lifetimeProgress: "150,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "2,800 pts" },
      { title: "Personalized Gift", value: "Silver Avatar" },
    ],
  },
  {
    id: "gold",
    code: "V",
    name: "Gold",
    icon: goldIcon,
    reward: 950,
    summary: "Gold tier unlocks higher reward conversion ratios.",
    monthlyProgress: "15,000",
    lifetimeProgress: "300,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "4,500 pts" },
      { title: "Personalized Gift", value: "Gold Avatar" },
    ],
  },
  {
    id: "platinum",
    code: "VI",
    name: "Platinum",
    icon: platinumIcon,
    reward: 1600,
    summary: "Platinum tier enables premium reward challenges.",
    monthlyProgress: "30,000",
    lifetimeProgress: "600,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "8,000 pts" },
      { title: "Personalized Gift", value: "Special Avatar" },
    ],
  },
  {
    id: "diamond",
    code: "VII",
    name: "Diamond",
    icon: diamondIcon,
    reward: 2500,
    summary: "Diamond tier unlocks top reward allocations.",
    monthlyProgress: "60,000",
    lifetimeProgress: "1,200,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "12,000 pts" },
      { title: "Personalized Gift", value: "Diamond Avatar" },
    ],
  },
  {
    id: "titanium",
    code: "VIII",
    name: "Titanium",
    icon: titaniumIcon,
    reward: 4000,
    summary: "Top tier with the highest weekly and challenge rewards.",
    monthlyProgress: "120,000",
    lifetimeProgress: "2,400,000",
    nextUpdate: "11 Jun",
    benefits: [
      { title: "Tier Upgrade Gift", value: "20,000 pts" },
      { title: "Personalized Gift", value: "Titanium Avatar" },
    ],
  },
];
