import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,startSelectedSession,startSession,logWorkoutSet,finishSession,restore,blankSet,completedSets} from '../src/lib/model.ts';

function fresh(mode='weight'){
 const state=startSelectedSession(initialState(),['rows','pullups']);
 state.active.exercises[0].exercise.mode=mode;
 Object.assign(state.active.exercises[0].sets[0],{load:mode==='label'?'1 plate + 25':mode==='bodyweight'||mode==='timed'?'':'100',value:mode==='timed'?'60':'12',quality:'iffy',note:'Last rep slow'});
 return state;
}
const logFirst=(state,now=1000)=>logWorkoutSet(state.active,'rows',state.active.exercises[0].sets[0].id,now);

test('one Log set action records only that set and suggests numbers for the next blank set',()=>{
 const state=fresh(),original=JSON.stringify(state),next=logFirst(state);
 assert.equal(JSON.stringify(state),original);
 assert.equal(completedSets(next),1);
 const [first,second,third]=next.exercises[0].sets;
 assert.equal(first.done,true);
 assert.deepEqual([second.load,second.value,second.unit,second.done,second.note,second.quality],['100','12','lb',false,'','']);
 assert.deepEqual([third.load,third.value,third.done],['','',false]);
 assert.equal(next.exercises[1],state.active.exercises[1]);
 assert.equal(state.history.length,0);
 assert.equal(next.restUntil,1000+state.active.exercises[0].exercise.rest*1000);
});

test('future entries, partial edits, notes, markers, completed sets and planned blanks are preserved',()=>{
 for(const patch of [{load:'125',value:'8'},{load:'125'},{value:'8'},{note:'Drop set'},{quality:'clean'},{load:'125',value:'8',done:true}]){
  const state=fresh();Object.assign(state.active.exercises[0].sets[1],patch);
  assert.deepEqual(logFirst(state).exercises[0].sets[1],state.active.exercises[0].sets[1]);
 }
 const state=fresh();state.active.exercises[0].previous=[{...blankSet(),load:'100',value:'12'},blankSet()];
 assert.deepEqual(logFirst(state).exercises[0].sets[1],state.active.exercises[0].sets[1]);
});

test('carry-forward respects all logging modes and units without carrying quality or notes',()=>{
 for(const mode of ['weight','added','label','bodyweight','timed']){
  const state=fresh(mode);state.active.exercises[0].sets[0].unit='kg';
  const next=logFirst(state),sets=next.exercises[0].sets;
  assert.equal(sets[1].load,sets[0].load);assert.equal(sets[1].value,sets[0].value);
  assert.equal(sets[1].unit,'kg');assert.equal(sets[1].done,false);
  assert.equal(sets[1].note,'');assert.equal(sets[1].quality,'');
 }
});

test('repeated completion and saving edits to a logged set do not advance or restart rest',()=>{
 const state=fresh(),once=logFirst(state);
 const twice=logWorkoutSet(once,'rows',once.exercises[0].sets[0].id,9000);
 assert.equal(twice,once);assert.equal(completedSets(twice),1);
 const edited=structuredClone(once);edited.exercises[0].sets[0].value='9';
 const saved=logWorkoutSet(edited,'rows',edited.exercises[0].sets[0].id,12000);
 assert.equal(saved.exercises[0].sets[0].value,'9');assert.equal(saved.restUntil,once.restUntil);
 assert.equal(saved.exercises[0].sets[1].value,'12');
});

test('invalid or missing sets never complete or start rest',()=>{
 const state=fresh();state.active.exercises[0].sets[0].value='';const before=JSON.stringify(state);
 assert.throws(()=>logFirst(state));assert.throws(()=>logWorkoutSet(state.active,'rows','missing'));
 assert.throws(()=>logWorkoutSet(state.active,'missing','missing'));
 assert.equal(JSON.stringify(state),before);assert.equal(state.active.restUntil,undefined);
});

test('manual rest extensions and zero-rest exercises retain their deadlines',()=>{
 const state=fresh();state.active.exercises[0].exercise.rest=0;state.active.restUntil=123456;
 assert.equal(logFirst(state).restUntil,123456);
 const logged=logFirst(fresh());logged.restUntil+=30000;
 assert.equal(logWorkoutSet(logged,'rows',logged.exercises[0].sets[0].id).restUntil,logged.restUntil);
});

test('suggestions and active corrections survive a backup; only explicitly logged sets enter history',()=>{
 const state=fresh();state.active=logFirst(state);
 const resumed=restore(JSON.stringify(state));assert.deepEqual(resumed,state);
 assert.equal(resumed.active.exercises[0].sets[1].done,false);
 const finished=finishSession(resumed);
 assert.equal(finished.history.length,1);assert.equal(finished.history[0].exercises.length,1);
 assert.equal(finished.history[0].exercises[0].sets.length,1);
 assert.equal(finished.history[0].exercises[0].sets[0].load,'100');
});

test('short previous workouts prefill extra routine sets as unchecked suggestions',()=>{
 let state=startSession(initialState(),'upper');Object.assign(state.active.exercises[0].sets[0],{load:'17.5',value:'9',unit:'kg',done:true});
 state=finishSession(state);const history=JSON.stringify(state.history),next=startSession(state,'upper');
 assert.deepEqual(next.active.exercises[0].sets.map(s=>[s.load,s.value,s.unit,s.done]),Array.from({length:3},()=>['17.5','9','kg',false]));
 assert.equal(next.active.exercises[0].previous.length,1);assert.equal(JSON.stringify(next.history),history);
});
