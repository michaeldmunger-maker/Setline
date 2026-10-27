import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,startSession,finishSession,validateSet,blankSet,lastExercise,bestPerformance,addSchedule,dateKey,restore,foodTotals,validateFood,addDays,completedSets} from '../src/lib/model.ts';
const complete=(state,load='10',value='13',unit='lb')=>{const s=startSession(state,'upper');const set=s.active.exercises[0].sets[0];Object.assign(set,{load,value,unit,done:true});return finishSession(s,s.active.startedAt+60000)};
test('notebook values seed routines but never fake history',()=>{const s=initialState();assert.equal(s.history.length,0);assert.equal(s.routines.length,2);assert.equal(s.exercises.find(e=>e.id==='smith').reference[0].load,'Plate + 25');assert.deepEqual(s.exercises.find(e=>e.id==='pec').reference.map(x=>x.load),['140','150','150']);assert.equal(s.exercises.find(e=>e.id==='hang').mode,'timed');assert.equal(s.exercises.find(e=>e.id==='curl').reference[0].value,'');assert.equal(bestPerformance(s,'pullups'),null)});
test('starting prefills reference without checking off sets',()=>{const s=startSession(initialState(),'upper');assert.equal(s.active.exercises[0].previousSource,'Your notes');assert.equal(s.active.exercises[0].sets[0].value,'12');assert.equal(completedSets(s.active),0);assert.throws(()=>startSession(s,'sunday'));assert.throws(()=>startSession(initialState(),'missing'))});
test('invalid sets and zero-work finishes are blocked',()=>{assert.throws(()=>finishSession(startSession(initialState(),'upper')));for(const [mode,patch]of [['weight',{load:''}],['weight',{load:'x'}],['added',{load:'-1'}],['timed',{value:'0'}],['bodyweight',{value:'1.5'}],['label',{load:''}]])assert.throws(()=>validateSet({...blankSet(),load:'10',value:'12',...patch},mode));assert.doesNotThrow(()=>validateSet({...blankSet(),load:'0',value:'12'},'added'))});
test('only completed sets are saved and next time uses real history',()=>{const s=complete(initialState());assert.equal(s.active,null);assert.equal(s.history[0].exercises.length,1);assert.equal(s.history[0].exercises[0].sets.length,1);assert.equal(lastExercise(s,'pullups').log.sets[0].value,'13');const next=startSession(s,'upper');assert.equal(next.active.exercises[0].sets[0].value,'13');assert.notEqual(next.active.exercises[0].sets[0].id,s.history[0].exercises[0].sets[0].id);assert.equal(next.active.exercises[0].sets[0].done,false)});
test('records do not mix kg and lb, and added load stays added',()=>{let s=complete(initialState(),'20','10','lb');s=complete(s,'10','15','kg');assert.deepEqual(bestPerformance(s,'pullups','lb'),{value:20,label:'Most added weight',unit:'lb'});assert.equal(bestPerformance(s,'pullups','kg').value,10)});
test('history snapshots survive routine/exercise edits',()=>{const s=complete(initialState());s.exercises[0].name='Changed';s.routines[0].name='Changed routine';assert.equal(s.history[0].exercises[0].exercise.name,'Weighted pull-ups');assert.equal(s.history[0].name,'Chest & back')});
test('schedule repeats weekly, skips duplicates and links completed session',()=>{let s=addSchedule(initialState(),'upper','2026-10-18','17:00',3);assert.deepEqual(s.schedule.map(x=>x.date),['2026-10-18','2026-10-25','2026-11-01']);assert.equal(addSchedule(s,'upper','2026-10-18','17:00',3).schedule.length,3);const id=s.schedule[0].id;s=startSession(s,'upper',id);s.active.exercises[0].sets[0].done=true;s=finishSession(s);assert.equal(s.schedule[0].completedSession,s.history[0].id);assert.throws(()=>addSchedule(s,'upper','2026-02-30','17:00'));assert.throws(()=>addSchedule(s,'upper','2026-10-18','25:00'));assert.throws(()=>addSchedule(s,'upper','2026-10-18','',13))});
test('food totals are date-specific and invalid entries fail',()=>{const s=initialState();const f={id:'1',name:'Lunch',meal:'Lunch',date:dateKey(),calories:500,protein:40,carbs:50,fat:16,estimatedCalories:false};validateFood(f);s.foods=[f,{...f,id:'2',date:addDays(dateKey(),-1)}];assert.equal(foodTotals(s,dateKey()).calories,500);assert.throws(()=>validateFood({...f,protein:-1}));assert.throws(()=>validateFood({...f,calories:NaN}))});
test('backup roundtrip includes active session and corruption fails',()=>{const s=startSession(initialState(),'upper');assert.deepEqual(restore(JSON.stringify(s)),JSON.parse(JSON.stringify(s)));assert.throws(()=>restore('{}'));assert.throws(()=>restore(JSON.stringify({...s,prefs:{...s.prefs,unit:'stone'}})));assert.throws(()=>restore(JSON.stringify({...s,routines:[{...s.routines[0],items:[{exerciseId:'missing',sets:3}]}]})))});

test('tap-built exercise targets survive backup and start without changing notes or history',async()=>{
 const {createQuickRoutine}=await import('../src/lib/model.ts');
 const original=initialState();
 const targets=['12','11','10'].map(value=>({...blankSet('kg'),load:'15',value}));
 const saved=createQuickRoutine(original,'My pull day',[{exerciseId:'pullups',targets}]);
 assert.equal(saved.exercises,original.exercises);
 assert.equal(saved.history,original.history);
 assert.equal(saved.routines[0].items[0].sets,3);
 const started=startSession(restore(JSON.stringify(saved)),saved.routines[0].id);
 assert.equal(started.active.exercises[0].previousSource,'Your plan');
 assert.deepEqual(started.active.exercises[0].sets.map(s=>[s.load,s.value,s.unit,s.done]),[['15','12','kg',false],['15','11','kg',false],['15','10','kg',false]]);
 started.active.exercises[0].sets[0].value='14';started.active.exercises[0].sets[0].done=true;
 const next=startSession(finishSession(started),saved.routines[0].id);
 assert.equal(next.active.exercises[0].sets[0].value,'14');
 assert.notEqual(next.active.exercises[0].previousSource,'Your plan');
});
test('tap-built plans allow weight later and validate mode-specific numbers',async()=>{
 const {createQuickRoutine}=await import('../src/lib/model.ts');const s=initialState();
 const item=(id,load,value)=>[{exerciseId:id,targets:[{...blankSet(),load,value}]}];
 const saved=createQuickRoutine(s,'',item('rows','','10'));
 assert.equal(saved.routines[0].name,'Back workout');
 assert.equal(startSession(saved,saved.routines[0].id).active.exercises[0].sets[0].load,'');
 for(const [id,load,value] of [['rows','-5','10'],['rows','20','1.5'],['rows','20','0'],['smith','','10'],['hang','','0']])assert.throws(()=>createQuickRoutine(s,'Plan',item(id,load,value)));
 assert.doesNotThrow(()=>createQuickRoutine(s,'Plan',item('smith','1 plate + 25','10')));
 assert.doesNotThrow(()=>createQuickRoutine(s,'Plan',item('hang','','60')));
 const bad=JSON.parse(JSON.stringify(saved));bad.routines[0].items[0].targets[0].value='bad';assert.throws(()=>restore(JSON.stringify(bad)));
 assert.throws(()=>createQuickRoutine(s,'Plan',[...item('rows','20','10'),...item('rows','30','12')]));
});
test('changing planned set count keeps tap-built routines readable',async()=>{
 const {createQuickRoutine}=await import('../src/lib/model.ts');
 const saved=createQuickRoutine(initialState(),'Rows',[{exerciseId:'rows',targets:[{...blankSet(),load:'100',value:'12'}]}]);
 saved.routines[0].items[0].sets=4;
 const started=startSession(restore(JSON.stringify(saved)),saved.routines[0].id);
 assert.equal(started.active.exercises[0].sets.length,4);
 assert.ok(started.active.exercises[0].sets.every(t=>t.load==='100'&&t.value==='12'&&!t.done));
});
test('current maxes save as exercise baselines without creating workouts or completed records',async()=>{
 const {saveCurrentMaxes}=await import('../src/lib/model.ts');const s=initialState();
 const next=saveCurrentMaxes(s,[{exerciseId:'pullups',targets:[{...blankSet(),load:'35',value:'8'}]}]);
 assert.equal(next.routines,s.routines);assert.equal(next.history,s.history);assert.equal(next.active,s.active);
 assert.deepEqual(next.exercises[0].reference,s.exercises[0].reference);
 assert.equal(next.exercises[0].baseline[0].load,'35');assert.equal(next.exercises[0].baseline[0].done,false);
 assert.equal(bestPerformance(next,'pullups'),null);
 assert.deepEqual(restore(JSON.stringify(next)),next);
 assert.equal(startSession(next,'upper').active.exercises[0].previousSource,'Your last workout · entered by you');
 assert.equal(startSession(next,'upper').active.exercises[0].sets[0].load,'35');
 assert.throws(()=>saveCurrentMaxes(s,[{exerciseId:'pullups',targets:[{...blankSet(),load:'',value:'8'}]}]));
});

test('fresh exercise selection starts without seed numbers or a saved routine',async()=>{
 const {startSelectedSession}=await import('../src/lib/model.ts');const s=initialState();
 const next=startSelectedSession(s,['pullups','rows','pullups'],new Date('2026-10-18T12:00').getTime());
 assert.equal(next.routines,s.routines);assert.equal(next.history,s.history);assert.equal(next.active.exercises.length,2);
 assert.equal(next.active.exercises[0].previous.length,0);
 assert.ok(next.active.exercises[0].sets.every(t=>t.load===''&&t.value===''&&!t.done));
 assert.deepEqual(restore(JSON.stringify(next)),next);
 assert.throws(()=>startSelectedSession(s,[]));assert.throws(()=>startSelectedSession(s,['missing']));assert.throws(()=>startSelectedSession(next,['rows']));
});
test('direct training uses starting numbers and then actual completed numbers',async()=>{
 const {startSelectedSession,saveCurrentMaxes}=await import('../src/lib/model.ts');
 const s=saveCurrentMaxes(initialState(),[{exerciseId:'pullups',targets:[{...blankSet('kg'),load:'20',value:'8'}]}]);
 const next=startSelectedSession(s,['pullups']);assert.equal(next.active.exercises[0].sets[0].load,'20');assert.equal(next.active.exercises[0].sets[0].unit,'kg');
 Object.assign(next.active.exercises[0].sets[0],{load:'22.5',value:'7',done:true});
 const finished=finishSession(next),repeat=startSelectedSession(finished,['pullups']);
 assert.equal(repeat.active.exercises[0].sets[0].load,'22.5');assert.equal(repeat.active.exercises[0].sets[0].done,false);assert.equal(repeat.routines.length,s.routines.length);
});
test('adding exercises mid-workout retains checked sets, rest timer and session identity',async()=>{
 const {startSelectedSession,appendSelectedExercises}=await import('../src/lib/model.ts');const s=startSelectedSession(initialState(),['pullups']);
 Object.assign(s.active.exercises[0].sets[0],{load:'10',value:'12',done:true});s.active.restUntil=Date.now()+90000;
 const next=appendSelectedExercises(s,['pullups','rows']);
 assert.equal(next.active.id,s.active.id);assert.equal(next.active.startedAt,s.active.startedAt);assert.equal(next.active.restUntil,s.active.restUntil);
 assert.equal(next.active.exercises[0],s.active.exercises[0]);assert.equal(next.active.current,1);assert.equal(next.active.exercises.length,2);assert.equal(next.history.length,0);
 assert.throws(()=>appendSelectedExercises(next,['rows']));
});
