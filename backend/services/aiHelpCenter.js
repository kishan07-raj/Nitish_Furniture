const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Intent Detection ─────────────────────────────────────────────
const INTENT_TYPES = {
  LOGIN_ACCOUNT: 'login_account',
  PAYMENT_BILLING: 'payment_billing',
  TECHNICAL_BUG: 'technical_bug',
  FEATURE_REQUEST: 'feature_request',
  GENERAL_INQUIRY: 'general_inquiry',
  COMPLAINT_FRUSTRATION: 'complaint_frustration',
  ORDER_STATUS: 'order_status',
  DELIVERY: 'delivery',
  RETURNS_REFUNDS: 'returns_refunds',
  PRODUCT_INQUIRY: 'product_inquiry',
};

const INTENT_KEYWORDS = {
  [INTENT_TYPES.LOGIN_ACCOUNT]: ['login', 'signin', 'password', 'account', 'register', 'signup', 'forgot', 'credentials', 'locked', 'auth', 'sign in', 'log in', ' unable to login', 'login nahi ho raha'],
  [INTENT_TYPES.PAYMENT_BILLING]: ['payment', 'pay', 'card', 'upi', 'billing', 'invoice', 'charge', 'refund', 'money', 'transaction', 'failed payment', 'payment failed', 'discount', 'coupon', 'price', 'cash', 'emi'],
  [INTENT_TYPES.TECHNICAL_BUG]: ['bug', 'error', 'crash', 'not working', 'broken', 'glitch', 'slow', 'loading', 'white screen', '404', '500', 'site down', 'feature not working', 'button not working', 'page crash'],
  [INTENT_TYPES.FEATURE_REQUEST]: ['feature', 'suggestion', 'add', 'improve', 'wish', 'would be nice', 'can you add', 'please add', 'suggest'],
  [INTENT_TYPES.GENERAL_INQUIRY]: ['what is', 'how to', 'where', 'when', 'who', 'why', 'tell me about', 'information', 'details', 'help'],
  [INTENT_TYPES.COMPLAINT_FRUSTRATION]: ['worst', 'terrible', 'bad', 'hate', 'frustrated', 'angry', 'disappointed', 'pathetic', 'useless', 'stupid', 'fraud', 'cheat', 'scam', 'ghatiya', 'bekar', 'bakwaas'],
  [INTENT_TYPES.ORDER_STATUS]: ['order status', 'track order', 'where is my order', 'order ka status', 'order kahan hai', 'order number', 'my order', 'order id'],
  [INTENT_TYPES.DELIVERY]: ['delivery', 'shipping', 'dispatch', 'courier', 'delivered', 'not delivered', 'late delivery', 'delivery time', 'shipping address', 'delivery charge'],
  [INTENT_TYPES.RETURNS_REFUNDS]: ['return', 'exchange', 'replace', 'damaged', 'defective', 'wrong product', 'refund', 'money back', 'wapsi', 'swap', 'exchange policy'],
  [INTENT_TYPES.PRODUCT_INQUIRY]: ['product', 'furniture', 'sofa', 'bed', 'table', 'chair', 'wood', 'material', 'dimension', 'color', 'customize', 'customisation', 'finish', 'upholstery'],
};

function detectIntent(message) {
  const lower = message.toLowerCase();
  const scores = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : INTENT_TYPES.GENERAL_INQUIRY;
}

// ─── Emotional Intelligence ───────────────────────────────────────
function detectEmotion(message) {
  const lower = message.toLowerCase();
  let frustrationScore = 0;
  let confusionScore = 0;

  // Frustration indicators
  const frustrationWords = ['hate', 'angry', 'mad', 'furious', 'irritated', 'annoyed', 'worst', 'terrible', 'pathetic', 'useless', 'stupid', 'fraud', 'cheat', 'scam', 'disgusting', 'never again', 'ghatiya', 'bekar', 'bakwaas', 'paisa barbaad', 'time waste', 'bahut gussa', 'tang aa gaya', 'pareshan', 'irritate'];
  const capsRatio = (message.match(/[A-Z]/g) || []).length / (message.length || 1);
  const repeated = /(.+)\1{2,}/g.test(message); // e.g., "aaaaa"
  const excessiveMarks = (message.match(/[!?]/g) || []).length > 2;

  frustrationWords.forEach(w => { if (lower.includes(w)) frustrationScore += 2; });
  if (capsRatio > 0.5) frustrationScore += 2;
  if (repeated) frustrationScore += 2;
  if (excessiveMarks) frustrationScore += 1;

  // Confusion indicators
  const confusionWords = ['confused', 'don\'t understand', 'samajh nahi', 'kya karu', 'kya hai ye', 'what is this', 'how to', 'where', 'doubt', 'question', '?', '???', 'kya'];
  confusionWords.forEach(w => { if (lower.includes(w)) confusionScore += 1.5; });
  const questionCount = (message.match(/\?/g) || []).length;
  confusionScore += questionCount * 0.5;

  return {
    frustrationScore: Math.min(frustrationScore, 10),
    confusionScore: Math.min(confusionScore, 10),
    isFrustrated: frustrationScore >= 5,
    isConfused: confusionScore >= 5,
    emotion: frustrationScore >= 5 ? 'frustrated' : confusionScore >= 5 ? 'confused' : 'neutral',
  };
}

// ─── Language Detection ───────────────────────────────────────────
function detectLanguage(text) {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasDevanagari && !hasEnglish) return 'hi';
  if (hasDevanagari && hasEnglish) return 'hinglish';
  return 'en';
}

// ─── Memory Management ────────────────────────────────────────────
function buildMemory(userId, sessionId, memoryStore) {
  const key = `${userId || 'anon'}_${sessionId}`;
  return memoryStore[key] || { name: null, issues: [], preferences: { language: 'en', tone: 'casual' } };
}

function updateMemory(userId, sessionId, memoryStore, updates) {
  const key = `${userId || 'anon'}_${sessionId}`;
  if (!memoryStore[key]) memoryStore[key] = { name: null, issues: [], preferences: { language: 'en', tone: 'casual' } };
  Object.assign(memoryStore[key], updates);
  return memoryStore[key];
}

function extractName(message) {
  const patterns = [
    /(?:my name is|i am|this is|call me)\s+([A-Za-z\s]+)/i,
    /(?:mera naam|main hoon|naam hai)\s+([A-Za-z\s\u0900-\u097F]+)/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m) return m[1].trim().split(' ')[0];
  }
  return null;
}

// ─── Smart Suggestions ────────────────────────────────────────────
function getSuggestions(intent, emotion, step, language) {
  const suggestions = {
    [INTENT_TYPES.LOGIN_ACCOUNT]: ['Reset Password', 'Clear Cache', 'Check Email', 'Contact Support'],
    [INTENT_TYPES.PAYMENT_BILLING]: ['Check Payment Status', 'Retry Payment', 'Use Different Card', 'UPI Options'],
    [INTENT_TYPES.ORDER_STATUS]: ['Track Order', 'Order History', 'Contact Delivery', 'Cancel Order'],
    [INTENT_TYPES.DELIVERY]: ['Delivery Estimate', 'Change Address', 'Reschedule Delivery', 'Contact Courier'],
    [INTENT_TYPES.RETURNS_REFUNDS]: ['Initiate Return', 'Refund Policy', 'Check Refund Status', 'Exchange Product'],
    [INTENT_TYPES.PRODUCT_INQUIRY]: ['Browse Products', 'Customization Options', 'Compare Products', 'Size Guide'],
    [INTENT_TYPES.TECHNICAL_BUG]: ['Clear Cache', 'Try Incognito', 'Screenshot Help', 'Report Bug'],
    [INTENT_TYPES.COMPLAINT_FRUSTRATION]: ['Speak to Human', 'File Complaint', 'Request Callback', 'Escalate Ticket'],
  };

  const base = suggestions[intent] || ['Browse Help Center', 'Contact Support', 'Search Products', 'View Orders'];
  if (emotion.isFrustrated) base.unshift('Speak to Human');
  return base;
}

function getLocalizedSuggestions(suggestions, language) {
  const translations = {
    hi: {
      'Reset Password': 'पासवर्ड रीसेट',
      'Clear Cache': 'कैश साफ़ करें',
      'Check Email': 'ईमेल चेक करें',
      'Contact Support': 'सपोर्ट से संपर्क करें',
      'Track Order': 'ऑर्डर ट्रैक करें',
      'Order History': 'ऑर्डर हिस्ट्री',
      'Delivery Estimate': 'डिलीवरी अनुमान',
      'Initiate Return': 'रिटर्न शुरू करें',
      'Refund Policy': 'रिफंड पॉलिसी',
      'Browse Products': 'प्रोडक्ट्स देखें',
      'Speak to Human': 'इंसान से बात करें',
      'File Complaint': 'शिकायत दर्ज करें',
      'Request Callback': 'कॉलबैक मांगें',
      'Escalate Ticket': 'टिकट एस्केलेट करें',
    },
    hinglish: {
      'Reset Password': 'Password Reset',
      'Clear Cache': 'Cache Saaf Karein',
      'Check Email': 'Email Check Karein',
      'Contact Support': 'Support Se Baat Karein',
      'Track Order': 'Order Track Karein',
      'Delivery Estimate': 'Delivery Estimate',
      'Initiate Return': 'Return Shuru Karein',
      'Refund Policy': 'Refund Policy',
      'Browse Products': 'Products Dekhein',
      'Speak to Human': 'Human Se Baat Karein',
      'File Complaint': 'Complaint File Karein',
      'Request Callback': 'Callback Maangein',
      'Escalate Ticket': 'Ticket Upar Bhejein',
    },
  };

  const t = translations[language] || {};
  return suggestions.map(s => t[s] || s);
}

// ─── Escalation Logic ─────────────────────────────────────────────
function shouldEscalate(emotion, sessionMeta) {
  const attemptCount = sessionMeta.failedAttempts || 0;
  const escalationCount = sessionMeta.escalationTriggered || 0;

  if (emotion.isFrustrated && emotion.frustrationScore >= 7) return true;
  if (attemptCount >= 2) return true;
  if (escalationCount > 0) return true;
  return false;
}

// ─── System Prompt Builder ────────────────────────────────────────
function buildSystemPrompt(intent, emotion, memory, language, step, sessionMeta) {
  const name = memory.name || 'there';
  const isReturning = memory.issues.length > 0;
  const pastIssue = isReturning ? memory.issues[memory.issues.length - 1] : null;

  let toneInstruction = 'friendly, warm, and helpful';
  if (emotion.isFrustrated) toneInstruction = 'deeply empathetic, calm, patient, and reassuring. Acknowledge their frustration directly';
  else if (emotion.isConfused) toneInstruction = 'simple, clear, step-by-step, and reassuring. Avoid jargon';

  let languageInstruction = 'English';
  if (language === 'hi') languageInstruction = 'Hindi (Devanagari script)';
  else if (language === 'hinglish') languageInstruction = 'Hinglish (Roman script Hindi mixed with English, casual Indian conversational style)';

  const basePrompt = `You are Nitish Furniture Help Center Virtual Support Assistant, an intelligent AI support agent for Nitish Furniture House.
Your brand identity: "Nitish Furniture Help Center Virtual Support Assistant" — an AI assistant for furniture shopping, orders, delivery, and support.
If asked who you are, say: "${language === 'hi' ? 'मैं नितिश फर्नीचर हेल्प सेंटर वर्चुअल सपोर्ट असिस्टेंट हूँ।' : language === 'hinglish' ? 'Main Nitish Furniture Help Center ka Virtual Support Assistant hoon.' : "I'm the Nitish Furniture Help Center Virtual Support Assistant."}"

Language: Always reply in ${languageInstruction}. Never switch languages mid-conversation.
Tone: ${toneInstruction}.


Context:
- Intent detected: ${intent}
- User emotion: ${emotion.emotion} (frustration: ${emotion.frustrationScore}/10, confusion: ${emotion.confusionScore}/10)
- User name: ${name}
- Returning user: ${isReturning}${pastIssue ? ` (previously: ${pastIssue})` : ''}
- Step: ${step || 1}
- Failed attempts this session: ${sessionMeta.failedAttempts || 0}

Rules:
1. Keep answers clear and actionable. Prefer short step lists over paragraphs.
2. For complaints/frustration: start with empathy, then offer concrete solutions.
3. For login issues: suggest password reset → clear cache → check email → contact support.
4. For payment issues: suggest checking card details → retry → try UPI → contact bank.
5. For delivery: share estimate → offer tracking → suggest reschedule.
6. For returns: explain policy → guide to initiate return → mention timeline.
7. For technical bugs: ask for screenshot → suggest incognito → clear cache → report.
8. If you don't know something, say so — never make up info.
9. If escalation needed, say: "I think isko human support better handle karega. Kya main ticket create kar doon?" (or equivalent in detected language).
10. End with a helpful follow-up question when possible.`;

  return basePrompt;
}

// ─── Main Process Function ────────────────────────────────────────
async function processMessage({ userId, sessionId, message, memoryStore = {}, sessionMeta = {} }) {
  const language = detectLanguage(message);
  const intent = detectIntent(message);
  const emotion = detectEmotion(message);
  const memory = buildMemory(userId, sessionId, memoryStore);

  // Update memory
  const name = extractName(message);
  if (name) memory.name = name;
  memory.preferences.language = language;
  if (!memory.issues.includes(intent)) memory.issues.push(intent);
  updateMemory(userId, sessionId, memoryStore, memory);

  // Step tracking
  const stepKey = `${sessionId}_step_${intent}`;
  const currentStep = (sessionMeta[stepKey] || 0) + 1;
  sessionMeta[stepKey] = currentStep;

  // Escalation check
  const escalated = shouldEscalate(emotion, sessionMeta);
  if (escalated) sessionMeta.escalationTriggered = (sessionMeta.escalationTriggered || 0) + 1;

  // Suggestions
  let suggestions = getSuggestions(intent, emotion, currentStep, language);
  suggestions = getLocalizedSuggestions(suggestions, language);

  // Build prompt & call LLM
  const systemPrompt = buildSystemPrompt(intent, emotion, memory, language, currentStep, sessionMeta);

  let reply;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });
    reply = completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    // Fallback responses
    const fallbacks = {
      en: `Sorry ${name}, I'm having trouble connecting right now. Please try again in a moment or contact our support team at +91 7488806695.`,
      hi: `क्षमा करें ${name}, अभी कनेक्ट करने में समस्या हो रही है। कृपया कुछ देर बाद प्रयास करें या हमारी सपोर्ट टीम से +91 7488806695 पर संपर्क करें।`,
      hinglish: `Sorry ${name}, abhi connect karne mein problem aa rahi hai. Please thodi der baad try karo ya hamari support team se +91 7488806695 pe contact karo.`,
    };
    reply = fallbacks[language] || fallbacks.en;
  }

  return {
    reply,
    intent,
    suggestions,
    escalated,
    emotionScore: emotion,
    step: currentStep,
    language,
    memory,
  };
}

module.exports = {
  processMessage,
  detectIntent,
  detectEmotion,
  detectLanguage,
  buildMemory,
  updateMemory,
  extractName,
  getSuggestions,
  shouldEscalate,
  INTENT_TYPES,
};

