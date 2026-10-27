import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {type State,initialState,completeWelcome} from './model';
import {createPersistence,loadSavedState,type SaveStatus} from './persistence';
import {localStorage} from './local-storage';
import {clearLocalFiles} from './local-files';
const Context=createContext<{state:State;update:(fn:(s:State)=>State)=>void;ready:boolean;blocked:boolean;error:string;notice:string;tell:(s:string)=>void;replace:(s:State)=>void;saveStatus:SaveStatus;retrySave:()=>void;resetLocalData:()=>Promise<void>;finishOnboarding:()=>Promise<void>;resetting:boolean;resetFailure:string}|null>(null);
export function Provider({children}:{children:React.ReactNode}){
 const [state,setState]=useState(initialState),[ready,setReady]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saveStatus,setSaveStatus]=useState<SaveStatus>({status:'saving',savedAt:0,error:''});
 const [epoch,setEpoch]=useState(0),[resetting,setResetting]=useState(false),[resetFailure,setResetFailure]=useState('');
 const persistence=useRef<ReturnType<typeof createPersistence>|null>(null),resetBusy=useRef(false);
 useEffect(()=>{let active=true;(async()=>{await localStorage.resumeReset(clearLocalFiles);const scope=localStorage.scope();const result=await loadSavedState(scope);if(!active||!scope.isCurrent())return;persistence.current=createPersistence(scope,result.saved?result.state:null,setSaveStatus);setState(result.state);if(result.recovered)setNotice('Recovered your last readable local save. Review your latest entries.');setReady(true)})().catch(e=>{if(!active)return;if(localStorage.resetting)setResetFailure('Reset could not finish. Retry before using Setline.');else{setBlocked(true);setError(e instanceof Error?e.message:'Saved data could not be loaded. Nothing has been reset.')}setReady(true)});return()=>{active=false;void persistence.current?.dispose()}},[]);
 useEffect(()=>{if(!ready||blocked||resetting||resetFailure)return;void persistence.current?.save(state)},[state,ready,blocked,resetting,resetFailure,epoch]);
 useEffect(()=>{const sub=AppState.addEventListener('change',status=>{if(status!=='active')void persistence.current?.flush()});return()=>sub.remove()},[]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),5500);return()=>clearTimeout(id)},[notice]);
 const generation=localStorage.generation;
 const current=()=>generation===localStorage.generation&&!localStorage.resetting&&!resetBusy.current;
 async function finishOnboarding(){const writer=persistence.current;if(!current()||!writer)throw Error('Setline is not ready to save. Please try again.');const next=completeWelcome(state);await writer.save(next);if(writer.lastError)throw Error(writer.lastError);if(current())setState(next)}
 async function resetLocalData(){
  if(resetBusy.current)return;resetBusy.current=true;setResetting(true);setResetFailure('');
  const draining=persistence.current?.dispose();persistence.current=null;
  try{
   await localStorage.reset(clearLocalFiles);await draining;
   persistence.current=createPersistence(localStorage.scope(),null,setSaveStatus);
   setState(initialState());setEpoch(e=>e+1);setBlocked(false);setError('');setNotice('');
  }catch{setResetFailure('Reset could not finish. Some local data may remain. Keep Setline open and retry; old recovery copies will not be loaded.')}finally{resetBusy.current=false;setResetting(false)}
 }
 return <Context.Provider value={{state,update:fn=>{if(current())setState(fn)},ready,blocked,error:error||saveStatus.error,notice,tell:s=>{if(current())setNotice(s)},saveStatus,resetLocalData,finishOnboarding,resetting,resetFailure,retrySave:()=>{if(current())void persistence.current?.save(state)},replace:s=>{if(!current())return;if(!persistence.current)persistence.current=createPersistence(localStorage.scope(),null,setSaveStatus);setState(s);setBlocked(false);setError('')}}}><React.Fragment key={epoch}>{children}</React.Fragment></Context.Provider>
}
export function useStore(){const v=useContext(Context);if(!v)throw Error('Setline provider missing');return v}
export function useNow(){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);return now}
