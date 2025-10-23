export type Features = {
  enableGpt5: boolean;
  aiModel: string; // e.g., "gpt-5" (logical label)
};

export const defaultFeatures: Features = {
  enableGpt5: false,
  aiModel: "gpt-4o-mini", // safe default label
};
