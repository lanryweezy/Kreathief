import { log } from '../utils/log';
import React, { useState, useRef, useEffect } from 'react';
import * as geminiService from '../services/geminiService';
import { Icons } from '../constants';
import { runTool } from '../store/tools';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion?: (suggestion: string) => void;
  isProcessing?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  onApplySuggestion: _onApplySuggestion,
  isProcessing = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your AI design assistant. Ask for help or use commands like /align center, /distribute horizontal, /layout grid, /group, /ungroup, /flip h.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const tryExecuteCommand = async (text: string): Promise<string | null> => {
    const cmd = text.trim();
    const alignMatch = cmd.match(/^\/(align)\s+(left|center|right|top|middle|bottom)$/i);
    if (alignMatch) {
      await runTool('align', { type: alignMatch[2].toLowerCase() });
      return `Aligned selection: ${alignMatch[2].toLowerCase()}`;
    }
    const distMatch = cmd.match(/^\/(distribute)\s+(horizontal|vertical)$/i);
    if (distMatch) {
      await runTool('distribute', { type: distMatch[2].toLowerCase() });
      return `Distributed ${distMatch[2].toLowerCase()}`;
    }
    const layoutMatch = cmd.match(/^\/(layout)\s+(grid|row|col|golden_v|golden_h|golden_grid)$/i);
    if (layoutMatch) {
      await runTool('layout', { type: layoutMatch[2] });
      return `Applied layout: ${layoutMatch[2]}`;
    }
    const groupMatch = cmd.match(/^\/(group)$/i);
    if (groupMatch) {
      await runTool('groupSelected', {});
      return `Grouped selection`;
    }
    const ungroupMatch = cmd.match(/^\/(ungroup)$/i);
    if (ungroupMatch) {
      await runTool('ungroupSelected', {});
      return `Ungrouped selection`;
    }
    const flipMatch = cmd.match(/^\/(flip)\s+(h|v|horizontal|vertical)$/i);
    if (flipMatch) {
      const axis = flipMatch[2].toLowerCase().startsWith('h') ? 'horizontal' : 'vertical';
      await runTool('flip', { axis });
      return `Flipped ${axis}`;
    }
    const brandMatch = cmd.match(/^\/(apply-brand-colors)\s+(.+)$/i);
    if (brandMatch) {
      const colors = brandMatch[2]
        .split(/[\s,]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      await runTool('applyBrandColors', { colors });
      return `Applied brand colors`;
    }
    return null;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) {
      return;
    }

    const now = Date.now();
    const userMessage: Message = {
      id: `msg_${now}`,
      role: 'user',
      content: text,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Try local command execution first
      const applied = await tryExecuteCommand(text);
      if (applied) {
        setMessages((prev) => [
          ...prev,
          { id: `msg_${Date.now()}_applied`, role: 'assistant', content: applied, timestamp: Date.now() },
        ]);
        return;
      }

      // Otherwise, generate AI response
      const response = await geminiService.generateText(
        text,
        'You are a helpful AI design assistant. Provide concise, actionable design suggestions. Keep responses under 100 words. Be encouraging and creative.'
      );

      setMessages((prev) => [
        ...prev,
        { id: `msg_${Date.now()}_response`, role: 'assistant', content: response, timestamp: Date.now() },
      ]);
    } catch (error) {
      log.error('AI Assistant error', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-end sm:justify-center">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full sm:w-96 h-[600px] sm:h-[500px] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Icons.Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-white">AI Assistant</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-white transition-colors">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder="Ask me anything... (try /align center)"
              disabled={isLoading || isProcessing}
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm"
            />
            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading || isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Icons.Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
