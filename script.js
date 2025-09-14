// ===================== script.js (نسخة مُصلحة كاملة) =====================
const STORAGE_KEY_DATA = 'STUDY_DATA_FINAL_V2';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_FINAL_V2';
const ARCHIVE_KEY = 'STUDY_ARCHIVE_FINAL_V2';
const todayIsoReal = new Date().toISOString().slice(0,10);

// ======= أدوات =======
function safeJSONParse(s, fallback){ try{ return JSON.parse(s); }catch(e){ return fallback; } }
function uid(){ return '_' + Math.random().toString(36).slice(2,10); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function normalizeText(s){ return (s||'').toString().toLowerCase().trim(); }

// ======= تحميل بيانات =======
let DATA = safeJSONParse(localStorage.getItem(STORAGE_KEY_DATA), null);
if(!DATA){ if(typeof window.getInitialData === 'function') DATA = window.getInitialData(); else DATA = {}; }
let RESULTS = safeJSONParse(localStorage.getItem(STORAGE_KEY_RESULTS), []);
if(!safeJSONParse(localStorage.getItem(ARCHIVE_KEY), null)) localStorage.setItem(ARCHIVE_KEY, JSON.stringify([]));

function saveAll(){ 
  try{ 
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA));
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS));
  }catch(e){ console.error(e); }
}

// ======= إظهار قسم معين =======
function showSection(name){
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('section-hidden'));
  const target = document.getElementById(name);
  if(target) target.classList.remove('section-hidden');
}

// ======= عرض واجبات اليوم =======
function renderDashboard(dateIso = todayIsoReal){
  const todayDateEl = document.getElementById('todayDate');
  if(todayDateEl) todayDateEl.innerText = dateIso;

  const tasksEl = document.getElementById('todayList');
  const examsEl = document.getElementById('examsArea');
  if(tasksEl) tasksEl.innerHTML = '';
  if(examsEl) examsEl.innerHTML = '';

  const day = DATA[dateIso] || { tasks: [], exams: [] };

  // المهام
  const visibleTasks = (day.tasks || []).filter(t => !t.done);
  if(visibleTasks.length === 0){
    tasksEl.innerHTML = `<li style="color:#666">لا توجد مهام لهذا اليوم.</li>`;
  } else {
    visibleTasks.forEach(task=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(task.text)}</span>
        <button class="mark-done" data-id="${task.id}">تم</button>`;
      tasksEl.appendChild(li);
    });
    tasksEl.querySelectorAll('.mark-done').forEach(b=>{
      b.addEventListener('click', ()=>{
        markTaskDoneById(dateIso, b.dataset.id);
        renderDashboard(dateIso);
        renderArchive();
      });
    });
  }

  // الامتحانات
  if((day.exams||[]).length === 0){
    examsEl.innerHTML = `<div style="color:#666">لا توجد امتحانات لهذا اليوم.</div>`;
  } else {
    (day.exams||[]).forEach((ex, idx)=>{
      const div = document.createElement('div');
      div.innerHTML = `<strong>${escapeHtml(ex.title||'امتحان')}</strong> (${escapeHtml(ex.subject||'عام')}) 
        - <button class="start-exam" data-idx="${idx}">ابدأ الامتحان</button>`;
      examsEl.appendChild(div);
    });
    examsEl.querySelectorAll('.start-exam').forEach(b=>{
      b.addEventListener('click', ()=> startExam(dateIso, parseInt(b.dataset.idx)));
    });
  }
}

function markTaskDoneById(dateIso, id){
  const arr = (DATA[dateIso] && DATA[dateIso].tasks) || [];
  const idx = arr.findIndex(x=>x.id === id);
  if(idx === -1) return;
  arr[idx].done = true;
  const archive = safeJSONParse(localStorage.getItem(ARCHIVE_KEY), []);
  archive.push({...arr[idx], completedAt: new Date().toISOString(), originDate: dateIso});
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  saveAll();
}

// ======= فتح الامتحان =======
function startExam(dateIso, examIndex){
  const day = DATA[dateIso];
  const exam = (day.exams || [])[examIndex];
  if(!exam) return alert('الامتحان غير موجود');

  document.getElementById('examTitleShow').innerText = `${exam.title} • ${exam.subject}`;
  const qArea = document.getElementById('examQuestions');
  qArea.innerHTML = '';
  exam.questions.forEach((q,i)=>{
    qArea.innerHTML += `
      <div><strong>س${i+1}:</strong> ${escapeHtml(q.text)}</div>
      <textarea name="q${i}" style="width:100%;margin:6px 0"></textarea>
    `;
  });
  document.getElementById('examResult').innerHTML = '';
  document.getElementById('examModal').classList.remove('section-hidden');
  document.getElementById('overlay').classList.add('show');

  const submitBtn = document.getElementById('submitExamBtn');
  submitBtn.onclick = ()=>{
    const answers = exam.questions.map((_,i)=> (document.querySelector(`textarea[name="q${i}"]`)||{}).value || '');
    const details = exam.questions.map((q,i)=>({
      question: q.text,
      given: answers[i],
      answer: q.answer,
      correct: normalizeText(answers[i]) === normalizeText(q.answer)
    }));
    const score = Math.round(details.filter(d=>d.correct).length / exam.questions.length * 100);
    RESULTS.push({ title: exam.title, subject: exam.subject, date: dateIso, score, details });
    saveAll();

    let html = `<h4>النتيجة: ${score}/100</h4>`;
    details.forEach((d, i)=> html += `<div>س${i+1}: ${d.correct?'✔':'✖'} <br>إجابتك: ${escapeHtml(d.given)} <br>الصحيح: ${escapeHtml(d.answer)}</div>`);
    document.getElementById('examResult').innerHTML = html;
    renderReports(); renderStats();
  };
}

// زر إغلاق الامتحان
document.getElementById('closeExamBtn').addEventListener('click', ()=>{
  document.getElementById('examModal').classList.add('section-hidden');
  document.getElementById('overlay').classList.remove('show');
});

// ======= التقارير والإحصائيات =======
function renderArchive(){
  const ul = document.getElementById('archiveList');
  ul.innerHTML = '';
  const arch = safeJSONParse(localStorage.getItem(ARCHIVE_KEY), []);
  arch.forEach(a=> ul.innerHTML += `<li>${a.text} • ${a.originDate} ✔</li>`);
}
function renderReports(){
  const ul = document.getElementById('reportsList');
  ul.innerHTML = '';
  RESULTS.forEach(r=> ul.innerHTML += `<li>${r.date} • ${r.title} (${r.subject}) : ${r.score}%</li>`);
}
function renderStats(){
  const node = document.getElementById('statsArea');
  const total = RESULTS.length;
  if(total===0) return node.innerHTML = '<p>لا يوجد بيانات.</p>';
  const avg = (RESULTS.reduce((a,b)=>a+b.score,0)/total).toFixed(1);
  node.innerHTML = `<p>عدد الامتحانات: ${total} • المعدل: ${avg}%</p>`;
}

// ======= القائمة الجانبية =======
function setupSidebar(){
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  menuBtn.addEventListener('click', ()=>{ sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
  overlay.addEventListener('click', ()=>{ sidebar.classList.remove('open'); overlay.classList.remove('show'); });

  sidebar.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const target = btn.dataset.target;
      if(target) showSection(target);
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  });
}

// ======= تشغيل عند بدء =======
document.addEventListener('DOMContentLoaded', ()=>{
  setupSidebar();
  renderDashboard(todayIsoReal);
  renderReports();
  renderStats();
  renderArchive();
  showSection('dashboard');
  console.log('✅ Script جاهز');
});
