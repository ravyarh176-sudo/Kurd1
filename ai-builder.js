/* Kurd Technology — AI Store Builder (mobile-first) */
:root{
  --bg:#04110b; --fg:#f3fff8; --mut:rgba(243,255,248,.62);
  --gl:rgba(255,255,255,.06); --bd:rgba(255,255,255,.13);
  --g:#1ee66f; --gink:#03230f; --b:#3b82f6; --me:rgba(255,255,255,.08); --bot:rgba(30,230,111,.2);
  --glow:0 0 26px rgba(30,230,111,.4);
}
html[data-theme="light"]{
  --bg:#eefaf3; --fg:#0b1f14; --mut:rgba(11,31,20,.62);
  --gl:rgba(255,255,255,.75); --bd:rgba(11,31,20,.13);
  --me:rgba(11,31,20,.07); --bot:rgba(30,230,111,.22); --glow:0 6px 20px rgba(30,230,111,.35);
}
*{box-sizing:border-box;margin:0;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
html,body{min-height:100%}
body{background:var(--bg);color:var(--fg);font-family:'Vazirmatn',sans-serif;line-height:1.7;overflow-x:hidden}
.glow{position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(70% 38% at 100% 100%,rgba(30,230,111,.38),transparent),
             radial-gradient(60% 30% at 0 0,rgba(30,230,111,.2),transparent)}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
:focus-visible{outline:2px solid var(--g);outline-offset:2px}

/* header */
.bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:8px;
  margin:12px auto 0;width:calc(100% - 24px);max-width:536px;padding:8px 10px;
  border:1px solid var(--bd);border-radius:18px;background:var(--gl);backdrop-filter:blur(14px)}
.brand{display:flex;align-items:center;gap:8px;flex:1;font-family:'Noto Kufi Arabic',sans-serif;font-size:14px}
.logo{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:var(--g);color:var(--gink)}
.logo svg{width:18px;height:18px}
.who{font-size:11px;color:var(--mut);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ib{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;border:1px solid var(--bd);background:var(--gl)}
.ib svg{width:18px;height:18px}

main{width:100%;max-width:560px;margin:0 auto;padding:22px 12px 120px}

/* home */
h1{font-family:'Noto Kufi Arabic',sans-serif;font-size:26px;line-height:1.5;font-weight:800}
.lead{color:var(--mut);font-size:14px;margin:6px 0 18px}
.box{position:relative;border:1px solid var(--bd);border-radius:20px;background:var(--gl);
  backdrop-filter:blur(12px);padding:14px}
.box textarea{width:100%;min-height:130px;resize:none;border:0;outline:0;background:none;
  color:var(--fg);font:inherit;font-size:15px}
.box textarea::placeholder{color:var(--mut)}
.go{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:14px;
  background:var(--g);color:var(--gink);font-weight:700;font-size:16px;box-shadow:var(--glow)}
.go svg{width:18px;height:18px;transform:scaleX(-1)}
.go:active,.send:active{transform:scale(.97)}
.err{margin-top:10px;padding:10px 12px;border-radius:12px;font-size:13px;
  background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.4)}
h2{font-family:'Noto Kufi Arabic',sans-serif;font-size:19px;margin:30px 0 14px;font-weight:700}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{border:1px solid var(--bd);border-radius:20px;background:var(--gl);padding:10px;
  backdrop-filter:blur(10px);display:flex;flex-direction:column;gap:8px}
.card h3{font-size:14px;font-weight:600}
.pill{align-self:flex-start;padding:6px 20px;border-radius:12px;background:var(--g);color:var(--gink);font-weight:700}
.th{height:104px;border-radius:12px;padding:10px;display:flex;gap:6px;align-items:flex-end}
.th i{flex:1;border-radius:6px;background:rgba(255,255,255,.85);height:40%}
.th i:nth-child(2){height:62%}.th i:nth-child(3){height:30%}
.th-shop{background:linear-gradient(135deg,#1c1f26,#2b3a36)}
.th-folio{background:linear-gradient(135deg,#0d0d0d,#2a2a2a)}
.th-trip{background:linear-gradient(135deg,#2d6a4f,#74c69d)}

/* chat */
.tabs{display:flex;gap:6px;padding:5px;border:1px solid rgba(59,130,246,.5);border-radius:16px;background:var(--gl)}
.tab{flex:1;padding:10px 6px;border-radius:12px;font-weight:600;font-size:14px}
.tab.on{background:var(--b);color:#fff;box-shadow:0 0 22px rgba(59,130,246,.5)}
.botcard{display:flex;align-items:center;gap:12px;margin:16px 0;padding:12px;border:1px solid var(--bd);
  border-radius:18px;background:var(--gl)}
.botcard b{display:block;font-family:'Noto Kufi Arabic',sans-serif;font-size:14px}
.botcard small{color:var(--g);font-weight:600}
.avatar{position:relative;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  border:1px solid var(--bd);color:var(--g)}
.avatar svg{width:30px;height:30px}
.dot{position:absolute;bottom:0;inset-inline-end:0;width:13px;height:13px;border-radius:50%;
  background:var(--g);border:2px solid var(--bg)}
.msgs{display:flex;flex-direction:column;gap:12px}
.m{max-width:86%;padding:12px 14px;border-radius:16px;font-size:14.5px;white-space:pre-wrap;word-break:break-word}
.m.me{align-self:flex-start;background:var(--me)}
.m.ai{align-self:flex-end;background:var(--bot);border:1px solid rgba(30,230,111,.3)}
.m button{display:block;margin-top:8px;padding:6px 14px;border-radius:10px;background:var(--g);color:var(--gink);font-weight:700}
.typing{display:inline-flex;gap:4px}
.typing i{width:6px;height:6px;border-radius:50%;background:var(--g);animation:bl 1s infinite}
.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes bl{50%{opacity:.25}}
#frame{width:100%;height:calc(100dvh - 200px);min-height:420px;border:1px solid var(--bd);border-radius:18px;background:#fff;margin-top:14px}
.empty{margin-top:14px;padding:30px 16px;text-align:center;color:var(--mut);border:1px dashed var(--bd);border-radius:18px}

/* input dock */
.dock{position:fixed;bottom:12px;left:0;right:0;margin:auto;width:calc(100% - 24px);max-width:536px;
  display:flex;align-items:center;gap:6px;padding:8px;border:1px solid var(--bd);border-radius:22px;
  background:var(--gl);backdrop-filter:blur(16px);box-shadow:var(--glow)}
.dock input{flex:1;min-width:0;height:44px;border:0;outline:0;border-radius:16px;padding:0 12px;
  background:var(--me);color:var(--fg);font:inherit;font-size:15px}
.plus{width:40px;height:40px;border-radius:50%;font-size:24px;display:grid;place-items:center;flex:none}
.plus svg{width:20px;height:20px}
.send{width:46px;height:46px;border-radius:50%;background:var(--b);color:#fff;display:grid;place-items:center;
  flex:none;box-shadow:0 0 20px rgba(59,130,246,.55)}
.send svg{width:22px;height:22px}
.send:disabled{opacity:.5}

.toast{position:fixed;bottom:90px;left:50%;transform:translate(-50%,20px);opacity:0;pointer-events:none;
  padding:10px 18px;border-radius:14px;background:var(--g);color:var(--gink);font-weight:700;font-size:13px;transition:.25s}
.toast.show{opacity:1;transform:translate(-50%,0)}

@media (min-width:600px){ h1{font-size:32px} .grid{grid-template-columns:repeat(3,1fr)} main{max-width:640px} }
@media (prefers-reduced-motion:reduce){ *{animation:none!important;transition:none!important} }

/* admin panel */
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.stats div{border:1px solid var(--bd);border-radius:16px;background:var(--gl);padding:12px;text-align:center}
.stats b{display:block;font-size:26px;color:var(--g);font-family:'Noto Kufi Arabic',sans-serif}
.stats small{color:var(--mut);font-size:12px}
.set label{display:block;font-size:13px;color:var(--mut);margin-bottom:12px}
.set input{display:block;width:100%;margin-top:6px;height:44px;border-radius:12px;border:1px solid var(--bd);background:var(--me);color:var(--fg);padding:0 12px;font:inherit}
.urow{border:1px solid var(--bd);border-radius:16px;background:var(--gl);margin-bottom:10px;overflow:hidden}
.uhead{width:100%;text-align:start;padding:12px;display:flex;flex-direction:column;gap:2px}
.uhead small{color:var(--mut);direction:ltr;text-align:right}.uhead span{color:var(--g);font-size:12px;font-weight:600}
.ureqs{padding:0 12px 12px}
.rq{padding:10px 0;border-top:1px solid var(--bd);display:grid;grid-template-columns:12px 1fr;gap:4px 10px;font-size:13px}
.rq i{width:10px;height:10px;border-radius:50%;margin-top:7px}.rq small{grid-column:2;color:var(--mut)}
.f-green{background:#22c55e}.f-blue{background:#3b82f6}.f-yellow{background:#eab308}.f-red{background:#ef4444}

/* saved projects */
.thc{height:104px;border-radius:12px;display:flex;align-items:flex-end;padding:10px;color:#fff;font-weight:700;font-size:13px;text-shadow:0 1px 6px rgba(0,0,0,.5)}
.mut{color:var(--mut);font-size:11px}
.crow{display:flex;align-items:center;justify-content:space-between;gap:6px}
.del{font-size:12px;color:var(--mut);text-decoration:underline;padding:4px}
.newbtn{margin-top:12px;padding:8px 16px;border-radius:12px;border:1px dashed var(--g);color:var(--g);font-weight:600;font-size:13px}
