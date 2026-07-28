export interface MeridianFeatureFlags {
  chartV2: boolean;
}

export function parseBooleanFeatureFlag(
  _name: string,
  value: unknown,
  defaultValue = false,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

export function resolveMeridianFeatureFlags(
  environment: Readonly<Record<string, unknown>>,
): MeridianFeatureFlags {
  return Object.freeze({
    chartV2: parseBooleanFeatureFlag(
      "VITE_ENABLE_MERIDIAN_CHART_V2",
      environment["VITE_ENABLE_MERIDIAN_CHART_V2"],
    ),
  });
}

export const meridianFeatureFlags = resolveMeridianFeatureFlags(
  import.meta.env as Readonly<Record<string, unknown>>,
);
