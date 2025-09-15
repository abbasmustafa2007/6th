window.getInitialData = function() {
  return {
    "2025-09-15": {
      tasks: [
        { id: "t1", subject: "أحياء", content: "قراءة محاضرة 3-4-5", hours: 2, done: false, createdAt: "2025-09-15T08:00:00" },
        { id: "t2", subject: "كيمياء", content: "قراءة محاضرة 2-3", hours: 2, done: false, createdAt: "2025-09-15T08:30:00" }
      ],
      exams: [
        {
          id: "e1",
          subject: "أحياء",
          title: "امتحان محاضرة 1-2",
          questions: [
            { text: "ماهي الشروط الأساسية التي تحقق التكاثر الجنسي؟", answer: "1- الانقسام الاختزالي\n2- اتحاد نواة البيضة مع نواة النطفة" },
            { text: "من الشروط الأساسية التي تحقق التكاثر الجنسي …… و……. ؟", answer: "الانقسام الاختزالي - اتحاد نواة النطفة مع نواة البيضة" }
          ]
        }
      ]
    },
    "2025-09-16": {
      tasks: [
        { id: "t3", subject: "رياضيات", content: "حل مسائل التفاضل", hours: 1, done: false, createdAt: "2025-09-16T09:00:00" },
        { id: "t4", subject: "فيزياء", content: "مراجعة قوانين الحركة", hours: 1, done: false, createdAt: "2025-09-16T09:30:00" }
      ],
      exams: []
    },
    "2025-09-17": {
      tasks: [
        { id: "t5", subject: "كيمياء", content: "مراجعة الجدول الدوري", hours: 2, done: false, createdAt: "2025-09-17T08:00:00" },
        { id: "t6", subject: "أحياء", content: "مراجعة الجهاز العصبي", hours: 1, done: false, createdAt: "2025-09-17T08:30:00" }
      ],
      exams: [
        {
          id: "e2",
          subject: "رياضيات",
          title: "امتحان التفاضل",
          questions: [
            { text: "حل المعادلة التالية: x^2 - 4x + 3 = 0", answer: "x=1 أو x=3" }
          ]
        }
      ]
    }
  };
};
