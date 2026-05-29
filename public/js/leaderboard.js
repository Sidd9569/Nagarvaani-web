const els = {
  card: document.getElementById('leaderboardCard'),
  list: document.getElementById('lebList'),
  empty: document.getElementById('lebEmpty'),
  meta: document.getElementById('lebMeta'),
  search: document.getElementById('lebSearch'),
  sort: document.getElementById('lebSort'),
  tabs: Array.from(document.querySelectorAll('.leb-tab'))
};

let leaderboardData = [];
let currentRange = 'weekly';

function medalClass(rank){
  if(rank===1) return 'gold';
  if(rank===2) return 'silver';
  if(rank===3) return 'bronze';
  return '';
}

function medalEmoji(rank){
  if(rank===1) return '🏆';
  if(rank===2) return '🥈';
  if(rank===3) return '🥉';
  return '';
}

function achievementForUser(u){
  const score = u.totalScore || 0;
  const reps = u.reportsSubmitted || 0;
  if(u.rank===1) return 'Top Neon';
  if(u.rank===2) return 'Silver Spark';
  if(u.rank===3) return 'Bronze Byte';
  if(score>=500) return 'Rank Hacker';
  if(reps>=10) return 'Fix Master';
  return null;
}

function rippleify(el){
  el.classList.add('leb-ripple');
  el.addEventListener('click', (e)=>{
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--x', x+'px');
    el.style.setProperty('--y', y+'px');
  });
}

function avatarPlaceholder(u){
  const letter = (u.name && u.name.trim()) ? u.name.trim().charAt(0).toUpperCase() : 'N';
  return letter;
}

function renderList(list){
  if(!els.list) return;
  els.list.innerHTML = '';

  if(!list || list.length===0){
    if(els.empty) els.empty.style.display = 'block';
    return;
  }
  if(els.empty) els.empty.style.display = 'none';

  const frag = document.createDocumentFragment();

  list.forEach((u)=>{
    const rank = u.rank;
    const medal = medalClass(rank);
    const badge = achievementForUser(u);

    const avatarUrl = u.avatarUrl || '';
    const contact = u.email || u.mobileNumber || 'N/A';
    const city = u.city || '—';

    const score = u.totalScore || 0;
    const points = u.points || 0;
    const credit = u.creditPoints || 0;

    const progress = Math.max(0, Math.min(100, (score / (leaderboardData[0]?.totalScore || 1)) * 100));

    const row = document.createElement('li');
    row.className = 'leb-row';

    const medalHtml = (rank<=3)
      ? `<div class="leb-medal ${medal}">${medalEmoji(rank)}</div>`
      : `<div class="leb-medal">#${rank}</div>`;

    const crownHtml = rank===1 ? '<span style="position:absolute;top:6px;right:10px;opacity:.9;filter:drop-shadow(0 0 16px rgba(255,215,0,.35));">👑</span>' : '';

    row.innerHTML = `
      <div style="position:relative;">${medalHtml}${crownHtml}</div>
      <div class="leb-user">
        <div class="leb-user" style="margin-bottom:8px;">
          <div class="leb-avatar" title="${u.name||'Anonymous'}">
            ${avatarUrl ? `<img alt="avatar" src="${avatarUrl}" onerror="this.style.display='none'"/>` : `<span style="font-weight:900;">${avatarPlaceholder(u)}</span>`}
          </div>
          <div class="meta">
            <div class="name">${u.name || 'Anonymous'}</div>
            <div class="sub">${contact} • ${city}</div>
          </div>
        </div>

        <div class="leb-progress">
          <div class="top"><span>Score</span><span>${score}</span></div>
          <div class="leb-bar"><span style="width:${progress}%;"></span></div>
        </div>
      </div>

      <div class="leb-progress" style="text-align:right;">
        <div class="top"><span>Points</span><span>${points}</span></div>
        <div class="leb-bar"><span style="width:${Math.max(6, Math.min(100, (points/(leaderboardData[0]?.points||1))*100))}%; background: linear-gradient(90deg, rgba(16,185,129,.95), rgba(0,212,255,.75));"></span></div>
      </div>

      <div class="leb-ach">
        <div class="leb-stat"><strong>${credit}</strong> credit</div>
        ${badge ? `<div class="chip" style="margin-top:10px;display:inline-flex;border:1px solid rgba(0,212,255,.25);background:rgba(255,255,255,.03);border-radius:999px;padding:8px 10px;font-weight:900;color:rgba(240,244,255,.85);">🏅 ${badge}</div>` : ''}
      </div>

      <div class="leb-stat" style="justify-self:end;">
        <div style="color:rgba(240,244,255,.85);font-weight:900;">${u.reportsSubmitted || 0}</div>
        <div style="color:rgba(240,244,255,.55);font-weight:750;font-size:.82rem;">Reports</div>
      </div>
    `;

    rippleify(row);
    frag.appendChild(row);
  });

  els.list.appendChild(frag);
}

function applyFiltersAndRender(){
  const q = (els.search?.value || '').trim().toLowerCase();
  const sortKey = els.sort?.value || 'rank';

  let arr = [...leaderboardData];

  if(q){
    arr = arr.filter(u => {
      const name = (u.name||'').toLowerCase();
      const email = (u.email||'').toLowerCase();
      const mob = (u.mobileNumber||'').toLowerCase();
      return name.includes(q) || email.includes(q) || mob.includes(q);
    });
  }

  // Sorting
  if(sortKey==='rank'){
    arr.sort((a,b)=>(a.rank||0)-(b.rank||0));
  } else if(sortKey==='totalScore'){
    arr.sort((a,b)=>(b.totalScore||0)-(a.totalScore||0));
  } else if(sortKey==='name'){
    arr.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  }

  els.meta && (els.meta.textContent = `Range: ${currentRange.toUpperCase()} • Showing ${arr.length}`);
  renderList(arr);
}

async function loadLeaderboard(){
  const res = await fetch('http://localhost:5000/api/dashboard/leaderboard');
  const data = await res.json();
  leaderboardData = Array.isArray(data) ? data : [];

  // Set default rank if missing
  leaderboardData.forEach((u, idx)=>{
    if(!u.rank) u.rank = idx+1;
  });

  applyFiltersAndRender();
}

// Wire UI
if(els.tabs.length){
  els.tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      els.tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      currentRange = t.dataset.range || 'weekly';
      applyFiltersAndRender();
    });
  });
}

els.search?.addEventListener('input', ()=>applyFiltersAndRender());
els.sort?.addEventListener('change', ()=>applyFiltersAndRender());

if(document.getElementById('lebList')) loadLeaderboard();

