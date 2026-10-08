// Preview-only asset for staging and local development. Never placed in the production resources or compiled into production Wasm.
(() => {
  'use strict';
  const LIMIT = 200;
  const events = [];
  const cards = new Map();
  let total = 0;
  const descriptions = {
    language_change: 'The website language changed.', faq_toggle: 'A FAQ answer was opened or closed.',
    order_pricing_loaded: 'Order pricing was loaded.', order_delivery_help: 'Delivery help was opened.',
    page_view: 'A page was opened.', navigation_click: 'A navigation link was selected.',
    contact_click: 'A contact option was selected.', order_form_view: 'The order form became visible.',
    order_field_start: 'A text field was focused or first edited.',
    order_section_view: 'A form section was reached.',
    order_section_complete: 'A form section satisfied its completion rules.',
    order_form_checkpoint: 'The tab became hidden; the visitor may return.',
    form_start: 'The visitor started filling in the form.', order_field_complete: 'A field became complete.',
    order_option_changed: 'An order option changed.', order_form_progress: 'The visitor progressed through the form.',
    order_validation_error: 'Required fields need attention.', order_submit: 'An order submission was attempted.',
    order_submit_error: 'The submission failed.', generate_lead: 'The order was successfully submitted.',
    order_email_fallback: 'The email fallback was selected.', order_form_exit: 'The visitor left the order form.'
  };
  const host = document.createElement('div');
  host.id = 'ga4-preview-host';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { all: initial; font: 14px/1.5 system-ui, sans-serif; color: #eee; }
      * { box-sizing: border-box; }
      button, input { font: inherit; }
      button { cursor: pointer; color: #eee; background: #303036; border: 1px solid #65616e; border-radius: 8px; padding: 7px 11px; }
      button:hover { background: #44404e; } button:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid #c4aaff; outline-offset: 3px; }
      #toggle { position: fixed; right: 16px; bottom: max(20px, env(safe-area-inset-bottom)); z-index: 10001; background: #ad92f0; color: #17131f; font-weight: 700; box-shadow: 0 3px 18px #0008; }
      #panel { position: fixed; right: 0; top: 0; bottom: 0; width: min(440px, 100vw); z-index: 10002; background: #19191d; border-left: 1px solid #65616e; box-shadow: -12px 0 40px #0006; display: flex; flex-direction: column; transform: translateX(105%); transition: transform .22s ease, visibility 0s .22s; visibility: hidden; }
      #panel.open { transform: translateX(0); visibility: visible; transition-delay: 0s; }
      header { padding: 20px; border-bottom: 1px solid #39363f; }
      .heading, .tools { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
      h2 { margin: 0; font-size: 20px; } p { margin: 10px 0 0; color: #c6c2cc; }
      .badge { color: #beefce; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
      input { width: 100%; padding: 10px; margin: 14px 0 10px; background: #25252b; border: 1px solid #65616e; border-radius: 8px; color: #fff; }
      #status { font-size: 12px; margin: 10px 0 0; color: #c6c2cc; }
      #feed { overflow-y: auto; overscroll-behavior: contain; padding: 14px; flex: 1; min-height: 0; }
      .empty { text-align: center; padding: 30px 14px; }
      details { border: 1px solid #45414c; border-radius: 10px; background: #232329; margin-bottom: 10px; }
      summary { cursor: pointer; padding: 12px; overflow-wrap: anywhere; }
      .name { font-weight: 700; color: #d5bfff; } .time { float: right; color: #bcb6c5; font-size: 12px; }
      .description { display: block; margin-top: 4px; color: #c6c2cc; font-size: 13px; }
      .payload { padding: 0 12px 12px; } table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; table-layout: fixed; }
      th, td { text-align: left; vertical-align: top; border-top: 1px solid #45414c; padding: 8px 0; overflow-wrap: anywhere; }
      th { width: 47%; padding-right: 8px; color: #bcb6c5; font-weight: 400; } code { font-family: ui-monospace, monospace; } small { display: block; color: #aaa2b6; }
      @media (prefers-reduced-motion: reduce) { #panel { transition: none; } }
    </style>
    <button id="toggle" aria-expanded="false" aria-controls="panel">GA4 preview · 0</button>
    <section id="panel" aria-labelledby="title" inert>
      <header>
        <div class="badge">GA4 debug · local preview only</div>
        <div class="heading"><h2 id="title">GA4 event preview</h2><button id="close" aria-label="Close GA4 preview">✕</button></div>
        <p>Use the website to see the events it would send to GA4. Nothing is sent to Google. Automatic Google events are not simulated.</p>
        <input id="search" type="search" aria-label="Filter events or parameters" placeholder="Search events or parameters…">
        <div class="tools"><span>Newest first · click to inspect</span><button id="clear">Clear</button></div>
        <p id="status" role="status" aria-live="polite"></p>
      </header>
      <div id="feed"></div>
    </section>`;
  const $ = id => root.getElementById(id);
  const panel = $('panel'), toggle = $('toggle'), feed = $('feed'), search = $('search');
  function setOpen(open) {
    panel.classList.toggle('open', open);
    panel.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.hidden = open;
    if (open) search.focus(); else toggle.focus();
  }
  toggle.addEventListener('click', () => setOpen(true));
  $('close').addEventListener('click', () => setOpen(false));
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('open')) { event.preventDefault(); setOpen(false); }
  });
  function card(event) {
    const details = document.createElement('details');
    details.dataset.id = String(event.id);
    const summary = document.createElement('summary');
    const time = document.createElement('span'); time.className = 'time';
    time.textContent = event.time.toLocaleTimeString([], { hour12: false });
    const name = document.createElement('code'); name.className = 'name'; name.textContent = event.name;
    const description = document.createElement('span'); description.className = 'description';
    description.textContent = descriptions[event.name] || 'A custom website event was triggered.';
    summary.append(time, name, description);
    const payload = document.createElement('div'); payload.className = 'payload';
    const table = document.createElement('table'); table.setAttribute('aria-label', 'Event parameters');
    for (const [key, value] of Object.entries(event.parameters)) {
      const row = document.createElement('tr'), label = document.createElement('th'), cell = document.createElement('td');
      label.scope = 'row'; label.textContent = key;
      const code = document.createElement('code'); code.textContent = typeof value === 'string' ? value || '(empty)' : JSON.stringify(value);
      const type = document.createElement('small'); type.textContent = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      cell.append(code, type); row.append(label, cell); table.appendChild(row);
    }
    const copy = document.createElement('button'); copy.textContent = 'Copy GA4 payload';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify({ event: event.name, parameters: event.parameters }, null, 2));
        copy.textContent = 'Copied';
      } catch (_) { copy.textContent = 'Copy unavailable in this browser'; }
    });
    payload.append(table, copy); details.append(summary, payload); return details;
  }
  function render() {
    const active = root.activeElement;
    const retained = new Set(events.map(event => event.id));
    for (const id of cards.keys()) if (!retained.has(id)) cards.delete(id);
    const query = search.value.trim().toLowerCase();
    const matches = events.filter(event => (event.name + JSON.stringify(event.parameters)).toLowerCase().includes(query));
    feed.replaceChildren(...matches.map(event => {
      if (!cards.has(event.id)) cards.set(event.id, card(event));
      return cards.get(event.id);
    }));
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'empty';
      empty.textContent = query ? 'No matching events. Try another search.' : 'Waiting for events. Open a page or interact with the website.';
      feed.appendChild(empty);
    }
    if (active && active.isConnected) active.focus({ preventScroll: true });
    toggle.textContent = 'GA4 preview · ' + total;
    $('status').textContent = `${matches.length} shown · ${total} captured${total > LIMIT ? ' · latest 200 retained' : ''}. Cleared on reload.`;
  }
  search.addEventListener('input', render);
  $('clear').addEventListener('click', () => { events.length = 0; total = 0; render(); });
  window.__ga4Preview = (name, parameters) => {
    // Snapshot payloads, bound memory, and render values as text rather than interpreting markup.
    const snapshot = JSON.parse(JSON.stringify(parameters));
    events.unshift({ id: ++total, time: new Date(), name, parameters: snapshot });
    if (events.length > LIMIT) events.pop();
    render();
  };
  render();
})();
