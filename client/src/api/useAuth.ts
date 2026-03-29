import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import { AUTH_IS_AUTHENTICATED } from "./queryKeys";

export function useIsAuthenticated() {
  return useQuery({
    queryKey: [AUTH_IS_AUTHENTICATED],
    queryFn: async () => {
      const res = await api.api.auth["is-authenticated"].$get();
      return res.json();
    },
  });
}
