import React, { useState } from 'react';
import { Bot, Send, User, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ isOpen, onClose, period }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello Dr. Vance! I am your Carbonix Scope 3 AI Assistant. How can I assist with your supply chain emissions auditing today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await api.askInventoryQuestion([...messages, userMsg], period);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'I could not access the current inventory. Please check that the Carbonix backend is running and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-[#E1DFDA] shadow-2xl z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 bg-[#1B3A2D] text-[#F7F5F0] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-[#7A9B8A]/30 flex items-center justify-center text-[#7A9B8A]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm">Carbonix AI Auditor</h3>
            <p className="font-mono-data text-[10px] text-[#7A9B8A]">Connected to Carbon Engine API</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#7A9B8A] hover:text-white p-1 rounded hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Preset suggestions */}
      <div className="p-3 bg-[#F7F5F0] border-b border-[#E1DFDA] flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={() => handleSend('Top emission hotspots?')}
          className="px-2 py-1 bg-white border border-[#E1DFDA] rounded text-stone-700 hover:border-[#7A9B8A] text-[11px]"
        >
          🔥 Top hotspots?
        </button>
        <button
          onClick={() => handleSend('Highest decarbonization ROI?')}
          className="px-2 py-1 bg-white border border-[#E1DFDA] rounded text-stone-700 hover:border-[#7A9B8A] text-[11px]"
        >
          💡 Decarbonization ROI
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F5F0]/40">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[#1B3A2D] text-white flex items-center justify-center shrink-0 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-lg text-xs leading-relaxed max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-[#1B3A2D] text-[#F7F5F0] rounded-br-none'
                  : 'bg-white border border-[#E1DFDA] text-[#2C2C2C] rounded-bl-none shadow-xs'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-stone-500 italic">
            <Bot className="w-4 h-4 animate-bounce text-[#7A9B8A]" />
            <span>Analyzing carbon inventory...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-[#E1DFDA] flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Auditor about emissions..."
          className="flex-1 px-3 py-2 text-xs border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D]"
        />
        <Button type="submit" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
          Send
        </Button>
      </form>
    </div>
  );
};
