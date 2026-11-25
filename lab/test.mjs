import assert from 'node:assert/strict';
import './lab-core.js';
const d=globalThis.WC01Lab.diagnose;
for(const [q,expected,last] of [["ESP32 restart","VIN"],["ارفع كود","USB"],["شبكة المكان","براوتر"],["عطل حساس","الحماية"],["السلام عليكم","أهلاً"],["ليه","VIN","ESP32 restart"]])assert.ok(d(q,last)[0].includes(expected),q);
assert.equal(d('عدل سرعة اللحام 0.5 مم/ث'),null);
console.log('7 diagnostic checks passed');

assert.ok(d('HOME')[0].includes('GPIO34'));
assert.ok(d('نهاية المشوار')[0].includes('GPIO12'));

await import('./engineering.js');
const calc=globalThis.WC01EngineeringMath.calculate;
assert.equal(calc(100,120,10,200,8,3).seconds,50);
assert.equal(calc(100,120,10,200,8,3).stepHz,320);
assert.equal(calc(100,0,10,200,8,3),null);
assert.equal(calc(100,120,10,200,8,0).pitch,null);
console.log('Engineering calculation tests passed');

await import('./factory-ui.js');
const p=globalThis.WC01FactoryV11.getDefault();const check=globalThis.WC01FactoryV11.validate;
assert.equal(check(p),true);assert.equal(check({...p,home:12,end:34}),true);assert.equal(check({...p,home:12,end:12}),false);assert.equal(check({...p,home:23}),false);assert.equal(check({...p,ppr:0}),false);assert.equal(check({...p,initial:601}),false);console.log('V1.1 factory profile validation tests passed');

assert.equal(check({...p,maxSpeed:3960}),true);assert.equal(check({...p,maxSpeed:60,initial:18}),true);assert.equal(check({...p,maxSpeed:3961}),false);assert.equal(check({...p,maxSpeed:59}),false);assert.equal(check({...p,maxSpeed:60,initial:61}),false);

assert.equal(check({...p,minSpeedCenti:6600,maxSpeed:3960}),true);assert.equal(check({...p,minSpeedCenti:101,maxSpeed:60,initial:18}),false);assert.equal(check({...p,minSpeedCenti:0}),false);assert.equal(check({...p,minSpeedCenti:6601}),false);assert.equal(check({...p,minSpeedCenti:200,ppr:25600,lead:.1}),false);assert.equal(globalThis.WC01FactoryV11.displayValue('minSpeedCenti',125),1.25);assert.equal(globalThis.WC01FactoryV11.readValue('minSpeedCenti','1.25'),125);assert.equal(globalThis.WC01FactoryV11.displayValue('weldSpeed','120'),2);assert.equal(globalThis.WC01FactoryV11.readValue('weldSpeed','2'),120);
