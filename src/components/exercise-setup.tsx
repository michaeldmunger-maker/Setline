import React,{useState} from 'react';
import {Keyboard,Pressable,Text,View} from 'react-native';
import {configureWorkoutExercise,setText,suggestWorkoutNumbers,type LogExercise,type Session,type SetEntry} from '../lib/model';
import {NumberStepper} from './number-stepper';
import {PreviousPerformance} from './previous-performance';
import {Body,Button,C,ErrorBox,Field,Label,Panel,Screen,Title,u} from './ui';

export function ExerciseSetup({log,session,patch,onStart}:{log:LogExercise;session:Session;patch:(fn:(s:Session)=>Session)=>void;onStart:()=>void}){
 const [step,setStep]=useState<'count'|'numbers'>('count'),[count,setCount]=useState(String(log.sets.length)),[index,setIndex]=useState(0),[error,setError]=useState('');
 const ex=log.exercise,set=log.sets[index];
 function resize(value:string){setCount(value);const n=Number(value);if(Number.isInteger(n)&&n>=1&&n<=30){try{configureWorkoutExercise(session,ex.id,n);patch(a=>configureWorkoutExercise(a,ex.id,n));setIndex(i=>Math.min(i,n-1));setError('')}catch(e){setError((e as Error).message)}}}
 function change(p:Partial<SetEntry>){patch(a=>({...a,exercises:a.exercises.map(e=>e.exercise.id===ex.id?{...e,sets:e.sets.map((s,i)=>i===index?{...s,...p}:s)}:e)}))}
 function next(){Keyboard.dismiss();if(step==='count'){const n=Number(count);if(!Number.isInteger(n)||n<1||n>30){setError('Choose 1 to 30 sets.');return}if(error)return;setStep('numbers');return}patch(a=>suggestWorkoutNumbers(a,ex.id));Keyboard.dismiss();onStart()}
 return <Screen title="" eyebrow="" header={false} narrow back saveLabel={false} resume={false} footer={<><ErrorBox text={error}/><Button title={step==='count'?'Continue':'Start exercise →'} onPress={next}/>{step==='numbers'?<Button secondary small title="Change set count" onPress={()=>setStep('count')}/>:null}</>}>
  <Label>EXERCISE SETUP · {step==='count'?'1 OF 2':'2 OF 2'}</Label><Title>{ex.name}</Title><View style={{marginTop:16}}><PreviousPerformance log={log}/></View>
  {step==='count'?<><Body>How many sets today?</Body><View style={{paddingVertical:24}}><NumberStepper label="Number of sets" large min={1} max={30} value={count} onChange={resize}/></View><Body>Starting numbers come next. Nothing is logged until you complete a set.</Body></>:set?<>
   <Body>Check your starting numbers. Previous values are editable suggestions; you can change every set while training.</Body>
   <Panel style={{padding:16}}><Label>SET {index+1} · {set.done?'LOGGED · EDITING':'NOT LOGGED'}</Label>
    <View style={{gap:12}}><NumberStepper roomy label={ex.mode==='timed'?'Seconds':'Reps'} value={set.value} onChange={value=>change({value})} min={1} step={ex.mode==='timed'?5:1}/>{['weight','added'].includes(ex.mode)?<NumberStepper roomy label={`Weight (${set.unit})`} value={set.load} onChange={load=>change({load})} step={set.unit==='lb'?5:2.5}/>:null}</View>
    {['weight','added'].includes(ex.mode)?<Button small secondary title={`Unit: ${set.unit} · change`} onPress={()=>change({unit:set.unit==='lb'?'kg':'lb'})}/>:null}
    {ex.mode==='label'?<Field label="Plate or machine label" value={set.load} onChange={load=>change({load})} placeholder="e.g. 1 plate + 25"/>:null}
    {ex.mode==='bodyweight'?<Body>Bodyweight</Body>:null}
   </Panel>
   <Body style={{fontSize:12}}>Blank sets use your first set’s numbers. Existing per-set numbers stay as entered. You can leave numbers blank and enter them at the gym.</Body>
   <View style={{gap:8}}>{log.sets.map((s,i)=><Pressable key={s.id} accessibilityRole="button" accessibilityLabel={`Configure set ${i+1}`} accessibilityState={{selected:index===i}} onPress={()=>{Keyboard.dismiss();setIndex(i)}} style={[u.row,{minHeight:48,padding:12,borderRadius:10,borderWidth:1,borderColor:index===i?C.lime:C.line}]}><Text style={{color:C.text,fontWeight:'700'}}>Set {i+1}</Text><Text style={{flex:1,color:C.muted,fontSize:12}}>{setText(s,ex.mode)}</Text></Pressable>)}</View>
  </>:null}
 </Screen>;
}
