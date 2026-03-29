import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export const AUTH_IS_AUTHENTICATED = "auth-is-authenticated";

export function useIsAuthenticated() {
  return useQuery({
    queryKey: [AUTH_IS_AUTHENTICATED],
    queryFn: async () => {
      const response = await api.api.auth["is-authenticated"].$get();
      if (!response.ok) {
        throw new Error("Failed to check authentication");
      }
      return response.json();
    },
  });
}
