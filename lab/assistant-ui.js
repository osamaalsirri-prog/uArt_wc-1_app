
(function(){
'use strict';
const el=id=>document.getElementById(id);
let mode='local';
const tr=(en,ar)=>msg(en,ar);
function make(tag,cls){const node=document.createElement(tag);if(cls)node.className=cls;return node}
function button(id,cls){const b=make('button',cls);b.id=id;b.type='button';return b}
function mount(){
 const overlay=el('assistantOverlay'), sheet=overlay?.querySelector('.assistant-sheet');
 if(!sheet||el('uaHead'))return;
 const top=sheet.querySelector('.sheet-top'), intro=el('assistantIntro'), live=el('assistantLive'), chat=el('labChat'), prompts=sheet.querySelector('.lab-prompts'), field=el('assistantInput').closest('label'), oldButtons=el('assistantAsk').parentElement, apply=el('assistantApply'), safety=el('assistantSafety'), reply=el('assistantReply');
 const details=el('labApiKey').closest('details'), registry=el('labRegistry')?.closest('details');
 const head=make('header','ua-head');head.id='uaHead';
 const logo=make('div','ua-mark');logo.textContent='u';logo.setAttribute('aria-hidden','true');
 const name=make('div','ua-brand');const small=make('span','ua-kicker');small.id='uaEdition';small.textContent=sheet.querySelector('.eyebrow')?.textContent||'uArt';name.append(small,el('assistantTitle'));
 const controls=make('div','ua-controls'), settings=button('uaSettings','ua-icon'), clear=button('uaClear','ua-icon');settings.textContent='⚙';clear.textContent='＋';
 const close=el('assistantClose');close.className='ua-icon';controls.append(clear,settings,close);head.append(logo,name,controls);
 const toolbar=make('div','ua-toolbar'), selector=make('div','ua-mode');selector.setAttribute('role','group');
 const local=button('uaLocal','ua-mode-button'), onlineMode=button('uaCloud','ua-mode-button');selector.append(local,onlineMode);
 const status=make('div','ua-status');status.id='uaModeStatus';toolbar.append(selector,status);
 const panel=make('section','ua-panel');panel.id='uaPanel';panel.hidden=true;
 const panelTitle=make('div','ua-panel-title');panelTitle.id='uaPanelTitle';panel.append(panelTitle,details);details.open=true;details.querySelector('summary').hidden=true;
 if(registry)panel.append(registry);
 const finish=button('uaDone','ua-done');panel.append(finish);
 const body=make('div','ua-conversation');body.append(chat);
 const foot=make('footer','ua-composer'), sendrow=make('div','ua-sendrow');const input=el('assistantInput');input.rows=1;
 field.className='ua-field';field.querySelector('span').className='ua-visually-hidden';
 const send=el('assistantAsk');send.className='ua-send';const check=el('assistantCheck');check.className='ua-diagnose';
 sendrow.append(field,send);const actions=make('div','ua-actions');actions.append(check,prompts);foot.append(actions,sendrow,apply,safety);
 const legacy=make('div','ua-visually-hidden');legacy.append(reply,intro,el('labOnline')); 
 sheet.replaceChildren(head,toolbar,live,panel,body,foot,legacy);
 overlay.classList.add('ua-overlay');sheet.classList.add('ua-sheet');
 const localAsk=send.onclick;
 send.onclick=()=>{if(labBusy)return;const q=input.value.trim();if(!q)return;
   if(mode==='online'){if(!el('labApiKey').value.trim()||!el('labModel').value.trim()){panel.hidden=false;el('labApiKey').focus();return}el('labOnline').click()}
   else if(typeof localAsk==='function')localAsk();
 };
 const diagnose=check.onclick;check.onclick=()=>{if(!labBusy&&typeof diagnose==='function')diagnose()};
 settings.onclick=()=>{panel.hidden=!panel.hidden;settings.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)panel.scrollTop=0};
 finish.onclick=()=>{panel.hidden=true;settings.setAttribute('aria-expanded','false')};
 clear.onclick=()=>{if(labBusy)return;if(!window.confirm(tr('Start a new conversation? Current messages will be cleared.','بدء محادثة جديدة؟ سيتم مسح الرسائل الحالية.')))return;
   chat.replaceChildren();labLast='';assistantProposal=null;apply.classList.add('hidden');put('labChatV7',[]);welcome()};
 local.onclick=()=>{mode='local';refresh()};
 onlineMode.onclick=()=>{mode='online';refresh();if(!el('labApiKey').value.trim()){panel.hidden=false;settings.setAttribute('aria-expanded','true')}};
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send.click()}});
 input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(110,input.scrollHeight)+'px'});
 const oldAnswer=window.__wc01OnlineAnswer;window.__wc01OnlineAnswer=(ok,answer)=>{if(typeof oldAnswer==='function')oldAnswer(ok,answer);refresh();chat.scrollTop=chat.scrollHeight};
 function welcome(){labMessage(tr('Hello. I can help with controller faults, HOME, wiring checks and welding settings. Choose local diagnostics or connect an optional online model.','أهلاً بك في مساعد uArt. أقدر أساعدك في أعطال الكنترول والهُوم وفحص التوصيلات وإعدادات اللحام. اختر التشخيص المحلي أو نموذج أونلاين اختياري.'),'bot')}
 function refresh(){
  if(overlay.classList.contains('hidden'))return;
  const arabic=tr('en','ar')==='ar';sheet.dir=arabic?'rtl':'ltr';
  el('assistantTitle').textContent=tr('uArt Assistant','مساعد uArt');
  local.textContent=tr('Local','محلي');onlineMode.textContent=tr('Online','أونلاين');
  for(const b of [local,onlineMode]){const chosen=b===local?mode==='local':mode==='online';b.classList.toggle('active',chosen);b.setAttribute('aria-pressed',String(chosen))}
  const state=mode==='local'?tr('Built-in diagnostics','تشخيص محلي مدمج'):labBusy?tr('Generating response…','جاري إعداد الرد…'):tr('External model · API key required','نموذج خارجي · يتطلب مفتاح API');
  if(status.textContent!==state)status.textContent=state;
  el('uaPanelTitle').textContent=tr('Assistant settings','إعدادات المساعد');
  settings.setAttribute('aria-label',tr('Assistant settings','إعدادات المساعد'));clear.setAttribute('aria-label',tr('New conversation','محادثة جديدة'));close.setAttribute('aria-label',tr('Close','إغلاق'));
  finish.textContent=tr('Done','تم');send.textContent=tr('Send','إرسال');send.disabled=labBusy;check.textContent=tr('Machine status','حالة الماكينة');
  input.placeholder=tr('Message uArt…','اكتب رسالتك…');input.setAttribute('aria-label',input.placeholder);
  const labels=details.querySelectorAll('label');if(labels[0]?.firstChild?.nodeType===3)labels[0].firstChild.nodeValue=tr('API key (session only)','مفتاح API (للجلسة فقط)');if(labels[1]?.firstChild?.nodeType===3)labels[1].firstChild.nodeValue=tr('Model','النموذج');
  const p=details.querySelector('p');p.textContent=tr('Optional service. Only your question is sent to the API. Charges may apply.','خدمة اختيارية. يتم إرسال سؤالك فقط إلى خدمة API. قد تُحسب تكلفة.');
  safety.textContent=tr('Verify advice before use. No automatic machine actions.','تحقق من الإرشادات قبل التنفيذ. لا تشغيل تلقائي للماكينة.');
  const titles={'F8':['Fault F8','عطل F8'],'ESP32 restart':['Power','التغذية'],'HOME':['HOME','الهوم'],'Wi-Fi':['Wi-Fi','الاتصال']};prompts.querySelectorAll('[data-question]').forEach(b=>{const t=titles[b.dataset.question];if(t)b.textContent=tr(...t)});
  if(!chat.children.length)welcome();
 }
 const observe=new MutationObserver(()=>{if(!overlay.classList.contains('hidden')){refresh();chat.scrollTop=chat.scrollHeight}else{panel.hidden=true;settings.setAttribute('aria-expanded','false')}});
 observe.observe(overlay,{attributes:true,attributeFilter:['class']});
 const msgObserve=new MutationObserver(()=>{for(const node of chat.children){node.dir='auto'}chat.scrollTop=chat.scrollHeight});msgObserve.observe(chat,{childList:true});
 setInterval(refresh,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
