// script.js - التشغيل الرئيسي
const STORAGE_KEY_DATA = 'STUDY_DATA_CUSTOM_V1';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_V1';

let DATA = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || 'null');
if(!DATA){
  if(window.getInitialData) DATA = window.getInitialData();
  else DATA = {};
}
let RESULTS = JSON.parse(localStorage.getItem(STORAGE_KEY_RESULTS) || '[]');

function saveAll(){ localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA)); localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS)); }

const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
menuBtn.addEventListener('click', ()=>{ sidebar.classList.add('open'); overlay.classList.add('show'); sidebar.setAttribute('aria-hidden','false'); });
overlay.addEventListener('click', ()=>{ sidebar.classList.remove('open'); overlay.classList.remove('show'); sidebar.setAttribute('aria-hidden','true'); });

// tabs
function showTab(id){
  ['dashboard','reports','grades','stats','archive','add'].forEach(x=>{
    const el = document.getElementById(x);
    if(!el) return;
    if(x===id) el.classList.remove('section-hidden'); else el.classList.add('section-hidden');
  });
  sidebar.classList.remove('open'); overlay.classList.remove('show');
}
document.querySelectorAll('.navlink').forEach(btn=>{
  btn.addEventListener('click', ()=> showTab(btn.dataset.tab));
});

// helpers
function todayISO(offset=0){ const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().split('T')[0]; }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// render dashboard
function renderDashboard(){
  const today = todayISO();
  document.getElementById('todayDate').innerText = today;
  const tasks = (DATA[today] && DATA[today].tasks) ? DATA[today].tasks : [];
  const ul = document.getElementById('todayList'); ul.innerHTML = '';
  tasks.forEach(t=>{
    if(t.done) return;
    const li = document.createElement('li');
    li.innerHTML = <div><strong>${t.subject}</strong><div class="muted small">${t.content} • ${t.hours} س</div></div><div><button class="btn markDone" data-id="${t.id}">✅</button></div>;
    ul.appendChild(li);
  });
  ul.querySelectorAll('.markDone').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.dataset.id; const arr = DATA[today].tasks; const idx = arr.findIndex(x=>x.id===id);
    if(idx>-1){ arr[idx].done = true; saveAll(); renderDashboard(); renderStats(); renderReports(); }
  }));

  // exams
  const exams = (DATA[today] && DATA[today].exams) ? DATA[today].exams : [];
  const exUl = document.getElementById('todayExams'); exUl.innerHTML = '';
  exams.forEach(e=>{
    const li = document.createElement('li');
    li.innerHTML = <div><strong>${e.title}</strong><div class="muted small">${e.subject}</div></div><div><button class="btn startExam" data-id="${e.id}">ابدأ الامتحان</button></div>;
    exUl.appendChild(li);
  });
  exUl.querySelectorAll('.startExam').forEach(b=> b.addEventListener('click', ()=> openExam(today,b.dataset.id)));
}

// open exam modal
function openExam(date, examId){
  const ex = (DATA[date] && DATA[date].exams) ? DATA[date].exams.find(x=>x.id===examId) : null;
  if(!ex) return alert('الامتحان غير موجود');
  document.getElementById('examTitleShow').innerText = ex.title + ' • ' + ex.subject;
  const area = document.getElementById('examQuestions'); area.innerHTML = '';
  ex.questions.forEach((q,idx)=>{
    const div = document.createElement('div'); div.style.marginTop = '10px';
    div.innerHTML = <div><strong>س${idx+1}:</strong> ${q.text}</div><div><textarea name="q${idx}" style="width:100%;height:90px;padding:6px;margin-top:6px"></textarea></div>;
    area.appendChild(div);
  });
  document.getElementById('examResult').innerHTML = '';
  document.getElementById('examModal').classList.remove('section-hidden');
  overlay.classList.add('show');

  document.getElementById('submitExamBtn').onclick = function(){
    const answers = ex.questions.map((q,idx)=> (document.querySelector(`textarea[name="q${idx}"]`).value||'').trim());
    let correct = 0;
    const details = ex.questions.map((q,idx)=>{
      const ok = (answers[idx]||'').toLowerCase() === (q.answer||'').toLowerCase();
      if(ok) correct++;
      return { question: q.text, given: answers[idx]||'', answer: q.answer||'', correct: ok };
    });
    const score = Math.round((correct / ex.questions.length) * 100);
    RESULTS.push({ examId: ex.id, title: ex.title, subject: ex.subject, date: date, score: score, details: details });
    saveAll();
    let html = <div><strong>النتيجة: ${score} / 100</strong></div><hr>;
    details.forEach((d,i)=>{ html += <div><strong>س${i+1}:</strong> ${d.question}<br><strong>إجابتك:</strong> ${d.given}<br><strong>الصحيح:</strong> ${d.answer}<br><strong>الحالة:</strong> ${d.correct ? '✅' : '❌'}</div><hr>; });
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
  const date = document.getElementById('new_date').value || todayISO();
  if(!sub || !cont){ alert('اكمل الحقول'); return; }
  const t = { id: 't-'+date+'-'+uid(), subject: sub, content: cont, hours: hrs, done: false };
  DATA[date] = DATA[date] || { tasks: [], exams: [] };
  DATA[date].tasks.push(t);
  saveAll();
  alert('تمت إضافة الواجب');
  showTab('dashboard');
  renderDashboard();
});

// render grades
function renderGrades(){
  const container = document.getElementById('gradesContent'); container.innerHTML = '';
  if(RESULTS.length === 0){ container.innerHTML = '<div class="card">لا توجد درجات مسجلة بعد.</div>'; return; }
  let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>';
  RESULTS.slice().reverse().forEach(r=> html += `<tr><td style="padding:8px">${r.date}</td><td style="padding:8px">${r.subject}</td><td style="padding:8px">${r.title}</td><td style="padding:8px">${r.score}</td></tr>`);
  html += '</table>';
  container.innerHTML = html;
}

// reports
function renderReports(){
  const container = document.getElementById('reportsContent'); container.innerHTML = '';
  let totalPlanned=0, totalDone=0, totalExams=0;
  for(let i=0;i<7;i++){
    const d = todayISO(-i);
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

// export current DATA as data.js
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const dataString = 'window.getInitialData = function(){ return ' + JSON.stringify(DATA,null,2) + '; };';
  const blob = new Blob([dataString], {type:'text/javascript;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'data.js'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// reset to initial (clear custom)
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('ستُعاد البيانات للحالة الافتراضية. استمرار؟')){
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_RESULTS);
    location.reload();
  }
});

// initial render
renderDashboard();
renderReports();
renderStats();
renderGrades();
renderArchive();
showTab('dashboard');
