import assert from 'node:assert/strict';
import './lab-core.js';
const d=globalThis.WC01Lab.diagnose;
for(const [q,expected,last] of [["ESP32 restart","VIN"],["ارفع كود","USB"],["شبكة المكان","براوتر"],["عطل حساس","الحماية"],["السلام عليكم","أهلاً"],["ليه","VIN","ESP32 restart"]])assert.ok(d(q,last)[0].includes(expected),q);
assert.equal(d('عدل سرعة اللحام 0.5 مم/ث'),null);
console.log('7 diagnostic checks passed');

assert.ok(d('HOME')[0].includes('GPIO34'));
assert.ok(d('نهاية المشوار')[0].includes('GPIO12'));
