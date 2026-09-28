/* Progress merge engine. Stable profile keys and legacy v3 payloads remain supported. */
(function(root){
'use strict';
var own=function(o,k){return Object.prototype.hasOwnProperty.call(o,k);};
function clone(x){return x===undefined?null:JSON.parse(JSON.stringify(x));}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function project(s){
 var out={};
 function put(parts,v,t){out[JSON.stringify(parts)]={v:clone(v),t:Number(t)||0};}
 ['marks','wordMarks','stageLog','wordLog','checks','lessonStates'].forEach(function(field){
  Object.keys(s[field]||{}).forEach(function(k){var v=s[field][k];put([field,k],v,v&&v.t);});
 });
 ['secDone','nDone','duo'].forEach(function(field){Object.keys(s[field]||{}).forEach(function(k){
  var v=s[field][k]||{};(v.dates||(v.d?[v.d]:[])).forEach(function(d){put([field,k,d],true,v.t);});
 });});
 var h=s.habits||{};
 (h.groups||[]).forEach(function(g,gi){
  put(['group',g.id],{title:g.title,icon:g.icon,order:gi},h.t);
  (g.items||[]).forEach(function(it,ii){put(['habit',g.id,it.id],{name:it.name,order:ii},h.t);
   Object.keys(it.d||{}).forEach(function(d){if(it.d[d])put(['habitDay',g.id,it.id,d],true,h.t);});
  });
 });
 (h.trash||[]).forEach(function(g,gi){put(['trashGroup',g.id],Object.assign({},clone(g),{order:gi}),h.t);});
 (s.extra||[]).forEach(function(x){put(['extra',x.c],x,x.t);});
 Object.keys(s.split||{}).forEach(function(k){put(['split',k],s.split[k],s.split[k]);});
 if(s.act&&s.act.d) ['open','study','check'].forEach(function(k){if(s.act[k])put(['activity',s.act.d,k],s.act[k],s.act[k]);});
 return out;
}
function seed(s){var out=project(s);Object.keys(s.syncOps||{}).forEach(function(k){
 try{var p=JSON.parse(k),r=s.syncOps[k];if(Array.isArray(p)&&r&&Number.isFinite(+r.t))out[k]=clone(r);}catch(e){}
 });return out;}
function capture(s,previous,stamp){
 var now=project(s),ops=s.syncOps||seed(s),changed=false;
 var keys=new Set(Object.keys(previous||{}).concat(Object.keys(now)));
 keys.forEach(function(k){if(same(previous&&previous[k]&&previous[k].v,now[k]&&now[k].v))return;
  ops[k]={v:own(now,k)?clone(now[k].v):null,t:stamp};changed=true;
 });s.syncOps=ops;return {snapshot:now,changed:changed};
}
function winner(a,b){if(!a)return b;if(!b)return a;if(a.t!==b.t)return a.t>b.t?a:b;return JSON.stringify(a.v)>=JSON.stringify(b.v)?a:b;}
function materialize(s,ops){
 var result={marks:{},wordMarks:{},stageLog:{},wordLog:{},checks:{},lessonStates:{},secDone:{},nDone:{},duo:{},extra:[],split:{}};
 var groups={},items={},days=[],trashGroups={},activity={},maxHabit=0;
 Object.keys(ops).sort().forEach(function(key){
  var p;try{p=JSON.parse(key);}catch(e){return;}var r=ops[key],v=r.v,f=p[0];
  if(['marks','wordMarks','stageLog','wordLog','checks','lessonStates'].indexOf(f)>=0){if(v!==null)result[f][p[1]]=clone(v);}
  else if(['secDone','nDone','duo'].indexOf(f)>=0){var d=result[f][p[1]]||(result[f][p[1]]={dates:[],t:0});d.t=Math.max(d.t,r.t);if(v)d.dates.push(p[2]);}
  else if(f==='group'){maxHabit=Math.max(maxHabit,r.t);if(v)groups[p[1]]=Object.assign({id:p[1],items:[]},v);}
  else if(f==='habit'){maxHabit=Math.max(maxHabit,r.t);if(v)items[JSON.stringify(p.slice(1))]=Object.assign({id:p[2],gid:p[1],d:{}},v);}
  else if(f==='habitDay'){maxHabit=Math.max(maxHabit,r.t);if(v)days.push(p);}
  else if(f==='trashGroup'){maxHabit=Math.max(maxHabit,r.t);if(v)trashGroups[p[1]]=clone(v);}
  else if(f==='extra'&&v)result.extra.push(clone(v));
  else if(f==='split'&&v!==null)result.split[p[1]]=v;
  else if(f==='activity'&&v) {var a=activity[p[1]]||(activity[p[1]]={d:p[1],open:0,study:0,check:0});a[p[2]]=v;}
 });
 days.forEach(function(p){var it=items[JSON.stringify(p.slice(1,3))];if(it)it.d[p[3]]=1;});
 Object.keys(items).forEach(function(k){var it=items[k],g=groups[it.gid];if(g){delete it.gid;g.items.push(it);}});
 var gs=Object.keys(groups).map(function(k){var g=groups[k];g.items.sort(function(a,b){return a.order-b.order||a.id.localeCompare(b.id);});return g;});
 gs.sort(function(a,b){return a.order-b.order||a.id.localeCompare(b.id);});
 var trash=Object.keys(trashGroups).map(function(k){return trashGroups[k];});trash.sort(function(a,b){return a.order-b.order;});
 if(s.habits||maxHabit||gs.length||trash.length)result.habits={t:maxHabit,groups:gs,trash:trash};
 var ad=Object.keys(activity).sort().pop();if(ad)result.act=activity[ad];
 Object.assign(s,result);s.syncOps=ops;return s;
}
function merge(s,remote){var ops=seed(s),rs=seed(remote);Object.keys(rs).forEach(function(k){ops[k]=clone(winner(ops[k],rs[k]));});materialize(s,ops);return s;}
function installHabitsDateFix(){
 var original=root.stageForCodes;
 if(typeof original!=='function'||original.__habitsDateFix)return;
 var fixed=function(codes,day,word){
  var s=root.state||{},log=s[word?'wordLog':'stageLog']||{},marks=s[word?'wordMarks':'marks']||{},latest=null;
  Object.keys(log).forEach(function(k){var at=k.indexOf('|'),code=k.slice(at+1),r=log[k];if(k.slice(0,at)===day&&codes[code]&&r&&r.s&&(!latest||r.t>latest.t))latest=r;});
  Object.keys(codes).forEach(function(code){var r=marks[code];if(r&&r.s&&r.t){var d=new Date(r.t),iso=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);if(iso===day&&(!latest||r.t>latest.t))latest=r;}});
  return latest;
 };
 fixed.__habitsDateFix=true;
 root.stageForCodes=fixed;
}
if(typeof root.stageForCodes==='function')installHabitsDateFix();
else if(root.addEventListener)root.addEventListener('DOMContentLoaded',function(){installHabitsDateFix();if(typeof root.renderHabits==='function')root.renderHabits();},{once:true});
var api={project:project,seed:seed,capture:capture,merge:merge,same:same};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProgressSync=api;
})(typeof window!=='undefined'?window:this);
