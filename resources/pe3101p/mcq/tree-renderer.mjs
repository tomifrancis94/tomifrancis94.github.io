import {renderMathText} from './math.mjs';
export function displayNodeId(value){return String(value).replace(/^([DC])(\d+)$/,(_,prefix,digits)=>prefix+[...digits].map(d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]).join(''));}
export function edgeLabel(edge){return edge.probability!==undefined?`${edge.label?`${edge.label}: `:''}${edge.probability}`:String(edge.label??'');}
export function edgeLabelGeometry(a,b){
 const x=(a.x+b.x)/2,y=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;

 const below=b.y>a.y,baseline=below?25:-9,radians=angle*Math.PI/180;
 return {x,y,angle,below,baseline,baselinePoint:{x:x-Math.sin(radians)*baseline,y:y+Math.cos(radians)*baseline},transform:`translate(${x} ${y}) rotate(${angle})`};
}
export function terminalLabel(value){
 const raw=String(value),plain=raw.replace(/^\\\(\s*|\s*\\\)$/g,'');
 const match=plain.match(/^([A-Za-z])(?:\^\{?[-−]\}?|[−⁻])$/);
 return match?{base:match[1],superscript:'−'}:{base:raw};
}


export function layoutTree(tree){
 const nodes=new Map(tree.nodes.map(n=>[n.id,n])),children=new Map(tree.nodes.map(n=>[n.id,[]]));
 for(const edge of tree.edges){if(!nodes.has(edge.from)||!nodes.has(edge.to))throw Error('Unknown tree node');children.get(edge.from).push(edge.to);}
 for(const [id,list]of children){const edges=tree.edges.filter(e=>e.from===id),rank={UP:0,MIDDLE:1,DOWN:2};if(edges.length&&edges.every(e=>Object.hasOwn(rank,String(e.label).toUpperCase())))list.sort((a,b)=>rank[String(edges.find(e=>e.to===a).label).toUpperCase()]-rank[String(edges.find(e=>e.to===b).label).toUpperCase()]);}
 let leaf=0,maxDepth=0;const placed=new Map(),visiting=new Set();
 function place(id,depth){
  if(visiting.has(id)||placed.has(id))throw Error('The diagram must be a tree');
  visiting.add(id);maxDepth=Math.max(maxDepth,depth);const ys=children.get(id).map(child=>place(child,depth+1));
  const y=ys.length?ys.reduce((a,b)=>a+b,0)/ys.length:38+leaf++*65;
  placed.set(id,{...nodes.get(id),x:30+depth*120,y});visiting.delete(id);return y;
 }
 place(tree.root,0);return {nodes:[...placed.values()],edges:tree.edges,width:Math.max(290,115+maxDepth*120),height:Math.max(110,leaf*65+12)};
}
export function renderTree(root,tree){
 root.replaceChildren();const data=layoutTree(tree),ns='http://www.w3.org/2000/svg';
 const node=(tag,attrs={},value)=>{const n=document.createElementNS(ns,tag);for(const [key,v]of Object.entries(attrs))n.setAttribute(key,String(v));if(value!==undefined)n.textContent=value;return n;};
 const svg=node('svg',{viewBox:`0 0 ${data.width} ${data.height}`,role:'img','aria-label':'Decision tree. Squares are decision nodes and circles are chance nodes.'});
 svg.setAttribute('preserveAspectRatio','xMidYMid meet');const coords=new Map(data.nodes.map(n=>[n.id,n]));
 const description=data.edges.map(e=>`${e.from} to ${e.to}: ${edgeLabel(e)}`).join('. ');svg.append(node('desc',{},description));
 for(const edge of data.edges){const a=coords.get(edge.from),b=coords.get(edge.to);svg.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'tree-edge'}));
  const label=edgeLabel(edge),geometry=edgeLabelGeometry(a,b),labelGroup=node('g',{transform:geometry.transform,'data-edge-label':`${edge.from}-${edge.to}`});
  if(/^-?\d+\/\d+$/.test(label)||label.includes('\\(')){const foreign=node('foreignObject',{x:-75,y:geometry.below?12:-48,width:150,height:36}),body=document.createElement('div');body.className='tree-math-label';renderMathText(body,label);foreign.append(body);labelGroup.append(foreign);svg.append(labelGroup);continue;}
  const t=node('text',{x:0,y:geometry.baseline,'text-anchor':'middle',class:'tree-label'});
  const words=label.split(/\s+/);let lines=[''];for(const word of words){if((lines.at(-1)+' '+word).trim().length>19&&lines.at(-1))lines.push(word);else lines[lines.length-1]=(lines.at(-1)+' '+word).trim();}
  lines.forEach((line,i)=>t.append(node('tspan',{x:0,dy:i?'17':String(geometry.below?0:-(lines.length-1)*17)},line)));labelGroup.append(t);svg.append(labelGroup);
 }
 for(const n of data.nodes){if(n.type==='decision')svg.append(node('rect',{x:n.x-16,y:n.y-16,width:32,height:32,class:'tree-node'}));else if(n.type==='chance')svg.append(node('circle',{cx:n.x,cy:n.y,r:17,class:'tree-node'}));
  const label=n.type==='terminal'?terminalLabel(n.outcome??n.id):{base:displayNodeId(n.id)},printed=node('text',{x:n.x+(n.type==='terminal'?8:0),y:n.y+5,'text-anchor':n.type==='terminal'?'start':'middle',class:'tree-node-label'},label.base);
  if(label.superscript)printed.append(node('tspan',{'baseline-shift':'super','font-size':'70%'},label.superscript));svg.append(printed);}
 root.append(svg);
}
