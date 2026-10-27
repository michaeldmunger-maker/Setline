// One queue and generation for training saves, drafts, chat and onboarding.
// A scope belongs to one mounted app generation and cannot write after reset.
export type LocalStorageBackend={getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>;removeItem:(key:string)=>Promise<void>;getAllKeys:()=>Promise<readonly string[]>};
export const RESET_KEY='setline-reset-in-progress-v1';
export const ownsKey=(key:string)=>key==='setline-v1'||key.startsWith('setline-');
export function createStorageLifecycle(backend:LocalStorageBackend){
 let generation=0,resetting=false,queue:Promise<void>=Promise.resolve(),resetTask:Promise<void>|null=null;
 function enqueue<T>(operation:()=>Promise<T>):Promise<T>{const task=queue.then(operation);queue=task.then(()=>{},()=>{});return task;}
 async function erase(){
  await backend.setItem(RESET_KEY,'1');
  const keys=(await backend.getAllKeys()).filter(key=>ownsKey(key)&&key!==RESET_KEY);
  for(const key of keys)await backend.removeItem(key);
  if((await backend.getAllKeys()).some(key=>ownsKey(key)&&key!==RESET_KEY))throw Error('Some Setline data could not be removed. Retry reset.');
 }
 function reset(clearFiles:()=>Promise<void>=async()=>{}){
  if(resetTask)return resetTask;
  resetting=true;generation++;
  resetTask=enqueue(async()=>{await erase();await clearFiles();await backend.removeItem(RESET_KEY)}).then(()=>{resetting=false}).finally(()=>{resetTask=null});
  return resetTask;
 }
 return {
  get generation(){return generation},get resetting(){return resetting},
  scope(){const epoch=generation;const current=()=>epoch===generation&&!resetting;return {
   isCurrent:current,
   async getItem(key:string){if(!current())return null;await queue;if(!current())return null;const value=await backend.getItem(key);return current()?value:null;},
   setItem(key:string,value:string){return enqueue(async()=>{if(current())await backend.setItem(key,value)})},
   removeItem(key:string){return enqueue(async()=>{if(current())await backend.removeItem(key)})},
  }},
  reset,
  async resumeReset(clearFiles:()=>Promise<void>=async()=>{}){if(await backend.getItem(RESET_KEY)!==null)await reset(clearFiles);},
  flush(){return queue},
 };
}
