export function rng(seed) {
  let a=seed>>>0;
  return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export const pick=(r,x)=>x[Math.floor(r()*x.length)];
const int=(r,a,b)=>a+Math.floor(r()*(b-a+1));
export function fmt(x){
 if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));
 for(let places=1;places<=4;places++){const n=Number(x.toFixed(places));if(Math.abs(x-n)<1e-9)return String(n);}
 for(let d=2;d<=12;d++){const n=Math.round(x*d);if(Math.abs(x-n/d)<1e-9)return `${n}/${d}`;}
 return `≈ ${Number(x.toFixed(3))}`;
}
export function nice(x){return Number.isFinite(x)&&Math.abs(x)<=100&&([1,2,4,5,10,20].some(d=>Math.abs(x*d-Math.round(x*d))<1e-8)||[3,6,8,12].some(d=>Math.abs(x*d-Math.round(x*d))<1e-8&&Math.abs(Math.round(x*d))<=12));}
export const tex=x=>{const value=fmt(x);return value.includes('/')?String.raw`\frac{${value.split('/')[0]}}{${value.split('/')[1]}}`:value;};
const probs=[.2,.25,.5,.75,.8];
const pairs=[[.5,.2],[.5,.4],[.5,.6],[.5,.8],[.25,.4],[.25,.8],[.75,.4],[.75,.8],[.2,.5],[.4,.5],[.6,.5],[.8,.5],[.4,.25],[.8,.25],[.4,.75],[.8,.75]];
const calibration=[[-4,4,.25],[-4,4,.5],[-4,4,.75],[-2,6,.25],[-2,6,.5],[-2,6,.75],[2,10,.25],[2,10,.5],[2,10,.75],[4,12,.25],[4,12,.5],[4,12,.75],[-2,8,.2],[-2,8,.4],[-2,8,.6],[-2,8,.8],[2,12,.2],[2,12,.4],[2,12,.6],[2,12,.8]];
const dec=x=>String(Number(x.toFixed(4)));
const option=(text,correct,reason)=>({text:String(text),correct,reason});
function numeric(stem,answer,wrong,reason,extra={}){
 if(!nice(answer))throw Error('non-simple correct value');
 const values=[answer];const valid=[];for(const [x,why] of wrong){if(!nice(x)||extra.bounds?.[0]===0&&extra.bounds?.[1]===1&&Math.abs(x*20-Math.round(x*20))>1e-8||values.some(y=>Math.abs(x-y)<1e-8)||extra.bounds&&(x<extra.bounds[0]||x>extra.bounds[1]))continue;values.push(x);valid.push({...option(extra.unit==='dollars'?(Math.abs(x-Number(x.toFixed(2)))>1e-8?'≈ ':'')+'$'+x.toFixed(2):fmt(x),false,why),value:x});}
 if(valid.length<3)throw Error('collision');
 return {stem,options:[{...option(extra.unit==='dollars'?'$'+answer.toFixed(2):fmt(answer),true,reason),value:answer},...valid],balancedPool:wrong.length>3,explanation:reason,...extra};
}
const templates=[];
const add=(id,topic,title,generate)=>templates.push({id:`w4-g${String(id).padStart(2,'0')}`,week:4,revision:3,topic,title,generate,source:'Week 4 lecture: probability, prospects and expected utility'});
add(1,'Probability','Expected value',r=>{
 const v=pick(r,[[-2,0,4,8],[-4,2,6,10],[-2,2,4,6]]);const w=pick(r,[[1,2,3,4],[4,1,3,2],[2,4,1,3]]);const a=v.reduce((s,x,i)=>s+x*w[i]/10,0);
 return numeric(String.raw`A random variable \(X\) has the following distribution. What is \(\mathbb E[X]\)?`,a,[[v.reduce((s,x)=>s+x,0)/4,'This weights the four values equally, rather than using their stated probabilities.'],[v.reduce((s,x,i)=>s+x*w[3-i]/10,0),'This reverses the probabilities attached to the values.'],[Math.max(...v),'This selects the largest possible value instead of averaging by probability.'],[a*10,'Uses the integer weights without dividing by their total.'],[a/4,'Averages the already probability-weighted total again.'],[a-v[3]*w[3]/10,'Omits the largest outcome’s contribution.'],[a-v[0]*w[0]/10,'Omits the negative outcome’s contribution.'],[v.reduce((s,x,i)=>s+Math.abs(x)*w[i]/10,0),'Uses the magnitude of the negative outcome instead of its signed value.']],`Multiply each value by its probability and add: E[X] = ${fmt(a)}.`,{table:{headers:['X',...v.map(String)],rows:[['Probability',...w.map(x=>dec(x/10))]]}});
});

add(3,'Probability','Total expectation',r=>{
 const p=pick(r,probs),x=pick(r,[0,2,4,6,8,10]),y=pick(r,[0,2,4,6,8,10]),a=p*x+(1-p)*y;if(x===y)throw Error('distinct means');
 return numeric(String.raw`Given
\[\Pr(B)=${tex(p)},\quad \Pr(\neg B)=${tex(1-p)},\quad \mathbb E[X\mid B]=${tex(x)},\quad \mathbb E[X\mid\neg B]=${tex(y)}.\]
What is \(\mathbb E[X]\)?`,a,[[(x+y)/2,'This treats the two conditioning events as equally probable.'],[x+y,'Conditional expectations must be weighted, not simply added.'],[(1-p)*x+p*y,'This attaches each event probability to the other conditional expectation.'],[p*x,'Includes only the B contribution.'],[(1-p)*y,'Includes only the complement contribution.'],[a/2,'Averages the probability-weighted contributions a second time.'],[p*x+y,'Leaves the complement contribution unweighted.'],[x+(1-p)*y,'Leaves the B contribution unweighted.']],`Total expectation gives ${dec(p)} × ${x} + ${dec(1-p)} × ${y} = ${fmt(a)}.`);
});

add(5,'Prospects & mixtures','A compound lottery',r=>{
 const p=pick(r,[.25,.5,.75]),q=pick(r,[.2,.4,.6,.8]),t=pick(r,[.2,.4,.6,.8]),a=p*q+(1-p)*t;if(q===t)throw Error('distinct prospects');
 return numeric(String.raw`For distinct certain outcomes \(A,B\), let
\[P=A[${tex(q)}]B,\qquad Q=A[${tex(t)}]B.\]
What is the probability of \(A\) in \(P[${tex(p)}]Q\)?`,a,[[p*q,'Counts only the route through P.'],[(1-p)*t,'Counts only the route through Q.'],[p*q+t,'Leaves the Q route unweighted.'],[q+t,'Adds conditional probabilities without the branch weights.'],[(q+t)/2,'Treats P and Q as equally likely.'],[p*t+(1-p)*q,'Swaps the two conditional distributions.'],[p*(q+t),'Uses the P selection weight on both routes.'],[(1-p)*(q+t),'Uses the Q selection weight on both routes.'],[q*t,'Multiplies probabilities belonging to alternative branches.'],[1-a,'Answers the probability of B.']],`Add the two routes: ${dec(p)} × ${dec(q)} + ${dec(1-p)} × ${dec(t)} = ${fmt(a)}.`,{bounds:[0,1]});
});






add(12,'Representation & axioms','An indifferent mixture',r=>{
 const [low,mid,high]=pick(r,[[0,1,4],[0,2,4],[0,3,4],[-2,0,2],[-2,1,2],[2,4,6],[-4,0,4],[0,2,10],[0,8,10],[-2,2,8],[2,6,12]]),ans=(mid-low)/(high-low);
 return numeric(String.raw`Expected utility represents the preferences, with
\[\operatorname{EU}(A)=${tex(high)},\quad \operatorname{EU}(B)=${tex(mid)},\quad \operatorname{EU}(C)=${tex(low)}.\]
What probability \(p\) makes \(B\sim A[p]C\)?`,ans,[[1-ans,'This is the probability of C, not A.'],[mid/high,'This treats C as if its expected utility were zero.'],[(mid-low)/high,'This subtracts the lower value but does not subtract it from the denominator.'],[mid/(high-low),'Omits the lower reference from the numerator.'],[(mid+low)/(high-low),'Adds rather than subtracts the lower reference.'],[(high-mid)/high,'Uses the upper gap and the old upper value.'],[(mid-low)/(high+low),'Uses the sum rather than difference for the denominator.'],[mid/(high+low),'Uses the sum of reference utilities and omits the baseline adjustment.']],`Set ${mid} = p × ${high} + (1−p) × (${low}). Thus p = (${mid}−(${low}))/(${high}−(${low})) = ${fmt(ans)}.`,{bounds:[0,1]});
});
add(13,'Utility & risk','A certain monetary amount',r=>{
 const [l,h]=pick(r,[[0,4],[0,8],[2,6],[2,10],[4,8]]),p=pick(r,[.25,.5,.75]),H=h*h,L=l*l,e=p*h+(1-p)*l,M=p*H+(1-p)*L,ans=e*e;
 return numeric(String.raw`An agent uses expected utility with \(u(m)=\sqrt m\). Which sure monetary amount is equally preferred to
\[\$${dec(H)}[${tex(p)}]\$${dec(L)}\quad ?\]`,ans,[[M,'Reports expected money instead of its certainty equivalent.'],[e,'Reports expected utility as a monetary amount.'],[Math.sqrt(M),'Takes the utility of expected money.'],[(p*l+(1-p)*h)**2,'Swaps the probabilities before finding the sure amount.'],[(p*h)**2,'Drops the lower outcome’s utility contribution.'],[p*p*H+(1-p)**2*L,'Squares each weighted utility separately, omitting the cross term.'],[M*M,'Squares expected money instead of expected utility.'],[(p*H+(1-p)*l)**2,'Does not take the square root of the high payoff.'],[(p*h+(1-p)*L)**2,'Does not take the square root of the low payoff.']],`Expected utility is ${dec(p)} × ${fmt(h)} + ${dec(1-p)} × ${fmt(l)} = ${fmt(e)}. Set √m = ${fmt(e)}, so m = ${fmt(ans)}.`,{unit:'dollars',bounds:[0,100]});
});
add(14,'Utility & risk','Expected utility of money',r=>{
 const [l,h]=pick(r,[[0,4],[0,8],[2,6],[2,10],[4,8]]),p=pick(r,[.25,.5,.75]),e=p*h+(1-p)*l,M=p*h*h+(1-p)*l*l;
 return numeric(String.raw`An agent uses \(u(m)=\sqrt m\). What is the expected utility of
\[\$${dec(h*h)}[${tex(p)}]\$${dec(l*l)}\quad ?\]`,e,[[Math.sqrt(M),'Calculates utility of expected money.'],[M,'Averages money without applying the utility function.'],[e*e,'Converts expected utility to a certain monetary amount.'],[p*h,'Drops the lower outcome’s contribution.'],[(1-p)*l,'Drops the higher outcome’s contribution.'],[(h+l)/2,'Weights the two outcomes equally.'],[p*l+(1-p)*h,'Swaps the probabilities.'],[Math.sqrt(p)*h+Math.sqrt(1-p)*l,'Takes square roots of the probability-weighted payouts before adding.'],[h+l,'Adds utilities without probability weights.']],`Average the utilities: ${dec(p)} × ${fmt(h)} + ${dec(1-p)} × ${fmt(l)} = ${fmt(e)}.`,{bounds:[0,100]});
});

add(16,'Prospects & mixtures','Repeated outcome routes',r=>{
 const [p,q]=pick(r,pairs),v=p+(1-p)*q;
 return numeric(String.raw`For distinct certain outcomes \(A,B\), what is the probability of \(A\) in
\[A[${tex(p)}](A[${tex(q)}]B)\quad ?\]`,v,[[p*q,'Treats obtaining A as requiring both selections.'],[p,'Counts the direct route only.'],[(1-p)*q,'Counts the indirect route only.'],[p+q,'Fails to discount the inner route by its selection probability.'],[p+q-2*p*q,'Subtracts the overlap twice.'],[(p+q)/2,'Averages the stage probabilities.'],[(1-p)*(1-q),'Calculates the probability of B.'],[1-(1-p)**2*(1-q),'Counts the outer failure factor twice in the probability of B.'],[1-(1-p)*(1-q)**2,'Counts the inner failure factor twice in the probability of B.'],[p+(1-q)*q,'Uses the inner failure probability to weight the inner route.']],`Add the direct and indirect routes: ${dec(p)} + ${dec(1-p)} × ${dec(q)} = ${fmt(v)}.`,{bounds:[0,1]});
});


export const generators=templates;
export function shuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validate(q){
 if(!q.stem||q.options?.length!==4||q.options.filter(o=>o.correct===true).length!==1)throw Error(`Invalid four-choice question ${q.id||''}`);
 if(q.options.some(o=>!o.text||!o.reason)||new Set(q.options.map(o=>o.text.trim().toLowerCase())).size!==4)throw Error(`Duplicate or missing option ${q.id||''}`);
 return q;
}
export function instantiate(template,seed){
 const random=rng(seed);let q;
 const rankTarget=Math.floor(random()*4);
 for(let attempt=0;attempt<256;attempt++){try{
 q=template.generate?template.generate(random):structuredClone(template);
 if(q.balancedPool){const answer=q.options.find(o=>o.correct),wrong=q.options.filter(o=>!o.correct);const below=shuffle(wrong.filter(o=>o.value<answer.value),random),above=shuffle(wrong.filter(o=>o.value>answer.value),random);
 let rank=rankTarget;const feasible=[0,1,2,3].filter(k=>below.length>=k&&above.length>=3-k);if(!feasible.length)throw Error('not enough simple distractors');if(!feasible.includes(rank)){if(attempt<32)throw Error('resample simple case');rank=pick(random,feasible);}
 q.options=[answer,...below.slice(0,rank),...above.slice(0,3-rank)];}
 q=validate(q);break;}catch(e){if(!template.generate||attempt===255)throw e;}}
 const id=`${template.id}:r${template.revision||1}:${seed>>>0}`;
 const result={...q,id,templateId:template.id,revision:template.revision||1,seed:seed>>>0,week:template.week,topic:template.topic,title:template.title,source:template.source,generated:!!template.generate,options:shuffle(q.options.map((o,i)=>({...o,key:`o${i}`})),random)};

 if([2,3].includes(template.week)&&template.indeterminateDistractorRate){
  const label='It cannot be determined from the information given.';
  let salt=0x713ac59d;for(const c of template.id)salt=Math.imul(salt^c.charCodeAt(0),16777619);
  const draw=rng((seed^salt)>>>0);
  if(draw()<template.indeterminateDistractorRate&&!result.options.some(o=>o.text===label)){
   const target=pick(draw,result.options.map((o,i)=>o.correct||o.keepDistractor?-1:i).filter(i=>i>=0));
   result.options[target]={text:label,correct:false,key:result.options[target].key,reason:`The information supplied determines the answer. ${q.explanation}`,indeterminateDistractor:true};
  }
 }
 return result;
}
