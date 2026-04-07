'use strict';
// ── Helpers (MUST be first) ──────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const t = Math.floor(+s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}
function relTime(dt) {
  if (!dt) return '';
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return 'agora'; if (m < 60) return m + 'min'; if (m < 1440) return Math.floor(m / 60) + 'h'; return Math.floor(m / 1440) + 'd';
}
let _toastT;
function toast(msg) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.remove('show'), 2800);
}
async function api(url, opts = {}) {
  try {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (r.status === 401) { window.location.href = '/login'; return null; }
    return await r.json();
  } catch (e) { console.error('API error', url, e); return null; }
}

// ── Caching Layer ───────────────────────────────
async function cachedAPI(url, ttlSecs = 300) {
  const key = `cache:${url}`;
  const now = Date.now();
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const { data, exp } = JSON.parse(cached);
      if (exp > now) return data;
    } catch (e) {}
  }
  const data = await api(url);
  if (data) localStorage.setItem(key, JSON.stringify({ data, exp: now + ttlSecs * 1000 }));
  return data;
}

// ── Lazy Loading ─────────────────────────────────
function setupLazyLoading() {
  if (!IntersectionObserver) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });
  
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  
  // Re-run when new images are added
  const container = $('viewsWrap');
  if (container) {
    new MutationObserver(() => {
      document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    }).observe(container, { subtree: true, childList: true });
  }
}

// ── State ────────────────────────────────────────
const S = {
  user: null, likes: new Set(),
  songs: [], playlists: [], userPlaylists: [], events: [],
  currentSong: null, queue: [], qIdx: 0,
  isPlaying: false, shuffle: false, repeat: false, volume: 0.7,
  theme: 'dark', collSongs: [],
  audio: new Audio(),
  audioCtx: null, analyser: null, srcNode: null, eqFilters: [],
  eqGains: [0, 0, 0, 0, 0, 0, 0],
};
S.audio.crossOrigin = 'anonymous';

// ── Boot ─────────────────────────────────────────
async function boot() {
  const me = await api('/api/auth/me');
  if (!me || !me.logged) { window.location.href = '/login'; return; }

  S.user = me.user;
  (me.likes || []).forEach(id => S.likes.add(id));
  S.unread = me.unread || 0;

  // Render user in topbar
  const av = $('userAvatar'), un = $('userName');
  if (av) { av.textContent = me.user.name[0].toUpperCase(); av.style.background = me.user.avatar_color || '#1db954'; }
  if (un) un.textContent = me.user.name;

  // Load data
  const [songsR, plsR, eventsR] = await Promise.all([
    cachedAPI('/api/songs', 3600), cachedAPI('/api/playlists', 3600), cachedAPI('/api/events', 7200)
  ]);

  if (songsR) S.songs = songsR;
  if (plsR) { S.playlists = plsR.system || []; S.userPlaylists = plsR.user || []; }
  if (eventsR) S.events = eventsR;
  S.queue = [...S.songs];

  applyTheme(localStorage.getItem('theme') || 'dark');
  renderSidebar();
  renderHome();
  updateNotifBadge();
  setupNav();
  setupMobileMenu();
  setupPlayer();
  setupModals();
  setupSearch();
  setupTheme();
  setupEQ();
  setGreeting();
  setupLazyLoading();
}

// ── Theme ─────────────────────────────────────────
function applyTheme(t) {
  S.theme = t;
  document.documentElement.dataset.theme = t;
  const btn = $('themeBtn');
  if (btn) btn.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
function setupTheme() {
  const btn = $('themeBtn');
  if (btn) btn.addEventListener('click', () => {
    const t = S.theme === 'dark' ? 'light' : 'dark';
    applyTheme(t); localStorage.setItem('theme', t);
  });
}

// ── Mobile Menu Toggle ────────────────────────────
function setupMobileMenu() {
  const menuBtn = $('menuBtn');
  const sidebar = $('sidebar');
  const overlay = $('sidebarOverlay');
  
  if (!menuBtn || !sidebar || !overlay) return;
  
  // Show menu button on mobile
  const updateMenuBtnVisibility = () => {
    menuBtn.style.display = window.innerWidth <= 600 ? 'flex' : 'none';
  };
  updateMenuBtnVisibility();
  window.addEventListener('resize', updateMenuBtnVisibility);
  
  // Toggle sidebar
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  
  // Close sidebar when clicking overlay
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  
  // Close sidebar when clicking a link
  const sidebarLinks = sidebar.querySelectorAll('a, .snav, .sidebar-btn, .sidebar-logo');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 600) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      }
    });
  });
}

// ── Greeting ──────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  const el = $('heroGreeting');
  if (el) el.textContent = h < 12 ? 'Bom dia ☀️' : h < 18 ? 'Boa tarde 🎵' : 'Boa noite 🌙';
}

// ── Navigation ────────────────────────────────────
const viewHistory = ['home'];
function showView(name) {
  $$('.view').forEach(v => v.classList.remove('active'));
  const el = $(name + 'View');
  if (el) { el.classList.add('active'); el.scrollTop = 0; }
  $$('.snav').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  if (viewHistory[viewHistory.length - 1] !== name) viewHistory.push(name);
}
function setupNav() {
  $$('.snav').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const v = el.dataset.view;
    if (v === 'library') renderLibrary('playlists');
    showView(v);
  }));
  const backBtn = $('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (viewHistory.length > 1) { viewHistory.pop(); showView(viewHistory[viewHistory.length - 1]); }
  });
  const likedBtn = $('likedSideBtn');
  if (likedBtn) likedBtn.addEventListener('click', openLiked);
  const newPl = $('newPlaylistSideBtn');
  if (newPl) newPl.addEventListener('click', () => openModal('newPlaylistOverlay'));
}

// ── Sidebar ───────────────────────────────────────
function renderSidebar() {
  const ul = $('sidebarPls');
  if (!ul) return;
  const all = [...S.playlists, ...S.userPlaylists];
  ul.innerHTML = all.map(p => `<li><a href="#" data-pid="${p.id}">${p.name}</a></li>`).join('');
  ul.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); openCollection(+a.dataset.pid);
  }));
}

// ── Home ──────────────────────────────────────────
function renderHome() {
  renderQuickGrid();
  renderChartsRow();
  renderBrazilRow();
  renderPlaylistsRow();
  renderEventsHome();
  renderNews();
}

function renderQuickGrid() {
  const qg = $('quickGrid');
  if (!qg) return;
  qg.innerHTML = S.playlists.slice(0, 6).map(p => `
    <div class="quick-item" data-pid="${p.id}">
      <img src="${p.cover}" alt="${p.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/def/300/300'"/>
      <span>${p.name}</span>
      <button class="qplay"><i class="fas fa-play"></i></button>
    </div>`).join('');
  qg.querySelectorAll('.quick-item').forEach(el => {
    el.addEventListener('click', () => openCollection(+el.dataset.pid));
    el.querySelector('.qplay').addEventListener('click', e => { e.stopPropagation(); playCollection(+el.dataset.pid); });
  });
}

function renderChartsRow() {
  const row = $('chartsRow');
  if (!row) return;
  const top = [...S.songs].sort((a, b) => b.plays - a.plays).slice(0, 8);
  row.innerHTML = top.map(s => songCardHTML(s)).join('');
  bindSongCards(row, top);
}

function renderBrazilRow() {
  const row = $('brazilRow');
  if (!row) return;
  const brGenres = ['Funk', 'Sertanejo', 'Pagode', 'Bossa Nova', 'MPB', 'Samba', 'Funk Pop', 'Pagode Funk', 'Sertanejo Pop'];
  const br = S.songs.filter(s => brGenres.includes(s.genre)).slice(0, 8);
  row.innerHTML = br.length ? br.map(s => songCardHTML(s)).join('') : '<p style="color:var(--text2);padding:20px">Carregando...</p>';
  bindSongCards(row, br);
}

function renderPlaylistsRow() {
  const row = $('playlistsRow');
  if (!row) return;
  row.innerHTML = S.playlists.map(p => `
    <div class="card" data-pid="${p.id}">
      <div class="card-img-wrap">
        <img src="${p.cover}" alt="${p.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/def/300/300'"/>
        <button class="card-play-btn"><i class="fas fa-play"></i></button>
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-sub">${p.description || ''}</div>
    </div>`).join('');
  row.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => openCollection(+el.dataset.pid));
    el.querySelector('.card-play-btn')?.addEventListener('click', e => { e.stopPropagation(); playCollection(+el.dataset.pid); });
  });
}

function renderEventsHome() {
  const row = $('eventsRowHome');
  if (!row) return;
  renderEventsCards(row, S.events.slice(0, 4));
}

function renderEventsCards(container, evts) {
  container.innerHTML = evts.map(ev => `
    <div class="event-card">
      <img src="${ev.cover}" alt="${ev.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/ev/400/200'"/>
      <div class="event-card-body">
        <div class="event-card-name">${ev.name}</div>
        <div class="event-card-info">
          <span><i class="fas fa-map-marker-alt"></i>${ev.venue}, ${ev.city}</span>
          <span><i class="fas fa-calendar"></i>${fmtDate(ev.date)}</span>
        </div>
        <div class="event-price">
          <span class="price">${ev.price}</span>
          <button class="btn-ticket" onclick="toast('🎟️ Abrindo ingressos...')">Ingressos</button>
        </div>
      </div>
    </div>`).join('');
}

function renderNews() {
  const ng = $('newsGrid');
  if (!ng) return;
  const news = [
    { tag: 'Lançamento', title: 'Anitta anuncia turnê pelo Brasil em 2025', date: '15 Mar 2025', img: 'https://picsum.photos/seed/news1/400/200' },
    { tag: 'Evento', title: 'Lollapalooza 2025 confirma headliners surpresa', date: '12 Mar 2025', img: 'https://picsum.photos/seed/news2/400/200' },
    { tag: 'Tendência', title: 'Funk domina o top 10 global pelo terceiro mês', date: '10 Mar 2025', img: 'https://picsum.photos/seed/news3/400/200' },
    { tag: 'Entrevista', title: 'Taylor Swift confirma novo álbum para 2025', date: '8 Mar 2025', img: 'https://picsum.photos/seed/news4/400/200' },
  ];
  ng.innerHTML = news.map(n => `
    <div class="news-card">
      <img src="${n.img}" alt="${n.title}" loading="lazy"/>
      <div class="news-card-body">
        <div class="news-tag">${n.tag}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-date">${n.date}</div>
      </div>
    </div>`).join('');
}

// ── Card helpers ──────────────────────────────────
function songCardHTML(s) {
  return `<div class="card" data-sid="${s.id}">
    <div class="card-img-wrap">
      <img src="${s.cover}" alt="${s.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${s.id}/300/300'"/>
      <button class="card-play-btn"><i class="fas fa-play"></i></button>
    </div>
    <div class="card-name">${s.title}</div>
    <div class="card-sub">${s.artist}</div>
  </div>`;
}
function bindSongCards(container, list) {
  container.querySelectorAll('.card').forEach((el, i) => {
    if (!list[i]) return;
    el.addEventListener('click', () => playSong(list[i], list, i));
    el.querySelector('.card-play-btn')?.addEventListener('click', e => { e.stopPropagation(); playSong(list[i], list, i); });
  });
}

// ── Charts page ───────────────────────────────────
async function loadCharts() {
  const charts = await api('/api/charts');
  if (!charts) return;
  renderTrackTable($('chartsTable'), charts, charts);
  const btn = $('chartsPlayBtn');
  if (btn) btn.onclick = () => playSong(charts[0], charts, 0);
}

// ── Events page ───────────────────────────────────
function loadEventsPage() {
  const g = $('eventsGrid');
  if (!g) return;
  g.innerHTML = S.events.map(ev => `
    <div class="event-full-card">
      <img src="${ev.cover}" alt="${ev.name}" loading="lazy"/>
      <div class="event-full-body">
        <div class="event-full-name">${ev.name}</div>
        <div class="event-full-details">
          <span><i class="fas fa-music"></i>${ev.artist}</span>
          <span><i class="fas fa-map-marker-alt"></i>${ev.venue} — ${ev.city}</span>
          <span><i class="fas fa-calendar-alt"></i>${fmtDate(ev.date)}</span>
        </div>
        <div class="event-full-footer">
          <div class="event-full-price">${ev.price}</div>
          <button class="btn-ticket" onclick="toast('🎟️ Redirecionando...')">Comprar Ingresso</button>
        </div>
      </div>
    </div>`).join('');
}

// ── Library ───────────────────────────────────────
function renderLibrary(tab = 'playlists') {
  $$('.lib-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const c = $('libContent');
  if (!c) return;
  if (tab === 'playlists') {
    const all = [...S.playlists, ...S.userPlaylists];
    c.innerHTML = all.map(p => `
      <div class="lib-row" data-pid="${p.id}">
        <img src="${p.cover}" alt="${p.name}" loading="lazy"/>
        <div class="lib-row-info"><div class="lib-row-name">${p.name}</div><div class="lib-row-sub">Playlist · ${p.description || ''}</div></div>
      </div>`).join('');
    c.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => openCollection(+el.dataset.pid)));
  } else if (tab === 'liked') {
    openLiked(); return;
  } else if (tab === 'albums') {
    const seen = new Map();
    S.songs.forEach(s => { if (s.album && !seen.has(s.album)) seen.set(s.album, s); });
    c.innerHTML = [...seen.values()].map(s => `
      <div class="lib-row">
        <img src="${s.cover}" alt="${s.album}" loading="lazy"/>
        <div class="lib-row-info"><div class="lib-row-name">${s.album}</div><div class="lib-row-sub">Álbum · ${s.artist}</div></div>
      </div>`).join('');
  }
}
$$('.lib-tab').forEach(t => t.addEventListener('click', () => renderLibrary(t.dataset.tab)));

// ── Collection (playlist detail) ──────────────────
async function openCollection(pid) {
  const data = await api(`/api/playlist/${pid}`);
  if (!data) return;
  S.collSongs = data.songs || [];

  const banner = $('collBanner');
  if (banner) banner.innerHTML = `
    <img src="${data.cover}" alt="${data.name}" onerror="this.src='https://picsum.photos/seed/${pid}/300/300'"/>
    <div class="coll-info">
      <div class="coll-tag">Playlist</div>
      <h1>${data.name}</h1>
      <p>${data.description || ''}</p>
      <div class="coll-meta">Spotifake · ${S.collSongs.length} músicas</div>
    </div>`;

  renderTrackTable($('collTable'), S.collSongs, S.collSongs);

  const playBtn = $('collPlayBtn');
  if (playBtn) playBtn.onclick = () => { if (S.collSongs.length) playSong(S.collSongs[0], S.collSongs, 0); };

  const radioBtn = $('collRadioBtn');
  if (radioBtn) radioBtn.onclick = () => openRadio((S.currentSong || S.collSongs[0])?.id);

  showView('coll');
}

async function playCollection(pid) {
  const data = await api(`/api/playlist/${pid}`);
  if (data?.songs?.length) playSong(data.songs[0], data.songs, 0);
}

// ── Radio ─────────────────────────────────────────
async function openRadio(sid) {
  if (!sid) { toast('Toque uma música primeiro'); return; }
  const seed = S.songs.find(s => s.id === sid);
  const recs = await api(`/api/radio/${sid}`);
  if (!recs) return;
  const t = $('radioTitle'), d = $('radioDesc');
  if (t) t.textContent = `Rádio: ${seed?.title || 'Mix'}`;
  if (d) d.textContent = `Baseado em ${seed?.title || 'suas músicas'}`;
  renderTrackTable($('radioTable'), recs, recs);
  const btn = $('radioPlayBtn');
  if (btn) btn.onclick = () => { if (recs.length) playSong(recs[0], recs, 0); };
  showView('radio');
}

// ── Liked ─────────────────────────────────────────
async function openLiked() {
  const songs = await api('/api/liked');
  if (!songs) return;
  const ct = $('likedCountText');
  if (ct) ct.textContent = `${songs.length} música${songs.length !== 1 ? 's' : ''}`;
  renderTrackTable($('likedTable'), songs, songs);
  const btn = $('likedPlayBtn');
  if (btn) btn.onclick = () => { if (songs.length) playSong(songs[0], songs, 0); };
  showView('liked');
}

// ── Track Table ───────────────────────────────────
function renderTrackTable(container, songs, queue) {
  if (!container) return;
  container.innerHTML = songs.map((s, i) => `
    <div class="track-row${S.currentSong?.id === s.id ? ' playing' : ''}" data-sid="${s.id}">
      <div class="tr-num">
        <span class="t-n">${i + 1}</span>
        <i class="fas fa-play t-pi"></i>
        <div class="t-eq"><span></span><span></span><span></span></div>
      </div>
      <div class="tr-info">
        <img src="${s.cover}" alt="${s.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${s.id}/300/300'"/>
        <div>
          <div class="tr-title">${s.title}</div>
          <div class="tr-artist">${s.artist}</div>
        </div>
      </div>
      <div class="tr-album hide-mobile">${s.album || ''}</div>
      <div class="tr-year hide-mobile">${s.year || ''}</div>
      <div class="tr-dur">${s.duration || ''}</div>
    </div>`).join('');
  container.querySelectorAll('.track-row').forEach((el, i) => {
    el.addEventListener('click', () => playSong(songs[i], queue, i));
  });
}

// ── Search ────────────────────────────────────────
function setupSearch() {
  const GENRES = [
    { name: 'Pop', color: '#e91e8c' }, { name: 'Hip-Hop', color: '#856cda' },
    { name: 'Funk', color: '#ff4500' }, { name: 'Sertanejo', color: '#8B4513' },
    { name: 'Pagode', color: '#2d7a3e' }, { name: 'Rock', color: '#e8142e' },
    { name: 'R&B', color: '#c62a7a' }, { name: 'MPB', color: '#DAA520' },
    { name: 'K-Pop', color: '#ff6b9d' }, { name: 'Afrobeats', color: '#ff8c00' },
    { name: 'Bossa Nova', color: '#1e3264' }, { name: 'Electronic', color: '#0d73ec' },
  ];
  const gg = $('genresGrid');
  if (gg) {
    gg.innerHTML = GENRES.map(g => `<div class="genre-card" style="background:${g.color}">${g.name}</div>`).join('');
    gg.querySelectorAll('.genre-card').forEach((el, i) => el.addEventListener('click', () => {
      $('searchInput').value = GENRES[i].name;
      doSearch(GENRES[i].name);
    }));
  }
  let timer;
  const inp = $('searchInput');
  const clr = $('searchClearBtn');
  if (inp) inp.addEventListener('input', e => {
    const q = e.target.value.trim();
    if (clr) clr.classList.toggle('show', q.length > 0);
    clearTimeout(timer);
    if (!q) { renderSearchDefault(); return; }
    timer = setTimeout(() => doSearch(q), 280);
  });
  if (clr) clr.addEventListener('click', () => {
    if (inp) inp.value = '';
    clr.classList.remove('show');
    renderSearchDefault();
  });
}

function renderSearchDefault() {
  const body = $('searchBody');
  if (!body) return;
  body.innerHTML = `<h3 class="genres-title">Explorar Categorias</h3><div class="genres-grid" id="genresGrid"></div>`;
  setupSearch();
}

async function doSearch(q) {
  const r = await api(`/api/search?q=${encodeURIComponent(q)}`);
  const body = $('searchBody');
  if (!body) return;
  body.innerHTML = '';
  if (!r || (!r.songs?.length && !r.playlists?.length)) {
    body.innerHTML = `<p style="color:var(--text2);padding:20px 0">Nenhum resultado para <strong>"${q}"</strong></p>`;
    return;
  }
  if (r.songs?.length) {
    const sec = document.createElement('div');
    sec.className = 'search-section';
    sec.innerHTML = `<h4>Músicas (${r.songs.length})</h4>` + r.songs.slice(0, 10).map(s => `
      <div class="result-row" data-sid="${s.id}">
        <img src="${s.cover}" alt="${s.title}" loading="lazy"/>
        <div class="rr-info"><div class="rr-title">${s.title}</div><div class="rr-sub">${s.artist} · ${s.genre || ''}</div></div>
        <div class="rr-dur">${s.duration || ''}</div>
      </div>`).join('');
    body.appendChild(sec);
    sec.querySelectorAll('[data-sid]').forEach(el => {
      el.addEventListener('click', () => {
        const s = r.songs.find(x => x.id === +el.dataset.sid);
        if (s) playSong(s, r.songs, r.songs.indexOf(s));
      });
    });
  }
  if (r.playlists?.length) {
    const sec = document.createElement('div');
    sec.className = 'search-section';
    sec.innerHTML = `<h4>Playlists</h4>` + r.playlists.map(p => `
      <div class="result-row" data-pid="${p.id}">
        <img src="${p.cover}" alt="${p.name}" loading="lazy"/>
        <div class="rr-info"><div class="rr-title">${p.name}</div><div class="rr-sub">Playlist</div></div>
      </div>`).join('');
    body.appendChild(sec);
    sec.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => openCollection(+el.dataset.pid)));
  }
}

// ══════════════════════════════════════════════
// AUDIO ENGINE
// ══════════════════════════════════════════════
function playSong(song, queue, idx) {
  if (!song) return;
  S.currentSong = song;
  S.queue = queue || S.songs;
  S.qIdx = idx ?? 0;
  S.isPlaying = true;

  if (song.audio_url) {
    S.audio.pause();
    S.audio.src = song.audio_url;
    S.audio.volume = S.volume;
    S.audio.play().catch(e => { console.warn('Audio play blocked:', e); });
  }

  updatePlayerUI();
  initAudioContext();
  updateAllHighlights();
  updateQueueUI();
  toast(`▶  ${song.title} — ${song.artist}`);
}

function togglePlay() {
  if (!S.currentSong) return;
  S.isPlaying = !S.isPlaying;
  if (S.isPlaying) S.audio.play().catch(() => {});
  else S.audio.pause();
  updatePlayBtns();
}

function playNext() {
  if (!S.queue.length) return;
  const next = S.shuffle ? Math.floor(Math.random() * S.queue.length) : (S.qIdx + 1) % S.queue.length;
  playSong(S.queue[next], S.queue, next);
}

function playPrev() {
  if (S.audio.currentTime > 3) { S.audio.currentTime = 0; return; }
  const prev = (S.qIdx - 1 + S.queue.length) % S.queue.length;
  playSong(S.queue[prev], S.queue, prev);
}

function setupPlayer() {
  const au = S.audio;

  au.addEventListener('timeupdate', () => {
    if (!au.duration) return;
    const pct = (au.currentTime / au.duration) * 100;
    const p1 = $('progFill'), p2 = $('progBar'), th1 = p2?.querySelector('.prog-thumb');
    const fp = $('fsProgFill'), fth = $('fsProgBar')?.querySelector('.fs-prog-thumb');
    if (p1) p1.style.width = pct + '%';
    if (th1) th1.style.left = pct + '%';
    if (fp) fp.style.width = pct + '%';
    if (fth) fth.style.left = pct + '%';
    const ct = $('curTime'), fct = $('fsCurTime');
    if (ct) ct.textContent = fmt(au.currentTime);
    if (fct) fct.textContent = fmt(au.currentTime);
    drawPlayerViz();
  });

  au.addEventListener('loadedmetadata', () => {
    const tt = $('totTime'), ftt = $('fsTotTime');
    if (tt) tt.textContent = fmt(au.duration);
    if (ftt) ftt.textContent = fmt(au.duration);
  });

  au.addEventListener('ended', () => {
    if (S.repeat) { au.currentTime = 0; au.play(); } else playNext();
  });

  // Controls
  const binds = [
    ['playBtn', togglePlay], ['prevBtn', playPrev], ['nextBtn', playNext],
    ['fsPlayBtn', togglePlay], ['fsPrevBtn', playPrev], ['fsNextBtn', playNext],
  ];
  binds.forEach(([id, fn]) => { const el = $(id); if (el) el.addEventListener('click', fn); });

  // Shuffle / Repeat
  ['shuffle', 'repeat'].forEach(k => {
    const ids = [`${k}Btn`, `fs${k[0].toUpperCase() + k.slice(1)}Btn`];
    ids.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('click', () => {
        S[k] = !S[k];
        if (k === 'repeat') au.loop = S[k];
        ids.forEach(bid => { const b = $(bid); if (b) b.classList.toggle('active', S[k]); });
      });
    });
  });

  // Progress scrub
  const pb = $('progBar');
  if (pb) pb.addEventListener('click', e => {
    if (!au.duration) return;
    const r = pb.getBoundingClientRect();
    au.currentTime = ((e.clientX - r.left) / r.width) * au.duration;
  });
  const fpb = $('fsProgBar');
  if (fpb) fpb.addEventListener('click', e => {
    if (!au.duration) return;
    const r = fpb.getBoundingClientRect();
    au.currentTime = ((e.clientX - r.left) / r.width) * au.duration;
  });

  // Volume
  const vb = $('volBar');
  if (vb) vb.addEventListener('click', e => {
    const r = vb.getBoundingClientRect();
    S.volume = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    au.volume = S.volume;
    const vf = $('volFill'), vth = vb.querySelector('.vol-thumb');
    if (vf) vf.style.width = S.volume * 100 + '%';
    if (vth) vth.style.left = S.volume * 100 + '%';
  });
  const vi = $('volIcon');
  if (vi) vi.addEventListener('click', () => {
    au.muted = !au.muted;
    vi.className = `fas fa-volume-${au.muted ? 'mute' : 'up'} vol-ico`;
  });

  // Heart / Lyrics / Queue / EQ
  const hb = $('heartBtn'); if (hb) hb.addEventListener('click', toggleLike);
  const fhb = $('fsHeartBtn'); if (fhb) fhb.addEventListener('click', toggleLike);
  const lb = $('lyricsBtn'); if (lb) lb.addEventListener('click', openLyrics);
  const flb = $('fsLyricsBtn'); if (flb) flb.addEventListener('click', openLyrics);
  const qb = $('queueBtn'); if (qb) qb.addEventListener('click', () => { updateQueueUI(); openModal('queueOverlay'); });
  const fqb = $('fsQueueBtn'); if (fqb) fqb.addEventListener('click', () => { updateQueueUI(); openModal('queueOverlay'); });
  const eb = $('eqBtn'); if (eb) eb.addEventListener('click', () => openModal('eqOverlay'));

  // Fullscreen
  const fsm = $('fsBtnMain'); if (fsm) fsm.addEventListener('click', openFullscreen);
  const pc = $('playerCover'); if (pc) pc.addEventListener('click', openFullscreen);
  const fsc = $('fsCloseBtn'); if (fsc) fsc.addEventListener('click', closeFullscreen);

  // Radio mini
  const rmb = $('radioMiniBtn');
  if (rmb) rmb.addEventListener('click', () => openRadio(S.currentSong?.id));
}

function updatePlayerUI() {
  const s = S.currentSong;
  if (!s) return;
  const ci = $('playerCoverImg'), pt = $('playerTitle'), pa = $('playerArtist');
  const fc = $('fsCover'), ft = $('fsTitle'), fa = $('fsArtist'), fal = $('fsAlbum');
  if (ci) { ci.src = s.cover; ci.onerror = () => { ci.src = `https://picsum.photos/seed/${s.id}/300/300`; }; }
  if (pt) pt.textContent = s.title;
  if (pa) pa.textContent = s.artist;
  if (fc) { fc.src = s.cover; fc.onerror = () => { fc.src = `https://picsum.photos/seed/${s.id}/300/300`; }; }
  if (ft) ft.textContent = s.title;
  if (fa) fa.textContent = s.artist;
  if (fal) fal.textContent = s.album || '';
  updatePlayBtns();
  updateHeartUI();
}

function updatePlayBtns() {
  const icon = `<i class="fas fa-${S.isPlaying ? 'pause' : 'play'}"></i>`;
  const pb = $('playBtn'), fpb = $('fsPlayBtn');
  if (pb) pb.innerHTML = icon;
  if (fpb) fpb.innerHTML = icon;
}

function updateHeartUI() {
  if (!S.currentSong) return;
  const liked = S.likes.has(S.currentSong.id);
  const icon = `<i class="${liked ? 'fas' : 'far'} fa-heart"></i>`;
  const hb = $('heartBtn'), fhb = $('fsHeartBtn');
  if (hb) { hb.innerHTML = icon; hb.style.color = liked ? 'var(--green)' : ''; }
  if (fhb) { fhb.innerHTML = icon; fhb.classList.toggle('active', liked); }
}

function updateAllHighlights() {
  $$('.track-row').forEach(el => el.classList.toggle('playing', +el.dataset.sid === S.currentSong?.id));
}

async function toggleLike() {
  if (!S.currentSong) { toast('Toque uma música primeiro'); return; }
  const sid = S.currentSong.id;
  const r = await api(`/api/like/${sid}`, { method: 'POST' });
  if (!r) return;
  if (r.liked) S.likes.add(sid); else S.likes.delete(sid);
  updateHeartUI();
  toast(r.liked ? '❤️  Adicionado às curtidas' : '💔  Removido das curtidas');
}

// ── Audio Visualizer ──────────────────────────────
function initAudioContext() {
  if (S.audioCtx) { if (S.audioCtx.state === 'suspended') S.audioCtx.resume(); return; }
  try {
    S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    S.analyser = S.audioCtx.createAnalyser();
    S.analyser.fftSize = 128;
    S.srcNode = S.audioCtx.createMediaElementSource(S.audio);
    buildEQChain();
    drawFsCanvas();
  } catch (e) { console.warn('AudioContext failed:', e); }
}

function drawPlayerViz() {
  const viz = $('playerViz');
  if (!viz) return;
  if (!viz.children.length) viz.innerHTML = Array(40).fill('<span></span>').join('');
  if (!S.analyser || !S.isPlaying) return;
  const buf = new Uint8Array(S.analyser.frequencyBinCount);
  S.analyser.getByteFrequencyData(buf);
  [...viz.children].forEach((span, i) => {
    const v = (buf[i % buf.length] || 0) / 255;
    span.style.transform = `scaleY(${Math.max(0.04, v)})`;
  });
}

function drawFsCanvas() {
  const canvas = $('fsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  (function loop() {
    requestAnimationFrame(loop);
    if (!S.analyser) return;
    const buf = new Uint8Array(S.analyser.frequencyBinCount);
    S.analyser.getByteFrequencyData(buf);
    const W = canvas.offsetWidth * devicePixelRatio || 300;
    const H = canvas.offsetHeight * devicePixelRatio || 60;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const bw = W / buf.length;
    buf.forEach((v, i) => {
      const h = (v / 255) * H * 0.9;
      ctx.fillStyle = `rgba(29,185,84,${0.3 + v / 255 * 0.7})`;
      ctx.fillRect(i * bw, H - h, Math.max(1, bw - 2), h);
    });
  })();
}

// ── Equalizer ─────────────────────────────────────
const EQ_PRESETS = {
  'Normal':     [0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [7, 5, 3, 1, 0, 0, 0],
  'Treble':     [0, 0, 0, 1, 3, 5, 7],
  'Pop':        [2, 3, 2, 0, 1, 2, 2],
  'Rock':       [5, 3, 0, -1, 0, 3, 5],
  'Jazz':       [2, 1, 0, 2, 1, 0, 1],
  'Classical':  [3, 2, 0, 0, 0, 2, 3],
};
const EQ_FREQS = ['60Hz', '170Hz', '310Hz', '600Hz', '1KHz', '3KHz', '6KHz'];

function setupEQ() {
  const presetsEl = $('eqPresets');
  if (presetsEl) {
    presetsEl.innerHTML = Object.keys(EQ_PRESETS).map(p =>
      `<div class="eq-preset${p === 'Normal' ? ' active' : ''}" data-preset="${p}">${p}</div>`).join('');
    presetsEl.querySelectorAll('.eq-preset').forEach(el => el.addEventListener('click', () => {
      $$('.eq-preset').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      applyEQPreset(el.dataset.preset);
    }));
  }
  const barsEl = $('eqBars');
  if (barsEl) {
    barsEl.innerHTML = EQ_FREQS.map((f, i) => `
      <div class="eq-bar-col">
        <input type="range" min="-12" max="12" value="0" data-band="${i}" orient="vertical"/>
        <label>${f}</label>
      </div>`).join('');
    barsEl.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
      const b = +inp.dataset.band;
      S.eqGains[b] = +inp.value;
      if (S.eqFilters[b]) S.eqFilters[b].gain.value = S.eqGains[b];
    }));
  }
  const resetBtn = $('eqResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => applyEQPreset('Normal'));
}

function applyEQPreset(name) {
  const gains = EQ_PRESETS[name] || EQ_PRESETS['Normal'];
  S.eqGains = [...gains];
  gains.forEach((g, i) => { if (S.eqFilters[i]) S.eqFilters[i].gain.value = g; });
  $$('#eqBars input').forEach((inp, i) => { inp.value = gains[i] ?? 0; });
  $$('.eq-preset').forEach(el => el.classList.toggle('active', el.dataset.preset === name));
}

function buildEQChain() {
  const freqs = [60, 170, 310, 600, 1000, 3000, 6000];
  S.eqFilters = freqs.map((f, i) => {
    const filter = S.audioCtx.createBiquadFilter();
    filter.type = i === 0 ? 'lowshelf' : i === freqs.length - 1 ? 'highshelf' : 'peaking';
    filter.frequency.value = f;
    filter.gain.value = S.eqGains[i];
    return filter;
  });
  S.srcNode.connect(S.eqFilters[0]);
  for (let i = 0; i < S.eqFilters.length - 1; i++) S.eqFilters[i].connect(S.eqFilters[i + 1]);
  S.eqFilters[S.eqFilters.length - 1].connect(S.analyser);
  S.analyser.connect(S.audioCtx.destination);
}

// ── Fullscreen ────────────────────────────────────
function openFullscreen() {
  const fs = $('fullscreen'); if (fs) fs.classList.add('open');
  if (S.audioCtx?.state === 'suspended') S.audioCtx.resume();
}
function closeFullscreen() { const fs = $('fullscreen'); if (fs) fs.classList.remove('open'); }

// ── Lyrics ────────────────────────────────────────
function openLyrics() {
  const s = S.currentSong;
  if (!s) { toast('▶  Toque uma música primeiro'); return; }
  const lc = $('lyricsCover'), lt = $('lyricsSongTitle'), la = $('lyricsSongArtist'), ltxt = $('lyricsText');
  if (lc) lc.src = s.cover;
  if (lt) lt.textContent = s.title;
  if (la) la.textContent = s.artist;
  if (ltxt) ltxt.textContent = s.lyrics || 'Letra não disponível.';
  openModal('lyricsOverlay');
}

// ── Queue ─────────────────────────────────────────
function updateQueueUI() {
  const nowEl = $('queueNow'), nextEl = $('queueNext');
  if (!S.currentSong || !nowEl || !nextEl) return;
  const qItem = s => `<div class="queue-item">
    <img src="${s.cover}" alt="${s.title}" loading="lazy"/>
    <div><div class="qi-title">${s.title}</div><div class="qi-artist">${s.artist}</div></div>
  </div>`;
  nowEl.innerHTML = qItem(S.currentSong);
  nextEl.innerHTML = S.queue.slice(S.qIdx + 1, S.qIdx + 9).map(qItem).join('') || '<p style="color:var(--text3);font-size:.85rem;padding:8px 10px">Fila vazia</p>';
}

// ── Notifications ─────────────────────────────────
function updateNotifBadge() {
  const b = $('notifBadge');
  if (b) b.style.display = (S.unread > 0) ? 'block' : 'none';
}

const notifBtn = $('notifBtn');
if (notifBtn) notifBtn.addEventListener('click', async () => {
  const panel = $('notifPanel'), backdrop = $('notifBackdrop');
  if (panel?.classList.contains('open')) { closeNotifs(); return; }
  const notifs = await api('/api/notifications');
  S.unread = 0; updateNotifBadge();
  const list = $('notifList');
  if (list) list.innerHTML = !notifs?.length
    ? '<div class="notif-empty">Nenhuma notificação</div>'
    : notifs.map(n => `
      <div class="notif-item${n.read ? '' : ' unread'}">
        <div>${n.message}</div>
        <div class="notif-time">${relTime(n.created_at)}</div>
      </div>`).join('');
  if (panel) panel.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
});
function closeNotifs() {
  $('notifPanel')?.classList.remove('open');
  $('notifBackdrop')?.classList.remove('open');
}

// ── Profile ───────────────────────────────────────
function openProfileModal() {
  const colors = ['#1db954', '#e91e8c', '#856cda', '#ff8c00', '#0d73ec', '#e8142e', '#FFD700', '#00bcd4'];
  const picks = $('colorPicks');
  if (picks) {
    picks.innerHTML = colors.map(c =>
      `<div class="color-pick${c === S.user?.avatar_color ? ' selected' : ''}" style="background:${c}" data-color="${c}"></div>`).join('');
    picks.querySelectorAll('.color-pick').forEach(el => el.addEventListener('click', () => {
      $$('.color-pick').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      const ab = $('profileAvatarBig');
      if (ab) ab.style.background = el.dataset.color;
    }));
  }
  const ab = $('profileAvatarBig');
  if (ab) { ab.textContent = S.user?.name?.[0]?.toUpperCase() || 'U'; ab.style.background = S.user?.avatar_color || '#1db954'; }
  const pn = $('profileName'), pb = $('profileBio');
  if (pn) pn.value = S.user?.name || '';
  if (pb) pb.value = S.user?.bio || '';
  openModal('profileOverlay');
}

const saveBtn = $('saveProfileBtn');
if (saveBtn) saveBtn.addEventListener('click', async () => {
  const color = document.querySelector('.color-pick.selected')?.dataset.color || S.user?.avatar_color || '#1db954';
  const pn = $('profileName'), pb = $('profileBio');
  const r = await api('/api/auth/profile', { method: 'POST', body: JSON.stringify({ name: pn?.value || S.user.name, bio: pb?.value || '', avatar_color: color }) });
  if (r?.ok) {
    S.user = r.user;
    const ua = $('userAvatar'), un = $('userName');
    if (ua) { ua.textContent = r.user.name[0].toUpperCase(); ua.style.background = r.user.avatar_color; }
    if (un) un.textContent = r.user.name;
    toast('✅ Perfil atualizado!');
    closeModal('profileOverlay');
  }
});

// ── Create Playlist ───────────────────────────────
async function createNewPlaylist() {
  const nameEl = $('newPlaylistName'), descEl = $('newPlaylistDesc'), errEl = $('newPlaylistErr');
  const name = nameEl?.value.trim() || '';
  if (errEl) errEl.textContent = '';
  if (!name) { if (errEl) errEl.textContent = 'Digite um nome'; return; }
  const r = await api('/api/playlist/create', { method: 'POST', body: JSON.stringify({ name, description: descEl?.value.trim() || '' }) });
  if (!r?.ok) { if (errEl) errEl.textContent = r?.error || 'Erro ao criar'; return; }
  toast(`🎵 "${name}" criada!`);
  closeModal('newPlaylistOverlay');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  const plR = await api('/api/playlists');
  if (plR) { S.userPlaylists = plR.user || []; renderSidebar(); }
}

// ── Logout ────────────────────────────────────────
async function doLogout() {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

// ── Modals ────────────────────────────────────────
function openModal(id) { const el = $(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(id); if (el) el.classList.remove('open'); }

function setupModals() {
  // Create playlist buttons
  const cpb = $('createPlaylistBtn'); if (cpb) cpb.addEventListener('click', createNewPlaylist);
  const nplb = $('newPlaylistLibBtn'); if (nplb) nplb.addEventListener('click', () => openModal('newPlaylistOverlay'));

  // Close on backdrop click
  $$('.modal-overlay').forEach(el => el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); }));

  // Profile link in dropdown
  $$('[onclick*="profileOverlay"]').forEach(el => {
    el.onclick = e => { e.preventDefault(); openProfileModal(); };
  });

  // Events link
  $$('[onclick*="events"]').forEach(el => {
    el.onclick = e => { e.preventDefault(); loadEventsPage(); showView('events'); };
  });

  // Charts link
  const chartsLink = document.querySelector('[onclick*="charts"]');
  if (chartsLink) chartsLink.onclick = e => { e.preventDefault(); loadCharts(); showView('charts'); };
}

// ── Start ──────────────────────────────────────────
boot();
