let bosses=[], bank=[], selected=null;
const $=s=>document.querySelector(s);
async function get(url){const r=await fetch(url);return r.json()}
function renderBank(){
  $("#bank").innerHTML=bank.length?bank.map(([n,q])=>`<span class="item">${n}${q>1?" ×"+q:""}</span>`).join(""):"<small>No bank items yet.</small>";
}
function renderStats(){
  const names=["Attack","Strength","Defence","Ranged","Magic","Prayer","Slayer"];
  $("#stats").innerHTML=names.map(n=>`<label style="font-size:11px;color:#8e9aaa">${n}<input data-stat="${n.toLowerCase()}" type="number" value="${n==="Prayer"?70:99}" min="1" max="99"></label>`).join("");
}
function renderBosses(){
  $("#bosses").innerHTML=bosses.map(b=>`<button class="boss ${selected?.id===b.id?"active":""}" data-id="${b.id}"><b>${b.name}</b><br><small>${b.style} · ${b.hp} HP</small></button>`).join("");
  document.querySelectorAll(".boss").forEach(x=>x.onclick=()=>{selected=bosses.find(b=>b.id===x.dataset.id);renderBosses();$("#title").textContent=selected.name+" setup";$("#sub").textContent=selected.style+" · bank-aware"});
}
function stats(){
  const o={};document.querySelectorAll("[data-stat]").forEach(i=>o[i.dataset.stat]=+i.value);return o;
}
async function optimise(){
  if(!selected){$("#output").innerHTML="<span class='no'>Choose a boss first.</span>";return}
  const data=await fetch("/api/optimize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bossId:selected.id,bank,stats:stats()})}).then(r=>r.json());
  $("#output").innerHTML=`<div style="margin-bottom:14px"><b>${data.completion}% of recommended slots are in your bank</b><div class="bar" style="margin-top:7px"><i style="width:${data.completion}%"></i></div></div>
  <div class="result"><div class="card" style="padding:0"><div style="padding:12px"><b>Equipment</b></div>${data.equipment.map(x=>`<div class="slot"><span>${x.name}</span><b class="${x.owned?"yes":"no"}">${x.owned?"OWNED":"MISSING"}</b></div>`).join("")}</div>
  <div class="card"><b>Why this setup?</b><p style="color:#b8c2cf;line-height:1.6">${data.boss.notes}</p><p><small>Engine status: ${data.confidence}. ${data.note}</small></p><p><a href="https://oldschool.runescape.wiki/w/${encodeURIComponent(data.boss.name.replaceAll(" ","_"))}" target="_blank">Open ${data.boss.name} on OSRS Wiki ↗</a></p><p><a href="https://tools.runescape.wiki/osrs-dps/" target="_blank">Validate DPS in Wiki calculator ↗</a></p></div></div>`;
}
$("#demo").onclick=async()=>{bank=await get("/api/demo-bank");renderBank()};
$("#clear").onclick=()=>{bank=[];renderBank()};
$("#opt").onclick=optimise;
$("#file").onchange=async e=>{if(!e.target.files[0])return;const fd=new FormData();fd.append("bank",e.target.files[0]);const r=await fetch("/api/scan-bank",{method:"POST",body:fd});const d=await r.json();alert(d.message)};
(async()=>{bosses=await get("/api/bosses");renderBosses();renderStats();renderBank()})();
