// ================== إعداد البيانات ==================
const STORAGE_KEY_DATA = 'STUDY_DATA_FINAL_V1';
const STORAGE_KEY_RESULTS = 'STUDY_RESULTS_FINAL_V1';
const todayIsoReal = new Date().toISOString().slice(0,10);

// أداة parsing آمنة
function safeJSONParse(s, fallback){
  try{
    return JSON.parse(s);
  }catch(e){
    return fallback;
  }
}

// تحميل البيانات
let DATA = safeJSONParse(localStorage.getItem(STORAGE_KEY_DATA), null);
if(!DATA){
  if(typeof window.getInitialData === 'function') DATA = window.getInitialData();
  else DATA = {};
}
let RESULTS = safeJSONParse(localStorage.getItem(STORAGE_KEY_RESULTS), []);

// ================== أدوات مساعدة ==================
function uid(){ return '_' + Math.random().toString(36).substr(2,9); }
function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function normalizeText(s){ return (s||'').toLowerCase().trim(); }

// ================== حفظ البيانات (debounce) ==================
let _saveTimeout = null;
function saveAllImmediate(){
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DATA));
  localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(RESULTS));
}
function saveAll(){
  if(_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(()=>{ saveAllImmediate(); _saveTimeout = null; }, 250);
}

// ================== المهام ==================
function markTaskDoneById(dateIso, id){
  const arr = (DATA[dateIso] && DATA[dateIso].tasks) || [];
  const idx = arr.findIndex(x => x.id === id);
  if(idx === -1) return false;
  const item = arr[idx];
  item.done = true;
  const archive = safeJSONParse(localStorage.getItem('STUDY_ARCHIVE_FINAL_V1'), []);
  archive.push(Object.assign({}, item, { completedAt: new Date().toISOString(), originDate: dateIso }));
  localStorage.setItem('STUDY_ARCHIVE_FINAL_V1', JSON.stringify(archive));
  saveAll();
  return true;
}

// ================== عرض الواجهة ==================
const overlay = document.getElementById('overlay');
const viewDateInput = document.getElementById('viewDate');
viewDateInput.value = todayIsoReal;

function renderDashboard(dateIso){
  const day = DATA[dateIso] || { tasks:[], exams:[] };
  const tasksUl = document.getElementById('tasksList');
  tasksUl.innerHTML='';
  (day.tasks||[]).forEach(t=>{
    const li=document.createElement('li');
    li.innerHTML=`${escapeHtml(t.text)} ${t.done? '✅':''} <button class="mark-done" data-id="${t.id}">تم</button>`;
    tasksUl.appendChild(li);
  });
  tasksUl.querySelectorAll('.mark-done').forEach(b=>b.addEventListener('click', ()=>{
    const id = b.dataset.id;
    if(markTaskDoneById(dateIso, id)){
      renderDashboard(dateIso); renderArchive(); renderReports(); renderStats();
    }
  }));

  const examsUl = document.getElementById('examsList');
  examsUl.innerHTML='';
  (day.exams||[]).forEach((ex,idx)=>{
    const li=document.createElement('li');
    li.innerHTML=`${escapeHtml(ex.title)} <button class="start-exam" data-idx="${idx}">ابدأ</button>`;
    examsUl.appendChild(li);
  });
  examsUl.querySelectorAll('.start-exam').forEach(b=>b.addEventListener('click', ()=>{
    startExam(dateIso, parseInt(b.dataset.idx));
  }));
}

// ================== إضافة مهمة ==================
document.getElementById('addTaskBtn').addEventListener('click', ()=>{
  const txt = prompt('أدخل المهمة:'); if(!txt) return;
  const dateIso = viewDateInput.value || todayIsoReal;
  if(!DATA[dateIso]) DATA[dateIso]={tasks:[],exams:[]};
  DATA[dateIso].tasks.push({id:uid(), text:txt, done:false});
  saveAll(); renderDashboard(dateIso);
});

// ================== الامتحانات ==================
function startExam(dateIso, examIndex){
  const day = DATA[dateIso]; if(!day) return alert('لا يوجد هذا الامتحان');
  const exam = day.exams[examIndex]; if(!exam) return alert('الامتحان غير موجود');

  document.getElementById('examTitleShow').innerText = `${exam.title} • ${exam.subject}`;
  const qArea = document.getElementById('examQuestions'); qArea.innerHTML='';
  exam.questions.forEach((q,i)=>{
    const div=document.createElement('div'); div.className='exam-question';
    div.innerHTML=`<div><strong>س${i+1}:</strong> ${escapeHtml(q.text)}</div><div><textarea name="q${i}" style="width:100%;height:90px;padding:8px;margin-top:8px"></textarea></div>`;
    qArea.appendChild(div);
  });
  document.getElementById('examResult').innerHTML='';
  document.getElementById('examModal').classList.remove('section-hidden');
  overlay.classList.add('show');
  document.getElementById("closeExamBtn").style.display = "block"; // إظهار زر الإغلاق

  const submitBtn=document.getElementById('submitExamBtn');
  const newBtn=submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newBtn, submitBtn);

  newBtn.addEventListener('click', ()=>{
    newBtn.disabled=true;
    const answers=exam.questions.map((_,i)=> (document.querySelector(`textarea[name="q${i}"]`).value||'').trim());
    const details=exam.questions.map((q,i)=>{const ok=normalizeText(answers[i])===normalizeText(q.answer||'');return {question:q.text,given:answers[i]||'',answer:q.answer||'',correct:ok};});
    const correctCount=details.filter(d=>d.correct).length;
    const score=Math.round((correctCount/exam.questions.length)*100);
    const resultEntry={examId:exam.id||uid(),title:exam.title,subject:exam.subject,date:new Date().toISOString().slice(0,10),score:score,details:details};
    RESULTS.push(resultEntry); saveAll();
    let html=`<h4>النتيجة: ${score}%</h4>`;
    details.forEach((d,idx)=>{html+=`<div>س${idx+1}: <span style="color:${d.correct?'green':'red'}">${d.correct?'✔ صحيح':'✖ خطأ'}</span><br>إجابتك: ${escapeHtml(d.given)}<br>الصحيح: ${escapeHtml(d.answer)}</div><hr>`;});
    document.getElementById('examResult').innerHTML=html;
  });
}

// زر إغلاق الامتحان
document.getElementById("closeExamBtn").addEventListener("click", function() {
  document.getElementById("examModal").classList.add("section-hidden");
  overlay.classList.remove("show");
  this.style.display = "none";
  alert("تم إغلاق الامتحان ✅");
});

// ================== الأرشيف ==================
function renderArchive(){
  const arch=safeJSONParse(localStorage.getItem('STUDY_ARCHIVE_FINAL_V1'),[]);
  const ul=document.getElementById('archiveList'); ul.innerHTML='';
  arch.forEach(a=>{
    const li=document.createElement('li');
    li.textContent=`${a.text} (${a.originDate}) ✔`;
    ul.appendChild(li);
  });
}

// ================== التقارير والإحصائيات ==================
function renderReports(){
  const ul=document.getElementById('reportsList'); ul.innerHTML='';
  RESULTS.forEach(r=>{
    const li=document.createElement('li');
    li.textContent=`${r.date} • ${r.title} (${r.subject}) : ${r.score}%`;
    ul.appendChild(li);
  });
}
function renderStats(){
  const div=document.getElementById('statsArea');
  const total=RESULTS.length; if(total===0){div.innerHTML='<p>لا يوجد بيانات.</p>'; return;}
  const avg=(RESULTS.reduce((a,b)=>a+b.score,0)/total).toFixed(1);
  div.innerHTML=`<p>عدد الامتحانات: ${total} • المعدل: ${avg}%</p>`;
}

// ================== أحداث عامة ==================
viewDateInput.addEventListener('change',()=>{renderDashboard(viewDateInput.value);});
overlay.addEventListener('click',()=>{document.querySelectorAll('.modal').forEach(m=>m.classList.add('section-hidden')); overlay.classList.remove('show');});

// عند بدء الصفحة
renderDashboard(todayIsoReal);
renderArchive();
renderReports();
renderStats();
