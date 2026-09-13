export function renderMathText(node,value){
 node.replaceChildren();const source=String(value??'');
 const append=(content,display)=>{const span=document.createElement(display?'div':'span');span.className=display?'math-block':'math-inline';window.katex.render(content,span,{displayMode:display,throwOnError:true,trust:false,strict:'error',output:'htmlAndMathml'});node.append(span);};
 const plain=value=>{const parts=String(value).split(/(-?\d+\/\d+|\b(?:Cr|Pr|EU)_[A-Za-z]\b)/g);for(const part of parts){if(/^-?\d+\/\d+$/.test(part)){const [a,b]=part.split('/');append(String.raw`\dfrac{${a}}{${b}}`,false);}else if(/^(Cr|Pr|EU)_/.test(part)){const [name,sub]=part.split('_');append(String.raw`\operatorname{${name}}_{${sub}}`,false);}else node.append(document.createTextNode(part));}};
 if(/^-?\d+\s*\/\s*\d+$/.test(source.trim())){const [a,b]=source.split('/');append(String.raw`\dfrac{${a}}{${b}}`,false);return;}
 const pattern=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;let match,last=0;
 while((match=pattern.exec(source))){plain(source.slice(last,match.index));append(match[1]??match[2],match[2]!==undefined);last=pattern.lastIndex;}
 plain(source.slice(last));
}
export function readableText(value){return String(value).replace(/\\[()[\]]/g,'').replace(/\\(?:d?frac)\{([^{}]*)\}\{([^{}]*)\}/g,'$1 divided by $2').replace(/\\(?:operatorname|mathrm|text)\{([^{}]*)\}/g,'$1').replace(/\\(?:quad|qquad)/g,' ').replace(/\\/g,'');}
