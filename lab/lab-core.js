(function(root){
 const norm=s=>String(s||'').toLowerCase().replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[أإآ]/g,'ا').replace(/ة/g,'ه');
 function diagnose(q,last=''){
  q=norm(q);
  if(/^(ليه|ازاي|كيف|why|how)[؟?\s]*$/.test(q)&&last)return diagnose(last);
  if(/(?:الغي|عطل|تجاوز|bypass|disable).*(?:حساس|طوارئ|safety|limit|sensor|estop)/.test(q))return ['لا يمكن تعطيل الحماية من المساعد. افصل القدرة وافحص السبب محليًا.','No safety overrides. Isolate power and inspect locally.'];
  if(/ريستارت|restart|brownout|كونفرتر|converter|يفصل|تغذيه|power supply/.test(q))return ['الأرجح مشكلة تغذية أو تشويش، لكن يلزم قياس. \n١. افصل قدرة اللحام والموتور.\n٢. جرّب ESP32 وحده على 5.0–5.1V من VIN وGND.\n٣. قِس VIN و3V3 أثناء الإقلاع وراجع سجل Reset.\n٤. لو العطل مع الريلاي راجع العزل والتغذية والدايود.','Isolate hazardous power; test ESP32 alone at 5.0–5.1 V VIN. Measure VIN and 3V3 at boot and inspect reset logs and relay suppression.'];
  if(/ارفع كود|رفع كود|نزل كود|firmware|ota|flash/.test(q))return ['تحديث الكنترول الحالي محليًا عبر USB بعد فصل قدرة اللحام والحركة. OTA غير معتمد في V7.3.12.','Current firmware maintenance is local USB only, with hazardous energy isolated. OTA is not validated.'];
  if(/شبكه المكان|شبكه المصنع|lan|router|راوتر|عده ماكينات/.test(q))return ['الكنترول الحالي يفتح شبكة uArt-WC01. الربط براوتر المكان يحتاج تحديثًا ومصادقة مستقلة؛ سجل النسخة الهندسية للتوثيق فقط.','Current controller uses its own access point. LAN and authenticated multi-machine control require firmware changes; asset registry is documentation only.'];
  if(/^(اهلا|السلام عليكم|مرحبا|hello|hi|ازيك)[!؟?\s]*$/.test(q))return ['أهلاً! اسألني عن كود عطل أو التغذية أو HOME أو الواي فاي أو تعديل إعداد.','Hello! Ask about a fault, power, HOME, Wi-Fi or a setting.'];
  return null;
 }
 root.WC01Lab={diagnose};
})(globalThis);