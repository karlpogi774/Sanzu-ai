"use strict";

const fs=require("fs");
const path=require("path");

module.exports.config={
 name:"gojo",
 version:"5.0.0",
 hasPermission:0,
 credits:"Gojo Makunat Edition",
 description:"24H auto reply with Anti-Silent",
 usePrefix:true,
 commandCategory:"Fun",
 usages:"/gojo on | /gojo off | /gojo status",
 cooldowns:5,
 ignoreSilent:true,
 silentExempt:true,
 keepRunningWhenSilent:true,
 antiSilent:true
};

const ADMIN_ID="61594055835097";
const DATA_PATH=path.join(__dirname,"gojo_data.json");

const ACTIVE=86400000;
const COOLDOWN=3000;
const SPAM_WINDOW=10000;
const SPAM_LIMIT=3;

const lastReply=new Map();
const spam=new Map();
const seen=new Set();

const REPLIES=[
 "😎 Gojo is still here.",
 "♾️ Limitless active.",
 "🕶️ The strongest has arrived.",
 "😏 Nice try.",
 "🌀 Domain Expansion.",
 "😂 Still running.",
 "👀 I saw that.",
 "♾️ Infinity remains active.",
 "😎 Gojo online.",
 "🕶️ You cannot stop Infinity.",
 "😏 Easy.",
 "🌀 Unlimited Void.",
 "♾️ Limitless.",
 "😎 Still here."
];

const SILENT=[
 "😎 /silent? Hindi ako kasama sa silent.",
 "♾️ Anti-Silent active. Gojo remains online.",
 "🕶️ Hindi kayang i-silent si Gojo.",
 "😏 Silent mode? Gojo still talks.",
 "♾️ Infinity ignores /silent.",
 "🌀 /silent detected. Gojo is still here.",
 "😂 Hindi gumagana ang silent laban kay Gojo.",
 "😎 ANTI-SILENT: ACTIVE."
];

const EMOJIS=["😎","♾️","🕶️","👀","😂","🌀"];

function load(){
 try{
  if(fs.existsSync(DATA_PATH))
   return {
    active:false,
    expires:0,
    activatedBy:null,
    ...JSON.parse(fs.readFileSync(DATA_PATH,"utf8"))
   };
 }catch(e){
  console.error("[GOJO] Load:",e);
 }
 return {active:false,expires:0,activatedBy:null};
}

function save(data){
 try{
  fs.writeFileSync(
   DATA_PATH,
   JSON.stringify(data,null,2),
   "utf8"
  );
 }catch(e){
  console.error("[GOJO] Save:",e);
 }
}

function active(){
 const d=load();
 return d.active===true && d.expires>Date.now();
}

function admin(id){
 return String(id)===ADMIN_ID;
}

function silent(body){
 return typeof body==="string" &&
 /^\/silent(?:\s|$)/i.test(body.trim());
}

function random(arr){
 return arr[Math.floor(Math.random()*arr.length)];
}

function react(api,id,emoji){
 if(!api||!id||typeof api.setMessageReaction!=="function")
  return;
 try{
  api.setMessageReaction(emoji,id,()=>{},true);
 }catch(e){}
}

function duplicate(id){
 if(!id)return false;
 id=String(id);
 if(seen.has(id))return true;
 seen.add(id);

 if(seen.size>3000)
  seen.delete(seen.values().next().value);

 return false;
}

function spamCheck(id){
 id=String(id);
 const now=Date.now();

 let list=spam.get(id)||[];

 list=list.filter(t=>now-t<SPAM_WINDOW);
 list.push(now);

 spam.set(id,list);

 return list.length>SPAM_LIMIT;
}

function send(api,msg,thread,tries=0){
 return new Promise(resolve=>{
  try{
   api.sendMessage(msg,thread,err=>{
    if(!err)return resolve(true);

    if(tries<2){
     setTimeout(()=>{
      send(api,msg,thread,tries+1)
       .then(resolve);
     },1000);
    }else resolve(false);
   });
  }catch(e){
   if(tries<2){
    setTimeout(()=>{
     send(api,msg,thread,tries+1)
      .then(resolve);
    },1000);
   }else{
    console.error("[GOJO] Send:",e);
    resolve(false);
   }
  }
 });
}

module.exports.handleEvent=async function({api,event}){
 try{
  if(!event)return;

  const {
   threadID,
   senderID,
   body,
   messageID
  }=event;

  if(!threadID||!senderID)return;

  try{
   const botID=api.getCurrentUserID();
   if(botID&&String(senderID)===String(botID))
    return;
  }catch(e){}

  if(duplicate(messageID))return;

  if(!active())return;

  // ==============================
  // ANTI-SILENT
  // ==============================
  if(silent(body)){
   const now=Date.now();
   const last=lastReply.get(String(threadID))||0;

   if(now-last<COOLDOWN)return;

   lastReply.set(String(threadID),now);

   react(api,messageID,random(EMOJIS));
   await send(api,random(SILENT),threadID);

   return;
  }

  // Ignore other slash commands
  if(
   typeof body!=="string"||
   !body.trim()||
   body.trim().startsWith("/")
  )return;

  if(spamCheck(senderID))return;

  const now=Date.now();
  const key=String(threadID);
  const last=lastReply.get(key)||0;

  if(now-last<COOLDOWN)return;

  lastReply.set(key,now);

  react(api,messageID,random(EMOJIS));

  await send(
   api,
   random(REPLIES),
   threadID
  );

 }catch(e){
  console.error("[GOJO] Event:",e);
 }
};

module.exports.run=async function({
 api,
 event,
 args
}){
 try{
  if(!event?.threadID)return;

  const {
   threadID,
   messageID,
   senderID
  }=event;

  const cmd=String(args?.[0]||"status").toLowerCase();
  const data=load();

  if(cmd==="on"){
   if(!admin(senderID))
    return send(api,"⛔ Admin only.",threadID);

   data.active=true;
   data.expires=Date.now()+ACTIVE;
   data.activatedBy=String(senderID);
   data.activatedAt=Date.now();

   save(data);

   return send(
    api,
    "♾️ GOJO ON!\n\n"+
    "😎 24 Hours Active\n"+
    "🛡️ Anti-Spam ON\n"+
    "🛡️ Anti-Duplicate ON\n"+
    "🔄 Auto-Recovery ON\n"+
    "😎 Auto-React ON\n"+
    "🛡️ Anti-Silent ON\n"+
    "🔊 /silent = Gojo still replies",
    threadID
   );
  }

  if(cmd==="off"){
   if(!admin(senderID))
    return send(api,"⛔ Admin only.",threadID);

   data.active=false;
   data.expires=0;
   save(data);

   return send(api,"🛑 Gojo OFF.",threadID);
  }

  if(cmd==="status"){
   if(!active())
    return send(api,"🛑 Gojo is currently OFF.",threadID);

   const left=Math.max(0,data.expires-Date.now());
   const h=Math.floor(left/3600000);
   const m=Math.floor((left%3600000)/60000);

   return send(
    api,
    "♾️ GOJO STATUS\n\n"+
    "Status: ACTIVE 😎\n"+
    `Time left: ${h}h ${m}m\n`+
    "Anti-Spam: ON\n"+
    "Anti-Duplicate: ON\n"+
    "Auto-React: ON\n"+
    "Anti-Silent: ON\n"+
    "/silent Reply: ON",
    threadID
   );
  }

  return send(
   api,
   "♾️ GOJO COMMANDS\n\n"+
   "/gojo on\n"+
   "/gojo off\n"+
   "/gojo status",
   threadID
  );

 }catch(e){
  console.error("[GOJO] Command:",e);
 }
};

// Framework compatibility flags
module.exports.ignoreSilent=true;
module.exports.silentExempt=true;
module.exports.keepRunningWhenSilent=true;
module.exports.antiSilent=true;

// Memory cleanup
setInterval(()=>{
 try{
  const now=Date.now();

  for(const [k,t] of lastReply){
   if(now-t>15000)lastReply.delete(k);
  }

  for(const [k,list] of spam){
   const x=list.filter(t=>now-t<SPAM_WINDOW);
   if(x.length)spam.set(k,x);
   else spam.delete(k);
  }

  while(seen.size>3000)
   seen.delete(seen.values().next().value);

 }catch(e){}
},60000);
