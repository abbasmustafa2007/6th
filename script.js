// script.js

// تحميل الواجبات حسب اليوم
function loadTasks() {
  const today = new Date().toISOString().split("T")[0]; // التاريخ الحالي
  const tasksContainer = document.getElementById("tasks-container");
  tasksContainer.innerHTML = "";

  if (tasksData[today]) {
    tasksData[today].forEach((task, index) => {
      const item = document.createElement("div");
      item.classList.add("task-item");

      if (task.type === "task") {
        item.innerHTML = `
          <span>${task.title} (${task.hours} ساعات)</span>
          <button onclick="completeTask('${today}', ${index})">✅ إكمال</button>
        `;
      } else if (task.type === "exam") {
        item.innerHTML = `
          <span>${task.title}</span>
          <button onclick="startExam('${today}', ${index})">📝 ابدأ الامتحان</button>
        `;
      }

      tasksContainer.appendChild(item);
    });
  } else {
    tasksContainer.innerHTML = "<p>لا توجد واجبات أو امتحانات لهذا اليوم.</p>";
  }
}

// إكمال الواجب
function completeTask(date, index) {
  const task = tasksData[date][index];
  if (!task) return;

  if (!localStorage.archive) localStorage.archive = JSON.stringify([]);
  const archive = JSON.parse(localStorage.archive);
  archive.push({ ...task, date });
  localStorage.archive = JSON.stringify(archive);

  tasksData[date].splice(index, 1);
  loadTasks();
}

// بدء الامتحان
function startExam(date, index) {
  const exam = tasksData[date][index];
  if (!exam) return;

  const modal = document.getElementById("examModal");
  const modalContent = document.getElementById("exam-content");
  modal.style.display = "block";
  modalContent.innerHTML = `<h2>${exam.title}</h2>`;

  exam.questions.forEach((q, i) => {
    modalContent.innerHTML += `
      <div>
        <p>${q.q}</p>
        <input type="text" id="answer-${i}" placeholder="أدخل إجابتك هنا">
      </div>
    `;
  });

  // زر تسليم
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "تسليم الامتحان";
  submitBtn.onclick = () => submitExam(exam);
  modalContent.appendChild(submitBtn);

  // زر إغلاق الامتحان
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "إغلاق الامتحان";
  closeBtn.style.marginTop = "15px";
  closeBtn.style.background = "#6c757d";
  closeBtn.style.color = "white";
  closeBtn.style.padding = "8px 16px";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "5px";
  closeBtn.style.cursor = "pointer";

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none"; // يغلق النافذة
  });

  modalContent.appendChild(closeBtn);
}

// تصحيح الامتحان
function submitExam(exam) {
  let score = 0;

  exam.questions.forEach((q, i) => {
    const userAnswer = document.getElementById(`answer-${i}`).value.trim();
    if (userAnswer === q.a) score += Math.floor(100 / exam.questions.length);
  });

  const resultDiv = document.createElement("div");
  resultDiv.innerHTML = `<h3>درجتك: ${score}/100</h3>`;
  document.getElementById("exam-content").appendChild(resultDiv);

  // حفظ الدرجة في سجل الدرجات
  if (!localStorage.grades) localStorage.grades = JSON.stringify([]);
  const grades = JSON.parse(localStorage.grades);
  grades.push({ title: exam.title, score, date: new Date().toISOString().split("T")[0] });
  localStorage.grades = JSON.stringify(grades);
}

// تحميل التقارير
function loadReports() {
  const container = document.getElementById("reports-container");
  container.innerHTML = "<h2>📊 تقارير أسبوعية / شهرية (تجريبية)</h2>";
}

// تحميل الدرجات
function loadGrades() {
  const container = document.getElementById("grades-container");
  container.innerHTML = "<h2>📚 جدول الدرجات</h2>";

  const grades = JSON.parse(localStorage.grades || "[]");
  if (grades.length === 0) {
    container.innerHTML += "<p>لا توجد درجات مسجلة.</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <tr>
      <th>التاريخ</th>
      <th>المادة</th>
      <th>الدرجة</th>
    </tr>
  `;

  grades.forEach(g => {
    table.innerHTML += `
      <tr>
        <td>${g.date}</td>
        <td>${g.title}</td>
        <td>${g.score}</td>
      </tr>
    `;
  });

  container.appendChild(table);
}

// تحميل الإحصائيات
function loadStats() {
  const container = document.getElementById("stats-container");
  container.innerHTML = "<h2>📈 إحصائيات دراستك</h2>";
}

// تحميل الأرشيف
function loadArchive() {
  const container = document.getElementById("archive-container");
  container.innerHTML = "<h2>📂 الأرشيف</h2>";

  const archive = JSON.parse(localStorage.archive || "[]");
  if (archive.length === 0) {
    container.innerHTML += "<p>لا توجد مهام منجزة بعد.</p>";
    return;
  }

  archive.forEach(a => {
    container.innerHTML += `<p>${a.date}: ${a.title}</p>`;
  });
}

// إضافة واجب
function addTask() {
  const title = document.getElementById("new-task-title").value;
  const date = document.getElementById("new-task-date").value;
  if (!title || !date) return alert("الرجاء إدخال العنوان والتاريخ.");

  if (!tasksData[date]) tasksData[date] = [];
  tasksData[date].push({ type: "task", title, hours: 1 });

  alert("تمت إضافة الواجب بنجاح!");
  document.getElementById("new-task-title").value = "";
  document.getElementById("new-task-date").value = "";
  loadTasks();
}

// تشغيل عند تحميل الصفحة
window.onload = () => {
  loadTasks();
};
