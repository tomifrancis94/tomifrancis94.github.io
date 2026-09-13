import {pick,shuffle,fmt,tex,nice} from './engine.mjs';
const M=x=>`\\(${x}\\)`,eu=(u,p)=>u.reduce((s,x,i)=>s+x*p[i],0);
const probs=[[.2,.3,.5],[.25,.5,.25],[.5,.3,.2],[.5,.25,.25]];
const values=[0,2,4,6,8,10,12];
export const week3Templates=[];
function generated(id,title,section,generate){week3Templates.push({id:'w3-g'+String(id).padStart(2,'0'),week:3,revision:1,topic:'Causal and evidential decision theory',title,source:'Week 3 lecture notes '+section,generate});}
function fixed(id,title,section,stem,correct,wrong,explanation){week3Templates.push({id:'w3-s'+String(id).padStart(2,'0'),week:3,revision:1,topic:'Causal and evidential decision theory',title,source:'Week 3 lecture notes '+section,stem,options:[{text:correct,correct:true,reason:explanation},...wrong.map(([text,reason])=>({text,correct:false,reason}))],explanation});}
function numeric(stem,answer,wrong,explanation,extra={}){
 answer=Math.round(answer*1e9)/1e9;
 const unique=new Set([answer]),options=[{text:M(tex(answer)),value:answer,correct:true,reason:explanation}];
 for(const [v,reason] of wrong){const x=Math.round(v*1e9)/1e9;if(!nice(x)||unique.has(x))continue;unique.add(x);options.push({text:M(tex(x)),value:x,correct:false,reason});}
 if(options.length<4)throw Error('Resample distinct numerical alternatives');
 return {stem,options,balancedPool:true,explanation,...extra};
}
function weightedWrong(u,p,other=[]){const answer=eu(u,p),sum=u.reduce((s,x)=>s+x,0);return [
 [sum,'This adds the utilities without weighting them.'],[sum/u.length,'This treats the states as equally likely.'],
 [eu(u,p.slice(1).concat(p[0])),'This attaches the credences to the wrong states.'],
 [Math.max(...u),'This reports the best possible utility.'],[Math.min(...u),'This reports the worst possible utility.'],
 ...u.map((x,i)=>[p[i]*x,'This includes just one state’s contribution.']),
 ...u.map((x,i)=>[answer-p[i]*x,'This leaves out one state’s contribution.']),
 [answer/p[0],'This divides by a state credence after the probabilities already sum to one.'],
 [answer*p[0],'This applies an extra state-probability factor.'],
 ...other.map(x=>[x,'This is the expected utility of the other act.'])];}
function decisionTable(rows,p,letter='S'){return {headers:['',...p.map((_,i)=>M(letter+'_'+(i+1)))],rows:[['Credence',...p.map(x=>M(tex(x)))],...rows.map((u,i)=>[M('A_'+(i+1)),...u.map(String)])]};}

generated(1,'Evidential utility with independent states','§3.1, Evidential decision theory: formulation 1',r=>{
 const p=pick(r,probs),rows=[shuffle(values,r).slice(0,3),shuffle(values,r).slice(0,3)],target=pick(r,[0,1]),answer=eu(rows[target],p);
 return numeric(`${M('S_1,S_2,S_3')} partition the possibilities and are probabilistically independent of the available acts. The entries are utilities. What is the evidential expected utility of ${M('A_'+(target+1))}?`,answer,weightedWrong(rows[target],p,[eu(rows[1-target],p)]),`Weight that act’s utilities by the state credences. The result is ${M(tex(answer))}.`,{table:decisionTable(rows,p),data:{kind:'independentEEU',p,rows,target}});
});

generated(2,'Choosing with act-conditional credences','§3.2, Evidential expected utility, generalised',r=>{
 const ps=Array.from({length:4},()=>pick(r,[.25,.5,.75])),rows=Array.from({length:4},()=>shuffle(values,r).slice(0,2)),expected=rows.map((u,i)=>eu(u,[ps[i],1-ps[i]]));
 if(new Set(rows.map((u,i)=>JSON.stringify([ps[i],...u]))).size!==4)throw Error('Resample distinct act rows');
 const max=Math.max(...expected);if(expected.filter(x=>x===max).length!==1)throw Error('Resample unique recommendation');const best=expected.indexOf(max);
 const unweighted=rows.map(u=>(u[0]+u[1])/2),unweightedMax=Math.max(...unweighted);
 if(unweighted.filter(x=>x===unweightedMax).length!==1||unweighted.indexOf(unweightedMax)===best)throw Error('Conditional weights must change the recommendation');
 const explanation=`The evidential expected utilities of A₁, A₂, A₃ and A₄ are ${expected.map(fmt).join(', ')}, respectively. A${'₁₂₃₄'[best]} has the greatest value.`;
 return {stem:`${M('S_1,S_2')} partition the possibilities. The table gives act-conditional credences and outcome utilities. Which act does evidential decision theory recommend?`,table:{headers:['Act',M('\\operatorname{Cr}(S_1\\mid A_i)'),M('\\operatorname{Cr}(S_2\\mid A_i)'),M('U(A_i,S_1)'),M('U(A_i,S_2)')],rows:rows.map((u,i)=>[M('A_'+(i+1)),M(tex(ps[i])),M(tex(1-ps[i])),...u.map(String)])},options:rows.map((_,i)=>({text:M('A_'+(i+1)),correct:i===best,reason:i===best?explanation:`Its evidential expected utility is ${fmt(expected[i])}, below ${fmt(max)}.`})),explanation,data:{kind:'conditionalChoice',ps,rows}};
});

generated(3,'Causal utility from dependency hypotheses','§§3.4–3.5, Dependency hypotheses; §3.7, Utility',r=>{
 const p=pick(r,probs),rows=[shuffle(values,r).slice(0,3),shuffle(values,r).slice(0,3)],target=pick(r,[0,1]),answer=eu(rows[target],p);
 return numeric(`The columns are dependency hypotheses. Each entry is the utility that the indicated act would produce under that hypothesis. The agent is certain that one of these hypotheses is true. What is the causal expected utility of ${M('A_'+(target+1))}?`,answer,weightedWrong(rows[target],p,[eu(rows[1-target],p)]),`Use the unconditional credences in the dependency hypotheses. The causal expected utility is ${M(tex(answer))}.`,{table:decisionTable(rows,p,'K'),data:{kind:'causalEU',p,rows,target}});
});

generated(4,'Credence in a causal advantage','§§3.4–3.5, Dependency hypotheses',r=>{
 const p=pick(r,[[.2,.3,.5],[.2,.5,.3],[.5,.2,.3]]),base=shuffle([2,4,6],r),signs=shuffle([1,1,-1],r),rows=[base.map((x,i)=>x+2*signs[i]),base],wins=signs.map((x,i)=>x>0?i:-1).filter(i=>i>=0),answer=wins.reduce((s,i)=>s+p[i],0);
 const wrong=[...p.map(x=>[x,'This counts only one hypothesis.']),[1-answer,'This counts the hypotheses in which A₂ would do better.'],[wins.length/3,'This counts hypotheses equally instead of using their credences.'],[p[0]+p[1],'This adds the first two credences without checking their counterfactual payoffs.'],[1,'Some hypotheses favour A₂ instead.'],[0,'Some hypotheses favour A₁.']];
 return numeric(`The table lists dependency hypotheses, their credences, and the utilities each act would produce. What is the agent’s credence that ${M('A_1')} would produce strictly greater utility than ${M('A_2')}?`,answer,wrong,`A₁ would do better under ${wins.map(i=>'K'+(i+1)).join(' and ')}. Add their credences to obtain ${M(tex(answer))}.`,{table:decisionTable(rows,p,'K'),data:{kind:'causalAdvantage',p,rows}});
});

generated(5,'A Newcomb prize threshold','§3.3, Newcomb on the evidential theory',r=>{
 const H=pick(r,[20,40,60]),p=pick(r,[.75,.8,.9]),answer=H*(2*p-1);
 return numeric(`In a Newcomb-like problem the opaque box contains either $${H} or $0, and the transparent box contains $${M('k')}. Utility equals money received. The credence that the opaque box is full is ${M(tex(p))} conditional on one-boxing and ${M(tex(1-p))} conditional on two-boxing. What is the largest ${M('k\\geq0')} for which EDT permits one-boxing?`,answer,[[p*H,'This gives the one-box expected utility, without comparing with two-boxing.'],[(1-p)*H,'This gives the opaque box’s contribution conditional on two-boxing.'],[H,'This compares the full-box amounts without the conditional credences.'],[2*p*H,'This adds the two full-box contributions instead of taking their difference.'],[answer/2,'This halves the difference between the two opaque-box expectations.'],[H-answer,'This subtracts the threshold from the prize.'],[0,'A positive transparent-box prize can still leave one-boxing at least as good.']],`One-boxing has evidential expected utility ${fmt(p*H)}; two-boxing has ${fmt((1-p)*H)} + k. Hence k can be at most ${M(tex(answer))}.`,{data:{kind:'newcombThreshold',H,p}});
});

generated(6,'When both theories agree','§§2.8, 2.10; §§3.1–3.2 and 3.7',r=>{
 const H=pick(r,[8,12,16]),p=pick(r,[.25,.75]),rows=[[H,0],[H/2,H/2]],expected=[p*H,H/2],best=expected[0]>expected[1]?1:2;
 const texts=['Both theories recommend A₁.','Both theories recommend A₂.','CDT recommends A₁; EDT recommends A₂.','CDT recommends A₂; EDT recommends A₁.'];const explanation=`Both independence conditions hold, so both theories use these state credences. A₁ has expected utility ${fmt(expected[0])}; A₂ has ${fmt(expected[1])}.`;
 return {stem:`The states ${M('S_1,S_2')} partition the possibilities and are both causally and probabilistically independent of the acts. Entries are utilities. Which recommendation follows?`,table:decisionTable(rows,[p,1-p]),options:texts.map((text,i)=>({text,correct:i===best-1,reason:explanation})),explanation,data:{kind:'agreement',p,rows}};
});

generated(7,'A guaranteed causal advantage','§3.7, Utility: the Newcomb causal calculation',r=>{
 const base=shuffle([0,2,4,6],r).slice(0,2),gain=pick(r,[1,2,3]),rows=[base.map(x=>x+gain),base];
 const explanation=`A₁ gives ${gain} more utility under every dependency hypothesis. Averaging with any credences whose sum is one preserves that difference.`;
 return {stem:`${M('K_1,K_2')} are dependency hypotheses that exhaust the possibilities. The entries are utilities. What is ${M('\\mathrm{EU}_c(A_1)-\\mathrm{EU}_c(A_2)')}?`,table:{headers:['',M('K_1'),M('K_2')],rows:rows.map((u,i)=>[M('A_'+(i+1)),...u.map(String)])},options:[{text:M(String(gain)),correct:true,reason:explanation},{text:M('0'),correct:false,reason:'Both acts share the uncertain baseline, but A₁ also has a fixed advantage.'},{text:M(String(2*gain)),correct:false,reason:'This adds the two advantages without weighting the hypotheses.'},{text:'It cannot be determined from the information given.',correct:false,reason:'The same advantage obtains under every hypothesis, so the individual weights do not affect it.'}],explanation,data:{kind:'constantAdvantage',gain,rows}};
});

generated(8,'Evidential utility from outcome credences','§3.2, Evidential expected utility, generalised',r=>{
 const p=pick(r,probs),u=shuffle([-4,0,2,4,8,12],r).slice(0,3),answer=eu(u,p);
 return numeric(`Exactly one of three outcomes occurs. Let ${M('O_i')} be the event that outcome ${M('i')} occurs. The table gives outcome utilities and credences conditional on act ${M('A')}. What is the evidential expected utility of ${M('A')}?`,answer,weightedWrong(u,p),`Using the outcome probabilities conditional on A gives ${M(tex(answer))}.`,{table:{headers:['',M('O_1'),M('O_2'),M('O_3')],rows:[['Outcome utility',...u.map(String)],[M('\\operatorname{Cr}(O_i\\mid A)'),...p.map(x=>M(tex(x)))]]},data:{kind:'outcomeEEU',p,u}});
});









for(const t of week3Templates){
 if(t.generate){t.revision=2;if(t.id!=='w3-g07')t.indeterminateDistractorRate=.1;}
 if(t.id==='w3-s04')t.revision=2;
}
