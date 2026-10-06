const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const elements={};
function el(id){return elements[id]??=( {_value:'',get value(){return this._value;},set value(v){this._value=String(v);},style:{},textContent:'',innerHTML:'',append(d){for(const m of d.innerHTML.matchAll(/(?:input|select) id="([^"]+)"/g))el(m[1]);},addEventListener(){},reset(){for(const e of Object.values(elements))e.value='';el('preference').value='any';}} );}
const context={document:{getElementById:el,createElement:()=>({innerHTML:''})},console,Math,Number,Array,Object,String,setTimeout(){},navigator:{},window:{}};
vm.createContext(context);const html=fs.readFileSync(__dirname+'/index.html','utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run=s=>vm.runInContext(s,context),set=(id,v)=>el(id).value=String(v);
assert.match(el('eligibility').innerHTML,/資料不足/);assert.match(el('recommendation').innerHTML,/需補齊/);
const known=run('kinetics(200,4,3,40,0,0)'); const e=1.2*240/270.7; const expected=(10080*(1-Math.exp(-e))/240)/((1-Math.exp(-e))/e+10080/720-1);assert.ok(Math.abs(known.total-expected)<1e-12);
assert.ok(Math.abs(run("watson('male',55,170,65)")-37.3242)<.0001);
assert.ok(Math.abs(run('kinetics(200,4,3,40,0,2).renal')-.504)<1e-12);
assert.ok(run('kinetics(200,4,3,40,10,0).total')>known.total);
assert.equal(run('kinetics(200,4,3,40,200,0)'),null);
el('demo').onclick();assert.match(el('eligibility').innerHTML,/可進入訓練/);assert.match(el('comparison').innerHTML,/短每日/);assert.match(el('comparison').innerHTML,/夜間長時/);assert.doesNotMatch(el('comparison').innerHTML,/NaN|Infinity/);
assert.ok(run('summaryText').includes('此為規劃估算'));
set('nightSafety','no');run('render()');assert.match(el('comparison').innerHTML,/夜間安全計畫未完成/);assert.ok(!run('summaryText').includes('優先討論：夜間長時'));
set('potassium',6.2);run('render()');assert.match(el('eligibility').innerHTML,/目前不宜/);assert.match(el('recommendation').innerHTML,/暫停居家啟動/);
el('demo').onclick();set('space','no');run('render()');assert.match(el('eligibility').innerHTML,/改善後再評估/);
el('demo').onclick();set('support','solo');run('render()');assert.match(el('eligibility').innerHTML,/可進入訓練/);
set('rkf','');run('render()');assert.match(el('recommendation').innerHTML,/殘腎未知，未計入/);
set('rkf','measured');set('kru','');run('render()');assert.match(el('recommendation').innerHTML,/量測 Kru/);
set('weight',-2);run('render()');assert.match(el('recommendation').innerHTML,/乾體重超出有效範圍/);
el('demo').onclick();set('maxDays',3.5);run('render()');assert.match(el('recommendation').innerHTML,/必須是整數/);
el('demo').onclick();set('stage','treated');for(const m of ['standard','short','long','night'])set('k_'+m,'');run('render()');assert.match(el('recommendation').innerHTML,/尚無可比較處方/);
el('demo').onclick();set('urineVolume',600);set('urineHours',24);set('urineBUN',400);set('meanBUN',50);el('calcKru').onclick();assert.equal(el('kru').value,'3.333');
el('demo').onclick();set('willing','no');run('render()');assert.match(el('eligibility').innerHTML,/目前不選擇居家透析/);
el('demo').onclick();set('weeklyUF',35);run('render()');assert.match(el('improvements').innerHTML,/尖峰 UFR 偏高/);
console.log('PASS: numerical reference, renal/UF correction, missing data, four-mode comparison, safety gates, solo support, input validation, timed urine and high-UF improvement.');

// A new patient must be able to plan without any measured K or previous Kt/V.
el('demo').onclick();for(const m of ['standard','short','long','night'])set('k_'+m,'');run('render()');assert.match(el('recommendation').innerHTML,/初始處方候選/);assert.match(el('recommendation').innerHTML,/模型估算 K/);assert.match(el('recommendation').innerHTML,/不能宣稱實際達標/);assert.match(el('comparison').innerHTML,/假設情境/);
assert.equal(el('measuredBox').style.display,'none');assert.equal(el('planningBox').style.display,'block');
const equal=run('modeledClearance(300,300,900)');assert.ok(Math.abs(equal-225)<1e-10);
for(const qb of [100,200,350,500])for(const qd of [100,200,500,800]){const k=run(`modeledClearance(${qb},${qd},800)`);assert.ok(k>0&&k<Math.min(qb,qd));}
const prior=run('planningK(modes[0])');set('qd_standard',200);assert.ok(run('planningK(modes[0])')<prior);
set('equipment','koa');set('koa','');run('render()');assert.match(el('recommendation').innerHTML,/廠商尿素 KoA/);set('koa',1000);run('render()');assert.match(el('recommendation').innerHTML,/廠商 KoA 模型/);
set('discount',110);run('render()');assert.match(el('recommendation').innerHTML,/50–100/);
el('demo').onclick();set('stage','treated');run('render()');assert.equal(el('planningBox').style.display,'none');assert.equal(el('measuredBox').style.display,'block');assert.match(el('recommendation').innerHTML,/輸入平均 K/);
el('reset').onclick();assert.equal(el('stage').value,'pre');assert.match(el('eligibility').innerHTML,/資料不足/);
console.log('PASS: pre-dialysis planning without measured clearance, theoretical model limits, equipment specification validation, post-treatment mode and reset.');

// Access/sampling regression: published FHN example and explicit eKt/V preservation.
const av=run('kinetics(175,4,4,30,0,0,30.7)'),cat=run('kinetics(175,4,4,30,0,0,18.5)');
assert.ok(Math.abs(av.sp-1.4)<1e-12);assert.ok(Math.abs(av.e-1.4*240/270.7)<1e-12);assert.ok(Math.abs(cat.e-1.4*240/258.5)<1e-12);assert.ok(cat.total>av.total);
el('demo').onclick();assert.equal(run('reboundModel().Tp'),30.7);set('access','avg');assert.equal(run('reboundModel().Tp'),30.7);set('access','catheter');run('render()');assert.equal(run('reboundModel().Tp'),18.5);assert.match(el('recommendation').innerHTML,/Tp=18.5/);
set('access','planned');set('plannedAccess','');run('render()');assert.match(el('eligibility').innerHTML,/改善後再評估/);assert.match(el('recommendation').innerHTML,/AV 情境 StdKt\/V.*導管情境/);assert.match(el('comparison').innerHTML,/導管情境/);assert.doesNotMatch(el('recommendation').innerHTML,/NaN|Infinity/);
set('plannedAccess','catheter');run('render()');assert.equal(run('reboundModel().Tp'),18.5);assert.match(el('eligibility').innerHTML,/通路尚未建立/);
set('stage','treated');set('doseType','e');set('doseValue',1.3);run('render()');assert.match(el('doseResult').textContent,/eKt\/V=1.300.*不再/);
set('doseType','sp');set('doseValue',1.4);set('doseMinutes',240);run('render()');assert.match(el('doseResult').textContent,/尚未核對：不轉換/);
set('sampleMatch','yes');run('render()');assert.match(el('doseResult').textContent,/實際通路/);set('access','avf');run('render()');assert.match(el('doseResult').textContent,/eKt\/V≈1.241/);set('access','catheter');run('render()');assert.match(el('doseResult').textContent,/eKt\/V≈1.300/);
set('doseMinutes','');run('render()');assert.match(el('doseResult').textContent,/實際透析分鐘/);set('doseValue',-1);run('render()');assert.match(el('doseResult').textContent,/有效单次|有效單次/);
el('reset').onclick();assert.equal(el('stage').value,'pre');assert.match(el('eligibility').innerHTML,/資料不足/);
console.log('PASS: AV/catheter numerical references, unknown-access comparison, planned-access safety, sampling gate, actual-time validation and no repeated eKt/V correction.');
