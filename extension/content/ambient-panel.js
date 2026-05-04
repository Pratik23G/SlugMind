console.log('[SlugMind] ambient-panel.js injected successfully');

(function () {
  'use strict';
  if (location.protocol === 'chrome:') return;
  if (window.__slugmindLoaded) return;
  window.__slugmindLoaded = true;
  console.log('[SlugMind] ambient-panel loaded, listening...');

  const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

  const EMOJI = {
    'ph-envelope':         '✉️',
    'ph-warning':          '⚠️',
    'ph-timer':            '⏱️',
    'ph-check-circle':     '✅',
    'ph-check':            '✅',
    'ph-x':                '✕',
    'ph-paper-plane-tilt': '📨',
    'ph-calendar-plus':    '📅',
    'ph-calendar':         '📅',
    'ph-brain':            '🧠',
    'ph-video-camera':     '🎥',
    'ph-alarm':            '⏰',
    'ph-bell':             '🔔',
    'ph-pencil-simple':    '✏️',
  };

  function ph(icon) { return EMOJI[icon] || '·'; }

  function injectCSS() {
    if (document.getElementById('slugmind-css')) return;
    const s = document.createElement('style');
    s.id = 'slugmind-css';
    s.textContent = `
      #slugmind-ambient * { box-sizing: border-box; }
      .sm-panel {
        pointer-events: all;
        width: 320px;
        background: #0f1117;
        border-left: 3px solid #7c3aed;
        border-radius: 12px 0 0 12px;
        padding: 16px;
        box-shadow: -4px 0 32px rgba(0,0,0,0.55);
        color: #f1f5f9;
        font-family: ${FONT};
        font-size: 14px;
        line-height: 1.5;
        will-change: transform, opacity;
      }
      .sm-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 11px;
      }
      .sm-panel-title {
        display: flex;
        align-items: center;
        gap: 7px;
        font-weight: 700;
        font-size: 13px;
        color: #e2e8f0;
        letter-spacing: -0.1px;
      }
      .sm-close {
        background: none;
        border: none;
        color: #475569;
        cursor: pointer;
        padding: 0 2px;
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        transition: color 0.15s;
        font-family: ${FONT};
      }
      .sm-close:hover { color: #94a3b8; }
      .sm-divider { text-align: center; font-size: 11px; font-weight: 600; margin: 5px 0; }
      .sm-event-block { background: #1e293b; border-radius: 8px; padding: 9px 11px; margin-bottom: 5px; }
      .sm-event-name { font-weight: 600; font-size: 13px; color: #e2e8f0; }
      .sm-event-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
      .sm-draft-box {
        background: #1e293b; border-radius: 8px; padding: 10px; font-size: 12px;
        color: #cbd5e1; line-height: 1.6; max-height: 90px; overflow-y: auto;
        white-space: pre-wrap; word-break: break-word;
      }
      .sm-draft-area {
        width: 100%; background: #1e293b; border: 1.5px solid #6366f1;
        border-radius: 8px; padding: 10px; font-size: 12px; color: #e2e8f0;
        line-height: 1.6; resize: vertical; min-height: 72px; font-family: ${FONT};
      }
      .sm-section-label {
        font-size: 11px; font-weight: 600; color: #7c3aed;
        text-transform: uppercase; letter-spacing: 0.5px; margin: 10px 0 6px;
      }
      .sm-actions { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
      .sm-btn {
        padding: 7px 13px; border-radius: 8px; cursor: pointer; font-size: 12px;
        font-weight: 600; font-family: ${FONT}; transition: opacity 0.15s, background 0.15s;
        display: inline-flex; align-items: center; gap: 5px; border: none; white-space: nowrap;
      }
      .sm-btn:hover { opacity: 0.82; }
      .sm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .sm-btn-primary { background: #6366f1; color: #fff; }
      .sm-btn-success { background: #059669; color: #fff; }
      .sm-btn-muted   { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
      .sm-btn-ghost   { background: transparent; color: #64748b; border: 1px solid #2d3748; }
      .sm-alt-option {
        display: flex; align-items: center; gap: 8px; padding: 7px 10px;
        background: #1e293b; border-radius: 8px; margin-bottom: 4px; cursor: pointer;
        font-size: 12px; color: #e2e8f0; border: 1.5px solid transparent; transition: border-color 0.15s;
      }
      .sm-alt-option:has(input:checked) { border-color: #7c3aed; }
      .sm-alt-option input { accent-color: #7c3aed; }
      .sm-overflow {
        pointer-events: all; align-self: flex-end; background: #7c3aed; color: #fff;
        font-size: 11px; font-weight: 600; padding: 4px 14px;
        border-radius: 999px 0 0 999px; cursor: pointer; font-family: ${FONT};
        border: none; margin-right: 0; transition: background 0.15s;
      }
      .sm-overflow:hover { background: #6d28d9; }

      /* ── Floating button ──────────────────────────────────────────────────── */
      #sm-float-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #7C3AED;
        z-index: 2147483646;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        color: #fff;
        box-shadow: 0 4px 24px rgba(124,58,237,0.5);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        font-family: ${FONT};
        outline: none;
        padding: 0;
      }
      #sm-float-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 28px rgba(124,58,237,0.75);
      }
      #sm-float-btn.focus-active {
        animation: smBtnPulse 2s ease-in-out infinite;
      }
      @keyframes smBtnPulse {
        0%, 100% { box-shadow: 0 4px 24px rgba(124,58,237,0.5); }
        50% { box-shadow: 0 0 0 10px rgba(124,58,237,0), 0 4px 24px rgba(124,58,237,0.5); }
      }
      #sm-float-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #EF4444;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        border: 2px solid #7C3AED;
        font-family: ${FONT};
        line-height: 1;
      }
      #sm-float-badge.visible { display: flex; }

      /* ── Expandable panel ─────────────────────────────────────────────────── */
      #sm-float-panel {
        position: fixed;
        bottom: 86px;
        right: 24px;
        width: 320px;
        max-height: 520px;
        background: #0F1117;
        border: 1.5px solid #7C3AED;
        border-radius: 16px;
        z-index: 2147483646;
        overflow-y: auto;
        display: none;
        flex-direction: column;
        box-shadow: 0 8px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(124,58,237,0.15);
        font-family: ${FONT};
        color: #F1F5F9;
        font-size: 14px;
        scrollbar-width: thin;
        scrollbar-color: #374151 transparent;
      }
      #sm-float-panel::-webkit-scrollbar { width: 4px; }
      #sm-float-panel::-webkit-scrollbar-track { background: transparent; }
      #sm-float-panel::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
      #sm-float-panel.open {
        display: flex;
        animation: smSlideUp 0.22s cubic-bezier(.16,1,.3,1) forwards;
      }
      @keyframes smSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .sm-fp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 12px;
        flex-shrink: 0;
      }
      .sm-fp-logo { display: flex; align-items: center; gap: 7px; }
      .sm-fp-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 10px 16px 12px;
        flex-shrink: 0;
      }
      .sm-fp-stat { text-align: center; padding: 4px 0; }
      .sm-fp-stat-border { border-left: 1px solid #1F2937; }
      .sm-fp-stat-val { font-size: 20px; font-weight: 700; color: #fff; line-height: 1.2; }
      .sm-fp-stat-lbl { font-size: 11px; color: #6B7280; margin-top: 2px; }
      .sm-fp-divider { height: 1px; background: #1F2937; flex-shrink: 0; }
      .sm-fp-section { padding: 12px 16px; flex-shrink: 0; }
      .sm-fp-section-label {
        font-size: 10px; font-weight: 700; color: #7C3AED;
        text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 10px;
      }
      .sm-fp-presets { display: flex; gap: 6px; margin-bottom: 8px; }
      .sm-fp-preset {
        flex: 1; padding: 6px 8px; border-radius: 8px;
        border: 1.5px solid #374151; background: #1E293B; color: #94A3B8;
        font-size: 12px; font-weight: 600; cursor: pointer;
        transition: all 0.15s; font-family: ${FONT};
      }
      .sm-fp-preset:hover { border-color: #7C3AED; color: #E2E8F0; }
      .sm-fp-preset.active { border-color: #7C3AED; background: rgba(124,58,237,0.15); color: #A855F7; }
      .sm-fp-focus-btn {
        width: 100%; margin-top: 8px; padding: 8px;
        background: #7C3AED; color: #fff; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer; font-family: ${FONT};
        transition: background 0.15s;
      }
      .sm-fp-focus-btn:hover { background: #6D28D9; }
      .sm-fp-focus-btn.stop { background: #1E293B; color: #EF4444; border: 1.5px solid #EF4444; }
      .sm-fp-focus-btn.stop:hover { background: rgba(239,68,68,0.1); }
      .sm-fp-section.focus-pulsing {
        border: 1.5px solid #7C3AED;
        border-radius: 12px;
        animation: smFocusBorder 2s ease-in-out infinite;
      }
      @keyframes pulseBtnAnim {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
      }
      .sm-btn-pulse { animation: pulseBtnAnim 1s ease-in-out infinite; }
      @keyframes smFocusBorder {
        0%, 100% { border-color: #7C3AED; }
        50% { border-color: #A855F7; box-shadow: 0 0 12px rgba(124,58,237,0.25); }
      }
      .sm-fp-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px 14px;
        border-top: 1px solid #1F2937;
        flex-shrink: 0;
      }
      .sm-fp-footer-link {
        font-size: 12px; color: #7C3AED; text-decoration: none; font-weight: 500;
      }
      .sm-fp-footer-link:hover { text-decoration: underline; }
      .sm-fp-kb-hint {
        font-size: 10px; color: #4B5563; background: #1E293B;
        padding: 2px 6px; border-radius: 4px; border: 1px solid #374151;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    const dayPart = isToday ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dayPart} · ${timePart}`;
  }

  function fmtMins(minutes) {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // ── AmbientPanel (alert panels that slide from the right) ────────────────────
  class AmbientPanel {
    constructor() {
      this.active = [];
      this.queue = [];
      this.MAX = 3;
      injectCSS();
      this._buildContainer();
    }

    _buildContainer() {
      const c = document.createElement('div');
      c.id = 'slugmind-ambient';
      Object.assign(c.style, {
        position: 'fixed', right: '0', top: '0',
        height: '100vh', zIndex: '2147483647',
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: '10px',
        padding: '20px 0',
      });
      document.body.appendChild(c);
      this.container = c;
    }

    show(cfg) {
      if (this.active.length >= this.MAX) {
        this.queue.push(cfg);
        this._refreshOverflow();
        this._updateBadge();
        return;
      }
      this._mount(cfg);
    }

    _mount(cfg) {
      const panel = this._build(cfg);
      this.active.push(panel);
      this.container.appendChild(panel);
      panel.style.transform = 'translateX(104%)';
      panel.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        panel.style.transition = 'transform 0.38s cubic-bezier(.16,1,.3,1), opacity 0.3s ease';
        panel.style.transform = 'translateX(0)';
        panel.style.opacity = '1';
      }));
      this._updateBadge();
    }

    dismiss(panel) {
      panel.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      panel.style.transform = 'translateX(110%)';
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.remove();
        this.active = this.active.filter(p => p !== panel);
        if (this.queue.length > 0) this._mount(this.queue.shift());
        this._refreshOverflow();
        this._updateBadge();
        if (this.active.length === 0 && this.queue.length === 0) {
          try { chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }); } catch {}
        }
      }, 220);
    }

    _updateBadge() {
      const count = this.active.length + this.queue.length;
      if (window.slugmindFloating) window.slugmindFloating.updateBadge(count);
    }

    _refreshOverflow() {
      let b = this.container.querySelector('.sm-overflow');
      if (this.queue.length === 0) { if (b) b.remove(); return; }
      if (!b) {
        b = document.createElement('button');
        b.className = 'sm-overflow';
        b.onclick = () => {
          if (this.queue.length && this.active.length < this.MAX) {
            this._mount(this.queue.shift());
            this._refreshOverflow();
          }
        };
        this.container.appendChild(b);
      }
      b.textContent = `+${this.queue.length} more`;
    }

    _build(cfg) {
      switch (cfg.type) {
        case 'email':    return this._email(cfg);
        case 'conflict': return this._conflict(cfg);
        case 'reminder': return this._reminder(cfg);
        default:         return this._generic(cfg);
      }
    }

    _shell(color) {
      const p = document.createElement('div');
      p.className = 'sm-panel';
      p.style.borderLeftColor = color || '#7c3aed';
      return p;
    }

    _header(icon, title, color, panel) {
      const row = document.createElement('div');
      row.className = 'sm-panel-header';
      const left = document.createElement('div');
      left.className = 'sm-panel-title';
      left.style.color = color || '#e2e8f0';
      left.textContent = `${ph(icon)}  ${title}`;
      const x = document.createElement('button');
      x.className = 'sm-close';
      x.textContent = ph('ph-x');
      x.onclick = () => this.dismiss(panel);
      row.appendChild(left); row.appendChild(x);
      return row;
    }

    _btn(label, cls, onClick) {
      const b = document.createElement('button');
      b.className = `sm-btn ${cls}`;
      b.textContent = label;
      b.onclick = onClick;
      return b;
    }

    _actions(...btns) {
      const r = document.createElement('div');
      r.className = 'sm-actions';
      btns.forEach(b => r.appendChild(b));
      return r;
    }

    _email(cfg) {
      const panel = this._shell('#6366f1');
      panel.appendChild(this._header('ph-envelope', 'New email', '#a5b4fc', panel));

      if (cfg.priority === 'high') {
        const badge = document.createElement('span');
        badge.textContent = 'URGENT';
        badge.style.cssText = 'display:inline-block;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:0.5px;margin-bottom:6px;';
        panel.appendChild(badge);
      } else if (cfg.priority === 'medium') {
        const badge = document.createElement('span');
        badge.textContent = 'Medium priority';
        badge.style.cssText = 'display:inline-block;background:rgba(245,158,11,0.2);color:#F59E0B;font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;letter-spacing:0.3px;margin-bottom:6px;border:1px solid rgba(245,158,11,0.3);';
        panel.appendChild(badge);
      }

      const from = document.createElement('div');
      from.style.cssText = 'font-weight:600;font-size:13px;color:#e2e8f0;margin-bottom:2px;';
      from.textContent = cfg.from || 'Unknown';
      panel.appendChild(from);

      if (cfg.subject) {
        const subj = document.createElement('div');
        subj.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        subj.textContent = cfg.subject;
        panel.appendChild(subj);
      }

      const gmailLink = document.createElement('a');
      gmailLink.href = `https://mail.google.com/mail/u/0/#inbox/${cfg.threadId || cfg.emailId || ''}`;
      gmailLink.target = '_blank';
      gmailLink.rel = 'noopener';
      gmailLink.style.cssText = 'display:inline-block;font-size:11px;color:#6366f1;text-decoration:none;margin-bottom:9px;';
      gmailLink.textContent = 'Open in Gmail →';
      gmailLink.onmouseover = () => { gmailLink.style.textDecoration = 'underline'; };
      gmailLink.onmouseout  = () => { gmailLink.style.textDecoration = 'none'; };
      panel.appendChild(gmailLink);

      if (cfg.preview) {
        const prev = document.createElement('div');
        prev.style.cssText = 'font-size:12px;color:#94a3b8;margin-bottom:9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
        prev.textContent = cfg.preview;
        panel.appendChild(prev);
      }

      const draftLabel = document.createElement('div');
      draftLabel.className = 'sm-section-label';
      draftLabel.textContent = 'AI Draft';
      panel.appendChild(draftLabel);

      const draftBox = document.createElement('div');
      draftBox.className = 'sm-draft-box';
      draftBox.textContent = cfg.draft || '';
      panel.appendChild(draftBox);

      const editArea = document.createElement('textarea');
      editArea.className = 'sm-draft-area';
      editArea.value = cfg.draft || '';
      editArea.style.display = 'none';
      panel.appendChild(editArea);

      let editing = false;

      const sendBtn = this._btn(`${ph('ph-paper-plane-tilt')} Send Reply`, 'sm-btn-primary', () => {
        const body = editing ? editArea.value : (cfg.draft || '');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending…';
        chrome.runtime.sendMessage({
          type: 'SEND_DRAFT',
          emailId: cfg.emailId, messageId: cfg.messageId,
          threadId: cfg.threadId, to: cfg.to,
          subject: cfg.subject, draftText: body,
        }, (resp) => {
          if (resp?.ok) {
            sendBtn.textContent = '✅ Sent!';
            setTimeout(() => this.dismiss(panel), 1200);
          } else {
            sendBtn.disabled = false;
            sendBtn.textContent = `${ph('ph-paper-plane-tilt')} Send Reply`;
          }
        });
      });

      const editBtn = this._btn(`${ph('ph-pencil-simple')} Edit Reply`, 'sm-btn-muted', () => {
        editing = !editing;
        draftBox.style.display = editing ? 'none' : '';
        editArea.style.display = editing ? '' : 'none';
        if (editing) {
          editBtn.textContent = '✅ Done';
          editArea.focus();
        } else {
          editBtn.textContent = `${ph('ph-pencil-simple')} Edit Reply`;
          draftBox.textContent = editArea.value;
        }
      });

      const dismissBtn = this._btn(`${ph('ph-x')} Ignore`, 'sm-btn-ghost', () => this.dismiss(panel));
      panel.appendChild(this._actions(sendBtn, editBtn, dismissBtn));
      return panel;
    }

    _conflict(cfg) {
      const panel = this._shell('#ef4444');
      panel.appendChild(this._header('ph-warning', 'Schedule Conflict', '#fca5a5', panel));

      const block = (ev, highlight) => {
        const d = document.createElement('div');
        d.className = 'sm-event-block';
        if (highlight) d.style.borderLeft = '3px solid #ef4444';
        const name = document.createElement('div');
        name.className = 'sm-event-name';
        name.textContent = ev.title || ev.summary || '(untitled)';
        const time = document.createElement('div');
        time.className = 'sm-event-time';
        time.textContent = fmtTime(ev.start);
        d.appendChild(name); d.appendChild(time);
        return d;
      };

      panel.appendChild(block(cfg.event1 || {}, false));
      const vs = document.createElement('div');
      vs.className = 'sm-divider';
      vs.style.color = '#ef4444';
      vs.textContent = cfg.conflictType === 'hard' ? '⚡ overlaps with' : '⚡ back-to-back';
      panel.appendChild(vs);
      panel.appendChild(block(cfg.event2 || {}, true));

      const altSection   = document.createElement('div');
      const draftSection = document.createElement('div');
      panel.appendChild(altSection);
      panel.appendChild(draftSection);

      const reschedBtn = this._btn(`${ph('ph-calendar-plus')} Reschedule`, 'sm-btn-primary', () => {
        reschedBtn.disabled = true;
        reschedBtn.textContent = 'Finding times…';
        const alts = cfg.alternatives || [];
        if (alts.length) {
          this._renderAlts(cfg, altSection, draftSection);
          reschedBtn.disabled = false;
          reschedBtn.textContent = `${ph('ph-calendar-plus')} Reschedule`;
        } else {
          try {
            chrome.runtime.sendMessage({ type: 'GET_RESCHEDULE_OPTIONS', event1: cfg.event1, event2: cfg.event2 }, resp => {
              cfg.alternatives = resp?.alternatives || [];
              this._renderAlts(cfg, altSection, draftSection);
              reschedBtn.disabled = false;
              reschedBtn.textContent = `${ph('ph-calendar-plus')} Reschedule`;
            });
          } catch {
            reschedBtn.disabled = false;
            reschedBtn.textContent = `${ph('ph-calendar-plus')} Reschedule`;
          }
        }
      });

      const emailBtn = this._btn(`${ph('ph-envelope')} Email Attendees`, 'sm-btn-muted', () => {
        emailBtn.disabled = true;
        emailBtn.textContent = 'Drafting…';
        try {
          chrome.runtime.sendMessage({
            type: 'DRAFT_CONFLICT_EMAIL',
            event1: cfg.event1, event2: cfg.event2,
            attendees: cfg.attendees || [],
            alternatives: cfg.alternatives || [],
          }, resp => {
            emailBtn.disabled = false;
            emailBtn.textContent = `${ph('ph-envelope')} Email Attendees`;
            if (resp?.draft) this._draftSection(draftSection, resp.draft, cfg);
          });
        } catch { emailBtn.disabled = false; }
      });

      const ignoreBtn = this._btn(`${ph('ph-x')} Ignore`, 'sm-btn-ghost', () => this.dismiss(panel));
      panel.appendChild(this._actions(reschedBtn, emailBtn, ignoreBtn));
      return panel;
    }

    _renderAlts(cfg, section, draftSection) {
      section.innerHTML = '';
      const alts = cfg.alternatives || [];
      const label = document.createElement('div');
      label.className = 'sm-section-label';
      label.textContent = alts.length ? 'Pick a time:' : 'No alternatives found.';
      section.appendChild(label);
      if (!alts.length) return;

      const name = `sm-alt-${Date.now()}`;
      alts.forEach((alt, i) => {
        const row = document.createElement('label');
        row.className = 'sm-alt-option';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = name; radio.value = i;
        radio.style.accentColor = '#7c3aed';
        row.appendChild(radio);
        row.appendChild(document.createTextNode(alt.label || `${alt.date} ${alt.time}`));
        section.appendChild(row);
      });

      const go = this._btn(`${ph('ph-paper-plane-tilt')} Draft reschedule email`, 'sm-btn-primary', () => {
        const sel = section.querySelector(`input[name="${name}"]:checked`);
        if (!sel) return;
        go.disabled = true; go.textContent = 'Drafting…';
        try {
          chrome.runtime.sendMessage({
            type: 'DRAFT_RESCHEDULE_EMAIL',
            event: cfg.event2, attendees: cfg.attendees || [],
            newTime: alts[parseInt(sel.value)],
          }, resp => {
            go.disabled = false;
            go.textContent = `${ph('ph-paper-plane-tilt')} Draft reschedule email`;
            if (resp?.draft) this._draftSection(draftSection, resp.draft, cfg);
          });
        } catch { go.disabled = false; }
      });
      section.appendChild(go);
    }

    _draftSection(section, draft, cfg) {
      section.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'sm-section-label';
      label.textContent = 'Email Draft';
      section.appendChild(label);
      const area = document.createElement('textarea');
      area.className = 'sm-draft-area';
      area.value = draft;
      section.appendChild(area);
      const sendBtn = this._btn(`${ph('ph-paper-plane-tilt')} Send`, 'sm-btn-success', () => {
        try {
          chrome.runtime.sendMessage({
            type: 'SEND_PLAIN_EMAIL',
            body: area.value,
            to: (cfg.attendees || []).join(', '),
            subject: `Re: ${cfg.event2?.title || cfg.event2?.summary || 'Schedule'}`,
          });
        } catch {}
        section.innerHTML = '<div style="color:#22c55e;font-size:12px;padding:6px 0;">✅ Sent!</div>';
        setTimeout(() => { section.innerHTML = ''; }, 2500);
      });
      section.appendChild(sendBtn);
    }

    _reminder(cfg) {
      const ev = cfg.event || {};
      const urgency = cfg.urgency || 'low';
      const mins = cfg.minsUntil || 0;
      const isZoom = ev.meetLink && ev.meetLink.includes('zoom.us');

      const URGENCY_STYLE = {
        low:    { border: '#F59E0B', titleColor: '#fcd34d', header: `Starting in ${mins} min` },
        medium: { border: '#F97316', titleColor: '#fdba74', header: `Starting in ${mins} min` },
        high:   { border: '#EF4444', titleColor: '#fca5a5', header: `Starting in ${mins} min — join now` },
      };
      const style = URGENCY_STYLE[urgency] || URGENCY_STYLE.low;

      const panel = this._shell(style.border);
      panel.appendChild(this._header('ph-timer', style.header, style.titleColor, panel));

      const title = document.createElement('div');
      title.style.cssText = 'font-size:15px;font-weight:700;color:#e2e8f0;margin-bottom:5px;';
      title.textContent = ev.title || ev.summary || 'Event';
      panel.appendChild(title);

      const time = document.createElement('div');
      time.style.cssText = 'font-size:12px;color:#94a3b8;margin-bottom:12px;';
      time.textContent = fmtTime(ev.start);
      panel.appendChild(time);

      const btns = [];
      if (ev.meetLink) {
        const joinLabel = isZoom ? 'Join Zoom' : 'Join Meeting';
        const joinBtn = this._btn(`${ph('ph-video-camera')} ${joinLabel}`, 'sm-btn-primary', () => {
          window.open(ev.meetLink, '_blank');
          this.dismiss(panel);
        });
        if (urgency === 'high') joinBtn.classList.add('sm-btn-pulse');
        btns.push(joinBtn);
      }
      btns.push(this._btn(`${ph('ph-alarm')} Snooze 5 min`, 'sm-btn-muted', () => {
        this.dismiss(panel);
        setTimeout(() => this.show({ ...cfg }), 5 * 60 * 1000);
      }));
      btns.push(this._btn(`${ph('ph-x')} Dismiss`, 'sm-btn-ghost', () => {
        try { chrome.runtime.sendMessage({ type: 'MARK_REMINDER_DISMISSED', eventId: ev.id }); } catch {}
        this.dismiss(panel);
      }));
      panel.appendChild(this._actions(...btns));

      // Auto-dismiss for non-urgent reminders
      if (urgency === 'low')    setTimeout(() => this.dismiss(panel), 30000);
      else if (urgency === 'medium') setTimeout(() => this.dismiss(panel), 20000);

      return panel;
    }

    _generic(cfg) {
      const panel = this._shell('#7c3aed');
      panel.appendChild(this._header('ph-bell', cfg.title || 'SlugMind', '#a78bfa', panel));
      if (cfg.body) {
        const b = document.createElement('div');
        b.style.cssText = 'font-size:13px;color:#94a3b8;margin-bottom:10px;';
        b.textContent = cfg.body;
        panel.appendChild(b);
      }
      panel.appendChild(this._actions(
        this._btn(`${ph('ph-x')} Dismiss`, 'sm-btn-ghost', () => this.dismiss(panel))
      ));
      return panel;
    }
  }

  // ── FloatingWidget ───────────────────────────────────────────────────────────
  class FloatingWidget {
    constructor(panelRef) {
      this.panelRef = panelRef;
      this.isOpen = false;
      this._btn = null;
      this._badge = null;
      this._panel = null;
      this._countdownInterval = null;
      this._selectedMins = 25;
      this._focusActive = false;
      this._build();
      this._listenOutside();
      this._listenKeyboard();
      this._initFocusState();
      this._restoreOpenState();
    }

    _build() {
      this._buildBtn();
      this._buildPanel();
    }

    _buildBtn() {
      const btn = document.createElement('button');
      btn.id = 'sm-float-btn';
      btn.title = 'SlugMind (Ctrl+Shift+S)';
      const logoCircle = document.createElement('div');
      logoCircle.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      const logoInner = document.createElement('div');
      logoInner.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#fff;';
      logoCircle.appendChild(logoInner);
      btn.appendChild(logoCircle);

      const badge = document.createElement('span');
      badge.id = 'sm-float-badge';
      btn.appendChild(badge);
      this._badge = badge;

      btn.addEventListener('click', e => { e.stopPropagation(); this._toggle(); });
      document.body.appendChild(btn);
      this._btn = btn;
    }

    _buildPanel() {
      const panel = document.createElement('div');
      panel.id = 'sm-float-panel';

      // Header
      const header = document.createElement('div');
      header.className = 'sm-fp-header';

      const logo = document.createElement('div');
      logo.className = 'sm-fp-logo';
      const spiral = document.createElement('div');
      spiral.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid #7C3AED;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      const spiralInner = document.createElement('div');
      spiralInner.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#7C3AED;';
      spiral.appendChild(spiralInner);
      const name = document.createElement('span');
      name.textContent = 'SlugMind';
      name.style.cssText = 'font-weight:700;color:#fff;font-size:14px;';
      const dot = document.createElement('span');
      dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;flex-shrink:0;';
      logo.appendChild(spiral); logo.appendChild(name); logo.appendChild(dot);

      const headerRight = document.createElement('div');
      headerRight.style.cssText = 'display:flex;align-items:center;gap:7px;';
      const pendingBadge = document.createElement('span');
      pendingBadge.id = 'sm-fp-pending-badge';
      pendingBadge.style.cssText = 'display:none;background:#7C3AED;color:#fff;font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;';
      const minimizeBtn = document.createElement('button');
      minimizeBtn.textContent = '−';
      minimizeBtn.style.cssText = `background:none;border:none;color:#6B7280;cursor:pointer;font-size:20px;line-height:1;padding:0;font-family:${FONT};`;
      minimizeBtn.addEventListener('click', e => { e.stopPropagation(); this._close(); });
      headerRight.appendChild(pendingBadge); headerRight.appendChild(minimizeBtn);
      header.appendChild(logo); header.appendChild(headerRight);
      panel.appendChild(header);

      // Divider
      panel.appendChild(this._mkDivider());

      // Stats row
      const statsRow = document.createElement('div');
      statsRow.className = 'sm-fp-stats';
      const emailStat = this._mkStat('sm-fp-stat-emails', '—', 'Emails drafted');
      const focusStat = this._mkStat('sm-fp-stat-focus', '—', 'Focus today');
      focusStat.classList.add('sm-fp-stat-border');
      statsRow.appendChild(emailStat);
      statsRow.appendChild(focusStat);
      panel.appendChild(statsRow);

      panel.appendChild(this._mkDivider());

      // Focus timer section
      const focusSection = document.createElement('div');
      focusSection.className = 'sm-fp-section';
      focusSection.id = 'sm-fp-focus-section';
      this._buildFocusSection(focusSection);
      panel.appendChild(focusSection);

      panel.appendChild(this._mkDivider());

      // Tasks section
      const tasksSection = document.createElement('div');
      tasksSection.className = 'sm-fp-section';
      this._buildTasksSection(tasksSection);
      panel.appendChild(tasksSection);

      panel.appendChild(this._mkDivider());

      // Upcoming section
      const upcomingSection = document.createElement('div');
      upcomingSection.className = 'sm-fp-section';
      this._buildUpcomingSection(upcomingSection);
      panel.appendChild(upcomingSection);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'sm-fp-footer';
      const dashLink = document.createElement('a');
      dashLink.className = 'sm-fp-footer-link';
      dashLink.textContent = 'Open Dashboard →';
      dashLink.target = '_blank';
      dashLink.rel = 'noopener';
      try {
        chrome.storage.sync.get('dashboardUrl', d => {
          dashLink.href = d.dashboardUrl || 'https://slug-mind.vercel.app';
        });
      } catch { dashLink.href = '#'; }
      const kbHint = document.createElement('span');
      kbHint.className = 'sm-fp-kb-hint';
      kbHint.textContent = 'Ctrl+Shift+S';
      const testLink = document.createElement('span');
      testLink.textContent = 'Test alert';
      testLink.style.cssText = 'font-size:11px;color:#374151;cursor:pointer;margin-top:5px;display:block;';
      testLink.addEventListener('click', () => {
        this.panelRef.show({
          type:    'email',
          emailId: 'demo-' + Date.now(),
          from:    'Prof. Smith <smith@ucsc.edu>',
          subject: 'RE: Office Hours Tomorrow',
          preview: 'Sure, come by at 2pm. Looking forward to discussing your project.',
          draft:   "Thank you Professor, I'll be there.",
        });
      });
      footer.appendChild(dashLink);
      footer.appendChild(kbHint);
      footer.appendChild(testLink);
      panel.appendChild(footer);

      document.body.appendChild(panel);
      this._panel = panel;
    }

    _mkStat(id, val, lbl) {
      const div = document.createElement('div');
      div.className = 'sm-fp-stat';
      const v = document.createElement('div');
      v.className = 'sm-fp-stat-val';
      v.id = id;
      v.textContent = val;
      const l = document.createElement('div');
      l.className = 'sm-fp-stat-lbl';
      l.textContent = lbl;
      div.appendChild(v); div.appendChild(l);
      return div;
    }

    _buildFocusSection(container) {
      container.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'sm-fp-section-label';
      label.textContent = 'Focus Timer';
      container.appendChild(label);

      const presetRow = document.createElement('div');
      presetRow.className = 'sm-fp-presets';
      [{ m: 25, t: '25m' }, { m: 45, t: '45m' }, { m: 0, t: 'Custom' }].forEach(({ m, t }) => {
        const btn = document.createElement('button');
        btn.className = 'sm-fp-preset' + (m === this._selectedMins ? ' active' : '');
        btn.textContent = t;
        btn.dataset.mins = m;
        btn.addEventListener('click', () => {
          presetRow.querySelectorAll('.sm-fp-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._selectedMins = m;
          customWrap.style.display = m === 0 ? 'block' : 'none';
        });
        presetRow.appendChild(btn);
      });
      container.appendChild(presetRow);

      const customWrap = document.createElement('div');
      customWrap.style.cssText = 'display:none;margin-bottom:6px;';
      const customInput = document.createElement('input');
      customInput.type = 'number';
      customInput.placeholder = 'minutes';
      customInput.min = 1; customInput.max = 240;
      customInput.id = 'sm-fp-custom-mins';
      customInput.style.cssText = `width:100%;background:#1E293B;border:1.5px solid #374151;border-radius:8px;padding:7px 10px;color:#fff;font-size:13px;outline:none;font-family:${FONT};box-sizing:border-box;`;
      customWrap.appendChild(customInput);
      container.appendChild(customWrap);

      const countdownEl = document.createElement('div');
      countdownEl.id = 'sm-fp-countdown';
      countdownEl.style.cssText = 'display:none;text-align:center;font-size:24px;font-weight:700;color:#A855F7;padding:8px 0 4px;letter-spacing:1px;font-variant-numeric:tabular-nums;';
      container.appendChild(countdownEl);

      const focusBtn = document.createElement('button');
      focusBtn.id = 'sm-fp-focus-btn';
      focusBtn.className = 'sm-fp-focus-btn' + (this._focusActive ? ' stop' : '');
      focusBtn.textContent = this._focusActive ? 'Stop Focus' : 'Start Focus';
      focusBtn.addEventListener('click', () => {
        if (this._focusActive) {
          try { chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, () => {}); } catch {}
          this.setFocusMode(false);
        } else {
          let mins = this._selectedMins;
          if (mins === 0) {
            const inp = document.getElementById('sm-fp-custom-mins');
            mins = parseInt(inp?.value) || 25;
          }
          const endTime = Date.now() + mins * 60 * 1000;
          try { chrome.runtime.sendMessage({ type: 'START_FOCUS', duration: mins }, () => {}); } catch {}
          this.setFocusMode(true, endTime);
        }
      });
      container.appendChild(focusBtn);
    }

    _buildTasksSection(container) {
      const sectionHeader = document.createElement('div');
      sectionHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';
      const label = document.createElement('div');
      label.className = 'sm-fp-section-label';
      label.style.margin = '0';
      label.textContent = 'Tasks';
      const viewAll = document.createElement('a');
      viewAll.style.cssText = 'font-size:11px;color:#7C3AED;text-decoration:none;font-weight:500;';
      viewAll.textContent = 'View all →';
      viewAll.target = '_blank'; viewAll.rel = 'noopener';
      viewAll.onmouseover = () => viewAll.style.textDecoration = 'underline';
      viewAll.onmouseout  = () => viewAll.style.textDecoration = 'none';
      try {
        chrome.storage.sync.get('dashboardUrl', d => {
          viewAll.href = d.dashboardUrl || 'https://slug-mind.vercel.app';
        });
      } catch { viewAll.href = '#'; }
      sectionHeader.appendChild(label); sectionHeader.appendChild(viewAll);
      container.appendChild(sectionHeader);

      const tasksList = document.createElement('div');
      tasksList.id = 'sm-fp-tasks-list';
      container.appendChild(tasksList);

      const quickAdd = document.createElement('div');
      quickAdd.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
      const taskInput = document.createElement('input');
      taskInput.type = 'text';
      taskInput.id = 'sm-fp-task-input';
      taskInput.placeholder = 'Add a task...';
      taskInput.style.cssText = `flex:1;background:#1E293B;border:1.5px solid #374151;border-radius:8px;padding:7px 10px;color:#fff;font-size:12px;outline:none;font-family:${FONT};`;
      taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') this._addTask(taskInput.value); });
      const addBtn = document.createElement('button');
      addBtn.textContent = '+';
      addBtn.style.cssText = 'background:#7C3AED;color:#fff;border:none;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      addBtn.addEventListener('click', () => this._addTask(taskInput.value));
      quickAdd.appendChild(taskInput); quickAdd.appendChild(addBtn);
      container.appendChild(quickAdd);
    }

    _buildUpcomingSection(container) {
      const label = document.createElement('div');
      label.className = 'sm-fp-section-label';
      label.textContent = 'Upcoming';
      container.appendChild(label);
      const list = document.createElement('div');
      list.id = 'sm-fp-events-list';
      container.appendChild(list);
    }

    _mkDivider() {
      const d = document.createElement('div');
      d.className = 'sm-fp-divider';
      return d;
    }

    _toggle() {
      if (this.isOpen) this._close();
      else this._open();
    }

    _open() {
      this.isOpen = true;
      this._panel.classList.add('open');
      this._loadData();
      this._initFocusState();
      try { chrome.storage.session.set({ smPanelOpen: true }); } catch {}
    }

    _close() {
      this.isOpen = false;
      this._panel.classList.remove('open');
      try { chrome.storage.session.set({ smPanelOpen: false }); } catch {}
    }

    _restoreOpenState() {
      try {
        chrome.storage.session.get('smPanelOpen', d => {
          if (d.smPanelOpen) this._open();
        });
      } catch {}
    }

    _listenOutside() {
      document.addEventListener('click', e => {
        if (!this.isOpen) return;
        if (this._panel.contains(e.target) || this._btn.contains(e.target)) return;
        this._close();
      }, true);
    }

    _listenKeyboard() {
      document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          this._toggle();
        }
      });
    }

    _loadData() {
      try {
        chrome.storage.local.get(['actionLog', 'tasks', 'upcomingEvents', 'calendarEvents'], data => {
          this._refreshStats(data.actionLog || []);
          this._refreshTasks(data.tasks || []);
          this._refreshEvents(data.upcomingEvents || data.calendarEvents || []);
        });
      } catch {}
      fetch('https://slugmind.vercel.app/api/activity')
        .then(r => r.json())
        .then(data => {
          const emailsEl = this._panel.querySelector('#sm-fp-stat-emails');
          const focusEl  = this._panel.querySelector('#sm-fp-stat-focus');
          if (emailsEl) emailsEl.textContent = data.stats?.emailsDrafted ?? 0;
          if (focusEl)  focusEl.textContent  = (data.stats?.focusMinutes ?? 0) + 'm';
        })
        .catch(() => {});
    }

    _refreshStats(log) {
      const today = new Date().toDateString();
      const todayLog = log.filter(e => new Date(e.timestamp).toDateString() === today);
      const emails = todayLog.filter(e => e.type === 'email_drafted' || e.type === 'email_sent').length;
      const focusMins = todayLog
        .filter(e => e.type === 'focus_ended')
        .reduce((sum, e) => sum + (e.duration || 0), 0);
      const emailsEl = this._panel.querySelector('#sm-fp-stat-emails');
      const focusEl  = this._panel.querySelector('#sm-fp-stat-focus');
      if (emailsEl) emailsEl.textContent = emails;
      if (focusEl)  focusEl.textContent = fmtMins(focusMins);
    }

    _refreshTasks(tasks) {
      const list = this._panel.querySelector('#sm-fp-tasks-list');
      if (!list) return;
      const items = tasks.filter(t => t.bucket === 'today' && !t.completedAt).slice(0, 3);
      list.innerHTML = '';
      if (items.length === 0) {
        list.innerHTML = `<div style="font-size:12px;color:#6B7280;padding:4px 0;">No tasks for today ✓</div>`;
        return;
      }
      items.forEach(task => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 0;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.style.cssText = 'accent-color:#7C3AED;width:14px;height:14px;cursor:pointer;flex-shrink:0;';
        cb.addEventListener('change', () => {
          try {
            chrome.runtime.sendMessage({ type: 'UPDATE_TASK', task: { id: task.id, completedAt: Date.now() } }, () => {
              this._loadData();
            });
          } catch {}
        });
        const title = document.createElement('span');
        title.textContent = task.title;
        title.style.cssText = 'font-size:13px;color:#E2E8F0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        row.appendChild(cb); row.appendChild(title);
        list.appendChild(row);
      });
    }

    _refreshEvents(events) {
      const list = this._panel.querySelector('#sm-fp-events-list');
      if (!list) return;
      const now = Date.now();
      const upcoming = (events || [])
        .filter(e => new Date(e.start).getTime() > now)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 2);
      list.innerHTML = '';
      if (upcoming.length === 0) {
        list.innerHTML = `<div style="font-size:12px;color:#6B7280;padding:4px 0;">No upcoming events</div>`;
        return;
      }
      upcoming.forEach(ev => {
        const card = document.createElement('div');
        card.style.cssText = 'background:#1E293B;border-radius:8px;padding:8px 10px;margin-bottom:5px;';
        const title = document.createElement('div');
        title.textContent = ev.title || ev.summary || 'Event';
        title.style.cssText = 'font-size:13px;font-weight:600;color:#E2E8F0;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const time = document.createElement('div');
        time.textContent = fmtTime(ev.start);
        time.style.cssText = 'font-size:11px;color:#94A3B8;';
        card.appendChild(title); card.appendChild(time);
        const link = ev.meetLink || ev.hangoutLink || ev.conferenceData?.entryPoints?.[0]?.uri;
        if (link) {
          const joinBtn = document.createElement('button');
          joinBtn.textContent = 'Join';
          joinBtn.style.cssText = 'margin-top:6px;background:#7C3AED;color:#fff;border:none;border-radius:6px;padding:4px 11px;font-size:11px;font-weight:600;cursor:pointer;';
          joinBtn.addEventListener('click', () => window.open(link, '_blank'));
          card.appendChild(joinBtn);
        }
        list.appendChild(card);
      });
    }

    _addTask(value) {
      const title = (value || '').trim();
      if (!title) return;
      try {
        chrome.runtime.sendMessage({ type: 'ADD_TASK', task: { title, bucket: 'today' } }, () => {
          this._loadData();
        });
        const inp = document.getElementById('sm-fp-task-input');
        if (inp) inp.value = '';
      } catch {}
    }

    _initFocusState() {
      try {
        chrome.storage.session.get(['focusMode', 'focusEnd'], d => {
          if (d.focusMode) this.setFocusMode(true, d.focusEnd);
          else this.setFocusMode(false);
        });
      } catch {}
    }

    setFocusMode(active, endsAt) {
      this._focusActive = active;
      if (active) {
        this._btn.classList.add('focus-active');
        this._startCountdown(endsAt);
      } else {
        this._btn.classList.remove('focus-active');
        this._stopCountdown();
        const focusBtn = this._panel.querySelector('#sm-fp-focus-btn');
        if (focusBtn) { focusBtn.textContent = 'Start Focus'; focusBtn.classList.remove('stop'); }
        const cd = this._panel.querySelector('#sm-fp-countdown');
        if (cd) cd.style.display = 'none';
        const sec = this._panel.querySelector('#sm-fp-focus-section');
        if (sec) sec.classList.remove('focus-pulsing');
      }
    }

    _startCountdown(endsAt) {
      const focusBtn = this._panel.querySelector('#sm-fp-focus-btn');
      const cd       = this._panel.querySelector('#sm-fp-countdown');
      const sec      = this._panel.querySelector('#sm-fp-focus-section');

      if (focusBtn) focusBtn.classList.add('stop');
      if (cd)  cd.style.display = 'none';
      if (sec) sec.classList.add('focus-pulsing');

      this._stopCountdown();
      const tick = () => {
        const rem = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0;
        const m = Math.floor(rem / 60), s = rem % 60;
        const timeStr = endsAt ? ` · ${m}:${s < 10 ? '0' : ''}${s}` : '';
        if (focusBtn) focusBtn.textContent = `Stop${timeStr}`;
        if (rem === 0 && this._countdownInterval) {
          clearInterval(this._countdownInterval);
          this._countdownInterval = null;
        }
      };
      tick();
      this._countdownInterval = setInterval(tick, 1000);
    }

    _stopCountdown() {
      if (this._countdownInterval) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
      }
    }

    updateBadge(count) {
      if (this._badge) {
        if (count > 0) {
          this._badge.textContent = String(count);
          this._badge.classList.add('visible');
        } else {
          this._badge.classList.remove('visible');
        }
      }
      const pb = this._panel ? this._panel.querySelector('#sm-fp-pending-badge') : null;
      if (pb) {
        if (count > 0) {
          pb.textContent = `${count} pending`;
          pb.style.display = 'inline-block';
        } else {
          pb.style.display = 'none';
        }
      }
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  window.slugmindPanel    = new AmbientPanel();
  window.slugmindFloating = new FloatingWidget(window.slugmindPanel);

  function showEmailAlert(msg) {
    window.slugmindPanel.show({
      type:      'email',
      emailId:   msg.emailId,
      messageId: msg.messageId,
      threadId:  msg.threadId,
      from:      msg.from,
      subject:   msg.subject,
      preview:   msg.preview,
      draft:     msg.draft,
      to:        msg.to,
    });
  }

  function showConflictAlert(msg) {
    window.slugmindPanel.show({
      type:         'conflict',
      conflictType: msg.conflictType,
      event1:       msg.event1 || msg.eventA,
      event2:       msg.event2 || msg.eventB,
      alternatives: msg.alternatives || [],
      attendees:    msg.attendees || [],
    });
  }

  function showReminder(msg) {
    window.slugmindPanel.show({
      type:      'reminder',
      minsUntil: msg.minsUntil || 0,
      urgency:   msg.urgency   || 'low',
      event: {
        id:       msg.eventId   || msg.event?.id,
        title:    msg.title     || msg.event?.title,
        meetLink: msg.meetLink  || msg.event?.meetLink,
        start:    msg.event?.start,
      },
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('[SlugMind] message received:', msg.type);
    if (!window.slugmindPanel) { sendResponse({ success: false }); return true; }

    if (msg.type === 'SHOW_EMAIL_ALERT')    { showEmailAlert(msg);   sendResponse({ success: true }); }
    if (msg.type === 'SHOW_CONFLICT_ALERT') { showConflictAlert(msg); sendResponse({ success: true }); }
    if (msg.type === 'SHOW_REMINDER')       { showReminder(msg);      sendResponse({ success: true }); }
    if (msg.type === 'FOCUS_MODE_CHANGED' && window.slugmindFloating) {
      window.slugmindFloating.setFocusMode(msg.active, msg.endsAt);
      sendResponse({ success: true });
    }
    return true;
  });
})();
