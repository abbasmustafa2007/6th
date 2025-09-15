window.getInitialData = function() {
  return {
    "2025-09-15": {
      tasks: [
        { id: "t1", subject: "أحياء", content: "قراءة محاضرة 3-4-5", hours: 2, done: false, createdAt: "2025-09-15T08:00:00" }
      ],
      exams: [
        {
          id: "e1",
          subject: "أحياء",
          title: "امتحان محاضرة 1-2",
          questions: [
            { text: "سؤال تجريبي؟", answer: "إجابة" }
          ]
        }
      ]
    }
  };
};
