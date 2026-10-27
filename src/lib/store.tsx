import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {type State,initialState} from './model';
import {createPersistence,loadSavedState,type SaveStatus} from './persistence';
const Context=createContext<{state:State;update:(fn:(s:State)=>State)=>void;ready:boolean;blocked:boolean;error:string;notice:string;tell:(s:string)=>void;replace:(s:State)=>void;saveStatus:SaveStatus;retrySave:()=>void}|null>(null);
export function Provider({children}:{children:React.ReactNode}){
 const [state,setState]=useState(initialState),[ready,setReady]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState(''),[notice,tell]=useState(''),[saveStatus,setSaveStatus]=useState<SaveStatus>({status:'saving',savedAt:0,error:''});
 const persistence=useRef<ReturnType<typeof createPersistence>|null>(null);
 useEffect(()=>{let active=true;loadSavedState(AsyncStorage).then(result=>{if(!active)return;persistence.current=createPersistence(AsyncStorage,result.saved?result.state:null,setSaveStatus);setState(result.state);if(result.recovered)tell('Recovered your last readable local save. Review your latest entries.');setReady(true)}).catch(e=>{if(active){setBlocked(true);setError(e instanceof Error?e.message:'Saved data could not be loaded. Nothing has been reset.');setReady(true)}});return()=>{active=false}},[]);
 useEffect(()=>{if(!ready||blocked)return;void persistence.current?.save(state)},[state,ready,blocked]);
 useEffect(()=>{const sub=AppState.addEventListener('change',status=>{if(status!=='active')void persistence.current?.flush()});return()=>sub.remove()},[]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>tell(''),5500);return()=>clearTimeout(id)},[notice]);
 return <Context.Provider value={{state,update:fn=>setState(fn),ready,blocked,error:error||saveStatus.error,notice,tell,saveStatus,retrySave:()=>{void persistence.current?.save(state)},replace:s=>{if(!persistence.current)persistence.current=createPersistence(AsyncStorage,null,setSaveStatus);setState(s);setBlocked(false);setError('')}}}>{children}</Context.Provider>
}
export function useStore(){const v=useContext(Context);if(!v)throw Error('Setline provider missing');return v}
export function useNow(){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);return now}
