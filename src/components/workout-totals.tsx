import React from 'react';
import {Text,View} from 'react-native';
import {workoutSummary,type Session} from '../lib/model';
import {Body,C,Label,Panel,u} from './ui';

export function WorkoutTotals({session}:{session:Session}){
 const summary=workoutSummary(session);
 return <Panel><View style={[u.wrap,{gap:20}]}>{[{value:summary.exercises,label:'EXERCISES'},{value:summary.sets,label:'SETS'},{value:summary.reps,label:'REPS'},{value:summary.minutes,label:'MINUTES'}].map(s=><View key={s.label} style={{minWidth:100,flexGrow:1}}><Text style={u.stat}>{s.value}</Text><Label>{s.label}</Label></View>)}</View>
  <Label>RECORDED WEIGHT VOLUME</Label><Text style={{color:C.lime,fontSize:22,fontWeight:'800'}}>{(['lb','kg'] as const).filter(unit=>summary.volumeSets[unit]>0).map(unit=>`${summary.volume[unit].toLocaleString()} ${unit}`).join(' · ')||'—'}</Text>
  <Body style={{fontSize:11,marginBottom:0}}>Weight × reps from logged numeric weights only. lb and kg stay separate.{summary.addedLoad?' Weighted bodyweight uses added load only.':''}{summary.excludedSets?' Bodyweight, holds and plate labels are excluded.':''}{summary.seconds?` Holds: ${summary.seconds} seconds.`:''}</Body>
 </Panel>;
}
