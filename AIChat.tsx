import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, SimulationParams, ComputedValues } from '../../types';
import { generateTutorResponse } from '../../services/geminiService';

interface AIChatProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  computed: ComputedValues;
  isOpen: boolean;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ params, setParams, computed, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm your AI Lab Assistant. Ask me to explain concepts, or tell me to 'make the flow turbulent' and I'll adjust the simulation for you!", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const contextHistory = messages.map(m => ({ role: m.role, text: m.text }));
    
    // Pass context to service
    const response = await generateTutorResponse(userMsg.text, params, computed, contextHistory);
    
    let replyText = response.text;

    // Handle Tool Execution (AI changing parameters)
    if (response.functionCall && response.functionCall.name === 'setSimulationParameters') {
      const newParams = response.functionCall.args as Partial<SimulationParams>;
      
      // Apply updates safely
      setParams(prev => ({
        ...prev,
        ...newParams
      }));

      replyText += `\n\n**⚡ Simulation Updated:** I've adjusted the parameters (${Object.keys(newParams).join(', ')}) to demonstrate this state.`;
    }
    
    setMessages(prev => [...prev, { role: 'model', text: replyText, timestamp: Date.now() }]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-6 right-6 w-96 h-[600px] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
             <Sparkles className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Lab Assistant</h3>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/95 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl p-3 rounded-bl-none border border-slate-700 flex items-center gap-2">
              <Loader className="animate-spin text-indigo-400" size={16} />
              <span className="text-xs text-slate-400">Analyzing Physics...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="E.g., 'Make it turbulent' or 'Explain Ra'"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
