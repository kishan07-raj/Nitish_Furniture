import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AIAvatarAssistant from '../components/AIAvatarAssistant.jsx';
import { FAQ_DATA, getLocalizedFAQ, QUICK_ACTIONS, getQuickActionLabel, loadMemory, fetchTicketStatus } from '../utils/helpCenterUtils.js';


function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [userName, setUserName] = useState(null);

  const [ticketIdInput, setTicketIdInput] = useState('');
  const [ticketStatus, setTicketStatus] = useState(null);
  const [ticketStatusLoading, setTicketStatusLoading] = useState(false);
  const [ticketStatusError, setTicketStatusError] = useState(null);


  useEffect(() => {
    const mem = loadMemory();
    const sid = Object.keys(mem)[0];
    if (sid && mem[sid].name) {
      setUserName(mem[sid].name);
    }
  }, []);

  const filteredFAQs = FAQ_DATA.filter(faq => {
    const localized = getLocalizedFAQ(faq, currentLanguage);
    const q = localized.question.toLowerCase();
    const a = localized.answer.toLowerCase();
    const query = searchQuery.toLowerCase();
    return q.includes(query) || a.includes(query);
  });

  const handleQuickAction = (action) => {
    const event = new CustomEvent('ai-quick-action', { detail: action });
    window.dispatchEvent(event);
  };

  const handleFetchTicket = async (e) => {
    e.preventDefault();
    const tid = (ticketIdInput || '').trim();
    if (!tid) return;

    setTicketStatusError(null);
    setTicketStatusLoading(true);
    setTicketStatus(null);

    try {
      const data = await fetchTicketStatus(tid);
      setTicketStatus(data);
    } catch (err) {
      setTicketStatusError(err?.message || 'Unable to fetch ticket status');
    } finally {
      setTicketStatusLoading(false);
    }
  };

  const navigate = useNavigate();

  const goHome = () => navigate('/');

  return (

    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Breadcrumb / Back */}
      <div className="mb-6">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-800 transition-colors"
        >
          <span aria-hidden>←</span>
          <span>Home</span>
        </button>
      </div>
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'हेल्प सेंटर' : currentLanguage === 'hinglish' ? 'Help Center' : 'Help Center'}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {userName ? `Welcome back, ${userName}! ` : ''}
          {currentLanguage === 'hi' ? 'सामान्य प्रश्नों के उत्तर खोजें या हमारी सपोर्ट टीम से संपर्क करें।' : 'Find answers to common questions or get in touch with our support team.'}
        </p>
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-800 transition-all shadow-sm"
            >
              <span>{action.icon}</span>
              <span>{getQuickActionLabel(action, currentLanguage)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* AI Avatar Assistant */}
      <section className="mb-12 max-w-3xl mx-auto">
        <AIAvatarAssistant />
      </section>

      <div className="mb-8 max-w-3xl mx-auto text-center text-xs text-slate-500 dark:text-slate-400">
        {currentLanguage === 'hi' ? 'AI से टिकट बनाएं या अपना टिकट ID डालकर स्टेटस देखें।' : 'Create a ticket via AI or check status using your ticket ID.'}
      </div>

      {/* FAQ Search */}

      <section className="mb-8">
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentLanguage === 'hi' ? 'FAQs खोजें...' : 'Search FAQs...'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </section>

      {/* FAQs */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-3">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const localized = getLocalizedFAQ(faq, currentLanguage);
              return (
                <details key={index} className="group rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <summary className="cursor-pointer font-medium text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 flex items-center justify-between">
                    <span>{localized.question}</span>
                    <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{localized.answer}</p>
                </details>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                {currentLanguage === 'hi' ? 'कोई परिणाम नहीं मिला। कृपया अपनी खोज बदलें।' : 'No results found. Try a different search.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Ticket Status */}
      <section className="mb-12 rounded-2xl bg-white dark:bg-neutral-800 p-6 md:p-8 border border-slate-200 dark:border-neutral-700 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'टिकट स्टेटस' : 'Check Ticket Status'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {currentLanguage === 'hi' ? 'अपना टिकट ID दर्ज करें' : 'Enter your ticket ID to see the latest status.'}
        </p>

        <form onSubmit={handleFetchTicket} className="flex flex-col sm:flex-row gap-3">
          <input
            value={ticketIdInput}
            onChange={(e) => setTicketIdInput(e.target.value)}
            placeholder={currentLanguage === 'hi' ? 'जैसे:  टीके-123...' : 'e.g. TKT-ABC123'}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={ticketStatusLoading || !ticketIdInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-900 text-white text-sm font-medium hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ticketStatusLoading ? (currentLanguage === 'hi' ? 'लोड हो रहा है...' : 'Loading...') : (currentLanguage === 'hi' ? 'स्टेटस देखें' : 'Get Status')}
          </button>
        </form>

        {ticketStatusError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200">
            {ticketStatusError}
          </div>
        )}

        {ticketStatus && (
          <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-lg shrink-0">✅</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  {currentLanguage === 'hi' ? 'टिकट अपडेट' : 'Ticket Update'}
                </div>
                <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <div><span className="font-medium">Status:</span> {ticketStatus.status}</div>
                  <div><span className="font-medium">Priority:</span> {ticketStatus.priority}</div>
                  <div><span className="font-medium">Created:</span> {ticketStatus.createdAt ? new Date(ticketStatus.createdAt).toLocaleString() : '-'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Return Policy */}
      <section className="mb-12 rounded-2xl bg-slate-50 dark:bg-neutral-800 p-6 md:p-8 border border-slate-200 dark:border-neutral-700">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'रिटर्न पॉलिसी' : 'Return Policy'}
        </h2>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p>
            {currentLanguage === 'hi'
              ? 'हम विनिर्माण दोषों के लिए 30 दिनों के भीतर रिटर्न स्वीकार करते हैं।'
              : 'We accept returns within 30 days for manufacturing defects.'}
          </p>
          <p>
            {currentLanguage === 'hi'
              ? 'कस्टम ऑर्डर अंतिम बिक्री होते हैं और उन्हें रिटर्न नहीं किया जा सकता।'
              : 'Custom orders are final and cannot be returned.'}
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            {currentLanguage === 'hi'
              ? 'रिटर्न शुरू करने के लिए Help Center में Ticket Status / Contact Support का उपयोग करें।'
              : 'To initiate a return, use Ticket Status / Contact Support in the Help Center.'}
          </p>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="mb-12 rounded-2xl bg-slate-50 dark:bg-neutral-800 p-6 md:p-8 border border-slate-200 dark:border-neutral-700">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'शिपिंग जानकारी' : 'Shipping Info'}
        </h2>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p>
            {currentLanguage === 'hi'
              ? 'स्टैंडर्ड डिलीवरी में आमतौर पर 4-6 सप्ताह लगते हैं।'
              : 'Standard delivery typically takes 4-6 weeks.'}
          </p>
          <p>
            {currentLanguage === 'hi'
              ? 'कस्टम पीसेस में 6-8 सप्ताह तक लग सकते हैं।'
              : 'Custom pieces may take up to 6-8 weeks.'}
          </p>
          <p>
            {currentLanguage === 'hi'
              ? 'आप My Orders या Track Order पेज से अपडेट देख सकते हैं।'
              : 'You can track updates from My Orders or the Track Order page.'}
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-12 rounded-2xl bg-slate-50 dark:bg-neutral-800 p-6 md:p-8 border border-slate-200 dark:border-neutral-700">


        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
          {currentLanguage === 'hi' ? 'हमसे संपर्क करें' : 'Contact Us'}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">
              {currentLanguage === 'hi' ? 'ग्राहक सहायता' : 'Customer Support'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Mon-Fri: 9AM - 6PM IST</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">+91 7488806695</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">support@nitishfurniture.com</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">
              {currentLanguage === 'hi' ? 'बिक्री पूछताछ' : 'Sales Inquiries'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Mon-Sat: 10AM - 7PM IST</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">+91 6200694677</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">sales@nitishfurniture.com</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-slate-900 dark:text-white">
              {currentLanguage === 'hi' ? 'शोरूम पता' : 'Showroom Address'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">123 Furniture Street</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Samastipur, Bihar</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">India - 848503</p>
          </div>
        </div>
      </section>

      {/* Additional Support */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 md:p-8 border border-amber-200 dark:border-amber-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
              {currentLanguage === 'hi' ? 'और मदद चाहिए?' : 'Need More Help?'}
            </h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {currentLanguage === 'hi' ? 'हमारी सपोर्ट टीम किसी भी सवाल में आपकी मदद के लिए तैयार है।' : 'Our support team is ready to help with any questions.'}
            </p>
          </div>
          <div className="flex gap-3">
            <a href="tel:+917488806695" className="inline-flex items-center justify-center rounded-full bg-amber-900 px-6 py-2.5 text-sm font-medium text-amber-50 hover:bg-amber-800 transition-colors shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Support
            </a>
            <Link to="/track-order" className="inline-flex items-center justify-center rounded-full border border-amber-900 dark:border-amber-400 px-6 py-2.5 text-sm font-medium text-amber-900 dark:text-amber-400 hover:bg-amber-900 hover:text-amber-50 dark:hover:bg-amber-800 transition-colors">
              Track Order
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HelpCenter;

