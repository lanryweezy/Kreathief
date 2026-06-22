import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Icons } from '../constants';
import { DesignSuggestion } from '../types';
import { Button } from './Button';

interface AIDesignAssistantProps {
  className?: string;
}

export const AIDesignAssistant: React.FC<AIDesignAssistantProps> = ({ className = '' }) => {
  const {
    isActive,
    isAnalyzing,
    currentCritique,
    conversationHistory,
    autoSuggest,
    position,
    isMinimized,
    toggleAssistant,
    minimizeAssistant,
    moveAssistant,
    analyzeCurrentDesign,
    sendMessage,
    clearConversation,
    dismissSuggestion,
    setAutoSuggest,
  } = useStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions'>('chat');

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 500, e.clientY - dragOffset.y));

      moveAssistant(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, moveAssistant]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAnalyzing) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Icons.AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <Icons.AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Icons.Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-400 bg-red-50/10';
      case 'improvement':
        return 'border-l-blue-400 bg-blue-50/10';
      case 'accessibility':
        return 'border-l-green-400 bg-green-50/10';
      default:
        return 'border-l-purple-400 bg-purple-50/10';
    }
  };

  if (!isActive) {
    return (
      <motion.button
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Icons.MessageSquare className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </motion.button>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`fixed z-50 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 300 : 400,
        height: isMinimized ? 60 : 500,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-700 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Icons.Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Design Assistant</h3>
            {currentCritique && !isMinimized && (
              <p className="text-xs text-purple-100">Score: {currentCritique.overallScore}/100</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={minimizeAssistant} className="p-1 hover:bg-white/20 rounded text-white transition-colors">
            <Icons.Minus className="w-4 h-4" />
          </button>
          <button onClick={toggleAssistant} className="p-1 hover:bg-white/20 rounded text-white transition-colors">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="flex flex-col h-[436px]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 436, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-50/5'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icons.MessageSquare className="w-4 h-4 inline-block mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'suggestions'
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-50/5'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icons.Lightbulb className="w-4 h-4 inline-block mr-2" />
                Suggestions
                {currentCritique?.suggestions && currentCritique.suggestions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {currentCritique.suggestions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex flex-col flex-1">
                {/* Controls */}
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <Button
                    onClick={analyzeCurrentDesign}
                    disabled={isAnalyzing}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Icons.Loader className="w-3 h-3 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Icons.Eye className="w-3 h-3 mr-2" />
                        Analyze Design
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={autoSuggest}
                        onChange={(e) => setAutoSuggest(e.target.checked)}
                        className="rounded"
                      />
                      Auto-suggest
                    </label>
                    <button
                      onClick={clearConversation}
                      className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
                      title="Clear conversation"
                    >
                      <Icons.Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {conversationHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Icons.MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-2">Hi! I'm your AI design assistant.</p>
                      <p className="text-xs">
                        Ask me anything about your design or click "Analyze Design" to get started.
                      </p>
                    </div>
                  ) : (
                    conversationHistory.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your design..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      disabled={isAnalyzing}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isAnalyzing}
                      className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
                    >
                      <Icons.Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="flex flex-col flex-1">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {!currentCritique ? (
                    <div className="text-center text-gray-400 py-8">
                      <Icons.Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-2">No analysis yet</p>
                      <p className="text-xs">Run an analysis to see suggestions for improving your design.</p>
                    </div>
                  ) : currentCritique.suggestions.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Icons.CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                      <p className="text-sm mb-2">Looking great!</p>
                      <p className="text-xs">No suggestions at this time.</p>
                    </div>
                  ) : (
                    currentCritique.suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onDismiss={() => dismissSuggestion(suggestion.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface SuggestionCardProps {
  suggestion: DesignSuggestion;
  onDismiss: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onDismiss }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Icons.AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <Icons.AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Icons.Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-red-400 bg-red-50/5';
      case 'improvement':
        return 'border-l-blue-400 bg-blue-50/5';
      case 'accessibility':
        return 'border-l-green-400 bg-green-50/5';
      default:
        return 'border-l-purple-400 bg-purple-50/5';
    }
  };

  return (
    <motion.div
      className={`border-l-4 p-3 rounded-r bg-gray-800/50 ${getSuggestionTypeColor(suggestion.type)}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {getSeverityIcon(suggestion.severity)}
            <h4 className="font-medium text-white text-sm">{suggestion.title}</h4>
            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">{suggestion.category}</span>
          </div>
          <p className="text-sm text-gray-300">{suggestion.message}</p>

          {suggestion.autoFix && (
            <button className="mt-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors">
              Auto-fix
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300 flex-shrink-0"
        >
          <Icons.X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};
