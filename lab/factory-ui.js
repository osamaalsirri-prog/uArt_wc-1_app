
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
 {k:'initial',en:'Initial speed mm/s',ar:'السرعة الابتدائية مم/ث',type:'number',v:18,min:1,max:600},
 {k:'minSpeedCenti',en:'Minimum operating speed (mm/s)',ar:'أدنى سرعة تشغيل (مم/ث)',type:'number',v:1,min:1,max:6600,integer:true},
 {k:'maxSpeed',en:'Maximum operating speed (mm/s)',ar:'أقصى سرعة تشغيل (مم/ث)',type:'number',v:3960,min:60,max:3960,integer:true},
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
 {k:'weldSpeed',en:'Weld speed (mm/s)',ar:'سرعة اللحام مم/ث',v:'80'},
 {k:'jogSpeed',en:'Jog speed (mm/s)',ar:'السرعة اليدوية مم/ث',v:'50'},
 {k:'fastSpeed',en:'FAST speed (mm/s)',ar:'سرعة FAST مم/ث',v:'600'},
 {k:'homeSpeed',en:'HOME speed (mm/s)',ar:'سرعة الهوم مم/ث',v:'600'},
 {k:'approachSpeed',en:'HOME approach (mm/s)',ar:'سرعة الاقتراب مم/ث',v:'120'},
 {k:'relayHz',en:'Relay frequency Hz',ar:'تردد التتشات Hz',v:'0'},
 {k:'duty',en:'Relay duty %',ar:'نسبة تشغيل الريليه %',v:'50'},
 {k:'screenSleep',en:'Display timeout min',ar:'إطفاء الشاشة دقيقة',v:'5'},
 {k:'wifiSSID',en:'Planned factory Wi-Fi SSID',ar:'اسم شبكة المصنع (مخطط)',v:''},
 {k:'remoteId',en:'Remote ID',ar:'رقم الريموت',v:''},
 {k:'notes',en:'Wiring and service notes',ar:'ملاحظات التوصيل والصيانة',v:''}
];
const speedKeys=new Set(['initial','minSpeedCenti','maxSpeed']);
const recordSpeedKeys=new Set(['weldSpeed','jogSpeed','fastSpeed','homeSpeed','approachSpeed']);
function unitScale(k){return k==='minSpeedCenti'?100:(k==='initial'||k==='maxSpeed'||recordSpeedKeys.has(k))?60:1}
function displayValue(k,v){if(unitScale(k)===1||v===''||!Number.isFinite(Number(v)))return v;return Number((Number(v)/unitScale(k)).toFixed(4))}
function readValue(k,raw){if(!raw.trim())return NaN;const n=Number(raw)*unitScale(k);return ['minSpeedCenti','maxSpeed'].includes(k)?Math.round(n):Math.round(n*1000)/1000}
const getDefault=()=>Object.fromEntries([...fields,...metadata].map(f=>[f.k,f.v]));
function validate(v){for(const f of fields){const n=v[f.k];if(typeof n!=='number'||!Number.isFinite(n))return false;if(f.options&&!f.options.includes(n))return false;if(f.min!=null&&(n<f.min||n>f.max||f.integer&&!Number.isInteger(n)))return false}return v.home!==v.end&&v.initial<=v.maxSpeed&&v.minSpeedCenti*0.6<=v.maxSpeed+1e-7&&v.minSpeedCenti/100<=1000000*v.lead/(375*v.ppr)+1e-7}
globalThis.WC01FactoryV11={validate,getDefault,displayValue,readValue};
if(typeof document==='undefined')return;
const tr=(a,b)=>msg(a,b), E=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const l=(a,b)=>esc(tr(a,b));
let records=Object.create(null), currentDevice=null, busy=false, panel;
try{const v=JSON.parse(localStorage.getItem('wc01.factory.v11')||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))for(const [k,x] of Object.entries(v))if(x&&typeof x==='object'&&k!=='__proto__'&&k!=='constructor'&&k!=='prototype')records[k]=x}catch(e){}
function persist(){try{localStorage.setItem('wc01.factory.v11',JSON.stringify(records));return true}catch{return false}}
function message(s){E('wfMessage').textContent=String(s);const p=E('wfSpeedMessage');if(p)p.textContent=String(s)}
function mount(){
 const root=E('wcEngRoot');if(!root||E('wfLaunch'))return false;
 const b=document.createElement('button');b.id='wfLaunch';b.type='button';b.textContent='FACTORY / المصنع';b.className='wf-launch';root.querySelector('.we-head')?.after(b);
 panel=document.createElement('section');panel.id='wfPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Factory configuration');document.body.append(panel);
 function openFactory(){stopJog();toggleFloatingPanel(false);root.hidden=true;panel.hidden=false;if(!E('wfRecords'))draw(getDefault());if(!E('wfPair').value)E('wfPair').value=readPairedKey();refreshLive();panel.scrollTop=0}
 window.WC01OpenFactory=openFactory;b.onclick=openFactory;
 const back=window.__wc01Back;window.__wc01Back=()=>{if(!panel.hidden){if(!busy)E('wfClose').click();return}if(typeof back==='function')return back()};
 setInterval(()=>{if(panel&&!panel.hidden)refreshLive()},1000);return true;
}
function refreshLive(){const el=E('wfLiveSpeed');if(!el)return;const min=online()?numericField(liveStatus.speed_min_mm_s):null,max=online()?numericField(liveStatus.speed_limit_mm_s):null;const pulse=online()?numericField(liveStatus.pulse_limited_speed_mm_s):null;const actual=k=>online()&&numericField(liveStatus[k])!==null?(Number(liveStatus[k])/60).toFixed(2):'—';el.textContent=tr('Active controller','الكنترول الفعلي')+' · '+(min===null?'—':min.toFixed(2))+' / '+(max===null?'—':max.toFixed(2))+' mm/s | '+tr('Pulse ceiling','حد النبضات')+' '+(pulse===null?'—':pulse.toFixed(2))+' mm/s\n'+tr('Weld / JOG / FAST','اللحام / اليدوي / السريع')+' · '+actual('speed')+' / '+actual('jog')+' / '+actual('fast')+' mm/s'}
function renderRecords(){const select=E('wfRecords');select.replaceChildren(new Option(tr('Select machine record','اختر ملف ماكينة'),''));for(const key of Object.keys(records).sort())select.add(new Option(key,key))}
function draw(v){
 panel.dir=tr('ltr','rtl');
 panel.innerHTML='<header><div><small>uArt WC-01+ · V1.1.8</small><h1>'+l('Factory center','مركز إعدادات المصنع')+'</h1></div><button id="wfClose" type="button">'+l('Back','رجوع')+'</button></header><button id="wfDiagnostics" type="button" class="wf-diagnostics">'+l('Diagnostics & live monitoring','التشخيص والمراقبة الحية')+'</button><p class="wf-warn">'+l('V1.1 test firmware or RUN candidate. RUN enables motor and welding with existing interlocks. Only the eleven hardware fields are writable; other fields are local records.','يدعم V1.1 DEV ومرشح RUN. مخارج الحركة واللحام مفعلة في RUN مع الحمايات الموجودة. أحد عشر حقلاً فقط قابلة للإرسال؛ باقي الحقول بيانات محلية.')+'</p><section class="wf-speed-section"><h2>'+l('Speed configuration','إعدادات السرعة')+'</h2><p id="wfLiveSpeed" class="wf-live-speed"></p><p id="wfSpeedMessage" role="status" class="wf-live-speed"></p><div class="wf-grid" id="wfSpeedFields"></div><p>'+l('Minimum limits commanded weld, JOG and FAST speeds only. Initial ramp, HOME and safety recovery may run slower. If saved operating speeds are below the new minimum, correct them in Settings before movement.','الحد الأدنى يخص سرعة اللحام والحركة اليدوية والسريعة المطلوبة فقط. بداية التسارع والهوم والاستعادة قد تكون أبطأ. لو السرعات المحفوظة أقل من الحد الجديد، عدلها من Settings قبل الحركة.')+'</p><div class="wf-actions"><button id="wfSpeedRead" type="button">'+l('Read actual limits','قراءة الحدود الفعلية')+'</button><button id="wfSpeedWrite" type="button">'+l('Save limits to controller','حفظ الحدود في الكنترول')+'</button><button id="wfNormalSettings" type="button">'+l('Weld / JOG / FAST settings','إعدادات اللحام / اليدوي / السريع')+'</button></div></section><section><h2>'+l('Machine records · local only','ملفات الماكينات · محلية فقط')+'</h2><select id="wfRecords"></select><div class="wf-actions"><button id="wfNew" type="button">'+l('New','جديد')+'</button><button id="wfLoad" type="button">'+l('Open','فتح')+'</button><button id="wfSave" type="button">'+l('Save locally','حفظ محلي')+'</button></div><div class="wf-grid" id="wfMeta"></div></section><section><h2>'+l('Controller profile','ملف إعدادات الكنترول')+'</h2><p>'+l('TFT, keypad, output pins are fixed in this build. GPIO12 boot strap: no external pull-up. Inputs 34/35/36/39 require suitable external bias. Rewire only with power isolated.','بنات الشاشة والأزرار والمخارج ثابتة في هذا الإصدار. GPIO12 رجل إقلاع: لا سحب خارجي إلى 3.3V. البنات 34/35/36/39 تحتاج مقاومة خارجية مناسبة. افصل القدرة قبل التوصيل.')+'</p><div class="wf-grid" id="wfFields"></div><button id="wfSwap" type="button">'+l('Swap HOME and END pins','تبديل بنات HOME وEND')+'</button><p>'+l('Swap changes the draft only. Confirm contact wiring and polarity separately.','التبديل يغير المسودة فقط. تحقق من نوع التوصيل والقطبية كلٌ على حدة.')+'</p></section><section><h2>'+l('Direct controller connection','اتصال مباشر بالكنترول')+'</h2><p>'+l('Join uArt-WC01 Wi-Fi. Use the App Pair Key and the factory key displayed on the controller after PIN verification. No automatic replay.','اتصل بشبكة uArt-WC01. أدخل مفتاح الربط ومفتاح المصنع الظاهر على شاشة الكنترول بعد الرقم السري. لا إعادة تنفيذ تلقائية.')+'</p><label>'+l('Pair Key','مفتاح الربط')+'<input id="wfPair" type="password" autocomplete="off"></label><label>'+l('Factory session key','مفتاح المصنع')+'<input id="wfKey" type="password" autocomplete="off"></label><div class="wf-actions"><button id="wfRead" type="button">'+l('Read controller','قراءة الكنترول')+'</button><button id="wfApply" type="button">'+l('Save hardware profile','حفظ إعدادات الهاردوير')+'</button></div><p id="wfMessage" role="status"></p></section><section><h2>'+l('Backup / restore JSON','نسخ واستعادة JSON')+'</h2><p>'+l('Export contains machine data only, never Wi-Fi passwords or keys. Copy to a file and keep one per machine.','التصدير يحتوي على بيانات الماكينة فقط دون كلمات المرور والمفاتيح. انسخ النص إلى ملف مستقل لكل ماكينة.')+'</p><textarea id="wfJson" rows="6"></textarea><div class="wf-actions"><button id="wfExport" type="button">'+l('Export record','تصدير الملف')+'</button><button id="wfImport" type="button">'+l('Import draft','استيراد المسودة')+'</button></div></section>';
 const mk=(f)=>'<label>'+l(f.en,f.ar)+(f.type==='select'?'<select id="wf_'+f.k+'">'+f.options.map(n=>'<option value="'+n+'"'+(v[f.k]===n?' selected':'')+'>'+esc(f.k==='homeLow'||f.k==='endLow'?n?'LOW':'HIGH':f.k==='dirLow'?n?tr('Inverted','معكوس'):tr('Normal','عادي'):'GPIO '+n)+'</option>').join('')+'</select>':'<input id="wf_'+f.k+'" type="'+(f.type==='number'?'number':'text')+'" '+(f.type==='number'?'step="any" min="'+(f.min/unitScale(f.k))+'" max="'+(f.max/unitScale(f.k))+'"':'maxlength="200"')+' value="'+esc(displayValue(f.k,v[f.k]??f.v))+'">')+'</label>';
 E('wfSpeedFields').innerHTML=fields.filter(f=>speedKeys.has(f.k)).map(mk).join('');E('wfFields').innerHTML=fields.filter(f=>!speedKeys.has(f.k)).map(mk).join('')+'<p>'+l('Maximum speed is a ceiling, not a movement command. The driver pulse-rate limit and all motion interlocks remain active.','أقصى سرعة حد فقط وليس أمر حركة. حد نبضات الدرايفر والحمايات يظلان فعالين.')+'</p>';E('wfMeta').innerHTML=metadata.map(mk).join('');renderRecords();
 E('wfClose').onclick=()=>{if(busy)return;panel.hidden=true;currentDevice=null;E('wfPair').value='';E('wfKey').value=''};
 E('wfDiagnostics').onclick=()=>{if(busy)return;E('wfClose').click();window.WC01OpenDiagnostics()};
 E('wfNew').onclick=()=>{if(!busy&&confirm(tr('Clear the draft?','مسح المسودة؟'))){currentDevice=null;draw(getDefault())}};
 E('wfLoad').onclick=()=>{const k=E('wfRecords').value;if(!busy&&k&&records[k]){currentDevice=null;draw({...getDefault(),...records[k]})}};
 E('wfSave').onclick=()=>{const v=values();if(!validate(v)||!v.recordId.trim()){message(tr('Enter a record ID and valid unique sensor pins.','أدخل رقم ملف وبنات حساسات صالحة غير متكررة.'));return}const k=v.recordId.trim();if(!Object.prototype.hasOwnProperty.call(records,k)&&Object.keys(records).length>=200){message('Record limit: 200');return}if(Object.prototype.hasOwnProperty.call(records,k)&&!confirm(tr('Replace existing machine record?','استبدال ملف الماكينة الحالي؟')))return;if(['__proto__','constructor','prototype'].includes(k)){message(tr('Invalid record ID.','رقم الملف غير صالح.'));return}const old=records[k];records[k]=v;if(!persist()){if(old)records[k]=old;else delete records[k];message(tr('Phone storage failed.','فشل الحفظ على الهاتف.'));return}renderRecords();message(tr('Record saved locally, not sent.','تم حفظ ملف الماكينة محليًا دون إرسال.'))};
 E('wfSwap').onclick=()=>{const a=E('wf_home'),b=E('wf_end'),v=a.value;a.value=b.value;b.value=v;message(tr('Draft changed; not applied.','تم تعديل المسودة دون تطبيق.'))};
 E('wfExport').onclick=()=>{const v=values();if(!validate(v)||!v.recordId.trim()){message(tr('Enter a valid record ID and profile.','أدخل رقم ملف وبيانات صالحة.'));return}E('wfJson').value=JSON.stringify({schema:'uart-wc01-factory-v1.1',profile:v},null,2);E('wfJson').focus();E('wfJson').select()};
 E('wfImport').onclick=()=>{if(busy)return;try{const x=JSON.parse(E('wfJson').value);if(x.profile&&x.profile.maxSpeed===undefined)x.profile.maxSpeed=1200;if(x.profile&&x.profile.minSpeedCenti===undefined)x.profile.minSpeedCenti=1;if(x.schema!=='uart-wc01-factory-v1.1'||!x.profile||!validate(x.profile))throw Error('Invalid schema');const v={...getDefault()};for(const f of fields)v[f.k]=x.profile[f.k];for(const f of metadata)if(typeof x.profile[f.k]==='string')v[f.k]=x.profile[f.k].slice(0,200);currentDevice=null;draw(v);message(tr('Imported as draft only.','تم الاستيراد كمسودة فقط.'))}catch(e){message(tr('Invalid backup.','ملف النسخة الاحتياطية غير صالح.'))}};
 E('wfRead').onclick=()=>request(false);E('wfApply').onclick=()=>request(true);E('wfSpeedRead').onclick=()=>{if(!E('wfKey').value.trim()){E('wfKey').scrollIntoView({block:'center'});E('wfKey').focus();message(tr('Enter factory key first.','أدخل مفتاح المصنع أولًا.'));return}request(false)};E('wfSpeedWrite').onclick=()=>{if(!E('wfKey').value.trim()){E('wfKey').scrollIntoView({block:'center'});E('wfKey').focus();return}request(true,true)};E('wfNormalSettings').onclick=()=>{if(busy)return;E('wfClose').click();go('settings')};refreshLive();
}
function values(){const v={};for(const f of fields){const raw=E('wf_'+f.k).value;v[f.k]=readValue(f.k,raw)}for(const f of metadata){const raw=E('wf_'+f.k).value.slice(0,200);v[f.k]=recordSpeedKeys.has(f.k)&&raw.trim()&&Number.isFinite(Number(raw))?String(readValue(f.k,raw)):raw;}return v}
async function request(write, speedOnly=false){
 if(busy||commandBusy||stopPending)return;
 if(!online()||!liveStatus.serial){message(tr('Connect to controller first.','اتصل بالكنترول أولًا.'));return}
 const link=linkGeneration,serial=liveStatus.serial;
 const key=E('wfPair').value.trim(),factory=E('wfKey').value.trim(),draft=values();
 if(key.length<18||factory.length<22){message(tr('Both keys are required.','مفتاح التطبيق ومفتاح المصنع مطلوبان.'));return}
 if(write&&!speedOnly&&(!currentDevice||currentDevice.serial!==serial||!validate(draft))){message(tr('Read this controller first and validate the draft.','اقرأ الكنترول أولًا وتأكد من صلاحية المسودة.'));return}
 if(write&&!speedOnly&&!confirm(tr('Save factory profile? Verify wiring. Hardware changes require reboot and HOME.','حفظ ملف المصنع؟ تحقق من التوصيلات. تغييرات الهاردوير تحتاج إعادة تشغيل وهوم.')))return;
 busy=true;commandBusy=true;statusGeneration++;render();E('wfRead').disabled=E('wfApply').disabled=E('wfSpeedRead').disabled=E('wfSpeedWrite').disabled=true;message(tr('Connecting…','جاري الاتصال…'));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 const errors={FACTORY_AUTH:['Invalid factory key','مفتاح المصنع غير صحيح'],PAIRING_FAILED:['Invalid app key','مفتاح التطبيق غير صحيح'],CONTROLLER_BUSY:['Stop motion and welding first','أوقف الحركة واللحام أولًا'],HOME_IDLE_REQUIRED:['Old controller: update firmware','حدث كود الكنترول أولًا'],HOLD_LOCAL_ENTER_ESC:['Old controller: update firmware','حدث كود الكنترول أولًا'],STALE_DEVICE_OR_NONCE:['Read controller again','اقرأ الكنترول مرة أخرى'],INVALID_PROFILE:['Invalid settings','قيم الإعدادات غير صالحة'],PIN_CONFLICT_OR_RANGE:['Pin conflict or invalid speed limits','تعارض بنات أو حدود سرعة غير صالحة'],NVS_WRITE_FAILED:['Storage write failed','فشل الحفظ في ذاكرة الكنترول'],STORAGE_NOT_CONFIRMED:['Storage not confirmed','لم يتأكد الحفظ'],READBACK_MISMATCH:['Saved values do not match','القيم المقروءة لا تطابق المطلوب']};
 async function call(body){if(link!==linkGeneration||!online()||liveStatus.serial!==serial||document.hidden)throw Error('CONTROLLER_CHANGED');const headers={'X-WC01-Key':key,'X-WC01-Factory-Key':factory};const opts={method:body?'POST':'GET',headers,cache:'no-store',signal:controller.signal,redirect:'error'};if(body){opts.body=body;headers['Content-Type']='application/x-www-form-urlencoded'}const res=await fetch('http://192.168.4.1/api/factory',opts),data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'HTTP '+res.status);if(data.bench_only!==false||data.factory_profile_version!==3)throw Error('Unsupported controller');if(link!==linkGeneration||!online()||liveStatus.serial!==serial||document.hidden||(data.serial&&data.serial!==serial))throw Error('CONTROLLER_CHANGED');return data}
 function display(data){if(typeof data.serial!=='string'||!Number.isInteger(data.nonce)||!validate(data))throw Error('Invalid controller response');currentDevice={serial:data.serial,nonce:data.nonce};for(const f of fields)E('wf_'+f.k).value=String(displayValue(f.k,data[f.k]));if(!E('wf_recordId').value.trim())E('wf_recordId').value=data.serial}
 try{
  if(!write){const data=await call();display(data);message(tr('Read ','تمت قراءة ')+data.serial);return}
  let v=draft;
  if(!speedOnly){const actual=await call();if(actual.serial!==currentDevice.serial||actual.nonce!==currentDevice.nonce)throw Error('STALE_DEVICE_OR_NONCE')}
  if(speedOnly){const actual=await call();if(!validate(actual)||typeof actual.serial!=='string'||!Number.isInteger(actual.nonce))throw Error('INVALID_PROFILE');currentDevice={serial:actual.serial,nonce:actual.nonce};v={...actual};for(const k of speedKeys)v[k]=draft[k];if(!validate(v))throw Error('INVALID_PROFILE')}
  const body=new URLSearchParams();for(const f of fields)body.set(f.k,String(v[f.k]));body.set('serial',currentDevice.serial);body.set('nonce',String(currentDevice.nonce));if(speedOnly)body.set('speed_only','1');
  const data=await call(body);
  if(data.saved!==true)throw Error('STORAGE_NOT_CONFIRMED');
  if(data.reboot_required===true){currentDevice=null;message(tr('Hardware profile saved. Reboot and HOME required. If only speeds were changed, update controller F3.','تم حفظ إعدادات الهاردوير. يلزم إعادة تشغيل وهوم. لو عدلت السرعات فقط، حدّث الكنترول إلى F3.'));return}
  if(data.reboot_required!==false)throw Error('STORAGE_NOT_CONFIRMED');
  const actual=await call();if(actual.serial!==currentDevice.serial||fields.some(f=>Math.abs(Number(actual[f.k])-Number(v[f.k]))>(f.k==='lead'?0.00051:0.0051)))throw Error('READBACK_MISMATCH');
  display(actual);message(tr('Saved and verified. Active now; no reboot.','تم الحفظ والتحقق من القيم. مطبقة الآن بدون إعادة تشغيل.'));
 }catch(e){currentDevice=null;const k=String(e.message||e),a=errors[k];message(tr('Request not confirmed: ','الطلب غير مؤكد: ')+(a?tr(a[0],a[1]):k))}
 finally{clearTimeout(timeout);busy=false;commandBusy=false;render();poll();E('wfRead').disabled=E('wfApply').disabled=E('wfSpeedRead').disabled=E('wfSpeedWrite').disabled=false}
}
function init(){if(!mount()){let tries=0;const t=setInterval(()=>{if(mount()||++tries>20)clearInterval(t)},100)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
