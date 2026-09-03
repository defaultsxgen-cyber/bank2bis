const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const upload = multer({ dest: "/tmp/bank2bis-uploads" });
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const bosses = [
  {id:"vorkath",name:"Vorkath",style:"Ranged",hp:750,defence:214,magic:150,ranged:150,weakness:"Ranged",notes:"Dragonfire protection and anti-dragon equipment are essential."},
  {id:"zulrah",name:"Zulrah",style:"Ranged/Magic",hp:500,defence:300,magic:300,ranged:100,weakness:"Style rotation",notes:"Optimise around the current phase and bring both ranged and magic switches."},
  {id:"nex",name:"Nex",style:"Ranged",hp:3400,defence:260,magic:250,ranged:250,weakness:"Ranged",notes:"Phase mechanics and team role matter; this is a gear starting point."},
  {id:"hydra",name:"Alchemical Hydra",style:"Ranged",hp:1100,defence:240,magic:200,ranged:200,weakness:"Ranged",notes:"Prayer/phase timing and task status can materially change the best setup."},
  {id:"cerberus",name:"Cerberus",style:"Melee/Ranged/Magic",hp:600,defence:220,magic:220,ranged:220,weakness:"Varies",notes:"Ghost mechanics make prayer and attack-style choices important."},
  {id:"muspah",name:"Phantom Muspah",style:"Ranged/Magic",hp:850,defence:200,magic:200,ranged:200,weakness:"Ranged/Magic",notes:"A two-style setup is commonly useful."},
  {id:"duke",name:"Duke Sucellus",style:"Melee",hp:1400,defence:250,magic:150,ranged:150,weakness:"Slash",notes:"Special attack and phase mechanics affect practical DPS."},
  {id:"vardorvis",name:"Vardorvis",style:"Melee",hp:700,defence:230,magic:100,ranged:100,weakness:"Slash",notes:"High-pressure melee mechanics make defensive and switch complexity relevant."},
  {id:"whisperer",name:"The Whisperer",style:"Magic/Ranged",hp:1000,defence:250,magic:300,ranged:200,weakness:"Magic/Ranged",notes:"Style switching and sanity mechanics must be modelled for final optimisation."},
  {id:"leviathan",name:"The Leviathan",style:"Ranged",hp:1500,defence:240,magic:100,ranged:250,weakness:"Ranged",notes:"Ranged accuracy and special mechanics are important."},
  {id:"jad",name:"TzTok-Jad",style:"Ranged/Magic",hp:250,defence:240,magic:50,ranged:50,weakness:"Ranged/Magic",notes:"Prayer switching is the key mechanic."},
  {id:"demons",name:"Demonic Gorilla",style:"Melee/Ranged",hp:380,defence:200,magic:100,ranged:100,weakness:"Melee/Ranged",notes:"Protection prayer and overhead switching matter."}
];

const demoBank = [
  ["Twisted bow",1],["Masori body (f)",1],["Masori chaps (f)",1],["Necklace of anguish",1],
  ["Pegasian boots",1],["Barrows gloves",1],["Archer ring (i)",1],["Ava's assembler",1],
  ["Dragonfire ward",1],["Dragon hunter crossbow",1],["Zaryte crossbow",1],
  ["Armadyl godsword",1],["Toxic blowpipe",1],["Rune pouch",1],["Super combat potion(4)",4],
  ["Ranging potion(4)",4],["Super restore(4)",8],["Anglerfish",40],["Extended super antifire(4)",4]
];

app.get("/api/health", (_,res)=>res.json({status:"ok",app:"Bank2BiS",version:"1.2.0"}));
app.get("/api/bosses", (_,res)=>res.json(bosses));
app.get("/api/demo-bank", (_,res)=>res.json(demoBank));

app.get("/api/wiki/item/:name", async (req,res)=>{
  const title = req.params.name.replace(/_/g," ");
  const url = "https://oldschool.runescape.wiki/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles="+encodeURIComponent(title);
  try {
    const r = await fetch(url, {headers:{"User-Agent":"Bank2BiS/1.1 (OSRS gear optimiser)"}});
    if(!r.ok) throw new Error("Wiki request failed");
    res.json(await r.json());
  } catch(e) {
    res.status(502).json({error:"Wiki request unavailable", detail:e.message});
  }
});

app.get("/api/prices/latest", async (_,res)=>{
  try {
    const r = await fetch("https://prices.runescape.wiki/api/v1/osrs/latest", {headers:{"User-Agent":"Bank2BiS/1.1"}});
    if(!r.ok) throw new Error("Price request failed");
    res.json(await r.json());
  } catch(e) {
    res.status(502).json({error:"Price API unavailable", detail:e.message});
  }
});

app.post("/api/scan-bank", upload.single("bank"), (req,res)=>{
  if(!req.file) return res.status(400).json({error:"No screenshot uploaded"});
  res.json({
    status:"review_required",
    message:"Screenshot received. Automatic item recognition is intentionally not claimed yet. Review/add items in the bank editor.",
    file:req.file.filename
  });
});

app.post("/api/optimize", (req,res)=>{
  const {bossId, bank=[], stats={}} = req.body;
  const boss = bosses.find(b=>b.id===bossId);
  if(!boss) return res.status(404).json({error:"Boss not found"});

  const owned = new Set(bank.map(x => Array.isArray(x) ? x[0].toLowerCase() : String(x).toLowerCase()));
  const candidates = [
    ["Twisted bow","weapon"],["Dragon hunter crossbow","weapon"],["Toxic blowpipe","weapon"],
    ["Masori body (f)","body"],["Masori chaps (f)","legs"],["Necklace of anguish","neck"],
    ["Pegasian boots","boots"],["Barrows gloves","gloves"],["Archer ring (i)","ring"],
    ["Ava's assembler","cape"],["Dragonfire ward","shield"]
  ];
  const preferred = bossId==="vorkath" ? ["Dragon hunter crossbow","Dragonfire ward","Masori body (f)","Masori chaps (f)","Necklace of anguish","Pegasian boots","Barrows gloves","Archer ring (i)","Ava's assembler"] :
                     boss.style.includes("Magic") ? ["Twisted bow","Masori body (f)","Masori chaps (f)","Necklace of anguish"] :
                     ["Twisted bow","Masori body (f)","Masori chaps (f)","Necklace of anguish","Pegasian boots","Barrows gloves","Archer ring (i)","Ava's assembler"];

  const equipment = preferred.map(name => ({name, owned:owned.has(name.toLowerCase())}));
  const ownedCount = equipment.filter(x=>x.owned).length;
  res.json({
    boss, stats,
    confidence:"prototype",
    equipment,
    completion: Math.round(ownedCount/equipment.length*100),
    note:"The optimisation pipeline is wired for bank-aware ranking. Final production DPS requires a verified OSRS combat-data snapshot and boss-mechanic ruleset."
  });
});


app.get("*", (_,res)=>res.sendFile(path.join(__dirname,"..","public","index.html")));
module.exports = app;
