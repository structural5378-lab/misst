import { useQuery } from "@tanstack/react-query";
import { mist } from '@/api/mist';
/**
 * Detects the active database environment (Test vs Production) via the
 * getAppEnvironment backend function, which reads the platform's x-data-env
 * header. Returns { environment: 'dev'|'prod', isTest, label }.
 */
export function useAppEnvironment() {
  return useQuery({
    queryKey: ["app-environment"],
    queryFn: async () => {
      const res = await mist.functions.invoke("getAppEnvironment", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}