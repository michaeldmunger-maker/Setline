import React,{useState} from 'react';
import {Keyboard,Pressable,ScrollView,Text,View} from 'react-native';
import {router} from 'expo-router';
import {groups,appendSelectedExercises,startSelectedSession,uid,type Exercise,type Group,type Mode} from '../lib/model';
import {useStore} from '../lib/store';
import {FlowTitle} from '../components/flow';
import {ExerciseChoices} from '../components/exercise-choices';
import {Body,Button,C,ErrorBox,Field,Label,Screen,u} from '../components/ui';

const modes=[['weight','Weight'],['added','Weighted bodyweight'],['bodyweight','Bodyweight'],['timed','Seconds'],['label','Plate label']] as const;
export default function ChooseExercises(){
 const {state,update}=useStore();
 const [selected,setSelected]=useState<string[]>([]),[search,setSearch]=useState(''),[filter,setFilter]=useState<Group|'All'>('All'),[error,setError]=useState('');
 const [custom,setCustom]=useState(false),[customStep,setCustomStep]=useState(0),[name,setName]=useState(''),[group,setGroup]=useState<Group>('Chest'),[mode,setMode]=useState<Mode>('weight'),[created,setCreated]=useState<Exercise[]>([]);
 const library=[...state.exercises,...created];
 const visible=library.filter(e=>!state.active?.exercises.some(log=>log.exercise.id===e.id)&&(filter==='All'||e.group===filter)&&e.name.toLowerCase().includes(search.toLowerCase()));
 function start(){try{const next=state.active?appendSelectedExercises({...state,exercises:library},selected):startSelectedSession({...state,exercises:library},selected);update(()=>next);Keyboard.dismiss();router.replace({pathname:'/workout',params:{setup:selected.join(',')}})}catch(e){setError((e as Error).message)}}
 function create(){
  Keyboard.dismiss();if(customStep<2){setCustomStep(s=>s+1);return;}
  const exercise:Exercise={id:uid(),name:name.trim(),group,mode,rest:state.prefs.rest,reference:[],note:''};
  setCreated(old=>[...old,exercise]);setSelected(old=>[...old,exercise.id]);setSearch('');setFilter('All');setName('');setCustom(false);setCustomStep(0);
 }
 if(custom)return <Screen title="" eyebrow="" header={false} narrow saveLabel={false} resume={false} footer={<><Button title={customStep===2?'Create exercise': 'Continue'} disabled={!name.trim()} onPress={create}/><Button secondary title={customStep?'Back':'Back to exercises'} onPress={()=>customStep?setCustomStep(s=>s-1):setCustom(false)}/></>}>
  <Label>CUSTOM EXERCISE · {customStep+1} OF 3</Label><FlowTitle>{customStep===0?'What’s it called?':customStep===1?'Which muscle group?':'How do you log it?'}</FlowTitle>
  {customStep===0?<Field label="Exercise name" value={name} onChange={setName} placeholder="e.g. Dumbbell bench press"/>:customStep===1?<View style={u.wrap}>{groups.map(g=><Button compact key={g} title={g} secondary={group!==g} onPress={()=>setGroup(g)}/>)}</View>:<>{modes.map(([m,label])=><Button key={m} title={label} secondary={mode!==m} onPress={()=>setMode(m)}/>)}<Body>Use a plate label if you don’t know the total weight. Seconds works for holds and hangs.</Body></>}
 </Screen>;
 return <Screen title="" eyebrow="" header={false} narrow back saveLabel={false} resume={false} footer={<><ErrorBox text={error}/><Button title={state.active?'Add & set up exercises':'Set up exercises →'} disabled={!selected.length} onPress={start}/></>}>
  <FlowTitle>What are you training?</FlowTitle>
  <Field label="Search exercises" value={search} onChange={setSearch} placeholder="Search exercises…"/>
  <Body>{selected.length?`${selected.length} ${selected.length===1?'exercise':'exercises'} selected. You can add more while you train.`:'Choose the exercises you want to do today.'}</Body>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}} contentContainerStyle={{gap:8}}>{(['All',...groups] as const).map(g=><Pressable key={g} accessibilityRole="button" accessibilityLabel={`Filter ${g}`} accessibilityState={{selected:filter===g}} onPress={()=>setFilter(g)} style={{minHeight:44,paddingHorizontal:14,justifyContent:'center',borderRadius:12,backgroundColor:filter===g?C.lime:C.panel}}><Text style={{color:filter===g?C.bg:C.text,fontSize:12,fontWeight:'700'}}>{g}</Text></Pressable>)}</ScrollView>
  {!visible.length?<Body>No matching exercises. Try another search or create your own below.</Body>:null}
  <ExerciseChoices selectionMode exercises={visible} selected={selected} onChoose={e=>setSelected(ids=>ids.includes(e.id)?ids.filter(id=>id!==e.id):[...ids,e.id])}/>
  <Button secondary title="＋ Create an exercise" onPress={()=>{Keyboard.dismiss();setCustomStep(0);setCustom(true)}}/>
 </Screen>;
}
