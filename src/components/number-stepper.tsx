import React from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {C,Icon} from './ui';

export function NumberStepper({label,value,onChange,step=1,min=0,max=9999,large=false}:{label:string;value:string;onChange:(value:string)=>void;step?:number;min?:number;max?:number;large?:boolean}){
 function adjust(direction:number){const n=Number(value);onChange(String(Math.round(Math.min(max,Math.max(min,(Number.isFinite(n)?n:0)+direction*step))*100)/100))}
 return <View style={{flex:1,minWidth:0}}>
  {!large?<Text style={{color:C.muted,fontSize:12,marginBottom:10}}>{label}</Text>:null}
  <View style={{flexDirection:'row',alignItems:'center',gap:large?20:5}}>
   <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={()=>adjust(-1)} style={{width:large?62:40,height:large?62:44,borderRadius:large?31:22,alignItems:'center',justifyContent:'center',backgroundColor:'#252832',borderWidth:1,borderColor:'#343843'}}><Icon name="remove" color={C.text} size={large?30:20}/></Pressable>
   <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={C.muted} selectTextOnFocus style={{flex:1,minWidth:0,width:0,textAlign:'center',fontSize:large?68:23,fontWeight:'800',color:C.text,paddingVertical:large?16:8}}/>
   <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={()=>adjust(1)} style={{width:large?62:40,height:large?62:44,borderRadius:large?31:22,alignItems:'center',justifyContent:'center',backgroundColor:'#252832',borderWidth:1,borderColor:'#343843'}}><Icon name="add" color={C.text} size={large?30:20}/></Pressable>
  </View>
 </View>
}
