import {Platform} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {dateKey,type State} from './model';
export async function exportBackup(state:State){const text=JSON.stringify(state,null,2),name=`setline-backup-${dateKey()}-${Date.now()}.json`;if(Platform.OS==='web'){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);return}if(!FileSystem.cacheDirectory||!await Sharing.isAvailableAsync())throw Error('File sharing is not available on this device.');const path=FileSystem.cacheDirectory+name;await FileSystem.writeAsStringAsync(path,text,{encoding:FileSystem.EncodingType.UTF8});await Sharing.shareAsync(path,{mimeType:'application/json',UTI:'public.json',dialogTitle:'Save your Setline backup'});}
