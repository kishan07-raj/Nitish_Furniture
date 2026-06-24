import React from 'react';
import { getLocalizedFAQ } from '../../utils/helpCenterUtils.js';

function FAQSection({ faqs, searchQuery, currentLanguage }) {
  const filtered = faqs.filter((faq) => {
    const localized = getLocalizedFAQ(faq, currentLanguage);
    const q = localized.question.toLowerCase();
    const a = localized.answer.toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    return q.includes(query) || a.includes(query);
  });

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
        {currentLanguage === 'hi'
          ? 'अक्सर पूछे जाने वाले प्रश्न'
          : currentLanguage === 'hinglish'
            ? 'Frequently Asked Questions'
            : 'Frequently Asked Questions'}
      </h2>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((faq, index) => {
            const localized = getLocalizedFAQ(faq, currentLanguage);
            return (
              <details
                key={index}
                className="group rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <summary className="cursor-pointer font-medium text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 flex items-center justify-between">
                  <span>{localized.question}</span>
                  <svg
                    className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {localized.answer}
                </p>
              </details>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">
              {currentLanguage === 'hi'
                ? 'कोई परिणाम नहीं मिला। कृपया अपनी खोज बदलें।'
                : 'No results found. Try a different search.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;
