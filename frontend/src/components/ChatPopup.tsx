import React, { useEffect, useRef, useState } from 'react';
import { BotMessageSquare, X, SendHorizontal, Copy, Check } from 'lucide-react';
import { getAccentTokens, type AccentColor } from '../constants/accentColors';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  accent?: AccentColor;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'welcome', role: 'assistant', text: "Hi! I'm your AI assistant. Ask me anything about your finances." },
];

const DEFAULT_BOTTOM = 96; // px, matches the original `bottom-24`
const MIN_BOTTOM = 8;
const MIN_VISIBLE_HEIGHT = 160; // keep at least this much of the popup on-screen when dragged up

export function ChatPopup({ isOpen, onClose, theme = 'dark', accent = 'green' }: ChatPopupProps) {
  const t = getAccentTokens(theme, accent);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bottomOffset, setBottomOffset] = useState(DEFAULT_BOTTOM);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ startY: number; startBottom: number } | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  // Always reopen at the default bottom position, regardless of where it was last dragged to.
  useEffect(() => {
    if (isOpen) setBottomOffset(DEFAULT_BOTTOM);
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const updatePosition = (clientY: number) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      const delta = dragState.startY - clientY;
      const maxBottom = window.innerHeight - MIN_VISIBLE_HEIGHT;
      setBottomOffset(Math.min(maxBottom, Math.max(MIN_BOTTOM, dragState.startBottom + delta)));
    };

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientY);
    };
    const stopDragging = () => {
      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const startDrag = (clientY: number, target: EventTarget | null) => {
    if (target instanceof HTMLElement && target.closest('button')) return;
    dragStateRef.current = { startY: clientY, startBottom: bottomOffset };
    setIsDragging(true);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text: trimmed };
    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      text: "This is a placeholder response — the AI backend isn't wired up yet.",
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setCopied(false);
  };

  const handleCopyLastResponse = () => {
    const lastMessage = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastMessage) return;
    navigator.clipboard.writeText(lastMessage.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{ bottom: bottomOffset, maxHeight: `calc(100vh - ${bottomOffset + 16}px)` }}
      className={`fixed right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] flex flex-col rounded-2xl border shadow-2xl ${
        isDragging ? 'select-none' : ''
      } ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#353534]' : 'bg-white border-[#E2E8F0]'}`}
    >
      {/* Header — also the drag handle for moving the popup up/down */}
      <div
        onMouseDown={(e) => startDrag(e.clientY, e.target)}
        onTouchStart={(e) => startDrag(e.touches[0].clientY, e.target)}
        className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${theme === 'dark' ? 'border-[#2d2c38]/40' : 'border-[#E2E8F0]'}`}
      >
        <div className="flex items-center gap-2">
          <BotMessageSquare size={20} style={{ color: theme === 'dark' ? t.gradientTo : t.solid }} />
          <span className={`text-[14px] font-semibold ${theme === 'dark' ? 'text-[#e5e2e1]' : 'text-[#0b1c30]'}`}>
            AI Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          title="Close"
          className={`p-1 rounded-md transition-colors ${
            theme === 'dark'
              ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
              : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
          }`}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              style={message.role === 'user' ? { backgroundColor: t.solid } : undefined}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                message.role === 'user'
                  ? 'text-white'
                  : theme === 'dark'
                  ? 'bg-[#201f1f] text-[#e5e2e1]'
                  : 'bg-[#eff4ff] text-[#0b1c30]'
              }`}
            >
              {message.text}
            </div>
            {message.role === 'assistant' && message.id === lastAssistantId && (
              <button
                onClick={handleCopyLastResponse}
                title="Copy response"
                className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] transition-colors ${
                  theme === 'dark'
                    ? 'text-[#8e8ca0] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                    : 'text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className={`flex items-center gap-2 p-3 border-t rounded-b-2xl ${
          theme === 'dark' ? 'border-[#2d2c38]/40' : 'border-[#E2E8F0]'
        }`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a question..."
          className={`flex-1 rounded-full px-3.5 py-2 text-[13px] border outline-none transition-colors ${
            theme === 'dark'
              ? 'bg-[#201f1f] border-[#2d2c38] text-[#e5e2e1] placeholder:text-[#8e8ca0]'
              : 'bg-[#f8f9ff] border-[#c7c4d7] text-[#0b1c30] placeholder:text-[#767586]'
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
          title="Send"
          style={{ '--accent-solid': t.solid, '--accent-solid-hover': t.solidHover } as React.CSSProperties}
          className="p-2 rounded-full text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)]"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
