// ===================== script.js (نسخة مرنة ومصححة) =====================
// مفاتيح التخزين
const STORAGE_KEY_DATA = 'STUDY_DATA_FINAL_V1';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_FINAL_V1';
const ARCHIVE_KEY = 'STUDY_ARCHIVE_FINAL_V1';
const LAST_VIEW_KEY = 'STUDY_LAST_VIEW_FINAL_V1';
const todayIsoReal = new Date().toISOString().slice(0,10);

// ======= أدوات مساعدة =======
function safeJSONParse(s, fallback){ try{ return JSON.parse(s); }catch(e){ return fallback; } }
function uid(){ return '_' + Math.random().toString(36).slice(2,10); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function normalizeText(s){ return (s||'').toString().toLowerCase().trim(); }

// ======= دوال العثور على عناصر DOM بعدة أسماء محتملة (fallbacks) =======
const _POSS = {
  viewDate: ['#viewDate','viewDate','input[name="viewDate"]','#dateInput','.view-date'],
  tasksContainer: ['#todayList','#tasksList','todayList','tasksList','.tasks-list'],
  examsContainer: ['#examsArea','#examsList','examsArea','examsList','.exams-area'],
  todayDate: ['#todayDate','todayDate','.today-date'],
  examModal: ['#examModal','.exam-modal','#modalExam'],
  overlay: ['#overlay','.overlay','#screenOverlay'],
  examQuestions: ['#examQuestions','.exam-questions'],
  submitExamBtn: ['#submitExamBtn','.submit-exam','button[data-action="submit-exam"]'],
  examResult: ['#examResult','.exam-result'],
  examTitleShow: ['#examTitleShow','.exam-title'],
  closeExamBtn: ['#closeExamBtn','.close-exam-btn'],
  menuBtn: ['#menuBtn','.menu-btn','.hamburger'],
  sidebar: ['#sidebar','.sidebar','.side-menu'],
  addTaskBtn: ['#addTaskBtn','.add-task'],
  goDate: ['#goDate','.go-date'],
  todayBtn: ['#todayBtn','.today-btn'],
  resetBtn: ['#resetBtn','.reset-btn'],
  archiveList: ['#archiveList','.archive-list'],
  reportsList: ['#reportsList','.reports-list'],
  statsArea: ['#statsArea','.stats-area']
};
function getEl(key){
  const arr = _POSS[key] || [];
  for(const s of arr){
    if(!s) continue;
    // try id first if string looks like plain id
    if(!s.startsWith('.') && !s.startsWith('#') && document.getElementById(s)) return document.getElementById(s);
    // try querySelector for anything else
    try{
      const q = document.querySelector(s);
      if(q) return q;
    }catch(e){}
  }
  return null;
}

// ======= تحميل البيانات (من localStorage أو getInitialData()) =======
let DATA = safeJSONParse(localStorage.getItem(STORAGE_KEY_DATA), null);
if(!DATA){
  if(typeof window.getInitialData === 'function') DATA = window.getInitialData();
  else DATA = {};
}
let RESULTS = safeJSONParse(localStorage.getItem(STORAGE_KEY_RESULTS), []);
if(!safeJSONParse(localStorage.getItem(ARCHIVE_KEY), null)) localStorage.setItem(ARCHIVE_KEY, JSON.stringify([]));

// ======= حفظ (debounce) =======
let _saveTimeout = null;
function saveAllImmediate(){
  try{
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA));
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS));
  }catch(e){
    console.error('saveAllImmediate error', e);
  }
}
function saveAll(){
  if(_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(()=>{ saveAllImmediate(); _saveTimeout = null; }, 200);
}

// ======= مساعدة: اختيار تاريخ تلقائي (last view أو اليوم أو أقرب تاريخ موجود) =======
function pickInitialDate(){
  const last = localStorage.getItem(LAST_VIEW_KEY);
  if(last) return last;
  // إذا في بيانات محفوظة وايام مختلفة، اختار اليوم إن له بيانات
  if(DATA && Object.keys(DATA).length){
    if(DATA[todayIsoReal]) return todayIsoReal;
    // اختار التاريخ الأقرب لتاريح اليوم من المفاتيح
    const keys = Object.keys(DATA).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k));
    if(keys.length){
      let best=keys[0], bestDiff = Math.abs(dayDiff(keys[0], todayIsoReal));
      for(let k of keys){
        const d = Math.abs(dayDiff(k, todayIsoReal));
        if(d < bestDiff){ best = k; bestDiff = d; }
      }
      return best;
    }
  }
  return todayIsoReal;
}
function dayDiff(aIso,bIso){
  const a = new Date(aIso + 'T00:00:00'); const b = new Date(bIso + 'T00:00:00');
  return Math.round((a - b)/(1000*60*60*24));
}

// ======= عرض الواجهة اليومية (مهام + امتحانات) =======
function renderDashboard(dateIso){
  if(!dateIso) dateIso = pickInitialDate();
  try{ localStorage.setItem(LAST_VIEW_KEY, dateIso); }catch(e){}
  const todayDateEl = getEl('todayDate'); if(todayDateEl) todayDateEl.innerText = dateIso;
  const tasksEl = getEl('tasksContainer');
  const examsEl = getEl('examsContainer');

  if(tasksEl) tasksEl.innerHTML = '';
  if(examsEl) examsEl.innerHTML = '';

  const day = DATA[dateIso] || { tasks: [], exams: [] };

  // عرض المهام
  if((day.tasks||[]).length === 0){
    if(tasksEl) tasksEl.innerHTML = `<li style="list-style:none;padding:10px;color:#666">لا توجد مهام لهذا اليوم.</li>`;
  } else {
    (day.tasks||[]).forEach(task=>{
      const li = document.createElement('li');
      li.style.padding='8px 6px';
      li.innerHTML = `<span>${escapeHtml(task.text)}</span> ${task.done?'<strong style="color:green;margin-left:6px">✔</strong>':''}
        <button class="mark-done" data-id="${task.id}" style="margin-left:8px">تم</button>`;
      tasksEl.appendChild(li);
    });
    // ربط أزرار التحديد كمكتمل
    tasksEl.querySelectorAll('.mark-done').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.dataset.id;
        markTaskDoneById(dateIso, id);
        renderDashboard(dateIso);
        renderArchive();
        renderReports();
        renderStats();
      });
    });
  }

  // عرض الامتحانات
  if((day.exams||[]).length === 0){
    if(examsEl) examsEl.innerHTML = `<div style="color:#666;padding:8px">لا توجد امتحانات لهذا اليوم.</div>`;
  } else {
    (day.exams||[]).forEach((ex, idx)=>{
      const wrap = document.createElement('div');
      wrap.className = 'exam-row';
      wrap.style.marginBottom='10px';
      wrap.innerHTML = `<strong>${escapeHtml(ex.title||'امتحان')}</strong> (${escapeHtml(ex.subject||'عام')}) - <button class="start-exam" data-idx="${idx}">ابدأ الامتحان</button>`;
      examsEl.appendChild(wrap);
    });
    examsEl.querySelectorAll('.start-exam').forEach(b=>{
      b.addEventListener('click', ()=> startExam(dateIso, parseInt(b.dataset.idx)) );
    });
  }
}

// ======= تعليم مهمة كمكتملة وأرشفتها =======
function markTaskDoneById(dateIso, id){
  const arr = (DATA[dateIso] && DATA[dateIso].tasks) || [];
  const idx = arr.findIndex(x=>x.id === id);
  if(idx === -1) return false;
  arr[idx].done = true;
  const archive = safeJSONParse(localStorage.getItem(ARCHIVE_KEY), []);
  archive.push(Object.assign({}, arr[idx], { completedAt: new Date().toISOString(), originDate: dateIso }));
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  saveAll();
  return true;
}

// ======= فتح الامتحان (مودال) =======
function startExam(dateIso, examIndex){
  const day = DATA[dateIso];
  if(!day) { alert('لا توجد بيانات لهذا التاريخ'); return; }
  const exam = (day.exams || [])[examIndex];
  if(!exam) { alert('الامتحان غير متوفر'); return; }

  const examModal = getEl('examModal');
  const overlay = getEl('overlay');
  const qArea = getEl('examQuestions');
  const resultArea = getEl('examResult');
  const titleEl = getEl('examTitleShow');
  if(!examModal || !overlay || !qArea || !resultArea || !titleEl){
    alert('مكونات المودال غير موجودة في HTML (examModal, overlay, examQuestions, examResult, examTitleShow)');
    return;
  }

  // ملء الأسئلة
  titleEl.innerText = `${exam.title || 'امتحان'} • ${exam.subject || ''}`;
  qArea.innerHTML = '';
  (exam.questions || []).forEach((q,i)=>{
    const row = document.createElement('div');
    row.className = 'exam-question';
    row.style.marginBottom='10px';
    row.innerHTML = `<div><strong>س${i+1}:</strong> ${escapeHtml(q.text||'')}</div>
      <div><textarea name="q${i}" style="width:100%;min-height:80px;margin-top:6px;padding:6px"></textarea></div>`;
    qArea.appendChild(row);
  });
  resultArea.innerHTML = '';
  examModal.classList.remove('section-hidden');
  overlay.classList.add('show');

  // اظهار زر الإغلاق المرسل منك إذا موجود
  const closeExamBtn = getEl('closeExamBtn');
  if(closeExamBtn) closeExamBtn.style.display = 'inline-block';

  // ربط زر الإرسال مع إزالة مستمعين سابقين (استبدال العنصر)
  const submitBtn = getEl('submitExamBtn');
  if(submitBtn){
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    newBtn.addEventListener('click', function(){
      newBtn.disabled = true;
      // جمع الإجابات وتقييم
      const answers = (exam.questions || []).map((_,i)=> (document.querySelector(`textarea[name="q${i}"]`) || {value:''}).value.trim());
      const details = (exam.questions || []).map((q,i)=>{
        const ok = normalizeText(answers[i]) === normalizeText(q.answer || '');
        return { question: q.text || '', given: answers[i] || '', answer: q.answer || '', correct: ok };
      });
      const correctCount = details.filter(d=>d.correct).length;
      const score = Math.round((correctCount / Math.max(1, (exam.questions||[]).length)) * 100);
      const resultEntry = { examId: exam.id || uid(), title: exam.title||'', subject: exam.subject||'', date: dateIso, score, details };
      RESULTS.push(resultEntry);
      saveAll();
      // عرض النتائج داخل المودال
      let html = `<h4>النتيجة: ${score}%</h4>`;
      details.forEach((d, idx)=> {
        html += `<div style="margin-bottom:8px">س${idx+1}: <strong style="color:${d.correct ? 'green':'red'}">${d.correct ? '✔ صحيح':'✖ خطأ'}</strong><br>إجابتك: ${escapeHtml(d.given)}<br>الصحيح: ${escapeHtml(d.answer)}</div>`;
      });
      resultArea.innerHTML = html;
      setTimeout(()=> newBtn.disabled = false, 800);
      renderReports();
      renderStats();
    });
  }
}

// ======= زر إغلاق الامتحان (الذي أرسلته) =======
(function bindCloseExam(){
  const closeBtn = getEl('closeExamBtn');
  const examModal = getEl('examModal');
  const overlay = getEl('overlay');
  if(!closeBtn) return;
  closeBtn.style.display = 'none';
  closeBtn.addEventListener('click', function(){
    if(examModal) examModal.classList.add('section-hidden');
    if(overlay) overlay.classList.remove('show');
    this.style.display = 'none';
    const qArea = getEl('examQuestions'); if(qArea) qArea.innerHTML = '';
    const resultArea = getEl('examResult'); if(resultArea) resultArea.innerHTML = '';
    alert('تم إغلاق الامتحان ✅');
  });
})();

// ======= الأرشيف والتقارير والإحصاءات =======
function renderArchive(){
  const arch = safeJSONParse(localStorage.getItem(ARCHIVE_KEY), []);
  const ul = getEl('archiveList');
  if(!ul) return;
  ul.innerHTML = '';
  (arch||[]).forEach(a=>{
    const li = document.createElement('li');
    li.textContent = `${a.text || a.title || 'عنصر'} • ${a.originDate || ''} ✔`;
    ul.appendChild(li);
  });
}
function renderReports(){
  const ul = getEl('reportsList');
  if(!ul) return;
  ul.innerHTML = '';
  (RESULTS||[]).forEach(r=>{
    const li = document.createElement('li');
    li.textContent = `${r.date || ''} • ${r.title || 'امتحان'} (${r.subject||''}) : ${r.score}%`;
    ul.appendChild(li);
  });
}
function renderStats(){
  const node = getEl('statsArea');
  if(!node) return;
  const total = (RESULTS||[]).length;
  if(total === 0){ node.innerHTML = '<p>لا يوجد بيانات.</p>'; return; }
  const avg = ((RESULTS.reduce((a,b)=>a + (b.score||0),0) / total) || 0).toFixed(1);
  node.innerHTML = `<p>عدد الامتحانات: ${total} • المعدل: ${avg}%</p>`;
}

// ======= زر الهامبرغر / الشريط الجانبي (مرن لعدة أسماء) =======
(function bindMenuToggle(){
  const menuBtn = getEl('menuBtn');
  const sidebar = getEl('sidebar');
  const overlay = getEl('overlay');
  if(!menuBtn || !sidebar) return;
  menuBtn.addEventListener('click', ()=>{
    sidebar.classList.toggle('open');
    if(overlay) overlay.classList.toggle('show');
  });
  // اضغط على overlay يغلق أي مودال أو الشريط الجانبي
  if(overlay){
    overlay.addEventListener('click', ()=>{
      document.querySelectorAll('.modal').forEach(m=>m.classList.add('section-hidden'));
      overlay.classList.remove('show');
      const closeBtn = getEl('closeExamBtn'); if(closeBtn) closeBtn.style.display = 'none';
      if(sidebar.classList.contains('open')) sidebar.classList.remove('open');
    });
  }
})();

// ======= عناصر التحكم العامة (إضافة مهمة، اختيار تاريخ، أزرار) =======
document.addEventListener('DOMContentLoaded', ()=>{
  const viewDateInput = getEl('viewDate') || document.querySelector('input[type="date"]');
  const addTaskBtn = getEl('addTaskBtn');
  const goDateBtn = getEl('goDate');
  const todayBtn = getEl('todayBtn');
  const resetBtn = getEl('resetBtn');

  // تعيين قيمة التاريخ الافتراضي (آلياً)
  const initial = pickInitialDate();
  if(viewDateInput) viewDateInput.value = localStorage.getItem(LAST_VIEW_KEY) || initial;

  // إضافة مهمة
  if(addTaskBtn){
    addTaskBtn.addEventListener('click', ()=>{
      const txt = prompt('أدخل نص المهمة:');
      if(!txt) return;
      const dateIso = (viewDateInput && viewDateInput.value) ? viewDateInput.value : todayIsoReal;
      if(!DATA[dateIso]) DATA[dateIso] = { tasks: [], exams: [] };
      DATA[dateIso].tasks.push({ id: uid(), text: txt, done: false });
      saveAll();
      renderDashboard(dateIso);
    });
  }

  if(goDateBtn && viewDateInput){
    goDateBtn.addEventListener('click', ()=> renderDashboard(viewDateInput.value));
  }
  if(todayBtn && viewDateInput){
    todayBtn.addEventListener('click', ()=> { viewDateInput.value = todayIsoReal; renderDashboard(todayIsoReal); });
  }
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(confirm('هل تريد إعادة ضبط البيانات؟')) {
        localStorage.removeItem(STORAGE_KEY_DATA);
        localStorage.removeItem(STORAGE_KEY_RESULTS);
        localStorage.removeItem(ARCHIVE_KEY);
        localStorage.removeItem(LAST_VIEW_KEY);
        location.reload();
      }
    });
  }

  // render initial
  renderDashboard((viewDateInput && viewDateInput.value) ? viewDateInput.value : initial);
  renderReports();
  renderStats();
  renderArchive();

  console.log('Script initialized — initial date:', (viewDateInput && viewDateInput.value) ? viewDateInput.value : initial);
});
