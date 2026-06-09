import {
  useGetRiskConfig,
  useUpdateRiskConfig,
  getGetRiskConfigQueryKey,
} from "@workspace/api-client-react";
import { RISK_CONFIG } from "@/data/riskConfig";
import type { RiskConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export type { RiskConfig };

export function useRiskConfig() {
  const query = useGetRiskConfig({
    query: {
      queryKey: getGetRiskConfigQueryKey(),
      staleTime: 30_000,
      retry: 1,
    },
  });

  const config: RiskConfig = query.data ?? {
    ...RISK_CONFIG,
    isDefault: true,
    updatedAt: null,
  };

  return { config, isLoading: query.isLoading, isError: query.isError, query };
}

export function useUpdateRiskConfigMutation() {
  const queryClient = useQueryClient();
  return useUpdateRiskConfig({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRiskConfigQueryKey(), data);
      },
    },
  });
}
