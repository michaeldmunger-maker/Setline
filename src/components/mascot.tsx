import React from 'react';
import {Image,View} from 'react-native';
const artwork=require('../../assets/arnold/welcome.png');
export function Mascot({height=240,onLoad,onError}:{height?:number;onLoad?:()=>void;onError?:()=>void}){return <Image source={artwork} onLoad={onLoad} onError={onError} fadeDuration={0} accessibilityLabel="Arnold, your weight-plate training buddy" resizeMode="contain" style={{width:'100%',height}}/>}
export function ArnoldAvatar({size=48}:{size?:number}){return <View accessible accessibilityLabel="Arnold" style={{width:size,height:size,borderRadius:size/2,overflow:'hidden',backgroundColor:'#1F2620',borderWidth:1,borderColor:'#CCFF5540'}}><Image source={artwork} resizeMode="contain" style={{position:'absolute',width:size*2,height:size*2,left:-size*.45,top:-size*.08}}/></View>}
