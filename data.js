// data.js - بيانات شهر 9 كاملة (1 → 30)
window.getInitialData = function () {
  const pad = n => n.toString().padStart(2, "0");
  function iso(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  const DATA = {};
  const subjects = ["كيمياء", "فيزياء", "رياضيات", "اللغة العربية", "أحياء", "انكليزي"];

  // دوال مساعدة
  function makeTask(id, subject, content, hours, date) {
    return { id, subject, content, hours, done: false, createdAt: date };
  }
  function makeExam(id, subject, title, questions) {
    return { id, subject, title, questions };
  }

  // إنشاء الشهر كامل
  for (let d = 1; d <= 30; d++) {
    const date = iso(2025, 9, d);
    DATA[date] = { tasks: [], exams: [] };

    // إضافة 3 واجبات يومية مختلفة
    DATA[date].tasks.push(
      makeTask(`t-${date}-1`, subjects[(d + 0) % subjects.length], `حل مسائل في الفصل ${d % 5 + 1}`, 2, date)
    );
    DATA[date].tasks.push(
      makeTask(`t-${date}-2`, subjects[(d + 1) % subjects.length], `مراجعة الدرس رقم ${d % 7 + 1}`, 1, date)
    );
    DATA[date].tasks.push(
      makeTask(`t-${date}-3`, subjects[(d + 2) % subjects.length], `كتابة ملخص حول موضوع ${d}`, 2, date)
    );

    // تحديد إذا اليوم جمعة (5, 12, 19, 26) → امتحان متوسط
    const fridayExams = [5, 12, 19, 26];
    if (fridayExams.includes(d)) {
      DATA[date].exams.push(
        makeExam(
          `e-${date}-mid`,
          subjects[d % subjects.length],
          "امتحان متوسط",
          [
            { text: "س1: اشرح الفكرة الرئيسية للدرس.", answer: "إجابة نموذجية" },
            { text: "س2: أعط مثال عملي.", answer: "مثال صحيح" },
            { text: "س3: حل مسألة متعلقة بالموضوع.", answer: "الحل الكامل" },
            { text: "س4: قارن بين مفهوميْن.", answer: "إجابة مقارنة" },
            { text: "س5: استنتج قاعدة عامة.", answer: "القاعدة هي ..." },
          ]
        )
      );
    } else if (d === 30) {
      // امتحان نهائي يوم 30-9
      DATA[date].exams.push(
        makeExam(
          `e-${date}-final`,
          "شامل",
          "الامتحان النهائي لشهر 9",
          Array.from({ length: 10 }, (_, i) => ({
            text: `س${i + 1}: سؤال شامل ${i + 1}`,
            answer: "إجابة نموذجية",
          }))
        )
      );
    } else {
      // امتحان يومي قصير (3 أسئلة)
      DATA[date].exams.push(
        makeExam(
          `e-${date}-daily`,
          subjects[d % subjects.length],
          "امتحان يومي قصير",
          [
            { text: "س1: سؤال قصير", answer: "إجابة مختصرة" },
            { text: "س2: سؤال آخر", answer: "إجابة مناسبة" },
            { text: "س3: تمرين بسيط", answer: "الحل هنا" },
          ]
        )
      );
    }
  }

  return DATA;
};
