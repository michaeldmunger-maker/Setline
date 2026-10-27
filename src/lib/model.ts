export type Mode='weight'|'added'|'label'|'bodyweight'|'timed';
export type Unit='lb'|'kg';
export type Group='Chest'|'Back'|'Shoulders'|'Arms'|'Core'|'Legs';
export type SetEntry={id:string;load:string;value:string;unit:Unit;quality:''|'clean'|'iffy'|'failed';note:string;done:boolean};
export type Exercise={id:string;name:string;group:Group;mode:Mode;rest:number;reference:SetEntry[];baseline?:SetEntry[];note:string};
export type Routine={id:string;name:string;subtitle:string;color:string;items:{exerciseId:string;sets:number;targets?:SetEntry[]}[]};
export type LogExercise={exercise:Exercise;sets:SetEntry[];previous:SetEntry[];previousSource:string};
export type Session={id:string;routineId:string;name:string;date:string;startedAt:number;endedAt?:number;scheduleId?:string;exercises:LogExercise[];note:string;restUntil?:number;current:number};
export type Scheduled={id:string;routineId:string;date:string;time:string;completedSession?:string};
export type Food={id:string;name:string;meal:string;date:string;calories:number;protein:number;carbs:number;fat:number;estimatedCalories:boolean};
export type Preferences={name:string;unit:Unit;nutrition:boolean;nutritionPromptDismissed?:boolean;rest:number;goals:{calories:number;protein:number;carbs:number;fat:number}};
export type State={version:2;onboarding:{completed:boolean;welcomeVersion?:number};exercises:Exercise[];routines:Routine[];history:Session[];active:Session|null;schedule:Scheduled[];foods:Food[];favorites:Food[];prefs:Preferences};
export const palette={Chest:'#AE86FF',Back:'#6FA3FF',Shoulders:'#F4BF58',Arms:'#FF8FAD',Core:'#74D8C0',Legs:'#CCFF55'};
export const groups=Object.keys(palette) as Group[];
export const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
export function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function parseDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Use a date like 2026-10-18.');const d=new Date(s+'T12:00');if(!Number.isFinite(d.getTime())||dateKey(d)!==s)throw Error('Choose a valid date.');return d}
export const addDays=(s:string,n:number)=>{const d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)};
export const prettyDate=(s:string)=>parseDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
export const fullDate=(s:string)=>parseDate(s).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
export function blankSet(unit:Unit='lb'):SetEntry{return {id:uid(),load:'',value:'',unit,quality:'',note:'',done:false}}
function refs(loads:string[],values:string[],unit:Unit='lb'):SetEntry[]{return values.map((value,i)=>({...blankSet(unit),load:loads[i]??loads[0]??'',value}))}
export function initialState():State{
 const ex=(id:string,name:string,group:Group,mode:Mode,load:string[],value:string[],note='',rest=90):Exercise=>({id,name,group,mode,rest,reference:refs(load,value),note});
 const exercises=[
 ex('pullups','Weighted pull-ups','Back','added',['10'],['12','11','10'],'First set good; final reps of sets 2 and 3 were iffy.',120),
 ex('smith','Incline Smith press','Chest','label',['Plate + 25'],['10','9','7'],'Plate shorthand preserved; no guessed total weight.',120),
 ex('pulldown','Wide-grip lat pulldown','Back','weight',['160'],['11','10','9']),
 ex('dips','Weighted dips','Chest','added',['10'],['14','11','10'], '',120),
 ex('rows','Close-grip rows','Back','weight',['140'],['15','15','15']),
 ex('pec','Pec deck','Chest','weight',['140','150','150'],['12','12','10']),
 ex('shoulder','Shoulder press machine','Shoulders','label',['2 plates each side'],['12','10','8'],'Plate label preserved; machine resistance is not inferred.',120),
 ex('rear','Rear delt machine','Shoulders','weight',['130'],['12','11','11']),
 ex('lateral','Cable lateral raise','Shoulders','weight',['35'],['15','15','15']),
 ex('shrug','Shrugs','Shoulders','weight',['70'],['15','15','15']),
 ex('pushdown','Triceps pushdown · bar','Arms','weight',['70'],['11','12','12'],'70 lb is the machine label. Effective resistance is uncertain; not doubled.'),
 ex('curl','Cable curls','Arms','weight',[],['','',''],'In your notes without weights or reps.'),
 ex('skull','Skull crushers','Arms','weight',['50','60','60'],['15','12','12']),
 ex('hammer','Rope hammer curls','Arms','weight',[],['','',''],'In your notes without weights or reps.'),
 ex('extension','Back extensions','Back','weight',['160'],['15','15']),
 ex('hang','Dead hangs','Back','timed',[],['60','60'],'Duration is logged in seconds.'),
 ex('forearm','Forearm curls','Arms','weight',[],['','',''],'In your notes without weights or reps.'),
 ex('situp','Decline sit-ups','Core','bodyweight',[],['',''],'Two sets noted; reps not supplied.'),
 ex('legraise','Hovering leg raises','Core','bodyweight',[],['',''],'Two sets noted; reps not supplied.')];
 const items=(ids:string[])=>ids.map(id=>({exerciseId:id,sets:exercises.find(e=>e.id===id)!.reference.length}));
 return {version:2,onboarding:{completed:false},exercises,routines:[{id:'upper',name:'Chest & back',subtitle:'Your upper-body session',color:palette.Back,items:items(['pullups','smith','pulldown','dips','rows','pec'])},{id:'sunday',name:'Shoulders & arms',subtitle:'Your Sunday notes',color:palette.Shoulders,items:items(['shoulder','rear','lateral','shrug','pushdown','curl','skull','hammer','extension','hang','forearm','situp','legraise'])}],history:[],active:null,schedule:[],foods:[],favorites:[],prefs:{name:'',unit:'lb',nutrition:false,rest:90,goals:{calories:0,protein:0,carbs:0,fat:0}}}
}
export function lastExercise(state:State,id:string){return [...state.history].sort((a,b)=>(b.endedAt||0)-(a.endedAt||0)).flatMap(session=>session.exercises.map(log=>({log,session}))).find(x=>x.log.exercise.id===id)}
export function startSession(state:State,routineId:string,scheduleId?:string,now=Date.now()):State{if(state.active)throw Error('Finish or discard the current workout first.');const r=state.routines.find(x=>x.id===routineId);if(!r||!r.items.length)throw Error('Add at least one exercise to this routine.');const exercises=r.items.map(item=>{const exercise=state.exercises.find(e=>e.id===item.exerciseId);if(!exercise)throw Error('An exercise in this routine is missing.');const last=lastExercise(state,exercise.id);const previous=last?.log.sets||[];const planned=last?.log.sets||item.targets||exercise.baseline||exercise.reference;return {exercise:JSON.parse(JSON.stringify(exercise)) as Exercise,previous:JSON.parse(JSON.stringify(last?previous:item.targets||exercise.baseline||exercise.reference)) as SetEntry[],previousSource:last?prettyDate(last.session.date):item.targets?'Your plan':exercise.baseline?'Your last workout · entered by you':'Your notes',sets:Array.from({length:item.sets},(_,i)=>({...blankSet(state.prefs.unit),load:planned[i]?.load??planned.at(-1)?.load??'',value:planned[i]?.value??planned.at(-1)?.value??'',unit:planned[i]?.unit??planned.at(-1)?.unit??state.prefs.unit}))}});return {...state,active:{id:uid(),routineId:r.id,name:r.name,date:dateKey(new Date(now)),startedAt:now,scheduleId,exercises,note:'',current:0}}}
export function validateSet(set:SetEntry,mode:Mode){if(!set.value.trim()||!Number.isFinite(Number(set.value))||Number(set.value)<=0)throw Error(mode==='timed'?'Enter a duration above zero.':'Enter reps above zero.');if(mode!=='timed'&&!Number.isInteger(Number(set.value)))throw Error('Reps must be a whole number.');if(mode==='weight'||mode==='added'){if(!set.load.trim()||!Number.isFinite(Number(set.load))||Number(set.load)<0)throw Error('Enter a valid load. Use 0 for no added weight.')}if(mode==='label'&&!set.load.trim())throw Error('Enter your plate or machine label.')}
export function finishSession(state:State,now=Date.now()):State{const a=state.active;if(!a)throw Error('No workout is in progress.');const exercises=a.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.length);if(!exercises.length)throw Error('Complete at least one set before saving.');for(const e of exercises)for(const set of e.sets)validateSet(set,e.exercise.mode);const session={...a,endedAt:now,restUntil:undefined,exercises};return {...state,active:null,history:[session,...state.history],schedule:state.schedule.map(p=>p.id===a.scheduleId?{...p,completedSession:session.id}:p)}}
export function loadText(set:SetEntry,mode:Mode){if(mode==='timed')return 'Timed';if(mode==='bodyweight')return 'Bodyweight';if(mode==='label')return set.load||'Your label';return (mode==='added'?'+':'')+(set.load||'—')+' '+set.unit}
export const setText=(set:SetEntry,mode:Mode)=>mode==='timed'?`${set.value||'—'} sec`:`${loadText(set,mode)} × ${set.value||'—'}`;
export const completedSets=(s:Session)=>s.exercises.reduce((sum,e)=>sum+e.sets.filter(x=>x.done).length,0);
// Only an explicit Log set action completes a set. Carry numbers, never notes or completion.
export function logWorkoutSet(session:Session,exerciseId:string,setId:string,now=Date.now()):Session{
 const log=session.exercises.find(e=>e.exercise.id===exerciseId),set=log?.sets.find(s=>s.id===setId);
 if(!log||!set)throw Error('This set is no longer in the workout.');
 validateSet(set,log.exercise.mode);
 if(set.done)return session;
 const index=log.sets.findIndex(s=>s.id===setId),next=log.sets[index+1];
 const carry=next&&!next.done&&!next.load&&!next.value&&!next.note&&!next.quality&&!log.previous[index+1];
 return {...session,restUntil:log.exercise.rest?now+log.exercise.rest*1000:session.restUntil,exercises:session.exercises.map(e=>e!==log?e:{...e,sets:e.sets.map(s=>s.id===setId?{...s,done:true}:carry&&s.id===next.id?{...s,load:set.load,value:set.value,unit:set.unit}:s)})};
}
export function configureWorkoutExercise(session:Session,exerciseId:string,count:number):Session{
 if(!Number.isInteger(count)||count<1||count>30)throw Error('Choose 1 to 30 sets.');
 const log=session.exercises.find(e=>e.exercise.id===exerciseId);
 if(!log)throw Error('This exercise is no longer in the workout.');
 if(log.sets.slice(count).some(s=>s.done))throw Error('Keep your logged sets. Undo a set before removing it.');
 const last=log.sets.at(-1);
 const sets=Array.from({length:count},(_,i)=>log.sets[i]||{...blankSet(last?.unit),load:last?.load||'',value:last?.value||''});
 return {...session,exercises:session.exercises.map(e=>e===log?{...e,sets}:e)};
}
export function suggestWorkoutNumbers(session:Session,exerciseId:string):Session{
 const log=session.exercises.find(e=>e.exercise.id===exerciseId),first=log?.sets[0];
 if(!log||!first)return session;
 return {...session,exercises:session.exercises.map(e=>e!==log?e:{...e,sets:e.sets.map((s,i)=>i&&!s.done&&!s.load&&!s.value&&!s.note&&!s.quality&&!e.previous[i]?{...s,load:first.load,value:first.value,unit:first.unit}:s)})};
}
export function workoutSummary(session:Session,now=Date.now()){
 const logs=session.exercises.map(e=>({...e,sets:e.sets.filter(s=>s.done)})).filter(e=>e.sets.length);
 const volume={lb:0,kg:0},volumeSets={lb:0,kg:0};let reps=0,seconds=0,excludedSets=0,addedLoad=false;
 for(const log of logs)for(const set of log.sets){
  const value=Number(set.value),load=Number(set.load);
  if(log.exercise.mode==='timed'){if(Number.isFinite(value)&&value>0)seconds+=value;excludedSets++;continue;}
  if(Number.isInteger(value)&&value>0)reps+=value;
  if(['weight','added'].includes(log.exercise.mode)&&set.load.trim()&&Number.isFinite(load)&&load>=0&&Number.isInteger(value)&&value>0){volume[set.unit]+=load*value;volumeSets[set.unit]++;if(log.exercise.mode==='added')addedLoad=true;}
  else excludedSets++;
 }
 return {exercises:logs.length,sets:logs.reduce((n,e)=>n+e.sets.length,0),reps,seconds,volume,volumeSets,excludedSets,addedLoad,minutes:Math.max(0,Math.round(((session.endedAt??now)-session.startedAt)/60000))};
}
export function exerciseHistory(state:State,id:string){return [...state.history].sort((a,b)=>a.startedAt-b.startedAt).flatMap(session=>session.exercises.filter(e=>e.exercise.id===id).map(e=>({session,log:e})))}
export function bestPerformance(state:State,id:string,unit:Unit=state.prefs.unit){const history=exerciseHistory(state,id);const exercise=state.exercises.find(e=>e.id===id)||history.at(-1)?.log.exercise;if(!exercise)return null;const sets=history.flatMap(x=>x.log.sets).filter(s=>s.done);if(!sets.length)return null;if(exercise.mode==='timed')return {value:Math.max(...sets.map(s=>Number(s.value))),label:'Longest hold',unit:'sec'};if(exercise.mode==='weight'||exercise.mode==='added'){const compatible=sets.filter(s=>s.unit===unit);if(!compatible.length)return null;return {value:Math.max(...compatible.map(s=>Number(s.load))),label:exercise.mode==='added'?'Most added weight':'Highest recorded load',unit}}return {value:Math.max(...sets.map(s=>Number(s.value))),label:'Most reps in one set',unit:'reps'}}
export function addSchedule(state:State,routineId:string,date:string,time:string,weeks=1){parseDate(date);if(!state.routines.some(r=>r.id===routineId))throw Error('Choose a routine.');if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Use a time like 17:00, or leave it blank.');if(!Number.isInteger(weeks)||weeks<1||weeks>12)throw Error('Choose between 1 and 12 weeks.');const additions=Array.from({length:weeks},(_,i)=>({id:uid(),routineId,date:addDays(date,i*7),time})).filter(p=>!state.schedule.some(s=>s.date===p.date&&s.time===p.time&&s.routineId===p.routineId));return {...state,schedule:[...state.schedule,...additions]}}
export function validateFood(f:Food){parseDate(f.date);if(!f.name.trim())throw Error('Give this meal a name.');for(const k of ['calories','protein','carbs','fat'] as const)if(!Number.isFinite(f[k])||f[k]<0)throw Error('Calories and macros must be zero or greater.')}
export function foodTotals(state:State,date:string){return state.foods.filter(f=>f.date===date).reduce((t,f)=>({calories:t.calories+f.calories,protein:t.protein+f.protein,carbs:t.carbs+f.carbs,fat:t.fat+f.fat}),{calories:0,protein:0,carbs:0,fat:0})}
export class UnsupportedVersionError extends Error {}
export function restore(raw:string):State{const input=JSON.parse(raw);if(!input||typeof input!=='object')throw Error('This is not a Setline backup.');if(typeof input.version==='number'&&input.version>2)throw new UnsupportedVersionError('This data needs a newer version of Setline. Update the app; your saved data has not been reset.');if(![1,2].includes(input.version))throw Error('This is not a Setline backup.');const d=input as State;if(!Array.isArray(d.exercises)||!Array.isArray(d.routines)||!Array.isArray(d.history)||!Array.isArray(d.schedule)||!Array.isArray(d.foods)||!Array.isArray(d.favorites)||!d.prefs)throw Error('This is not a Setline backup.');const ids=new Set<string>();for(const e of d.exercises){if(typeof e.id!=='string'||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||!groups.includes(e.group)||!['weight','added','label','bodyweight','timed'].includes(e.mode)||!Number.isFinite(e.rest)||e.rest<0||!Array.isArray(e.reference)||e.baseline!==undefined&&(!Array.isArray(e.baseline)||!e.baseline.length||e.baseline.some(t=>!validTarget(t,e.mode))))throw Error('Invalid exercise data.');ids.add(e.id)}for(const r of d.routines){if(typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.items)||r.items.some(i=>!ids.has(i.exerciseId)||!Number.isInteger(i.sets)||i.sets<1||i.sets>30||!!i.targets&&(!Array.isArray(i.targets)||i.targets.length<1||i.targets.length>30||i.targets.some(t=>!validTarget(t,d.exercises.find(e=>e.id===i.exerciseId)!.mode)))))throw Error('Invalid routine data.')}for(const session of [...d.history,...(d.active?[d.active]:[])]){parseDate(session.date);if(!session.id||!Number.isFinite(session.startedAt)||!Array.isArray(session.exercises))throw Error('Invalid workout data.');for(const e of session.exercises){if(!e.exercise||!Array.isArray(e.sets))throw Error('Invalid set data.');for(const set of e.sets){if(typeof set.load!=='string'||typeof set.value!=='string'||!['lb','kg'].includes(set.unit))throw Error('Invalid set values.');if(set.done&&session!==d.active)validateSet(set,e.exercise.mode)}}}for(const f of [...d.foods,...d.favorites])validateFood(f);for(const p of d.schedule)parseDate(p.date);if(!['lb','kg'].includes(d.prefs.unit)||typeof d.prefs.nutrition!=='boolean'||!Number.isFinite(d.prefs.rest)||d.prefs.rest<0||Object.values(d.prefs.goals).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid preferences.');if(input.version===1){d.version=2;d.onboarding={completed:!!(d.history.length||d.active||d.foods.length||d.schedule.length||d.routines.some(r=>!['upper','sunday'].includes(r.id))||d.prefs.name||d.prefs.nutrition||d.prefs.unit!=='lb'||d.prefs.rest!==90)}}if(!d.onboarding||typeof d.onboarding.completed!=='boolean')throw Error('Invalid welcome preferences.');return d}

export const needsWelcome=(state:State)=>!state.onboarding.completed||state.onboarding.welcomeVersion!==2;
export const completeWelcome=(state:State):State=>({...state,onboarding:{completed:true,welcomeVersion:2}});

export function createStarterRoutine(state:State,name:string,exerciseIds:string[]):State{const ids=[...new Set(exerciseIds)];if(!name.trim())throw Error('Give your workout a name.');if(!ids.length)throw Error('Choose at least one exercise.');if(ids.some(id=>!state.exercises.some(e=>e.id===id)))throw Error('An exercise could not be found.');const routine:Routine={id:uid(),name:name.trim(),subtitle:'Your first session',color:palette.Back,items:ids.map(exerciseId=>({exerciseId,sets:Math.min(30,state.exercises.find(e=>e.id===exerciseId)!.reference.length||3)}))};return completeWelcome({...state,routines:[routine,...state.routines]})}

export type QuickExercise={exerciseId:string;targets:SetEntry[]};
function validTarget(t:SetEntry,mode:Mode){if(!t||typeof t.load!=='string'||typeof t.value!=='string'||!['lb','kg'].includes(t.unit)||t.done!==false)return false;try{validateSet({...t,load:t.load||(['weight','added'].includes(mode)?'0':'')},mode);return true}catch{return false}}
export function createQuickRoutine(state:State,name:string,items:QuickExercise[]):State{
 if(!items.length)throw Error('Add an exercise first.');
 if(new Set(items.map(i=>i.exerciseId)).size!==items.length)throw Error('Each exercise only needs to be added once.');
 for(const item of items){const e=state.exercises.find(e=>e.id===item.exerciseId);if(!e||!item.targets.length||item.targets.length>30||item.targets.some(t=>!validTarget(t,e.mode)))throw Error('Check the sets, reps and weight for each exercise.');}
 const first=state.exercises.find(e=>e.id===items[0].exerciseId)!;
 const routine:Routine={id:uid(),name:name.trim()||`${first.group} workout`,subtitle:'Your exercise plan',color:palette[first.group],items:items.map(i=>({exerciseId:i.exerciseId,sets:i.targets.length,targets:i.targets.map(t=>({...t,id:uid(),done:false}))}))};
 return completeWelcome({...state,routines:[routine,...state.routines]});
}

export function saveCurrentMaxes(state:State,items:QuickExercise[]):State{
 createQuickRoutine(state,'Current maxes',items);
 for(const item of items){const e=state.exercises.find(e=>e.id===item.exerciseId)!;for(const t of item.targets)validateSet(t,e.mode)}
 return completeWelcome({...state,exercises:state.exercises.map(e=>{const item=items.find(i=>i.exerciseId===e.id);return item?{...e,baseline:item.targets.map(t=>({...t,id:uid(),done:false}))}:e})});
}

// Start a session directly from exercise choices without adding a saved routine.
export function startSelectedSession(state:State,exerciseIds:string[],now=Date.now(),name='My workout'):State{
 if(state.active)throw Error('Finish or discard the current workout first.');
 const ids=[...new Set(exerciseIds)];
 if(!ids.length)throw Error('Choose at least one exercise.');
 const exercises=ids.map(id=>{
  const exercise=state.exercises.find(e=>e.id===id);if(!exercise)throw Error('An exercise could not be found.');
  const last=lastExercise(state,id),previous=last?.log.sets||exercise.baseline||[];
  const count=Math.min(30,previous.length||3);
  return {exercise:JSON.parse(JSON.stringify(exercise)) as Exercise,previous:JSON.parse(JSON.stringify(previous)) as SetEntry[],previousSource:last?prettyDate(last.session.date):exercise.baseline?'Your last workout · entered by you':'',sets:Array.from({length:count},(_,i)=>({...blankSet(previous[i]?.unit||state.prefs.unit),load:previous[i]?.load||'',value:previous[i]?.value||''}))};
 });
 return {...state,active:{id:uid(),routineId:'',name:name.trim()||'My workout',date:dateKey(new Date(now)),startedAt:now,exercises,note:'',current:0}};
}

export function appendSelectedExercises(state:State,exerciseIds:string[]):State{
 if(!state.active)throw Error('Start a workout first.');
 const ids=exerciseIds.filter(id=>!state.active!.exercises.some(log=>log.exercise.id===id));
 if(!ids.length)throw Error('Choose an exercise that is not already in this workout.');
 const added=startSelectedSession({...state,active:null},ids).active!.exercises;
 return {...state,active:{...state.active,exercises:[...state.active.exercises,...added],current:state.active.exercises.length}};
}
