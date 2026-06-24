// ─── Language Detection ───────────────────────────────────────────
export function detectLanguage(text) {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasDevanagari && !hasEnglish) return 'hi';
  if (hasDevanagari && hasEnglish) return 'hinglish';
  return 'en';
}

// ─── Name Extraction ──────────────────────────────────────────────
export function extractName(message) {
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

// ─── Emotion Label ────────────────────────────────────────────────
export function getEmotionLabel(emotionScore) {
  if (!emotionScore) return 'neutral';
  if (emotionScore.frustration >= 7) return 'very_frustrated';
  if (emotionScore.frustration >= 5) return 'frustrated';
  if (emotionScore.confusion >= 5) return 'confused';
  return 'neutral';
}

export function getEmotionColor(emotionScore) {
  const label = getEmotionLabel(emotionScore);
  switch (label) {
    case 'very_frustrated': return 'bg-red-100 text-red-700 border-red-200';
    case 'frustrated': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'confused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-green-100 text-green-700 border-green-200';
  }
}

// ─── Intent Display ───────────────────────────────────────────────
export function getIntentDisplay(intent) {
  const displays = {
    login_account: { label: 'Login / Account', icon: '🔐', color: 'bg-blue-100 text-blue-700' },
    payment_billing: { label: 'Payment / Billing', icon: '💳', color: 'bg-purple-100 text-purple-700' },
    technical_bug: { label: 'Technical Issue', icon: '🐛', color: 'bg-red-100 text-red-700' },
    feature_request: { label: 'Feature Request', icon: '💡', color: 'bg-indigo-100 text-indigo-700' },
    general_inquiry: { label: 'General Inquiry', icon: '❓', color: 'bg-gray-100 text-gray-700' },
    complaint_frustration: { label: 'Complaint', icon: '😤', color: 'bg-red-100 text-red-700' },
    order_status: { label: 'Order Status', icon: '📦', color: 'bg-amber-100 text-amber-700' },
    delivery: { label: 'Delivery', icon: '🚚', color: 'bg-teal-100 text-teal-700' },
    returns_refunds: { label: 'Returns / Refunds', icon: '↩️', color: 'bg-pink-100 text-pink-700' },
    product_inquiry: { label: 'Product Inquiry', icon: '🪑', color: 'bg-emerald-100 text-emerald-700' },
  };
  return displays[intent] || displays.general_inquiry;
}

// ─── LocalStorage Memory ──────────────────────────────────────────
const MEMORY_KEY = 'nfh_helpcenter_memory';
const SESSIONS_KEY = 'nfh_helpcenter_sessions';

export function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const sessions = loadSessions();
  sessions.unshift(session);
  if (sessions.length > 20) sessions.pop();
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessionId() {
  let sid = sessionStorage.getItem('nfh_helpcenter_sid');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('nfh_helpcenter_sid', sid);
  }
  return sid;
}

// ─── Quick Action Config ──────────────────────────────────────────
export const QUICK_ACTIONS = [
  { id: 'login_issue', label: 'Login Issue', labelHi: 'लॉगिन समस्या', labelHinglish: 'Login Problem', icon: '🔐', intent: 'login_account' },
  { id: 'payment_issue', label: 'Payment Issue', labelHi: 'भुगतान समस्या', labelHinglish: 'Payment Problem', icon: '💳', intent: 'payment_billing' },
  { id: 'track_order', label: 'Track Order', labelHi: 'ऑर्डर ट्रैक करें', labelHinglish: 'Order Track Karein', icon: '📦', intent: 'order_status' },
  { id: 'return_request', label: 'Return Request', labelHi: 'रिटर्न अनुरोध', labelHinglish: 'Return Request', icon: '↩️', intent: 'returns_refunds' },
  { id: 'delivery_help', label: 'Delivery Help', labelHi: 'डिलीवरी सहायता', labelHinglish: 'Delivery Help', icon: '🚚', intent: 'delivery' },
  { id: 'product_help', label: 'Product Help', labelHi: 'प्रोडक्ट सहायता', labelHinglish: 'Product Help', icon: '🪑', intent: 'product_inquiry' },
];

export function getQuickActionLabel(action, language) {
  if (language === 'hi') return action.labelHi;
  if (language === 'hinglish') return action.labelHinglish;
  return action.label;
}

// ─── Typing Effect Helper ─────────────────────────────────────────
export function typeText(text, callback, speed = 12) {
  let i = 0;
  let current = '';
  const timer = setInterval(() => {
    current += text.charAt(i);
    callback(current);
    i++;
    if (i >= text.length) clearInterval(timer);
  }, speed);
  return () => clearInterval(timer);
}

// ─── FAQ Data ─────────────────────────────────────────────────────
export const FAQ_DATA = [
  {
    question: 'How do I place an order?',
    questionHi: 'ऑर्डर कैसे दें?',
    questionHinglish: 'Order kaise dein?',
    answer: 'Browse our furniture collection, select your preferred wood type, size, and finish, then add to cart and proceed to checkout. Our team will contact you for final confirmation.',
    answerHi: 'हमारे फर्नीचर कलेक्शन को ब्राउज़ करें, अपनी पसंद का लकड़ी प्रकार, आकार और फिनिश चुनें, फिर कार्ट में जोड़ें और चेकआउट पर जाएं। हमारी टीम अंतिम पुष्टि के लिए आपसे संपर्क करेगी।',
    answerHinglish: 'Hamare furniture collection ko browse karo, apni pasand ka wood type, size aur finish chuno, phir cart mein add karo aur checkout pe jao. Hamari team final confirmation ke liye contact karegi.',
    category: 'orders',
  },
  {
    question: 'What materials do you use?',
    questionHi: 'आप कौन सी सामग्री का उपयोग करते हैं?',
    questionHinglish: 'Aap kaun si material use karte hain?',
    answer: 'We use premium solid woods like Sheesham, Teak, and Mango. All pieces are handcrafted with traditional joinery techniques for durability.',
    answerHi: 'हम शीशम, टीक और आम जैसे प्रीमियम ठोस लकड़ी का उपयोग करते हैं। सभी टुकड़े टिकाऊपन के लिए पारंपरिक जोइनरी तकनीकों से हाथ से बनाए जाते हैं।',
    answerHinglish: 'Hum premium solid woods jaise Sheesham, Teak, aur Mango use karte hain. Sab pieces traditional joinery techniques se handcrafted hain durability ke liye.',
    category: 'products',
  },
  {
    question: 'Can I customize my furniture?',
    questionHi: 'क्या मैं अपने फर्नीचर को कस्टमाइज़ कर सकता हूँ?',
    questionHinglish: 'Kya main apne furniture ko customize kar sakta hoon?',
    answer: 'Yes! You can customize wood type, size, finish (Natural, Honey, Walnut), and upholstery options for most pieces.',
    answerHi: 'हाँ! आप अधिकांश टुकड़ों के लिए लकड़ी का प्रकार, आकार, फिनिश (प्राकृतिक, शहद, अखरोट) और अपहोल्स्टरी विकल्पों को कस्टमाइज़ कर सकते हैं।',
    answerHinglish: 'Haan! Aap wood type, size, finish (Natural, Honey, Walnut), aur upholstery options customize kar sakte hain most pieces ke liye.',
    category: 'products',
  },
  {
    question: 'What is your delivery time?',
    questionHi: 'आपका डिलीवरी समय क्या है?',
    questionHinglish: 'Aapka delivery time kya hai?',
    answer: 'Standard delivery takes 4-6 weeks. Custom pieces may take 6-8 weeks. Rush orders are available for an additional fee.',
    answerHi: 'स्टैंडर्ड डिलीवरी में 4-6 सप्ताह लगते हैं। कस्टम टुकड़ों में 6-8 सप्ताह लग सकते हैं। रश ऑर्डर अतिरिक्त शुल्क पर उपलब्ध हैं।',
    answerHinglish: 'Standard delivery mein 4-6 weeks lagte hain. Custom pieces mein 6-8 weeks lag sakte hain. Rush orders additional fee pe available hain.',
    category: 'delivery',
  },
  {
    question: 'Do you offer assembly service?',
    questionHi: 'क्या आप असेंबली सेवा प्रदान करते हैं?',
    questionHinglish: 'Kya aap assembly service dete hain?',
    answer: 'Yes, professional assembly is included for all furniture purchases. Our experts ensure proper installation.',
    answerHi: 'हाँ, सभी फर्नीचर खरीदारियों के लिए पेशेवर असेंबली शामिल है। हमारे विशेषज्ञ उचित स्थापना सुनिश्चित करते हैं।',
    answerHinglish: 'Haan, professional assembly sab furniture purchases ke saath included hai. Hamare experts proper installation ensure karte hain.',
    category: 'delivery',
  },
  {
    question: 'What is your return policy?',
    questionHi: 'आपकी रिटर्न पॉलिसी क्या है?',
    questionHinglish: 'Aapki return policy kya hai?',
    answer: 'We offer a 30-day return policy for manufacturing defects. Custom orders are final sale.',
    answerHi: 'हम विनिर्माण दोषों के लिए 30-दिन की रिटर्न पॉलिसी प्रदान करते हैं। कस्टम ऑर्डर अंतिम बिक्री हैं।',
    answerHinglish: 'Hum manufacturing defects ke liye 30-day return policy dete hain. Custom orders final sale hain.',
    category: 'returns',
  },
  {
    question: 'How do I track my order?',
    questionHi: 'मैं अपना ऑर्डर कैसे ट्रैक करूँ?',
    questionHinglish: 'Main apna order kaise track karoon?',
    answer: 'Go to "My Orders" in your profile, or use the "Track Order" page with your order ID. You will also receive SMS updates.',
    answerHi: 'अपनी प्रोफाइल में "माई ऑर्डर्स" पर जाएँ, या अपने ऑर्डर आईडी के साथ "ट्रैक ऑर्डर" पेज का उपयोग करें। आपको एसएमएस अपडेट भी मिलेंगे।',
    answerHinglish: 'Profile mein "My Orders" pe jao, ya "Track Order" page use karo apne order ID ke saath. Aapko SMS updates bhi milenge.',
    category: 'orders',
  },
  {
    question: 'What payment methods do you accept?',
    questionHi: 'आप कौन से भुगतान तरीके स्वीकार करते हैं?',
    questionHinglish: 'Aap kaun se payment methods accept karte hain?',
    answer: 'We accept UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery (COD). EMI options are also available.',
    answerHi: 'हम यूपीआई, क्रेडिट/डेबिट कार्ड, नेट बैंकिंग, वॉलेट और कैश ऑन डिलीवरी (सीओडी) स्वीकार करते हैं। ईएमआई विकल्प भी उपलब्ध हैं।',
    answerHinglish: 'Hum UPI, Credit/Debit Cards, Net Banking, Wallets, aur Cash on Delivery (COD) accept karte hain. EMI options bhi available hain.',
    category: 'payment',
  },
];

export function getLocalizedFAQ(faq, language) {
  return {
    question: language === 'hi' ? faq.questionHi : language === 'hinglish' ? faq.questionHinglish : faq.question,
    answer: language === 'hi' ? faq.answerHi : language === 'hinglish' ? faq.answerHinglish : faq.answer,
    category: faq.category,
  };
}

// ─── API Helper ───────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function sendChatMessage({ userId, sessionId, message }) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, sessionId, message }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function createTicket(ticketData) {
  const res = await fetch(`${API_BASE}/chat/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });
  if (!res.ok) {
    let msg = 'Ticket creation failed';
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchTicketStatus(ticketId) {
  const res = await fetch(`${API_BASE}/chat/ticket/${ticketId}`);
  if (!res.ok) {
    let msg = 'Failed to fetch ticket status';
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

