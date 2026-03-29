import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export const AUTH_IS_AUTHENTICATED = "auth-is-authenticated";

export function useIsAuthenticated() {
  return useQuery({
    queryKey: [AUTH_IS_AUTHENTICATED],
    queryFn: async () => {
      const res = await api.api.auth["is-authenticated"].$get();
      return res.json();
    },
  });
}
