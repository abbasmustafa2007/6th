const STORAGE_KEY_DATA = 'STUDY_DATA_V2';
let DATA = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || 'null');
if(!DATA){
  if(window.getInitialData) DATA = window.getInitialData();
  else DATA = {};
}

// عناصر
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const viewDateInput = document.getElementById('view-date');
const tasksList = document.getElementById('tasks-list');
const examsList = document.getElementById('exams-list');

// فتح/غلق القائمة
menuBtn.addEventListener('click', ()=>{
  const opened = sidebar.classList.contains('open');
  if(opened){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    sidebar.setAttribute('aria-hidden','true');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('show');
    sidebar.setAttribute('aria-hidden','false');
  }
});
overlay.addEventListener('click', ()=>{
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  sidebar.setAttribute('aria-hidden','true');
});

// تحديد تاريخ اليوم
const todayIso = new Date().toISOString().split('T')[0];
const LAST_VIEW = localStorage.getItem('STUDY_LAST_VIEW_V2');
const defaultView = LAST_VIEW || todayIso;
viewDateInput.value = defaultView;

// عرض التبويبات
function showTab(tabId){
  document.querySelectorAll('.tab').forEach(sec=>sec.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

// رسم الواجبات/الامتحانات
function renderDashboard(date){
  tasksList.innerHTML = '';
  examsList.innerHTML = '';
  const day = DATA[date];
  if(!day){ tasksList.innerHTML = '<p>لا توجد بيانات لهذا اليوم</p>'; return; }

  day.tasks.forEach((t,i)=>{
    const div = document.createElement('div');
    div.className = 'task';
    div.innerHTML = `<label><input type="checkbox" ${t.done?'checked':''} onchange="toggleTask('${date}',${i})"> ${t.subject} - ${t.desc} (${t.hours}س)</label>`;
    tasksList.appendChild(div);
  });

  day.exams.forEach((e,i)=>{
    const div = document.createElement('div');
    div.className = 'exam';
    div.innerHTML = `<strong>امتحان ${e.subject}</strong><button onclick="startExam('${date}',${i})">بدء الامتحان</button>`;
    examsList.appendChild(div);
  });
}

// تبديل حالة الواجب
function toggleTask(date, i){
  DATA[date].tasks[i].done = !DATA[date].tasks[i].done;
  saveData();
  renderDashboard(date);
}

// بدء الامتحان
function startExam(date, i){
  const exam = DATA[date].exams[i];
  let html = `<h3>امتحان ${exam.subject}</h3><form id="exam-form">`;
  exam.questions.forEach((q,qi)=>{
    html += `<label>${q.q}<br><input type="text" name="q${qi}"></label><br>`;
  });
  html += `<button type="submit">إرسال</button></form>`;
  examsList.innerHTML = html;

  document.getElementById('exam-form').addEventListener('submit', ev=>{
    ev.preventDefault();
    let score=0;
    exam.questions.forEach((q,qi)=>{
      const ans = ev.target[`q${qi}`].value.trim();
      if(ans === q.a) score++;
    });
    const result = Math.round((score/exam.questions.length)*100);
    examsList.innerHTML += `<p>نتيجتك: ${result}/100</p>`;
    examsList.innerHTML += `<h4>الإجابات الصحيحة:</h4><ul>` + exam.questions.map(q=>`<li>${q.q}: ${q.a}</li>`).join('') + `</ul>`;
  });
}

// حفظ
function saveData(){
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA));
}

// عرض مبدئي
renderDashboard(viewDateInput.value);
showTab('dashboard');
