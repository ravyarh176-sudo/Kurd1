// Kurd Technology — shared chat widget (text + voice notes, realtime).
// Usage: KurdChat.mount({ container, otherUserId, otherName })
// Requires guard.js to have already run (uses window.kurdtechSupabase / kurdtechUser).

window.KurdChat = (function () {

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  async function mount({ container, otherUserId, otherName }) {
    const supabase = window.kurdtechSupabase;
    const me = window.kurdtechUser;
    if (!supabase || !me || !otherUserId) return;

    container.innerHTML = `
      <div class="kc-head">
        <div class="kc-avatar">${escapeHtml((otherName || '؟').charAt(0))}</div>
        <div class="kc-name">${escapeHtml(otherName || 'بەکارهێنەر')}</div>
      </div>
      <div class="kc-thread" id="kcThread"><div class="kc-empty">بارکردن...</div></div>
      <div class="kc-composer">
        <button type="button" class="kc-mic" id="kcMicBtn" title="پەیامی دەنگی">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
        </button>
        <input type="text" id="kcInput" placeholder="نامەیەک بنووسە...">
        <button type="button" class="kc-send" id="kcSendBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7z"></path></svg>
        </button>
      </div>
      <div class="kc-recording" id="kcRecording" hidden>
        <span class="kc-rec-dot"></span> دەنگ تۆمار دەکرێت...
        <button type="button" id="kcStopRec">وەستان و ناردن</button>
        <button type="button" id="kcCancelRec">هەڵوەشاندنەوە</button>
      </div>
    `;

    const threadEl = container.querySelector('#kcThread');

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        threadEl.innerHTML = `<div class="kc-empty">نەتوانرا نامەکان بار بکرێن</div>`;
        return;
      }
      renderMessages(data || []);

      // mark incoming messages as read
      supabase.from('messages')
        .update({ read: true })
        .eq('receiver_id', me.id)
        .eq('sender_id', otherUserId)
        .eq('read', false)
        .then(() => {});
    }

    function renderMessages(rows) {
      if (!rows.length) {
        threadEl.innerHTML = `<div class="kc-empty">هێشتا هیچ نامەیەک نییە — دەست بکە بە نووسین</div>`;
        return;
      }
      threadEl.innerHTML = rows.map(m => {
        const mine = m.sender_id === me.id;
        const body = m.audio_url
          ? `<audio controls src="${escapeHtml(m.audio_url)}"></audio>`
          : `<span>${escapeHtml(m.content)}</span>`;
        return `<div class="kc-bubble ${mine ? 'mine' : ''}">
          ${body}
          <span class="kc-time">${formatTime(m.created_at)}</span>
        </div>`;
      }).join('');
      threadEl.scrollTop = threadEl.scrollHeight;
    }

    async function sendText() {
      const input = container.querySelector('#kcInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      const { error } = await supabase.from('messages').insert({
        sender_id: me.id, receiver_id: otherUserId, content: text
      });
      if (!error) loadMessages();
    }

    container.querySelector('#kcSendBtn').addEventListener('click', sendText);
    container.querySelector('#kcInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendText();
    });

    // ---------- voice recording ----------
    let mediaRecorder = null;
    let audioChunks = [];

    container.querySelector('#kcMicBtn').addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.start();
        container.querySelector('#kcRecording').hidden = false;
      } catch (e) {
        alert('نەتوانرا دەستت بگات بە مایکرۆفۆن — ڕێگە بدە بۆ ئەم ماڵپەڕە.');
      }
    });

    container.querySelector('#kcCancelRec').addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      container.querySelector('#kcRecording').hidden = true;
    });

    container.querySelector('#kcStopRec').addEventListener('click', () => {
      if (!mediaRecorder) return;
      mediaRecorder.onstop = async () => {
        container.querySelector('#kcRecording').hidden = true;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `${me.id}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from('voice-messages').upload(fileName, blob);
        if (upErr) { alert('نەتوانرا دەنگەکە بنێردرێت.'); return; }
        const { data: pub } = supabase.storage.from('voice-messages').getPublicUrl(fileName);
        await supabase.from('messages').insert({
          sender_id: me.id, receiver_id: otherUserId, audio_url: pub.publicUrl
        });
        loadMessages();
      };
      mediaRecorder.stop();
    });

    // ---------- realtime ----------
    supabase
      .channel('messages-' + otherUserId + '-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new;
        const relevant =
          (m.sender_id === me.id && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === me.id);
        if (relevant) loadMessages();
      })
      .subscribe();

    loadMessages();
  }

  return { mount };
})();
