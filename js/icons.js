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
    mayor: s('<path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18"/><path d="M9.5 8h6M9.5 12h6M9.5 16h3.5"/><path d="M4 7h2M4 12h2M4 17h2"/>'),
    compare: s('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>'),
    reports: s('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>'),
    analyse: s('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/><path d="M8 11h6M11 8v6"/>'),
    model: s('<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    present: s('<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21l4-5 4 5"/><path d="M9 8l5 2.5L9 13z"/>'),
    settings: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    logo: '<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><rect x="3.5" y="4" width="41" height="40.5" rx="7" fill="var(--paper2,#f4efe6)" stroke="var(--ink,#23272f)" stroke-width="1.6"/><path d="M9.5 16.2c9.6-.6 19.3.3 29.2-.4M9.2 25.4c9.9.4 19.6-.5 29.6.2M9.8 34.3c9.4-.3 19 .4 28.8-.3" stroke="var(--ink,#23272f)" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/><path d="M17.1 9.6c-.5 9.6.4 19.4-.2 29.2M26.4 9.3c.4 9.9-.5 19.6.1 29.6M35.2 9.8c-.3 9.4.5 19-.2 28.8" stroke="var(--ink,#23272f)" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".55"/><rect x="18.6" y="17.6" width="6.4" height="6.6" rx="1" fill="var(--cobalt,#2244a8)"/><rect x="27.8" y="26.8" width="6" height="6" rx="1" fill="var(--terra,#c8643b)"/><path d="M7 40.5c6-3 11-1.4 16.4-2.6 5.6-1.3 10.4-3.9 18.6-1.8" stroke="var(--cobalt,#2244a8)" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>'

  };
})(window);
