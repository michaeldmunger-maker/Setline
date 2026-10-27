import {dateKey,initialState,restore,UnsupportedVersionError,type State} from './model.ts';
// This identity is intentionally stable across app and schema versions.
export const DATA_KEY='setline-v1';
export const RECOVERY_KEY='setline-recovery-v1';
export const DAILY_KEY='setline-daily-v1';
export type Storage={getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>};
export type Snapshot={savedAt:number;state:State};
export function decodeSnapshot(raw:string):Snapshot{const d=JSON.parse(raw);if(!d||!Number.isFinite(d.savedAt)||d.savedAt<=0)throw Error('Invalid recovery copy.');return {savedAt:d.savedAt,state:restore(JSON.stringify(d.state))}}
export async function loadSavedState(storage:Storage):Promise<{state:State;recovered:boolean;saved:boolean}>{
 const primary=await storage.getItem(DATA_KEY);
 if(primary!==null){try{return {state:restore(primary),recovered:false,saved:true}}catch(e){if(e instanceof UnsupportedVersionError)throw e}}
 const recovery=await storage.getItem(RECOVERY_KEY);
 if(recovery!==null){try{return {state:decodeSnapshot(recovery).state,recovered:true,saved:true}}catch(e){if(e instanceof UnsupportedVersionError)throw e}}
 const daily=await storage.getItem(DAILY_KEY);
 if(daily!==null){try{return {state:decodeSnapshot(daily).state,recovered:true,saved:true}}catch(e){if(e instanceof UnsupportedVersionError)throw e}}
 if(primary!==null||recovery!==null||daily!==null)throw Error('Saved data could not be loaded. Nothing has been reset. Restart to retry, or restore an exported backup.');
 return {state:initialState(),recovered:false,saved:false};
}
export async function getSnapshots(storage:Storage){const snapshots:({label:string}&Snapshot)[]=[];for(const [key,label] of [[RECOVERY_KEY,'Previous save'],[DAILY_KEY,'Daily recovery copy']]){const raw=await storage.getItem(key);if(raw){try{snapshots.push({label,...decodeSnapshot(raw)})}catch{/* Invalid copies are preserved, never offered for replacement. */}}}return snapshots}
export type SaveStatus={status:'saving'|'saved'|'error';savedAt:number;error:string};
export function createPersistence(storage:Storage,initial:State|null,onStatus:(s:SaveStatus)=>void,now=()=>Date.now()){
 let previous=initial?JSON.stringify(initial):null,queue=Promise.resolve(),revision=0;
 return {save(state:State){const raw=JSON.stringify(state),id=++revision;onStatus({status:'saving',savedAt:0,error:''});const operation=queue.then(async()=>{
  const time=now();
  // Save a validated, previous snapshot BEFORE replacing the primary copy.
  if(previous&&previous!==raw){const snapshot=JSON.stringify({savedAt:time,state:JSON.parse(previous)});await storage.setItem(RECOVERY_KEY,snapshot);const daily=await storage.getItem(DAILY_KEY);let dailyDate='';if(daily){try{dailyDate=dateKey(new Date(decodeSnapshot(daily).savedAt))}catch{/* Keep the valid previous state as the next daily copy. */}}if(dailyDate!==dateKey(new Date(time)))await storage.setItem(DAILY_KEY,snapshot)}
  await storage.setItem(DATA_KEY,raw);previous=raw;
  if(id===revision)onStatus({status:'saved',savedAt:time,error:''});
 });queue=operation.catch(()=>{if(id===revision)onStatus({status:'error',savedAt:0,error:'Changes could not be saved. Keep the app open, retry saving, or export a backup before closing.'})});return queue},flush(){return queue}};
}
