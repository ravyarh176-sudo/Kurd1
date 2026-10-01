// Kurd Technology — AI Worker (Phase 2). Single file: paste into Cloudflare dashboard or deploy with wrangler.
// Env: GEMINI_API_KEY (Secret), SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGIN (e.g. https://3aeec.netlify.app)

const MAX_PROMPT = 2000, MAX_HTML_IN = 60000, MAX_HTML_OUT = 80000, MAX_BODY = 70000;
let modelCache = { at: 0, list: [] };

const SYSTEM = `You build ONE complete, self-contained HTML page for an online store, in Kurdish Sorani (lang="ckb" dir="rtl"), mobile-first.
Rules: output ONLY raw HTML (no markdown, no explanation). Inline <style> only. NO JavaScript, NO <script>, NO iframes, NO forms posting anywhere.
NO external resources at all: no http(s) URLs, no web fonts, no CDN, no remote images. Use emoji and inline SVG or CSS gradients as product images.
Include: header with store name, hero, product grid (cards with name, price, button "زیادکردن بۆ سەبەتە"), footer. Buttons are visual only for now.
Never include any keys, passwords, tokens, tracking or analytics. Use <title> for the store name.`;

const json = (o, s, cors) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'method' }, 405, cors);
    if (req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return json({ error: 'origin' }, 403, cors);

    try {
      // 1) Authenticate: the user's Supabase token (same login as Kurd Technology)
      const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: 'not_authenticated' }, 401, cors);
      const u = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
      if (!u.ok) return json({ error: 'not_authenticated' }, 401, cors);

      // 2) Validate body size & fields (never trust the browser)
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413, cors);
      const b = JSON.parse(raw);
      const kind = b.kind === 'edit' ? 'edit' : 'generate';
      const prompt = String(b.prompt || '').trim();
      const html = String(b.html || '');
      if (prompt.length < 3 || prompt.length > MAX_PROMPT) return json({ error: 'bad_prompt' }, 400, cors);
      if (kind === 'edit' && (!html || html.length > MAX_HTML_IN)) return json({ error: 'bad_html' }, 400, cors);

      // 3) Daily limit + audit log, enforced by the DATABASE with the user's own token
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/ai_log_request`, {
        method: 'POST',
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_project: b.project_id, p_kind: kind, p_prompt: prompt })
      });
      if (!r.ok) {
        const t = await r.text();
        if (t.includes('limit_reached')) return json({ error: 'limit_reached' }, 429, cors);
        return json({ error: 'rejected' }, 400, cors);
      }

      // 4) Ask Gemini (model discovered dynamically, Flash fallback)
      const userText = kind === 'edit'
        ? `Current page:\n${html}\n\nApply this change and return the FULL updated HTML:\n${prompt}`
        : `Create the store website for this request:\n${prompt}`;
      const out = await askGemini(env, userText);

      // 5) Sanitize & validate before returning
      const clean = sanitize(out);
      const title = (clean.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || 'فرۆشگاکەم';
      return json({ html: clean, title: title.replace(/<[^>]*>/g, '').slice(0, 80) }, 200, cors);
    } catch (e) {
      const m = String(e.message || e);
      if (m === 'busy') return json({ error: 'busy' }, 503, cors);
      if (m === 'unsafe' || m === 'bad_output') return json({ error: m }, 422, cors);
      return json({ error: 'server' }, 500, cors);
    }
  }
};

async function listModels(env) {
  if (Date.now() - modelCache.at < 3600e3 && modelCache.list.length) return modelCache.list;
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
  if (!r.ok) throw new Error('busy');
  const d = await r.json();
  const names = (d.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace('models/', ''))
    .filter(n => /flash/.test(n) && !/image|tts|live|audio|embed|robotics|computer|native|exp/.test(n) && !/gemini-(1|2\.0)/.test(n));
  // prefer newest non-lite Flash, then lite, then older; keep order stable
  const score = n => (/gemini-3/.test(n) ? 0 : 10) + (/lite/.test(n) ? 5 : 0) + (/preview/.test(n) ? 1 : 0) + (/latest/.test(n) ? 2 : 0);
  modelCache = { at: Date.now(), list: names.sort((a, c) => score(a) - score(c)) };
  return modelCache.list;
}

async function askGemini(env, userText) {
  const models = (await listModels(env)).slice(0, 4);
  if (!models.length) throw new Error('busy');
  for (const m of models) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 90000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 16000 }
        })
      });
      if ([429, 503, 500, 404].includes(r.status)) continue; // try next model
      if (!r.ok) throw new Error('busy');
      const d = await r.json();
      const text = (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
      if (text.length > 200) return text;
    } catch (e) { if (e.message === 'unsafe') throw e; } finally { clearTimeout(t); }
  }
  throw new Error('busy');
}

function sanitize(raw) {
  let h = String(raw).replace(/```(?:html)?/gi, '').trim();
  const i = h.search(/<!doctype|<html/i); if (i > 0) h = h.slice(i);
  if (h.length > MAX_HTML_OUT || !/<body/i.test(h)) throw new Error('bad_output');
  h = h.replace(/<(script|iframe|object|embed|frame|applet|form)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(script|iframe|object|embed|frame|applet|form|link|base)\b[^>]*>/gi, '')
    .replace(/<meta[^>]*http-equiv[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\b(href|src|action|poster|srcset)\s*=\s*(["'])\s*(?:javascript:|vbscript:|data:text|(?:https?:)?\/\/)[^"']*\2/gi, '$1=$2#$2')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/url\(\s*['"]?\s*(?:https?:)?\/\/[^)]*\)/gi, 'none');
  if (/eval\s*\(|new\s+Function|AIza[0-9A-Za-z_\-]{20,}|service_role|sk-[A-Za-z0-9]{20,}|<script/i.test(h)) throw new Error('unsafe');
  return h;
}
