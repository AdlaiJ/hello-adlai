/* Statblock detection is heuristic, not OCR. Source PDFs never leave this browser.
   Geometry uses PDF.js viewport coordinates, normalized to [0,1]. */
const StatblockDetection = (() => {
  const size = /^(?:tiny|small|medium|large|huge|gargantuan)\b/i;
  const armor = /^(?:armor\s*class|AC)\b/i;
  const hp = /^(?:hit\s*points|HP)\b/i;
  const heading = /^(?:actions|bonus actions|reactions|legendary actions|lair actions|traits|spellcasting|multiattack)\b/i;
  function cleanName(value) {
    let name=String(value).normalize('NFKC').replace(/[\u00ad\u200b-\u200d\ufeff]/g,'').replace(/\s+/g,' ').replace(/\s+([,;:!?)])/g,'$1').replace(/([(])\s+/g,'$1').trim();
    // Repair each word, not the whole heading: one stray capital used to escape
    // the old 60%-uppercase threshold. Preserve conventional proper-name casing.
    name=name.replace(/\p{L}+(?:['’]\p{L}+)*/gu,(word,offset)=>{
      if(/^[IVXLCDM]+$/.test(word)&&/^(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(word))return word;
      if(/^(?:Mc|Mac)\p{Lu}\p{Ll}+$/u.test(word))return word;
      return word.split(/(['’])/).map((part,i)=>{
        if(i%2)return part;
        if(i>0&&/^s$/i.test(part))return 's';
        if(!/\p{Lu}/u.test(part.slice(1)))return part;
        const lower=part.toLowerCase();
        if((offset>0&&i===0&&/^(the|of|and|or|in|a|an)$/.test(lower))||(i>0&&lower==='s'))return lower;
        return lower.replace(/^\p{L}/u,c=>c.toUpperCase());
      }).join('');
    });
    return name;
  }
  function lines(items) {
    const result=[];
    for(const item of [...items].filter(i=>i.text.trim()).sort((a,b)=>a.y-b.y||a.x-b.x)) {
      let line=result.findLast(l=>Math.abs(l.y-item.y)<Math.max(2,Math.min(l.h,item.h)*.35)&&item.x>=l.x-2&&item.x-l.right<24);
      if(line){const gap=item.x-line.right,explicitSpace=/\s$/.test(line.text)||/^\s/.test(item.text),wordGap=gap>Math.min(line.h,item.h)*.18;line.text+=(explicitSpace||wordGap?' ':'')+item.text;line.right=Math.max(line.right,item.x+item.w);line.h=Math.max(line.h,item.h)}
      else result.push({text:item.text,x:item.x,y:item.y,right:item.x+item.w,h:item.h});
    }
    return result.sort((a,b)=>a.y-b.y||a.x-b.x);
  }
  function detect(pages, mode='auto') {
    const blocks=[];let active=null;
    // Headers are stronger column evidence than body-text indentations.
    const anchors=pages.flatMap(p=>p.lines.filter(l=>size.test(l.text)||armor.test(l.text)).map(l=>l.x/p.width));
    const two=anchors.some(x=>x<.35)&&anchors.some(x=>x>.45&&x<.8);
    for(const page of pages){
      const count=mode==='1'?1:mode==='2'?2:two?2:1;
      for(let col=0;col<count;col++){
        const left=col/count,right=(col+1)/count;
        const ls=page.lines.filter(l=>l.x/page.width>=left&&l.x/page.width<right&&l.y>page.height*.025&&l.y<page.height*.965&&!/^\d+$/.test(l.text.trim()));
        const starts=[];
        for(let i=0;i<ls.length;i++){
          const look=ls.slice(i,i+15).map(l=>l.text).join('\n');
          if(!size.test(ls[i].text)||!/(?:armor\s*class|\bAC\b)/i.test(look)||!/(?:hit\s*points|\bHP\b)/i.test(look))continue;
          let title=i-1;
          if(title<0||ls[i].y-ls[title].y>65||ls[title].text.length>95||/[.!?]$/.test(ls[title].text)){title=i;}
          // Large-font wrapped creature names belong to the same header.
          if(title>0&&ls[title-1].h>=ls[title].h*.95&&ls[title].h>ls[i].h*1.15&&ls[title].y-ls[title-1].y<ls[title].h*1.8&&ls[title-1].text.length<60)title--;
          starts.push({index:title,name:title===i?'Unnamed creature':cleanName(ls.slice(title,i).map(l=>l.text).join(' '))});
        }
        // Alternative compact blocks omit a size/type line. Require AC + HP + stats.
        for(let i=1;i<ls.length;i++)if(armor.test(ls[i].text)&&!starts.some(s=>Math.abs(s.index-i)<8)){
          const look=ls.slice(i,i+14).map(l=>l.text).join(' ');
          if(/(?:hit\s*points|\bHP\b)/i.test(look)&&/\b(?:STR|Strength)\b/i.test(look)&&/\b(?:DEX|Dexterity)\b/i.test(look)&&ls[i-1].text.length<85&&ls[i].y-ls[i-1].y<60)
            starts.push({index:i-1,name:cleanName(ls[i-1].text)});
        }
        starts.sort((a,b)=>a.index-b.index);
        const segment=(from,to)=>{
          const slice=ls.slice(from,to);if(!slice.length)return null;
          const x=Math.max(left,Math.min(...slice.map(l=>l.x/page.width))-.012);
          const y=Math.max(0,(slice[0].y-slice[0].h-5)/page.height);
          const end=Math.min(1,(slice.at(-1).y+7)/page.height);
          return {page:page.number,x,y,w:Math.min(right,Math.max(...slice.map(l=>l.right/page.width))+.012)-x,h:end-y};
        };
        const first=starts[0]?.index??ls.length;
        if(first>0&&active){
          const intro=ls.slice(0,Math.min(first,8)).map(l=>l.text).join(' ');
          if(heading.test(intro)||/^[A-Z][\w '\-()]+\.\s/.test(intro)||/\b(?:Melee|Ranged) (?:Weapon|Spell|Attack)|\bDC \d+\b/.test(intro)){
            const s=segment(0,first);if(s){active.segments.push(s);active.notes='Possible continuation across columns/pages: check the crop.';}
          }else if(ls.length)active=null;
        }
        for(let i=0;i<starts.length;i++){
          const s=starts[i],end=starts[i+1]?.index??ls.length,crop=segment(s.index,end);
          if(crop){active={name:s.name,selected:true,segments:[crop],notes:'Check the bottom boundary for nearby lore or other text.'};blocks.push(active)}
        }
      }
    }
    return blocks;
  }
  return {lines,detect,cleanName};
})();

(() => {
  const styles=document.createElement('style');styles.textContent=`
    .split-dialog{color:var(--ink);background:#151111;border:1px solid var(--gold2);width:min(1200px,96vw);height:92vh;padding:20px;max-width:none;max-height:none}
    .split-dialog::backdrop{background:#000c}.split-head{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.split-head h2{margin:0;flex:1;font-family:Georgia,serif}
    .split-body{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px;height:calc(100% - 160px);min-height:200px}.split-list{overflow:auto}.split-list button{display:block;width:100%;text-align:left;margin:5px 0;white-space:normal}.split-list .selected{border-color:var(--gold);color:var(--gold)}
    .split-detail{overflow:auto}.split-detail input[type=text]{width:100%;margin:8px 0}.crop-fields{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.crop-fields label{font-size:12px;color:var(--muted)}.crop-fields input{display:block;width:75px;background:#0b0909;color:var(--ink);border:1px solid var(--line);padding:6px}.crop-preview canvas,.statblock-crops canvas{display:block;width:100%;height:auto;background:#fff;margin-bottom:8px}.statblock-crops{padding:8px;max-height:70vh;overflow:auto}.split-note{font-size:13px;color:var(--muted)}.split-dialog button:disabled{opacity:.45;cursor:wait}.split-foot{display:flex;gap:8px;align-items:center;margin-top:14px}.split-foot span{flex:1}.statblock-crops .error{padding:16px;color:#efaaaa}.full-crops{overflow:auto;width:min(950px,100%);margin:auto}.full-crops canvas{width:100%;height:auto;display:block;margin:0 0 12px}.source-label{font-size:12px;color:var(--muted);padding:6px 10px}.pdf-card-head{height:auto;min-height:44px;flex-wrap:wrap;padding:8px}.pdf-chip{max-width:100%}
    @media(max-width:760px){.split-body{grid-template-columns:1fr;height:65vh}.split-list{max-height:130px}.split-dialog{padding:12px}.split-head h2{font-size:18px}.split-foot{flex-wrap:wrap}}
  `;document.head.append(styles);
  const dialog=document.createElement('dialog');dialog.className='split-dialog';dialog.setAttribute('aria-label','Review detected statblocks');
  dialog.innerHTML=`<div class="split-head"><h2>Review statblocks</h2><label>Columns <select id="splitLayout"><option value="auto">Auto</option><option value="1">One</option><option value="2">Two</option></select></label><button class="btn small" id="splitRescan">Re-detect</button><button class="btn small" id="splitCancel">Cancel</button></div><p class="split-note" id="splitSummary"></p><div class="split-body"><div class="split-list"><input id="splitSearch" class="resource-input" aria-label="Search detected statblocks" placeholder="Find creature"><div id="splitCandidates"></div><button class="btn small" id="splitAdd">+ Manual statblock</button></div><div class="split-detail" id="splitDetail"></div></div><div class="split-foot"><span id="splitCount"></span><button class="btn small" id="splitKeep">Keep original PDF only</button><button class="btn primary" id="splitSave">Save selected statblocks</button></div>`;document.body.append(dialog);
  const libraryStyle=document.createElement('style');libraryStyle.textContent='.pdf-library{max-height:210px;overflow:auto;align-content:start}.split-list input{position:sticky;top:0;z-index:1}';document.head.append(libraryStyle);
  const sources=new Map();let library,scanJob=null,review=null,selectedIndex=0,finishReview=null,renderQueue=Promise.resolve();
  const docs=new Map();
  async function pdfLibrary(){
    if(!library){library=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.min.mjs').then(lib=>{lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs';return lib}).catch(e=>{library=null;throw new Error('Could not load the PDF reader. Check your connection and retry.')})}
    return library;
  }
  async function readDocument(file){const lib=await pdfLibrary();return lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise}
  function status(message){$('#importStatus').textContent=message}
  const libraryTools=document.createElement('details');libraryTools.className='library-tools';libraryTools.innerHTML='<summary>Library tools</summary>';$('#librarySearch').before(libraryTools);
  const repairNames=document.createElement('button');repairNames.className='btn small';repairNames.textContent='Clean up saved names';libraryTools.append(repairNames);
  repairNames.onclick=async()=>{
    if(scanJob){status('Finish the current import before cleaning saved names.');return}
    repairNames.disabled=true;let count=0,failed=0;const updates=[];
    const sameWords=s=>String(s).normalize('NFKC').replace(/[\s\u00ad\u200b-\u200d\ufeff]/g,'').toLowerCase();
    try{
      const candidates=pdfs.filter(p=>p.kind==='statblock');
      for(let i=0;i<candidates.length;i++){
        const p=candidates[i];status(`Cleaning creature names ${i+1} of ${candidates.length}…`);
        try{await enqueue(async()=>{
          const region=p.segments[0];if(!region)return;
          const doc=await sourceDocument(p.sourceId),lib=await pdfLibrary(),page=await doc.getPage(region.page),vp=page.getViewport({scale:1}),content=await page.getTextContent();
          const items=content.items.filter(i=>i.str?.trim()).map(i=>{const t=lib.Util.transform(vp.transform,i.transform);return{text:i.str,x:t[4],y:t[5],w:i.width,h:Math.hypot(t[2],t[3])||i.height||10}}).filter(i=>i.x>=region.x*vp.width-2&&i.x<(region.x+region.w)*vp.width&&i.y>=region.y*vp.height&&i.y<=(region.y+region.h)*vp.height);
          const found=StatblockDetection.detect([{number:region.page,width:vp.width,height:vp.height,lines:StatblockDetection.lines(items)}],'1')[0];page.cleanup();
          // Only repair names with the same letters. Keep deliberate custom names unchanged.
          if(found&&sameWords(p.name)===sameWords(found.name)&&p.name!==found.name){updates.push({...p,name:found.name});count++}
        })}catch{failed++}
      }
      if(updates.length){await dbPutMany(updates);for(const updated of updates){const p=pdfs.find(p=>p.id===updated.id);if(p)p.name=updated.name}renderPdfs()}
      status(`Cleaned ${count} saved name${count===1?'':'s'}. Custom names were kept.${failed?' '+failed+' names could not be checked; their originals were kept.':''}`);
    }catch(e){status('Could not save cleaned names: '+e.message)}finally{repairNames.disabled=false}
  };
  function enqueue(fn){const task=renderQueue.then(fn);renderQueue=task.catch(()=>{});return task}
  async function sourceDocument(id){
    if(docs.has(id)){const doc=docs.get(id);docs.delete(id);docs.set(id,doc);return doc}
    const source=sources.get(id);if(!source)throw new Error('Original PDF not found. Reimport it to restore this statblock.');
    const doc=await readDocument(source.file);docs.set(id,doc);
    if(docs.size>2){const oldest=docs.keys().next().value;await docs.get(oldest).destroy();docs.delete(oldest)}return doc;
  }
  async function cropCanvas(doc,region){
    const page=await doc.getPage(region.page),base=page.getViewport({scale:1});
    const scale=Math.min(2,1300/(base.width*region.w),Math.sqrt(3500000/(base.width*region.w*base.height*region.h)));
    const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(viewport.width*region.w));canvas.height=Math.max(1,Math.ceil(viewport.height*region.h));
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Statblock crop from page ${region.page}`);
    await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[1,0,0,1,-region.x*viewport.width,-region.y*viewport.height],background:'#ffffff'}).promise;
    page.cleanup();return canvas;
  }
  async function paintBlock(holder,block,docOverride){
    holder.textContent='Loading statblock…';
    try{await enqueue(async()=>{
      if(!holder.isConnected)return;
      const doc=docOverride||await sourceDocument(block.sourceId);holder.textContent='';
      for(const segment of block.segments){if(!holder.isConnected)return;holder.append(await cropCanvas(doc,segment))}
    })}catch(e){holder.textContent='Unable to render: '+e.message;holder.classList.add('error')}
  }
  const oldAction=pdfAction;
  renderPdfs=function(){
    document.documentElement.style.setProperty('--cols',state.columns);
    $('#pdfBadge').textContent=pdfs.length+' ITEMS';
    document.querySelectorAll('[data-cols]').forEach(b=>b.classList.toggle('on',+b.dataset.cols===state.columns));
    const query=$('#librarySearch').value.trim().toLowerCase();
    $('#pdfLibrary').innerHTML=pdfs.filter(p=>(p.name+' '+(p.sourceName||'')).toLowerCase().includes(query)).map(p=>`<div class="pdf-chip ${p.open?'open':''}" data-pdf="${p.id}"><button class="open-statblock" data-action="toggle" aria-label="${p.open?'Close':'Open'} ${esc(p.name)}"><span>${esc(p.name)}</span><b>${p.open?'Close':'Open'}</b></button><details class="library-options"><summary aria-label="Options for ${esc(p.name)}">Options</summary>${p.kind==='statblock'?'':`<button data-action="split">Find individual statblocks</button>`}<button data-action="delete" aria-label="Delete ${esc(p.name)}">Delete from library</button></details></div>`).join('')||(query?'<p class="editor-help">No matching statblocks. Try a different name or clear the search.</p>':'');
    $('#pdfGrid').innerHTML=pdfs.filter(p=>p.open).map(p=>`<article class="pdf-card" data-pdf="${p.id}"><div class="pdf-card-head"><strong>${esc(p.name)}</strong><button class="btn small" data-action="full">Expand</button><button class="btn small" data-action="toggle">Close</button></div>${p.kind==='statblock'?`<div class="source-label">${esc(p.sourceName)} · page${p.segments.length>1?'s':''} ${[...new Set(p.segments.map(s=>s.page))].join(', ')}</div><div class="statblock-crops"></div>`:`<object class="pdf-frame" data="${pdfUrl(p)}#view=FitH" type="application/pdf"><a href="${pdfUrl(p)}" target="_blank">Open PDF</a></object>`}</article>`).join('')||'<div class="empty">Import a book, review its detected statblocks, then open the creatures you need.</div>';
    for(const holder of document.querySelectorAll('.statblock-crops')){const p=pdfs.find(p=>p.id===holder.closest('[data-pdf]').dataset.pdf);paintBlock(holder,p)}
  };
  $('#librarySearch').oninput=()=>renderPdfs();
  pdfAction=async function(e){
    const el=e.target.closest('[data-action]'),card=e.target.closest('[data-pdf]');if(!el||!card)return;
    const p=pdfs.find(p=>p.id===card.dataset.pdf);if(!p)return;
    if(el.dataset.action==='split'){await importFiles([p.file]);return}
    if(p.kind!=='statblock'){await oldAction(e);return}
    if(el.dataset.action==='toggle'){p.open=!p.open;await dbPut(p);renderPdfs()}
    else if(el.dataset.action==='full'){
      $('#fullTitle').textContent=p.name;$('#fullPdf').hidden=true;let holder=$('#fullCrops');if(!holder){holder=document.createElement('div');holder.id='fullCrops';holder.className='full-crops';$('#fullscreen').append(holder)}holder.hidden=false;$('#fullscreen').hidden=false;paintBlock(holder,p);
    }else if(el.dataset.action==='delete'){
      if(!confirm(`Remove ${p.name} from this device?`))return;
      await dbDelete(p.id);pdfs=pdfs.filter(x=>x.id!==p.id);renderPdfs();
      if(!pdfs.some(x=>x.sourceId===p.sourceId)){await enqueue(async()=>{if(docs.has(p.sourceId)){await docs.get(p.sourceId).destroy();docs.delete(p.sourceId)}await dbDelete(p.sourceId);sources.delete(p.sourceId)})}
    }
  };
  const closeFull=$('#closeFull').onclick;$('#closeFull').onclick=()=>{closeFull();$('#fullPdf').hidden=false;if($('#fullCrops')){$('#fullCrops').hidden=true;$('#fullCrops').replaceChildren()}};
  $('#pdfLibrary').onclick=$('#pdfGrid').onclick=e=>pdfAction(e).catch(err=>status('Could not update library: '+err.message));
  function renderCandidates(){
    const q=$('#splitSearch').value.toLowerCase();
    $('#splitCandidates').innerHTML=review.blocks.map((b,i)=>({b,i})).filter(({b})=>b.name.toLowerCase().includes(q)).map(({b,i})=>`<button class="btn small ${i===selectedIndex?'selected':''}" data-index="${i}">${b.selected?'☑':'☐'} ${esc(b.name)} <small>p. ${b.segments[0]?.page||'?'}</small></button>`).join('');
    const count=review.blocks.filter(b=>b.selected).length;$('#splitCount').textContent=`${count} of ${review.blocks.length} selected`;$('#splitSave').disabled=!count;
  }
  function renderDetail(){
    const b=review.blocks[selectedIndex];renderCandidates();
    if(!b){$('#splitDetail').innerHTML='<p>No reliable statblocks found. This may be a scan or an unsupported layout. No pages have been split. Add manual regions or keep the original PDF.</p>';return}
    $('#splitDetail').innerHTML=`<label><input id="splitInclude" type="checkbox" ${b.selected?'checked':''}> Save this creature</label><input id="splitName" class="resource-input" aria-label="Statblock name" type="text" value="${esc(b.name)}"><p class="split-note">Check the name and preview below. Uncheck creatures you do not want, then click Save selected statblocks.</p><details><summary>Fix a cut-off or oversized preview (advanced)</summary><p class="split-note">${esc(b.notes)} These percentages control which part of the page is shown. Add a continuation region if the creature spans more than one page.</p><div id="splitRegions">${b.segments.map((s,i)=>`<fieldset data-segment="${i}"><legend>Region ${i+1}</legend><div class="crop-fields">${['page','x','y','w','h'].map(k=>`<label>${{page:'Page',x:'Left %',y:'Top %',w:'Width %',h:'Height %'}[k]}<input aria-label="Region ${i+1} ${{page:'page',x:'left',y:'top',w:'width',h:'height'}[k]}" data-field="${k}" type="number" min="${k==='page'?1:0}" max="${k==='page'?review.doc.numPages:100}" step="${k==='page'?1:.1}" value="${k==='page'?s[k]:+(s[k]*100).toFixed(2)}"></label>`).join('')}<button class="btn small" data-remove="${i}">Remove region</button><a class="back" target="_blank" href="${review.url}#page=${s.page}">View full source page</a></div></fieldset>`).join('')}</div><button class="btn small" id="splitRegionAdd">+ Continuation region</button></details><div class="crop-preview" id="splitPreview" style="margin-top:12px"></div>`;
    paintBlock($('#splitPreview'),b,review.doc);
  }
  $('#splitCandidates').onclick=e=>{const b=e.target.closest('[data-index]');if(b){selectedIndex=+b.dataset.index;renderDetail()}};
  $('#splitSearch').oninput=renderCandidates;
  $('#splitDetail').oninput=e=>{if(e.target.id==='splitName'&&review.blocks[selectedIndex]){review.blocks[selectedIndex].name=e.target.value.trim()||'Unnamed creature';renderCandidates()}};
  $('#splitDetail').onchange=e=>{
    const b=review.blocks[selectedIndex];if(!b)return;
    if(e.target.id==='splitInclude'){b.selected=e.target.checked;renderCandidates();return}
    if(e.target.id==='splitName'){b.name=e.target.value.trim()||'Unnamed creature';renderCandidates();return}
    const field=e.target.dataset.field;if(!field)return;
    const s=b.segments[+e.target.closest('[data-segment]').dataset.segment];let value=Number(e.target.value);if(!Number.isFinite(value))return;
    if(field==='page')s.page=Math.max(1,Math.min(review.doc.numPages,Math.round(value)));
    else s[field]=Math.max((field==='w'||field==='h') ? .01 : 0,Math.min(.99,value/100));
    s.w=Math.min(s.w,1-s.x);s.h=Math.min(s.h,1-s.y);renderDetail();
  };
  $('#splitDetail').onclick=e=>{
    const b=review?.blocks[selectedIndex];if(!b)return;
    if(e.target.dataset.remove!==undefined){b.segments.splice(+e.target.dataset.remove,1);if(!b.segments.length)b.selected=false;renderDetail()}
    else if(e.target.id==='splitRegionAdd'){const last=b.segments.at(-1);b.segments.push({page:Math.min(review.doc.numPages,(last?.page||0)+1),x:.05,y:.05,w:.9,h:.9});renderDetail()}
  };
  $('#splitAdd').onclick=()=>{review.blocks.push({name:'New statblock',selected:true,notes:'Manual crop. Adjust the bounds to include only this creature.',segments:[{page:1,x:.05,y:.05,w:.9,h:.9}]});selectedIndex=review.blocks.length-1;renderDetail()};
  $('#splitRescan').onclick=()=>{if(!confirm('Re-detect boundaries and replace your edits in this review?'))return;review.blocks=StatblockDetection.detect(review.pages,$('#splitLayout').value);selectedIndex=0;renderDetail()};
  function finish(result){dialog.close();const resolve=finishReview;finishReview=null;resolve?.(result)}
  $('#splitCancel').onclick=()=>finish('cancel');dialog.oncancel=e=>{e.preventDefault();if(!$('#splitCancel').disabled)finish('cancel')};$('#splitKeep').onclick=()=>finish('original');
  $('#splitSave').onclick=()=>{const empty=review.blocks.find(b=>b.selected&&!b.segments.length);if(empty){status('Add at least one region to '+empty.name);return}finish('save')};
  async function importFiles(files){
    if(scanJob){notice('Finish or cancel the current import first.');return}
    const valid=[...files].filter(f=>f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf'));if(!valid.length){status('Choose a PDF file.');return}
    const job={cancel:false};scanJob=job;$('#pdfInput').disabled=true;$('#cancelImport').hidden=false;$('#cancelImport').onclick=()=>{job.cancel=true;status('Cancelling scan…')};
    try{
      for(const file of valid){
        if(job.cancel)break;status(`Opening ${file.name}…`);let doc,url;
        try{
          doc=await readDocument(file);const lib=await pdfLibrary(),pages=[];let textPages=0;
          for(let n=1;n<=doc.numPages;n++){
            if(job.cancel)break;status(`${file.name}: scanning page ${n} of ${doc.numPages} for creature headers…`);
            const page=await doc.getPage(n),vp=page.getViewport({scale:1}),content=await page.getTextContent();
            const items=content.items.filter(i=>i.str?.trim()).map(i=>{const t=lib.Util.transform(vp.transform,i.transform);return {text:i.str,x:t[4],y:t[5],w:i.width,h:Math.hypot(t[2],t[3])||i.height||10}});
            if(items.length)textPages++;pages.push({number:n,width:vp.width,height:vp.height,lines:StatblockDetection.lines(items)});page.cleanup();
            await new Promise(resolve=>setTimeout(resolve,0));
          }
          if(job.cancel)break;
          const blocks=StatblockDetection.detect(pages);url=URL.createObjectURL(file);review={file,doc,pages,blocks,url};selectedIndex=0;$('#splitSearch').value='';$('#splitLayout').value='auto';
          $('#splitSummary').textContent=`${file.name} · ${doc.numPages} pages · ${blocks.length} candidate statblocks. ${textPages<doc.numPages?`${doc.numPages-textPages} pages have no extractable text (scans need manual crops). `:''}Automatic boundaries can include nearby text; review names and crops. Multiple regions stay together as one creature.`;
          renderDetail();$('#cancelImport').hidden=true;dialog.showModal();const decision=await new Promise(resolve=>finishReview=resolve);
          if(decision==='cancel'){job.cancel=true;break}
          status('Saving to this browser…');
          if(decision==='original'){
            const item={id:uid(),name:file.name,file,open:pdfs.filter(p=>p.open).length<2,created:Date.now()};await dbPut(item);pdfs.push(item);status(`Kept ${file.name} as one PDF. No page-by-page split was made.`);
          }else{
            const source={id:uid(),kind:'source',name:file.name,file,created:Date.now()};
            const items=review.blocks.filter(b=>b.selected).map((b,i)=>({id:uid(),kind:'statblock',sourceId:source.id,sourceName:file.name,name:b.name,segments:b.segments,open:i<Math.max(0,2-pdfs.filter(p=>p.open).length),created:Date.now()+i}));
            // One atomic transaction: a failed/quota-limited save cannot leave half a book.
            await dbPutMany([source,...items]);sources.set(source.id,source);pdfs.push(...items);status(`Saved ${items.length} individual statblocks from ${file.name}. The original is stored once; only open creatures are rendered.`);
          }
          renderPdfs();$('#cancelImport').hidden=false;
        }finally{
          // Preview renders must finish before their PDF worker is disposed.
          $('#splitDetail').replaceChildren();await renderQueue;if(doc)await doc.destroy();if(url)URL.revokeObjectURL(url);review=null;
        }
      }
      if(job.cancel)status('Import cancelled. Previously saved items are unchanged.');
    }catch(e){status(`Import failed: ${e.name==='PasswordException'?'This PDF is password-protected. Import an unlocked copy.':e.message} Your existing library is unchanged.`)}
    finally{scanJob=null;$('#pdfInput').disabled=false;$('#pdfInput').value='';$('#cancelImport').hidden=true}
  }
  window.statblockImporter={importFiles,setSources:items=>items.forEach(p=>sources.set(p.id,p))};
})();
