const API = '/api';

const state = {
  tasks: [],
  projects: [],
  risks: [],
  notes: [],
  roadmap: [],
  currentView: 'tasks',
};

// ---------- API 유틸 ----------

async function apiGet(collection) {
  const res = await fetch(`${API}/${collection}`);
  return res.json();
}
async function apiPost(collection, body) {
  const res = await fetch(`${API}/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function apiPut(collection, id, body) {
  const res = await fetch(`${API}/${collection}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function apiDelete(collection, id) {
  const res = await fetch(`${API}/${collection}/${id}`, { method: 'DELETE' });
  return res.json();
}

// ---------- 초기 로드 ----------

async function loadAll() {
  try {
    const [tasks, projects, risks, notes, roadmap] = await Promise.all([
      apiGet('tasks'), apiGet('projects'), apiGet('risks'), apiGet('notes'), apiGet('roadmap'),
    ]);
    Object.assign(state, { tasks, projects, risks, notes, roadmap });
    document.getElementById('connStatus').textContent = '● 로컬 서버 연결됨';
    renderAll();
  } catch (e) {
    document.getElementById('connStatus').textContent = '○ 서버 연결 실패';
  }
}

function renderAll() {
  updateCounts();
  renderTasks();
  renderProjects();
  renderRisks();
  renderNotes();
  renderRoadmap();
}

function updateCounts() {
  document.getElementById('count-tasks').textContent = state.tasks.filter(t => t.status !== 'done').length;
  document.getElementById('count-projects').textContent = state.projects.length;
  document.getElementById('count-risks').textContent = state.risks.filter(r => r.status !== 'resolved').length;
  document.getElementById('count-notes').textContent = state.notes.length;
  document.getElementById('count-roadmap').textContent = state.roadmap.length;
}

// ---------- 네비게이션 ----------

document.getElementById('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.rail-item');
  if (!btn) return;
  const view = btn.dataset.view;
  state.currentView = view;
  document.querySelectorAll('.rail-item').forEach(b => b.classList.toggle('is-active', b === btn));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.id === `view-${view}`));
});

// ---------- 렌더: 과제 ----------

const STATUS_LABEL = { progress: '진행중', done: '완료', hold: '보류' };
const STATUS_CLASS = { progress: 'status-progress', done: 'status-done', hold: 'status-hold' };

function renderTasks() {
  const el = document.getElementById('list-tasks');
  if (!state.tasks.length) return (el.innerHTML = emptyMsg('아직 등록된 과제가 없습니다.'));
  el.innerHTML = state.tasks
    .slice()
    .sort((a, b) => (a.status === 'done') - (b.status === 'done'))
    .map(t => `
    <div class="row" data-id="${t.id}">
      <div class="row-main">
        <p class="row-title">${esc(t.title)}</p>
        <p class="row-meta">${t.project ? esc(t.project) + ' · ' : ''}${t.due ? '마감 ' + esc(t.due) : '마감일 미정'}</p>
      </div>
      <div class="progress-wrap">
        <div class="progress-track"><div class="progress-fill" style="width:${t.progress || 0}%"></div></div>
        <span class="progress-num">${t.progress || 0}%</span>
      </div>
      <span class="tag ${STATUS_CLASS[t.status] || ''}">${STATUS_LABEL[t.status] || t.status}</span>
      <span></span>
      <div class="row-actions">
        <button class="icon-btn" data-edit="tasks" data-id="${t.id}">편집</button>
        <button class="icon-btn" data-del="tasks" data-id="${t.id}">삭제</button>
      </div>
    </div>
  `).join('');
}

// ---------- 렌더: 프로젝트 · 마일스톤 ----------

function renderProjects() {
  const el = document.getElementById('list-projects');
  if (!state.projects.length) return (el.innerHTML = emptyMsg('아직 등록된 프로젝트가 없습니다.'));
  el.innerHTML = state.projects.map(p => `
    <div class="project-block" data-id="${p.id}">
      <div class="project-block-head">
        <h3>${esc(p.title)}</h3>
        <div class="row-actions">
          <button class="icon-btn" data-edit="projects" data-id="${p.id}">편집</button>
          <button class="icon-btn" data-del="projects" data-id="${p.id}">삭제</button>
          <button class="icon-btn" data-ms-add="${p.id}">+ 마일스톤</button>
        </div>
      </div>
      ${(p.milestones || []).map((m, i) => `
        <div class="milestone-row ${m.done ? 'done' : ''}" data-ms-idx="${i}" data-project="${p.id}">
          <span>${esc(m.title)}</span>
          <span class="milestone-date">${m.date ? esc(m.date) : ''}</span>
          <button class="icon-btn" data-ms-toggle="${i}" data-project="${p.id}">${m.done ? '완료됨' : '완료로'}</button>
        </div>
      `).join('') || '<p class="row-meta" style="padding-left:16px;">등록된 마일스톤 없음</p>'}
    </div>
  `).join('');
}

// ---------- 렌더: 리스크 ----------

const SEV_LABEL = { low: '낮음', mid: '중간', high: '높음' };
const SEV_CLASS = { low: 'sev-low', mid: 'sev-mid', high: 'sev-high' };
const RISK_STATUS_LABEL = { watching: '모니터링', active: '대응중', resolved: '해결됨' };

function renderRisks() {
  const el = document.getElementById('list-risks');
  if (!state.risks.length) return (el.innerHTML = emptyMsg('등록된 리스크가 없습니다.'));
  el.innerHTML = state.risks.map(r => `
    <div class="row" data-id="${r.id}">
      <div class="row-main">
        <p class="row-title">${esc(r.title)}</p>
        <p class="row-meta">${esc(r.description || '')}</p>
      </div>
      <span class="tag ${SEV_CLASS[r.severity] || ''}">심각도 ${SEV_LABEL[r.severity] || r.severity}</span>
      <span class="tag">${RISK_STATUS_LABEL[r.status] || r.status}</span>
      <span></span>
      <div class="row-actions">
        <button class="icon-btn" data-edit="risks" data-id="${r.id}">편집</button>
        <button class="icon-btn" data-del="risks" data-id="${r.id}">삭제</button>
      </div>
    </div>
  `).join('');
}

// ---------- 렌더: 아이디어 노트 ----------

function renderNotes() {
  const el = document.getElementById('list-notes');
  if (!state.notes.length) return (el.innerHTML = emptyMsg('아직 작성된 노트가 없습니다.'));
  el.innerHTML = state.notes.map(n => `
    <div class="note-card" data-id="${n.id}">
      <h4>${esc(n.title)}</h4>
      <p>${esc(n.body || '')}</p>
      <div class="note-tags">
        ${(n.tags || '').split(',').filter(Boolean).map(t => `<span class="tag">${esc(t.trim())}</span>`).join('')}
      </div>
      <div class="row-actions" style="margin-top:10px;">
        <button class="icon-btn" data-edit="notes" data-id="${n.id}">편집</button>
        <button class="icon-btn" data-del="notes" data-id="${n.id}">삭제</button>
      </div>
    </div>
  `).join('');
}

// ---------- 렌더: 로드맵 ----------

const ROADMAP_STATUS_LABEL = { planned: '계획', progress: '진행', done: '완료' };

function renderRoadmap() {
  const el = document.getElementById('list-roadmap');
  if (!state.roadmap.length) return (el.innerHTML = emptyMsg('등록된 로드맵 항목이 없습니다.'));
  el.innerHTML = state.roadmap
    .slice()
    .sort((a, b) => (a.period || '').localeCompare(b.period || ''))
    .map(r => `
    <div class="roadmap-row" data-id="${r.id}">
      <span class="roadmap-period">${esc(r.period || '')}</span>
      <div class="row-main">
        <p class="row-title">${esc(r.title)}</p>
        <p class="row-meta">${esc(r.category || '')}</p>
      </div>
      <span class="tag ${STATUS_CLASS[r.status] || ''}">${ROADMAP_STATUS_LABEL[r.status] || r.status}</span>
      <div class="row-actions">
        <button class="icon-btn" data-edit="roadmap" data-id="${r.id}">편집</button>
        <button class="icon-btn" data-del="roadmap" data-id="${r.id}">삭제</button>
      </div>
    </div>
  `).join('');
}

function emptyMsg(text) {
  return `<div class="empty">${text}</div>`;
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 클릭 위임: 편집/삭제/마일스톤 ----------

document.querySelector('.stage').addEventListener('click', async (e) => {
  const del = e.target.closest('[data-del]');
  if (del) {
    if (!confirm('삭제하시겠습니까?')) return;
    const collection = del.dataset.del, id = del.dataset.id;
    await apiDelete(collection, id);
    state[collection] = state[collection].filter(x => x.id !== id);
    renderAll();
    return;
  }

  const edit = e.target.closest('[data-edit]');
  if (edit) {
    openForm(edit.dataset.edit, edit.dataset.id);
    return;
  }

  const msAdd = e.target.closest('[data-ms-add]');
  if (msAdd) {
    const projectId = msAdd.dataset.msAdd;
    const title = prompt('마일스톤 이름');
    if (!title) return;
    const date = prompt('날짜 (예: 2026-10-01, 생략 가능)') || '';
    const project = state.projects.find(p => p.id === projectId);
    const milestones = [...(project.milestones || []), { title, date, done: false }];
    const updated = await apiPut('projects', projectId, { milestones });
    Object.assign(project, updated);
    renderProjects();
    return;
  }

  const msToggle = e.target.closest('[data-ms-toggle]');
  if (msToggle) {
    const projectId = msToggle.dataset.project;
    const idx = Number(msToggle.dataset.msToggle);
    const project = state.projects.find(p => p.id === projectId);
    const milestones = project.milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m);
    const updated = await apiPut('projects', projectId, { milestones });
    Object.assign(project, updated);
    renderProjects();
    return;
  }
});

// ---------- 폼 정의 ----------

const FORMS = {
  tasks: {
    title: '과제',
    fields: [
      { key: 'title', label: '제목', type: 'text', required: true },
      { key: 'project', label: '관련 프로젝트 (선택)', type: 'text' },
      { key: 'status', label: '상태', type: 'select', options: [['progress', '진행중'], ['hold', '보류'], ['done', '완료']] },
      { key: 'progress', label: '진행률 (%)', type: 'number' },
      { key: 'due', label: '마감일', type: 'text', placeholder: '2026-10-01' },
    ],
  },
  projects: {
    title: '프로젝트',
    fields: [
      { key: 'title', label: '프로젝트명', type: 'text', required: true },
      { key: 'summary', label: '개요', type: 'textarea' },
    ],
  },
  risks: {
    title: '리스크',
    fields: [
      { key: 'title', label: '제목', type: 'text', required: true },
      { key: 'description', label: '설명', type: 'textarea' },
      { key: 'severity', label: '심각도', type: 'select', options: [['low', '낮음'], ['mid', '중간'], ['high', '높음']] },
      { key: 'status', label: '상태', type: 'select', options: [['watching', '모니터링'], ['active', '대응중'], ['resolved', '해결됨']] },
    ],
  },
  notes: {
    title: '아이디어 노트',
    fields: [
      { key: 'title', label: '제목', type: 'text', required: true },
      { key: 'body', label: '내용', type: 'textarea' },
      { key: 'tags', label: '태그 (쉼표로 구분)', type: 'text', placeholder: '전략, 검토필요' },
    ],
  },
  roadmap: {
    title: '로드맵 항목',
    fields: [
      { key: 'period', label: '시기', type: 'text', placeholder: '2026 Q4', required: true },
      { key: 'title', label: '제목', type: 'text', required: true },
      { key: 'category', label: '분류', type: 'text', placeholder: '조직 / 시스템 / 전략' },
      { key: 'status', label: '상태', type: 'select', options: [['planned', '계획'], ['progress', '진행'], ['done', '완료']] },
    ],
  },
};

let formState = { collection: null, id: null };

function openForm(collection, id) {
  const def = FORMS[collection];
  const record = id ? state[collection].find(x => x.id === id) : {};
  formState = { collection, id };

  document.getElementById('sheetTitle').textContent = (id ? '편집 · ' : '추가 · ') + def.title;
  const body = document.getElementById('sheetBody');
  body.innerHTML = def.fields.map(f => renderField(f, record)).join('');
  document.getElementById('overlay').classList.add('is-open');
}

function renderField(f, record) {
  const val = record[f.key] ?? '';
  if (f.type === 'select') {
    return `<div class="field"><label>${f.label}</label>
      <select name="${f.key}">
        ${f.options.map(([v, l]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></div>`;
  }
  if (f.type === 'textarea') {
    return `<div class="field"><label>${f.label}</label><textarea name="${f.key}" placeholder="${f.placeholder || ''}">${esc(val)}</textarea></div>`;
  }
  return `<div class="field"><label>${f.label}</label>
    <input name="${f.key}" type="${f.type}" placeholder="${f.placeholder || ''}" value="${esc(val)}" ${f.required ? 'required' : ''} />
  </div>`;
}

document.querySelectorAll('[data-open-form]').forEach(btn => {
  btn.addEventListener('click', () => openForm(btn.dataset.openForm, null));
});

document.getElementById('sheetClose').addEventListener('click', closeForm);
document.getElementById('sheetCancel').addEventListener('click', closeForm);
document.getElementById('overlay').addEventListener('click', (e) => {
  if (e.target.id === 'overlay') closeForm();
});

function closeForm() {
  document.getElementById('overlay').classList.remove('is-open');
}

document.getElementById('sheet').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { collection, id } = formState;
  const fd = new FormData(e.target);
  const body = {};
  for (const [k, v] of fd.entries()) body[k] = v;
  if (body.progress !== undefined) body.progress = Number(body.progress) || 0;

  if (id) {
    const updated = await apiPut(collection, id, body);
    const idx = state[collection].findIndex(x => x.id === id);
    state[collection][idx] = updated;
  } else {
    const created = await apiPost(collection, body);
    state[collection].push(created);
  }
  closeForm();
  renderAll();
});

// ---------- 시작 ----------

loadAll();
