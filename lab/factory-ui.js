
(function(){
'use strict';
const pins=[12,34,35,36,39];
const fields=[
 {k:'home',en:'HOME input GPIO',ar:'بن HOME',type:'select',options:pins,v:34},
 {k:'end',en:'END input GPIO',ar:'بن END',type:'select',options:pins,v:12},
 {k:'homeLow',en:'HOME active level',ar:'قطبية HOME',type:'select',options:[0,1],v:0},
 {k:'endLow',en:'END active level',ar:'قطبية END',type:'select',options:[0,1],v:0},
 {k:'dirLow',en:'Electrical DIR polarity',ar:'عكس اتجاه دوران الموتور',type:'select',options:[0,1],v:0},
 {k:'ppr',en:'Driver pulses/rev',ar:'نبضة لكل لفة',type:'number',v:400,min:200,max:25600,integer:true},
 {k:'initial',en:'Initial speed mm/min',ar:'السرعة الابتدائية مم/د',type:'number',v:18,min:1,max:600},
 {k:'lead',en:'Screw lead mm/rev',ar:'خطوة الاسكرو مم/لفة',type:'number',v:10,min:.1,max:40},
 {k:'travel',en:'Usable travel mm (0 = unset)',ar:'المشوار الفعلي مم (0 غير معاير)',type:'number',v:0,min:0,max:1000}
];
const metadata=[
 {k:'recordId',en:'Machine record ID',ar:'رقم ملف الماكينة',v:''},
 {k:'machineName',en:'Machine name',ar:'اسم الماكينة',v:''},
 {k:'model',en:'Model',ar:'الموديل',v:'uArt WC-01'},
 {k:'assetSerial',en:'Asset serial number',ar:'الرقم التسلسلي التجاري',v:''},
 {k:'customer',en:'Customer',ar:'اسم العميل',v:''},
 {k:'address',en:'Installation address',ar:'عنوان التركيب',v:''},
 {k:'railLength',en:'Nominal rail length mm',ar:'طول السكة الاسمي مم',v:'1000'},
 {k:'homeSide',en:'Physical HOME side (left/right)',ar:'جهة الهوم الفعلية (يمين/يسار)',v:'right'},
 {k:'forwardLabel',en:'Operator forward definition',ar:'تعريف اتجاه Forward للمشغل',v:'away from HOME'},
 {k:'weldSpeed',en:'Weld speed mm/min',ar:'سرعة اللحام مم/د',v:'80'},
 {k:'jogSpeed',en:'Jog speed mm/min',ar:'السرعة اليدوية مم/د',v:'50'},
 {k:'fastSpeed',en:'FAST speed mm/min',ar:'سرعة FAST مم/د',v:'600'},
 {k:'homeSpeed',en:'HOME speed mm/min',ar:'سرعة الهوم مم/د',v:'600'},
 {k:'approachSpeed',en:'HOME approach mm/min',ar:'سرعة الاقتراب مم/د',v:'120'},
 {k:'relayHz',en:'Relay frequency Hz',ar:'تردد التتشات Hz',v:'0'},
 {k:'duty',en:'Relay duty %',ar:'نسبة تشغيل الريليه %',v:'50'},
 {k:'screenSleep',en:'Display timeout min',ar:'إطفاء الشاشة دقيقة',v:'5'},
 {k:'wifiSSID',en:'Planned factory Wi-Fi SSID',ar:'اسم شبكة المصنع (مخطط)',v:''},
 {k:'remoteId',en:'Remote ID',ar:'رقم الريموت',v:''},
 {k:'notes',en:'Wiring and service notes',ar:'ملاحظات التوصيل والصيانة',v:''}
];
const getDefault=()=>Object.fromEntries([...fields,...metadata].map(f=>[f.k,f.v]));
function validate(v){for(const f of fields){const n=v[f.k];if(typeof n!=='number'||!Number.isFinite(n))return false;if(f.options&&!f.options.includes(n))return false;if(f.min!=null&&(n<f.min||n>f.max||f.integer&&!Number.isInteger(n)))return false}return v.home!==v.end}
globalThis.WC01FactoryV11={validate,getDefault};
if(typeof document==='undefined')return;
const tr=(a,b)=>msg(a,b), E=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const l=(a,b)=>esc(tr(a,b));
let records={}, currentDevice=null, busy=false, panel;
try{const v=JSON.parse(localStorage.getItem('wc01.factory.v11')||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))records=v}catch(e){}
function persist(){localStorage.setItem('wc01.factory.v11',JSON.stringify(records))}
function message(s){E('wfMessage').textContent=String(s)}
function mount(){
 const root=E('wcEngRoot');if(!root||E('wfLaunch'))return false;
 const b=document.createElement('button');b.id='wfLaunch';b.type='button';b.textContent='FACTORY / المصنع';b.className='wf-launch';root.querySelector('.we-head')?.after(b);
 panel=document.createElement('section');panel.id='wfPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Factory configuration');document.body.append(panel);
 b.onclick=()=>{try{stopJog()}catch(e){}panel.hidden=false;draw(getDefault())};
 return true;
}
function renderRecords(){const select=E('wfRecords');select.replaceChildren(new Option(tr('Select machine record','اختر ملف ماكينة'),''));for(const key of Object.keys(records).sort())select.add(new Option(key,key))}
function draw(v){
 panel.dir=tr('ltr','rtl');
 panel.innerHTML='<header><div><small>uArt WC-01+ · V1.1 DEV</small><h1>'+l('Factory center','مركز إعدادات المصنع')+'</h1></div><button id="wfClose" type="button">'+l('Back','رجوع')+'</button></header><p class="wf-warn">'+l('DEVELOPMENT: controller motor and weld outputs locked. Only the first nine hardware fields can be written to V1.1 DEV. All other fields are local records, not machine settings.','نسخة تطوير: مخارج الحركة واللحام مقفولة. أول تسعة حقول فقط يمكن إرسالها إلى كنترول V1.1 DEV. بقية الحقول بيانات محلية وليست إعدادات مطبقة.')+'</p><section><h2>'+l('Machine records','ملفات الماكينات')+'</h2><select id="wfRecords"></select><div class="wf-actions"><button id="wfNew" type="button">'+l('New','جديد')+'</button><button id="wfLoad" type="button">'+l('Open','فتح')+'</button><button id="wfSave" type="button">'+l('Save locally','حفظ محلي')+'</button></div><div class="wf-grid" id="wfMeta"></div></section><section><h2>'+l('Controller profile','ملف إعدادات الكنترول')+'</h2><p>'+l('TFT, keypad, output pins are fixed in this build. GPIO12 boot strap: no external pull-up. Inputs 34/35/36/39 require suitable external bias. Rewire only with power isolated.','بنات الشاشة والأزرار والمخارج ثابتة في هذا الإصدار. GPIO12 رجل إقلاع: لا سحب خارجي إلى 3.3V. البنات 34/35/36/39 تحتاج مقاومة خارجية مناسبة. افصل القدرة قبل التوصيل.')+'</p><div class="wf-grid" id="wfFields"></div><button id="wfSwap" type="button">'+l('Swap HOME and END pins','تبديل بنات HOME وEND')+'</button><p>'+l('Swap changes the draft only. Confirm contact wiring and polarity separately.','التبديل يغير المسودة فقط. تحقق من نوع التوصيل والقطبية كلٌ على حدة.')+'</p></section><section><h2>'+l('Direct controller connection','اتصال مباشر بالكنترول')+'</h2><p>'+l('Join uArt-WC01 Wi-Fi. Use the Pair Key and the session-only factory key shown on USB Serial at boot. No automatic replay.','اتصل بشبكة uArt-WC01. أدخل Pair Key ومفتاح جلسة المصنع الظاهر في Serial USB عند الإقلاع. لا إعادة تنفيذ تلقائية.')+'</p><label>'+l('Pair Key','مفتاح الربط')+'<input id="wfPair" type="password" autocomplete="off"></label><label>'+l('Factory session key','مفتاح المصنع المؤقت')+'<input id="wfKey" type="password" autocomplete="off"></label><div class="wf-actions"><button id="wfRead" type="button">'+l('Read controller','قراءة الكنترول')+'</button><button id="wfApply" type="button">'+l('Save for next boot','حفظ للإقلاع التالي')+'</button></div><p id="wfMessage" role="status"></p></section><section><h2>'+l('Backup / restore JSON','نسخ واستعادة JSON')+'</h2><p>'+l('Export contains machine data only, never Wi-Fi passwords or keys. Copy to a file and keep one per machine.','التصدير يحتوي على بيانات الماكينة فقط دون كلمات المرور والمفاتيح. انسخ النص إلى ملف مستقل لكل ماكينة.')+'</p><textarea id="wfJson" rows="6"></textarea><div class="wf-actions"><button id="wfExport" type="button">'+l('Export record','تصدير الملف')+'</button><button id="wfImport" type="button">'+l('Import draft','استيراد المسودة')+'</button></div></section>';
 const mk=(f)=>'<label>'+l(f.en,f.ar)+(f.type==='select'?'<select id="wf_'+f.k+'">'+f.options.map(n=>'<option value="'+n+'"'+(v[f.k]===n?' selected':'')+'>'+esc(f.k==='homeLow'||f.k==='endLow'?n?'LOW':'HIGH':f.k==='dirLow'?n?tr('Inverted','معكوس'):tr('Normal','عادي'):'GPIO '+n)+'</option>').join('')+'</select>':'<input id="wf_'+f.k+'" type="'+(f.type==='number'?'number':'text')+'" '+(f.type==='number'?'step="any" min="'+f.min+'" max="'+f.max+'"':'maxlength="200"')+' value="'+esc(v[f.k]??f.v)+'">')+'</label>';
 E('wfFields').innerHTML=fields.map(mk).join('');E('wfMeta').innerHTML=metadata.map(mk).join('');renderRecords();
 E('wfClose').onclick=()=>{if(busy)return;panel.hidden=true;currentDevice=null;E('wfPair').value='';E('wfKey').value=''};
 E('wfNew').onclick=()=>{if(!busy&&confirm(tr('Clear the draft?','مسح المسودة؟'))){currentDevice=null;draw(getDefault())}};
 E('wfLoad').onclick=()=>{const k=E('wfRecords').value;if(!busy&&k&&records[k]){currentDevice=null;draw({...getDefault(),...records[k]})}};
 E('wfSave').onclick=()=>{const v=values();if(!validate(v)||!v.recordId.trim()){message(tr('Enter a record ID and valid unique sensor pins.','أدخل رقم ملف وبنات حساسات صالحة غير متكررة.'));return}const k=v.recordId.trim();if(!Object.prototype.hasOwnProperty.call(records,k)&&Object.keys(records).length>=200){message('Record limit: 200');return}if(Object.prototype.hasOwnProperty.call(records,k)&&!confirm(tr('Replace existing machine record?','استبدال ملف الماكينة الحالي؟')))return;records[k]=v;persist();renderRecords();message(tr('Record saved locally, not sent.','تم حفظ ملف الماكينة محليًا دون إرسال.'))};
 E('wfSwap').onclick=()=>{const a=E('wf_home'),b=E('wf_end'),v=a.value;a.value=b.value;b.value=v;message(tr('Draft changed; not applied.','تم تعديل المسودة دون تطبيق.'))};
 E('wfExport').onclick=()=>{const v=values();if(!validate(v)||!v.recordId.trim()){message(tr('Enter a valid record ID and profile.','أدخل رقم ملف وبيانات صالحة.'));return}E('wfJson').value=JSON.stringify({schema:'uart-wc01-factory-v1.1',profile:v},null,2);E('wfJson').focus();E('wfJson').select()};
 E('wfImport').onclick=()=>{if(busy)return;try{const x=JSON.parse(E('wfJson').value);if(x.schema!=='uart-wc01-factory-v1.1'||!x.profile||!validate(x.profile))throw Error('Invalid schema');const v={...getDefault()};for(const f of fields)v[f.k]=x.profile[f.k];for(const f of metadata)if(typeof x.profile[f.k]==='string')v[f.k]=x.profile[f.k].slice(0,200);currentDevice=null;draw(v);message(tr('Imported as draft only.','تم الاستيراد كمسودة فقط.'))}catch(e){message(tr('Invalid backup.','ملف النسخة الاحتياطية غير صالح.'))}};
 E('wfRead').onclick=()=>request(false);E('wfApply').onclick=()=>request(true);
}
function values(){const v={};for(const f of fields){const raw=E('wf_'+f.k).value;v[f.k]=raw.trim()===''?NaN:Number(raw)}for(const f of metadata)v[f.k]=E('wf_'+f.k).value.slice(0,200);return v}
async function request(write){
 if(busy)return;
 const key=E('wfPair').value.trim(),factory=E('wfKey').value.trim(),v=values();
 if(key.length<18||factory.length<22){message(tr('Both keys are required.','المفتاحان مطلوبان.'));return}
 if(write&&(!currentDevice||!validate(v))){message(tr('Read this controller first and validate the draft.','اقرأ الكنترول أولًا وتأكد من صلاحية المسودة.'));return}
 if(write&&!confirm(tr('Save to '+currentDevice.serial+' for next boot? Disconnect motor and welder power. Hold physical ENTER+ESC on HOME during the request.','حفظ للكنترول '+currentDevice.serial+' للإقلاع التالي؟ افصل قدرة الموتور واللحام واضغط ENTER+ESC فعليًا في شاشة HOME أثناء الطلب.')))return;
 busy=true;E('wfRead').disabled=E('wfApply').disabled=true;message(tr('Connecting…','جاري الاتصال…'));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const headers={'X-WC01-Key':key,'X-WC01-Factory-Key':factory};
  const opts={method:write?'POST':'GET',headers,cache:'no-store',signal:controller.signal,redirect:'error'};
  if(write){const body=new URLSearchParams();for(const f of fields)body.set(f.k,String(v[f.k]));body.set('serial',currentDevice.serial);body.set('nonce',String(currentDevice.nonce));opts.body=body;headers['Content-Type']='application/x-www-form-urlencoded'}
  const res=await fetch('http://192.168.4.1/api/factory',opts),data=await res.json();
  if(!res.ok||!data.ok)throw Error(data.error||'HTTP '+res.status);
  if(data.bench_only!==true)throw Error('Unsupported firmware');
  if(write){currentDevice=null;message(tr('Saved for next boot. Reboot manually and read back. Outputs remain locked.','تم الحفظ للإقلاع التالي. أعد التشغيل يدويًا ثم اقرأ القيم. المخارج تظل مقفولة.'))}
  else{if(typeof data.serial!=='string'||!Number.isInteger(data.nonce)||!validate(data))throw Error('Invalid controller response');currentDevice={serial:data.serial,nonce:data.nonce};for(const f of fields)E('wf_'+f.k).value=String(data[f.k]);if(!E('wf_recordId').value.trim())E('wf_recordId').value=data.serial;message(tr('Read ', 'تمت قراءة ')+data.serial+' | HOME raw '+data.homeRaw+' | END raw '+data.endRaw)}
 }catch(e){currentDevice=null;message(tr('Request not confirmed: ','الطلب غير مؤكد: ')+String(e.message||e))}
 finally{clearTimeout(timeout);busy=false;E('wfRead').disabled=E('wfApply').disabled=false}
}
function init(){if(!mount()){let tries=0;const t=setInterval(()=>{if(mount()||++tries>20)clearInterval(t)},100)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
