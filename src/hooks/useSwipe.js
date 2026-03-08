import { useState, useRef, useCallback } from 'react';

export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const handleStart = useCallback((clientX, clientY) => {
    setIsDragging(true);
    startX.current = clientX;
    startY.current = clientY;
    currentX.current = clientX;
    currentY.current = clientY;
    setDirection(null);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;

    currentX.current = clientX;
    currentY.current = clientY;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    // Determine swipe direction based on horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? 'right' : 'left');
    }
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;

    // Check if it's a valid swipe (horizontal movement > vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    setIsDragging(false);
    setDirection(null);
  }, [isDragging, onSwipeLeft, onSwipeRight]);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e) => {
    handleEnd();
  }, [handleEnd]);

  const handlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    handlers,
    isDragging,
    direction,
  };
}
