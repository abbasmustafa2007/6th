// script.js — النسخة النهائية المتكاملة
// تخزين المفاتيح
const STORAGE_KEY_DATA = 'STUDY_DATA_FINAL_V1';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_FINAL_V1';
const STORAGE_KEY_ARCHIVE = 'STUDY_ARCHIVE_FINAL_V1';
const STORAGE_KEY_LASTVIEW = 'STUDY_LAST_VIEW_FINAL_V1';

// تاريخ اليوم بصيغة ISO YYYY-MM-DD
const todayIsoReal = new Date().toISOString().split('T')[0];

// مساعدة صغيرة
function safeParse(s, fallback){ try{ return JSON.parse(s); } catch(e){ return fallback; } }
function uid(){ return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s){ return String(s||''); }
function normalizeText(s){ return String(s||'').toLowerCase().trim(); }

// ---- تحميل بيانات البداية (من localStorage أو من data.js via getInitialData) ----
let DATA = safeParse(localStorage.getItem(STORAGE_KEY_DATA), null);
if(!DATA){
  if(typeof window.getInitialData === 'function') DATA = window.getInitialData();
  else DATA = {};
}
let RESULTS = safeParse(localStorage.getItem(STORAGE_KEY_RESULTS), []);
if(!Array.isArray(RESULTS)) RESULTS = [];
if(!safeParse(localStorage.getItem(STORAGE_KEY_ARCHIVE), null)) localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify([]));

// ---- حفظ البيانات (debounced lite) ----
let _saveTimer = null;
function saveAll(){
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(()=>{
    try{
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA));
      localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS));
    }catch(e){
      console.error('save error', e);
    } finally { _saveTimer = null; }
  }, 150);
}

// ---- عرض وإخفاء الأقسام ----
function showSection(id){
  const sections = ['dashboard','reports','grades','stats','archive','add'];
  sections.forEach(s => {
    const el = document.getElementById(s);
    if(!el) return;
    if(s === id) el.classList.remove('section-hidden'); else el.classList.add('section-hidden');
  });
}

// ---- تحديد التاريخ الابتدائي (نستخدم اليوم افتراضياً، أو آخر اختيار) ----
function pickInitialDate(){
  const last = localStorage.getItem(STORAGE_KEY_LASTVIEW);
  if(last) return last;
  // إذا البيانات تحتوي على نفس اليوم، نُفضّله (مفيد أثناء الاختبار)
  if(DATA && DATA[todayIsoReal]) return todayIsoReal;
  // وإلا نختار اليوم
  return todayIsoReal;
}

// ---- عرض لوحة اليوم (مهام + امتحانات) ----
function renderDashboard(dateIso){
  if(!dateIso) dateIso = pickInitialDate();
  try{ localStorage.setItem(STORAGE_KEY_LASTVIEW, dateIso); } catch(e){}

  const todayLabel = document.getElementById('todayDate');
  if(todayLabel) todayLabel.innerText = dateIso;

  const ul = document.getElementById('todayList');
  const examsArea = document.getElementById('examsArea');
  if(ul) ul.innerHTML = '';
  if(examsArea) examsArea.innerHTML = '';

  const day = DATA[dateIso] || { tasks: [], exams: [] };

  // عرض المهام غير المكتملة فقط
  const tasks = (day.tasks || []).filter(t => !t.done);
  if(!ul) console.warn('todayList element not found');
  if(tasks.length === 0){
    if(ul) ul.innerHTML = `<li style="padding:10px;color:#666">لا توجد مهام لهذا اليوم.</li>`;
  } else {
    tasks.forEach(t => {
      const li = document.createElement('li');
      li.style.padding = '10px';
      li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${esc(t.subject || t.title || 'مادة')}</strong>
          <div style="font-size:13px;color:#444">${esc(t.content || t.text || t.title || '')} ${t.hours ? ' • ' + t.hours + ' س' : ''}</div>
        </div>
        <div>
          <button class="btn mark-done" data-id="${t.id}">✅ إكمال</button>
        </div>
      </div>`;
      ul.appendChild(li);
    });
    // ربط أزرار الإكمال
    ul.querySelectorAll('.mark-done').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        markTaskDone(dateIso, id);
        // إعادة العرض
        renderDashboard(dateIso);
        renderArchive();
        renderReports();
        renderStats();
      });
    });
  }

  // عرض الامتحانات
  const exams = (day.exams || []);
  if(exams.length === 0){
    if(examsArea) examsArea.innerHTML = `<div style="padding:10px;color:#666">لا توجد امتحانات لهذا اليوم.</div>`;
  } else {
    exams.forEach((ex, idx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '8px';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${esc(ex.title || 'امتحان')}</strong>
          <div style="font-size:13px;color:#555">${esc(ex.subject || '')}</div>
        </div>
        <div>
          <button class="btn start-exam" data-idx="${idx}">ابدأ الامتحان</button>
        </div>
      </div>`;
      examsArea.appendChild(card);
    });
    examsArea.querySelectorAll('.start-exam').forEach(b=>{
      b.addEventListener('click', ()=> startExam(dateIso, parseInt(b.dataset.idx,10)));
    });
  }
}

// ---- تعليم مهمة كمكتملة --> أرشفة ----
function markTaskDone(dateIso, id){
  const arr = (DATA[dateIso] && DATA[dateIso].tasks) || [];
  const index = arr.findIndex(x => x.id === id);
  if(index === -1) return false;
  arr[index].done = true;
  // أضف نسخة إلى الأرشيف
  const archive = safeParse(localStorage.getItem(STORAGE_KEY_ARCHIVE), []);
  archive.push(Object.assign({}, arr[index], { completedAt: new Date().toISOString(), originDate: dateIso }));
  localStorage.setItem(STORAGE_KEY_ARCHIVE, JSON.stringify(archive));
  saveAll();
  return true;
}

// ---- فتح الامتحان في مودال ----
function startExam(dateIso, examIndex){
  const day = DATA[dateIso] || { exams: [] };
  const exam = (day.exams || [])[examIndex];
  if(!exam){
    alert('الامتحان غير متاح');
    return;
  }

  const examModal = document.getElementById('examModal');
  const overlay = document.getElementById('overlay');
  const qArea = document.getElementById('examQuestions');
  const resultArea = document.getElementById('examResult');
  const titleEl = document.getElementById('examTitleShow');

  if(!examModal || !qArea || !resultArea || !titleEl || !overlay){
    alert('مكونات المودال ناقصة في HTML.');
    return;
  }

  // افراغ وسرد الأسئلة
  titleEl.innerText = `${exam.title || 'امتحان'} • ${exam.subject || ''}`;
  qArea.innerHTML = '';
  (exam.questions || []).forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'exam-question';
    block.innerHTML = `<div><strong>س${i+1}:</strong> ${esc(q.text || '')}</div>
      <div><textarea name="q${i}" style="width:100%;min-height:80px;margin-top:8px;padding:8px"></textarea></div>`;
    qArea.appendChild(block);
  });

  resultArea.innerHTML = '';
  examModal.classList.remove('section-hidden');
  overlay.classList.add('show');

  // اظهار زر الإغلاق (الموجود في index كـ id="closeExam")
  const closeBtn = document.getElementById('closeExam');
  if(closeBtn) closeBtn.style.display = 'inline-block';

  // attach submit handler (نستبدل أي مستمع سابق لضمان عدم الازدواج)
  const submitBtn = document.getElementById('submitExamBtn');
  if(submitBtn){
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    newBtn.addEventListener('click', function(){
      newBtn.disabled = true;
      // جمع الإجابات وتصحيحها
      const answers = (exam.questions || []).map((_, i) => {
        const ta = document.querySelector(`textarea[name="q${i}"]`);
        return ta ? (ta.value||'').trim() : '';
      });
      const details = (exam.questions || []).map((q, i) => {
        const correct = normalizeText(answers[i]) === normalizeText(q.answer || '');
        return { question: q.text || '', given: answers[i] || '', answer: q.answer || '', correct };
      });
      const correctCount = details.filter(d => d.correct).length;
      const score = Math.round((correctCount / Math.max(1, (exam.questions||[]).length)) * 100);
      // حفظ النتيجة
      RESULTS.push({ examId: exam.id || uid(), title: exam.title || '', subject: exam.subject || '', date: dateIso, score, details });
      saveAll();

      // عرض التفصيل داخل المودال
      let html = `<div style="padding:8px;border-radius:8px;background:linear-gradient(90deg,#f3ebe0,#fff)"><strong>النتيجة: ${score} / 100</strong></div><hr>`;
      details.forEach((d, idx) => {
        html += `<div style="margin-top:8px"><strong>س${idx+1}:</strong> ${esc(d.question)}<br><strong>إجابتك:</strong> ${esc(d.given)}<br><strong>الصحيح:</strong> ${esc(d.answer)}<br><strong>الحالة:</strong> ${d.correct ? '✅' : '❌'}</div><hr>`;
      });
      resultArea.innerHTML = html;

      // إعادة تفعيل الزر بعد لحظة قصيرة
      setTimeout(()=> newBtn.disabled = false, 600);

      // تحديث التقارير والإحصاءات والدرجات
      renderReports();
      renderStats();
      renderGrades();
    });
  }
}

// ---- زر إغلاق المودال (موجود في index كـ id="closeExam") ----
function setupCloseExam(){
  const closeBtn = document.getElementById('closeExam');
  const examModal = document.getElementById('examModal');
  const overlay = document.getElementById('overlay');
  if(!closeBtn) return;
  // إخفاء افتراضي
  closeBtn.style.display = 'none';
  closeBtn.addEventListener('click', function(){
    if(examModal) examModal.classList.add('section-hidden');
    if(overlay) overlay.classList.remove('show');
    this.style.display = 'none';
    // تنظيف منطقة الأسئلة والنتائج
    const qArea = document.getElementById('examQuestions'); if(qArea) qArea.innerHTML = '';
    const res = document.getElementById('examResult'); if(res) res.innerHTML = '';
  });
}

// ---- الأرشيف / التقارير / الإحصائيات / الدرجات ----
function renderArchive(){
  const ul = document.getElementById('archiveContent');
  if(!ul) return;
  const arc = safeParse(localStorage.getItem(STORAGE_KEY_ARCHIVE), []);
  ul.innerHTML = '';
  if(!arc || arc.length === 0){ ul.innerHTML = '<div class="card">لا يوجد أرشيف بعد.</div>'; return; }
  arc.slice().reverse().forEach(a => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '8px';
    div.innerHTML = `<strong>${esc(a.subject || a.title || a.text || 'عنصر')}</strong><div style="font-size:13px;color:#555">${esc(a.originDate || '')} • ${esc(a.completedAt ? a.completedAt.split('T')[0] : '')}</div>`;
    ul.appendChild(div);
  });
}

function renderReports(){
  const container = document.getElementById('reportsContent');
  if(!container) return;
  const view = document.getElementById('viewDate') ? (document.getElementById('viewDate').value || todayIsoReal) : todayIsoReal;
  const day = DATA[view] || { tasks: [], exams: [] };
  const planned = (day.tasks || []).reduce((s, t) => s + (t.hours || 0), 0);
  const done = (day.tasks || []).filter(t => t.done).reduce((s, t) => s + (t.hours || 0), 0);

  // أسبوعي و شهري
  let weekPlanned = 0, weekDone = 0;
  for(let i=0;i<7;i++){
    const d = new Date(view + 'T00:00:00'); d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const dd = DATA[iso] || { tasks: [] };
    weekPlanned += (dd.tasks || []).reduce((s,t)=>s + (t.hours || 0), 0);
    weekDone += (dd.tasks || []).filter(t=>t.done).reduce((s,t)=>s + (t.hours || 0), 0);
  }
  let monPlanned = 0, monDone = 0;
  for(let i=0;i<30;i++){
    const d = new Date(view + 'T00:00:00'); d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const dd = DATA[iso] || { tasks: [] };
    monPlanned += (dd.tasks || []).reduce((s,t)=>s + (t.hours || 0), 0);
    monDone += (dd.tasks || []).filter(t=>t.done).reduce((s,t)=>s + (t.hours || 0), 0);
  }

  const dayPct = planned ? Math.round((done / planned) * 100) : 0;
  const weekPct = weekPlanned ? Math.round((weekDone / weekPlanned) * 100) : 0;
  const monPct = monPlanned ? Math.round((monDone / monPlanned) * 100) : 0;
  const ratingWeek = Math.round((weekPct / 100) * 10 * 10) / 10;
  const ratingMonth = Math.round((monPct / 100) * 10 * 10) / 10;

  container.innerHTML = `<div class="card">
    <strong>ملخص الساعات</strong>
    <div style="margin-top:8px">اليومي: ${done} من ${planned} س • نسبة الإنجاز: ${dayPct}%</div>
    <div style="margin-top:6px">الأسبوعي: ${weekDone} من ${weekPlanned} س • ${weekPct}% • تقييم الأسبوع: ${ratingWeek} / 10</div>
    <div style="margin-top:6px">الشهري: ${monDone} من ${monPlanned} س • ${monPct}% • تقييم الشهر: ${ratingMonth} / 10</div>
  </div>`;
}

function renderStats(){
  const node = document.getElementById('statsContent');
  if(!node) return;
  const subjects = {};
  Object.keys(DATA).forEach(date => {
    (DATA[date].tasks || []).forEach(t => {
      const s = t.subject || t.title || 'عام';
      subjects[s] = subjects[s] || { planned: 0, done: 0 };
      subjects[s].planned += (t.hours || 0);
      if(t.done) subjects[s].done += (t.hours || 0);
    });
  });
  if(Object.keys(subjects).length === 0){ node.innerHTML = '<div class="card">لا توجد بيانات إحصائية.</div>'; return; }
  let html = '<div class="stat">';
  Object.keys(subjects).forEach(sub => {
    const s = subjects[sub];
    const pct = s.planned ? Math.round((s.done / s.planned) * 100) : 0;
    html += `<div class="box"><strong>${esc(sub)}</strong><div style="font-size:13px;color:#555;margin-top:6px">${s.done} س من ${s.planned} س</div><div class="progress" style="margin-top:8px"><div style="width:${pct}%"></div></div><div style="margin-top:6px">${pct}% إنجاز</div></div>`;
  });
  html += '</div>';
  node.innerHTML = html;
}

function renderGrades(){
  const c = document.getElementById('gradesContent');
  if(!c) return;
  if(RESULTS.length === 0){ c.innerHTML = '<div class="card">لا توجد درجات بعد.</div>'; return; }
  let html = '<table style="width:100%;border-collapse:collapse"><tr><th style="text-align:right;padding:8px">التاريخ</th><th style="text-align:right;padding:8px">المادة</th><th style="text-align:right;padding:8px">الامتحان</th><th style="text-align:right;padding:8px">الدرجة</th></tr>';
  RESULTS.slice().reverse().forEach(r => {
    html += `<tr><td style="padding:8px">${esc(r.date||r.date)}</td><td style="padding:8px">${esc(r.subject||'')}</td><td style="padding:8px">${esc(r.title||'')}</td><td style="padding:8px">${esc(r.score)}</td></tr>`;
  });
  html += '</table>';
  c.innerHTML = html;
}

// ---- التصدير / إعادة الضبط ----
function setupExportReset(){
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');
  if(exportBtn){
    exportBtn.addEventListener('click', ()=>{
      const dataString = 'window.getInitialData = function(){ return ' + JSON.stringify(DATA, null, 2) + '; };';
      const blob = new Blob([dataString], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'data.js'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(confirm('ستُعاد البيانات للحالة الافتراضية. استمرار؟')){
        localStorage.removeItem(STORAGE_KEY_DATA);
        localStorage.removeItem(STORAGE_KEY_RESULTS);
        localStorage.removeItem(STORAGE_KEY_ARCHIVE);
        localStorage.removeItem(STORAGE_KEY_LASTVIEW);
        location.reload();
      }
    });
  }
}

// ---- شريط جانبي: فتح/إغلاق + ربط الأزرار ----
function setupSidebar(){
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if(!menuBtn || !sidebar) return;
  menuBtn.addEventListener('click', ()=>{
    sidebar.classList.toggle('open');
    if(overlay) overlay.classList.toggle('show');
  });
  if(overlay) overlay.addEventListener('click', ()=>{
    // إغلاق المودال والقائمة إن كانت مفتوحة
    document.querySelectorAll('.modal').forEach(m => m.classList.add('section-hidden'));
    overlay.classList.remove('show');
    sidebar.classList.remove('open');
    const closeExamBtn = document.getElementById('closeExam'); if(closeExamBtn) closeExamBtn.style.display = 'none';
  });
  // ربط أزرار القائمة
  sidebar.querySelectorAll('.navlink').forEach(btn => {
    btn.addEventListener('click', (ev)=>{
      const tab = btn.dataset.tab;
      if(tab) showSection(tab);
      // إغلاق الشريط
      sidebar.classList.remove('open');
      if(overlay) overlay.classList.remove('show');
    });
  });
}

// ---- إضافة واجب من الفورم (saveTask) ----
function setupAddTask(){
  const saveBtn = document.getElementById('saveTask');
  if(!saveBtn) return;
  saveBtn.addEventListener('click', ()=>{
    const subj = document.getElementById('new_subject') ? document.getElementById('new_subject').value.trim() : '';
    const cont = document.getElementById('new_content') ? document.getElementById('new_content').value.trim() : '';
    const hrs = parseInt(document.getElementById('new_hours') ? document.getElementById('new_hours').value : 1, 10) || 1;
    const dt = document.getElementById('new_date') ? document.getElementById('new_date').value : (document.getElementById('viewDate') ? document.getElementById('viewDate').value : todayIsoReal);
    if(!subj || !cont){
      alert('اكمل الحقول (المادة والوصف).');
      return;
    }
    if(!DATA[dt]) DATA[dt] = { tasks: [], exams: [] };
    DATA[dt].tasks.push({ id: uid(), subject: subj, content: cont, hours: hrs, done: false, createdAt: new Date().toISOString() });
    saveAll();
    alert('تمت إضافة الواجب.');
    // إعادة العرض
    document.getElementById('viewDate') && (document.getElementById('viewDate').value = dt);
    showSection('dashboard');
    renderDashboard(dt);
  });
}

// ---- وظائف الـ date/go/today ----
function setupDateControls(){
  const viewDate = document.getElementById('viewDate');
  const goDate = document.getElementById('goDate');
  const todayBtn = document.getElementById('todayBtn');

  // افتراضياً نضع التاريخ الابتدائي
  const initial = pickInitialDate();
  if(viewDate) viewDate.value = localStorage.getItem(STORAGE_KEY_LASTVIEW) || initial;

  if(goDate && viewDate){
    goDate.addEventListener('click', ()=> {
      renderDashboard(viewDate.value || todayIsoReal);
      showSection('dashboard');
      renderReports(); renderStats(); renderArchive(); renderGrades();
    });
  }
  if(todayBtn && viewDate){
    todayBtn.addEventListener('click', ()=> {
      viewDate.value = todayIsoReal;
      renderDashboard(todayIsoReal);
      showSection('dashboard');
      renderReports(); renderStats(); renderArchive(); renderGrades();
    });
  }
}

// ---- التهيئة عند DOMContentLoaded ----
document.addEventListener('DOMContentLoaded', ()=>{
  setupSidebar();
  setupCloseExam();
  setupExportReset();
  setupAddTask();
  setupDateControls();

  // عرض مبدئي
  const initial = pickInitialDate();
  // ضع قيمة viewDate إن وُجدت
  const viewDateEl = document.getElementById('viewDate');
  if(viewDateEl && !viewDateEl.value) viewDateEl.value = initial;

  renderDashboard(initial);
  renderReports();
  renderStats();
  renderArchive();
  renderGrades();
  showSection('dashboard');

  console.log('Dashboard initialized. Initial date:', initial);
});
