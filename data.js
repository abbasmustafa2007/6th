// data.js - بيانات تجريبية (تشمل 2025-09-10..2025-09-20) + امتحان عربي 13-09
window.getInitialData = function(){
  const pad = n => n.toString().padStart(2,'0');
  function iso(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
  const DATA = {};
  for(let d=10; d<=20; d++){
    const date = iso(2025,9,d);
    DATA[date] = { tasks: [], exams: [] };
    DATA[date].tasks.push({ id:`t-${date}-1`, subject:'كيمياء', content:`قراءة ومراجعة الفصل ${d%3+1}`, hours:2, done:false, createdAt:date });
    DATA[date].tasks.push({ id:`t-${date}-2`, subject:'فيزياء', content:`حل مسائل الوحدة ${d%4+1}`, hours:2, done:false, createdAt:date });
    DATA[date].tasks.push({ id:`t-${date}-3`, subject:'رياضيات', content:'مراجعة مسائل', hours:1, done:false, createdAt:date });
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
      DATA[date].exams.push({
        id:`e-${date}-1`,
        subject:(d%2===0 ? 'اللغة العربية' : 'العلوم'),
        title:(d%2===0 ? 'مراجعة عربي' : 'مراجعة علوم'),
        questions: [
          { text:(d%2===0 ? 'ضع مثالا على أسلوب النفي' : 'ما هو العنصر H؟'), answer:(d%2===0 ? 'لم يذهب' : 'الهيدروجين') }
        ]
      });
    }
  }
  return DATA;
};
