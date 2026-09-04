import React, { useEffect, useRef, useState } from 'react';
import { BotMessageSquare } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';

interface ChatButtonProps {
  onClick?: () => void;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
}

const STORAGE_KEY = 'chatButtonTopPosition';
const BUTTON_SIZE = 48;
const EDGE_MARGIN = 12;
const DRAG_THRESHOLD = 4;

function getDefaultTop() {
  return window.innerHeight - 96 - BUTTON_SIZE;
}

function clampTop(top: number) {
  const max = window.innerHeight - EDGE_MARGIN - BUTTON_SIZE;
  const min = EDGE_MARGIN;
  return Math.min(Math.max(top, min), max);
}

export function ChatButton({ onClick = () => {}, theme = 'dark', accent = 'green' }: ChatButtonProps) {
  const t = getAccentTokens(theme, accent);
  const [top, setTop] = useState<number>(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored ? clampTop(stored) : getDefaultTop();
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);

  useEffect(() => {
    const handleResize = () => setTop((t) => clampTop(t));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragState.current = { startY: e.clientY, startTop: top, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current) return;
    const delta = e.clientY - dragState.current.startY;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
      setIsDragging(true);
    }
    if (dragState.current.moved) {
      setTop(clampTop(dragState.current.startTop + delta));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const wasDragging = dragState.current?.moved ?? false;
    dragState.current = null;
    setIsDragging(false);
    if (wasDragging) {
      setTop((t) => {
        localStorage.setItem(STORAGE_KEY, String(t));
        return t;
      });
    } else {
      onClick();
    }
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label="Open AI chat"
      title="AI Chat"
      style={{
        top: `${top}px`,
        touchAction: 'none',
        backgroundImage: `linear-gradient(to bottom right, ${t.gradientFrom}, ${t.gradientTo})`,
        boxShadow: `0 10px 15px -3px ${t.solid}40, 0 4px 6px -4px ${t.solid}40`,
      }}
      className={`fixed right-0 z-50 rounded-l-full py-2.5 pl-2.5 pr-3 text-white flex items-center justify-center shadow-lg select-none ${
        isDragging ? 'cursor-grabbing transition-colors' : 'cursor-grab transition-all hover:pr-4'
      }`}
    >
      <BotMessageSquare size={26} />
    </button>
  );
}
