import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ActivityIndicator,View} from 'react-native';
import Recovery from '../components/recovery';
import {Provider,useStore} from '../lib/store';
import {needsWelcome} from '../lib/model';
import {Body,Button,C,Panel,Screen} from '../components/ui';
function AppContent(){const {ready,blocked,state,resetting,resetFailure,resetLocalData}=useStore();if(resetting)return <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={C.lime}/><Body>Resetting Setline…</Body></View>;if(resetFailure)return <Screen title="Finish resetting Setline" eyebrow="DATA & PRIVACY" saveLabel={false} resume={false}><Panel><Body>{resetFailure}</Body><Button title="Retry reset" onPress={()=>void resetLocalData()}/></Panel></Screen>;if(!ready)return <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={C.lime}/></View>;if(blocked)return <Recovery/>;return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}><Stack.Protected guard={!needsWelcome(state)}><Stack.Screen name="(tabs)"/><Stack.Screen name="workout"/><Stack.Screen name="choose-exercises"/><Stack.Screen name="routine/[id]"/><Stack.Screen name="exercise/[id]"/><Stack.Screen name="history/[id]"/><Stack.Screen name="schedule"/><Stack.Screen name="nutrition"/></Stack.Protected><Stack.Screen name="welcome"/></Stack>}
export default function Layout(){return <SafeAreaProvider><Provider><StatusBar style="light"/><AppContent/></Provider></SafeAreaProvider>}
