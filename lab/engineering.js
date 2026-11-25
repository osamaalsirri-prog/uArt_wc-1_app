
(function(){
'use strict';
const faults=[
['No reported fault','لا يوجد عطل مُبلّغ'],
['HOME search exceeded','تجاوز مسافة البحث عن HOME'],
['HOME unstable','إشارة HOME غير مستقرة'],
['HOME during cycle','HOME نشط أثناء دورة اللحام'],
['Soft travel limit','تجاوز حد الحركة البرمجي'],
['HOME missed on return','لم يُكتشف HOME أثناء الرجوع'],
['HOME stuck away','HOME ظل نشطاً بعيداً عن نقطة الصفر'],
['STEP timer failure','عطل مؤقت نبضات STEP'],
['END limit or open wire','نهاية المشوار أو قطع سلك END'],
['Emergency fault','عطل طوارئ']
];
const num=v=>typeof v==='number'&&Number.isFinite(v);
function calculate(d,s,l,p,m,h){
 if(![d,s,l,p,m,h].every(num)||d<0||s<=0||l<=0||p<=0||m<=0||h<0)return null;
 return {seconds:60*d/s,rpm:s/l,stepsPerMm:p*m/l,stepHz:s*p*m/(60*l),pitch:h>0?s/(60*h):null,pulses:h*60*d/s};
}
globalThis.WC01EngineeringMath={calculate};
if(typeof document==='undefined')return;
const $e=id=>document.getElementById(id);
const tr=(en,ar)=>typeof msg==='function'?msg(en,ar):en;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=(v,unit='')=>num(v)?v.toFixed(2)+' '+unit:'—';
const bool=v=>v===true?tr('ACTIVE','نشط'):v===false?tr('CLEAR','غير نشط'):'—';
const read=()=>{try{return online()&&liveStatus&&liveStatus.ok===true?liveStatus:null}catch(e){return null}};
const label=(en,ar)=>esc(tr(en,ar));
let tab='overview',lastEvent='',lastSerial='',points=[],log=[];
try{const stored=JSON.parse(localStorage.getItem('wc01.eng.events.v2')||'[]');if(Array.isArray(stored))log=stored.filter(x=>x&&typeof x.text==='string'&&typeof x.at==='string').slice(-100)}catch(e){}
function event(text){log.push({at:new Date().toLocaleString(),text:String(text)});log=log.slice(-100);try{localStorage.setItem('wc01.eng.events.v2',JSON.stringify(log))}catch(e){}}
function mount(){
 if($e('wcEngRoot'))return;
 const root=document.createElement('section');root.id='wcEngRoot';root.setAttribute('role','dialog');root.setAttribute('aria-label','Engineering workspace');
 root.innerHTML='<header class="we-head"><div><small>uArt / INDUSTRIAL SYSTEMS</small><h1>WC-01<span>+</span></h1><p>ENGINEERING WORKSPACE · V1.1.5</p></div><button id="weClose" type="button">OPERATE<br>تشغيل</button></header><div class="we-status" id="weStatus"></div><nav class="we-tabs" aria-label="Engineering sections"><button data-we="overview">Overview<br>نظرة عامة</button><button data-we="io">I/O<br>الإشارات</button><button data-we="calc">Tools<br>حسابات</button><button data-we="log">Events<br>الأحداث</button></nav><main id="weContent"></main><footer>DIAGNOSTICS · مراقبة وتشخيص</footer>';
 root.hidden=true;document.body.append(root);
 const launcher=document.createElement('button');launcher.id='wcEngLauncher';launcher.type='button';launcher.className='factory-nav';launcher.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l6 3V6l6 4V3h5v18zM7 17h2m3 0h2m3 0h1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Factory</span>';const nav=document.querySelector('.bottom-nav');if(!nav)throw Error('Navigation missing');nav.classList.add('with-factory');nav.append(launcher);
 function openDiagnostics(){stopJog();toggleFloatingPanel(false);root.hidden=false;render(true)}
 window.WC01OpenDiagnostics=openDiagnostics;
 launcher.onclick=()=>{if(typeof window.WC01OpenFactory==='function')window.WC01OpenFactory();else openDiagnostics()};
 $e('weClose').onclick=()=>{root.hidden=true;launcher.hidden=false};
 root.querySelectorAll('[data-we]').forEach(b=>b.onclick=()=>{tab=b.dataset.we;render(true)});
 const back=window.__wc01Back;window.__wc01Back=function(){if(!root.hidden){root.hidden=true;launcher.hidden=false;return}if(typeof back==='function')return back()};
 launcher.hidden=false;const syncNav=()=>{const title=tr('Factory','المصنع');launcher.querySelector('span').textContent=title;launcher.setAttribute('aria-label',title)};syncNav();new MutationObserver(syncNav).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});render(true);
 setInterval(()=>{if(document.hidden)return;sample();if(!root.hidden)render()},1000);
}
function sample(){
 const s=read();
 if(!s){if(lastEvent!=='offline'){event('Connection unavailable / الاتصال غير متاح');lastEvent='offline'}points=[];return}
 if(lastSerial!==s.serial){lastSerial=s.serial;points=[]}
 const fingerprint=[s.serial,s.state,s.fault_code,s.sensor_home,s.sensor_end,s.homed].join('|');
 if(lastEvent!==fingerprint){event([s.serial,s.state,'F'+s.fault_code,'HOME '+s.sensor_home,'END '+s.sensor_end].join(' · '));lastEvent=fingerprint}
 if(num(s.position_mm)&&s.homed===true){points.push(s.position_mm);points=points.slice(-60)}else points=[];
}
function card(a,b,value,note=''){return '<article class="we-card"><small>'+label(a,b)+'</small><strong>'+esc(value)+'</strong>'+(note?'<p>'+esc(note)+'</p>':'')+'</article>'}
function row(a,b,value){return '<div class="we-line"><span>'+label(a,b)+'</span><b>'+esc(value)+'</b></div>'}
function fault(s){if(!s||!num(s.fault_code))return '—';const f=faults[s.fault_code];return 'F'+s.fault_code+' · '+(f?tr(f[0],f[1]):tr('Unknown code','كود غير معروف'))}
function chart(){
 if(points.length<2)return '<p class="we-muted">'+label('Waiting for two valid position samples','في انتظار قراءتين صالحتين للموضع')+'</p>';
 const min=Math.min(...points),max=Math.max(...points),span=Math.max(max-min,1);
 const xy=points.map((v,i)=>(10+i*300/Math.max(1,points.length-1)).toFixed(1)+','+(95-80*(v-min)/span).toFixed(1)).join(' ');
 return '<svg viewBox="0 0 320 110" aria-label="Estimated position trend"><path d="M10 15H310 M10 55H310 M10 95H310" stroke="#34434a" fill="none"/><polyline points="'+xy+'" stroke="#5ce6cf" stroke-width="2.5" fill="none"/></svg><p class="we-muted">'+esc(min.toFixed(2)+' — '+max.toFixed(2)+' mm · '+points.length+' samples')+'</p>';
}
function render(reset=false){
 const s=read(),content=$e('weContent');if(!content)return;
 $e('weStatus').textContent=s?tr('CONNECTED · ','متصل · ')+String(s.state)+' · '+String(s.firmware):tr('OFFLINE · no live readings','غير متصل · لا توجد قراءات حية');
 $e('weStatus').classList.toggle('connected',!!s);
 document.querySelectorAll('[data-we]').forEach(b=>b.classList.toggle('selected',b.dataset.we===tab));
 if(tab==='calc'){if(reset||!$e('weCalc'))drawCalc(s);return}
 if(tab==='overview'){
  content.innerHTML='<h2>'+label('Axis telemetry','مراقبة المحور')+'</h2><div class="we-grid">'+card('Position estimate','الموضع التقديري',format(s?.position_mm,'mm'),tr('Open-loop step count','عداد نبضات دون حساس موضع'))+card('Travel limit','حد المشوار',format(s?.travel_limit_mm,'mm'))+card('Set speed','السرعة المضبوطة',format(num(s?.speed)?s.speed/60:null,'mm/s'))+card('Cycle progress','تقدم الدورة',format(s?.progress,'%'))+'</div><section class="we-panel"><h3>'+label('Position trend','منحنى الموضع')+'</h3>'+chart()+'</section><section class="we-panel"><h3>'+label('Controller diagnosis','تشخيص الكنترول')+'</h3>'+row('Fault','العطل',fault(s))+row('Homed','تصفير المحور',s?.homed===true?tr('YES','نعم'):s?.homed===false?tr('NO','لا'):'—')+row('Serial','رقم الماكينة',s?.serial||'—')+row('Remote','الريموت',s?.remote_online===true?tr('Online','متصل'):s?.remote_online===false?tr('Offline','غير متصل'):'—')+'</section>';
 }else if(tab==='io'){
  content.innerHTML='<h2>'+label('Signal monitor','مراقبة الإشارات')+'</h2><div class="we-grid">'+card('HOME · GPIO34','HOME · GPIO34',bool(s?.sensor_home),tr('Logical sensor state · active HIGH','حالة الحساس المنطقية · HIGH نشط'))+card('END · GPIO12','END · GPIO12',bool(s?.sensor_end),tr('HIGH = limit or open circuit','HIGH = نهاية المشوار أو قطع السلك'))+'</div><section class="we-panel">'+row('Backlight reported','إضاءة الشاشة',bool(s?.backlight_on))+row('Weld output enabled','خرج اللحام مسموح',bool(s?.relay_output_enabled))+row('Jogging','تحريك يدوي',bool(s?.motor_jogging))+row('E-stop feedback','قراءة زر الطوارئ',tr('Not provided','غير متاحة'))+'</section><section class="we-panel"><h3>'+label('V7.3.11 wiring reference','مرجع البنات V7.3.11')+'</h3>'+[['START','13'],['ENTER','14'],['PAUSE','25'],['ESC','26'],['FAST','32'],['UP','16'],['DOWN','17'],['STEP','21'],['DIR','22']].map(x=>row(x[0],x[0],'GPIO '+x[1])).join('')+'<p class="we-muted">'+label('Reference only. Raw GPIO, physical relay feedback and live button states are not exposed by this firmware.','مرجع فقط. حالة البنات الخام والريليه الفعلية والأزرار غير متاحة من هذا الكود.')+'</p></section>';
 }else if(tab==='log'){
  content.innerHTML='<h2>'+label('Local event history','سجل الأحداث المحلي')+'</h2><p class="we-muted">'+label('Observed in the app only; not a controller black box.','الأحداث المرصودة داخل التطبيق فقط وليست سجل الكنترول الكامل.')+'</p><section class="we-panel">'+(log.length?log.slice().reverse().map(x=>'<div class="we-event"><small>'+esc(x.at)+'</small><p>'+esc(x.text)+'</p></div>').join(''):'—')+'</section>';
 }
}
function drawCalc(s){
 const content=$e('weContent');content.innerHTML='<h2>'+label('Engineering calculators','الحسابات الهندسية')+'</h2><p class="we-muted">'+label('Planning estimates only; do not set the controller. Verify driver steps/rev and actual speed.','حسابات تخطيطية فقط؛ لا تغير إعدادات الكنترول. تحقق من تقسيم الدرايفر والسرعة.')+'</p><section class="we-panel" id="weCalc"><div class="we-form">'+[['d','Distance mm','المسافة مم',s?.distance??100],['s','Speed mm/s','السرعة مم/ث',num(s?.speed)?s.speed/60:2],['l','Lead mm/rev','خطوة الاسكرو مم/لفة',s?.lead??10],['p','Full steps/rev','الخطوات الكاملة/لفة',200],['m','Microstep factor','تقسيم الخطوة',8],['h','Relay Hz','تردد التتشات Hz',s?.pulse??3]].map(x=>'<label>'+label(x[1],x[2])+'<input id="we_'+x[0]+'" inputmode="decimal" type="number" step="any" value="'+esc(x[3])+'"></label>').join('')+'</div><div id="weResults"></div></section>';
 function update(){const v=['d','s','l','p','m','h'].map(id=>{const el=$e('we_'+id);return el.value.trim()===''?NaN:Number(el.value)});v[1]*=60;const c=calculate(...v);$e('weResults').innerHTML=c?row('Travel time','زمن المشوار',format(c.seconds,'s'))+row('Screw speed','سرعة الاسكرو',format(c.rpm,'rpm'))+row('Steps/mm','نبضات لكل مم',format(c.stepsPerMm,'step/mm'))+row('STEP frequency','تردد STEP',format(c.stepHz,'Hz'))+row('Pulse spacing','المسافة بين التتشات',format(c.pitch,'mm'))+row('Estimated pulses','عدد التتشات التقريبي',format(c.pulses)):'<p>'+label('Enter valid positive values (distance and relay frequency may be zero).','أدخل قيماً صالحة موجبة (المسافة والتردد يمكن أن يكونا صفراً).')+'</p>'}
 content.querySelectorAll('input').forEach(x=>x.addEventListener('input',update));update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
