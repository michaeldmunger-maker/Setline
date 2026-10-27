import React from 'react';
import {Text} from 'react-native';
import {setText,type LogExercise} from '../lib/model';
import {C,Label,Panel} from './ui';

export function PreviousPerformance({log}:{log:LogExercise}){
 const source=log.previousSource||'';
 const title=!log.previous.length?'PREVIOUS PERFORMANCE':source==='Your plan'?'YOUR PLAN':source==='Your notes'?'YOUR NOTES':source.includes('entered by you')?'YOUR STARTING NUMBERS':`LAST WORKOUT · ${source}`;
 return <Panel style={{padding:12,marginBottom:0}}><Label>{title}</Label><Text style={{color:C.text,fontSize:13,lineHeight:21}}>{log.previous.length?log.previous.map((s,i)=>`Set ${i+1}: ${setText(s,log.exercise.mode)}`).join('  ·  '):'No previous sets yet. Start with the numbers you choose.'}</Text></Panel>;
}
