import {Platform} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
const pendingFiles=new Set<Promise<unknown>>();
export function runLocalFileTask<T>(operation:()=>Promise<T>){const job=Promise.resolve().then(operation);pendingFiles.add(job);void job.then(()=>pendingFiles.delete(job),()=>pendingFiles.delete(job));return job;}
export async function removeTemporaryPhoto(uri:string){if(Platform.OS!=='web'&&FileSystem.cacheDirectory&&uri.startsWith(FileSystem.cacheDirectory))await FileSystem.deleteAsync(uri,{idempotent:true});}
export async function clearLocalFiles(){
 while(pendingFiles.size)await Promise.allSettled([...pendingFiles]);
 if(Platform.OS==='web'||!FileSystem.cacheDirectory)return;
 if(!(await FileSystem.getInfoAsync(FileSystem.cacheDirectory)).exists)return;
 const files=await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
 for(const name of files)if(name.startsWith('setline-backup-')&&name.endsWith('.json')||['ImageManipulator','ImagePicker'].includes(name))await FileSystem.deleteAsync(FileSystem.cacheDirectory+name,{idempotent:true});
}
