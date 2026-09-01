// Kurd Technology — shared icon library for dynamic site sections.
// Each entry is a small inline-SVG snippet (just the inner shapes, the
// outer <svg> wrapper is added by whoever renders it). Keeping this in
// one file means the homepage cards and the admin icon-picker always
// stay in sync.

window.KURDTECH_ICONS = {
  gamepad:   '<path d="M6 12h4M8 10v4M15 13h.01M17.5 11h.01"></path><rect x="2" y="7" width="20" height="10" rx="5"></rect>',
  idcard:    '<rect x="4" y="3" width="16" height="18" rx="2"></rect><circle cx="9.5" cy="9.5" r="2"></circle><path d="M6 17c.6-2 2-3 3.5-3s2.9 1 3.5 3"></path><line x1="14" y1="8" x2="17" y2="8"></line><line x1="14" y1="11" x2="17" y2="11"></line>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="2" y1="13" x2="22" y2="13"></line>',
  robot:     '<rect x="5" y="9" width="14" height="11" rx="3"></rect><circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"></circle><line x1="12" y1="9" x2="12" y2="5"></line><circle cx="12" cy="3.5" r="1.5"></circle>',
  palette:   '<path d="M12 2a10 10 0 1 0 3 19.6c1-.3 1-1.6.2-2.2-.6-.5-.7-1.4-.1-2 .4-.4 1-.5 1.6-.5H18a4 4 0 0 0 4-4c0-6-4.5-11-10-11z"></path><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="11" cy="7" r="1.2" fill="currentColor" stroke="none"></circle><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"></circle>',
  graduation:'<path d="M22 10 12 5 2 10l10 5 10-5z"></path><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"></path>',
  image:     '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9.5" r="1.5"></circle><path d="M21 16l-5-5L5 20"></path>',
  code:      '<polyline points="8 9 4 12 8 15"></polyline><polyline points="16 9 20 12 16 15"></polyline><line x1="13" y1="6" x2="11" y2="18"></line>',
  star:      '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3z"></path>',
  heart:     '<path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.5 4A5.4 5.4 0 0 1 12 7.5 5.4 5.4 0 0 1 18.5 4C22 4.5 23.6 8 22 11.7 19.5 16.4 12 21 12 21z"></path>',
  globe:     '<circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"></path>',
  lock:      '<rect x="4" y="10" width="16" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
  phone:     '<path d="M4 4c0 9.4 6.6 16 16 16l2-4-5-2-2 2c-2-1-4-3-5-5l2-2-2-5-4-2z"></path>',
  mail:      '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>',
  calendar:  '<rect x="3" y="5" width="18" height="16" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line><line x1="8" y1="3" x2="8" y2="7"></line><line x1="16" y1="3" x2="16" y2="7"></line>',
  chart:     '<line x1="4" y1="20" x2="20" y2="20"></line><rect x="6" y="12" width="3" height="8"></rect><rect x="11" y="7" width="3" height="13"></rect><rect x="16" y="4" width="3" height="16"></rect>',
  gift:      '<rect x="3" y="9" width="18" height="12" rx="1"></rect><path d="M3 9h18M12 9v12M12 9c-2-4-6-5-6-2s3 2 6 2c3 0 6 1 6-2s-4-2-6 2z"></path>',
  camera:    '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"></path><circle cx="12" cy="13" r="3.5"></circle>',
  music:     '<path d="M9 18V5l11-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="17" cy="16" r="3"></circle>',
  book:      '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5z"></path><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"></path>',
  cart:      '<circle cx="9" cy="20" r="1.3"></circle><circle cx="17" cy="20" r="1.3"></circle><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6"></path>',
  location:  '<path d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle>',
  rocket:    '<path d="M14.5 3.5c3 0 6 3 6 6-3 1-5 3-6 6l-4-4c1-3 3-5 6-6l-2-2z"></path><path d="M9 15l-4 4"></path><path d="M6 12l-3 1 2 2"></path><path d="M12 18l1 3-2-1"></path>',
  headset:   '<path d="M4 13v-1a8 8 0 0 1 16 0v1"></path><rect x="2.5" y="13" width="4" height="6" rx="1.3"></rect><rect x="17.5" y="13" width="4" height="6" rx="1.3"></rect>'
};
