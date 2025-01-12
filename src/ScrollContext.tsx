import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";

interface ScrollContextType {
  scroll: number;
  scrolling: boolean;
}

// Scroll configuration parameters
const SCROLL_CONFIG = {
  WHEEL_MULTIPLIER: 0.000003, // Controls mouse wheel sensitivity
  TOUCH_MULTIPLIER: 0.00003, // Controls touch sensitivity
  VELOCITY_DECAY: 0.95, // Controls how quickly scrolling slows down (0-1)
  SMOOTHING: 0.1, // Controls how smooth the scrolling is (0-1)
  MIN_VELOCITY: 0.001, // Minimum velocity before stopping
  WRAP_THRESHOLD: 0.05, // How close to edges before wrapping
};

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor;

// Wrap scroll value between 0 and 1
const wrapScroll = (value: number) => {
  if (value > 1) return value - Math.floor(value);
  if (value < 0) return 1 + (value - Math.ceil(value));
  return value;
};

const ScrollContext = createContext<ScrollContextType>({
  scroll: 0,
  scrolling: false,
});

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [scroll, setScroll] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const targetScroll = useRef(0);
  const touchStart = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(performance.now());

  // Smooth animation loop
  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      const currentTime = performance.now();
      lastTime.current = currentTime;

      // Apply velocity with configurable decay
      targetScroll.current += velocity.current;
      velocity.current *= SCROLL_CONFIG.VELOCITY_DECAY;

      // Wrap the target scroll value
      targetScroll.current = wrapScroll(targetScroll.current);

      // Smooth scroll using configurable smoothing
      let newScroll = lerp(
        scroll,
        targetScroll.current,
        SCROLL_CONFIG.SMOOTHING
      );

      // Handle wrapping for smooth transitions
      if (Math.abs(targetScroll.current - scroll) > 0.5) {
        // If we're crossing the wrap point, adjust the lerp
        if (targetScroll.current > scroll) {
          newScroll = lerp(
            scroll + 1,
            targetScroll.current,
            SCROLL_CONFIG.SMOOTHING
          );
        } else {
          newScroll = lerp(
            scroll - 1,
            targetScroll.current,
            SCROLL_CONFIG.SMOOTHING
          );
        }
      }

      // Wrap the final scroll value
      newScroll = wrapScroll(newScroll);
      setScroll(newScroll);

      setScrolling(Math.abs(velocity.current) > SCROLL_CONFIG.MIN_VELOCITY);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [scroll]);

  // Wheel handler
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    velocity.current += event.deltaY * SCROLL_CONFIG.WHEEL_MULTIPLIER;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStart.current = event.touches[0].clientY;
    velocity.current = 0;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0].clientY;
    const delta = (touchStart.current - touch) * SCROLL_CONFIG.TOUCH_MULTIPLIER;
    velocity.current = delta;
    touchStart.current = touch;
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  return (
    <ScrollContext.Provider value={{ scroll, scrolling }}>
      {children}
    </ScrollContext.Provider>
  );
};

// Export config for external access/modification
export const updateScrollConfig = (
  newConfig: Partial<typeof SCROLL_CONFIG>
) => {
  Object.assign(SCROLL_CONFIG, newConfig);
};

export const useCustomScroll = () => useContext(ScrollContext);
