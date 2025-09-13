// بيانات تجريبية لعشرة أيام + يوم 13-9
window.getInitialData = function(){
  return {
    "2025-09-01": {
      tasks: [
        {subject:"رياضيات", desc:"حل مسائل ص1-10", hours:2, done:false},
        {subject:"كيمياء", desc:"مراجعة الفصل 1", hours:1, done:false}
      ],
      exams: [
        {subject:"عربي", questions:[
          {q:"عرف أسلوب النفي", a:"هو أسلوب يفيد النفي"},
          {q:"أداة نفي واحدة", a:"لا"}
        ]}
      ]
    },
    "2025-09-13": {
      tasks: [
        {subject:"كيمياء", desc:"قراءة 20 صفحة", hours:2, done:false},
        {subject:"فيزياء", desc:"حل مسائل الدرس 3", hours:2, done:false},
        {subject:"أحياء", desc:"تحضير الفصل 2", hours:1, done:false}
      ],
      exams: [
        {subject:"لغة عربية", questions:[
          {q:"اكتب بيت شعر عن النفي", a:"ما كل ما يتمنى المرء يدركه"},
          {q:"اذكر أداة نفي", a:"لن"}
        ]}
      ]
    }
  };
};
