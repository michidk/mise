import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Router, urlencoded } from 'express';
import type { AdminDatabaseSnapshot } from './room-api/index.js';

const SESSION_COOKIE = 'mise_admin_session';
const PARTICIPANT_ACTIVE_MS = 60_000;

export function createAdminRouter(options: {
  password: string;
  basePath: string;
  secureCookie: boolean;
  snapshot(): Promise<AdminDatabaseSnapshot>;
}) {
  const router = Router();
  const sessionToken = createHmac('sha256', options.password).update('mise-admin-session-v1').digest('base64url');
  router.use((_, response, next) => {
    response.set({
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    });
    next();
  });
  router.use('/login', urlencoded({ extended: false, limit: '2kb' }));

  router.get('/data', async (request, response) => {
    if (!validSession(request.headers.cookie, sessionToken)) {
      response.status(401).json({ error: 'Admin authentication required.' });
      return;
    }
    try {
      response.json(dashboardState(await options.snapshot(), options.basePath, {
        view: queryValue(request.query.view),
        state: queryValue(request.query.state),
        page: queryValue(request.query.page),
      }));
    } catch (error) {
      console.error('Could not load the admin database snapshot.', error);
      response.status(500).json({ error: 'The database snapshot could not be loaded.' });
    }
  });

  router.get('/', async (request, response) => {
    if (!validSession(request.headers.cookie, sessionToken)) {
      response.status(200).type('html').send(loginPage(options.basePath));
      return;
    }
    try {
      response.type('html').send(dashboardPage(await options.snapshot(), options.basePath, {
        view: queryValue(request.query.view),
        state: queryValue(request.query.state),
        page: queryValue(request.query.page),
      }));
    } catch (error) {
      console.error('Could not load the admin database snapshot.', error);
      response.status(500).type('html').send(page('Admin unavailable', '<main class="login-shell"><section class="login-card"><span class="eyebrow">mise operations</span><h1>Dashboard unavailable</h1><p>The database snapshot could not be loaded. Try again shortly.</p></section></main>'));
    }
  });

  router.post('/login', (request, response) => {
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    if (!sameSecret(password, options.password)) {
      response.status(401).type('html').send(loginPage(options.basePath, 'Incorrect password.'));
      return;
    }
    response.setHeader('Set-Cookie', cookieValue(sessionToken, options.basePath, options.secureCookie));
    response.redirect(303, `${options.basePath}/`);
  });

  router.post('/logout', (_, response) => {
    response.setHeader('Set-Cookie', expiredCookie(options.basePath, options.secureCookie));
    response.redirect(303, `${options.basePath}/`);
  });
  return router;
}

function validSession(cookieHeader: string | undefined, expected: string) {
  const value = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? '';
  return sameSecret(value, expected);
}

function sameSecret(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function cookieValue(token: string, basePath: string, secure: boolean) {
  return `${SESSION_COOKIE}=${token}; Path=${basePath}; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? '; Secure' : ''}`;
}

function expiredCookie(basePath: string, secure: boolean) {
  return `${SESSION_COOKIE}=; Path=${basePath}; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

function loginPage(basePath: string, error = '') {
  return page('Admin sign in', `
    <main class="login-shell">
      <form class="login-card" method="post" action="${escapeHtml(basePath)}/login">
        <span class="eyebrow">mise operations</span>
        <h1>Admin dashboard</h1>
        <p>Enter the deployment admin password to inspect room activity.</p>
        ${error ? `<div class="error" role="alert">${escapeHtml(error)}</div>` : ''}
        <label><span>Password</span><input name="password" type="password" autocomplete="current-password" required autofocus></label>
        <button type="submit">Continue</button>
      </form>
    </main>`);
}

type AdminView = 'overview' | 'sessions' | 'participants' | 'signals';
const PAGE_SIZE = 25;

function dashboardPage(snapshot: AdminDatabaseSnapshot, basePath: string, query: { view?: string; state?: string; page?: string }) {
  const state = dashboardState(snapshot, basePath, query);
  return page('Database overview', `
    <div class="admin-shell" data-admin-root data-endpoint="${escapeHtml(basePath)}/data">
      ${sidebar(basePath, state.view)}
      <section class="admin-main">
        <header class="topbar">
          <div><span class="eyebrow">Database</span><h1 data-admin-title>${escapeHtml(state.title)}</h1><p>Updated automatically with TanStack Query</p></div>
          <div class="actions"><form method="post" action="${escapeHtml(basePath)}/logout"><button type="submit">Sign out</button></form></div>
        </header>
        <main id="admin-content" class="dashboard" aria-live="polite">${state.content}</main>
      </section>
    </div>`, adminAssetPath(basePath));
}

function dashboardState(snapshot: AdminDatabaseSnapshot, basePath: string, query: { view?: string; state?: string; page?: string }) {
  const now = snapshot.generatedAt;
  const activeRooms = snapshot.rooms.filter((room) => room.closedAt === null && room.expiresAt > now);
  const pastRooms = snapshot.rooms.filter((room) => room.closedAt !== null || room.expiresAt <= now);
  const activeRoomIds = new Set(activeRooms.map((room) => room.id));
  const activeParticipants = snapshot.participants.filter((participant) => activeRoomIds.has(participant.roomId) && participant.lastSeenAt >= now - PARTICIPANT_ACTIVE_MS);
  const activeSignals = snapshot.signals.filter((signal) => signal.expiresAt > now);
  const view: AdminView = ['sessions', 'participants', 'signals'].includes(query.view ?? '') ? query.view as AdminView : 'overview';
  const sessionState = query.state === 'past' ? 'past' : 'active';
  const requestedPage = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const context = { now, activeRooms, pastRooms, activeRoomIds, activeParticipants, activeSignals };
  const titles: Record<AdminView, string> = {
    overview: 'Overview',
    sessions: 'Sessions',
    participants: 'Participants',
    signals: 'WebRTC signals',
  };
  return {
    view,
    title: titles[view],
    generatedAt: now,
    content: `${view === 'overview' ? overviewView(snapshot, context) : ''}
      ${view === 'sessions' ? sessionsView(snapshot, context, basePath, sessionState, requestedPage) : ''}
      ${view === 'participants' ? participantsView(snapshot, context, basePath, requestedPage) : ''}
      ${view === 'signals' ? signalsView(snapshot, context, basePath, requestedPage) : ''}
      <p class="retention">Past rooms are visible only while retained by the database cleanup policy. Password and participant-token hashes are intentionally never rendered.</p>`,
  };
}

function sidebar(basePath: string, activeView: AdminView) {
  const items: Array<[AdminView, string, string]> = [
    ['overview', 'Overview', '⌂'],
    ['sessions', 'Sessions', '▣'],
    ['participants', 'Participants', '◎'],
    ['signals', 'Signals', '⇄'],
  ];
  return `<aside class="sidebar"><div class="brand"><span>m</span><div><strong>mise</strong><small>Admin</small></div></div><nav aria-label="Database models">${items.map(([view, label, icon]) => `<a data-admin-nav data-view="${view}" class="${view === activeView ? 'active' : ''}" href="${adminHref(basePath, view)}"><i>${icon}</i>${label}</a>`).join('')}</nav></aside>`;
}

function overviewView(snapshot: AdminDatabaseSnapshot, context: DashboardContext) {
  return `<section class="stats" aria-label="Database totals">
      ${stat('Active sessions', context.activeRooms.length, 'live')}
      ${stat('Past sessions', context.pastRooms.length)}
      ${stat('Active participants', context.activeParticipants.length, 'live')}
      ${stat('Stored participants', snapshot.participants.length)}
      ${stat('Live signals', context.activeSignals.length, 'live')}
      ${stat('Stored signals', snapshot.signals.length)}
    </section>
    <section class="overview-grid">
      <article class="summary-card"><span class="eyebrow">Rooms model</span><strong>${snapshot.rooms.length}</strong><p>Total retained session rows</p></article>
      <article class="summary-card"><span class="eyebrow">Participants model</span><strong>${snapshot.participants.length}</strong><p>Host and guest rows</p></article>
      <article class="summary-card"><span class="eyebrow">Signals model</span><strong>${snapshot.signals.length}</strong><p>Ephemeral signaling rows</p></article>
    </section>
    ${roomTable('Recently active', context.activeRooms.slice(0, 5), snapshot, context.now, true)}`;
}

type DashboardContext = {
  now: number;
  activeRooms: AdminDatabaseSnapshot['rooms'];
  pastRooms: AdminDatabaseSnapshot['rooms'];
  activeRoomIds: Set<string>;
  activeParticipants: AdminDatabaseSnapshot['participants'];
  activeSignals: AdminDatabaseSnapshot['signals'];
};

function sessionsView(snapshot: AdminDatabaseSnapshot, context: DashboardContext, basePath: string, state: 'active' | 'past', requestedPage: number) {
  const rows = state === 'active' ? context.activeRooms : context.pastRooms;
  const result = paginate(rows, requestedPage);
  return `<div class="view-toolbar"><div class="segmented" aria-label="Session status"><a data-admin-nav class="${state === 'active' ? 'active' : ''}" href="${adminHref(basePath, 'sessions', 'active')}">Active <b>${context.activeRooms.length}</b></a><a data-admin-nav class="${state === 'past' ? 'active' : ''}" href="${adminHref(basePath, 'sessions', 'past')}">Past <b>${context.pastRooms.length}</b></a></div><span>${result.total} ${state} ${result.total === 1 ? 'session' : 'sessions'}</span></div>
    ${roomTable(state === 'active' ? 'Active sessions' : 'Past sessions', result.items, snapshot, context.now, state === 'active')}
    ${pagination(basePath, 'sessions', result.page, result.pages, state)}`;
}

function participantsView(snapshot: AdminDatabaseSnapshot, context: DashboardContext, basePath: string, requestedPage: number) {
  const result = paginate(snapshot.participants, requestedPage);
  return `<section class="panel">
      <header><div><span class="eyebrow">All rows</span><h2>Participants</h2></div><b>${result.total}</b></header>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>Participant ID</th><th>Room</th><th>Role</th><th>Joined</th><th>Last seen</th><th>Presence</th></tr></thead><tbody>
        ${result.items.map((participant) => `<tr><td><strong>${escapeHtml(participant.name)}</strong></td><td><code>${escapeHtml(participant.id)}</code></td><td><code>${escapeHtml(participant.roomId)}</code></td><td>${participant.isHost ? 'Host' : 'Guest'}</td><td>${formatDate(participant.joinedAt)}</td><td>${formatRelative(participant.lastSeenAt, context.now)}</td><td>${statusBadge(context.activeRoomIds.has(participant.roomId) && participant.lastSeenAt >= context.now - PARTICIPANT_ACTIVE_MS ? 'active' : 'stale')}</td></tr>`).join('') || emptyRow(7, 'No participant rows stored.')}
      </tbody></table></div>
    </section>${pagination(basePath, 'participants', result.page, result.pages)}`;
}

function signalsView(snapshot: AdminDatabaseSnapshot, context: DashboardContext, basePath: string, requestedPage: number) {
  const result = paginate(snapshot.signals, requestedPage);
  return `<section class="panel">
      <header><div><span class="eyebrow">Ephemeral mailbox</span><h2>WebRTC signals</h2></div><b>${result.total}</b></header>
      <p class="note">Signaling payload contents are masked. IDs, routing, kind, size, and retention timestamps are shown.</p>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Room</th><th>Sender</th><th>Recipient</th><th>Kind</th><th>Payload</th><th>Created</th><th>Expires</th></tr></thead><tbody>
        ${result.items.map((signal) => `<tr><td>${signal.id}</td><td><code>${escapeHtml(signal.roomId)}</code></td><td><code>${escapeHtml(signal.senderId)}</code></td><td><code>${escapeHtml(signal.recipientId)}</code></td><td>${escapeHtml(signal.kind)}</td><td>${formatBytes(signal.payloadBytes)}</td><td>${formatDate(signal.createdAt)}</td><td>${formatRelative(signal.expiresAt, context.now)}</td></tr>`).join('') || emptyRow(8, 'No signaling rows stored.')}
      </tbody></table></div>
    </section>${pagination(basePath, 'signals', result.page, result.pages)}`;
}

function roomTable(title: string, roomRows: AdminDatabaseSnapshot['rooms'], snapshot: AdminDatabaseSnapshot, now: number, active: boolean) {
  const participantCount = new Map<string, number>();
  const signalCount = new Map<string, number>();
  for (const participant of snapshot.participants) participantCount.set(participant.roomId, (participantCount.get(participant.roomId) ?? 0) + 1);
  for (const signal of snapshot.signals) signalCount.set(signal.roomId, (signalCount.get(signal.roomId) ?? 0) + 1);
  return `<section class="panel">
    <header><div><span class="eyebrow">${active ? 'Live now' : 'Retained history'}</span><h2>${escapeHtml(title)}</h2></div><b>${roomRows.length}</b></header>
    <div class="table-wrap"><table><thead><tr><th>Room</th><th>Host</th><th>Status</th><th>Protected</th><th>Participants</th><th>Signals</th><th>Created</th><th>Expires / closed</th></tr></thead><tbody>
      ${roomRows.map((room) => `<tr><td><strong>${escapeHtml(room.id)}</strong></td><td><code>${escapeHtml(room.hostId)}</code></td><td>${statusBadge(active ? 'active' : room.closedAt ? 'closed' : 'expired')}</td><td>${room.protected ? 'Yes' : 'No'}</td><td>${participantCount.get(room.id) ?? 0} / ${room.maxParticipants}</td><td>${signalCount.get(room.id) ?? 0}</td><td>${formatDate(room.createdAt)}</td><td>${room.closedAt ? `Closed ${formatRelative(room.closedAt, now)}` : formatRelative(room.expiresAt, now)}</td></tr>`).join('') || emptyRow(8, active ? 'No active sessions.' : 'No past sessions retained.')}
    </tbody></table></div>
  </section>`;
}

function paginate<Item>(items: Item[], requestedPage: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pages, total: items.length };
}

function pagination(basePath: string, view: AdminView, current: number, pages: number, state?: 'active' | 'past') {
  if (pages <= 1) return '';
  const start = Math.max(1, current - 2);
  const end = Math.min(pages, current + 2);
  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  return `<nav class="pagination" aria-label="Pagination"><a data-admin-nav class="${current === 1 ? 'disabled' : ''}" ${current === 1 ? 'aria-disabled="true"' : `href="${adminHref(basePath, view, state, current - 1)}"`}>Previous</a>${numbers.map((pageNumber) => `<a data-admin-nav class="${pageNumber === current ? 'active' : ''}" href="${adminHref(basePath, view, state, pageNumber)}">${pageNumber}</a>`).join('')}<a data-admin-nav class="${current === pages ? 'disabled' : ''}" ${current === pages ? 'aria-disabled="true"' : `href="${adminHref(basePath, view, state, current + 1)}"`}>Next</a><span>Page ${current} of ${pages}</span></nav>`;
}

function adminHref(basePath: string, view: AdminView, state?: 'active' | 'past', page?: number) {
  const query = new URLSearchParams();
  if (view !== 'overview') query.set('view', view);
  if (view === 'sessions' && state) query.set('state', state);
  if (page && page > 1) query.set('page', String(page));
  const suffix = query.toString();
  return `${escapeHtml(basePath)}/${suffix ? `?${escapeHtml(suffix)}` : ''}`;
}

function queryValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function adminAssetPath(basePath: string) {
  return `${basePath.endsWith('/admin') ? basePath.slice(0, -'/admin'.length) : ''}/admin.js`;
}

function stat(label: string, value: number, tone = '') {
  return `<article class="stat ${tone}"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`;
}

function statusBadge(status: string) {
  return `<span class="status ${escapeHtml(status)}"><i></i>${escapeHtml(status)}</span>`;
}

function emptyRow(columns: number, message: string) {
  return `<tr><td class="empty" colspan="${columns}">${escapeHtml(message)}</td></tr>`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }).format(timestamp) + ' UTC';
}

function formatRelative(timestamp: number, now: number) {
  const seconds = Math.round((timestamp - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  return formatter.format(Math.round(minutes / 60), 'hour');
}

function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`;
}

function escapeHtml(value: unknown) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

function page(title: string, content: string, scriptPath?: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · mise admin</title><style>
    :root{color-scheme:dark;--bg:#0d1017;--panel:#151923;--line:#292f3d;--ink:#f4f6fb;--muted:#8e96a8;--blue:#6885ff;--green:#48d69f;--red:#ff7882}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:radial-gradient(circle at 30% 0,#18203a 0,transparent 32rem),var(--bg);font:13px/1.45 Inter,ui-sans-serif,system-ui,sans-serif}.login-shell{min-height:100vh;display:grid;place-items:center;padding:24px}.login-card{width:min(410px,100%);padding:32px;border:1px solid var(--line);border-radius:18px;background:rgba(21,25,35,.94);box-shadow:0 28px 80px #0008}.eyebrow{color:var(--blue);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h1{margin:5px 0 0;font-size:28px;letter-spacing:-.04em}h2{margin:4px 0 0;font-size:18px}.login-card p,.topbar p,.note,.retention,.summary-card p{color:var(--muted)}label{margin-top:24px;display:grid;gap:7px;font-weight:700}input{height:46px;padding:0 13px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:#0e121b;font:inherit;outline:0}input:focus{border-color:var(--blue);box-shadow:0 0 0 3px #6885ff22}button,a{min-height:38px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:9px;color:var(--ink);background:#1c2230;font:inherit;font-weight:750;text-decoration:none;cursor:pointer}.login-card button{width:100%;height:46px;margin-top:14px;border-color:transparent;background:var(--blue)}.error{margin-top:16px;padding:10px;border-radius:8px;color:#ffc5c9;background:#ff78821a}.admin-shell{min-height:100vh;display:grid;grid-template-columns:220px minmax(0,1fr)}.sidebar{height:100vh;padding:22px 14px;position:sticky;top:0;display:flex;flex-direction:column;border-right:1px solid var(--line);background:#0b0e15}.brand{padding:0 8px 26px;display:flex;align-items:center;gap:10px}.brand>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:white;background:var(--blue);font-size:20px;font-weight:900}.brand div{display:flex;flex-direction:column}.brand strong{font-size:15px}.brand small{color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.1em}.sidebar nav{display:grid;gap:5px}.sidebar nav a{height:42px;padding:0 11px;justify-content:flex-start;gap:11px;border-color:transparent;color:#a5adbd;background:transparent}.sidebar nav a i{width:18px;color:#747e94;font-style:normal;text-align:center}.sidebar nav a:hover{color:var(--ink);background:#ffffff08}.sidebar nav a.active{color:white;background:#6885ff1d;border-color:#6885ff2c}.sidebar nav a.active i{color:var(--blue)}.admin-main{min-width:0}.topbar{padding:20px clamp(18px,3vw,42px);display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);background:#0d1017dd}.topbar p{margin:3px 0 0}.actions{display:flex;gap:8px}.actions form{display:flex}.dashboard{padding:24px clamp(18px,3vw,42px) 60px;transition:opacity .15s}.admin-shell.loading .dashboard{opacity:.55}.stats{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:12px}.stat,.panel,.summary-card{border:1px solid var(--line);border-radius:14px;background:rgba(21,25,35,.88);box-shadow:0 16px 40px #0002}.stat{padding:16px}.stat span{display:block;color:var(--muted);font-size:9px;font-weight:750;text-transform:uppercase}.stat strong{display:block;margin-top:7px;font-size:28px}.stat.live strong{color:var(--green)}.overview-grid{margin-top:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.summary-card{padding:18px}.summary-card strong{margin-top:8px;display:block;font-size:32px}.summary-card p{margin:3px 0 0;font-size:10px}.view-toolbar{min-height:48px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:16px}.view-toolbar>span{color:var(--muted);font-size:10px}.segmented{padding:3px;display:flex;border:1px solid var(--line);border-radius:10px;background:#0c1018}.segmented a{min-height:34px;gap:8px;border:0;background:transparent;color:var(--muted)}.segmented a.active{color:white;background:#242b3a}.segmented b{padding:2px 6px;border-radius:99px;background:#ffffff0d;font-size:9px}.panel{margin-top:18px;overflow:hidden}.view-toolbar+.panel{margin-top:0}.panel>header{padding:17px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.panel>header>b{min-width:30px;padding:4px 8px;border-radius:999px;color:var(--blue);background:#6885ff18;text-align:center}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{padding:11px 14px;border-bottom:1px solid #232938;text-align:left}th{color:var(--muted);background:#111620;font-size:9px;letter-spacing:.08em;text-transform:uppercase}td{font-size:11px}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#ffffff03}code{color:#bdc8eb;font:10px ui-monospace,SFMono-Regular,Menlo,monospace}.status{display:inline-flex;align-items:center;gap:6px;text-transform:capitalize}.status i{width:6px;height:6px;border-radius:50%;background:var(--muted)}.status.active i{background:var(--green);box-shadow:0 0 0 3px #48d69f1d}.status.closed i{background:var(--red)}.empty{padding:28px;color:var(--muted);text-align:center}.note{margin:0;padding:12px 18px;border-bottom:1px solid var(--line);font-size:10px}.pagination{margin-top:14px;display:flex;align-items:center;gap:6px}.pagination a{min-width:38px}.pagination a.active{border-color:var(--blue);color:white;background:#6885ff22}.pagination a.disabled{opacity:.4;cursor:default}.pagination span{margin-left:auto;color:var(--muted);font-size:10px}.retention{margin:18px 2px 0;font-size:10px}@media(max-width:1100px){.stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:760px){.admin-shell{grid-template-columns:1fr}.sidebar{width:100%;height:auto;padding:12px 14px;position:static;overflow:auto;border-right:0;border-bottom:1px solid var(--line)}.brand{display:none}.sidebar nav{display:flex}.sidebar nav a{white-space:nowrap}.topbar{align-items:flex-start;flex-direction:column}.actions{width:100%}.actions>*{flex:1}.actions button,.actions a{width:100%}.overview-grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.view-toolbar{align-items:flex-start;flex-direction:column}.pagination{flex-wrap:wrap}.pagination span{width:100%;margin:5px 0 0}}
  </style></head><body>${content}${scriptPath ? `<script type="module" src="${escapeHtml(scriptPath)}"></script>` : ''}</body></html>`;
}
