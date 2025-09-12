// script.js - التشغيل الرئيسي (نسخة متكاملة)
const STORAGE_KEY_DATA = 'STUDY_DATA_CUSTOM_V2';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_V2';

// load data from localStorage or from data.js
let DATA = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || 'null');
if(!DATA){
  if(window.getInitialData) DATA = window.getInitialData();
  else DATA = {};
}
let RESULTS = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');

function saveAll(){ localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA)); localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS)); }

// DOM elements
document.addEventListener('DOMContentLoaded', ()=>{

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const viewDateInput = document.getElementById('viewDate');
  const goDateBtn = document.getElementById('goDate');

  // default view date = 2025-09-13 (testing). If user stored lastView in localStorage, use it.
  const LAST_VIEW = localStorage.getItem('STUDY_LAST_VIEW_V2');
  const defaultView = LAST_VIEW || '2025-09-13';
  viewDateInput.value = defaultView;

  menuBtn.addEventListener('click', ()=>{ sidebar.classList.add('open'); overlay.classList.add('show'); sidebar.setAttribute('aria-hidden','false'); });
  overlay.addEventListener('click', ()=>{ sidebar.classList.remove('open'); overlay.classList.remove('show'); sidebar.setAttribute('aria-hidden','true'); });

  // tabs logic
  function showTab(id){
    ['dashboard','reports','grades','stats','archive','add'].forEach(x=>{
      const el = document.getElementById(x);
      if(!el) return;
      if(x===id) el.classList.remove('section-hidden'); else el.classList.add('section-hidden');
    });
    sidebar.classList.remove('open'); overlay.classList.remove('show');
  }
  document.querySelectorAll('.navlink').forEach(btn=> btn.addEventListener('click', ()=> showTab(btn.dataset.tab)) );

  function todayISOFrom(strDate){
    // if strDate provided (YYYY-MM-DD) return it; else return today's real date
    if(strDate) return strDate;
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  // render dashboard for specific date
  function renderDashboard(forDate){
    const date = todayISOFrom(forDate);
    document.getElementById('todayDate').innerText = date;
    // save last view
    localStorage.setItem('STUDY_LAST_VIEW_V2', date);

    const tasks = (DATA[date] && DATA[date].tasks) ? DATA[date].tasks : [];
    const ul = document.getElementById('todayList'); ul.innerHTML = '';
    tasks.forEach(t=>{
      if(t.done) return;
      const li = document.createElement('li');
      li.innerHTML = <div><strong>${escapeHtml(t.subject)}</strong><div class="muted small">${escapeHtml(t.content)} • ${t.hours} س</div></div><div><button class="btn markDone" data-id="${t.id}">✅</button></div>;
      ul.appendChild(li);
    });
    ul.querySelectorAll('.markDone').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.dataset.id; const arr = DATA[date] && DATA[date].tasks ? DATA[date].tasks : [];
      const idx = arr.findIndex(x=>x.id===id);
      if(idx>-1){ arr[idx].done = true; saveAll(); renderDashboard(date); renderStats(); renderReports(); }
    }));

    // exams
    const exams = (DATA[date] && DATA[date].exams) ? DATA[date].exams : [];
    const exUl = document.getElementById('todayExams'); exUl.innerHTML = '';
    exams.forEach(e=>{
      const li = document.createElement('li');
      li.innerHTML = <div><strong>${escapeHtml(e.title)}</strong><div class="muted small">${escapeHtml(e.subject)}</div></div><div><button class="btn startExam" data-id="${e.id}">ابدأ الامتحان</button></div>;
      exUl.appendChild(li);
    });
    exUl.querySelectorAll('.startExam').forEach(b=> b.addEventListener('click', ()=> openExam(date,b.dataset.id)));
  }

  // open exam modal (same-page)
  function openExam(date, examId){
    const ex = (DATA[date] && DATA[date].exams) ? DATA[date].exams.find(x=>x.id===examId) : null;if(!ex) return alert('الامتحان غير موجود');
    document.getElementById('examTitleShow').innerText = ex.title + ' • ' + ex.subject;
    const area = document.getElementById('examQuestions'); area.innerHTML = '';
    ex.questions.forEach((q,idx)=>{
      const div = document.createElement('div'); div.style.marginTop = '10px';
      div.innerHTML = <div><strong>س${idx+1}:</strong> ${escapeHtml(q.text)}</div><div><textarea name="q${idx}" style="width:100%;height:90px;padding:6px;margin-top:6px"></textarea></div>;
      area.appendChild(div);
    });
    document.getElementById('examResult').innerHTML = '';
    document.getElementById('examModal').classList.remove('section-hidden');
    overlay.classList.add('show');

    document.getElementById('submitExamBtn').onclick = function(){
      const answers = ex.questions.map((q,idx)=> (document.querySelector(`textarea[name="q${idx}"]`).value||'').trim());
      // grade: case-insensitive exact match after normalizing spaces
      let correct = 0;
      const details = ex.questions.map((q,idx)=>{
        const given = normalizeText(answers[idx]||'');
        const expected = normalizeText(q.answer||'');
        const ok = (given === expected);
        if(ok) correct++;
        return { question: q.text, given: answers[idx]||'', answer: q.answer||'', correct: ok };
      });
      const score = Math.round((correct / ex.questions.length) * 100);
      RESULTS.push({ examId: ex.id, title: ex.title, subject: ex.subject, date: date, score: score, details: details });
      saveAll();
      let html = <div><strong>النتيجة: ${score} / 100</strong></div><hr>;
      details.forEach((d,i)=>{ html += <div><strong>س${i+1}:</strong> ${escapeHtml(d.question)}<br><strong>إجابتك:</strong> ${escapeHtml(d.given)}<br><strong>الصحيح:</strong> ${escapeHtml(d.answer)}<br><strong>الحالة:</strong> ${d.correct ? '✅' : '❌'}</div><hr>; });
      document.getElementById('examResult').innerHTML = html;
      renderGrades(); renderReports(); renderStats();
    };
  }

  // close modal
  document.getElementById('closeExam').addEventListener('click', ()=>{
    document.getElementById('examModal').classList.add('section-hidden');
    overlay.classList.remove('show');
  });

  // add task
  document.getElementById('saveTask').addEventListener('click', ()=>{
    const sub = document.getElementById('new_subject').value.trim();
    const cont = document.getElementById('new_content').value.trim();
    const hrs = parseInt(document.getElementById('new_hours').value) || 1;
    const date = document.getElementById('new_date').value  viewDateInput.value  '2025-09-13';
    if(!sub || !cont){ alert('اكمل الحقول'); return; }
    const t = { id: 't-'+date+'-'+uid(), subject: sub, content: cont, hours: hrs, done: false };
    DATA[date] = DATA[date] || { tasks: [], exams: [] };
    DATA[date].tasks.push(t);
    saveAll();
    alert('تمت إضافة الواجب');
    showTab('dashboard');
    renderDashboard(date);
  });

  // render grades
  function renderGrades(){
    const container = document.getElementById('gradesContent'); container.innerHTML = '';
    if(RESULTS.length === 0){ container.innerHTML = '<div class="card">لا توجد درجات مسجلة بعد.</div>'; return; }
    let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>';
    RESULTS.slice().reverse().forEach(r=> html += `<tr><td style="padding:8px">${r.date}</td><td style="padding:8px">${escapeHtml(r.subject)}</td><td style="padding:8px">${escapeHtml(r.title)}</td><td style="padding:8px">${r.score}</td></tr>`);
    html += '</table>';
    container.innerHTML = html;
  }

  // reports: last 7 days
  function renderReports(){
    const container = document.getElementById('reportsContent'); container.innerHTML = '';
    let totalPlanned=0, totalDone=0, totalExams=0;
    for(let i=0;i<7;i++){
      const d = viewDateInput.value ? offsetDate(viewDateInput.value, -i) : offsetDate('2025-09-13', -i);
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
    container.innerHTML = <div class="card"><strong>ملخص آخر 7 أيام</strong><div style="margin-top:8px">الساعات المخططة: ${totalPlanned} س • الساعات المنجزة: ${totalDone} س • نسبة الإنجاز: ${pct}%</div><div style="margin-top:8px">عدد الامتحانات: ${totalExams} • متوسط الدرجة: ${avgScore}</div></div>;
  }

  // stats: next/nearby days
  function renderStats(){
    const container = document.getElementById('statsContent'); container.innerHTML = '';
    let html = '<div class="stat">';
    const dates = Object.keys(DATA).sort();
    dates.slice(0,10).forEach(d=>{
      const tasks = (DATA[d].tasks||[]);
      const planned = tasks.reduce((a,b)=>a+(b.hours||0),0);
      const done = tasks.filter(t=>t.done).reduce((a,b)=>a+(b.hours||0),0);
      const pct = planned ? Math.round((done/planned)*100) : 0;
      html += <div class="box"><strong>${d}</strong><div style="font-size:13px;color:#555">${planned} س مخطط • ${done} س منجز • ${pct}%</div></div>;
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
      div.innerHTML = <strong>${d}</strong><div style="font-size:13px;color:#555;margin-top:6px">${tcount} واجب • ${ecount} امتحان</div>;
      container.appendChild(div);
    });
  }

  // export data.js
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const dataString = 'window.getInitialData = function(){ return ' + JSON.stringify(DATA,null,2) + '; };';
    const blob = new Blob([dataString], {type:'text/javascript;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'data.js'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // reset to initial (remove custom)
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(confirm('ستُعاد البيانات للحالة الافتراضية. استمرار؟')){
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_RESULTS);
      localStorage.removeItem('STUDY_LAST_VIEW_V2');
      location.reload();
    }
  });

  // go to selected date
  goDateBtn.addEventListener('click', ()=>{
    const val = viewDateInput.value || '2025-09-13';
    renderDashboard(val);
    renderReports();
    renderStats();
    renderArchive();
  });

  // initial render based on default viewDate value
  renderDashboard(viewDateInput.value || '2025-09-13');
  renderReports();
  renderStats();
  renderGrades();
  renderArchive();
  showTab('dashboard');

  // helpers inside DOMContentLoaded
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function offsetDate(baseIso, offset){
    const d = new Date(baseIso);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }
  function normalizeText(s){
    return s.toString().trim().replace(/\s+/g,' ').toLowerCase();
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
  }
});
