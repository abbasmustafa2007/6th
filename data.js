// data.js - ملف البيانات التجريبي
// لا تغير اسم الدالة; index.html يستدعي window.getInitialData()
window.getInitialData = function(){
  const pad = n => n.toString().padStart(2,'0');
  const today = new Date();
  function iso(offset){
    const d = new Date();
    d.setDate(today.getDate() + offset);
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  const DATA = {};
  for(let i=0;i<10;i++){
    const date = iso(i); // اليوم + i
    DATA[date] = { tasks: [], exams: [] };
    // sample tasks (3 each day, sometimes 4)
    DATA[date].tasks.push({ id: 't-'+date+'-1', subject: 'كيمياء', content: 'قراءة ومراجعة الفصل ' + ((i%3)+1), hours: 2, done: false });
    DATA[date].tasks.push({ id: 't-'+date+'-2', subject: 'فيزياء', content: 'حل مسائل الوحدة ' + ((i%4)+1), hours: 2, done: false });
    DATA[date].tasks.push({ id: 't-'+date+'-3', subject: 'رياضيات', content: 'مراجعة مسائل التكامل', hours: 1, done: false });
    if(i % 3 === 0) DATA[date].tasks.push({ id: 't-'+date+'-4', subject: 'تاريخ', content: 'قراءة سريعة', hours: 1, done: false });

    // sample exam (text-only questions) — one per day
    DATA[date].exams.push({
      id: 'e-'+date+'-1',
      subject: (i%2===0 ? 'اللغة العربية' : 'العلوم'),
      title: (i%2===0 ? 'أسلوب النفي' : 'مراجعة عامة'),
      questions: (i%2===0) ? [
        { text: 'اكتب جملة منفية صحيحة', answer: 'لم أدرس' },
        { text: 'ضع مثالاً آخر على أسلوب النفي', answer: 'لم يذهب' }
      ] : [
        { text: 'ما هو العنصر الذي رمزه H؟', answer: 'الهيدروجين' },
        { text: 'اذكر وحدة قياس الكتلة', answer: 'الجرام' }
      ]
    });
  }
  return DATA;
};
