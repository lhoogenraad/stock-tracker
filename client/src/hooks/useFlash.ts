import { useEffect, useRef, useState } from 'react';

type FlashState = 'none' | 'gain' | 'loss';

// Tracks whether a value just increased/decreased, returning a transient
// flash state that auto-clears after `duration` ms.
export function useFlash(value: number | undefined, duration = 600): FlashState {
  const [flash, setFlash] = useState<FlashState>('none');
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === undefined || prevValue.current === undefined) {
      prevValue.current = value;
      return;
    }

    if (value > prevValue.current) {
      setFlash('gain');
    } else if (value < prevValue.current) {
      setFlash('loss');
    }

    prevValue.current = value;

    const timer = setTimeout(() => setFlash('none'), duration);
    return () => clearTimeout(timer);
  }, [value, duration]);

  return flash;
}
