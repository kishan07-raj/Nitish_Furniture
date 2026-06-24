import { useState, useEffect, useRef, useCallback } from 'react';
import {
  detectLanguage,
  getIntentDisplay,
  getEmotionColor,
  getEmotionLabel,
  loadMemory,
  saveMemory,
  getSessionId,
  sendChatMessage,
  createTicket,
} from '../utils/helpCenterUtils.js';

const AIAvatarAssistant = ({ embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentIntent, setCurrentIntent] = useState(undefined);

  const [emotionScore, setEmotionScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [escalated, setEscalated] = useState(false);
  const [step, setStep] = useState(0);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketData, setTicketData] = useState({ name: '', email: '', phone: '', description: '' });
  const [ticketInfo, setTicketInfo] = useState(null);
  const [avatarMood, setAvatarMood] = useState('neutral');

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(getSessionId());

  const greetings = {
    en: 'Welcome to Nitish Furniture Help Center. How can we assist you today?',
    hi: 'नितिश फर्नीचर हेल्प सेंटर में आपका स्वागत है। आज हम आपकी कैसे मदद कर सकते हैं?',
    hinglish: 'Nitish Furniture Help Center mein aapka swagat hai. Aaj hum aapki kaise help kar sakte hain?',
  };

  useEffect(() => {
    const mem = loadMemory();
    const sid = sessionIdRef.current;
    const userMem = mem[sid] || { name: null, issues: [], preferences: { language: 'en' } };
    const lang = userMem.preferences?.language || 'en';
    setCurrentLanguage(lang);
    setMessages([{ type: 'ai', text: greetings[lang] || greetings.en }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type, text, meta = {}) => {
    setMessages(prev => [...prev, { type, text, timestamp: Date.now(), ...meta }]);
  };

  const processUserInput = useCallback(async (userText) => {
    if (!userText.trim()) return;

    // Avoid pushing empty/placeholder content
    const cleanText = (userText || '').toString().trim();
    if (!cleanText || cleanText.toLowerCase() === 'null') return;

    addMessage('user', cleanText);
    setInput('');
    setIsThinking(true);
    setSuggestions([]);
    setEscalated(false);

    const detectedLang = detectLanguage(cleanText);
    setCurrentLanguage(detectedLang);

    const connectivityFallback = {
      en: "We’re experiencing connectivity issues. Please try again later or contact support at +91 7488806695.",
      hi: 'हम कनेक्टिविटी समस्या का सामना कर रहे हैं। कृपया बाद में पुनः प्रयास करें या +91 7488806695 पर सपोर्ट से संपर्क करें।',
      hinglish: 'Hum connectivity issue face kar rahe hain. Please thodi der baad try karo ya +91 7488806695 par support se contact karo.'
    };

    const attemptRequest = async () => {
      return sendChatMessage({
        sessionId: sessionIdRef.current,
        message: cleanText,
      });
    };

    try {
      let result;
      // Lightweight retry with a short delay
      try {
        // Try first
        result = await attemptRequest();
      } catch (err1) {
        await new Promise(r => setTimeout(r, 700));
        result = await attemptRequest();
      }


      setIsThinking(false);
      const safeReply = typeof result?.reply === 'string'
        ? result.reply.trim()
        : (connectivityFallback[detectedLang] || connectivityFallback.en);

      // Do not render literal "null" from backend/LLM
      const finalReply = safeReply && safeReply.toLowerCase() !== 'null'
        ? safeReply
        : (connectivityFallback[detectedLang] || connectivityFallback.en);


      setCurrentIntent(result?.intent || null);
      setEmotionScore(result?.emotionScore || null);
      setSuggestions(Array.isArray(result?.suggestions) ? result.suggestions : []);
      setStep(result?.step || 0);
      setEscalated(!!result?.escalated);


      const mem = loadMemory();
      const sid = sessionIdRef.current;
      if (!mem[sid]) mem[sid] = { name: null, issues: [], preferences: {} };
      mem[sid].preferences.language = detectedLang;
      const nameMatch = userText.match(/(?:my name is|i am|mera naam|main hoon)\s+([A-Za-z]+)/i);
      if (nameMatch) mem[sid].name = nameMatch[1];
      if (!mem[sid].issues.includes(result.intent)) mem[sid].issues.push(result.intent);
      saveMemory(mem);

      if (result.emotionScore?.frustration >= 7) setAvatarMood('concerned');
      else if (result.emotionScore?.frustration >= 5) setAvatarMood('worried');
      else if (result.emotionScore?.confusion >= 5) setAvatarMood('confused');
      else setAvatarMood('happy');

      if (result.emotionScore?.isFrustrated && result.emotionScore.frustration >= 6) {
        const empathy = {
          en: "I completely understand your frustration. Let's work together to fix this.",
          hi: 'Main aapki nirasha ko poori tarah samajhta hoon. Chalo milkar ise theek karte hain.',
          hinglish: 'Main aapki frustration ko poori tarah samajhta hoon. Chalo milke isse fix karte hain.',
        }[detectedLang];
        addMessage('empathy', empathy);
      }

      addMessage('ai', finalReply);


      if (result.escalated) {
        setTimeout(() => setShowTicketForm(true), 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsThinking(false);
      const fallback = {
        en: "We’re experiencing connectivity issues. Please try again later or contact support at +91 7488806695.",
        hi: 'हम कनेक्टिविटी समस्या का सामना कर रहे हैं। कृपया बाद में पुनः प्रयास करें या +91 7488806695 पर सपोर्ट से संपर्क करें।',
        hinglish: 'Hum connectivity issue face kar rahe hain. Please thodi der baad try karo ya +91 7488806695 par support se contact karo.',
      }[detectedLang] || fallback.en;
      addMessage('ai', fallback);

    }
  }, []);

  const handleSend = () => processUserInput(input);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event) => {
      setIsListening(false);
      processUserInput(event.results[0][0].transcript);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const stopListening = () => recognitionRef.current?.stop();

  const handleSuggestionClick = (suggestion) => {
    const map = {
      'Reset Password': 'I want to reset my password',
      'Track Order': 'Where is my order?',
      'Speak to Human': 'I want to speak to a human',
      'Contact Support': 'I need to contact support',
    };
    processUserInput(map[suggestion] || suggestion);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketData.name || !ticketData.email || !ticketData.description) return;
    try {
      const history = messages.map(m => ({ role: m.type, text: m.text }));
      const res = await createTicket({
        name: ticketData.name,
        email: ticketData.email,
        phone: ticketData.phone,
        intent: currentIntent || 'general_inquiry',
        subject: `Escalation: ${currentIntent || 'general_inquiry'}`,
        description: ticketData.description,
        conversationHistory: history,
        emotionScore: emotionScore || { frustration: 0, confusion: 0 },
      });
      setTicketInfo(res);
      setShowTicketForm(false);
      const confirmMsg = `Ticket #${res.ticketNumber} created. Our team will contact you shortly.`;
      addMessage('ai', confirmMsg, { isTicket: true });
    } catch (error) {
      addMessage('ai', 'Failed to create ticket.');
    }
  };

  const clearChat = () => {
    setMessages([{ type: 'ai', text: greetings[currentLanguage] || greetings.en }]);
    setCurrentIntent(null);
    setEmotionScore(null);
    setSuggestions([]);
    setEscalated(false);
    setShowTicketForm(false);
    setTicketInfo(null);
  };

  const getAvatarGradient = () => {
    switch (avatarMood) {
      case 'happy': return 'from-emerald-400 to-emerald-600';
      case 'listening': return 'from-amber-400 to-amber-600';
      case 'thinking': return 'from-blue-400 to-blue-600';
      case 'concerned': return 'from-red-400 to-red-600';
      case 'worried': return 'from-orange-400 to-orange-600';
      case 'confused': return 'from-yellow-400 to-yellow-600';
      default: return 'from-yellow-400 to-yellow-600';
    }
  };

  const getStatusText = () => {
    if (isListening) return currentLanguage === 'hi' ? 'Sunn raha hoon...' : 'Listening...';
    if (isThinking) return currentLanguage === 'hi' ? 'Soch raha hoon...' : 'Thinking...';
    return currentLanguage === 'hi' ? 'Madad ke liye taiyaar' : 'Ready to help';
  };

  // ─── Render helpers ─────────────────────────────────────────────
  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-900 to-amber-700 text-white shrink-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center shadow-lg ${isListening || isThinking ? 'animate-pulse' : 'animate-bounce'}`}>
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <h3 className="font-semibold text-sm">Nitish Furniture Help Center</h3>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-ping' : isThinking ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-xs opacity-80">{getStatusText()}</span>
          </div>
        </div>
      </div>
      <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Clear Chat">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  const renderIntentBar = () => {
    if (!currentIntent) return null;
    return (
      <div className="px-4 py-2 bg-slate-50 dark:bg-neutral-750 border-b border-slate-100 dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getIntentDisplay(currentIntent).color}`}>
            {getIntentDisplay(currentIntent).icon} {getIntentDisplay(currentIntent).label}
          </span>
          {emotionScore && getEmotionLabel(emotionScore) !== 'neutral' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getEmotionColor(emotionScore)}`}>
              {emotionScore.frustration >= 5 ? '😤' : '😕'} {getEmotionLabel(emotionScore).replace('_', ' ')}
            </span>
          )}
          {step > 0 && !escalated && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">Step {step}</span>
          )}
        </div>
      </div>
    );
  };

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-neutral-900 min-h-0">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
            {msg.type === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs mb-1 shadow-sm">🤖</div>
            )}
            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.type === 'user' ? 'bg-amber-900 text-white rounded-br-md' :
              msg.type === 'empathy' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-bl-md' :
              'bg-white dark:bg-neutral-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-neutral-700 rounded-bl-md shadow-sm'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {suggestions.length > 0 && !isThinking && !escalated && (
        <div className="flex flex-wrap gap-2 pt-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {escalated && !showTicketForm && !ticketInfo && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center text-lg shrink-0">😔</div>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {currentLanguage === 'hi' ? 'Mujhe lagta hai ki isko human support better handle kar sakta hai.' : 'I think this is better handled by human support.'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                {currentLanguage === 'hi' ? 'Kya main aapke liye ticket bana doon?' : 'Shall I create a ticket for you?'}
              </p>
              <button
                onClick={() => setShowTicketForm(true)}
                className="mt-2 px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                {currentLanguage === 'hi' ? 'Ticket Banayein' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTicketForm && (
        <div className="rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            {currentLanguage === 'hi' ? 'Support Ticket Banayein' : 'Create Support Ticket'}
          </h4>
          <form onSubmit={handleTicketSubmit} className="space-y-2.5">
            <input
              type="text"
              placeholder="Name"
              value={ticketData.name}
              onChange={e => setTicketData(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={ticketData.email}
              onChange={e => setTicketData(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={ticketData.phone}
              onChange={e => setTicketData(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <textarea
              placeholder="Describe your issue..."
              value={ticketData.description}
              onChange={e => setTicketData(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-amber-900 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors">
                Submit
              </button>
              <button type="button" onClick={() => setShowTicketForm(false)} className="px-4 py-2 bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {ticketInfo && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-lg shrink-0">✅</div>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Ticket #{ticketInfo.ticketNumber} created!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">{ticketInfo.message}</p>
            </div>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );

  const renderInput = () => (
    <div className="px-4 py-3 bg-white dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-700 shrink-0">
      <div className="flex gap-2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-600'}`}
          title={isListening ? 'Stop' : 'Voice'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentLanguage === 'hi' ? 'Sandesh likhein...' : 'Type your message...'}
          className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="shrink-0 w-10 h-10 rounded-full bg-amber-900 text-white flex items-center justify-center hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col ${embedded ? '' : 'h-[600px]'} rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xl overflow-hidden`}>
      {renderHeader()}
      {renderIntentBar()}
      {renderMessages()}
      {renderInput()}
    </div>
  );
};

export default AIAvatarAssistant;

