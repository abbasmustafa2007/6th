// data.js - ملف بيانات تجريبي (10 أيام) - بداية 2025-09-13
window.getInitialData = function(){
  const pad = n => n.toString().padStart(2,'0');
  // base date 2025-09-13 for testing
  const base = new Date(2025,8,13); // months 0-indexed => 8 = Sep
  function iso(offset){
    const d = new Date(base.getTime());
    d.setDate(base.getDate() + offset);
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  const DATA = {};
  for(let i=0;i<10;i++){
    const date = iso(i);
    DATA[date] = { tasks: [], exams: [] };
    // default tasks (3 tasks, sometimes 4)
    DATA[date].tasks.push({ id: 't-'+date+'-1', subject: 'كيمياء', content: 'قراءة ومراجعة الفصل ' + ((i%3)+1), hours: 2, done: false });
    DATA[date].tasks.push({ id: 't-'+date+'-2', subject: 'فيزياء', content: 'حل مسائل الوحدة ' + ((i%4)+1), hours: 2, done: false });
    DATA[date].tasks.push({ id: 't-'+date+'-3', subject: 'رياضيات', content: 'مراجعة مسائل التكامل', hours: 1, done: false });
    if(i%4===0) DATA[date].tasks.push({ id: 't-'+date+'-4', subject: 'تاريخ', content: 'قراءة سريعة', hours: 1, done: false });

    // exams (text-only)
    DATA[date].exams.push({
      id: 'e-'+date+'-1',
      subject: (i%2===0 ? 'اللغة العربية' : 'العلوم'),
      title: (i%2===0 ? 'أسلوب النفي' : 'مراجعة عامة'),
      questions: (i%2===0) ? [
        { text: 'اكتب جملة منفية صحيحة', answer: 'لم أدرس' },
        { text: 'ضع مثالاً آخر على أسلوب النفي', answer: 'لم يذهب' },
        { text: 'حول الجملة التالية إلى نفي: ذهبت إلى المدرسة', answer: 'لم أذهب إلى المدرسة' }
      ] : [
        { text: 'ما هو العنصر الذي رمزه H؟', answer: 'الهيدروجين' },
        { text: 'اذكر وحدة قياس الكتلة', answer: 'الجرام' }
      ]
    });
  }
  return DATA;
};
