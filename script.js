// script.js (نسخة مُصححة مع فحص أخطاء و debug)
const STORAGE_KEY_DATA = 'STUDY_DATA_V3';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_V3';

// load DATA from localStorage or data.js
let DATA = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || 'null');
if(!DATA){
  if(typeof window.getInitialData === 'function'){
    try{
      DATA = window.getInitialData();
      console.log('Loaded DATA from data.js', Object.keys(DATA).length, 'days');
    }catch(e){
      console.error('Error running getInitialData():', e);
      DATA = {};
    }
  }else{
    console.warn('data.js missing getInitialData()');
    DATA = {};
  }
} else {
  console.log('Loaded DATA from localStorage (custom)', Object.keys(DATA).length, 'days');
}

let RESULTS = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');

function saveAll(){ localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA)); localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS)); }

// DOM ready
document.addEventListener('DOMContentLoaded', ()=>{

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const viewDateInput = document.getElementById('viewDate');
  const goDateBtn = document.getElementById('goDate');
  const resetViewBtn = document.getElementById('resetView');

  const todayIsoReal = new Date().toISOString().split('T')[0];
  // prefer test date 2025-09-13 if present else use last view saved else today's real date
  const testDate = '2025-09-13';
  const lastView = localStorage.getItem('STUDY_LAST_VIEW_V3');
  const defaultView = (DATA[testDate] ? testDate : (lastView || todayIsoReal));
  viewDateInput.value = defaultView;

  // menu toggle (fixed: toggle, overlay closes, navlink closes)
  function openSidebar(){ sidebar.classList.add('open'); overlay.classList.add('show'); sidebar.setAttribute('aria-hidden','false'); }
  function closeSidebar(){ sidebar.classList.remove('open'); overlay.classList.remove('show'); sidebar.setAttribute('aria-hidden','true'); }
  menuBtn.addEventListener('click', ()=>{ if(sidebar.classList.contains('open')) closeSidebar(); else openSidebar(); });
  overlay.addEventListener('click', closeSidebar);
  document.querySelectorAll('.navlink').forEach(btn => btn.addEventListener('click', (ev)=>{
    const tab = btn.dataset.tab;
    showTab(tab);
    closeSidebar();
  }));

  // tabs
  function showTab(id){
    ['dashboard','reports','grades','stats','archive','add'].forEach(x=>{
      const el = document.getElementById(x);
      if(!el) return;
      if(x===id) el.classList.remove('section-hidden'); else el.classList.add('section-hidden');
    });
  }

  // helpers
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
  function normalizeText(s){ return String(s||'').trim().replace(/\s+/g,' ').toLowerCase(); }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function offsetDate(isoDate, offset){ const d = new Date(isoDate); d.setDate(d.getDate() + offset); return d.toISOString().split('T')[0]; }

  // render dashboard for given date
  function renderDashboard(dateIso){
    if(!dateIso) dateIso = viewDateInput.value || new Date().toISOString().split('T')[0];
    document.getElementById('todayDate').innerText = dateIso;
    localStorage.setItem('STUDY_LAST_VIEW_V3', dateIso);

    const ul = document.getElementById('todayList'); ul.innerHTML = '';
    const examsArea = document.getElementById('examsArea'); examsArea.innerHTML = '';

    const day = DATA[dateIso];
    if(!day || (!day.tasks || day.tasks.length === 0) && (!day.exams || day.exams.length === 0)){
      ul.innerHTML = `<li style="list-style:none;padding:10px;color:#666">لا توجد واجبات أو امتحانات لهذا اليوم (${dateIso}).</li>`;
      // also show nearest dates that have tasks (±7 days)
      const nearby = findNearbyDatesWithTasks(dateIso,7);
      if(nearby.length){
        const listHtml = nearby.map(d => `<button class="btn small" data-date="${d}">عرض ${d}</button>`).join(' ');
        ul.innerHTML += `<li style="list-style:none;margin-top:8px">تواريخ قريبة تحتوي بيانات: ${listHtml}</li>`;
        // attach click handlers to those buttons
        setTimeout(()=>{ document.querySelectorAll('#todayList button[data-date]').forEach(b=> b.addEventListener('click', ()=>{ viewDateInput.value = b.dataset.date; renderDashboard(b.dataset.date); })); }, 50);
      }
      return;
    }

    // render tasks
    (day.tasks||[]).forEach((t, idx)=>{
      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(t.subject)}</strong><div style="font-size:13px;color:#555">${escapeHtml(t.content)} • ${t.hours} س</div></div><div><button class="btn mark-done" data-id="${t.id}" data-idx="${idx}">${t.done?'✓':'✅'}</button></div></div>`;
      ul.appendChild(li);
    });

    // event binding for mark-done
    ul.querySelectorAll('.mark-done').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const index = parseInt(btn.dataset.idx,10);
        if(DATA[dateIso] && DATA[dateIso].tasks && DATA[dateIso].tasks[index] && DATA[dateIso].tasks[index].id === id){
          DATA[dateIso].tasks[index].done = !DATA[dateIso].tasks[index].done;
          saveAll();
          renderDashboard(dateIso);
          renderStats();
          renderReports();
        } else {
          // fallback: find by id
          const arr = (DATA[dateIso] && DATA[dateIso].tasks) || [];
          const i = arr.findIndex(x=>x.id===id);
          if(i>-1){ arr[i].done = !arr[i].done; saveAll(); renderDashboard(dateIso); renderStats(); renderReports(); }
        }
      });
    });

    // render exams: show list with start button
    (day.exams||[]).forEach((e, idx)=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '8px';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(e.title)}</strong><div style="font-size:13px;color:#555">${escapeHtml(e.subject)}</div></div><div><button class="btn start-exam" data-idx="${idx}">ابدأ الامتحان</button></div></div>`;
      examsArea.appendChild(div);
    });

    examsArea.querySelectorAll('.start-exam').forEach(b=>{
      b.addEventListener('click', ()=> startExam(dateIso, parseInt(b.dataset.idx,10)));
    });
  }

  // find nearby dates with tasks/exams
  function findNearbyDatesWithTasks(centerIso, range){
    const results = [];
    for(let i=-range;i<=range;i++){
      const d = offsetDate(centerIso, i);
      if(DATA[d] && ((DATA[d].tasks && DATA[d].tasks.length) || (DATA[d].exams && DATA[d].exams.length))){
        if(d !== centerIso) results.push(d);
      }
    }
    return results;
  }

  // start exam (inline modal)
  function startExam(dateIso, examIndex){
    const day = DATA[dateIso];
    if(!day) return alert('لا يوجد امتحان في هذا التاريخ');
    const exam = day.exams[examIndex];
    if(!exam) return alert('الامتحان غير موجود');

    // populate modal
    document.getElementById('examTitleShow').innerText = `${exam.title} • ${exam.subject}`;
    const qArea = document.getElementById('examQuestions'); qArea.innerHTML = '';
    exam.questions.forEach((q, i)=>{
      const div = document.createElement('div');
      div.style.marginTop = '10px';
      div.innerHTML = `<div><strong>س${i+1}:</strong> ${escapeHtml(q.text)}</div><div><textarea name="q${i}" style="width:100%;height:80px;padding:6px;margin-top:6px"></textarea></div>`;
      qArea.appendChild(div);
    });
    document.getElementById('examResult').innerHTML = '';
    document.getElementById('examModal').classList.remove('section-hidden');
    overlay.classList.add('show');

    // submit handler (overwrite any previous)
    document.getElementById('submitExamBtn').onclick = function(){
      const answers = exam.questions.map((_,i)=> (document.querySelector(`textarea[name="q${i}"]`).value||'').trim());
      const details = exam.questions.map((q,i)=> {
        const ok = normalizeText(answers[i]) === normalizeText(q.answer || '');
        return { question: q.text, given: answers[i]||'', answer: q.answer||'', correct: ok };
      });
      const correctCount = details.filter(d=>d.correct).length;
      const score = Math.round((correctCount / exam.questions.length) * 100);
      RESULTS.push({ examId: exam.id || uid(), title: exam.title, subject: exam.subject, date: dateIso, score: score, details: details });
      saveAll();

      // show results
      let html = `<div><strong>النتيجة: ${score} / 100</strong></div><hr>`;
      details.forEach((d, idx)=>{ html += `<div><strong>س${idx+1}:</strong> ${escapeHtml(d.question)}<br><strong>إجابتك:</strong> ${escapeHtml(d.given)}<br><strong>الصحيح:</strong> ${escapeHtml(d.answer)}<br><strong>الحالة:</strong> ${d.correct ? '✅' : '❌'}</div><hr>`; });
      document.getElementById('examResult').innerHTML = html;
      renderGrades();
      renderReports();
      renderStats();
    };
  }

  document.getElementById('closeExam').addEventListener('click', ()=>{
    document.getElementById('examModal').classList.add('section-hidden');
    overlay.classList.remove('show');
  });

  // add new task UI
  document.getElementById('saveTask').addEventListener('click', ()=>{
    const subject = document.getElementById('new_subject').value.trim();
    const content = document.getElementById('new_content').value.trim();
    const hours = parseInt(document.getElementById('new_hours').value, 10) || 1;
    const date = document.getElementById('new_date').value || viewDateInput.value || todayIsoReal;
    if(!subject || !content){ alert('اكمل الحقول'); return; }
    DATA[date] = DATA[date] || { tasks: [], exams: [] };
    DATA[date].tasks.push({ id: `t-${date}-${uid()}`, subject: subject, content: content, hours: hours, done:false });
    saveAll();
    alert('تمت إضافة الواجب');
    showTab('dashboard');
    viewDateInput.value = date;
    renderDashboard(date);
  });

  // render grades
  function renderGrades(){
    const container = document.getElementById('gradesContent'); container.innerHTML = '';
    if(RESULTS.length === 0){ container.innerHTML = '<div class="card">لا توجد درجات بعد.</div>'; return; }
    let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>';
    RESULTS.slice().reverse().forEach(r=> html += `<tr><td style="padding:8px">${r.date}</td><td style="padding:8px">${escapeHtml(r.subject)}</td><td style="padding:8px">${escapeHtml(r.title)}</td><td style="padding:8px">${r.score}</td></tr>`);
    html += '</table>';
    container.innerHTML = html;
  }

  // reports
  function renderReports(){
    const container = document.getElementById('reportsContent'); container.innerHTML = '';
    let totalPlanned=0, totalDone=0, totalExams=0;
    for(let i=0;i<7;i++){
      const d = offsetDate(viewDateInput.value || todayIsoReal, -i);
      const day = DATA[d];
      if(day){
        const tasks = day.tasks||[];
        totalPlanned += tasks.reduce((a,b)=>a+(b.hours||0),0);
        totalDone += tasks.filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0);
        totalExams += (day.exams||[]).length;
      }
    }
    const scores = RESULTS.map(r=>r.score);
    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    const pct = totalPlanned ? Math.round((totalDone/totalPlanned)*100) : 0;
    container.innerHTML = `<div class="card"><strong>ملخص آخر 7 أيام</strong><div style="margin-top:8px">الساعات المخططة: ${totalPlanned} س • الساعات المنجزة: ${totalDone} س • نسبة الإنجاز: ${pct}%</div><div style="margin-top:8px">عدد الامتحانات: ${totalExams} • متوسط الدرجة: ${avgScore}</div></div>`;
  }

  // stats
  function renderStats(){
    const container = document.getElementById('statsContent'); container.innerHTML = '';
    let html = '<div class="stat">';
    const dates = Object.keys(DATA).sort();
    dates.slice(0,10).forEach(d=>{
      const tasks = (DATA[d].tasks||[]);
      const planned = tasks.reduce((a,b)=>a+(b.hours||0),0);
      const done = tasks.filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0);
      const pct = planned ? Math.round((done/planned)*100) : 0;
      html += `<div class="box"><strong>${d}</strong><div style="font-size:13px;color:#555">${planned} س مخطط • ${done} س منجز • ${pct}%</div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // archive
  function renderArchive(){
    const container = document.getElementById('archiveContent'); container.innerHTML = '';
    const dates = Object.keys(DATA).sort().reverse();
    dates.forEach(d=>{
      const day = DATA[d];
      const tcount = (day.tasks||[]).length;
      const ecount = (day.exams||[]).length;
      const div = document.createElement('div'); div.className='card';
      div.innerHTML = `<strong>${d}</strong><div style="font-size:13px;color:#555;margin-top:6px">${tcount} واجب • ${ecount} امتحان</div>`;
      container.appendChild(div);
    });
  }

  // export
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const dataString = 'window.getInitialData = function(){ return ' + JSON.stringify(DATA,null,2) + '; };';
    const blob = new Blob([dataString], {type:'text/javascript;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data.js'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // reset to initial (clear custom data)
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('ستُعاد البيانات للحالة الافتراضية. استمرار؟')){
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_RESULTS);
      localStorage.removeItem('STUDY_LAST_VIEW_V3');
      location.reload();
    }
  });

  // goDate / reset view buttons
  goDateBtn.addEventListener('click', ()=>{ renderDashboard(viewDateInput.value); renderReports(); renderStats(); renderArchive(); });
  resetViewBtn.addEventListener('click', ()=>{ viewDateInput.value = todayIsoReal; renderDashboard(todayIsoReal); });

  // initial render
  renderDashboard(viewDateInput.value || todayIsoReal);
  renderReports();
  renderStats();
  renderGrades();
  renderArchive();
  showTab('dashboard');

  // debug helper: print data keys count
  console.log('Initial render date:', viewDateInput.value, 'DATA keys:', Object.keys(DATA).length);
}); // DOMContentLoaded end
