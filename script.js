// script.js - نسخة متكاملة: واجبات، امتحانات، تسجيل درجات، تقارير، إحصائيات، أرشيف
const STORAGE_KEY_DATA = 'STUDY_DATA_V4';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_V4';

// load initial DATA (data.js) merged with localStorage custom
let DATA = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || 'null');
if(!DATA){
  if(typeof window.getInitialData === 'function') DATA = window.getInitialData();
  else DATA = {};
} else {
  console.log('Loaded custom DATA from localStorage');
}
let RESULTS = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');

function saveAll(){ localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA)); localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS)); }

document.addEventListener('DOMContentLoaded', ()=>{

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const navlinks = document.querySelectorAll('.navlink');
  const viewDateInput = document.getElementById('viewDate');
  const todayBtn = document.getElementById('todayBtn');
  const goDate = document.getElementById('goDate');
  const todayIsoReal = new Date().toISOString().split('T')[0];

  // default view: if data has 2025-09-13 use it, else today's date
  const testDate = '2025-09-13';
  const lastView = localStorage.getItem('STUDY_LAST_VIEW_V4');
  viewDateInput.value = (DATA[testDate] ? testDate : (lastView || todayIsoReal));

  // sidebar toggle
  function openSidebar(){ sidebar.classList.add('open'); overlay.classList.add('show'); sidebar.setAttribute('aria-hidden','false'); }
  function closeSidebar(){ sidebar.classList.remove('open'); overlay.classList.remove('show'); sidebar.setAttribute('aria-hidden','true'); }
  menuBtn.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);
  navlinks.forEach(btn=> btn.addEventListener('click', ()=> { showTab(btn.dataset.tab); closeSidebar(); }));

  function showTab(id){
    ['dashboard','reports','grades','stats','archive','add'].forEach(x=>{
      const el = document.getElementById(x);
      if(!el) return;
      if(x===id) el.classList.remove('section-hidden'); else el.classList.add('section-hidden');
    });
  }

  // helpers
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
  function normalizeText(s){ return String(s||'').trim().replace(/\s+/g,' ').toLowerCase(); }
  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function offsetDate(iso, off){ const d=new Date(iso); d.setDate(d.getDate()+off); return d.toISOString().split('T')[0]; }

  // render functions
  function renderDashboard(dateIso){
    if(!dateIso) dateIso = viewDateInput.value || todayIsoReal;
    document.getElementById('todayDate').innerText = dateIso;
    localStorage.setItem('STUDY_LAST_VIEW_V4', dateIso);

    const ul = document.getElementById('todayList'); ul.innerHTML = '';
    const examsArea = document.getElementById('examsArea'); examsArea.innerHTML = '';

    const day = DATA[dateIso];
    if(!day || ((day.tasks||[]).length===0 && (day.exams||[]).length===0){
      ul.innerHTML = `<li style="list-style:none;padding:10px;color:#666">لا توجد بيانات لهذا اليوم (${dateIso}).</li>`;
      const nearby = findNearbyDatesWithTasks(dateIso,7);
      if(nearby.length){
        ul.innerHTML += `<li style="list-style:none;margin-top:8px">تواريخ قريبة بها بيانات: ${nearby.map(d=>`<button class="btn small pick-date" data-date="${d}">${d}</button>`).join(' ')}</li>`;
        setTimeout(()=>document.querySelectorAll('.pick-date').forEach(b=> b.addEventListener('click', ()=> { viewDateInput.value=b.dataset.date; renderDashboard(b.dataset.date); })),50);
      }
      return;
    }

    // tasks
    (day.tasks||[]).forEach((t, idx)=>{
      if(t.done) return;
      const li = document.createElement('li'); li.style.listStyle='none';
      li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(t.subject)}</strong><div style="font-size:13px;color:#555">${escapeHtml(t.content)} • ${t.hours} س</div></div><div><button class="btn mark-done" data-id="${t.id}" data-idx="${idx}">✅ إكمال</button></div></div>`;
      ul.appendChild(li);
    });
    ul.querySelectorAll('.mark-done').forEach(b=> b.addEventListener('click', ()=>{
      const idx = parseInt(b.dataset.idx,10); const id = b.dataset.id;
      if(DATA[dateIso] && DATA[dateIso].tasks && DATA[dateIso].tasks[idx] && DATA[dateIso].tasks[idx].id===id){
        DATA[dateIso].tasks[idx].done = true;
        const archive = JSON.parse(localStorage.getItem('STUDY_ARCHIVE_V4')||'[]');
        archive.push(Object.assign({}, DATA[dateIso].tasks[idx], { completedAt: new Date().toISOString() }));
        localStorage.setItem('STUDY_ARCHIVE_V4', JSON.stringify(archive));
        saveAll(); renderDashboard(dateIso); renderArchive(); renderReports(); renderStats();
      } else {
        const arr = (DATA[dateIso] && DATA[dateIso].tasks) || []; const i = arr.findIndex(x=>x.id===id);
        if(i>-1){ arr[i].done=true; const archive = JSON.parse(localStorage.getItem('STUDY_ARCHIVE_V4')||'[]'); archive.push(Object.assign({}, arr[i], { completedAt:new Date().toISOString() })); localStorage.setItem('STUDY_ARCHIVE_V4', JSON.stringify(archive)); saveAll(); renderDashboard(dateIso); renderArchive(); renderReports(); renderStats(); }
      }
    }));

    // exams
    (day.exams||[]).forEach((e, idx)=>{
      const div = document.createElement('div'); div.className='card'; div.style.marginBottom='8px';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(e.title)}</strong><div style="font-size:13px;color:#555">${escapeHtml(e.subject)}</div></div><div><button class="btn start-exam" data-idx="${idx}">ابدأ الامتحان</button></div></div>`;
      examsArea.appendChild(div);
    });
    examsArea.querySelectorAll('.start-exam').forEach(b=> b.addEventListener('click', ()=> startExam(dateIso, parseInt(b.dataset.idx,10))));
  }

  function findNearbyDatesWithTasks(centerIso, range){
    const res=[];
    for(let i=-range;i<=range;i++){
      const d = offsetDate(centerIso, i);
      if(DATA[d] && (((DATA[d].tasks||[]).length) || ((DATA[d].exams||[]).length))) if(d!==centerIso) res.push(d);
    }
    return res;
  }

  // exam modal
  function startExam(dateIso, examIndex){
    const day = DATA[dateIso]; if(!day) return alert('لا يوجد هذا الامتحان');
    const exam = day.exams[examIndex]; if(!exam) return alert('الامتحان غير موجود');
    document.getElementById('examTitleShow').innerText = `${exam.title} • ${exam.subject}`;
    const qArea = document.getElementById('examQuestions'); qArea.innerHTML='';
    exam.questions.forEach((q,i)=>{
      const div = document.createElement('div'); div.className='exam-question';
      div.innerHTML = `<div><strong>س${i+1}:</strong> ${escapeHtml(q.text)}</div><div><textarea name="q${i}" style="width:100%;height:90px;padding:8px;margin-top:8px"></textarea></div>`;
      qArea.appendChild(div);
    });
    document.getElementById('examResult').innerHTML='';
    document.getElementById('examModal').classList.remove('section-hidden');
    overlay.classList.add('show');

    document.getElementById('submitExamBtn').onclick = function(){
      const answers = exam.questions.map((_,i)=> (document.querySelector(`textarea[name="q${i}"]`).value||'').trim());
      const details = exam.questions.map((q,i)=> { const ok = normalizeText(answers[i]) === normalizeText(q.answer||''); return { question:q.text, given:answers[i]||'', answer:q.answer||'', correct:ok }; });
      const correctCount = details.filter(d=>d.correct).length;
      const score = Math.round((correctCount / exam.questions.length) * 100);
      RESULTS.push({ examId: exam.id||uid(), title: exam.title, subject: exam.subject, date: dateIso, score: score, details: details });
      saveAll();
      let html = `<div style="padding:8px;border-radius:8px;background:linear-gradient(90deg,var(--accent-brown-3),#fff)"><strong>النتيجة: ${score} / 100</strong></div><hr>`;
      details.forEach((d,idx)=> html += `<div style="margin-top:8px"><strong>س${idx+1}:</strong> ${escapeHtml(d.question)}<br><strong>إجابتك:</strong> ${escapeHtml(d.given)}<br><strong>الصحيح:</strong> ${escapeHtml(d.answer)}<br><strong>الحالة:</strong> ${d.correct? '✅':'❌'}</div><hr>`);
      document.getElementById('examResult').innerHTML = html;
      renderGrades(); renderReports(); renderStats();
    };
  }

  document.getElementById('closeExam').addEventListener('click', ()=>{ document.getElementById('examModal').classList.add('section-hidden'); overlay.classList.remove('show'); });

  // add task
  document.getElementById('saveTask').addEventListener('click', ()=>{
    const sub = document.getElementById('new_subject').value.trim();
    const cont = document.getElementById('new_content').value.trim();
    const hrs = parseInt(document.getElementById('new_hours').value,10) || 1;
    const date = document.getElementById('new_date').value || viewDateInput.value || todayIsoReal;
    if(!sub || !cont){ alert('اكمل الحقول'); return; }
    DATA[date] = DATA[date] || { tasks: [], exams: [] };
    DATA[date].tasks.push({ id:`t-${date}-${uid()}`, subject: sub, content: cont, hours: hrs, done:false, createdAt:new Date().toISOString() });
    saveAll();
    alert('تمت إضافة الواجب');
    showTab('dashboard');
    viewDateInput.value = date;
    renderDashboard(date);
  });

  // grades table
  function renderGrades(){ const c = document.getElementById('gradesContent'); c.innerHTML=''; if(RESULTS.length===0){ c.innerHTML='<div class="card">لا توجد درجات بعد.</div>'; return; } let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>'; RESULTS.slice().reverse().forEach(r=> html += `<tr><td style="padding:8px">${r.date}</td><td style="padding:8px">${escapeHtml(r.subject)}</td><td style="padding:8px">${escapeHtml(r.title)}</td><td style="padding:8px">${r.score}</td></tr>`); html += '</table>'; c.innerHTML = html; }

  // reports: hours daily/weekly/monthly + rating/10
  function renderReports(){
    const c = document.getElementById('reportsContent'); c.innerHTML='';
    const view = viewDateInput.value || todayIsoReal;
    const day = DATA[view] || { tasks:[], exams:[] };
    const planned = (day.tasks||[]).reduce((a,b)=>a+(b.hours||0),0);
    const done = (day.tasks||[]).filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0);
    let weekPlanned=0, weekDone=0; for(let i=0;i<7;i++){ const d=offsetDate(view,-i); const dd = DATA[d] || {tasks:[]}; weekPlanned += (dd.tasks||[]).reduce((a,b)=>a+(b.hours||0),0); weekDone += (dd.tasks||[]).filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0); }
    let monPlanned=0, monDone=0; for(let i=0;i<30;i++){ const d=offsetDate(view,-i); const dd = DATA[d] || {tasks:[]}; monPlanned += (dd.tasks||[]).reduce((a,b)=>a+(b.hours||0),0); monDone += (dd.tasks||[]).filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0); }
    const weekPct = weekPlanned? Math.round((weekDone/weekPlanned)*100):0;
    const monPct = monPlanned? Math.round((monDone/monPlanned)*100):0;
    const dayPct = planned? Math.round((done/planned)*100):0;
    const ratingWeek = Math.round((weekPct/100)*10*10)/10;
    const ratingMonth = Math.round((monPct/100)*10*10)/10;
    let html = `<div class="card"><strong>ملخص الساعات</strong><div style="margin-top:8px">اليومي: ${done} من ${planned} س • نسبة الإنجاز: ${dayPct}%</div><div style="margin-top:6px">الأسبوعي: ${weekDone} من ${weekPlanned} س • ${weekPct}% • تقييم الأسبوع: ${ratingWeek} / 10</div><div style="margin-top:6px">الشهري: ${monDone} من ${monPlanned} س • ${monPct}% • تقييم الشهر: ${ratingMonth} / 10</div></div>`;
    c.innerHTML = html;
  }

  // stats: per-subject progress based on tasks done / total
  function renderStats(){
    const c = document.getElementById('statsContent'); c.innerHTML='';
    const subjects = {};
    Object.keys(DATA).forEach(d=>{ (DATA[d].tasks||[]).forEach(t=>{ subjects[t.subject]=subjects[t.subject]||{planned:0,done:0}; subjects[t.subject].planned += (t.hours||0); if(t.done) subjects[t.subject].done += (t.hours||0); }); });
    if(Object.keys(subjects).length===0){ c.innerHTML='<div class="card">لا توجد بيانات إحصائية.</div>'; return; }
    let html = '<div class="stat">';
    Object.keys(subjects).forEach(sub=>{ const s = subjects[sub]; const pct = s.planned? Math.round((s.done/s.planned)*100):0; html += `<div class="box"><strong>${escapeHtml(sub)}</strong><div style="font-size:13px;color:#555;margin-top:6px">${s.done} س من ${s.planned} س</div><div class="progress" style="margin-top:8px"><div style="width:${pct}%"></div></div><div style="margin-top:6px">${pct}% إنجاز</div></div>`; });
    html += '</div>'; c.innerHTML = html;
  }

  // archive
  function renderArchive(){
    const container = document.getElementById('archiveContent'); container.innerHTML='';
    const arc = JSON.parse(localStorage.getItem('STUDY_ARCHIVE_V4')||'[]');
    if(arc.length===0){ container.innerHTML='<div class="card">لا يوجد أرشيف بعد.</div>'; return; }
    const groups = {};
    arc.forEach(a=>{ const d = (a.completedAt||'').split('T')[0] || 'unknown'; groups[d]=groups[d]||[]; groups[d].push(a); });
    Object.keys(groups).sort().reverse().forEach(d=>{ const div = document.createElement('div'); div.className='card'; let inner = `<strong>${d}</strong><div style="margin-top:8px">`; groups[d].forEach(it=> inner += `<div style="margin-top:6px">${escapeHtml(it.subject)} - ${escapeHtml(it.content)} • ${it.hours} س</div>`); inner += `</div>`; div.innerHTML = inner; container.appendChild(div); });
  }

  // bind export/reset
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const dataString = 'window.getInitialData = function(){ return ' + JSON.stringify(DATA,null,2) + '; };';
    const blob = new Blob([dataString], {type:'text/javascript;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='data.js'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  document.getElementById('resetBtn').addEventListener('click', ()=>{ if(confirm('ستُعاد البيانات للحالة الافتراضية. استمرار؟')){ localStorage.removeItem(STORAGE_KEY_DATA); localStorage.removeItem(STORAGE_KEY_RESULTS); localStorage.removeItem('STUDY_ARCHIVE_V4'); localStorage.removeItem('STUDY_LAST_VIEW_V4'); location.reload(); } });

  // go date / today
  goDate.addEventListener('click', ()=>{ renderDashboard(viewDateInput.value); renderReports(); renderStats(); renderArchive(); renderGrades(); });
  todayBtn.addEventListener('click', ()=>{ viewDateInput.value = todayIsoReal; renderDashboard(todayIsoReal); renderReports(); renderStats(); renderArchive(); renderGrades(); });

  // initial render
  renderDashboard(viewDateInput.value || todayIsoReal);
  renderReports();
  renderStats();
  renderArchive();
  renderGrades();

  console.log('Dashboard loaded, view date:', viewDateInput.value, 'DATA days:', Object.keys(DATA).length);
}); // DOMContentLoaded end

// helper function renderGrades declared here so callable earlier too
function renderGrades(){
  const c = document.getElementById('gradesContent'); c.innerHTML='';
  const RESULTS = JSON.parse(localStorage.getItem('STUDY_RESULTS_V4')||'[]');
  if(RESULTS.length===0){ c.innerHTML = '<div class="card">لا توجد درجات بعد.</div>'; return; }
  let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>';
  RESULTS.slice().reverse().forEach(r=> html += `<tr><td style="padding:8px">${r.date}</td><td style="padding:8px">${r.subject}</td><td style="padding:8px">${r.title}</td><td style="padding:8px">${r.score}</td></tr>`);
  html += '</table>'; c.innerHTML = html;
}
