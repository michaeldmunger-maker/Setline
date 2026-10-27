import React,{useState} from 'react';
import {Keyboard,TextInput,View} from 'react-native';
import {exportBackup} from '../lib/backup';
import {completedSets,discardCurrentWorkout} from '../lib/model';
import {useStore} from '../lib/store';
import {Body,Button,C,ErrorBox,Label,Title,u} from './ui';

export function DataResetControls(){
 const {state,update,tell,resetLocalData}=useStore();
 const [discard,setDiscard]=useState(false),[reset,setReset]=useState<'none'|'backup'|'confirm'>('none'),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function backup(){setBusy(true);setError('');try{await exportBackup(state);tell('Backup prepared. Save it outside Setline before continuing.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <View style={{marginTop:28,paddingTop:22,borderTopWidth:1,borderColor:C.line}}>
  <Label>RESET CONTROLS</Label><Title>Choose exactly what to clear.</Title><ErrorBox text={error}/>
  {discard&&state.active?<><Body>Discard “{state.active.name}”? Its unfinished session, including {completedSets(state.active)} logged but unsaved sets, will be removed. Saved workout history, starting numbers, food, plans and settings will stay.</Body><Button title="Confirm discard current workout" color={C.pink} onPress={()=>{update(discardCurrentWorkout);setDiscard(false);tell('Unfinished workout discarded. Saved history is unchanged.')}}/><Button secondary title="Keep current workout" onPress={()=>setDiscard(false)}/></>:<><Button secondary title="Discard current workout" disabled={!state.active||reset!=='none'} onPress={()=>setDiscard(true)}/>{!state.active?<Body style={{fontSize:11}}>There’s no unfinished workout to discard.</Body>:null}</>}
  {reset==='none'?<Button secondary title="Reset Setline" onPress={()=>{setReset('backup');setDiscard(false);setError('')}}/>:reset==='backup'?<>
   <Body>Want a backup first? Export a JSON file of your training, food, plans and preferences. Arnold drafts, chat and connection settings are not included in this backup.</Body>
   <Button title={busy?'Preparing backup…':'Export JSON backup'} disabled={busy} onPress={()=>void backup()}/>
   <Body style={{fontSize:11}}>On iPhone, choose Save to Files outside Setline. Closing the share sheet doesn’t confirm that you saved the file.</Body>
   <Button secondary title="Continue to reset confirmation" disabled={busy} onPress={()=>{setConfirmation('');setReset('confirm')}}/><Button secondary title="Cancel reset" disabled={busy} onPress={()=>setReset('none')}/>
  </>:<>
   <Body>Reset deletes ALL local Setline workout history, the current session, starting numbers, custom exercises and routines, food, schedules, preferences, import drafts, Arnold chat, saved connection settings, onboarding progress, recovery copies and temporary import/backup files. Setline will return to its original first-launch experience.</Body>
   <Body>Files you saved outside Setline are kept. This affects this device/browser only. It does not delete a server-side API key or any external account.</Body>
   <View style={{marginBottom:17}}><Label>Type RESET to confirm</Label><TextInput accessibilityLabel="Type RESET to confirm" autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} value={confirmation} onChangeText={setConfirmation} placeholder="RESET" placeholderTextColor={C.muted} style={u.input}/></View>
   <Button title="Delete local data & reset Setline" color={C.pink} disabled={confirmation!=='RESET'} onPress={()=>void resetLocalData()}/><Button secondary title="Cancel reset" onPress={()=>{setReset('none');setConfirmation('')}}/>
  </>}
 </View>;
}
