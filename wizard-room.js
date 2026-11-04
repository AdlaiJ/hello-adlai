// Word rooms use the same PeerJS service as the site's other friend games.
const words='acorn amber arrow atlas birch bloom breeze cedar cloud clover comet coral crown dawn ember fern flame frost glade globe grove hazel ivory jasper jewel lilac lotus lunar maple mist moon moss opal orbit pearl petal prism quartz raven reef ridge river ruby sage shell solar spark spire stone storm thorn tiger torch tower tulip vale violet wave willow wisp'.split(' ');
let loading;
function loadPeer(){
 if(window.Peer)return Promise.resolve();
 return loading??=new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';tag.onload=resolve;tag.onerror=()=>{loading=null;tag.remove();reject(Error('Could not load the room service.'))};document.head.append(tag)});
}
export function openRoom(host,word,events){
 let peer,link,closed=false,timer,tries=0;
 const stop=()=>{closed=true;clearTimeout(timer);peer?.destroy()};
 function fail(msg){if(!closed){stop();events.error(msg)}}
 function attach(c){
  if(link){c.on('open',()=>c.close());return}link=c;
  timer=setTimeout(()=>fail('Could not reach the other player. Check the room word or try another network.'),25000);
  c.on('open',()=>{if(closed)return;clearTimeout(timer);events.connected()});
  c.on('data',data=>{if(!closed&&data&&typeof data==='object')events.data(data)});
  c.on('close',()=>fail('The other wizard left the room.'));
  c.on('error',()=>fail('The room connection was lost.'));
 }
 function start(){
  if(closed)return;const code=host?words[crypto.getRandomValues(new Uint32Array(1))[0]%words.length]:word;
  const instance=peer=new Peer(host?'wizardwars-schools-'+code:undefined,{secure:true});
  instance.on('open',()=>{if(closed||peer!==instance)return;if(host)events.code(code);else attach(peer.connect('wizardwars-schools-'+code,{reliable:true,serialization:'json'}))});
  instance.on('connection',c=>{if(host&&!closed)attach(c);else c.on('open',()=>c.close())});
  instance.on('error',err=>{if(closed||peer!==instance)return;if(host&&err.type==='unavailable-id'&&++tries<12){instance.destroy();start()}else fail(err.type==='peer-unavailable'?'Room not found. Check the word and that the host is still online.':'Room connection failed. Try creating another room or changing networks.')});
 }
 loadPeer().then(start).catch(e=>fail(e.message));
 return {stop,send:m=>{if(link?.open)link.send(m)}};
}
