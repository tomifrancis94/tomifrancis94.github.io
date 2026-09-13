import {rng, pick, shuffle, fmt, tex, validate} from './engine.mjs';
import {patternTemplates,instantiatePatternGroup} from './week5-patterns.mjs';




const EPS=1e-9;
const families=[
 ['changing-decisions','Changing preferences',['sophisticatedAction','removedAction','reachableChanceValue']]
];
const utilityTemplates=families.flatMap(([slug,title,roles],f)=>roles.map((role,index)=>({
 id:`w5-${slug}-${index+1}`,groupId:`w5-${slug}`,groupIndex:index,week:5,revision:4,
 topic:'Dynamic choice',title:`${title}: ${roleTitle(role)}`,familyIndex:f,role
})));
export const week5Templates=[...patternTemplates,...utilityTemplates];
function roleTitle(role){return ({sophisticatedAction:'Action at D₁',removedAction:'Action after a menu change',reachableChanceValue:'A reachable chance prospect'})[role]||role;}
function freeze(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function graph(model){const nodes=new Map(model.tree.nodes.map(n=>[n.id,n]));const children=new Map(model.tree.nodes.map(n=>[n.id,model.tree.edges.filter(e=>e.from===n.id)]));return {nodes,children};}
const add=(target,source,weight=1)=>{for(const [o,p] of Object.entries(source))target[o]=(target[o]||0)+weight*p;return target;};
const clean=d=>Object.fromEntries(Object.entries(d).filter(([,p])=>p>EPS).sort(([a],[b])=>a.localeCompare(b)).map(([o,p])=>[o,Math.round(p*1e9)/1e9]));
const signature=d=>JSON.stringify(clean(d));
export const week5ExpectedUtility=(distribution,row)=>Object.entries(distribution).reduce((s,[o,p])=>s+p*row[o],0);

export function evaluateWeek5Plan(model,policy,start=model.tree.root){
 const {nodes,children}=graph(model);
 function visit(id){const n=nodes.get(id);if(n.type==='terminal')return {[n.outcome]:1};const edges=children.get(id);
  if(n.type==='chance')return clean(edges.reduce((d,e)=>add(d,visit(e.to),e.probability),{}));
  const edge=edges.find(e=>e.label===policy[id]);if(!edge)throw Error(`Missing branch at ${id}`);return visit(edge.to);
 }return clean(visit(start));
}



export function optimiseWeek5(model,rowId,start=model.tree.root){
 const {nodes,children}=graph(model),policy={},row=model.utilities[rowId];
 function visit(id){const n=nodes.get(id);if(n.type==='terminal')return {[n.outcome]:1};const edges=children.get(id),ds=edges.map(e=>visit(e.to));
  if(n.type==='chance')return clean(ds.reduce((d,x,i)=>add(d,x,edges[i].probability),{}));
  if(edges.length===1){policy[id]=edges[0].label;return ds[0];}
  const values=ds.map(d=>week5ExpectedUtility(d,row));if(Math.abs(values[0]-values[1])<EPS)throw Error('Tied continuation');
  const best=values[0]>values[1]?0:1;policy[id]=edges[best].label;return ds[best];
 }const distribution=visit(start);return {policy,distribution};
}

export function solveWeek5(model){
 const {nodes,children}=graph(model),sophPolicy={};
 function backward(id){const n=nodes.get(id);if(n.type==='terminal')return {[n.outcome]:1};const edges=children.get(id),ds=edges.map(e=>backward(e.to));
  if(n.type==='chance')return clean(ds.reduce((d,x,i)=>add(d,x,edges[i].probability),{}));
  if(edges.length===1){sophPolicy[id]=edges[0].label;return ds[0];}
  const values=ds.map(d=>week5ExpectedUtility(d,model.utilities[id]));if(Math.abs(values[0]-values[1])<EPS)throw Error('Tied sophisticated comparison');
  const best=values[0]>values[1]?0:1;sophPolicy[id]=edges[best].label;return ds[best];
 }
 const sophDistribution=backward(model.tree.root),initial=optimiseWeek5(model,'D1'),naivePolicy={};
 for(const id of model.decisions)naivePolicy[id]=optimiseWeek5(model,id,id).policy[id];
 return {initial,naive:{policy:naivePolicy,distribution:evaluateWeek5Plan(model,naivePolicy)},sophisticated:{policy:sophPolicy,distribution:sophDistribution},resolute:initial};
}

export function enumerateWeek5Plans(model){return Array.from({length:2**model.decisions.length},(_,bits)=>Object.fromEntries(model.decisions.map((id,i)=>[id,(bits>>i)&1?'DOWN':'UP'])));}

const prospectText=d=>{const entries=Object.entries(clean(d));if(entries.length===1)return `\\(${entries[0][0]}\\) for certain`;if(entries.length===2)return `\\(${entries[0][0]}[${tex(entries[0][1])}]${entries[1][0]}\\)`;throw Error('Only binary prospects are displayed');};
function choices(correct,wrong,explanation,random){
 const seen=new Set([String(correct)]),pool=[];for(const [text,reason] of wrong){if(!seen.has(String(text))){seen.add(String(text));pool.push({text:String(text),correct:false,reason});}}
 if(pool.length<3)throw Error(`Insufficient distractors for ${correct}`);

 const selected=shuffle(pool,random).slice(0,3);
 return shuffle([{text:String(correct),correct:true,reason:explanation},...selected].map((o,i)=>({...o,key:`o${i}`})),random);
}
function allProspects(model,plans,start=model.tree.root){const map=new Map();for(const p of plans){const d=evaluateWeek5Plan(model,p,start);map.set(signature(d),d);}return [...map.values()];}
function makeChanceValue(model,distribution,random,rowId='D1'){
 const row=model.utilities[rowId],answer=week5ExpectedUtility(distribution,row),plans=enumerateWeek5Plans(model);
 const wrong=allProspects(model,plans,'C1').map(d=>[fmt(week5ExpectedUtility(d,row)),'This evaluates the other available continuation.']);
 for(const [outcome,u] of Object.entries(row))wrong.push([fmt(u),`This uses the utility of ${outcome} alone.`]);
 wrong.push([fmt(week5ExpectedUtility(distribution,model.utilities[rowId==='D1'?'D2':'D1'])),'This uses the other utility row.']);
 const terms=Object.entries(distribution),sum=terms.reduce((v,[o])=>v+row[o],0);
 wrong.push([fmt(sum),'This adds utilities without probability weights.'],[fmt(sum/terms.length),'This gives both outcomes equal probability.']);
 const explanation=terms.map(([o,p])=>`${fmt(p)} × ${row[o]}`).join(' + ')+` = ${fmt(answer)}, using the ${rowId} row.`;
 return {stem:`Using the ${rowId} utility row, what is the expected utility of ${prospectText(distribution)}?`,options:choices(fmt(answer),wrong,explanation,random),explanation,provided:{prospect:distribution,row:rowId,start:'C1',reachable:true}};
}

export function generateWeek5Model(seed,familyIndex=0){
 const random=rng(((seed>>>0)^Math.imul(familyIndex+1,0x9e3779b9))>>>0);
 const p=pick(random,[.25,.75]),high=pick(random,[8,12]),low=pick(random,[0,2]),common=pick(random,[0,2,4]);
 const bad=p*low+(1-p)*common,good=p*high+(1-p)*common;
 const safe=pick(random,Array.from({length:12},(_,i)=>i+1).filter(x=>bad<x&&x<good&&x<high));
 if(safe===undefined)throw Error('No simple safe utility');
 const rootStop=random()<.5?'UP':'DOWN',laterB=random()<.5?'UP':'DOWN',opposite=x=>x==='UP'?'DOWN':'UP';
 const nodes=[{id:'D1',type:'decision'},{id:'T1',type:'terminal',outcome:'A'},{id:'C1',type:'chance'},{id:'D2',type:'decision'},{id:'T2',type:'terminal',outcome:'B'},{id:'T3',type:'terminal',outcome:'C'},{id:'T4',type:'terminal',outcome:'D'}];
 const actions=(id,options)=>options.sort((a,b)=>a.label==='UP'?-1:1).map(e=>({from:id,...e}));
 const edges=[...actions('D1',[{to:'T1',label:rootStop},{to:'C1',label:opposite(rootStop)}]),{from:'C1',to:'D2',label:'X',probability:p},{from:'C1',to:'T4',label:'not X',probability:1-p},...actions('D2',[{to:'T2',label:laterB},{to:'T3',label:opposite(laterB)}])];
 return {tree:{root:'D1',nodes,edges},decisions:['D1','D2'],outcomes:['A','B','C','D'],utilities:{D1:{A:safe,B:high,C:low,D:common},D2:{A:safe,B:high,C:high+2,D:common}},chanceSelected:true,stableUtilities:false,p,rootStop,laterB};
}

export function instantiateWeek5Group(template,seed){
 if(template.patternFamily!==undefined||String(template.groupId||template.id).startsWith('w5-pattern-'))return instantiatePatternGroup(template,seed);
 const family=template.familyIndex??utilityTemplates.find(t=>t.id===template.id||t.groupId===template.groupId||t.groupId===template.id)?.familyIndex;
 if(family===undefined)throw Error('Unknown Week 5 template');seed=seed>>>0;
 const model=generateWeek5Model(seed,family),solved=solveWeek5(model),plans=enumerateWeek5Plans(model),random=rng((seed^Math.imul(family+17,0x85ebca6b))>>>0);
 const p=model.p,other=model.rootStop==='UP'?'DOWN':'UP',good={B:p,D:1-p},bad={C:p,D:1-p};
 const removed=model.tree.edges.find(e=>e.from==='D2'&&e.to==='T3');
 const makeAction=modified=>{
 const selected=modified?other:model.rootStop;
 const correct=!modified?`${selected}: ${prospectText(bad)} is worse than A using the D₁ row.`:`${selected}: ${prospectText(good)} is better than A using the D₁ row.`;
 const wrong=!modified?[
 [`${other}: ${prospectText(good)} is better than A using the D₁ row.`,'This assumes B will be chosen later, despite the preference change.'],
 [`${selected}: ${prospectText(good)} is worse than A using the D₁ row.`,'The displayed D₁ utilities give the opposite comparison.'],
 [`${other}: ${prospectText(bad)} is better than A using the D₂ row.`,'This evaluates the initial choice with the later preferences rather than the D₁ preferences.']
 ]:[
 [`${model.rootStop}: ${prospectText(bad)} is worse than A using the D₁ row.`,'C is no longer available at the later decision, so this is not the remaining continuation.'],
 [`${other}: ${prospectText(bad)} is better than A using the D₂ row.`,'This uses both the wrong continuation and the later utility row for the initial decision.'],
 [`${model.rootStop}: ${prospectText(good)} is worse than A using the D₁ row.`,'The displayed D₁ utilities give the opposite comparison.']
 ];
 const explanation=!modified?`At D₂ the agent prefers C. At D₁, evaluate ${prospectText(bad)} using the D₁ row; A is better, so choose ${selected}.`:`With C removed, the later outcome on X is B. At D₁, ${prospectText(good)} is better than A, so choose ${selected}.`;
 return {stem:!modified?'What will an agent following sophisticated choice do at D₁, and why?':`Suppose the ${removed.label} action at D₂, giving C, is removed. What will an agent following sophisticated choice do at D₁, and why?`,options:choices(correct,wrong,explanation,random),explanation,provided:{procedure:'sophisticated',node:'D1',...(modified?{removedEdge:removed}:{})}};
 };
 const items=[makeAction(false),makeAction(true),makeChanceValue(model,bad,random,'D2')];
 const descriptors=utilityTemplates.filter(t=>t.familyIndex===family),groupId=`w5-${families[family][0]}`;
 const tree=freeze(structuredClone(model.tree)),table=freeze({headers:['Utility at',...model.outcomes],rows:model.decisions.map(id=>[id,...model.outcomes.map(o=>String(model.utilities[id][o]))])});
 const typography=text=>text.replace(/\b([DC])(\d+)\b/g,(_,letter,digits)=>letter+[...digits].map(n=>'₀₁₂₃₄₅₆₇₈₉'[Number(n)]).join(''));
 const groupBase={id:`${groupId}:r4:${seed}`,templateId:groupId,size:3,title:families[family][1],stem:'The agent evaluates prospects by expected utility. She knows the tree and that her preferences will change from the D₁ row to the D₂ row.',tree,table};
 return items.map((q,index)=>{const t=descriptors[index];return validate({...q,stem:typography(q.stem),explanation:typography(q.explanation),options:q.options.map(o=>({...o,text:typography(o.text),reason:typography(o.reason)})),id:`${t.id}:r4:${seed}`,templateId:t.id,revision:4,seed,week:5,topic:t.topic,title:roleTitle(t.role),source:'Week 5: Sophisticated Choice; A Simple Example. One anticipated preference change and reachable-prospect expected utility.',generated:true,group:freeze({...groupBase,index})});});
}
