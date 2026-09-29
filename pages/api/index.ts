import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

type Split = { richard:number; anastasia:number; jean:number };

function supabase(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url,key,{auth:{persistSession:false}});
}

function money(n:any){ return Math.round(Number(n)*100)/100; }

function validateSplit(s:Split){
  const vals=[s.richard,s.anastasia,s.jean];
  if(vals.some(v=>!Number.isFinite(v) || v<0 || v>100)) throw new Error("Each commission share must be between 0% and 100%.");
  if(Math.abs(vals.reduce((a,b)=>a+b,0)-100)>0.0001) throw new Error("Commission shares must total 100%.");
}

function calcCommissions(amount:number,s:Split){
  validateSplit(s);
  const pool=money(amount*0.10);
  const result:any={
    richard:money(pool*s.richard/100),
    anastasia:money(pool*s.anastasia/100),
    jean:money(pool*s.jean/100)
  };
  const diff=money(pool-result.richard-result.anastasia-result.jean);
  if(Math.abs(diff)>=0.01){
    const max=Math.max(s.richard,s.anastasia,s.jean);
    const order:(keyof Split)[]=["richard","anastasia","jean"];
    const winner=order.find(k=>s[k]===max)!;
    result[winner]=money(result[winner]+diff);
  }
  return {pool,...result};
}

async function employee(code:string){
  const {data,error}=await supabase().from("employees").select("*").eq("code",code).single();
  if(error || !data) throw new Error("Unknown employee.");
  return data;
}

async function requireRole(code:string,allowed:string[]){
  const e=await employee(code);
  if(!allowed.includes(e.role)) throw new Error("Permission denied.");
  return e;
}

function googleClient(){
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey=process.env.GOOGLE_PRIVATE_KEY;
  if(!email || !rawKey) throw new Error("Google Sheets credentials are missing.");

  let key=rawKey.trim();

  // Vercel may store the JSON private key with quotes or literal \\n sequences.
  if(
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ){
    key=key.slice(1,-1);
  }

  key=key.replace(/\\n/g,"\n").replace(/\r\n/g,"\n");

  if(!key.includes("-----BEGIN PRIVATE KEY-----") || !key.includes("-----END PRIVATE KEY-----")){
    throw new Error("GOOGLE_PRIVATE_KEY format is invalid.");
  }

  const auth=new google.auth.JWT({
    email:email.trim().replace(/\\@/g,"@"),
    key,
    scopes:["https://www.googleapis.com/auth/spreadsheets"]
  });
  return google.sheets({version:"v4",auth});
}

async function upsertSheetRow(tab:string,reference:string,headers:string[],values:any[]){
  const spreadsheetId=process.env.GOOGLE_SHEETS_ID;
  if(!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID is missing.");
  const gs=googleClient();

  const current=await gs.spreadsheets.values.get({spreadsheetId,range:`${tab}!A:Z`});
  let rows=current.data.values || [];
  if(rows.length===0){
    await gs.spreadsheets.values.update({
      spreadsheetId,range:`${tab}!A1`,valueInputOption:"RAW",
      requestBody:{values:[headers]}
    });
    rows=[headers];
  }

  const idx=rows.findIndex((r:any[],i:number)=>i>0 && r?.[0]===reference);
  if(idx>0){
    await gs.spreadsheets.values.update({
      spreadsheetId,range:`${tab}!A${idx+1}`,valueInputOption:"RAW",
      requestBody:{values:[values]}
    });
  }else{
    await gs.spreadsheets.values.append({
      spreadsheetId,range:`${tab}!A:Z`,valueInputOption:"RAW",insertDataOption:"INSERT_ROWS",
      requestBody:{values:[values]}
    });
  }
}

async function syncSale(row:any){
  const headers=[
    "Reference","Submission time","Salesperson","Customer","Project","Description","Amount",
    "Proposed Richard %","Proposed Anastasia %","Proposed Jean-Claude %",
    "Approved Richard %","Approved Anastasia %","Approved Jean-Claude %",
    "Richard commission","Anastasia commission","Jean-Claude commission","Status"
  ];
  const values=[
    row.reference,row.submitted_at,row.salesperson_code,row.customer,row.project,row.description,Number(row.amount),
    Number(row.proposed_richard),Number(row.proposed_anastasia),Number(row.proposed_jean),
    row.approved_richard ?? "",row.approved_anastasia ?? "",row.approved_jean ?? "",
    Number(row.commission_richard||0),Number(row.commission_anastasia||0),Number(row.commission_jean||0),row.status
  ];
  await upsertSheetRow("Sales",row.reference,headers,values);
}

async function syncExpense(row:any){
  const headers=["Reference","Submission time","Reporter","Description","Category","Amount","Proposed allocation","Final allocation","Status"];
  const values=[row.reference,row.submitted_at,row.reporter_code,row.description,row.category,Number(row.amount),row.proposed_allocation,row.final_allocation??"",row.status];
  await upsertSheetRow("Expenses",row.reference,headers,values);
}

async function syncRecord(kind:"sale"|"expense",row:any){
  const db=supabase();
  try{
    if(kind==="sale") await syncSale(row); else await syncExpense(row);
    await db.from(kind==="sale"?"sales":"expenses").update({sheet_sync_status:"ok"}).eq("id",row.id);
    return "ok";
  }catch(e:any){
    console.error("SHEETS_SYNC_ERROR", e?.response?.data || e?.message || e);
    await db.from(kind==="sale"?"sales":"expenses").update({sheet_sync_status:"failed"}).eq("id",row.id);
    return "failed";
  }
}

async function sendTelegram(chatId:number|string,text:string){
  const token=process.env.TELEGRAM_BOT_TOKEN;
  if(!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text})
  });
  if(!r.ok) throw new Error(await r.text());
}

async function notifySale(row:any){
  const db=supabase();
  if(!row.original_telegram_chat_id){
    await db.from("sales").update({notification_status:"no_recipient"}).eq("id",row.id);
    return "no_recipient";
  }
  const changed=
    Number(row.approved_richard)!==Number(row.proposed_richard) ||
    Number(row.approved_anastasia)!==Number(row.proposed_anastasia) ||
    Number(row.approved_jean)!==Number(row.proposed_jean);

  const text=`Sale ${row.reference} approved${changed?" — commission split changed":""}. Sale €${Number(row.amount).toFixed(2)}; total commission €${Number(row.commission_pool).toFixed(2)}. Richard: ${row.proposed_richard}% → ${row.approved_richard}% (€${Number(row.commission_richard).toFixed(2)}). Anastasia: ${row.proposed_anastasia}% → ${row.approved_anastasia}% (€${Number(row.commission_anastasia).toFixed(2)}). Jean-Claude: ${row.proposed_jean}% → ${row.approved_jean}% (€${Number(row.commission_jean).toFixed(2)}).`;
  try{
    await sendTelegram(row.original_telegram_chat_id,text);
    await db.from("sales").update({notification_status:"sent"}).eq("id",row.id);
    return "sent";
  }catch{
    await db.from("sales").update({notification_status:"failed"}).eq("id",row.id);
    return "failed";
  }
}

async function notifyExpense(row:any){
  const db=supabase();
  if(!row.original_telegram_chat_id){
    await db.from("expenses").update({notification_status:"no_recipient"}).eq("id",row.id);
    return "no_recipient";
  }
  const changed=row.final_allocation!==row.proposed_allocation;
  const text=`Expense ${row.reference} — allocation ${changed?"changed":"confirmed"}. €${Number(row.amount).toFixed(2)}: ${row.description}. Proposed: ${row.proposed_allocation}. Approved: ${row.final_allocation}.`;
  try{
    await sendTelegram(row.original_telegram_chat_id,text);
    await db.from("expenses").update({notification_status:"sent"}).eq("id",row.id);
    return "sent";
  }catch{
    await db.from("expenses").update({notification_status:"failed"}).eq("id",row.id);
    return "failed";
  }
}

async function dashboard(actor?:string){
  const db=supabase();
  const [{data:sales,error:se},{data:expenses,error:ee}]=await Promise.all([
    db.from("sales").select("*").order("submitted_at",{ascending:true}),
    db.from("expenses").select("*").order("submitted_at",{ascending:true})
  ]);
  if(se) throw new Error(se.message);
  if(ee) throw new Error(ee.message);
  const ss=sales||[], ex=expenses||[];

  const project=(p:string)=>{
    const approved=ss.filter((s:any)=>s.status==="Approved" && s.project===p);
    const income=approved.reduce((x:number,s:any)=>x+Number(s.amount),0);
    const commissions=approved.reduce((x:number,s:any)=>x+Number(s.commission_pool||0),0);
    const allocated=ex.filter((e:any)=>e.status==="Allocated" && e.final_allocation===p).reduce((x:number,e:any)=>x+Number(e.amount),0);
    return {income:money(income),commissions:money(commissions),allocated:money(allocated),result:money(income-commissions-allocated)};
  };

  const approved=ss.filter((s:any)=>s.status==="Approved");
  const income=approved.reduce((x:number,s:any)=>x+Number(s.amount),0);
  const commissions=approved.reduce((x:number,s:any)=>x+Number(s.commission_pool||0),0);
  const allExpenses=ex.reduce((x:number,e:any)=>x+Number(e.amount),0);

  let visibleSales=ss, visibleExpenses=ex;
  if(actor){
    const e=await employee(actor);
    if(e.role==="salesperson"){ visibleSales=ss.filter((s:any)=>s.salesperson_code===actor); visibleExpenses=[]; }
    if(e.role==="expense_reporter"){ visibleSales=[]; visibleExpenses=ex.filter((x:any)=>x.reporter_code===actor); }
  }

  return {
    projectA:project("A"),
    projectB:project("B"),
    company:{
      overhead:money(ex.filter((e:any)=>e.status==="Allocated" && e.final_allocation==="Company overhead").reduce((x:number,e:any)=>x+Number(e.amount),0)),
      awaiting:money(ex.filter((e:any)=>e.status==="Awaiting allocation").reduce((x:number,e:any)=>x+Number(e.amount),0)),
      result:money(income-commissions-allExpenses)
    },
    commissions:{
      richard:money(approved.reduce((x:number,s:any)=>x+Number(s.commission_richard||0),0)),
      anastasia:money(approved.reduce((x:number,s:any)=>x+Number(s.commission_anastasia||0),0)),
      jean:money(approved.reduce((x:number,s:any)=>x+Number(s.commission_jean||0),0))
    },
    pendingSales:ss.filter((s:any)=>s.status==="Pending approval"),
    awaitingExpenses:ex.filter((e:any)=>e.status==="Awaiting allocation"),
    visibleSales,visibleExpenses
  };
}

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  try{
    if(req.method==="GET"){
      if(req.query.action==="dashboard") return res.status(200).json(await dashboard(String(req.query.actor||"")||undefined));
      return res.status(405).json({ok:false,error:"Method not allowed"});
    }
    if(req.method!=="POST") return res.status(405).json({ok:false,error:"Method not allowed"});

    const b=req.body||{};
    const db=supabase();

    if(b.action==="sale"){
      const emp=await requireRole(b.actor,["salesperson"]);
      const split={richard:Number(b.proposed_richard),anastasia:Number(b.proposed_anastasia),jean:Number(b.proposed_jean)};
      validateSplit(split);
      if(!b.reference || !b.customer || !["A","B"].includes(b.project) || !b.description || !(Number(b.amount)>0)) throw new Error("Missing or invalid required sale data.");

      const {data,error}=await db.from("sales").insert({
        reference:String(b.reference).trim(),salesperson_code:emp.code,customer:String(b.customer).trim(),
        project:b.project,description:String(b.description).trim(),amount:Number(b.amount),
        proposed_richard:split.richard,proposed_anastasia:split.anastasia,proposed_jean:split.jean,
        status:"Pending approval",original_telegram_chat_id:emp.telegram_chat_id??null
      }).select().single();
      if(error) throw new Error(error.code==="23505"?"Duplicate reference.":error.message);
      const sync=await syncRecord("sale",data);
      return res.status(200).json({ok:true,reference:data.reference,status:data.status,sheet_sync_status:sync});
    }

    if(b.action==="expense"){
      const emp=await requireRole(b.actor,["expense_reporter"]);
      if(!b.reference || !b.description || !["Materials","Travel","Other"].includes(b.category) || !["A","B","Company overhead"].includes(b.proposed_allocation) || !(Number(b.amount)>0)) throw new Error("Missing or invalid required expense data.");
      const overhead=b.proposed_allocation==="Company overhead";
      const {data,error}=await db.from("expenses").insert({
        reference:String(b.reference).trim(),reporter_code:emp.code,description:String(b.description).trim(),
        category:b.category,amount:Number(b.amount),proposed_allocation:b.proposed_allocation,
        final_allocation:overhead?"Company overhead":null,status:overhead?"Allocated":"Awaiting allocation",
        original_telegram_chat_id:emp.telegram_chat_id??null
      }).select().single();
      if(error) throw new Error(error.code==="23505"?"Duplicate reference.":error.message);
      const sync=await syncRecord("expense",data);
      return res.status(200).json({ok:true,reference:data.reference,status:data.status,sheet_sync_status:sync});
    }

    if(b.action==="approveSale"){
      await requireRole(b.actor,["manager"]);
      const {data:sale,error}=await db.from("sales").select("*").eq("reference",b.reference).single();
      if(error || !sale) throw new Error("Sale not found.");
      if(sale.status==="Approved") return res.status(200).json({ok:true,alreadyApproved:true,reference:sale.reference});

      const split={richard:Number(b.approved_richard),anastasia:Number(b.approved_anastasia),jean:Number(b.approved_jean)};
      const c=calcCommissions(Number(sale.amount),split);

      const {data,error:up}=await db.from("sales").update({
        approved_richard:split.richard,approved_anastasia:split.anastasia,approved_jean:split.jean,
        commission_pool:c.pool,commission_richard:c.richard,commission_anastasia:c.anastasia,commission_jean:c.jean,
        status:"Approved"
      }).eq("id",sale.id).eq("status","Pending approval").select().single();
      if(up) throw new Error(up.message);

      const sync=await syncRecord("sale",data);
      const notification=await notifySale(data);
      return res.status(200).json({ok:true,reference:data.reference,status:data.status,commission:c,sheet_sync_status:sync,notification_status:notification});
    }

    if(b.action==="approveExpense"){
      await requireRole(b.actor,["manager"]);
      if(!["A","B","Company overhead"].includes(b.final_allocation)) throw new Error("Invalid final allocation.");
      const {data:e,error}=await db.from("expenses").select("*").eq("reference",b.reference).single();
      if(error || !e) throw new Error("Expense not found.");
      if(e.status==="Allocated") return res.status(200).json({ok:true,alreadyAllocated:true,reference:e.reference});

      const {data,error:up}=await db.from("expenses").update({
        final_allocation:b.final_allocation,status:"Allocated"
      }).eq("id",e.id).eq("status","Awaiting allocation").select().single();
      if(up) throw new Error(up.message);

      const sync=await syncRecord("expense",data);
      const notification=await notifyExpense(data);
      return res.status(200).json({ok:true,reference:data.reference,status:data.status,sheet_sync_status:sync,notification_status:notification});
    }

    if(b.action==="linkTelegram"){
      await requireRole(b.actor,["manager"]);
      if(!b.employee_code || !b.telegram_user_id || !b.telegram_chat_id) throw new Error("Employee, Telegram user ID and chat ID are required.");
      const {error}=await db.from("employees").update({
        telegram_user_id:Number(b.telegram_user_id),telegram_chat_id:Number(b.telegram_chat_id)
      }).eq("code",b.employee_code);
      if(error) throw new Error(error.message);
      return res.status(200).json({ok:true});
    }

    if(b.action==="retrySync"){
      await requireRole(b.actor,["manager"]);
      const table=b.kind==="sale"?"sales":b.kind==="expense"?"expenses":null;
      if(!table) throw new Error("Invalid sync kind.");
      const {data,error}=await db.from(table).select("*").eq("reference",b.reference).single();
      if(error || !data) throw new Error("Record not found.");
      const status=await syncRecord(b.kind,data);
      return res.status(200).json({ok:status==="ok",sheet_sync_status:status});
    }

    if(b.action==="retryNotification"){
      await requireRole(b.actor,["manager"]);
      if(b.kind==="sale"){
        const {data,error}=await db.from("sales").select("*").eq("reference",b.reference).single();
        if(error || !data || data.status!=="Approved") throw new Error("Approved sale not found.");
        const status=await notifySale(data); return res.status(200).json({ok:status==="sent",notification_status:status});
      }
      if(b.kind==="expense"){
        const {data,error}=await db.from("expenses").select("*").eq("reference",b.reference).single();
        if(error || !data || data.status!=="Allocated") throw new Error("Allocated expense not found.");
        const status=await notifyExpense(data); return res.status(200).json({ok:status==="sent",notification_status:status});
      }
      throw new Error("Invalid notification kind.");
    }

    return res.status(400).json({ok:false,error:"Unknown action"});
  }catch(e:any){
    return res.status(400).json({ok:false,error:e?.message || "Unknown error"});
  }
}
