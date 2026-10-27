import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {C,Icon} from './ui';
export function FlowHeader({step=1,onBack,action}:{step?:number;onBack:()=>void;action?:React.ReactNode}){return <View style={{flexDirection:'row',alignItems:'center',marginBottom:30}}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={{padding:10,marginLeft:-10}}><Icon name="chevron-back" color={C.text}/></Pressable><View style={{flexDirection:'row',gap:6,position:'absolute',left:'35%'}}>{[1,2,3].map(n=><View key={n} style={{width:34,height:7,borderRadius:4,backgroundColor:n===step?C.lime:'#2A303A'}}/>)}</View><View style={{marginLeft:'auto'}}>{action}</View></View>}
export function FlowTitle({children}:{children:React.ReactNode}){return <Text style={{color:C.text,fontSize:29,lineHeight:35,fontWeight:'800',letterSpacing:-.8,marginBottom:12}}>{children}</Text>}
