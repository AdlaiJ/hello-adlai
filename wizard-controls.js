const groups = {
  Movement: [['w','Forward'],['s','Backward'],['a','Strafe left'],['d','Strafe right'],[' ','Jump']],
  Camera: [['arrowleft','Look left'],['arrowright','Look right'],['arrowup','Look up'],['arrowdown','Look down'],['r','Level aim'],['shift','Shift lock'],['=','Zoom in'],['-','Zoom out']],
  Combat: [['g','Fire / melee'],['f','Store spell'],...Array.from({length:10},(_,i)=>[String((i+1)%10),'Spell slot '+(i+1)])]
};
const actions=Object.values(groups).flat();
const storageKey='wizard-wars-controls-v1';
const defaults=()=>Object.fromEntries(actions.map(([key])=>[key,key]));
const pretty=key=>({' ':'Space',arrowleft:'←',arrowright:'→',arrowup:'↑',arrowdown:'↓',shift:'Shift','=':'= / +'}[key]||key.toUpperCase());
function normalize(key){return key==='+'?'=':key.toLowerCase()}
function allowed(key){return key.length===1||['shift','arrowup','arrowdown','arrowleft','arrowright','home','end','pageup','pagedown','insert'].includes(key)}
export function setupControls(onOpen,onChange,onClose){
  const byId=id=>document.getElementById(id),dialog=byId('controlsDialog');
  let bindings=defaults(),capture=null,mouse=1,keyboard=1;
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey));
    if(saved){const values=actions.map(([id])=>saved.keys?.[id]);
      if(values.every(k=>typeof k==='string'&&allowed(k)&&normalize(k)===k)&&new Set(values).size===actions.length)bindings=Object.fromEntries(actions.map(([id])=>[id,saved.keys[id]]));
      const valid=v=>Number.isFinite(v)&&v>=.25&&v<=3;
      if(valid(saved.mouse))mouse=saved.mouse;if(valid(saved.keyboard))keyboard=saved.keyboard;
    }
  }catch{}
  const buttons=new Map(),status=byId('controlStatus');
  function render(){for(const [id,button] of buttons){button.textContent=capture===id?'Press a key…':pretty(bindings[id]);button.setAttribute('aria-pressed',String(capture===id))}
    for(const [name,value] of [['mouse',mouse],['keyboard',keyboard]]){byId(name+'Gain').value=value;byId(name+'Value').textContent=Math.round(value*100)+'%'}
  }
  function save(){try{localStorage.setItem(storageKey,JSON.stringify({keys:bindings,mouse,keyboard}))}catch{status.textContent='Settings apply for this session.'}render();onChange()}
  for(const [name,entries] of Object.entries(groups)){
    const section=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=name;section.append(legend);
    for(const [id,label] of entries){const row=document.createElement('div'),caption=document.createElement('span'),button=document.createElement('button');caption.textContent=label;button.setAttribute('aria-label','Change '+label);button.onclick=()=>{capture=id;status.textContent='Press a key. Esc cancels. Shared keys swap actions.';render()};row.append(caption,button);section.append(row);buttons.set(id,button)}byId('controlGroups').append(section);
  }
  dialog.addEventListener('keydown',e=>{
    if(capture===null)return;e.stopPropagation();e.preventDefault();if(e.repeat)return;
    const key=normalize(e.key);
    if(key==='escape'){capture=null;status.textContent='Binding cancelled.';render();return}
    if(!allowed(key)||e.ctrlKey||e.metaKey||e.altKey){status.textContent='Choose a letter, number, symbol, Shift, or navigation key.';return}
    const other=actions.find(([id])=>id!==capture&&bindings[id]===key);
    if(other)bindings[other[0]]=bindings[capture];bindings[capture]=key;status.textContent=other?'Swapped with '+other[1]+'.':'Key updated.';capture=null;save();
  },true);
  for(const name of ['mouse','keyboard'])byId(name+'Gain').oninput=e=>{const value=Number(e.target.value);if(name==='mouse')mouse=value;else keyboard=value;save()};
  byId('resetControls').onclick=()=>{bindings=defaults();mouse=keyboard=1;capture=null;status.textContent='Default controls restored.';save()};
  byId('closeControls').onclick=()=>dialog.close();dialog.onclose=()=>{capture=null;onClose()};
  function open(){onOpen();capture=null;status.textContent='Select an action to change its key.';render();dialog.showModal();byId('closeControls').focus()}
  byId('homeControls').onclick=open;byId('gameControls').onclick=open;
  return {get open(){return dialog.open},get mouse(){return mouse},get keyboard(){return keyboard},label:id=>pretty(bindings[id]),action:key=>actions.find(([id])=>bindings[id]===normalize(key))?.[0]};
}
