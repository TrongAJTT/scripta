import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage Fullscreen API state and actions.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    Boolean(typeof document !== 'undefined' && document.fullscreenElement)
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // User or browser may deny or ignore fullscreen requests
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
