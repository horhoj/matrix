import { useLayoutEffect, useState } from 'react';

interface Size {
  width: number | null;
  height: number | null;
}

export function useWindowSize() {
  const [size, setSize] = useState<Size>({
    width: null,
    height: null,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
