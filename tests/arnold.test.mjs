import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNotes,applyImport,matchDraft,validateDraft,trainingContext} from '../src/lib/arnold.ts';
import {initialState,restore} from '../src/lib/model.ts';
import {arnold,validateRequest,readResponse} from '../server/reader.mjs';
const sample='Weighted pull-ups\n10 lbs\n12, 11, 10 (last reps iffy)\nIncline smith\nPlate + 25\n10,9,7\nPec deck\n140 lbs for 12\n150 lbs for 12, 10';
test('offline notes preserve mixed weights, plate labels and form notes without inventing a date',()=>{const d=parseNotes(sample);assert.equal(d.date,'');assert.equal(d.exercises.length,3);assert.deepEqual(d.exercises[0].sets.map(s=>s.value),['12','11','10']);assert.equal(d.exercises[0].sets[2].note,'last reps iffy');assert.equal(d.exercises[1].mode,'label');assert.equal(d.exercises[1].sets[0].load,'Plate + 25');assert.deepEqual(d.exercises[2].sets.map(s=>s.load),['140','150','150'])});
test('routine approval leaves history empty, history needs valid date and sets',()=>{const s=initialState(),d=matchDraft(parseNotes(sample),s);const r=applyImport(s,d,'routine');assert.equal(r.history.length,0);assert.equal(r.routines.length,3);assert.equal(r.routines[0].items[0].exerciseId,'pullups');assert.throws(()=>applyImport(s,d,'history'));assert.throws(()=>applyImport(r,d,'routine'));d.date='2026-10-17';const h=applyImport(s,d,'history');assert.equal(h.history[0].exercises[0].exercise.id,'pullups');assert.equal(h.history[0].exercises[0].sets[0].done,true);assert.deepEqual(restore(JSON.stringify(h)),JSON.parse(JSON.stringify(h)));assert.throws(()=>applyImport(h,d,'history'))});
test('missing values never become completed sets; weekdays stay undated',()=>{const d=parseNotes('Sunday\nCable curls\n\nDead hangs\n1 minute\n1 minute');assert.equal(d.date,'');assert.equal(d.exercises[1].mode,'timed');assert.equal(d.exercises[1].sets[0].value,'60');d.date='2026-10-18';assert.throws(()=>applyImport(initialState(),d,'history'));assert.throws(()=>validateDraft({}));assert.equal(trainingContext(initialState()).recentWorkouts.length,0)});
test('API request validation rejects huge text, invalid action and fake images',()=>{for(const b of [{action:'delete',text:'x',unit:'lb'},{action:'import',text:'x'.repeat(20001),unit:'lb'},{action:'import',text:'x',unit:'lb',image:'data:image/jpeg;base64,YWJj'}])assert.throws(()=>validateRequest(b));assert.throws(()=>readResponse({status:'incomplete'}));assert.throws(()=>readResponse({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}))});
test('AI extraction uses strict draft schema, store false and validates response',async()=>{let request;const d=parseNotes(sample);const response={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(d)}]}]};const result=await arnold({action:'import',text:sample,unit:'lb'},{apiKey:'test',fetcher:async(url,opts)=>{request=JSON.parse(opts.body);return {ok:true,json:async()=>response}}});assert.equal(request.store,false);assert.equal(request.text.format.strict,true);assert.equal(result.draft.date,'');assert.equal(result.draft.exercises.length,3);await assert.rejects(()=>arnold({action:'chat',text:'hello',unit:'lb'},{apiKey:'test',fetcher:async()=>({ok:false,status:429})}),/usage limit/)});
test('local server requires pairing, rejects foreign origins, and never calls AI without a key',async()=>{const {createArnoldServer}=await import('../server/index.mjs');let calls=0;const {server}=createArnoldServer({apiKey:'test',token:'pairing-test',reader:async()=>{calls++;return {reply:'Test reply'}}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;try{const body=JSON.stringify({action:'chat',text:'hello',unit:'lb'});const req=(headers)=>fetch(url+'/arnold',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});assert.equal((await req({})).status,401);assert.equal((await req({Authorization:'Bearer pairing-test',Origin:'https://untrusted.example'})).status,403);const res=await req({Authorization:'Bearer pairing-test'});assert.equal(res.status,200);assert.deepEqual(await res.json(),{reply:'Test reply'});assert.equal(calls,1)}finally{await new Promise(resolve=>server.close(resolve))}const missing=createArnoldServer({apiKey:'',token:'pairing-test',reader:async()=>{throw Error('Must not call')}}).server;await new Promise(resolve=>missing.listen(0,'127.0.0.1',resolve));try{const res=await fetch(`http://127.0.0.1:${missing.address().port}/arnold`,{method:'POST',headers:{Authorization:'Bearer pairing-test','Content-Type':'application/json'},body:'{}'});assert.equal(res.status,503)}finally{await new Promise(resolve=>missing.close(resolve))}});

test('setup imports save starting numbers without creating a routine or dated workout',()=>{
 const s=initialState();const draft=matchDraft(parseNotes('Weighted pull-ups\n10 lbs\n12, 11, 10'),s);
 const next=applyImport(s,draft,'baseline');
 assert.equal(next.routines,s.routines);assert.equal(next.history,s.history);
 const ex=next.exercises.find(e=>e.id==='pullups');
 assert.deepEqual(ex.baseline.map(t=>t.value),['12','11','10']);
 assert.ok(ex.baseline.every(t=>t.load==='10'&&!t.done));
 assert.deepEqual(ex.reference,s.exercises.find(e=>e.id==='pullups').reference);
});

test('multiple photos share the existing request cap and each becomes an image input',async()=>{
 const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,0,0,0]).toString('base64');
 assert.doesNotThrow(()=>validateRequest({action:'import',text:'',unit:'lb',images:[jpeg,jpeg]}));
 assert.throws(()=>validateRequest({action:'import',text:'x',unit:'lb',images:Array(5).fill(jpeg)}));
 assert.throws(()=>validateRequest({action:'chat',text:'hello',unit:'lb',images:[jpeg]}));
 assert.throws(()=>validateRequest({action:'import',text:'x',unit:'lb',images:['invalid']}));
 assert.throws(()=>validateRequest({action:'import',text:'x',unit:'lb',images:[jpeg+'A'.repeat(4_100_000),jpeg+'A'.repeat(4_100_000)]}));
 let request;await arnold({action:'import',text:'',unit:'lb',images:[jpeg,jpeg]},{apiKey:'test',fetcher:async(url,opts)=>{request=JSON.parse(opts.body);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(parseNotes(sample))}]}]})}}});
 assert.equal(request.input[0].content.filter(c=>c.type==='input_image').length,2);
});
test('adding more notes retains reviewed exercises and merges matching sets without guessing values',async()=>{
 const {combineDrafts}=await import('../src/lib/arnold.ts');const first=parseNotes('Weighted pull-ups\n10 lb\n12, 11');
 const next=parseNotes('Weighted pull-ups\n10 lb\n10\nClose-grip rows\n140 lb\n15, 15, 15');
 const combined=combineDrafts(first,next);assert.equal(combined.exercises.length,2);assert.deepEqual(combined.exercises[0].sets.map(s=>s.value),['12','11','10']);assert.equal(first.exercises[0].sets.length,2);
});
