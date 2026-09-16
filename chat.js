// ============================================================
// KURD TECHNOLOGY - CLEAN WHATSAPP/TELEGRAM VOICE & CHAT
// ============================================================

window.KurdChat = {
  mount: async function({ container, otherUserId, otherName }) {
    if (!container || !otherUserId) return;
    const supabase = window.kurdtechSupabase;
    const me = window.kurdtechUser;

    if (!supabase || !me) {
      container.innerHTML = '<div style="padding:15px; color:#EF4444; text-align:center;">کێشەی دەسەڵات هەیە</div>';
      return;
    }

    container.innerHTML = `
      <div class="kc-chat-box">
        <div class="kc-msg-area" id="kcMsgArea">
          <div style="text-align:center; padding:20px; color:rgba(255,255,255,.4); font-size:12px;">باردەکرێت...</div>
        </div>

        <div class="kc-action-bar">
          <input type="text" id="kcMsgInput" class="kc-msg-input" placeholder="نامەیەک بنووسە...">
          
          <button id="kcBtnSend" class="kc-action-btn kc-btn-send-gold" title="ناردن">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>

          <button id="kcBtnMic" class="kc-action-btn kc-btn-mic-gold" title="تۆمارکردنی دەنگ">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>

          <!-- کاتی قسەکردن و تۆمارکردن -->
          <div class="kc-record-popup" id="kcRecPopup">
            <div class="kc-rec-live">
              <div class="kc-live-dot"></div>
              <span class="kc-live-counter" id="kcRecCounter">00:00</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="kc-rec-discard" id="kcRecDiscard">سڕینەوە ✕</button>
              <button class="kc-rec-send" id="kcRecSend">ناردن ✓</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const area = document.getElementById('kcMsgArea');
    const input = document.getElementById('kcMsgInput');
    const sendBtn = document.getElementById('kcBtnSend');
    const micBtn = document.getElementById('kcBtnMic');
    const recPopup = document.getElementById('kcRecPopup');
    const counterEl = document.getElementById('kcRecCounter');
    const discardBtn = document.getElementById('kcRecDiscard');
    const sendVoiceBtn = document.getElementById('kcRecSend');

    // ۱. هێنانی نامەکان بە دیزاینی سەردەمی
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        area.innerHTML = '<div style="text-align:center; padding:15px; color:#EF4444;">نەتوانرا نامەکان باربکرێن</div>';
        return;
      }

      if (!data || data.length === 0) {
        area.innerHTML = '<div style="text-align:center; padding:20px; color:rgba(255,255,255,.4); font-size:12px;">هیچ نامەیەک نییە، قسەیەکی لەگەڵ بکە!</div>';
        return;
      }

      area.innerHTML = data.map(m => {
        const isMine = m.sender_id === me.id;
        const time = new Date(m.created_at).toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' });

        if (m.audio_url) {
          // دیزاینی مۆدێرنی دەنگ (نەک ئەو پلەیەرە کۆنەی گۆگڵ)
          return `
            <div class="kc-voice-bubble ${isMine ? 'mine' : 'theirs'}">
              <button class="kc-audio-play-btn" onclick="KurdChat.toggleAudio(this, '${m.audio_url}')">▶</button>
              <div class="kc-audio-info">
                <div class="kc-audio-wave">
                  <div class="kc-wave-bar" style="height:6px;"></div>
                  <div class="kc-wave-bar" style="height:12px;"></div>
                  <div class="kc-wave-bar" style="height:16px;"></div>
                  <div class="kc-wave-bar" style="height:10px;"></div>
                  <div class="kc-wave-bar" style="height:14px;"></div>
                  <div class="kc-wave-bar" style="height:8px;"></div>
                  <div class="kc-wave-bar" style="height:12px;"></div>
                </div>
                <span class="kc-time-tag">${time}</span>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="kc-bubble ${isMine ? 'mine' : 'theirs'}">
              <div>${escapeHtml(m.content)}</div>
              <span class="kc-time-tag">${time}</span>
            </div>
          `;
        }
      }).join('');

      area.scrollTop = area.scrollHeight;
    }

    await fetchMessages();

    // ۲. ناردنی نامەی نوسین
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      await supabase.from('messages').insert({
        sender_id: me.id,
        receiver_id: otherUserId,
        content: text
      });

      await fetchMessages();
    }

    sendBtn.onclick = sendMessage;
    input.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };

    // ۳. تۆمارکردنی دەنگ بە شێوازی سەردەمی
    let mediaRecorder = null;
    let audioChunks = [];
    let countInterval = null;
    let seconds = 0;

    micBtn.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start();
        recPopup.classList.add('show');

        seconds = 0;
        counterEl.textContent = '00:00';
        countInterval = setInterval(() => {
          seconds++;
          const m = String(Math.floor(seconds / 60)).padStart(2, '0');
          const s = String(seconds % 60).padStart(2, '0');
          counterEl.textContent = `${m}:${s}`;
        }, 1000);

      } catch (err) {
        alert('تکایە لە وێبگەڕەکەت ڕێگە بدە بە بەکارهێنانی مایکرۆفۆن!');
      }
    };

    discardBtn.onclick = () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
      clearInterval(countInterval);
      recPopup.classList.remove('show');
    };

    sendVoiceBtn.onclick = () => {
      if (!mediaRecorder) return;
      clearInterval(countInterval);
      sendVoiceBtn.textContent = 'ناردن...';

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.webm`;

        const { data: uploadData, error: upErr } = await supabase.storage
          .from('voice-messages')
          .upload(fileName, audioBlob);

        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage
            .from('voice-messages')
            .getPublicUrl(fileName);

          await supabase.from('messages').insert({
            sender_id: me.id,
            receiver_id: otherUserId,
            audio_url: publicUrl
          });

          await fetchMessages();
        } else {
          alert('هەڵەیەک ڕوویدا لە کاتی ناردنی دەنگەکە');
        }

        sendVoiceBtn.textContent = 'ناردن ✓';
        recPopup.classList.remove('show');
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.stop();
    };
  },

  // کۆنتڕۆڵی لێدانی دەنگ و جوڵاندنی شەپۆل
  toggleAudio: function(btn, url) {
    if (window.activeAudio && window.activeAudioUrl === url) {
      if (!window.activeAudio.paused) {
        window.activeAudio.pause();
        btn.textContent = '▶';
        this.stopWaves(btn);
        return;
      } else {
        window.activeAudio.play();
        btn.textContent = '⏸';
        this.startWaves(btn);
        return;
      }
    }

    if (window.activeAudio) {
      window.activeAudio.pause();
      if (window.activeAudioBtn) {
        window.activeAudioBtn.textContent = '▶';
        this.stopWaves(window.activeAudioBtn);
      }
    }

    const audio = new Audio(url);
    window.activeAudio = audio;
    window.activeAudioUrl = url;
    window.activeAudioBtn = btn;

    btn.textContent = '⏸';
    this.startWaves(btn);

    audio.play();

    audio.onended = () => {
      btn.textContent = '▶';
      this.stopWaves(btn);
    };
  },

  startWaves: function(btn) {
    const bars = btn.parentElement.querySelectorAll('.kc-wave-bar');
    bars.forEach((b, i) => {
      setTimeout(() => b.classList.add('active'), i * 80);
    });
  },

  stopWaves: function(btn) {
    const bars = btn.parentElement.querySelectorAll('.kc-wave-bar');
    bars.forEach(b => b.classList.remove('active'));
  }
};

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
