/* Inline stroke icons (Lucide-style, MIT-compatible originals drawn for QALA 2050) */
(function (G) {
  const s = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  G.QIcons = {
    overview: s('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    city: s('<path d="M3 21h18"/><path d="M5 21V8l5-3v16"/><path d="M10 21V3l7 4v14"/><path d="M17 21v-9l3 2v7"/>'),
    build: s('<path d="M2 20h20"/><path d="M5 20V10l7-6 7 6v10"/><path d="M12 14v6"/><path d="M9 4V2h6v2"/>'),
    traffic: s('<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>'),
    eco: s('<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16"/><path d="M4 21c4-5 7-8 11-10"/>'),
    disaster: s('<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M12 3v5"/><path d="M12 3l-2 2M12 3l2 2"/>'),
    budget: s('<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M16 15h2"/>'),
    citizen: s('<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>'),
    future: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    infra: s('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7"/>'),
    biz: s('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    mayor: s('<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 17l.9-5.4L4.2 7.7l5.4-.8z"/><path d="M8 21h8"/>'),
    compare: s('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>'),
    reports: s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>'),
    model: s('<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    present: s('<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21l4-5 4 5"/><path d="M9 8l5 2.5L9 13z"/>'),
    settings: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    logo: '<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs><rect x="3" y="3" width="42" height="42" rx="11" fill="#0b1a30" stroke="url(#qg)" stroke-width="2"/><path d="M11 34h26" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round"/><rect x="13" y="20" width="5" height="14" rx="1" fill="#22d3ee"/><rect x="20" y="13" width="6" height="21" rx="1" fill="#67e8f9"/><rect x="28" y="23" width="5" height="11" rx="1" fill="#10b981"/><path d="M10 39c4-2.2 8-2.2 12 0s8 2.2 12 0 4-1 4-1" stroke="#38bdf8" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'
  };
})(window);
