// data.js - بيانات تجريبية من 2025-09-01 حتى 2025-09-13
window.getInitialData = function(){
  const pad = n => n.toString().padStart(2,'0');
  function iso(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
  const DATA = {};
  const subjects = ['كيمياء','فيزياء','رياضيات','اللغة العربية','أحياء','انكليزي'];
  for(let d=1; d<=13; d++){
    const date = iso(2025,9,d);
    DATA[date] = { tasks: [], exams: [] };
    // add 3 tasks per day with varying subjects
    DATA[date].tasks.push({ id:`t-${date}-1`, subject: subjects[d%subjects.length], content:`قراءة ومراجعة الفصل ${d%4+1}`, hours:2, done:false, createdAt:date });
    DATA[date].tasks.push({ id:`t-${date}-2`, subject: subjects[(d+1)%subjects.length], content:`حل مسائل الوحدة ${d%5+1}`, hours:2, done:false, createdAt:date });
    DATA[date].tasks.push({ id:`t-${date}-3`, subject: subjects[(d+2)%subjects.length], content:`مراجعة سريعة`, hours:1, done:false, createdAt:date });
    // exams: put Arabic exam on 13-9, others small exams randomly
    if(d===13){
      DATA[date].exams.push({
        id:`e-${date}-arabic-1`,
        subject:'اللغة العربية',
        title:'امتحان قصير: أسلوب ونحو',
        questions: [
          { text:'ما هو أسلوب النفي؟', answer:'أسلوب يفيد النفي' },
          { text:'عرّف الجملة الاسمية مع مثال.', answer:'جملة تبدأ باسم مثل: الطالب مجتهد' },
          { text:'ما الفرق بين الفعل الماضي والفعل المضارع؟', answer:'الماضي يدل على حدث وقع والمضارع يدل على حدث يقع أو سيقع' }
        ]
      });
    } else {
      // add a small 1-question exam
      DATA[date].exams.push({
        id:`e-${date}-1`,
        subject: subjects[d%subjects.length],
        title:'امتحان مراجعة قصيرة',
        questions:[ { text:'سؤال مراجعة قصير', answer:'إجابة نموذجية' } ]
      });
    }
  }
  return DATA;
};
