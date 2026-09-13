import {bank,makeQuestions} from './questions.mjs';
import {renderMathText,readableText} from './math.mjs';
import {renderTree,displayNodeId} from './tree-renderer.mjs';
const $=id=>document.getElementById(id),byId=new Map(bank.map(t=>[t.id,t]));
let history=[],position=-1,pending=[],bag=[],lastUnit=null;
const seed=()=>globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=seed()%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
for(const week of [...new Set(bank.map(t=>t.week))].sort()){const option=document.createElement('option');option.value=week;option.textContent='Week '+week;$('week').append(option);}
const initial=new URLSearchParams(location.search).get('week');if([...$('week').options].some(o=>o.value===initial))$('week').value=initial;
function table(root,data){root.replaceChildren();if(!data)return;const wrapper=document.createElement('div');wrapper.className='table-wrap';const t=document.createElement('table');t.className='data-table';const head=document.createElement('thead'),tr=document.createElement('tr');for(const h of data.headers){const cell=document.createElement('th');renderMathText(cell,displayNodeId(h));tr.append(cell);}head.append(tr);t.append(head);const body=document.createElement('tbody');for(const row of data.rows){const line=document.createElement('tr');for(const value of row){const cell=document.createElement('td');renderMathText(cell,displayNodeId(value));line.append(cell);}body.append(line);}t.append(body);wrapper.append(t);root.append(wrapper);}
function show(){
 const item=history[position],q=item.question;$('practice').hidden=false;$('practice').classList.toggle('has-model',!!q.group);$('model').hidden=!q.group;
 if(q.group){renderMathText($('context'),q.group.stem||'');renderTree($('tree'),q.group.tree);table($('model-table'),q.group.table);}
 $('question-meta').textContent='Week '+q.week+(q.topic?' · '+q.topic:'');renderMathText($('stem'),q.stem);table($('question-table'),q.table);
 $('answers').replaceChildren();q.options.forEach((option,i)=>{const label=document.createElement('label');label.className='answer';const input=document.createElement('input');input.type='radio';input.name='answer';input.setAttribute('aria-label','ABCD'[i]+'. '+readableText(option.text));input.checked=item.selected===i;input.disabled=item.checked;input.addEventListener('change',()=>{item.selected=i;for(const [index,row] of [...$('answers').children].entries())row.classList.toggle('selected',index===i);$('check').disabled=false;});const letter=document.createElement('span');letter.className='answer-letter';letter.textContent='ABCD'[i];const content=document.createElement('div');content.className='answer-content';renderMathText(content,option.text);label.append(input,letter,content);if(item.selected===i)label.classList.add('selected');if(item.checked&&option.correct)label.classList.add('correct');if(item.checked&&item.selected===i&&!option.correct)label.classList.add('incorrect');$('answers').append(label);});
 $('check').disabled=item.selected===null||item.checked;$('feedback').hidden=!item.checked;
 if(item.checked){const right=q.options[item.selected].correct;$('feedback').className='feedback '+(right?'good':'bad');$('verdict').textContent=right?'Correct.':'Not quite.';renderMathText($('explanation'),q.explanation||q.options.find(o=>o.correct).reason);}
 $('previous').disabled=position===0;$('variant').disabled=!q.canVary;$('status').textContent=q.group?'Question '+(q.group.index+1)+' of '+q.group.size+' in this decision problem':'Question '+(position+1);
}
function append(question){history.push({question:{...question,options:shuffle(question.options)},selected:null,checked:false});position=history.length-1;show();}
function next(){
 if(position<history.length-1){position++;show();return;}
 if(pending.length){append(pending.shift());return;}
 if(!bag.length){const units=new Map();for(const t of bank)if($('week').value==='all'||t.week===Number($('week').value))units.set(t.groupId||t.id,t);bag=shuffle([...units.entries()]);if(bag.length>1&&bag.at(-1)[0]===lastUnit)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];}
 const entry=bag.pop();if(!entry){$('status').textContent='No questions in this selection.';return;}lastUnit=entry[0];pending=makeQuestions(entry[1],seed());append(pending.shift());
}
$('next').addEventListener('click',next);$('previous').addEventListener('click',()=>{if(position>0){position--;show();}});
$('check').addEventListener('click',()=>{const item=history[position];if(item.selected!==null){item.checked=true;show();}});
$('variant').addEventListener('click',()=>{const current=history[position].question,t=byId.get(current.templateId);if(!t||!current.canVary)return;const group=makeQuestions(t,seed()),index=Math.max(0,group.findIndex(q=>q.templateId===current.templateId));pending=group.slice(index+1);append(group[index]);});
$('week').addEventListener('change',()=>{history=[];position=-1;pending=[];bag=[];lastUnit=null;const url=new URL(location.href);if($('week').value==='all')url.searchParams.delete('week');else url.searchParams.set('week',$('week').value);globalThis.history.replaceState(null,'',url);next();});
try{next();}catch(error){$('status').textContent='The practice page could not load. Please refresh to try again.';console.error(error);}
