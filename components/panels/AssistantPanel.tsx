
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../../constants';
import { Button } from '../Button';
import { ChatMessage, TextLayer, ShapeLayer } from '../../types';
import * as geminiService from '../../services/geminiService';

interface AssistantPanelProps {
  getCanvasSnapshot: () => Promise<string>;
  onAddText: (style: Partial<TextLayer>) => void;
  onAddShape: (type: any, style: Partial<ShapeLayer>) => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ 
  getCanvasSnapshot,
  onAddText,
  onAddShape
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'assistant', 
      content: "Hi! I'm your design partner. I can critique your work, suggest layouts, or answer design questions.",
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
          setInput(prev => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech Recognition Error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
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
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Basic chat for now, but could be enhanced with context
      // For this demo, we check if the user asked for a layout
      if (input.toLowerCase().includes('layout') || input.toLowerCase().includes('generate')) {
         const layoutData = await geminiService.generateLayout(input);
         if (layoutData) {
            if (layoutData.textLayers) {
                layoutData.textLayers.forEach((l: any) => onAddText(l));
            }
            if (layoutData.shapeLayers) {
                layoutData.shapeLayers.forEach((l: any) => onAddShape(l.type, l));
            }
            const aiMsg: ChatMessage = {
              id: Date.now().toString() + '_ai',
              role: 'assistant',
              content: "I've added a layout suggestion to your canvas based on your description!",
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
         } else {
            throw new Error("Failed to generate layout");
         }
      } else {
         // Fallback to text chat if no specific command detected or just general chat
         // We reuse generateText for simple response for now or call a new chat endpoint
         // Using analyzeDesign logic but without image if not analyzing
         // For simplicity, let's just use generateText with a system prompt context
         const response = await geminiService.generateText(input, "You are a helpful graphic design assistant. Keep answers concise and helpful.");
         const aiMsg: ChatMessage = {
            id: Date.now().toString() + '_ai',
            role: 'assistant',
            content: response,
            timestamp: Date.now()
         };
         setMessages(prev => [...prev, aiMsg]);
      }
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: "Sorry, I encountered an error processing that request.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    const loadingMsg: ChatMessage = {
        id: 'analyzing',
        role: 'assistant',
        content: "Looking at your design...",
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
        const snapshot = await getCanvasSnapshot();
        const analysis = await geminiService.analyzeDesign(snapshot, "Critique this design. Focus on composition, color balance, and typography. Be constructive.");
        
        setMessages(prev => prev.filter(m => m.id !== 'analyzing').concat({
            id: Date.now().toString(),
            role: 'assistant',
            content: analysis,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error(e);
        setMessages(prev => prev.filter(m => m.id !== 'analyzing').concat({
            id: Date.now().toString(),
            role: 'assistant',
            content: "I couldn't analyze the canvas right now.",
            timestamp: Date.now()
        }));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      <div className="p-4 border-b border-gray-700 bg-[#1e1e1e]">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icons.Bot className="w-5 h-5 text-[#7d2ae8]" />
          Design Assistant
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
         {messages.length < 3 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
               <button 
                 onClick={handleAnalyze} 
                 disabled={isLoading}
                 className="whitespace-nowrap px-3 py-1.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-medium hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5"
               >
                 <Icons.Eye className="w-3 h-3" /> Analyze Design
               </button>
               <button 
                 onClick={() => setInput("Generate a layout for a modern coffee shop menu")} 
                 disabled={isLoading}
                 className="whitespace-nowrap px-3 py-1.5 bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
               >
                 <Icons.LayoutGrid className="w-3 h-3" /> Generate Layout
               </button>
            </div>
         )}
         
         <div className="flex gap-2 bg-[#0e1318] border border-gray-700 rounded-lg p-1">
            <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
               placeholder="Ask for advice or generate layouts..."
               className="flex-1 bg-transparent border-none px-2 py-1 text-sm text-white focus:outline-none resize-none h-10 custom-scrollbar"
               disabled={isLoading}
            />
            <div className="flex items-center gap-1 pr-1">
               <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-md transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  title={isListening ? "Stop listening" : "Start voice input"}
               >
                  {isListening ? <Icons.MicOff className="w-4 h-4" /> : <Icons.Mic className="w-4 h-4" />}
               </button>
               <Button 
                  size="icon" 
                  className="bg-[#7d2ae8] hover:bg-[#6b23c5] border-none"
                  onClick={handleSendMessage} 
                  disabled={isLoading || !input.trim()}
               >
                  {isLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Icons.ArrowUp className="w-4 h-4 rotate-90" />}
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
};
