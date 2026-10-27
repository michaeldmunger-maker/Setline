export const ONBOARDING_KEY='setline-onboarding-progress';
export const welcomeSteps=['intro','hello','choose','methods','import','fresh','saved','walkthrough'] as const;
export type WelcomeStep=typeof welcomeSteps[number];
export function readOnboardingProgress(raw:string|null){
 const fallback={step:'intro' as WelcomeStep,method:'text' as 'text'|'photo',guideIndex:0,reviewDraft:false,kind:'routine' as 'routine'|'history',savedName:'',savedCount:0,savedAs:'maxes' as 'routine'|'history'|'maxes'};
 if(!raw)return fallback;
 try{const p=JSON.parse(raw);if(!p||!welcomeSteps.includes(p.step))return fallback;return {...fallback,step:p.step as WelcomeStep,method:p.method==='photo'?'photo' as const:'text' as const,guideIndex:[0,1,2].includes(p.guideIndex)?Number(p.guideIndex):0,reviewDraft:p.reviewDraft===true,kind:p.kind==='history'?'history' as const:'routine' as const,savedName:typeof p.savedName==='string'?p.savedName:'',savedCount:Number.isInteger(p.savedCount)&&p.savedCount>=0?p.savedCount:0,savedAs:['routine','history','maxes'].includes(p.savedAs)?p.savedAs as 'routine'|'history'|'maxes':'maxes' as const}}catch{return fallback}
}
