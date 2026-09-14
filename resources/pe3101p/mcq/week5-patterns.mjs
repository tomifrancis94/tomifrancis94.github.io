import {rng,shuffle,pick,validate} from './engine.mjs';

const specifications=[
 ['cyclic-menu','A cyclic menu',['initial','remove']],
 ['standard-pump','Successive trades',['myopic','sophisticated']],
 ['upfront-pump','Paying to end offers',['initial','remove']],
 ['independence-pump','An Independence reversal',['initial','remove']]
];
export const patternTemplates=specifications.flatMap(([slug,title,roles],family)=>roles.map((role,index)=>({id:`w5-pattern-${slug}-${index+1}`,groupId:`w5-pattern-${slug}`,groupIndex:index,week:5,revision:family===1?5:family===3||family===0&&index===0?4:3,topic:'Money pumps',title,patternFamily:family,role})));
const math=x=>`\\(${x}\\)`;
const show=x=>x==='A−'?math('A^-'):math(x);
const relation=(a,b)=>`${show(a)} ≻ ${show(b)}`;
const pairList=relations=>relations.map(([a,b])=>relation(a,b)).join('; ');
const tuple=(ids,policy)=>`(${ids.map(id=>policy[id]).join(', ')})`;
const mapping=ids=>`The entries refer to ${ids.map(x=>x.replace(/(\d)/g,n=>'₀₁₂₃₄₅₆₇₈₉'[Number(n)])).join(', ')}, respectively.`;
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function makeTree(random,definitions){
 const nodes=[],edges=[],branches={};
 for(const [id,type,outcome] of definitions.nodes)nodes.push({id,type,...(outcome?{outcome}:{})});
 for(const [id,first,second] of definitions.decisions){const swap=random()<.5;branches[id]={first:swap?'DOWN':'UP',second:swap?'UP':'DOWN'};for(const [to,label] of [[first,branches[id].first],[second,branches[id].second]].sort((a,b)=>a[1]==='UP'?-1:1))edges.push({from:id,to,label});}
 for(const [id,first,second,p] of definitions.chance||[])edges.push({from:id,to:first,label:'X',probability:p},{from:id,to:second,label:'not X',probability:1-p});
 return {tree:{root:'D1',nodes,edges},branches};
}
export function tracePattern(tree,policy,start=tree.root){const nodes=Object.fromEntries(tree.nodes.map(n=>[n.id,n]));function walk(id){const node=nodes[id];if(node.type==='terminal')return {[node.outcome]:1};const edges=tree.edges.filter(e=>e.from===id);if(node.type==='decision'){const edge=edges.find(e=>e.label===policy[id]);if(!edge)throw Error('Missing pattern choice');return walk(edge.to);}const result={};for(const edge of edges)for(const [outcome,p] of Object.entries(walk(edge.to)))result[outcome]=(result[outcome]||0)+edge.probability*p;return result;}return walk(start);}


export function solvePairwisePattern(tree,relations){const policy={},nodes=Object.fromEntries(tree.nodes.map(n=>[n.id,n]));function visit(id){if(nodes[id].type==='terminal')return nodes[id].outcome;const edges=tree.edges.filter(e=>e.from===id);if(nodes[id].type!=='decision')throw Error('Use explicit lottery comparisons for a chance pattern');if(edges.length===1){policy[id]=edges[0].label;return visit(edges[0].to);}const [a,b]=edges.map(e=>visit(e.to));const wins=relations.some(([x,y])=>x===a&&y===b)?0:relations.some(([x,y])=>x===b&&y===a)?1:null;if(wins===null)throw Error(`Unspecified pair ${a}, ${b}`);policy[id]=edges[wins].label;return wins===0?a:b;}return {outcome:visit(tree.root),policy};}
export function patternModel(family,seed){
 const random=rng((seed^Math.imul(family+31,0x9e3779b9))>>>0),d=id=>[id,'decision'],t=(id,o)=>[id,'terminal',o];
 const base=[['A','B'],['B','C'],['C','A']],paid=[...base,['A','A−'],['A−','B'],['C','A−']];
 if(family===0){const data=makeTree(random,{nodes:[d('D1'),d('D2'),t('T1','A'),t('T2','B'),t('T3','C')],decisions:[['D1','T1','D2'],['D2','T2','T3']]});return {...data,relations:base,decisions:['D1','D2']};}
 if(family===1){const data=makeTree(()=>0,{nodes:[d('D1'),d('D2'),d('D3'),t('T1','A'),t('T2','C'),t('T3','B'),t('T4','A−')],decisions:[['D1','D2','T1'],['D2','D3','T2'],['D3','T4','T3']]});return {...data,relations:paid,decisions:['D1','D2','D3'],holdings:{D1:'A',D2:'C',D3:'B'},offers:{D1:'C',D2:'B',D3:'A−'}};}
 if(family===2){const data=makeTree(random,{nodes:[d('D1'),d('D2'),d('D3'),t('T1','A−'),t('T2','B'),t('T3','C'),t('T4','A')],decisions:[['D1','T1','D2'],['D2','T2','D3'],['D3','T3','T4']]});return {...data,relations:paid,decisions:['D1','D2','D3']};}
 const p=pick(random,[.25,.75]);const data=makeTree(()=>1,{nodes:[d('D1'),['C1','chance'],['C2','chance'],d('D2'),t('T1','B−'),t('T2','C−'),t('T3','A'),t('T4','B'),t('T5','C')],decisions:[['D1','C1','C2'],['D2','T3','T4']],chance:[['C1','T1','T2',p],['C2','D2','T5',p]]});return {...data,relations:[['A','B'],['R','P'],['P','Q']],decisions:['D1','D2'],p};
}
function question(stem,correct,alternatives,explanation,random,extra={}){const options=shuffle([...new Map([[correct,explanation],...alternatives].map(([text,reason])=>[text,{text,reason,correct:text===correct}])).values()],random);if(options.length!==4)throw Error('Pattern requires exactly four distinct options');return {...extra,stem,options:options.map((o,i)=>({...o,key:`o${i}`})),explanation};}
function outcomeQuestion(stem,answer,explanation,random,extra={}){const options=['A','B','C','A−'];return question(stem,show(answer),options.filter(o=>o!==answer).map(o=>[show(o),`The prescribed choices lead to ${show(answer)}, not ${show(o)}.`]),explanation,random,extra);}
function branchQuestion(stem,correctBranch,correctReason,wrongBranch,wrongReasons,random){const correct=`${correctBranch}: ${correctReason}`;return question(stem,correct,[[`${wrongBranch}: ${wrongReasons[0]}`,'This evaluates the wrong continuation.'],[`${correctBranch}: ${wrongReasons[1]}`,'This gives a false preference comparison.'],[`${wrongBranch}: ${wrongReasons[2]}`,'This gives a false preference comparison.']],`${correctBranch} is selected because ${correctReason}`,random);}
export function instantiatePatternGroup(template,seed){
 const family=template.patternFamily??patternTemplates.find(t=>t.id===template.id||t.groupId===template.groupId)?.patternFamily;if(family===undefined)throw Error('Unknown qualitative pattern');
 seed=seed>>>0;const m=patternModel(family,seed),b=m.branches,random=rng((seed^0x27d4eb2d^family)>>>0),slug=specifications[family][0],questions=[];
 let stem=`Preferences remain fixed: ${pairList(m.relations)}.`,table,source;
 if(family===0){source='Week 5: Cyclic Preferences; Foresight — Sophisticated Choice; Decision-Tree Separability.';
  questions.push(branchQuestion('What will an agent following sophisticated choice do at D₁, and why?',b.D1.first,`${relation('A','B')}.`,b.D1.second,[`${relation('C','A')}.`,`${relation('A','C')}.`,`${relation('B','A')}.`],random));
  const changed={...m.tree,edges:m.tree.edges.filter(e=>!(e.from==='D2'&&e.to==='T2'))};const answer=solvePairwisePattern(changed,m.relations).outcome;
  questions.push(question('Suppose B is removed from the later menu, leaving only C there. What final outcome does sophisticated choice now produce?',show(answer),[[show('A'),'The remaining continuation gives C, which is preferred to A.'],[show('B'),'B has been removed.'],['No choice is prescribed because preferences are cyclic.','Every comparison needed for backward induction is specified.']],`The later continuation is C, and ${relation('C','A')}.`,random,{provided:{removedOutcome:'B'}}));
 }else if(family===1){source='Approved bank T14.E — Successive trades; Week 5: The Standard Money Pump; Foresight in the Standard Pump.';
  stem+=` The agent starts with A. At every decision, UP ends the offers with the current holding; DOWN accepts a trade. ${show('A−')} is A with a small fee deducted.`;
  questions.push(outcomeQuestion('What final holding does myopic choice produce?', 'A−',`The successive offered holdings are preferred to the current holdings: ${relation('C','A')}, ${relation('B','C')}, ${relation('A−','B')}.`,random));
  questions.push(question('What will an agent following sophisticated choice do at D₁, and why?',`${b.D1.first}: ${relation('C','A')}.`,[
   [`${b.D1.second}: ${relation('A','B')}.`,'A is preferred to B, but the sophisticated continuation gives C, not B.'],
   [`${b.D1.second}: ${relation('A','A−')}.`,'The sophisticated agent anticipates stopping at C at D₂, rather than reaching the final trade.'],
   [`${b.D1.first}: ${relation('B','A')}.`,'The stated preference is A over B; the relevant initial comparison is C against A.']
  ],`At D₃ choose ${show('A−')} over B; at D₂ choose C over ${show('A−')}; at D₁ choose ${b.D1.first} because ${relation('C','A')}.`,random));
 }else if(family===2){source='Approved bank T14.F — Paying to end the offers; Week 5: The Gustafsson–Rabinowicz Pump.';
  stem+=` ${show('A−')} is A with one fee deducted. The agent initially holds A. Accepting an offer ends the sequence.`;
  questions.push(outcomeQuestion('What final holding does sophisticated choice produce?',solvePairwisePattern(m.tree,m.relations).outcome,`At D₃ choose C over A; at D₂ choose B over C; at D₁ choose ${show('A−')} over B.`,random));
  questions.push(outcomeQuestion('Suppose C is removed from the final menu. What final holding does sophisticated choice now produce?','A',`The final continuation is A. Since ${relation('A','B')}, refuse B; since ${relation('A','A−')}, do not pay.`,random,{provided:{removedOutcome:'C'}}));
 }else{source='Week 5: The Same Trick Against Independence; The Independence Money Pump (Gustafsson Figure 14). Both lotteries are expanded; C₁ and C₂ turn on the same event.';
  const R=`B[${m.p}]C`,Q=`A[${m.p}]C`,P=`B^-[${m.p}]C^-`;
  stem=`Preferences remain fixed: ${math('A\\succ B')}; ${math(`${R}\\succ ${P}\\succ ${Q}`)}. C₁ and C₂ use the same event X. A minus means the same small fee has been deducted from that outcome.`;
  questions.push(branchQuestion('What will an agent following sophisticated choice do at D₁, and why?',b.D1.first,`${math(`${P}\\succ ${Q}`)}.`,b.D1.second,[`${math(`${R}\\succ ${P}`)}.`,`${math('B\\succ A')}.`,`${math(`${Q}\\succ ${P}`)}.`],random));
  questions.push(branchQuestion('Suppose the action giving A is removed at D₂, leaving B. What will an agent following sophisticated choice do at D₁, and why?',b.D1.second,`${math(`${R}\\succ ${P}`)}.`,b.D1.first,[`${math(`${P}\\succ ${Q}`)}.`,`${math(`${P}\\succ ${R}`)}.`,`${math(`${Q}\\succ ${P}`)}.`],random));
 }
 const descriptors=patternTemplates.filter(t=>t.patternFamily===family),groupBase={id:`w5-pattern-${slug}:r${Math.max(...descriptors.map(t=>t.revision))}:${seed}`,templateId:`w5-pattern-${slug}`,size:questions.length,title:specifications[family][1],stem,tree:freeze(m.tree),...(table?{table:freeze(table)}:{})};
 return questions.map((q,i)=>validate({...q,id:`${descriptors[i].id}:r${descriptors[i].revision}:${seed}`,templateId:descriptors[i].id,revision:descriptors[i].revision,seed,week:5,topic:'Money pumps',title:descriptors[i].title,source,generated:true,group:freeze({...groupBase,index:i})}));
}
