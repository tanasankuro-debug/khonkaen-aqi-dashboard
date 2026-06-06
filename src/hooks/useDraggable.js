import { useState, useCallback, useRef } from 'react';

export function useDraggable({ onToggle } = {}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef   = useRef({ x: 0, y: 0 });
  const toggleRef   = useRef(onToggle);
  toggleRef.current = onToggle;

  const startDrag = useCallback((startX, startY, moveEvt, endEvt, getXY, addOpts) => {
    const orig = { ...offsetRef.current };
    let moved = false;

    const onMove = (ev) => {
      const { x, y } = getXY(ev);
      const dx = x - startX;
      const dy = y - startY;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      if (addOpts) ev.preventDefault();
      const next = { x: orig.x + dx, y: orig.y + dy };
      offsetRef.current = next;
      setOffset({ ...next });
    };

    const onEnd = () => {
      window.removeEventListener(moveEvt, onMove, addOpts ? { passive: false } : undefined);
      window.removeEventListener(endEvt, onEnd);
      if (!moved && toggleRef.current) toggleRef.current();
    };

    window.addEventListener(moveEvt, onMove, addOpts || undefined);
    window.addEventListener(endEvt, onEnd);
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY, 'mousemove', 'mouseup',
      (ev) => ({ x: ev.clientX, y: ev.clientY }));
  }, [startDrag]);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY, 'touchmove', 'touchend',
      (ev) => ({ x: ev.touches[0].clientX, y: ev.touches[0].clientY }),
      { passive: false });
  }, [startDrag]);

  return {
    offset,
    dragHandleProps: {
      onMouseDown,
      onTouchStart,
      style: { cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' },
    },
  };
}
