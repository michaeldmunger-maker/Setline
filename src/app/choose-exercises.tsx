import React,{useState} from 'react';
import {View} from 'react-native';
import {router} from 'expo-router';
import {groups,appendSelectedExercises,startSelectedSession,uid,type Exercise,type Group,type Mode} from '../lib/model';
import {useStore} from '../lib/store';
import {FlowTitle} from '../components/flow';
import {ExerciseChoices} from '../components/exercise-choices';
import {Body,Button,ErrorBox,Field,Label,Panel,Screen,Title,u} from '../components/ui';
export default function ChooseExercises(){
 const {state,update}=useStore();const [selected,setSelected]=useState<string[]>([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[custom,setCustom]=useState(false),[name,setName]=useState(''),[group,setGroup]=useState<Group>('Chest'),[mode,setMode]=useState<Mode>('weight'),[created,setCreated]=useState<Exercise[]>([]);
 const library=[...state.exercises,...created];
 function start(){try{const next=state.active?appendSelectedExercises({...state,exercises:library},selected):startSelectedSession({...state,exercises:library},selected);update(()=>next);router.replace('/workout')}catch(e){setError((e as Error).message)}}
 return <Screen title="" eyebrow="" header={false} narrow back saveLabel={false} resume={false} footer={<><ErrorBox text={error}/><Button title={state.active?'Add exercises':'Start training'} disabled={!selected.length} onPress={start}/></>}>
  <FlowTitle>What are you training?</FlowTitle>
  <Field label="Search exercises" value={search} onChange={setSearch} placeholder="Search exercises…"/>
  <Body>{selected.length?`${selected.length} ${selected.length===1?'exercise':'exercises'} selected. You can add more while you train.`:'Choose the exercises you want to do today.'}</Body>
  <ExerciseChoices exercises={library.filter(e=>!state.active?.exercises.some(log=>log.exercise.id===e.id)).filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))} selected={selected} onChoose={e=>setSelected(ids=>ids.includes(e.id)?ids.filter(id=>id!==e.id):[...ids,e.id])}/>
  {custom?<Panel style={{marginTop:20}}><Title>Create an exercise</Title><Field label="Exercise name" value={name} onChange={setName}/><Label>MUSCLE GROUP</Label><View style={u.wrap}>{groups.map(g=><Button small key={g} title={g} secondary={group!==g} onPress={()=>setGroup(g)}/>)}</View><Label>HOW YOU LOG IT</Label><View style={u.wrap}>{([['weight','Weight'],['bodyweight','Bodyweight'],['timed','Seconds'],['label','Plate label']] as const).map(([m,label])=><Button small key={m} title={label} secondary={mode!==m} onPress={()=>setMode(m)}/>)}</View><Button title="Add exercise" disabled={!name.trim()} onPress={()=>{const e:Exercise={id:uid(),name:name.trim(),group,mode,rest:state.prefs.rest,reference:[],note:''};setCreated(old=>[...old,e]);setSelected(old=>[...old,e.id]);setSearch('');setName('');setCustom(false)}}/></Panel>:<Button secondary title="＋ Create an exercise" onPress={()=>setCustom(true)}/>}

 </Screen>;
}
