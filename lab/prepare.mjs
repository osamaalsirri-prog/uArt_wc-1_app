import fs from 'node:fs';
import path from 'node:path';
function makeEdition(source,edition){
 const x={...source},eng=edition==='engineering';
 const sub=(s,a,b)=>{if(!s.includes(a))throw Error('Missing anchor: '+a.slice(0,90));return s.replace(a,b)};
 x.gradle=sub(x.gradle,'versionCode = 17','versionCode = 30');
 x.gradle=sub(x.gradle,'versionName = "6.1.6"','versionName = "1.1.7"');
 if(eng)x.gradle=sub(x.gradle,'applicationId = "com.uart.wc01"','applicationId = "com.uart.wc01.engineering"');
 x.manifest=sub(x.manifest,'android:label="uArt WC-01"','android:label="'+(eng?'uArt WC-01+':'uArt WC-01')+'"');
 x.html=sub(x.html,'<div class="assistant-reply" id="assistantReply"','<details class="lab-engineering"><summary>Online AI / ذكاء أونلاين (اختياري)</summary><p>Uses your own OpenAI API key; requests may incur charges. Only the question you enter is sent. / قد تُحسب تكلفة حسب حسابك، يُرسل السؤال فقط.</p><label>API key (session only)<input id="labApiKey" type="password" autocomplete="off" maxlength="256"></label><label>Model<input id="labModel" value="gpt-4.1-mini" maxlength="64"></label><button type="button" id="labOnline">Ask online / اسأل أونلاين</button><div id="labOnlineStatus" role="status"></div></details><div class="lab-chat" id="labChat" role="log" aria-live="polite"></div><div class="lab-prompts"><button type="button" data-question="F8">F8</button><button type="button" data-question="ESP32 restart">Power</button><button type="button" data-question="HOME">HOME</button><button type="button" data-question="Wi-Fi">Wi-Fi</button></div><div class="assistant-reply" id="assistantReply"');
 x.html=sub(x.html,'<script src="js/app.js"></script>','<script src="js/lab-core.js"></script><script src="js/app.js"></script>');
 x.html=sub(x.html,'<span class="eyebrow">uArt · OFFLINE</span>','<span class="eyebrow">uArt · '+(eng?'WC-01+ · Engineering':'WC-01 · Customer')+'</span>');
 if(eng)x.html=sub(x.html,'<p id="assistantIntro"','<details class="lab-engineering"><summary>Engineering workspace / سجل الماكينات</summary><p>Documentation only · no OTA or LAN discovery</p><label>Machine name<input id="labMachine" maxlength="50"></label><label>Asset ID<input id="labSerial" maxlength="60"></label><button type="button" id="labSave">Save record</button><button type="button" id="labCapture">Capture current identity</button><div id="labRegistry"></div></details><p id="assistantIntro"');
 x.css+='\n.assistant-sheet{background:linear-gradient(155deg,#172637,#0b141e 65%);border-color:#445b71}.lab-chat{display:flex;flex-direction:column;gap:12px;max-height:42dvh;min-height:125px;overflow:auto;padding:12px 3px}.lab-message{max-width:93%;padding:11px 14px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.7}.lab-message.user{align-self:flex-end;background:#2d3e51;border:1px solid #50657b}.lab-message.bot{align-self:flex-start;background:#102331;border:1px solid #345b6d;color:#e3f1f8}.lab-prompts{display:flex;gap:6px;flex-wrap:wrap;padding:6px 0}.lab-prompts button{padding:8px 13px;min-height:38px;border:1px solid #526b80;background:#1c3042;color:#c9e6f7;border-radius:24px;font-size:12px}.assistant-sheet .assistant-reply{position:absolute;width:1px;height:1px;min-height:0;overflow:hidden;clip-path:inset(50%);padding:0;margin:0;border:0}.lab-engineering{border:1px solid #a98642;padding:10px;border-radius:12px;color:#ffe1a4;margin-bottom:10px}.lab-engineering input{display:block;width:100%;margin:5px 0;padding:8px;border-radius:7px;background:#101c29;color:#fff;border:1px solid #586b7d}.lab-engineering button{min-height:38px;padding:6px 9px;margin:4px;background:#334659;color:#fff;border-radius:8px}.lab-engineering p,.lab-engineering #labRegistry{font-size:12px;line-height:1.6;white-space:pre-wrap}';
 const old="function openAssistant(){toggleFloatingPanel(false);stopJog();assistantState();assistantAnswer();showSheet('assistantOverlay')}";
 const added="let labLast='';let labBusy=false;\nfunction labMessage(s,role){const e=document.createElement('div');e.className='lab-message '+role;e.textContent=String(s);$('labChat').append(e);while($('labChat').children.length>24)$('labChat').firstElementChild.remove();$('labChat').scrollTop=$('labChat').scrollHeight;try{put('labChatV7',Array.from($('labChat').children).map(x=>({role:x.classList.contains('user')?'user':'bot',text:x.textContent})).slice(-24))}catch(e){}}\nfunction labAsk(q){q=String(q||'').trim();labMessage(q||msg('Check current status','افحص الحالة الحالية'),'user');const special=window.WC01Lab.diagnose(q,labLast);if(special){assistantProposal=null;$('assistantApply').classList.add('hidden');$('assistantReply').textContent=msg(special[1],special[0])}else assistantAnswer(q);labMessage($('assistantReply').textContent,'bot');if(q&&!/^(ليه|ازاي|كيف|why|how)[؟?\\s]*$/i.test(q))labLast=q;$('assistantInput').value=''}\nfunction labRegistryRender(){const el=$('labRegistry');if(!el)return;const a=get('labRegistry',[]);el.textContent=Array.isArray(a)?a.map(x=>x.name+' | '+x.id).join('\\n'):''}\nfunction labRegistrySave(){const name=$('labMachine').value.trim(),id=$('labSerial').value.trim();if(!name||!id){notify(msg('Enter name and ID','اكتب الاسم والرقم'));return}let a=get('labRegistry',[]);if(!Array.isArray(a))a=[];a=a.filter(x=>x.id!==id);a.push({name,id});put('labRegistry',a.slice(-50));labRegistryRender();$('labMachine').value='';$('labSerial').value=''}\nfunction openAssistant(){toggleFloatingPanel(false);stopJog();assistantProposal=null;$('assistantApply').classList.add('hidden');assistantState();if(!$('labChat').children.length){const saved=get('labChatV7',[]);if(Array.isArray(saved))for(const x of saved.slice(-24))if(x&&typeof x.text==='string'&&['user','bot'].includes(x.role))labMessage(x.text,x.role)}if(!$('labChat').children.length)labMessage(msg('Hello! Ask about faults, power or settings.','أهلاً! اسألني عن الأعطال والتغذية والإعدادات.'),'bot');showSheet('assistantOverlay');labRegistryRender()}";
 x.js=sub(x.js,old,added);
 x.js=sub(x.js,"$('assistantCheck').onclick=()=>assistantAnswer();$('assistantAsk').onclick=()=>assistantAnswer($('assistantInput').value);","$('assistantCheck').onclick=()=>labAsk('');$('assistantAsk').onclick=()=>labAsk($('assistantInput').value);$('labOnline').onclick=()=>{const q=$('assistantInput').value.trim(),key=$('labApiKey').value.trim(),model=$('labModel').value.trim();if(labBusy)return;if(!q||!key||!model){notify(msg('Enter question, key and model','اكتب السؤال والمفتاح والنموذج'));return}if(!window.WC01Online){notify(msg('Online bridge unavailable','الاتصال الخارجي غير متاح'));return}labBusy=true;$('labOnline').disabled=true;labMessage(q,'user');$('assistantInput').value='';$('labOnlineStatus').textContent=msg('Requesting online answer…','جاري طلب إجابة أونلاين…');try{window.WC01Online.ask(key,model,q)}catch(e){window.__wc01OnlineAnswer(false,'Online bridge failed')}};window.__wc01OnlineAnswer=(ok,answer)=>{labBusy=false;$('labOnline').disabled=false;$('labOnlineStatus').textContent=ok?msg('Online model','نموذج أونلاين'):msg('Online unavailable; local assistant still works','أونلاين غير متاح؛ المساعد المحلي يعمل');labMessage(String(answer),'bot')};document.querySelectorAll('[data-question]').forEach(el=>el.onclick=()=>labAsk(el.dataset.question));if($('labSave')){$('labSave').onclick=labRegistrySave;$('labCapture').onclick=()=>{if(online()&&typeof liveStatus.serial==='string')$('labSerial').value=liveStatus.serial;else notify(msg('No authenticated controller','لا يوجد كنترول متصل ومؤكد'))}};");
 x.js=sub(x.js,"$('assistantIntro').textContent=msg('Built-in diagnostic rules, no internet or external AI model.','قواعد تشخيص مدمجة، بدون إنترنت أو نموذج ذكاء اصطناعي خارجي.');","$('assistantIntro').textContent=msg('Local diagnostic rules · optional online model','قواعد تشخيص محلية · نموذج أونلاين اختياري');");
 x.js=sub(x.js,"v6.1.6 · Contextual remote, weld progress, local assistant","V1.1.7 · "+edition+" · Local + optional online");
 return x;
}
const root=process.argv[2],edition=process.argv[3];if(!['customer','engineering'].includes(edition))throw Error('edition');const map={js:'app/src/main/assets/js/app.js',html:'app/src/main/assets/index.html',css:'app/src/main/assets/css/style.css',gradle:'app/build.gradle.kts',manifest:'app/src/main/AndroidManifest.xml'};const source=Object.fromEntries(Object.entries(map).map(([k,v])=>[k,fs.readFileSync(path.join(root,v),'utf8')]));const result=makeEdition(source,edition);new Function(result.js);for(const [k,v] of Object.entries(map))fs.writeFileSync(path.join(root,v),result[k]);fs.copyFileSync(new URL('./lab-core.js',import.meta.url),path.join(root,'app/src/main/assets/js/lab-core.js'));

const nativePath=path.join(root,'app/src/main/java/com/uart/wc01/MainActivity.java');
let native=fs.readFileSync(nativePath,'utf8');
if(!native.includes('(?:app|diagnostics)'))throw Error('Native asset allowlist anchor missing');
native=native.replace('(?:app|diagnostics)','(?:app|diagnostics|lab-core)');
const bridgeAnchor='webView.addJavascriptInterface(wifiRoute, "WC01Network");';
if(!native.includes(bridgeAnchor))throw Error('Native bridge anchor missing');
native=native.replace(bridgeAnchor,bridgeAnchor+'\n        webView.addJavascriptInterface(new OnlineAssistant(this, webView), "WC01Online");');
fs.writeFileSync(nativePath,native);
fs.copyFileSync(new URL('./OnlineAssistant.java',import.meta.url),path.join(root,'app/src/main/java/com/uart/wc01/OnlineAssistant.java'));

if(edition==='engineering'){
 const engJs=fs.readFileSync(new URL('./engineering.js',import.meta.url),'utf8');
 const engCss=fs.readFileSync(new URL('./engineering.css',import.meta.url),'utf8');
 const combined=fs.readFileSync(path.join(root,map.js),'utf8')+'\n'+engJs;
 new Function(combined);
 fs.writeFileSync(path.join(root,map.js),combined);
 fs.appendFileSync(path.join(root,map.css),'\n'+engCss);
}

const assistantUi=fs.readFileSync(new URL('./assistant-ui.js',import.meta.url),'utf8');
const assistantCss=fs.readFileSync(new URL('./assistant-ui.css',import.meta.url),'utf8');
let app=fs.readFileSync(path.join(root,map.js),'utf8');
const fallback='/wifi|wi-fi|واي|اتصال|شبك|network/.test(t)||!online()';
if(!app.includes(fallback))throw Error('Offline fallback anchor missing');
app=app.replace(fallback,'/wifi|wi-fi|واي|اتصال|شبك|network/.test(t)||(!online()&&!t)');
const afterWifi="if(liveStatus.backlight_on===false";
if(!app.includes(afterWifi))throw Error('Offline guard anchor missing');
app=app.replace(afterWifi,"if(!online()){say('I do not have live machine readings or a local answer for that question. Try a fault code, HOME, power or Wi-Fi, or select the optional online model.','لا توجد قراءة حية أو إجابة محلية لهذا السؤال. جرّب كود عطل أو الهوم أو التغذية أو الاتصال، أو اختر نموذج أونلاين اختياري.');return}"+afterWifi);
app=app.replace("Offline smart assistant','المساعد الذكي المحلي","uArt Assistant','مساعد uArt");
app=app+'\n'+assistantUi;
new Function(app);
fs.writeFileSync(path.join(root,map.js),app);
fs.appendFileSync(path.join(root,map.css),'\n'+assistantCss);

if(edition==='engineering'){
 const factoryJs=fs.readFileSync(new URL('./factory-ui.js',import.meta.url),'utf8');
 const factoryCss=fs.readFileSync(new URL('./factory-ui.css',import.meta.url),'utf8');
 const combined=fs.readFileSync(path.join(root,map.js),'utf8')+'\n'+factoryJs;
 new Function(combined);
 fs.writeFileSync(path.join(root,map.js),combined);
 fs.appendFileSync(path.join(root,map.css),'\n'+factoryCss);
}

/* Extensions must share the original application's lexical scope. */
let finalApp=fs.readFileSync(path.join(root,map.js),'utf8');
const appEnd="if(get('introSeen',false))enterApp();else introTo(1);\n})();";
if(finalApp.split(appEnd).length!==2)throw Error('Application scope anchor missing');
finalApp=finalApp.replace(appEnd,"if(get('introSeen',false))enterApp();else introTo(1);")+'\n})();\n';
new Function(finalApp);
fs.writeFileSync(path.join(root,map.js),finalApp);

/* V1.1.7: keep displayed capabilities and settings aligned with actual firmware. */
let revised=fs.readFileSync(path.join(root,map.js),'utf8');
const change=(a,b)=>{if(!revised.includes(a))throw Error('V1.1.7 anchor missing: '+a.slice(0,80));revised=revised.replace(a,b)};
change("Connect and update controller V7.3.12, wake the screen and stop the machine first. No command queued.","This controller does not advertise the setting API, or is disconnected. Use Settings or install a compatible controller version. No command queued.");
change("اتصل بكنترول V7.3.12 وأيقظ الشاشة وأوقف الماكينة أولًا. مفيش أوامر محفوظة للتنفيذ لاحقًا.","الكنترول غير متصل أو لا يدعم أمر التعديل. استخدم الإعدادات أو إصدار كنترول متوافق. لا توجد أوامر مؤجلة.");
change("const special=window.WC01Lab.diagnose(q,labLast);","const isSetting=/(?:عدل|اضبط|غير|غيّر|set |change |adjust )/i.test(q);const special=isSetting?null:window.WC01Lab.diagnose(q,labLast);");
change("if(cmd==='setting')return data.assistant_settings===true&&Math.abs", "if(cmd==='setting')return data.assistant_settings===true&&data.cap?.settings===true&&Math.abs");
change("if(cmd==='setting'){$('assistantReply').textContent=ack.saved?msg('Controller accepted and saved the requested setting.','الكنترول أكد تطبيق وحفظ القيمة المطلوبة.'):msg('Controller accepted the value; storage was not confirmed.','الكنترول طبق القيمة لكن لم يؤكد الحفظ الدائم.');}","if(cmd==='setting'){$('assistantReply').textContent=ack.saved?msg('Controller confirmed settings storage.','الكنترول أكد حفظ الإعداد.'):msg('Storage was not confirmed.','لم يتأكد الحفظ الدائم.');labMessage($('assistantReply').textContent,'bot');}");
change("if(cmd==='setting')$('assistantReply').textContent=msg('Setting not confirmed: ','لم يتأكد تعديل القيمة: ')+e.message;","if(cmd==='setting'){$('assistantReply').textContent=msg('Setting not confirmed: ','لم يتأكد تعديل القيمة: ')+e.message;labMessage($('assistantReply').textContent,'bot');}");
change("config.pulseEnabled=Number(config.pulse)>0;","config.pulseEnabled=Number(config.pulse)>0;if(typeof s.initial==='number'&&Number.isFinite(s.initial))config.initial=s.initial;");
change("pulseEnable:'Pulse mode'","pulseEnable:'Pulsed welding (off = continuous)'");
change("pulseEnable:'وضع النبضات'","pulseEnable:'لحام نبضي (الإلغاء = مستمر)'");
change("0 Hz means continuous output only if welder output is commissioned.","0 Hz = continuous welding during an authorized cycle. It does not disable welding.");
change("0 هرتز يعني خرج مستمر فقط بعد اعتماد وتفعيل خرج اللحام.","0 هرتز = لحام مستمر أثناء دورة مصرح بها، وليس إيقاف خرج اللحام.");
change("if(!next.pulseEnabled)next.pulse=0;","if(!next.pulseEnabled)next.pulse=0;");
change("stopJog();const args={speed:values.speed","if(values.pulse===0&&!window.confirm(msg('0 Hz means CONTINUOUS welding, not output OFF. Save this mode?','0 هرتز يعني لحام مستمر، وليس فصل خرج اللحام. تأكيد الحفظ؟')))return;\n stopJog();const args={speed:values.speed");
change("try{await api('/api/config','POST',args);Object.assign(config,values);","try{const ack=await api('/api/config','POST',args);if(ack.saved!==true)throw Error('STORAGE_NOT_CONFIRMED');Object.assign(config,values);");
change("if(!cap.settings){notify(msg('Controller does not support settings write.','الكنترول مش بيسمح بتعديل الإعدادات.'));return}","if(!cap.settings){notify(msg('Settings not available now. Stop motion and wake the controller, then check its firmware.','الإعدادات غير متاحة حاليًا؛ أوقف الحركة وأيقظ الشاشة وراجع الإصدار.'));return}");
change("if(special){assistantProposal=null;","if(special){assistantProposal=null;");
new Function(revised);fs.writeFileSync(path.join(root,map.js),revised);
let htmlFinal=fs.readFileSync(path.join(root,map.html),'utf8');
htmlFinal=htmlFinal.replace('0 Hz disables the pulse output. Continuous welding output is not implemented yet.','0 Hz = continuous welding, NOT output OFF.');
fs.writeFileSync(path.join(root,map.html),htmlFinal);

/* V1.1.7: phone panel fault diagnostics, no remote fault motion. */
let panelApp=fs.readFileSync(path.join(root,map.js),'utf8');
const panelPatch=(a,b)=>{if(panelApp.split(a).length!==2)throw Error('Panel anchor missing/ambiguous: '+a.slice(0,90));panelApp=panelApp.replace(a,b)};
panelPatch("function panelAllowed(k){\n if(!online())return false;","function panelAllowed(k){\n if(!online())return false;\n if(liveStatus.state==='fault'||Number(liveStatus.page)===14){if(k==='esc')return true;return k==='enter'&&panelReady()&&liveStatus.phone_home_check_available===true&&panelHas('enter')}\n if(liveStatus.state==='sensor_check')return k==='esc';");
panelPatch(" if(k==='start'&&['running','homing'].includes(liveStatus.state)){actStop();return}"," if((liveStatus.state==='fault'||Number(liveStatus.page)===14||liveStatus.state==='sensor_check')&&k==='esc'){actStop();return}\n if((liveStatus.state==='fault'||Number(liveStatus.page)===14)&&k==='enter'){const link=linkGeneration;confirmAction(msg('Check HOME sensor','فحص حساس HOME'),msg('This opens a stationary sensor test. Isolate drive and weld power. Physical sensor test and local ENTER are required before movement.','يفتح فحص الحساس دون حركة. افصل قدرة الموتور واللحام. يلزم فحص الحساس فعليًا ثم ENTER على الكنترول قبل الحركة.'),()=>{if(link===linkGeneration&&liveStatus.phone_home_check_available===true)panelNav('enter')});return}\n if(k==='start'&&['running','homing'].includes(liveStatus.state)){actStop();return}");
panelPatch("المعايرة والأعطال المحمية من الطبلون فقط.');\n}","المعايرة والأعطال المحمية من الطبلون فقط.');\n if(online()&&(liveStatus.state==='fault'||Number(liveStatus.page)===14)){\n  $('panel-sub-esc').textContent=msg('STOP','إيقاف');$('panel-sub-enter').textContent=msg('Sensor check','فحص الحساس');\n  $('panelHint').textContent='F'+(Number(liveStatus.fault_code)||'—')+' · '+(liveStatus.phone_home_check_available===true?msg('ENTER opens a stationary HOME sensor check. ESC sends STOP.','ENTER يفتح فحص حساس HOME دون حركة. ESC يرسل STOP.'):msg('Fault recovery requires the local panel, or compatible firmware. ESC sends STOP.','الاستعادة تتطلب الطبلون المحلي أو كود كنترول متوافق. ESC يرسل STOP.'));\n }\n if(online()&&liveStatus.state==='sensor_check'){\n  $('panelPageName').textContent=msg('HOME sensor test','فحص حساس HOME');$('panel-sub-esc').textContent=msg('STOP','إيقاف');\n  const step=liveStatus.home_sensor_check;\n  $('panelHint').textContent=step==='activate'?msg('Drive and weld power isolated: activate HOME sensor physically.','بعد فصل قدرة الموتور واللحام: فعّل حساس HOME فعليًا.'):step==='release'?msg('Release HOME sensor physically.','حرّر حساس HOME فعليًا.'):msg('Sensor checked. Local ENTER required to seek HOME. Verify safe path first.','تم فحص الحساس. يلزم ENTER على الكنترول للبحث عن HOME بعد التأكد من سلامة المسار.');\n }\n}");
new Function(panelApp);fs.writeFileSync(path.join(root,map.js),panelApp);

/* V1.1.7: mm/s presentation, existing API, NVS and presets in mm/min. */
let unitApp=fs.readFileSync(path.join(root,map.js),'utf8');
const unitPatch=(a,b)=>{if(unitApp.split(a).length!==2)throw Error('Unit anchor missing/ambiguous: '+a.slice(0,100));unitApp=unitApp.replace(a,b)};
unitPatch("$('metricSpeed').textContent=v('speed',0);","$('metricSpeed').textContent=online()&&Number.isFinite(Number(liveStatus.speed))&&liveStatus.speed!==null?(Number(liveStatus.speed)/60).toFixed(2):'—';");
unitPatch("$(id).value=String(config[key]??'');","$(id).value=['speed','initial','jog','fast'].includes(key)&&Number.isFinite(Number(config[key]))?String(Number((Number(config[key])/60).toFixed(4))):String(config[key]??'');");
unitPatch("speed:[.1,4000],distance:[.1,1000],pulse:[0,5],jog:[.1,4000],fast:[.1,4000]","speed:[.01,20],distance:[.1,1000],pulse:[0,5],jog:[.01,20],fast:[.01,20]");
unitPatch("next[k]=n}","next[k]=['speed','jog','fast'].includes(k)?Math.round(n*60000)/1000:n}");
unitPatch("speed:[.6,4000],jog:[.1,4000],fast:[.1,4000]","speed:[.6,1200],jog:[.1,1200],fast:[.1,1200]");
unitPatch("speed>66.66","speed>20");
unitPatch("Enter 0.01–66.66 mm/s within approved machine limits.","Enter 0.01–20 mm/s within the commissioned machine limits.");
unitPatch("أدخل سرعة من 0.01 إلى 66.66 مم/ث ضمن حدود الماكينة المعتمدة.","أدخل سرعة من 0.01 إلى 20 مم/ث ضمن حدود الماكينة المعتمدة.");
unitPatch("${p.config.speed} mm/min","${(Number(p.config.speed)/60).toFixed(2)} mm/s");
new Function(unitApp);fs.writeFileSync(path.join(root,map.js),unitApp);
let unitHtml=fs.readFileSync(path.join(root,map.html),'utf8');
unitHtml=unitHtml.replaceAll('<small>mm/min</small>','<small>mm/s</small>');
for(const id of ['fSpeed','fJog','fFast','fInitial','liveSpeedInput']){
 const re=new RegExp('<input\\b[^>]*\\bid="'+id+'"[^>]*>');
 if(!re.test(unitHtml))throw Error('Speed input missing: '+id);
 unitHtml=unitHtml.replace(re,tag=>tag.replace(/\bmin="[^"]*"/,'min="0.01"').replace(/\bmax="[^"]*"/,'max="'+(id==='fInitial'?'10':'20')+'"').replace(/\bstep="[^"]*"/,'step="0.01"'));
}
fs.writeFileSync(path.join(root,map.html),unitHtml);

/* V1.1.7: speed ceiling is controller-authoritative, factory-only. */
let limitApp=fs.readFileSync(path.join(root,map.js),'utf8');
const limitPatch=(a,b)=>{if(limitApp.split(a).length!==2)throw Error('Speed ceiling anchor: '+a);limitApp=limitApp.replace(a,b)};
limitPatch('function adjustLiveSpeed(delta){', "function machineSpeedLimit(){const n=Number(liveStatus?.speed_limit_mm_s);return online()&&Number.isFinite(n)&&n>=1?Math.min(66,n):20}\nfunction adjustLiveSpeed(delta){");
limitPatch('Math.min(66.66,Math.max(.01,current+delta))','Math.min(machineSpeedLimit(),Math.max(.01,current+delta))');
limitPatch("if(speed===null||speed<.01||speed>20){notify(msg('Enter 0.01–20 mm/s within the commissioned machine limits.','أدخل سرعة من 0.01 إلى 20 مم/ث ضمن حدود الماكينة المعتمدة.'));return}","if(speed===null||speed<.01||speed>machineSpeedLimit()){notify(msg('Maximum configured speed: ','أقصى سرعة مضبوطة: ')+machineSpeedLimit()+' mm/s');return}");
limitPatch("const constraints={speed:[.01,20],distance:[.1,1000],pulse:[0,5],jog:[.01,20],fast:[.01,20]","const constraints={speed:[.01,machineSpeedLimit()],distance:[.1,1000],pulse:[0,5],jog:[.01,machineSpeedLimit()],fast:[.01,machineSpeedLimit()]");
limitPatch("speed:[.6,1200],jog:[.1,1200],fast:[.1,1200]","speed:[.6,machineSpeedLimit()*60],jog:[.1,machineSpeedLimit()*60],fast:[.1,machineSpeedLimit()*60]");
limitPatch("function fillForm(){draftType=", "function fillForm(){for(const id of ['fSpeed','fJog','fFast','liveSpeedInput'])$(id).max=String(machineSpeedLimit());draftType=");
new Function(limitApp);fs.writeFileSync(path.join(root,map.js),limitApp);
let limitHtml=fs.readFileSync(path.join(root,map.html),'utf8');
for(const id of ['fSpeed','fJog','fFast','liveSpeedInput']){
 const re=new RegExp('<input\\b[^>]*\\bid="'+id+'"[^>]*>');
 if(!re.test(limitHtml))throw Error('Missing input '+id);
 limitHtml=limitHtml.replace(re,tag=>tag.replace(/\bmax="[^"]*"/,'max="66"'));
}
fs.writeFileSync(path.join(root,map.html),limitHtml);

/* V1.1.7: authoritative operating minimum and maximum in mm/s. */
let floorApp=fs.readFileSync(path.join(root,map.js),'utf8');
const floorPatch=(a,b)=>{if(floorApp.split(a).length!==2)throw Error('Minimum speed anchor: '+a.slice(0,120));floorApp=floorApp.replace(a,b)};
floorPatch("function machineSpeedLimit(){const n=Number(liveStatus?.speed_limit_mm_s);return online()&&Number.isFinite(n)&&n>=1?Math.min(66,n):20}", "function machineSpeedLimit(){const n=numericField(liveStatus?.speed_limit_mm_s);return online()&&n!==null&&n>=1?Math.min(66,Math.floor((n+0.000001)*100)/100):20}\nfunction machineSpeedMinimum(){const n=numericField(liveStatus?.speed_min_mm_s);return online()&&n!==null&&n>=0.01&&n<=machineSpeedLimit()?n:0.01}");
floorPatch("Math.max(.01,current+delta)","Math.max(machineSpeedMinimum(),current+delta)");
floorPatch("speed===null||speed<.01||speed>machineSpeedLimit()","speed===null||speed<machineSpeedMinimum()||speed>machineSpeedLimit()");
floorPatch("msg('Maximum configured speed: ','أقصى سرعة مضبوطة: ')+machineSpeedLimit()+' mm/s'","msg('Allowed speed: ','السرعة المسموحة: ')+machineSpeedMinimum()+' – '+machineSpeedLimit()+' mm/s'");
floorPatch("speed:[.01,machineSpeedLimit()],distance:[.1,1000],pulse:[0,5],jog:[.01,machineSpeedLimit()],fast:[.01,machineSpeedLimit()]","speed:[machineSpeedMinimum(),machineSpeedLimit()],distance:[.1,1000],pulse:[0,5],jog:[machineSpeedMinimum(),machineSpeedLimit()],fast:[machineSpeedMinimum(),machineSpeedLimit()]");
floorPatch("speed:[.6,machineSpeedLimit()*60],jog:[.1,machineSpeedLimit()*60],fast:[.1,machineSpeedLimit()*60]","speed:[machineSpeedMinimum()*60,machineSpeedLimit()*60],jog:[machineSpeedMinimum()*60,machineSpeedLimit()*60],fast:[machineSpeedMinimum()*60,machineSpeedLimit()*60]");
floorPatch("for(const id of ['fSpeed','fJog','fFast','liveSpeedInput'])$(id).max=String(machineSpeedLimit());","for(const id of ['fSpeed','fJog','fFast','liveSpeedInput']){$(id).min=String(machineSpeedMinimum());$(id).max=String(machineSpeedLimit())}");
floorPatch("const speedAllowed=online()&&!commandBusy&&!stopPending&&canLiveSpeed(liveStatus);","$('liveSpeedInput').min=String(machineSpeedMinimum());$('liveSpeedInput').max=String(machineSpeedLimit());const speedAllowed=online()&&!commandBusy&&!stopPending&&canLiveSpeed(liveStatus);");
floorPatch("else if(/mm\\s*\\/\\s*min|مم\\s*\\/\\s*د|مم\\s*في\\s*الدقيق/.test(t))display+=' mm/min';","else if(/mm\\s*\\/\\s*min|مم\\s*\\/\\s*د|مم\\s*في\\s*الدقيق/.test(t))display=(value/60).toFixed(2)+' mm/s';");
new Function(floorApp);fs.writeFileSync(path.join(root,map.js),floorApp);
