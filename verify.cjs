const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const elements={};
function el(id){return elements[id]??=( {_value:'',get value(){return this._value;},set value(v){this._value=String(v);},style:{},textContent:'',innerHTML:'',append(d){for(const m of d.innerHTML.matchAll(/(?:input|select) id="([^"]+)"/g))el(m[1]);},addEventListener(){},setAttribute(){},reset(){for(const e of Object.values(elements))e.value='';el('preference').value='any';}} );}
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

// Teaching content: every number written in a case must match the live engine.
const CASES=run('CASES'),QUIZ=run('QUIZ');
assert.equal(CASES.length,6);assert.equal(QUIZ.length,20);
assert.deepEqual(['基礎','進階','高階'].map(l=>QUIZ.filter(q=>q.level===l).length),[7,7,6]);
for(const [i,c] of CASES.entries()){
  run(`loadCase(${i})`);const x=c.expect,best=run('(()=>summaryText)()'),rec=el('recommendation').innerHTML,text=[...c.result,...c.points].join(' ');
  assert.match(el('eligibility').innerHTML,new RegExp(x.status),'case '+(i+1));
  assert.ok(rec.includes(`${x.n} 次／週 × ${x.t.toFixed(1)} 小時`),`case ${i+1} prescription: ${best}`);
  assert.ok(el('comparison').innerHTML.includes(x.best),'case '+(i+1));
  assert.ok(rec.includes(`<strong>${x.std}</strong>`),`case ${i+1} StdKt/V`);assert.ok(rec.includes(`<strong>${x.ufr}</strong>`),`case ${i+1} UFR`);
  assert.ok(el('comparison').innerHTML.includes('spKt/V '+x.sp),`case ${i+1} spKt/V`);
  for(const k of ['std','ufr'])assert.ok(text.includes(x[k]),`case ${i+1} text lacks ${k}`);
  if(x.dose)assert.ok(el('doseResult').textContent.includes(x.dose)&&text.includes(x.dose),`case ${i+1} dose`);
  assert.doesNotMatch(el('caseDetail').innerHTML+rec,/NaN|Infinity|undefined/);
}
const pk=(uf,n,w,t)=>uf*run(`gap(${n})`)/168*1000/(w*t),close=(a,b,d=.05)=>assert.ok(Math.abs(a-b)<d,`${a} vs ${b}`);
close(pk(7.5,3,70,4),11.5);close(pk(16,3,78,4),22.0);close(pk(16,5,78,2.5),23.4);close(pk(16,3,78,6),14.7);close(pk(16,6,78,4),14.7);close(pk(6,5,55,2.5),12.5);close(pk(7,3,52,4),14.4);
close(pk(10.5,3,65,4),17.3);close(10.5/3*1000/(65*4),13.5);
close(240*240/(run("watson('male',52,172,70)")*1000),1.46,.005);close(run("watson('male',46,185,118)"),57.6);close(300*240/57600,1.25,.005);close(400/80*900/1440,3.125,.001);
close(run('kinetics(230,4,3,40,0,0,30.7).total'),2.18,.005);close(run('kinetics(230,2.5,5,40,0,0,30.7).total'),2.61,.005);close(run('kinetics(230,2.5,5,40,0,0,30.7).sp'),.86,.005);close(run('kinetics(230,4,3,40,0,0,30.7).sp'),1.38,.005);close(run('kinetics(200,4,3,40,0,2).renal'),.504,.001);close(run('modeledClearance(400,150,800)'),147,.5);
// Quiz flow: correct option is o[0] whatever the shuffle; answers lock; retry clears only wrong ones.
for(const q of QUIZ){assert.equal(new Set(q.o).size,4);assert.ok(q.why&&q.ref&&run('SRC')[q.src]);if(q.case!==undefined)assert.ok(CASES[q.case]);}
run('quizStart()');run('quizAnswer(0,0)');run('quizAnswer(0,1)');run('quizAnswer(1,2)');
assert.deepEqual({...run('quizScore()')},{total:20,done:2,right:1});assert.match(el('quizList').innerHTML,/答對了/);assert.match(el('quizList').innerHTML,/答錯了/);
run('quizRetryWrong()');assert.deepEqual({...run('quizScore()')},{total:20,done:1,right:1});
for(let i=0;i<20;i++)run(`quizAnswer(${i},0)`);assert.match(el('quizScore').innerHTML,/完成：20／20/);run('quizStart()');assert.equal(run('quizScore()').done,0);
el('reset').onclick();assert.equal(el('caseBanner').hidden,true);
console.log('PASS: six teaching cases match the engine, written arithmetic, quiz scoring, locking and retry.');
