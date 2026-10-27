import {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createStorageLifecycle} from './storage-lifecycle';
export const localStorage=createStorageLifecycle(AsyncStorage);
export function useLocalStorage(){const [scope]=useState(()=>localStorage.scope());return scope;}
