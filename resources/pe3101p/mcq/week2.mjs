import {pick,shuffle} from './engine.mjs';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
export function fraction(n,d=1){if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;return 1000%d===0?String(n/d):`${n}/${d}`;}
const math=s=>String.raw`\(${s.replaceAll(String.raw`\Cr`,String.raw`\operatorname{Cr}`)}\)`;
const tex=(n,d=1)=>{const s=fraction(n,d);return s.includes('/')?String.raw`\frac{${s.split('/')[0]}}{${s.split('/')[1]}}`:s;};
const p=(n,d)=>math(tex(n,d));
const int=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const option=(text,correct,reason,value)=>({text,correct,reason,...(value===undefined?{}:{value})});
function choice(r,stem,answer,wrong,explanation,extra={}){
 const seen=new Set([answer]),pool=[];for(const [text,reason]of shuffle(wrong,r))if(!seen.has(text)){seen.add(text);pool.push(option(text,false,reason));}
 if(pool.length<3)throw Error('Resample distinct distractors');
 return {stem,options:[option(answer,true,explanation),...pool.slice(0,3)],explanation,...extra};
}
function numeric(r,stem,[a,b],wrong,explanation,extra={}){
 const answer=a/b,seen=new Set([fraction(a,b)]),pool=[];
 for(const [[n,d],reason]of wrong){const label=fraction(n,d),value=n/d;if(!Number.isFinite(value)||value<0||value>1||seen.has(label))continue;seen.add(label);pool.push(option(label,false,reason,value));}
 if(pool.length<3)throw Error('Resample numeric distractors');
 return {stem,options:[option(fraction(a,b),true,explanation,answer),...pool],balancedPool:true,explanation,...extra};
}
const source=section=>`Week 2 lecture notes, ${section}`;
const templates=[];
const add=(id,topic,title,section,generate)=>templates.push({id:`w2-g${String(id).padStart(2,'0')}`,week:2,revision:1,topic,title,source:source(section),generate});
const atoms=r=>{const w=shuffle(pick(r,[[1,1,2,6],[1,2,3,4],[2,2,3,3],[2,2,2,4]]),r);if([w[0]+w[1],w[0]+w[2]].some(d=>d===7||d===9))throw Error('Keep conditional denominators simple');return w;};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
add(1,'Probability bounds','Bounds on an intersection','§§1.2, 2.3',r=>{
 const a=int(r,3,17),b=int(r,3,17),lo=Math.max(0,a+b-20),hi=Math.min(a,b);if(a===b)throw Error('Distinct marginals');
 const interval=(x,y)=>math(String.raw`${tex(x,20)}\leq\Cr(A\cap B)\leq${tex(y,20)}`);
 const answer=interval(lo,hi),explanation=`The intersection cannot exceed either event. The union cannot exceed 1, so the addition rule gives the lower bound ${fraction(lo,20)}. Every value in the stated interval is possible.`;
 const wrong=[[interval(0,Math.max(a,b)),'Uses the larger marginal as an upper bound and omits the union constraint.'],[interval(0,hi),'Omits the lower bound imposed when the marginal credences sum to more than 1.'],[interval(lo,Math.max(a,b)),'The intersection cannot be more probable than the smaller event.'],...(Math.abs(a-b)<=hi?[[interval(Math.abs(a-b),hi),'The difference of the marginals is not an intersection lower bound.']]:[]),[interval(lo,20),'This ignores the two marginal upper bounds.']].filter(([s])=>s!==answer);
 return choice(r,`An agent's credences satisfy the probability axioms, with ${math(String.raw`\Cr(A)=${tex(a,20)},\quad\Cr(B)=${tex(b,20)}`)}. Which is the full range of possible credences in ${math(String.raw`A\cap B`)}?`,answer,wrong,explanation,{check:{kind:'bounds',a,b,den:20}});
});
add(2,'Probability calculations','Exactly one event','§§1.2, 2.3',r=>{
 const weights=atoms(r),[a,b,c,d]=weights,n=sum(weights);
 return numeric(r,`An agent assigns ${math(String.raw`\Cr(A)=${tex(a+b,n)},\quad\Cr(B)=${tex(a+c,n)},\quad\Cr(A\cap B)=${tex(a,n)}`)}. Her credences satisfy the probability axioms. What is her credence that exactly one of A and B occurs?`,[b+c,n],[[[a+b+c,n],'This is the credence in at least one event, including their intersection.'],[[a,n],'This is the credence in both events.'],[[d,n],'This is the credence in neither event.'],[[a+b,n],'This is the marginal credence in A.'],[[2*a+b+c,n],'Adding the marginals counts the intersection twice.']],`Count the A-only and B-only possibilities: Cr(A) + Cr(B) − 2Cr(A ∩ B) = ${fraction(b+c,n)}.`,{check:{kind:'exactlyOne',weights}});
});
add(3,'Events and sets','Members of one event but not another','§1.2',r=>{
 const labels=shuffle(['1','2','3','4','5','6'],r),A=labels.slice(0,3),B=[labels[1],labels[3],labels[4]],set=xs=>math(String.raw`\{${[...xs].sort().join(',')}\}`);
 const targets=pick(r,[0,1]),answer=targets?set([labels[0],labels[2]]):set([labels[3],labels[4]]),expression=targets?String.raw`A\cap B^c`:String.raw`B\cap A^c`;
 const wrong=[[targets?set([labels[3],labels[4]]):set([labels[0],labels[2]]),'This reverses the roles of A and B.'],[set([labels[1]]),'This is the intersection A ∩ B.'],[set(targets?A:B),'This includes the member shared by both events.']];
 const q=choice(r,`Let ${math(String.raw`\Omega=\{1,2,3,4,5,6\}`)}, A = ${set(A)} and B = ${set(B)}. Which set is ${math(expression)}?`,answer,wrong,`Select the members in ${targets?'A that are not in B':'B that are not in A'}.`,{check:{kind:'set',A,B,targets}});
 q.options.find(o=>o.reason==='This reverses the roles of A and B.').keepDistractor=true;return q;
});
add(4,'Conditional probability','Read a conditional from joint credences','§3.1',r=>{
 const weights=atoms(r),[a,b,c,d]=weights,n=sum(weights),conditionB=pick(r,[true,false]),ans=conditionB?[a,a+c]:[a,a+b];
 const table={headers:['',math('B'),math('B^c')],rows:[[math('A'),fraction(a,n),fraction(b,n)],[math('A^c'),fraction(c,n),fraction(d,n)]]};
 return numeric(r,`The table gives an agent's joint credences: each cell is the credence in its row event and its column event together. What is ${math(conditionB?String.raw`\Cr(A\mid B)`:String.raw`\Cr(B\mid A)`)}?`,ans,[[[a,n],'This is the joint credence, before conditioning.'],[conditionB?[a,a+b]:[a,a+c],'This reverses the conditional.'],[conditionB?[c,a+c]:[b,a+b],'This uses the complementary event within the correct conditioning event.'],[[a+b,n],'This is the marginal credence in A.'],[[a+c,n],'This is the marginal credence in B.']],`Divide the joint credence in A ∩ B by the credence in ${conditionB?'B':'A'}: ${fraction(...ans)}.`,{table,check:{kind:'conditional',weights,conditionB}});
});
add(5,'Bayes theorem','Reverse a conditional','§3.5',r=>{
 const weights=atoms(r),[a,b,c,d]=weights,n=sum(weights);
 return numeric(r,`An agent's credences satisfy the probability axioms. She assigns ${math(String.raw`\Cr(H)=${tex(a+b,n)},\quad\Cr(E)=${tex(a+c,n)},\quad\Cr(E\mid H)=${tex(a,a+b)}`)}. What is ${math(String.raw`\Cr(H\mid E)`)}?`,[a,a+c],[[[a,a+b],'This repeats Cr(E | H) without reversing the conditional.'],[[a+b,n],'This keeps the prior credence in H.'],[[a,n],'This gives Cr(H ∩ E), not Cr(H | E).'],[[c,a+c],'This gives Cr(Hᶜ | E).'],[[a+c,n],'This gives the marginal credence in the evidence.']],`Bayes' theorem gives Cr(H | E) = Cr(E | H)Cr(H)/Cr(E) = ${fraction(a,a+c)}.`,{check:{kind:'bayes',weights}});
});
add(6,'Total probability','Recover a missing conditional','§3.4',r=>{
 const den=pick(r,[4,5]),k=int(r,1,den-1),x=int(r,1,4),y=int(r,1,4);if(x===y)throw Error('Distinct conditionals');const total=k*x+(den-k)*y;
 return numeric(r,`An agent assigns ${math(String.raw`\Cr(B)=${tex(k,den)},\quad\Cr(A\mid B)=${tex(x,5)},\quad\Cr(A)=${tex(total,5*den)}`)}. Her credences satisfy the probability axioms. What is ${math(String.raw`\Cr(A\mid B^c)`)}?`,[y,5],[[[total,5*den],'This is the marginal credence in A.'],[[x,5],'This copies the other conditional credence.'],[[(den-k)*y,5*den],'This finds Cr(A ∩ Bᶜ) but does not divide by Cr(Bᶜ).'],[[total-x*den,5*den],'This subtracts the unweighted conditional from the marginal.'],[[5-y,5],'This complements the answer, giving Cr(Aᶜ | Bᶜ).']],`Use total probability and solve Cr(A) = Cr(B)Cr(A | B) + Cr(Bᶜ)Cr(A | Bᶜ). The missing conditional is ${fraction(y,5)}.`,{check:{kind:'total',den,k,x,y}});
});
add(7,'Probabilistic independence','Neither of two independent events','§§1.6, 3.1',r=>{
 const a=int(r,1,4),b=int(r,1,4);
 return numeric(r,`An agent's credences satisfy the probability axioms. Events A and B are probabilistically independent, with ${math(String.raw`\Cr(A)=${tex(a,5)},\quad\Cr(B)=${tex(b,5)}`)}. What is ${math(String.raw`\Cr(A^c\cap B^c)`)}?`,[(5-a)*(5-b),25],[[[a*b,25],'This is the credence in A ∩ B.'],[[25-a*b,25],'This complements A ∩ B, giving at least one event failing.'],[[(5-a)*b,25],'This gives Aᶜ ∩ B.'],[[a*(5-b),25],'This gives A ∩ Bᶜ.'],[[5-a,5],'This ignores B.'],[[5-a-b,5],'This treats A and B as mutually exclusive.']],`Independence gives Cr(A ∩ B) = Cr(A)Cr(B). Subtract the union from 1: 1 − Cr(A) − Cr(B) + Cr(A)Cr(B) = ${fraction((5-a)*(5-b),25)}.`,{check:{kind:'independence',a,b}});
});
add(8,'Conditionalisation','Update the whole distribution','§§3.2–3.3',r=>{
 const weights=atoms(r),n=sum(weights),excluded=pick(r,weights.map((x,i)=>i).filter(i=>[4,5,6,8].includes(n-weights[i]))),remaining=n-weights[excluded],format=xs=>math(`(${xs.join(', ')})`),newWeights=weights.map((x,i)=>i===excluded?'0':tex(x,remaining));
 const table={headers:['Outcome','1','2','3','4'],rows:[['Credence',...weights.map(x=>fraction(x,n))]]};
 const answer=format(newWeights),wrong=[[format(weights.map(x=>tex(x,n))),'This leaves the entire old distribution unchanged.'],[format(weights.map((x,i)=>i===excluded?'0':tex(x,n))),'This removes the ruled-out mass without renormalising.'],[format(weights.map((x,i)=>i===excluded?'1':'0')),'This puts certainty on the outcome that was ruled out.'],[format(weights.map((x,i)=>i===excluded?'0':tex(1,3))),'This redistributes the remaining mass equally rather than preserving its ratios.']];
 return choice(r,`An agent's sample space is ${math(String.raw`\{1,2,3,4\}`)}, with the credences below. She learns only that outcome ${excluded+1} did not occur and conditionalises. What are her new credences in outcomes 1, 2, 3 and 4, in that order?`,answer,wrong,`Outcome ${excluded+1} gets credence 0. Divide each remaining old credence by ${fraction(remaining,n)}, the old credence in the evidence.`,{table,check:{kind:'update',weights,excluded}});
});
add(9,'Bayes factors','Evidence and the posterior ranking','§3.6',r=>{
 const prior=pick(r,[[1,2],[1,3],[1,4],[2,1],[3,1],[4,1]]),likelihood=pick(r,[[1,2],[1,3],[2,1],[3,1]]),[a,b]=prior,[x,y]=likelihood;if(a*x===b*y)throw Error('No posterior tie');
 const evidence=x>y?'H₁':'H₂',posterior=a*x>b*y?'H₁':'H₂',word=(e,q)=>`The evidence favours ${e}; after updating, ${q} is more probable than ${q==='H₁'?'H₂':'H₁'}.`,answer=word(evidence,posterior);
 const wrong=[];for(const e of ['H₁','H₂'])for(const q of ['H₁','H₂'])wrong.push([word(e,q),'Evidence favouring a hypothesis depends on the likelihood ratio; the posterior ranking also depends on the prior odds.']);
 return choice(r,`An agent considers exactly two mutually exclusive hypotheses, H₁ and H₂. Her prior odds for H₁ over H₂ are ${a}:${b}, and the Bayes factor for H₁ over H₂ supplied by evidence E is ${p(x,y)}. She conditionalises on E. Which statement is correct?`,answer,wrong,`The Bayes factor ${fraction(x,y)} ${x>y?'exceeds':'is less than'} 1, so E favours ${evidence}. Posterior odds are ${a*x}:${b*y}, so ${posterior} has the higher posterior credence.`,{check:{kind:'odds',prior,likelihood}});
});
add(10,'Betting and Dutch books','Which offer is guaranteed acceptable?','§4.2',r=>{
 const stake=pick(r,[20,40,60,80]),numerator=int(r,1,4),threshold=stake*numerator/5,margin=pick(r,[1,2,3]),buy=pick(r,[true,false]);
 const trade=(verb,price)=>`${verb} the bet for $${price}.`,answer=trade(buy?'Buy':'Sell',threshold+(buy?-margin:margin));
 const wrong=buy?[[trade('Buy',threshold+margin),'The buying price exceeds the credence-weighted stake.'],[trade('Sell',threshold-margin),'The selling price is below the credence-weighted stake.'],[trade('Sell',threshold),'The stated betting interpretation does not settle acceptance at equality.']]:[[trade('Sell',threshold-margin),'The selling price is below the credence-weighted stake.'],[trade('Buy',threshold+margin),'The buying price exceeds the credence-weighted stake.'],[trade('Buy',threshold),'The stated betting interpretation does not settle acceptance at equality.']];
 return choice(r,`An agent has credence ${p(numerator,5)} in A. A bet pays $${stake} if A occurs and $0 otherwise. Under the betting interpretation of credences, which offer is she guaranteed to accept?`,answer,wrong,`The credence-weighted stake is $${threshold}. The betting interpretation guarantees buying below this price and selling above it.`,{check:{kind:'trade',stake,numerator,threshold,margin,buy}});
});
add(11,'Betting and Dutch books','Read a guaranteed loss from payoffs','§§4.3–4.4',r=>{
 const a=int(r,2,7),b=int(r,2,7),loss=int(r,1,5),stake=20,c=a+b+loss;
 const rows=[['Bet 1',String(a-stake),String(a),String(a)],['Bet 2',String(b),String(b-stake),String(b)],['Bet 3',String(stake-c),String(stake-c),String(-c)]];
 return choice(r,`The table gives an agent's net monetary gains from three bets, including all prices and payouts. The three states are mutually exclusive and jointly exhaustive. If she accepts all three bets, how much money is she guaranteed to lose?`,`$${loss}`,[[`$${a+b}`,'This counts receipts from the first two bets, not the combined net payoff.'],[`$${c}`,'This counts the third bet’s price without the first two receipts.'],[`$${stake}`,'This reports the stake rather than the net loss.'],['No loss is guaranteed.','Adding each column gives the same strictly negative total.']],`Add the three entries in any column: ${a} + ${b} − ${c} = −${loss}. Every state therefore gives a loss of $${loss}.`,{table:{headers:['Net gain ($)','P','Q','Neither'],rows},check:{kind:'book',a,b,c,stake,loss}});
});

export const week2Templates=templates;
for(const t of week2Templates)if(t.generate){t.revision=2;t.indeterminateDistractorRate=.1;}
