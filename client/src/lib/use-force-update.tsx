import { useCallback, useState } from "react";

export function useForceUpdate() {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({} as any), []);
  return forceUpdate;
}
