import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,startSelectedSession,configureWorkoutExercise,suggestWorkoutNumbers,logWorkoutSet,workoutSummary,finishSession,restore,blankSet} from '../src/lib/model.ts';

test('exercise setup resizes unchecked targets while preserving session identity, edits and rest',()=>{
 const state=startSelectedSession(initialState(),['rows','hang']);const a=state.active;a.restUntil=123456;
 Object.assign(a.exercises[0].sets[0],{load:'100',value:'12',note:'Keep this'});
 const grown=configureWorkoutExercise(a,'rows',5);
 assert.equal(grown.id,a.id);assert.equal(grown.startedAt,a.startedAt);assert.equal(grown.restUntil,a.restUntil);
 assert.equal(grown.exercises[0].sets[0],a.exercises[0].sets[0]);assert.equal(grown.exercises[1],a.exercises[1]);
 assert.equal(grown.exercises[0].sets.length,5);assert.ok(grown.exercises[0].sets.every(s=>!s.done));
 assert.equal(configureWorkoutExercise(grown,'rows',2).exercises[0].sets.length,2);
 for(const count of [0,31,2.5,NaN])assert.throws(()=>configureWorkoutExercise(a,'rows',count));
 assert.throws(()=>configureWorkoutExercise(a,'missing',3));
});

test('resizing never drops a completed set; new targets copy numbers without completion or notes',()=>{
 const state=startSelectedSession(initialState(),['rows']),a=state.active;
 Object.assign(a.exercises[0].sets[2],{load:'22.5',value:'8',unit:'kg',done:true,quality:'iffy',note:'Keep record'});
 assert.throws(()=>configureWorkoutExercise(a,'rows',2));
 const grown=configureWorkoutExercise(a,'rows',4);
 assert.deepEqual([grown.exercises[0].sets[3].load,grown.exercises[0].sets[3].value,grown.exercises[0].sets[3].unit,grown.exercises[0].sets[3].done,grown.exercises[0].sets[3].note,grown.exercises[0].sets[3].quality],['22.5','8','kg',false,'','']);
 assert.notEqual(grown.exercises[0].sets[3].id,a.exercises[0].sets[2].id);
});

test('starting-number suggestions fill only blank unlogged sets, preserving per-set plans and edits',()=>{
 const state=startSelectedSession(initialState(),['rows']),a=configureWorkoutExercise(state.active,'rows',6),sets=a.exercises[0].sets;
 Object.assign(sets[0],{load:'50',value:'10',unit:'kg'});
 Object.assign(sets[2],{value:'8'});sets[3].note='Choose at gym';sets[4].quality='clean';
 a.exercises[0].previous=[{...blankSet(),load:'20',value:'10'},undefined,undefined,undefined,undefined,blankSet()];
 const next=suggestWorkoutNumbers(a,'rows');
 assert.deepEqual([next.exercises[0].sets[1].load,next.exercises[0].sets[1].value,next.exercises[0].sets[1].unit,next.exercises[0].sets[1].done],['50','10','kg',false]);
 for(const index of [0,2,3,4,5])assert.deepEqual(next.exercises[0].sets[index],sets[index]);
 assert.equal(state.history.length,0);
});

test('completed-only summary keeps units separate and excludes unknown/bodyweight/timed load',()=>{
 const state=startSelectedSession(initialState(),['rows','pullups','smith','situp','hang']),a=state.active;
 const set=(i,load,value,unit='lb',done=true)=>Object.assign(a.exercises[i].sets[0],{load,value,unit,done});
 set(0,'100','10');a.exercises[0].sets.push({...blankSet('kg'),load:'20',value:'5',done:true});
 set(1,'10','8');set(2,'2 plates','12');set(3,'','15');set(4,'','60');
 Object.assign(a.exercises[0].sets[1],{load:'999',value:'99',done:false});
 const totals=workoutSummary(a,a.startedAt+120000);
 assert.equal(totals.exercises,5);assert.equal(totals.sets,6);assert.equal(totals.reps,50);assert.equal(totals.seconds,60);
 assert.deepEqual(totals.volume,{lb:1080,kg:100});assert.equal(totals.excludedSets,3);assert.equal(totals.addedLoad,true);assert.equal(totals.minutes,2);
});

test('zero added weight is valid, and incomplete/invalid numeric values do not fabricate volume',()=>{
 const a=startSelectedSession(initialState(),['pullups']).active;
 Object.assign(a.exercises[0].sets[0],{load:'0',value:'12',done:true});
 assert.deepEqual(workoutSummary(a).volume,{lb:0,kg:0});
 Object.assign(a.exercises[0].sets[0],{load:'',value:'12'});assert.equal(workoutSummary(a).excludedSets,1);
 Object.assign(a.exercises[0].sets[0],{load:'100',value:'bad'});assert.deepEqual(workoutSummary(a).volume,{lb:0,kg:0});
});

test('full setup, logging, relaunch, review and save retain exactly the completed sets',()=>{
 let state=startSelectedSession(initialState(),['rows']);
 state.active=configureWorkoutExercise(state.active,'rows',4);Object.assign(state.active.exercises[0].sets[0],{load:'100',value:'12'});
 state.active=suggestWorkoutNumbers(state.active,'rows');state=restore(JSON.stringify(state));
 assert.equal(state.version,2);assert.equal(state.history.length,0);assert.equal(workoutSummary(state.active).sets,0);
 for(const set of state.active.exercises[0].sets.slice(0,2))state.active=logWorkoutSet(state.active,'rows',set.id);
 state=restore(JSON.stringify(state));const review=workoutSummary(state.active),finished=finishSession(state,state.active.startedAt+60000);
 assert.equal(review.sets,2);assert.equal(review.volume.lb,2400);assert.equal(finished.history[0].exercises[0].sets.length,2);
 assert.equal(workoutSummary(finished.history[0]).volume.lb,review.volume.lb);
 assert.equal(workoutSummary(finished.history[0]).minutes,1);assert.equal(finished.active,null);
});
