(function () {
  'use strict';

  const STORAGE_KEY = 'careerForge.analyses.v1';

  const SECTIONS = [
    { key: 'required',         label: 'REQUIRED_QUALIFICATIONS' },
    { key: 'preferred',        label: 'PREFERRED_QUALIFICATIONS' },
    { key: 'tools',            label: 'TOOLS_AND_SOFTWARE' },
    { key: 'responsibilities', label: 'CORE_RESPONSIBILITIES' },
    { key: 'have',             label: 'ALREADY_HAVE' },
    { key: 'learn',            label: 'NEED_TO_LEARN' },
  ];

  const EXAMPLE_JOB = `Junior UX Designer — Lumen Health

We are looking for a Junior UX Designer to help shape our patient-facing mobile app. You will work closely with senior designers, product managers, and engineers to turn healthcare workflows into simple, calm, accessible experiences.

Responsibilities
- Design user flows, wireframes, and prototypes for iOS and Android
- Run usability tests with 5–8 participants per round and synthesize findings
- Contribute to and maintain our Figma design system
- Partner with engineering to hand off specs and review implementation
- Present design work to cross-functional stakeholders

Required
- 1–2 years of UX design experience, or a strong portfolio of student/side projects
- Proficiency in Figma
- Understanding of user-centered design and basic interaction patterns
- Experience running or observing at least a few usability sessions
- Excellent written and verbal communication

Preferred
- Exposure to healthcare, wellness, or regulated industries
- Basic knowledge of HTML/CSS
- Familiarity with accessibility standards (WCAG)
- Motion design skills (Principle, After Effects, or similar)

Tools we use: Figma, FigJam, Notion, Linear, Zoom, Maze.`;

  const EXAMPLE_BACKGROUND = `Recent design bootcamp graduate. Built 3 mobile app case studies in Figma (a habit tracker, a recipe app, and a transit app). Comfortable with Figma auto-layout and basic components. Ran 2 rounds of moderated usability tests on my capstone project with 5 people each. Know basic HTML and CSS from a self-taught course. No professional design job yet. Interested in health, wellness, and calm consumer products.`;

  // ---------- storage ----------
  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addAnalysis(entry) {
    const list = loadAll();
    list.unshift(entry);
    saveAll(list);
  }

  function getAnalysis(id) {
    return loadAll().find(function (a) { return a.id === id; });
  }

  function deleteAnalysis(id) {
    saveAll(loadAll().filter(function (a) { return a.id !== id; }));
  }

  // ---------- prompt builder ----------
  function buildPrompt(job, company, background) {
    const companyLine = company && company.trim()
      ? 'Company: ' + company.trim() + '\n\n'
      : '';

    const sectionLabels = SECTIONS.map(function (s) { return s.label; });

    return (
'I want you to analyze a job listing and compare it against my current background.\n\n' +
'Return your answer using EXACTLY the format described at the end of this message. ' +
'Use the section headers exactly as shown. Under each header, put one item per line, ' +
'starting with a hyphen and a space ("- "). Do not add extra commentary outside the sections. ' +
'If a section has no items, still include the header and write "- (none)" underneath.\n\n' +
'--- JOB LISTING ---\n' +
companyLine +
job.trim() + '\n' +
'--- END JOB LISTING ---\n\n' +
'--- MY BACKGROUND ---\n' +
background.trim() + '\n' +
'--- END MY BACKGROUND ---\n\n' +
'Instructions:\n' +
'1. REQUIRED_QUALIFICATIONS: list only qualifications the listing marks as required, must-have, or minimum. One per line.\n' +
'2. PREFERRED_QUALIFICATIONS: list only qualifications marked preferred, nice-to-have, bonus, or plus.\n' +
'3. TOOLS_AND_SOFTWARE: list every specific tool, software, platform, or named technology mentioned in the listing.\n' +
'4. CORE_RESPONSIBILITIES: list the concrete day-to-day responsibilities and duties.\n' +
'5. ALREADY_HAVE: from the required + preferred lists, list skills my stated background clearly shows I already have. Be honest and specific.\n' +
'6. NEED_TO_LEARN: from the required + preferred lists, list skills or experience I do not clearly have based on my background. Be specific about the gap.\n\n' +
'Return exactly this format, and nothing else:\n\n' +
sectionLabels.map(function (name) {
  return '===' + name + '===\n- item\n- item';
}).join('\n\n') + '\n\n===END===\n'
    );
  }

  // ---------- response parser ----------
  // Robust to: extra whitespace, different bullet chars, wrapped lines, missing sections.
  function parseResponse(text) {
    const result = {};
    SECTIONS.forEach(function (s) { result[s.key] = []; });

    if (!text || !text.trim()) return { ok: false, data: result, reason: 'Response is empty.' };

    const labelToKey = {};
    SECTIONS.forEach(function (s) { labelToKey[s.label] = s.key; });

    // Normalise line endings
    const lines = text.replace(/\r\n?/g, '\n').split('\n');

    // Match header lines like: ===REQUIRED_QUALIFICATIONS===
    // Also tolerate variations: "**REQUIRED_QUALIFICATIONS**", "REQUIRED_QUALIFICATIONS:",
    // "# REQUIRED_QUALIFICATIONS", stray leading/trailing spaces or extra "=" chars.
    const headerRegex = /^\s*[=#*_>\-]*\s*([A-Z][A-Z_ ]+?)\s*[=#*_:>\-]*\s*$/;

    let current = null;
    let foundAny = false;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const m = trimmed.match(headerRegex);
      let headerKey = null;
      if (m) {
        const norm = m[1].replace(/\s+/g, '_').toUpperCase();
        if (labelToKey.hasOwnProperty(norm)) {
          headerKey = labelToKey[norm];
        } else if (norm === 'END') {
          current = null;
          continue;
        }
      }

      if (headerKey) {
        current = headerKey;
        foundAny = true;
        continue;
      }

      if (!current) continue;

      // Item line: strip common bullet prefixes
      let item = trimmed
        .replace(/^[-*•–—]\s+/, '')  // - * • – —
        .replace(/^\d+[.)]\s+/, '')                  // 1. or 1)
        .trim();

      if (!item) continue;
      if (/^\(none\)$/i.test(item)) continue;
      if (/^none$/i.test(item)) continue;

      result[current].push(item);
    }

    if (!foundAny) {
      return { ok: false, data: result, reason: 'Could not find any section headers. Make sure you pasted the full reply from Claude.' };
    }

    // Consider it parsed successfully if at least one section has content.
    const hasContent = SECTIONS.some(function (s) { return result[s.key].length > 0; });
    if (!hasContent) {
      return { ok: false, data: result, reason: 'Sections were found but no items were listed under them.' };
    }

    return { ok: true, data: result };
  }

  // ---------- views ----------
  const views = {
    home: document.getElementById('view-home'),
    prompt: document.getElementById('view-prompt'),
    analysis: document.getElementById('view-analysis'),
  };

  const backBtn = document.getElementById('backBtn');
  const topTitle = document.getElementById('topTitle');

  function showView(name, opts) {
    Object.keys(views).forEach(function (v) { views[v].hidden = v !== name; });
    window.scrollTo(0, 0);
    if (name === 'home') {
      backBtn.hidden = true;
      topTitle.textContent = 'Career Forge';
      renderSavedList();
    } else if (name === 'prompt') {
      backBtn.hidden = false;
      topTitle.textContent = 'New Analysis';
    } else if (name === 'analysis') {
      backBtn.hidden = false;
      topTitle.textContent = (opts && opts.title) || 'Analysis';
    }
  }

  backBtn.addEventListener('click', function () {
    // Simple back: always return home.
    showView('home');
  });

  // ---------- home: form ----------
  const jobForm = document.getElementById('jobForm');
  const jobText = document.getElementById('jobText');
  const companyName = document.getElementById('companyName');
  const background = document.getElementById('background');
  const tryExampleBtn = document.getElementById('tryExampleBtn');
  const promptOutput = document.getElementById('promptOutput');
  const copyBtn = document.getElementById('copyBtn');
  const responseInput = document.getElementById('responseInput');
  const saveBtn = document.getElementById('saveBtn');
  const parseMsg = document.getElementById('parseMsg');

  let pending = null; // { job, company, background, prompt }

  tryExampleBtn.addEventListener('click', function () {
    jobText.value = EXAMPLE_JOB;
    companyName.value = 'Lumen Health';
    background.value = EXAMPLE_BACKGROUND;
    jobText.focus();
    jobText.setSelectionRange(0, 0);
    window.scrollTo(0, 0);
  });

  jobForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const job = jobText.value.trim();
    const company = companyName.value.trim();
    const bg = background.value.trim();
    if (!job || !bg) return;

    const prompt = buildPrompt(job, company, bg);
    pending = { job: job, company: company, background: bg, prompt: prompt };

    promptOutput.textContent = prompt;
    responseInput.value = '';
    parseMsg.hidden = true;
    parseMsg.textContent = '';
    parseMsg.className = 'parse-msg';
    showView('prompt');
  });

  // ---------- copy ----------
  copyBtn.addEventListener('click', function () {
    const text = promptOutput.textContent;
    const done = function (ok) {
      const original = copyBtn.textContent;
      copyBtn.textContent = ok ? 'Copied ✓' : 'Copy failed — long-press to copy';
      setTimeout(function () { copyBtn.textContent = original; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  });

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }

  // ---------- save analysis ----------
  saveBtn.addEventListener('click', function () {
    if (!pending) return;
    const raw = responseInput.value;
    const parsed = parseResponse(raw);
    if (!parsed.ok) {
      parseMsg.hidden = false;
      parseMsg.className = 'parse-msg error';
      parseMsg.textContent = parsed.reason;
      return;
    }

    const entry = {
      id: 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      company: pending.company || '',
      jobExcerpt: firstLine(pending.job) || 'Untitled role',
      job: pending.job,
      background: pending.background,
      rawResponse: raw,
      sections: parsed.data,
    };

    addAnalysis(entry);
    pending = null;
    openAnalysis(entry.id);
  });

  function firstLine(text) {
    const first = text.split('\n').map(function (l) { return l.trim(); }).find(function (l) { return l.length > 0; });
    if (!first) return '';
    return first.length > 80 ? first.slice(0, 80) + '…' : first;
  }

  // ---------- analysis view ----------
  const analysisMeta = document.getElementById('analysisMeta');
  const rawResponseEl = document.getElementById('rawResponse');
  const deleteBtn = document.getElementById('deleteBtn');
  let currentAnalysisId = null;

  function openAnalysis(id) {
    const entry = getAnalysis(id);
    if (!entry) { showView('home'); return; }
    currentAnalysisId = id;

    const dateStr = new Date(entry.createdAt).toLocaleString();
    const bits = [];
    if (entry.company) bits.push(entry.company);
    bits.push(dateStr);
    analysisMeta.textContent = bits.join(' · ');

    SECTIONS.forEach(function (s) {
      const wrap = document.querySelector('.analysis-section[data-key="' + s.key + '"]');
      const ul = wrap.querySelector('ul');
      ul.innerHTML = '';
      const items = entry.sections[s.key] || [];
      if (items.length === 0) {
        const li = document.createElement('li');
        li.className = 'muted';
        li.textContent = '(none listed)';
        ul.appendChild(li);
      } else {
        items.forEach(function (t) {
          const li = document.createElement('li');
          li.textContent = t;
          ul.appendChild(li);
        });
      }
    });

    rawResponseEl.textContent = entry.rawResponse;
    showView('analysis', { title: entry.company || entry.jobExcerpt });
  }

  deleteBtn.addEventListener('click', function () {
    if (!currentAnalysisId) return;
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    deleteAnalysis(currentAnalysisId);
    currentAnalysisId = null;
    showView('home');
  });

  // ---------- saved list ----------
  const savedList = document.getElementById('savedList');
  const emptyMsg = document.getElementById('emptyMsg');

  function renderSavedList() {
    const list = loadAll();
    savedList.innerHTML = '';
    if (list.length === 0) {
      emptyMsg.hidden = false;
      return;
    }
    emptyMsg.hidden = true;
    list.forEach(function (entry) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = entry.company ? entry.company + ' — ' + entry.jobExcerpt : entry.jobExcerpt;
      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = new Date(entry.createdAt).toLocaleString();
      btn.appendChild(title);
      btn.appendChild(sub);
      btn.addEventListener('click', function () { openAnalysis(entry.id); });
      li.appendChild(btn);
      savedList.appendChild(li);
    });
  }

  // ---------- boot ----------
  renderSavedList();
  showView('home');
})();
