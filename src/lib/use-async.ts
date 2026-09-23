import { useCallback, useEffect, useState } from "react";

/**
 * Runs `load` on mount and whenever it changes; `reload()` runs it again (the SPA stand-in for
 * Next's `router.refresh()`). Keeps the previous data on screen while reloading.
 */
export function useAsync<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ data }),
      (error: unknown) => {
        console.error(error);
        if (active) setState({ error: "Something went wrong loading this page. Please refresh." });
      }
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
