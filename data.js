window.getInitialData = function(){
  return {
    "2025-09-13": {
      tasks: [
        {subject:"كيمياء", desc:"قراءة 20 صفحة", hours:2, done:false},
        {subject:"فيزياء", desc:"حل مسائل الدرس 3", hours:2, done:false},
        {subject:"أحياء", desc:"تحضير الفصل 2", hours:1, done:false}
      ],
      exams: [
        {subject:"لغة عربية", questions:[
          {q:"عرف أسلوب النفي", a:"أسلوب يفيد النفي"},
          {q:"أداة نفي واحدة", a:"لن"}
        ]}
      ]
    }
  };
};
