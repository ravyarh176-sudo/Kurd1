// ============================================================
// KURD TECHNOLOGY - MODERN CHAT & VOICE ENGINE (وەک تێلیگرام)
// ============================================================

window.KurdChat = {
  mount: async function({ container, otherUserId, otherName }) {
    if (!container || !otherUserId) return;
    const supabase = window.kurdtechSupabase;
    const me = window.kurdtechUser;

    if (!supabase || !me) {
      container.innerHTML = '<div style="padding:20px; color:#EF4444; text-align:center;">کێشەی دەسەڵات هەیە</div>';
      return;
    }

    container.innerHTML = `
      <div class="kc-chat-container">
        <div class="kc-messages-flow" id="kcMessages">
          <div style="text-align:center; padding:20px; color:rgba(255,255,255,.4); font-size:12px;">باردەکرێت...</div>
        </div>

        <div class="kc-input-bar">
          <input type="text" id="kcTextInput" class="kc-text-input" placeholder="نامەیەک بنووسە بۆ ${escapeHtml(otherName)}...">
          
          <button id="kcBtnSend" class="kc-btn-send" title="ناردن">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>

          <button id="kcBtnMic" class="kc-btn-mic" title="تۆمارکردنی دەنگ">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>

          <!-- شریتی تۆمارکردن لە کاتی قسەکردندا -->
          <div class="kc-recording-panel" id="kcRecPanel">
            <div class="kc-rec-indicator">
              <div class="kc-rec-dot"></div>
              <span class="kc-rec-timer" id="kcRecTimer">00:00</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="kc-rec-cancel" id="kcRecCancel">سڕینەوە ✕</button>
              <button class="kc-rec-done" id="kcRecDone">ناردنی دەنگ ✓</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const flow = document.getElementById('kcMessages');
    const textInput = document.getElementById('kcTextInput');
    const btnSend = document.getElementById('kcBtnSend');
    const btnMic = document.getElementById('kcBtnMic');
    const recPanel = document.getElementById('kcRecPanel');
    const recTimer = document.getElementById('kcRecTimer');
    const recCancel = document.getElementById('kcRecCancel');
    const recDone = document.getElementById('kcRecDone');

    // ۱. هێنانی نامەکان
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        flow.innerHTML = '<div style="text-align:center; padding:20px; color:#EF4444;">نەتوانرا نامەکان باربکرێن</div>';
        return;
      }

      if (!data || data.length === 0) {
        flow.innerHTML = '<div style="text-align:center; padding:20px; color:rgba(255,255,255,.4); font-size:12px;">هیچ نامەیەک نییە، یەکەم نامە بنێرە!</div>';
        return;
      }

      flow.innerHTML = data.map(m => {
        const isMe = m.sender_id === me.id;
        const time = new Date(m.created_at).toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' });

        if (m.audio_url) {
          return `
            <div class="kc-bubble ${isMe ? 'me' : 'other'}">
              <div class="kc-voice-player">
                <button class="kc-play-btn" onclick="KurdChat.playAudio(this, '${m.audio_url}')">▶</button>
                <div class="kc-waveform">
                  <div class="kc-wave-bar" style="height:10px;"></div>
                  <div class="kc-wave-bar" style="height:16px;"></div>
                  <div class="kc-wave-bar" style="height:8px;"></div>
                  <div class="kc-wave-bar" style="height:18px;"></div>
                  <div class="kc-wave-bar" style="height:12px;"></div>
                  <div class="kc-wave-bar" style="height:14px;"></div>
                  <div class="kc-wave-bar" style="height:6px;"></div>
                </div>
              </div>
              <span class="kc-time">${time}</span>
            </div>
          `;
        } else {
          return `
            <div class="kc-bubble ${isMe ? 'me' : 'other'}">
              <div>${escapeHtml(m.content)}</div>
              <span class="kc-time">${time}</span>
            </div>
          `;
        }
      }).join('');

      flow.scrollTop = flow.scrollHeight;
    }

    await loadMessages();

    // ۲. ناردنی نامەی نوسین
    async function sendTextMessage() {
      const txt = textInput.value.trim();
      if (!txt) return;
      textInput.value = '';

      await supabase.from('messages').insert({
        sender_id: me.id,
        receiver_id: otherUserId,
        content: txt
      });

      await loadMessages();
    }

    btnSend.onclick = sendTextMessage;
    textInput.onkeydown = (e) => { if (e.key === 'Enter') sendTextMessage(); };

    // ۳. سیستەمی پێشکەوتووی تۆمارکردنی دەنگ
    let mediaRecorder = null;
    let audioChunks = [];
    let timerInterval = null;
    let secondsElapsed = 0;

    btnMic.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start();
        recPanel.classList.add('active');

        // دەستپێکردنی کاتژمێر
        secondsElapsed = 0;
        recTimer.textContent = '00:00';
        timerInterval = setInterval(() => {
          secondsElapsed++;
          const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
          const s = String(secondsElapsed % 60).padStart(2, '0');
          recTimer.textContent = `${m}:${s}`;
        }, 1000);

      } catch (err) {
        alert('تکایە ڕێگە بدە بە مایکرۆفۆن بۆ ناردنی دەنگ!');
      }
    };

    // هەڵوەشاندنەوەی دەنگ
    recCancel.onclick = () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
      clearInterval(timerInterval);
      recPanel.classList.remove('active');
    };

    // تەواوکردن و ناردنی دەنگ
    recDone.onclick = () => {
      if (!mediaRecorder) return;
      clearInterval(timerInterval);
      recDone.textContent = 'خەریکی ناردنە...';

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.webm`;

        // ئەپلۆدکردن بۆ ستۆریجی voice-messages
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

          await loadMessages();
        } else {
          alert('کێشە لە ناردنی دەنگەکە ڕوویدا');
        }

        recDone.textContent = 'ناردنی دەنگ ✓';
        recPanel.classList.remove('active');
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.stop();
    };
  },

  // لێدانی دەنگ و جوڵاندنی شەپۆل
  playAudio: function(btn, url) {
    if (window.currentAudio) {
      window.currentAudio.pause();
      if (window.currentBtn) window.currentBtn.textContent = '▶';
    }

    const audio = new Audio(url);
    window.currentAudio = audio;
    window.currentBtn = btn;
    btn.textContent = '⏸';

    const bars = btn.parentElement.querySelectorAll('.kc-wave-bar');
    bars.forEach(b => b.classList.add('active'));

    audio.play();

    audio.onended = () => {
      btn.textContent = '▶';
      bars.forEach(b => b.classList.remove('active'));
    };
  }
};

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
