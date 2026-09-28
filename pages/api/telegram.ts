import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url,key,{auth:{persistSession:false}});
}
function money(n:any){ return Math.round(Number(n)*100)/100; }
function validateSplit(r:number,a:number,j:number){
  if([r,a,j].some(v=>!Number.isFinite(v)||v<0||v>100)) throw new Error("Each commission share must be 0-100%.");
  if(Math.abs(r+a+j-100)>0.0001) throw new Error("Commission shares must total 100%.");
}
async function send(chatId:number|string,text:string){
  const token=process.env.TELEGRAM_BOT_TOKEN;
  if(!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text})
  });
  if(!r.ok) throw new Error(await r.text());
}
function googleClient(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey=process.env.GOOGLE_PRIVATE_KEY;
  if(!email || !rawKey) throw new Error("Google Sheets credentials are missing.");
  const auth=new google.auth.JWT({email,key:rawKey.replace(/\\n/g,"\n"),scopes:["https://www.googleapis.com/auth/spreadsheets"]});
  return google.sheets({version:"v4",auth});
}
async function upsert(tab:string,reference:string,headers:string[],values:any[]){
  const spreadsheetId=process.env.GOOGLE_SHEETS_ID;
  if(!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID is missing.");
  const gs=googleClient();
  const current=await gs.spreadsheets.values.get({spreadsheetId,range:`${tab}!A:Z`});
  let rows=current.data.values||[];
  if(rows.length===0){
    await gs.spreadsheets.values.update({spreadsheetId,range:`${tab}!A1`,valueInputOption:"RAW",requestBody:{values:[headers]}});
    rows=[headers];
  }
  const idx=rows.findIndex((r:any[],i:number)=>i>0 && r?.[0]===reference);
  if(idx>0){
    await gs.spreadsheets.values.update({spreadsheetId,range:`${tab}!A${idx+1}`,valueInputOption:"RAW",requestBody:{values:[values]}});
  }else{
    await gs.spreadsheets.values.append({spreadsheetId,range:`${tab}!A:Z`,valueInputOption:"RAW",insertDataOption:"INSERT_ROWS",requestBody:{values:[values]}});
  }
}
async function syncSale(s:any){
  const h=["Reference","Submission time","Salesperson","Customer","Project","Description","Amount","Proposed Richard %","Proposed Anastasia %","Proposed Jean-Claude %","Approved Richard %","Approved Anastasia %","Approved Jean-Claude %","Richard commission","Anastasia commission","Jean-Claude commission","Status"];
  const v=[s.reference,s.submitted_at,s.salesperson_code,s.customer,s.project,s.description,Number(s.amount),Number(s.proposed_richard),Number(s.proposed_anastasia),Number(s.proposed_jean),"","","",0,0,0,s.status];
  await upsert("Sales",s.reference,h,v);
}
async function syncExpense(e:any){
  const h=["Reference","Submission time","Reporter","Description","Category","Amount","Proposed allocation","Final allocation","Status"];
  const v=[e.reference,e.submitted_at,e.reporter_code,e.description,e.category,Number(e.amount),e.proposed_allocation,e.final_allocation??"",e.status];
  await upsert("Expenses",e.reference,h,v);
}

function splitParts(text:string){ return text.split("|").map(x=>x.trim()); }

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  try{
    if(req.method!=="POST") return res.status(405).json({ok:false});
    const secret=req.headers["x-telegram-bot-api-secret-token"];
    if(process.env.TELEGRAM_WEBHOOK_SECRET && secret!==process.env.TELEGRAM_WEBHOOK_SECRET) return res.status(403).json({ok:false});

    const msg=req.body?.message;
    if(!msg?.from?.id || !msg?.chat?.id || !msg?.text) return res.status(200).json({ok:true});

    const database=db();
    const {data:emp}=await database.from("employees").select("*").eq("telegram_user_id",msg.from.id).single();
    if(!emp){
      await send(msg.chat.id,"Your Telegram account is not linked. Ask the manager to link your Telegram user ID first.");
      return res.status(200).json({ok:true});
    }

    await database.from("employees").update({telegram_chat_id:msg.chat.id}).eq("id",emp.id);
    const text=String(msg.text).trim();

    if(text==="/start"){
      await send(msg.chat.id,
`Friends Included bot ready.

SALE:
/sale | REF | Customer | A/B | Description | Amount | Richard% | Anastasia% | Jean%

EXPENSE:
/expense | REF | Description | Materials/Travel/Other | Amount | A/B/Company overhead`);
      return res.status(200).json({ok:true});
    }

    if(text.startsWith("/sale")){
      if(emp.role!=="salesperson"){ await send(msg.chat.id,"Permission denied: only salespeople can submit sales."); return res.status(200).json({ok:true}); }
      const p=splitParts(text);
      if(p.length!==9) throw new Error("Use: /sale | REF | Customer | A/B | Description | Amount | Richard% | Anastasia% | Jean%");
      const reference=p[1],customer=p[2],project=p[3],description=p[4],amount=Number(p[5]),r=Number(p[6]),a=Number(p[7]),j=Number(p[8]);
      validateSplit(r,a,j);
      if(!reference || !customer || !["A","B"].includes(project) || !description || !(amount>0)) throw new Error("Invalid sale data.");

      const {data,error}=await database.from("sales").insert({
        reference,salesperson_code:emp.code,customer,project,description,amount,
        proposed_richard:r,proposed_anastasia:a,proposed_jean:j,status:"Pending approval",
        original_telegram_chat_id:msg.chat.id
      }).select().single();
      if(error) throw new Error(error.code==="23505"?"Duplicate reference.":error.message);

      let sync="ok";
      try{ await syncSale(data); }catch{ sync="failed"; }
      await database.from("sales").update({sheet_sync_status:sync}).eq("id",data.id);

      await send(msg.chat.id,`Recorded ${data.reference}: €${Number(data.amount).toFixed(2)}, Project ${data.project}, status ${data.status}. Sheet sync: ${sync}.`);
      return res.status(200).json({ok:true});
    }

    if(text.startsWith("/expense")){
      if(emp.role!=="expense_reporter"){ await send(msg.chat.id,"Permission denied: only Kevin can submit expenses."); return res.status(200).json({ok:true}); }
      const p=splitParts(text);
      if(p.length!==6) throw new Error("Use: /expense | REF | Description | Materials/Travel/Other | Amount | A/B/Company overhead");
      const reference=p[1],description=p[2],category=p[3],amount=Number(p[4]),allocation=p[5];
      if(!reference || !description || !["Materials","Travel","Other"].includes(category) || !(amount>0) || !["A","B","Company overhead"].includes(allocation)) throw new Error("Invalid expense data.");
      const overhead=allocation==="Company overhead";

      const {data,error}=await database.from("expenses").insert({
        reference,reporter_code:emp.code,description,category,amount,proposed_allocation:allocation,
        final_allocation:overhead?"Company overhead":null,status:overhead?"Allocated":"Awaiting allocation",
        original_telegram_chat_id:msg.chat.id
      }).select().single();
      if(error) throw new Error(error.code==="23505"?"Duplicate reference.":error.message);

      let sync="ok";
      try{ await syncExpense(data); }catch{ sync="failed"; }
      await database.from("expenses").update({sheet_sync_status:sync}).eq("id",data.id);

      await send(msg.chat.id,`Recorded ${data.reference}: €${Number(data.amount).toFixed(2)}, proposed ${data.proposed_allocation}, status ${data.status}. Sheet sync: ${sync}.`);
      return res.status(200).json({ok:true});
    }

    await send(msg.chat.id,"Unknown command. Send /start for instructions.");
    return res.status(200).json({ok:true});
  }catch(e:any){
    try{
      const chatId=req.body?.message?.chat?.id;
      if(chatId) await send(chatId,`Error: ${e?.message || "Unknown error"}`);
    }catch{}
    return res.status(200).json({ok:true});
  }
}
