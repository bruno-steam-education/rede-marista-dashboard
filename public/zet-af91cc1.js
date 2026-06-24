/* ============================================================================
   ZET — Widget de assistente flutuante (motor frontend)
   ----------------------------------------------------------------------------
   Personagem em avatar SVG que conversa com o usuário via API (Gemini/Abacus),
   com fallback offline (localAnswer). Arraste, troque de cor, fale por texto.

   COMO USAR NUMA PÁGINA:
     <link rel="stylesheet" href="./zet.css">
     <body data-zet-page="estudante" data-zet-lesson="meu-contexto">
     <script src="./zet.js"></script>

   ONDE CUSTOMIZAR (procure os marcadores "CUSTOMIZE"):
     1. CONTEXTS  — intro, frases e perguntas rápidas por contexto/página.
     2. localAnswer — respostas offline quando a API estiver indisponível.
     3. fetch("/api/zet") — endereço da função serverless (deve bater com o
        nome do arquivo em /api).
   ========================================================================== */
(function () {
  const pageType = document.body.dataset.zetPage || "catalogo";
  const lessonKey = document.body.dataset.zetLesson || "default";

  const ZET_COLORS = {
    azul: { body: "#1280c7", aura: "#1280c7", spark: "#fccc00" },
    limao: { body: "#b4cc00", aura: "#8aa300", spark: "#0078c0" },
    amarelo: { body: "#fccc00", aura: "#e0a800", spark: "#0078c0" },
    laranja: { body: "#f09c00", aura: "#cc8400", spark: "#004890" },
    vermelho: { body: "#e4540c", aura: "#e4540c", spark: "#fccc00" }
  };
  let currentColorKey = "azul";
  let isThinking = false;
  let isMuted = localStorage.getItem("zet-muted") === "true";
  let arePhrasesMuted = localStorage.getItem("zet-phrases-muted") === "true";

  // CUSTOMIZE (opcional): frases que o ZET diz em qualquer contexto.
  const GLOBAL_PHRASES = buildInnovationPhrases();

  let audioCtx = null;
  function playSound(type) {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      const now = audioCtx.currentTime;

      if (type === "click") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "beep" || type === "robot-interact") {
        const times = [0, 0.05];
        const freqs = [880, 1200];
        times.forEach((delay, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freqs[idx], now + delay);
          gain.gain.setValueAtTime(0.015, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.04);
        });
      } else if (type === "happy" || type === "robot-happy") {
        const times = [0, 0.05, 0.10];
        const freqs = [600, 800, 1100];
        times.forEach((delay, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freqs[idx], now + delay);
          gain.gain.setValueAtTime(0.02, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.05);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        });
      } else if (type === "keypress") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        const pitch = 1500 + Math.random() * 600;
        osc.frequency.setValueAtTime(pitch, now);
        gain.gain.setValueAtTime(0.008, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.015);
      } else if (type === "knock") {
        const times = [0.30, 0.50, 0.70];
        times.forEach((delay) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(140, now + delay);
          gain.gain.setValueAtTime(0.08, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.06);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.06);
        });
      }
    } catch (e) {
      console.warn("Web Audio API error:", e);
    }
  }

  /* ==========================================================================
     CUSTOMIZE 1 — BASE DE CONHECIMENTO (frontend)
     --------------------------------------------------------------------------
     Cada chave aqui corresponde a um valor de data-zet-lesson no <body>.
       title   : nome curto exibido no balão/cabeçalho.
       intro   : primeira fala do ZET ao abrir.
       phrases : balões automáticos (pode variar por pageType).
       quick   : sugestões de pergunta (reservadas para uso futuro).
     A chave "default" é o fallback quando data-zet-lesson não casa com nada.
     ====================================================================== */
  const contexts = {
    "default": {
      title: "ZET",
      intro: "Olá! Eu sou o ZET. Posso ajudar você a navegar por aqui. Para conversar comigo, é só clicar em cima de mim!",
      phrases: [
        "Olá! Sou o ZET. Clique em cima de mim para conversarmos!",
        "Posso te ajudar a encontrar o que você procura.",
        "Tem alguma dúvida? Eu estou aqui para ajudar."
      ],
      quick: [
        "O que você pode fazer?",
        "Como eu começo por aqui?"
      ]
    },
    "rede-marista": {
      title: "ZET — Rede Marista",
      intro: "Olá! Eu sou o ZET, assistente de inteligência artificial da ZOOM Education for Life. Estou aqui para te ajudar com insights sobre o dashboard da Rede Marista. Pergunte sobre escolas, ações, tendências ou qualquer dado que você ver aqui!",
      phrases: [
        "Colégio Marista Santo Antônio (Sinop) e Santa Mônica lideram com 28 atendimentos — quer saber por quê?",
        "Temos atendimentos remotos e presenciais. Posso explicar essa tendência!",
        "Plantão de dúvidas é uma das ações mais frequentes. Quer entender o impacto?",
        "A rede atende 42 escolas em vários estados do Brasil. Pergunta sobre alguma!",
        "Temos mais de 500 atendimentos registrados em 2026. Quer ver como se distribuem?",
        "Clique em mim para obter insights sobre os dados que você está vendo.",
        "Posso comparar escolas, analisar tendências ou sugerir melhorias."
      ],
      quick: [
        "Qual escola precisa de mais atenção?",
        "Compare remoto vs presencial",
        "Quais são as principais tendências?",
        "Resuma os destaques da rede"
      ]
    }
  };

  const kb = contexts[lessonKey] || contexts["default"];

  const root = document.createElement("div");
  root.className = "zet-pet";
  root.innerHTML = `
    <div class="zet-pet-node">
      <div class="zet-pet-color-picker">
        <button class="zet-color-dot is-azul" data-color="azul" aria-label="Azul"></button>
        <button class="zet-color-dot is-limao" data-color="limao" aria-label="Limão"></button>
        <button class="zet-color-dot is-amarelo" data-color="amarelo" aria-label="Amarelo"></button>
        <button class="zet-color-dot is-laranja" data-color="laranja" aria-label="Laranja"></button>
        <button class="zet-color-dot is-vermelho" data-color="vermelho" aria-label="Vermelho"></button>
      </div>
      <div class="zet-pet-chat" hidden>
        <div class="zet-pet-chat-header">
          <div class="zet-pet-chat-title">
            <strong>ZET</strong>
            <span>Assistente do projeto</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="zet-pet-chat-mute" type="button" aria-label="Desativar som" style="width: 32px; height: 32px; border: 0; border-radius: 999px; background: #e9f2fb; color: var(--zet-blue); font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">🔊</button>
            <button class="zet-pet-chat-phrases" type="button" aria-label="Desativar frases" style="width: 32px; height: 32px; border: 0; border-radius: 999px; background: #e9f2fb; color: var(--zet-blue); font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">💬</button>
            <button class="zet-pet-chat-expand" type="button" aria-label="Expandir conversa" title="Expandir/recolher" style="width: 32px; height: 32px; border: 0; border-radius: 999px; background: #e9f2fb; color: var(--zet-blue); font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;">⤢</button>
            <button class="zet-pet-chat-close" type="button" aria-label="Fechar">×</button>
          </div>
        </div>
        <div class="zet-pet-chat-colors">
          <span>Personalizar ZET:</span>
          <div class="zet-pet-color-picker-inner">
            <button class="zet-color-dot is-azul" data-color="azul" aria-label="Azul"></button>
            <button class="zet-color-dot is-limao" data-color="limao" aria-label="Limão"></button>
            <button class="zet-color-dot is-amarelo" data-color="amarelo" aria-label="Amarelo"></button>
            <button class="zet-color-dot is-laranja" data-color="laranja" aria-label="Laranja"></button>
            <button class="zet-color-dot is-vermelho" data-color="vermelho" aria-label="Vermelho"></button>
          </div>
        </div>
        <div class="zet-pet-chat-body">
          <div class="zet-pet-messages" aria-live="polite"></div>
          <div class="zet-pet-attachment" hidden>
            <img class="zet-pet-attachment-img" alt="Print da tela anexado">
            <button class="zet-pet-attachment-remove" type="button" title="Remover print">×</button>
          </div>
          <form class="zet-pet-form">
            <button type="button" class="zet-pet-screenshot-btn" title="Tirar print da tela" aria-label="Tirar print da tela">📸</button>
            <input type="text" name="message" placeholder="Escreva sua pergunta..." autocomplete="off">
            <button type="submit">Enviar</button>
          </form>
          <div class="zet-pet-tools">
            <button class="zet-pet-screen-btn" type="button">Ver minha tela</button>
            <span class="zet-pet-screen-status">Sem analise de tela ainda.</span>
          </div>
          <div class="zet-pet-footnote">Eu respondo sobre os assuntos deste projeto.</div>
        </div>
      </div>
      <div class="zet-pet-balloon" hidden></div>
      <button class="zet-pet-avatar" type="button" aria-label="Abrir conversa com o ZET">
        ${renderAvatar()}
      </button>
    </div>
  `;

  document.body.appendChild(root);

  /* ==========================================================================
     CLICK-THROUGH (Electron desktop)
     Quando o app de desktop está rodando, a janela cobre a tela toda mas é
     "atravessável" — cliques caem nos ícones do desktop. Aqui ligamos a captura
     do mouse só quando o ponteiro entra na área do ZET.
     ====================================================================== */
  if (window.zetAPI && typeof window.zetAPI.setMouseRegion === "function") {
    const setCapture = (on) => { try { window.zetAPI.setMouseRegion(on); } catch (_) {} };
    setCapture(false);
    root.addEventListener("mouseenter", () => setCapture(true), true);
    root.addEventListener("mouseleave", () => setCapture(false), true);
    // Quando arrastando, o mouse pode sair rapidinho do node — garantimos captura
    root.addEventListener("mousedown", () => setCapture(true), true);
  }

  const balloon = root.querySelector(".zet-pet-balloon");
  const avatar = root.querySelector(".zet-pet-avatar");
  const chat = root.querySelector(".zet-pet-chat");
  const closeBtn = root.querySelector(".zet-pet-chat-close");
  const muteBtn = root.querySelector(".zet-pet-chat-mute");
  const phrasesBtn = root.querySelector(".zet-pet-chat-phrases");
  const expandBtn = root.querySelector(".zet-pet-chat-expand");
  const messages = root.querySelector(".zet-pet-messages");
  const form = root.querySelector(".zet-pet-form");
  const input = form.querySelector("input");
  const screenBtn = root.querySelector(".zet-pet-screen-btn");
  const screenStatus = root.querySelector(".zet-pet-screen-status");
  const screenshotBtn = root.querySelector(".zet-pet-screenshot-btn");
  const attachmentBox = root.querySelector(".zet-pet-attachment");
  const attachmentImg = root.querySelector(".zet-pet-attachment-img");
  const attachmentRemove = root.querySelector(".zet-pet-attachment-remove");
  const colorPickers = root.querySelectorAll(".zet-pet-color-picker, .zet-pet-color-picker-inner");

  let isOpen = false;
  let isExpanded = false;
  const footnote = root.querySelector(".zet-pet-footnote");
  const runtimeConfig = window.ZET_CONFIG || {};
  const firstBalloonDelayMs = Math.max(0, Number(runtimeConfig.FIRST_BALLOON_DELAY_MS || 1000));
  const balloonIntervalMs = Math.max(5000, Number(runtimeConfig.BALLOON_INTERVAL_MS || 18000));
  const balloonHideDelayMs = Math.max(2000, Number(runtimeConfig.BALLOON_HIDE_DELAY_MS || 5200));
  let latestScreenAnalysis = null;
  let isScreenAnalyzing = false;

  function updateMuteButton() {
    if (isMuted) {
      muteBtn.textContent = "🔇";
      muteBtn.setAttribute("aria-label", "Ativar som");
      muteBtn.title = "Ativar som";
    } else {
      muteBtn.textContent = "🔊";
      muteBtn.setAttribute("aria-label", "Desativar som");
      muteBtn.title = "Desativar som";
    }
  }

  function updatePhrasesButton() {
    if (arePhrasesMuted) {
      phrasesBtn.textContent = "💤";
      phrasesBtn.setAttribute("aria-label", "Ativar frases");
      phrasesBtn.title = "Ativar frases";
    } else {
      phrasesBtn.textContent = "💬";
      phrasesBtn.setAttribute("aria-label", "Desativar frases");
      phrasesBtn.title = "Desativar frases";
    }
  }

  updateMuteButton();
  updatePhrasesButton();

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    localStorage.setItem("zet-muted", isMuted ? "true" : "");
    updateMuteButton();
    if (!isMuted) {
      playSound("robot-interact");
    }
  });

  phrasesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    arePhrasesMuted = !arePhrasesMuted;
    localStorage.setItem("zet-phrases-muted", arePhrasesMuted ? "true" : "");
    updatePhrasesButton();
    if (arePhrasesMuted) {
      hideBalloon();
    } else {
      playSound("robot-interact");
    }
  });

  expandBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isExpanded = !isExpanded;
    chat.classList.toggle("is-expanded", isExpanded);
    expandBtn.textContent = isExpanded ? "⋘" : "⤢";
    expandBtn.setAttribute("aria-label", isExpanded ? "Recolher conversa" : "Expandir conversa");
    expandBtn.title = isExpanded ? "Recolher" : "Expandir";
    if (isExpanded) messages.scrollTop = messages.scrollHeight;
  });

  let phraseIndex = 0;
  let balloonTimeout = 0;
  const chatHistory = [];

  function updateZetColor(colorKey) {
    if (ZET_COLORS[colorKey]) {
      currentColorKey = colorKey;
      root.style.setProperty("--zet-blue", ZET_COLORS[colorKey].body);
      avatar.innerHTML = renderAvatar();
    }
  }

  updateZetColor("azul");

  appendMessage("zet", kb.intro);
  setAssistantStatus("Pronto para responder sobre este projeto.");

  avatar.addEventListener("click", () => {
    isOpen = !isOpen;
    chat.hidden = !isOpen;
    if (isOpen) {
      root.querySelector(".zet-pet-node").classList.add("has-chat-open");
      hideBalloon();
      input.focus();
      playSound("robot-happy");
    } else {
      root.querySelector(".zet-pet-node").classList.remove("has-chat-open");
      playSound("robot-interact");
    }
  });

  closeBtn.addEventListener("click", () => {
    isOpen = false;
    chat.hidden = true;
    root.querySelector(".zet-pet-node").classList.remove("has-chat-open");
    playSound("robot-interact");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    playSound("robot-interact");
    await sendQuestion(text);
  });

  // 📸 — anexa print da tela à próxima mensagem (Gemini Vision interpreta)
  let pendingImage = null;
  function clearAttachment() {
    pendingImage = null;
    if (attachmentImg) attachmentImg.removeAttribute("src");
    if (attachmentBox) attachmentBox.hidden = true;
  }
  if (screenshotBtn && window.zetAPI && typeof window.zetAPI.captureScreen === "function") {
    screenshotBtn.addEventListener("click", async () => {
      const original = screenshotBtn.textContent;
      screenshotBtn.disabled = true;
      screenshotBtn.textContent = "⏳";
      try {
        const shot = await window.zetAPI.captureScreen();
        if (shot && shot.dataUrl) {
          pendingImage = { dataUrl: shot.dataUrl };
          attachmentImg.src = shot.dataUrl;
          attachmentBox.hidden = false;
          input.focus();
        }
      } catch (err) {
        console.error("[ZET] captureScreen falhou:", err);
      } finally {
        screenshotBtn.textContent = original;
        screenshotBtn.disabled = false;
      }
    });
  } else if (screenshotBtn) {
    screenshotBtn.hidden = true;
  }
  if (attachmentRemove) attachmentRemove.addEventListener("click", clearAttachment);

  // Esconde o botão antigo "Ver minha tela" — substituído por 📸 no chat
  const oldTools = root.querySelector(".zet-pet-tools");
  if (oldTools) oldTools.style.display = "none";

  screenBtn.addEventListener("click", async () => {
    if (isScreenAnalyzing) return;

    const draftedQuestion = input.value.trim();
    const autoQuestion = draftedQuestion || "Veja a minha tela atual, entenda o problema e me ajude a resolver.";

    try {
      await captureScreenContext();
      if (!draftedQuestion) {
        await sendQuestion(autoQuestion);
      } else {
        setScreenStatus("Tela analisada. Agora envie sua pergunta.");
        input.focus();
      }
    } catch (_) {
      input.focus();
    }
  });

  input.addEventListener("input", () => {
    playSound("keypress");
  });

  colorPickers.forEach(picker => {
    picker.addEventListener("click", (event) => {
      const btn = event.target.closest(".zet-color-dot");
      if (!btn) return;
      const nextColor = btn.dataset.color;
      if (nextColor) {
        updateZetColor(nextColor);
        playSound("robot-interact");
      }
    });
  });

  // Arrastar (drag and drop) o avatar + janela de chat
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;
  const node = root.querySelector(".zet-pet-node");
  const chatHeader = root.querySelector(".zet-pet-chat-header");

  [avatar, chatHeader].forEach(el => {
    if (!el) return;
    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: false });
  });

  function dragStart(e) {
    if (e.target.closest(".zet-pet-chat-close") || (e.target.closest("button") && !e.target.closest(".zet-pet-avatar")) || e.target.closest("input")) return;
    isDragging = false;
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    startX = clientX - translateX;
    startY = clientY - translateY;

    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);
  }

  function dragMove(e) {
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    if (Math.abs(dx - translateX) > 4 || Math.abs(dy - translateY) > 4) {
      isDragging = true;
    }

    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      translateX = dx;
      translateY = dy;
      node.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
  }

  function dragEnd() {
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("touchend", dragEnd);

    if (isDragging) {
      avatar.style.pointerEvents = "none";
      setTimeout(() => {
        avatar.style.pointerEvents = "auto";
      }, 50);
    }
  }

  const isDesktopApp = !!(window.zetAPI && typeof window.zetAPI.setMouseRegion === "function");
  const desktopPhrasesEnabled = runtimeConfig.ENABLE_DESKTOP_PHRASES !== false;
  if (!isDesktopApp || desktopPhrasesEnabled) {
    scheduleBalloon();
  } else {
    if (balloon) { balloon.hidden = true; balloon.classList.remove("is-visible", "attention-pulse"); }
  }

  /* ==========================================================================
     RESET DE POSIÇÃO ("voltar ao canto")
     Acionado pelo menu de contexto do avatar e pelo menu da bandeja (IPC).
     ====================================================================== */
  function resetZetPosition() {
    translateX = 0;
    translateY = 0;
    node.style.transform = "";
    playSound("robot-happy");
  }
  if (window.zetAPI && typeof window.zetAPI.onResetPosition === "function") {
    window.zetAPI.onResetPosition(resetZetPosition);
  }

  /* ==========================================================================
     MENU DE CONTEXTO (botão direito no avatar)
     ====================================================================== */
  const ctxMenu = document.createElement("div");
  ctxMenu.className = "zet-ctx-menu";
  ctxMenu.hidden = true;
  ctxMenu.style.cssText = [
    "position:fixed", "min-width:180px", "padding:6px",
    "background:#1b2436", "color:#fff", "border-radius:12px",
    "box-shadow:0 18px 40px rgba(0,0,0,0.32)",
    "font:0.85rem/1.35 Inter, Arial, sans-serif",
    "z-index:9999", "user-select:none"
  ].join(";");
  document.body.appendChild(ctxMenu);

  function buildCtxMenu() {
    const item = (label, onClick, opts) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.cssText = [
        "display:block", "width:100%", "text-align:left",
        "padding:8px 10px", "border:0", "border-radius:8px",
        "background:transparent", "color:#fff", "cursor:pointer",
        "font:inherit"
      ].join(";");
      if (opts && opts.danger) b.style.color = "#ffb4b4";
      b.onmouseenter = () => { b.style.background = "#2c3a55"; };
      b.onmouseleave = () => { b.style.background = "transparent"; };
      b.onclick = (e) => { e.stopPropagation(); hideCtxMenu(); onClick(); };
      return b;
    };
    const sep = () => {
      const s = document.createElement("div");
      s.style.cssText = "height:1px; background:#39455e; margin:4px 6px;";
      return s;
    };
    ctxMenu.innerHTML = "";
    ctxMenu.appendChild(item("🏠 Voltar ao canto", resetZetPosition));
    ctxMenu.appendChild(item(isOpen ? "💬 Fechar conversa" : "💬 Abrir conversa", () => avatar.click()));
    ctxMenu.appendChild(item(isMuted ? "🔊 Ativar som" : "🔇 Silenciar", () => muteBtn.click()));
    ctxMenu.appendChild(item(arePhrasesMuted ? "💬 Ativar frases" : "💤 Silenciar frases", () => phrasesBtn.click()));
    ctxMenu.appendChild(sep());
    ["azul","limao","amarelo","laranja","vermelho"].forEach(c => {
      ctxMenu.appendChild(item(`🎨 Cor: ${c}`, () => { updateZetColor(c); playSound("robot-interact"); }));
    });
    if (window.zetAPI && window.zetAPI.quitApp) {
      ctxMenu.appendChild(sep());
      ctxMenu.appendChild(item("❌ Sair do ZET", () => window.zetAPI.quitApp(), { danger: true }));
    }
  }
  function showCtxMenu(x, y) {
    buildCtxMenu();
    ctxMenu.hidden = false;
    // posicionamento com clamp pra não sair da tela
    const w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    ctxMenu.style.left = Math.min(x, vw - w - 4) + "px";
    ctxMenu.style.top = Math.min(y, vh - h - 4) + "px";
  }
  function hideCtxMenu() { ctxMenu.hidden = true; }
  avatar.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY);
  });
  document.addEventListener("click", hideCtxMenu);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideCtxMenu(); });

  /* ==========================================================================
     AUTO-UPDATE (desktop) — integra com window.zetAPI exposto pelo preload.
     Fluxo: update disponível → banner com botão "Atualizar" → usuário aceita →
     download (com progresso) → "Reiniciar para atualizar" → instala e reabre.
     ====================================================================== */
  if (window.zetAPI && typeof window.zetAPI.onUpdateAvailable === "function") {
    const banner = document.createElement("div");
    banner.className = "zet-update-banner";
    banner.hidden = true;
    // display:none inicial (o atributo [hidden] sozinho não basta quando há
    // display inline). Trocamos para display:flex só quando o banner aparece.
    banner.style.cssText = [
      "position:absolute", "right:0", "bottom:108px", "width:min(300px, calc(100vw - 28px))",
      "padding:12px 14px", "border-radius:16px", "background:#1b2436", "color:#fff",
      "box-shadow:0 14px 34px rgba(0,0,0,0.28)", "font-size:0.85rem", "line-height:1.45",
      "z-index:93", "flex-direction:column", "gap:8px", "display:none"
    ].join(";");
    node.appendChild(banner);

    const setBanner = (html) => {
      banner.innerHTML = html;
      banner.hidden = false;
      banner.style.display = "flex";
    };
    const hideBanner = () => { banner.hidden = true; banner.style.display = "none"; };

    window.zetAPI.onUpdateAvailable((info) => {
      const v = (info && info.version) ? ` (v${info.version})` : "";
      setBanner(
        `<strong>✨ Atualização disponível${v}</strong>` +
        `<div style="display:flex; gap:8px;">` +
        `<button class="zet-upd-yes" style="flex:1; padding:8px; border:0; border-radius:10px; background:var(--zet-blue); color:#fff; font-weight:700; cursor:pointer;">Atualizar</button>` +
        `<button class="zet-upd-no" style="padding:8px 10px; border:0; border-radius:10px; background:#3a465c; color:#cfd8e6; cursor:pointer;">Agora não</button>` +
        `</div>`
      );
      banner.querySelector(".zet-upd-yes").onclick = () => {
        setBanner(`<strong>⬇️ Baixando atualização…</strong><div class="zet-upd-pct">0%</div>`);
        window.zetAPI.downloadUpdate();
      };
      banner.querySelector(".zet-upd-no").onclick = hideBanner;
    });

    if (typeof window.zetAPI.onUpdateProgress === "function") {
      window.zetAPI.onUpdateProgress((p) => {
        const pct = banner.querySelector(".zet-upd-pct");
        if (pct && p && typeof p.percent === "number") pct.textContent = `${Math.round(p.percent)}%`;
      });
    }

    window.zetAPI.onUpdateDownloaded(() => {
      setBanner(
        `<strong>✅ Atualização pronta!</strong>` +
        `<button class="zet-upd-install" style="padding:8px; border:0; border-radius:10px; background:var(--zet-blue); color:#fff; font-weight:700; cursor:pointer;">Reiniciar e instalar</button>`
      );
      banner.querySelector(".zet-upd-install").onclick = () => window.zetAPI.installUpdate();
    });
  }

  async function sendQuestion(text) {
    appendMessage("user", text);

    if (isDashboardUpdateCommand(text)) {
      if (typeof window.refreshDashboardData === "function") {
        setAssistantStatus("Atualizando dados da planilha...");
        appendMessage("zet", "Claro. Vou buscar a planilha novamente e atualizar os indicadores do dashboard agora.");
        try {
          await window.refreshDashboardData();
          appendMessage("zet", "Atualização concluída. Os dados visíveis do dashboard foram recarregados a partir da planilha.");
          setAssistantStatus("Dashboard atualizado.");
        } catch (error) {
          console.error("[ZET] atualização do dashboard falhou:", error);
          appendMessage("zet", "Tentei atualizar a planilha, mas encontrei um erro. Verifique se a planilha está publicada e acessível.");
          setAssistantStatus("Falha ao atualizar dados.");
        }
      } else {
        appendMessage("zet", "Ainda não encontrei a função de atualização do dashboard nesta página.");
        setAssistantStatus("Atualização indisponível.");
      }
      return;
    }

    isThinking = true;
    avatar.innerHTML = renderAvatar();
    setAssistantStatus("Consultando a IA...");

    const reply = await askAgent(text);

    isThinking = false;
    avatar.innerHTML = renderAvatar();
    appendMessage("zet", reply);
  }

  function isDashboardUpdateCommand(text) {
    const q = normalize(text || "");
    return (
      q === "atualize" ||
      q === "atualizar" ||
      q.includes("atualize os dados") ||
      q.includes("atualizar dados") ||
      q.includes("atualize a planilha") ||
      q.includes("recarregue a planilha") ||
      q.includes("buscar planilha")
    );
  }

  function setAssistantStatus(text) {
    if (footnote) footnote.textContent = text;
  }

  function setScreenStatus(text) {
    if (screenStatus) screenStatus.textContent = text;
  }

  function setScreenAnalyzing(active) {
    isScreenAnalyzing = active;
    if (screenBtn) {
      screenBtn.disabled = active;
      screenBtn.textContent = active ? "Lendo a tela..." : "Ver minha tela";
    }
  }

  async function captureScreenContext() {
    if (!window.zetAPI || typeof window.zetAPI.analyzeScreen !== "function") {
      throw new Error("Analise de tela indisponivel neste ambiente.");
    }

    setScreenAnalyzing(true);
    setAssistantStatus("Analisando sua tela...");
    setScreenStatus("Capturando tela e extraindo texto...");

    try {
      const analysis = await window.zetAPI.analyzeScreen();
      latestScreenAnalysis = analysis;

      const excerpt = (analysis && analysis.excerpt) ? analysis.excerpt.split("\n").slice(0, 3).join(" | ") : "";
      if (excerpt) {
        setScreenStatus(`Tela lida: ${excerpt.slice(0, 120)}`);
      } else {
        setScreenStatus("Tela capturada, mas com pouco texto detectado.");
      }
      setAssistantStatus("Tela analisada. Pronto para ajudar.");
      return analysis;
    } catch (error) {
      console.error("[ZET] analyzeScreen falhou:", error);
      latestScreenAnalysis = null;
      setScreenStatus("Nao consegui ler a tela agora.");
      setAssistantStatus("Falha ao analisar a tela.");
      throw error;
    } finally {
      setScreenAnalyzing(false);
    }
  }

  /* ==========================================================================
     ATERRAMENTO (grounding) — lê o que o usuário está vendo na tela.
     Assim o contexto do ZET nunca é genérico: ele só fala do conteúdo visível.
     O container é configurável por data-zet-context-selector (padrão: <main>).
     ====================================================================== */
  function collectPageContext() {
    const selector = document.body.dataset.zetContextSelector || "main";
    const el = document.querySelector(selector) || document.body;

    const title = (document.title || "").trim();
    const headings = Array.from(el.querySelectorAll("h1, h2, h3"))
      .map(h => (h.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 12);

    let text;
    if (el === document.body) {
      // No fallback para <body>, clona e remove o próprio widget do ZET
      const clone = el.cloneNode(true);
      clone.querySelectorAll(".zet-pet, .zet-lightbox, script, style, noscript")
        .forEach(n => n.remove());
      text = clone.textContent || "";
    } else {
      // innerText respeita o que está realmente visível na tela
      text = el.innerText || el.textContent || "";
    }
    text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    const MAX = 6000;
    if (text.length > MAX) text = text.slice(0, MAX) + "…";

    const configuredProjectContext = (runtimeConfig.PROJECT_CONTEXT || "").trim();
    const screenContext = latestScreenAnalysis && latestScreenAnalysis.excerpt
      ? [
          "Analise manual da tela atual:",
          `Capturada em: ${latestScreenAnalysis.capturedAt || "agora"}`,
          `Texto identificado na tela:`,
          latestScreenAnalysis.excerpt
        ].join("\n")
      : "";

    if (configuredProjectContext) {
      text = [
        `Projeto: ${runtimeConfig.PROJECT_NAME || "ZET"}`,
        configuredProjectContext,
        screenContext,
        text ? `Conteúdo visível da tela:\n${text}` : ""
      ].filter(Boolean).join("\n\n");
    } else if (screenContext) {
      text = [
        screenContext,
        text
      ].filter(Boolean).join("\n\n");
    }

    return { title, headings, text };
  }

  async function askAgent(text) {
    try {
      // No app desktop, o backend é uma URL absoluta (window.ZET_CONFIG.BACKEND_URL,
      // definida em config.js). Fallback para /api/zet no modo web.
      const endpoint = runtimeConfig.BACKEND_URL || "/api/zet";
      const maxAttempts = Math.max(1, Number(runtimeConfig.RETRY_ATTEMPTS || 0) + 1);
      const timeoutMs = Math.max(5000, Number(runtimeConfig.REQUEST_TIMEOUT_MS || 20000));
      const attachedImage = pendingImage;
      const payload = {
        message: text,
        history: chatHistory.map(msg => ({
          role: msg.role === "zet" ? "model" : "user",
          text: msg.text
        })),
        lessonKey,
        pageType,
        lessonTitle: kb.title,
        pageContext: collectPageContext(),
        screenContext: latestScreenAnalysis,
        image: attachedImage ? attachedImage.dataUrl : undefined
      };

      let lastError = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await postToAssistant(endpoint, payload, timeoutMs);

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`HTTP ${response.status} ${body.slice(0, 160)}`);
          }

          const data = await response.json();
          if (data && data.text) {
            setAssistantStatus("IA conectada.");
            if (attachedImage) clearAttachment();
            return data.text;
          }
          if (data && data.error) throw new Error("backend: " + data.error);
          throw new Error("Empty response");
        } catch (error) {
          lastError = error;
          if (attempt < maxAttempts) {
            setAssistantStatus("Conexão instável. Tentando novamente...");
            await wait(500 * attempt);
          }
        }
      }

      throw lastError || new Error("Assistant request failed");
    } catch (err) {
      console.error("[ZET] askAgent falhou:", err);
      isThinking = false;
      avatar.innerHTML = renderAvatar();
      setAssistantStatus("IA offline. Respondendo no modo local.");
      return "_(modo offline — IA indisponível)_\n\n" + localAnswer(text);
    }
  }

  async function postToAssistant(endpoint, payload, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);

    try {
      return await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  /* ==========================================================================
     CUSTOMIZE 2 — RESPOSTAS OFFLINE (fallback sem API)
     Use normalize(text) e cheque palavras-chave. Mantenha respostas curtas.
     Suporta markdown leve: **negrito**, *itálico*, __sublinhado__, listas "- ".
     ====================================================================== */
  function localAnswer(text) {
    const q = normalize(text);

    if (q.includes("ola") || q.includes("oi") || q.includes("bom dia") || q.includes("boa tarde")) {
      return "Olá! 👋 Que bom falar com você. Como posso ajudar por aqui?";
    }
    if (q.includes("como voce esta") || q.includes("como vc esta") || q.includes("tudo bem")) {
      return "Estou bem e pronto para te ajudar com este projeto. Se quiser, posso explicar como o app funciona ou investigar algum problema específico.";
    }
    if (q.includes("ajuda") || q.includes("fazer") || q.includes("pode")) {
      return "Eu posso te ajudar a **navegar** e tirar dúvidas sobre este projeto. É só perguntar!";
    }
    return "Estou aqui para ajudar com os assuntos deste projeto. Pode me perguntar à vontade! 😊";
  }

  function formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/__([^_]+)__/g, "<u>$1</u>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/\b_([^_]+)_\b/g, "<em>$1</em>");

    const lines = html.split("\n");
    let result = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        if (!inList) {
          result += `<ul>`;
          inList = true;
        }
        result += `<li>${content}</li>`;
      } else {
        if (inList) {
          result += `</ul>`;
          inList = false;
        }
        if (trimmed) {
          result += `<p>${trimmed}</p>`;
        }
      }
    }
    if (inList) {
      result += `</ul>`;
    }
    return result;
  }

  function appendMessage(role, text) {
    const item = document.createElement("div");
    item.className = `zet-pet-message is-${role}`;
    if (role === "zet") {
      item.innerHTML = formatMarkdown(text);
    } else {
      item.textContent = text;
    }
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    chatHistory.push({ role, text });
  }

  let isFirstPhrase = true;

  function scheduleBalloon() {
    window.setTimeout(() => {
      if (!isOpen && !arePhrasesMuted) showPhrase();
    }, firstBalloonDelayMs);
    window.setInterval(() => {
      if (isOpen || arePhrasesMuted) return;
      showPhrase();
    }, balloonIntervalMs);
  }

  function showPhrase() {
    if (arePhrasesMuted) return;
    const contextPhrases = kb.phrases || [];
    const allPhrases = [...contextPhrases, ...GLOBAL_PHRASES];

    if (isFirstPhrase) {
      phraseIndex = 0;
      isFirstPhrase = false;

      const knockHand = document.createElement("div");
      knockHand.className = "zet-knock-hand is-knocking";
      knockHand.textContent = "✊";
      node.appendChild(knockHand);

      avatar.classList.add("is-knocking-body");

      playSound("knock");
      playSound("robot-interact");

      balloon.classList.add("attention-pulse");

      setTimeout(() => {
        knockHand.remove();
        avatar.classList.remove("is-knocking-body");
      }, 1300);
    } else {
      phraseIndex = (phraseIndex + 1) % allPhrases.length;
      balloon.classList.remove("attention-pulse");
    }

    balloon.textContent = allPhrases[phraseIndex];
    balloon.hidden = false;
    balloon.classList.add("is-visible");
    window.clearTimeout(balloonTimeout);
    balloonTimeout = window.setTimeout(() => {
      hideBalloon();
    }, balloonHideDelayMs);
  }

  function hideBalloon() {
    balloon.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!balloon.classList.contains("is-visible")) {
        balloon.hidden = true;
      }
    }, 220);
  }

  function normalize(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function buildInnovationPhrases() {
    const openers = [
      "Papert nos lembra que",
      "Na inovação educacional, vale lembrar que",
      "Uma boa prática inspirada em Papert é:",
      "Quando a aprendizagem vira projeto,",
      "Em educação criativa,",
      "Na cultura maker,",
      "Ao pensar em tecnologia na escola,",
      "Para inovar com sentido,",
      "No espírito do construcionismo,",
      "Quando o estudante coloca a mão na massa,"
    ];

    const ideas = [
      "o aluno aprende melhor quando constrói algo que faz sentido para ele.",
      "errar faz parte do processo e ajuda a refinar o pensamento.",
      "programar pode ser uma forma de pensar, testar e criar hipóteses.",
      "um projeto bem escolhido transforma curiosidade em investigação.",
      "a tecnologia tem mais valor quando amplia autoria e não só consumo.",
      "aprender junto fortalece repertório, confiança e colaboração.",
      "perguntas boas movem mais do que respostas prontas.",
      "o conhecimento ganha força quando vira experiência compartilhável.",
      "criar, testar e revisar faz parte de uma aprendizagem viva.",
      "a escola pode ser um laboratório de invenção e propósito.",
      "a criatividade cresce quando há espaço para explorar caminhos próprios.",
      "o aluno se engaja mais quando vê utilidade no que produz."
    ];

    const zoomLinks = [
      "Isso conversa bem com uma educação voltada a projetos reais.",
      "Essa visão aproxima teoria, prática e autonomia.",
      "É um bom lembrete para transformar aula em experiência.",
      "Esse olhar ajuda a desenhar trilhas mais significativas.",
      "Assim a tecnologia deixa de ser enfeite e vira ferramenta cognitiva.",
      "Essa lógica fortalece protagonismo estudantil e inovação com propósito.",
      "Esse princípio combina muito com robótica, programação e cultura maker.",
      "É um jeito potente de conectar aprendizagem e mundo real.",
      "Isso ajuda a pensar a sala de aula como espaço de criação.",
      "Essa ideia favorece uma educação mais humana, criativa e investigativa."
    ];

    const phrases = [];
    for (const opener of openers) {
      for (const idea of ideas) {
        for (const link of zoomLinks.slice(0, 1)) {
          phrases.push(`${opener} ${idea} ${link}`);
        }
      }
    }

    const specialPhrases = [
      "Papert defendia que crianças podem aprender conceitos complexos quando têm contexto, liberdade e ferramentas para criar.",
      "Inovar na educação não é usar mais telas; é criar mais situações de autoria, investigação e reflexão.",
      "Uma escola inovadora abre espaço para projetos que nascem de perguntas reais dos estudantes.",
      "Construcionismo é transformar ideia em objeto, teste em aprendizado e erro em descoberta.",
      "Robótica educacional faz mais sentido quando o foco é pensamento, colaboração e resolução de problemas.",
      "Quando o estudante explica o que construiu, ele também reorganiza o que aprendeu.",
      "Tecnologia educacional de verdade aproxima criação, imaginação e pensamento crítico.",
      "Papert inspira uma educação em que aprender é experimentar, construir, compartilhar e melhorar.",
      "Projetos autorais ajudam alunos a enxergar valor no próprio raciocínio.",
      "Inovação com propósito nasce quando ensinar e criar caminham juntos."
    ];

    return Array.from(new Set([...phrases, ...specialPhrases])).slice(0, 130);
  }

  function renderAvatar() {
    const colors = ZET_COLORS[currentColorKey];
    const thinkingDots = isThinking ? `
      <g class="zet-pet-thinking-dots">
        <circle cx="38" cy="18" r="2.2" fill="#ffffff" class="zet-think-dot zet-think-dot-1"></circle>
        <circle cx="44" cy="18" r="2.2" fill="#ffffff" class="zet-think-dot zet-think-dot-2"></circle>
        <circle cx="50" cy="18" r="2.2" fill="#ffffff" class="zet-think-dot zet-think-dot-3"></circle>
      </g>
    ` : "";

    const eyesHtml = isThinking ? `
      <circle cx="36" cy="46" r="3.2" fill="#ffffff"></circle>
      <circle cx="52" cy="46" r="3.2" fill="#ffffff"></circle>
    ` : `
      <rect x="33" y="39" width="6" height="15" rx="3" fill="#ffffff" class="zet-pet-eye"></rect>
      <rect x="49" y="39" width="6" height="15" rx="3" fill="#ffffff" class="zet-pet-eye"></rect>
    `;

    return `
      <svg viewBox="0 0 88 94" role="img" aria-label="ZET">
        <g class="zet-pet-body">
          <rect x="23" y="25" width="42" height="42" rx="14" fill="none" stroke="${colors.aura}" stroke-width="2" class="zet-pet-aura zet-pet-aura-1"></rect>
          <rect x="23" y="25" width="42" height="42" rx="14" fill="none" stroke="${colors.aura}" stroke-width="2" class="zet-pet-aura zet-pet-aura-2"></rect>
          <rect x="23" y="25" width="42" height="42" rx="14" fill="none" stroke="${colors.aura}" stroke-width="2" class="zet-pet-aura zet-pet-aura-3"></rect>
          <circle cx="44" cy="8" r="2.7" fill="${colors.spark}" class="zet-pet-spark"></circle>
          <line x1="44" y1="11" x2="44" y2="25" stroke="${colors.body}" stroke-width="2.4" stroke-linecap="round"></line>
          <rect x="23" y="25" width="42" height="42" rx="14" fill="${colors.body}"></rect>
          ${eyesHtml}
          ${thinkingDots}
        </g>
      </svg>
    `;
  }

  function initImageLightbox() {
    const lightbox = document.createElement("div");
    lightbox.className = "zet-lightbox";
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <button class="zet-lightbox-close" type="button" aria-label="Fechar ampliação">×</button>
      <div class="zet-lightbox-content">
        <img src="" alt="Imagem ampliada">
      </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector(".zet-lightbox-content img");
    const closeBtn = lightbox.querySelector(".zet-lightbox-close");

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "Imagem ampliada";
      lightbox.hidden = false;
      lightbox.classList.add("is-active");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-active");
      setTimeout(() => {
        if (!lightbox.classList.contains("is-active")) {
          lightbox.hidden = true;
          lightboxImg.src = "";
        }
      }, 250);
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("zet-lightbox-content")) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
      }
    });

    function setupImages() {
      const images = document.querySelectorAll("img");
      images.forEach(img => {
        if (img.closest(".zet-pet") || img.closest(".zet-pet-chat")) return;
        img.classList.add("zet-lightbox-trigger");
        img.title = "Clique para ampliar";
        img.addEventListener("click", () => {
          openLightbox(img.src, img.alt);
        });
      });
    }

    setupImages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initImageLightbox);
  } else {
    initImageLightbox();
  }
})();
