import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { ChatMessage, TextLayer, ShapeLayer } from '../../types';
import * as geminiService from '../../services/geminiService';
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../../utils/log';

// Local SVG icons to avoid dependence on constants.ts which might cause crashes
const LocalIcons = {
  Bot: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  Eye: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  LayoutGrid: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  Mic: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  MicOff: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 12a11.94 11.94 0 0 1-2.23 6.41" />
      <path d="M2 10h3" />
      <path d="M20 10h3" />
      <path d="M15 2H9a2 2 0 0 0-2 2v7h2V4h6v10H9v4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  ),
  ArrowUp: (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
};

interface AssistantPanelProps {
  getCanvasSnapshot: () => Promise<string>;
  onStartDesign?: (prompt: string) => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ getCanvasSnapshot, onStartDesign }) => {
  const addLayer = useStore((state) => state.addLayer);
  const canvasSize = useStore((state) => state.canvasSize);

  const onAddShape = (type: any, style: Partial<ShapeLayer>) => {
    addLayer({
      id: uuidv4(),
      type: type as any,
      name: style.name || 'New Shape',
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      color: '#7d2ae8',
      cornerRadius: 0,
      ...style,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        vignette: 0,
        opacity: 1,
      },
    } as any);
  };

  const onAddText = (style: Partial<TextLayer>) => {
    addLayer({
      id: uuidv4(),
      type: 'text',
      name: 'Text Layer',
      text: 'Heading',
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fontSize: 24,
      fontFamily: 'Inter',
      color: '#000000',
      align: 'center',
      ...style,
    } as TextLayer);
  };
  const selectedLayerIds = useStore((state) => state.selectedLayerIds);
  const artboards = useStore((state) => state.artboards);
  const activeArtboardId = useStore((state) => state.activeArtboardId);

  // Get the currently selected layer for context injection
  const selectedLayer = React.useMemo(() => {
    if (selectedLayerIds.length !== 1) return null;
    const ab = artboards.find((a: any) => a.id === activeArtboardId);
    return ab?.layers.find((l: any) => l.id === selectedLayerIds[0]) || null;
  }, [selectedLayerIds, artboards, activeArtboardId]);

  const CHAT_STORAGE_KEY = `kreathief_chat_${activeArtboardId}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI design partner. I can critique your work, suggest layouts, or generate design ideas.\n\nTry asking me to **Analyze Design**, **Generate Layout**, or **Suggest Color Palette**.",
      timestamp: Date.now(),
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persist chat history to localStorage on every message change
  useEffect(() => {
    try {
      // Keep only last 50 messages to avoid localStorage bloat
      const toSave = messages.slice(-50);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages, CHAT_STORAGE_KEY]);

  useEffect(() => {
    // Initialize Speech Recognition if supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          log.error('[AssistantPanel] Speech recognition error', event, { error: event.error });
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        setVoiceSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // === Context Injection: build a rich system prompt with selected layer info ===
      let systemContext = 'You are a helpful graphic design assistant with deep expertise in typography, color theory, composition, and visual design. Keep answers concise and actionable.';
      
      if (selectedLayer) {
        const l = selectedLayer as any;
        const layerDesc = l.type === 'text'
          ? `Text Layer: "${l.text}" | Font: ${l.fontFamily} ${l.fontSize}px | Color: ${l.color} | Alignment: ${l.textAlign}`
          : l.type === 'image'
          ? `Image Layer: ${l.name} | Size: ${l.width}×${(l.height || l.width)}px`
          : `Shape: ${l.type} | Color: ${l.color} | Size: ${l.width}×${(l.height || l.width)}px`;
        systemContext += `\n\nThe user currently has this layer selected: [${layerDesc}]. Incorporate this context into your answer when relevant.`;
      }

      // Check for layout generation request
      if (input.toLowerCase().includes('layout') || input.toLowerCase().includes('generate') || input.toLowerCase().includes('create')) {
        const layoutData = await geminiService.generateLayout(input);
        if (layoutData) {
          if (layoutData.textLayers) { layoutData.textLayers.forEach((l: any) => onAddText(l)); }
          if (layoutData.shapeLayers) { layoutData.shapeLayers.forEach((l: any) => onAddShape(l.type, l)); }
          const aiMsg: ChatMessage = {
            id: Date.now().toString() + '_ai',
            role: 'assistant',
            content: "✅ Layout added to canvas! I've placed the elements based on your description. Click on each to refine.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          throw new Error('Failed to generate layout');
        }
      } else {
        const response = await geminiService.generateText(input, systemContext);
        const aiMsg: ChatMessage = {
          id: Date.now().toString() + '_ai',
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (e) {
      log.error('[AssistantPanel] AI chat response failed', e, { input: input.substring(0, 100) });
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: 'Sorry, I encountered an error processing that request.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    const loadingMsg: ChatMessage = {
      id: 'analyzing',
      role: 'assistant',
      content: 'Looking at your design...',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const snapshot = await getCanvasSnapshot();
      const analysis = await geminiService.analyzeDesign(
        snapshot,
        'Critique this design. Focus on composition, color balance, and typography. Be constructive.'
      );

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== 'analyzing')
          .concat({
            id: Date.now().toString(),
            role: 'assistant',
            content: analysis,
            timestamp: Date.now(),
          })
      );
    } catch (e) {
      log.error('[AssistantPanel] Canvas analysis failed', e);
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== 'analyzing')
          .concat({
            id: Date.now().toString(),
            role: 'assistant',
            content: "I couldn't analyze the canvas right now.",
            timestamp: Date.now(),
          })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a] border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-[110]">
      <div className="p-6 border-b border-white/5 bg-[#1e1e1e]/50 backdrop-blur-xl">
        <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-[0.2em] text-xs">
          <div className="w-8 h-8 rounded-xl bg-[#7d2ae8] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <LocalIcons.Bot className="w-5 h-5 text-white" />
          </div>
          Assistant
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0e1318]/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#7d2ae8] text-white rounded-br-none'
                  : 'bg-[#252627] text-gray-200 border border-gray-700 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700 bg-[#1e1e1e]">
        {/* Selected layer context indicator */}
        {selectedLayer && (
          <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-[#7d2ae8]/10 border border-[#7d2ae8]/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#7d2ae8] animate-pulse" />
            <span className="text-[10px] text-[#a855f7] font-bold uppercase tracking-wider truncate">
              Context: {(selectedLayer as any).type} "{(selectedLayer as any).name || (selectedLayer as any).text?.slice(0, 20) || 'Layer'}"
            </span>
          </div>
        )}

        {/* Quick suggestion chips — always visible */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { label: 'Analyze Design', icon: LocalIcons.Eye, color: 'indigo', onClick: handleAnalyze },
            { label: 'Generate Layout', icon: LocalIcons.LayoutGrid, color: 'emerald', onClick: () => setInput('Generate a modern layout for me') },
            { label: 'Color Palette', icon: LocalIcons.Bot, color: 'pink', onClick: () => setInput('Suggest a beautiful color palette for this design') },
            { label: 'Improve Typography', icon: LocalIcons.ArrowUp, color: 'amber', onClick: () => setInput('How can I improve the typography in this design?') },
            { label: 'Make it Viral', icon: LocalIcons.Bot, color: 'rose', onClick: () => setInput('What changes would make this design go viral on social media?') },
            { label: 'Critique', icon: LocalIcons.Eye, color: 'sky', onClick: () => setInput('Give me a brutally honest critique of this design') },
          ].map(({ label, icon: Icon, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-2 py-1.5 bg-${color}-900/20 text-${color}-300 border border-${color}-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-${color}-900/40 transition-all disabled:opacity-40 truncate`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 focus-within:border-[#7d2ae8]/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white focus:outline-none resize-none h-12 custom-scrollbar font-medium"
            disabled={isLoading}
          />
          <div className="flex items-center gap-1 pr-1">
            <button
              onClick={voiceSupported ? toggleListening : undefined}
              className={`p-2 rounded-md transition-colors ${
                !voiceSupported ? 'text-gray-700 cursor-not-allowed' :
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={!voiceSupported ? 'Voice input requires Chrome or Edge' : isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <LocalIcons.MicOff className="w-4 h-4" /> : <LocalIcons.Mic className="w-4 h-4" />}
            </button>
            <Button
              size="icon"
              className="bg-[#7d2ae8] hover:bg-[#6b23c5] border-none"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <LocalIcons.ArrowUp className="w-4 h-4 rotate-90" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AssistantPanel;
