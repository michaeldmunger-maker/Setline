import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,startSession,finishSession,restore,needsWelcome,completeWelcome,discardCurrentWorkout} from '../src/lib/model.ts';
import {DATA_KEY,RECOVERY_KEY,DAILY_KEY,loadSavedState,createPersistence,getSnapshots} from '../src/lib/persistence.ts';
import {createStorageLifecycle,RESET_KEY} from '../src/lib/storage-lifecycle.ts';
import {ONBOARDING_KEY,readOnboardingProgress} from '../src/lib/onboarding.ts';

function memory(seed={}){const data=new Map(Object.entries(seed));return {data,getItem:async k=>data.get(k)??null,setItem:async(k,v)=>{data.set(k,v)},removeItem:async k=>{data.delete(k)},getAllKeys:async()=>[...data.keys()]};}
function existing(){let s=startSession(initialState(),'upper');s.active.exercises[0].sets[0].done=true;s=finishSession(s);s=completeWelcome(s);s=startSession(s,'sunday');s.prefs.name='Lifter';return s;}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}

test('fresh install welcomes, interrupted setup resumes its cursor, and completion survives updates',async()=>{
 const db=memory(),lifecycle=createStorageLifecycle(db),storage=lifecycle.scope();const loaded=await loadSavedState(storage);
 assert.equal(needsWelcome(loaded.state),true);assert.equal(loaded.state.history.length,0);assert.equal(loaded.state.active,null);
 const progress={step:'walkthrough',guideIndex:1,method:'text'};await storage.setItem(ONBOARDING_KEY,JSON.stringify(progress));
 assert.equal(readOnboardingProgress(await createStorageLifecycle(db).scope().getItem(ONBOARDING_KEY)).guideIndex,1);
 const writer=createPersistence(storage,null,()=>{});await writer.save(completeWelcome(loaded.state));
 const returning=await loadSavedState(createStorageLifecycle(db).scope());assert.equal(needsWelcome(returning.state),false);assert.equal(returning.state.version,2);
});

test('onboarding cursor retains reviewed imports and gracefully rejects an invalid cursor',()=>{
 const p=readOnboardingProgress(JSON.stringify({step:'import',method:'photo',reviewDraft:true,kind:'history',guideIndex:2,savedName:'Upper',savedCount:4,savedAs:'history'}));
 assert.equal(p.step,'import');assert.equal(p.reviewDraft,true);assert.equal(p.kind,'history');assert.equal(p.method,'photo');
 assert.equal(readOnboardingProgress('{broken').step,'intro');assert.equal(readOnboardingProgress(JSON.stringify({step:'bad',guideIndex:99})).guideIndex,0);
});

test('missing or older welcome metadata never replaces history, active sets or preferences',()=>{
 for(const version of [1,2]){const original=existing(),raw=JSON.parse(JSON.stringify(original));raw.version=version;delete raw.onboarding;
  const loaded=restore(JSON.stringify(raw));assert.equal(needsWelcome(loaded),false);
  for(const key of ['history','active','prefs','routines','exercises'])assert.deepEqual(loaded[key],JSON.parse(JSON.stringify(original[key])));
 }
 const old=existing();old.onboarding={completed:true};assert.equal(needsWelcome(old),false);
 const interrupted=existing();interrupted.onboarding={completed:false};assert.equal(needsWelcome(interrupted),true);
});

test('discard current workout changes only the active session and persists normally',async()=>{
 const state=existing(),next=discardCurrentWorkout(state);assert.equal(next.active,null);
 for(const key of Object.keys(state).filter(k=>k!=='active'))assert.equal(next[key],state[key]);
 assert.equal(discardCurrentWorkout(next),next);
 const db=memory(),writer=createPersistence(createStorageLifecycle(db).scope(),null,()=>{});await writer.save(state);await writer.save(next);
 const loaded=await loadSavedState(db);assert.equal(loaded.state.active,null);assert.deepEqual(loaded.state.history,JSON.parse(JSON.stringify(state.history)));
});

test('full reset erases every Setline-owned key, recovery and drafts, but preserves unrelated data',async()=>{
 const state=existing(),db=memory({[DATA_KEY]:JSON.stringify(state),[RECOVERY_KEY]:JSON.stringify({savedAt:Date.now(),state}),[DAILY_KEY]:JSON.stringify({savedAt:Date.now(),state}),'setline-arnold-draft':'draft','setline-arnold-chat':'chat','setline-arnold-connection':'pairing','setline-current-maxes-draft':'maxes','setline-quick-workout-draft':'plan',[ONBOARDING_KEY]:'cursor','setline-future-draft':'future',other:'keep'});
 const lifecycle=createStorageLifecycle(db);let cleaned=0;await lifecycle.reset(async()=>{cleaned++});
 assert.equal(cleaned,1);assert.deepEqual([...db.data.entries()],[['other','keep']]);
 const first=await loadSavedState(createStorageLifecycle(db).scope());assert.equal(first.saved,false);assert.equal(needsWelcome(first.state),true);assert.equal(first.state.active,null);assert.equal(first.state.history.length,0);
});

test('queued/in-flight saves and delayed draft callbacks cannot resurrect pre-reset data',async()=>{
 const db=memory(),entered=deferred(),release=deferred(),write=db.setItem;let pause=true;
 db.setItem=async(k,v)=>{if(pause&&k===DATA_KEY){pause=false;entered.resolve();await release.promise}await write(k,v)};
 const lifecycle=createStorageLifecycle(db),old=lifecycle.scope(),state=existing(),writer=createPersistence(old,null,()=>{});
 const saving=writer.save(state);await entered.promise;
 const later=writer.save({...state,prefs:{...state.prefs,name:'Queued old state'}});
 const draining=writer.dispose(),reset=lifecycle.reset();release.resolve();await Promise.all([saving,later,draining,reset]);
 await old.setItem('setline-arnold-chat','late reply');await old.setItem(ONBOARDING_KEY,'old guide');await writer.save(state);
 assert.equal(old.isCurrent(),false);assert.equal(db.data.size,0);
 const fresh=createPersistence(lifecycle.scope(),null,()=>{});await fresh.save(initialState());
 assert.equal((await loadSavedState(db)).state.history.length,0);assert.equal(needsWelcome((await loadSavedState(db)).state),true);assert.equal((await getSnapshots(db)).length,0);
});

test('reset invalidates scopes immediately and ignores stale removals after fresh onboarding starts',async()=>{
 const db=memory(),lifecycle=createStorageLifecycle(db),old=lifecycle.scope(),gate=deferred();
 const reset=lifecycle.reset(()=>gate.promise);assert.equal(old.isCurrent(),false);
 gate.resolve();await reset;const fresh=lifecycle.scope();await fresh.setItem(ONBOARDING_KEY,JSON.stringify({step:'hello'}));
 await old.removeItem(ONBOARDING_KEY);assert.equal(readOnboardingProgress(await fresh.getItem(ONBOARDING_KEY)).step,'hello');
});

test('interrupted deletion leaves a marker; restart finishes deletion before recovery can load',async()=>{
 const state=existing(),db=memory({[DATA_KEY]:JSON.stringify(state),[RECOVERY_KEY]:JSON.stringify({savedAt:Date.now(),state})}),remove=db.removeItem;
 db.removeItem=async k=>{if(k===RECOVERY_KEY)throw Error('storage unavailable');await remove(k)};
 const lifecycle=createStorageLifecycle(db);await assert.rejects(()=>lifecycle.reset());assert.equal(lifecycle.resetting,true);assert.equal(db.data.get(RESET_KEY),'1');
 db.removeItem=remove;const restarted=createStorageLifecycle(db);await restarted.resumeReset();
 assert.equal(db.data.size,0);assert.equal((await loadSavedState(restarted.scope())).saved,false);
});

test('failure before the reset marker is durable does not delete existing data',async()=>{
 const raw=JSON.stringify(existing()),db=memory({[DATA_KEY]:raw}),write=db.setItem;
 db.setItem=async(k,v)=>{if(k===RESET_KEY)throw Error('disk unavailable');await write(k,v)};
 await assert.rejects(()=>createStorageLifecycle(db).reset());assert.equal(db.data.get(DATA_KEY),raw);
});

test('file-cleanup failure retains the reset marker and retry completes without old recovery',async()=>{
 const db=memory({[DATA_KEY]:JSON.stringify(existing())}),lifecycle=createStorageLifecycle(db);
 await assert.rejects(()=>lifecycle.reset(async()=>{throw Error('cache busy')}));assert.equal(db.data.get(RESET_KEY),'1');
 await lifecycle.reset();assert.equal(lifecycle.resetting,false);assert.equal(db.data.size,0);
});

test('simultaneous reset requests share one operation',async()=>{
 const db=memory(),lifecycle=createStorageLifecycle(db),gate=deferred();let calls=0;
 const first=lifecycle.reset(async()=>{calls++;await gate.promise}),second=lifecycle.reset();assert.equal(first,second);gate.resolve();await first;assert.equal(calls,1);assert.equal(lifecycle.generation,1);
});

test('disposed persistence controller never emits a saved status or accepts more writes',async()=>{
 const db=memory(),events=[],writer=createPersistence(db,null,s=>events.push(s));await writer.dispose();await writer.save(existing());
 assert.equal(events.length,0);assert.equal(db.data.size,0);
});

test('failed onboarding-completion write stays incomplete on disk and a retry succeeds',async()=>{
 const db=memory(),write=db.setItem,writer=createPersistence(db,null,()=>{}),completed=completeWelcome(initialState());
 db.setItem=async()=>{throw Error('storage full')};await writer.save(completed);
 assert.ok(writer.lastError);assert.equal(needsWelcome((await loadSavedState(db)).state),true);
 db.setItem=write;await writer.save(completed);assert.equal(writer.lastError,'');assert.equal(needsWelcome((await loadSavedState(db)).state),false);
});
