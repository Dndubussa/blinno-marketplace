/**
 * Hook to handle browser tab visibility changes
 * Prevents unnecessary data refetching and maintains application state
 */

import { useEffect, useRef } from "react";

interface UseTabVisibilityOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  refetchOnVisible?: boolean;
}

export function useTabVisibility(options: UseTabVisibilityOptions = {}) {
  const { onVisible, onHidden, refetchOnVisible = false } = options;
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        onHidden?.();
      } else {
        // Only trigger onVisible if tab was previously hidden
        if (wasHiddenRef.current) {
          wasHiddenRef.current = false;
          onVisible?.();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onVisible, onHidden]);

  return {
    isVisible: !document.hidden,
    wasHidden: wasHiddenRef.current,
  };
}

