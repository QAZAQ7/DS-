import { useEffect, useState } from "react";

const people=[
  ["richard","Richard Darling"],
  ["anastasia","Anastasia Ferrari"],
  ["jean","Jean-Claude Bērziņš"],
  ["kevin","Kevin von Whatever"],
  ["svetlana","Svetlana de Monte Carlo"]
];

const card:React.CSSProperties={background:"#fff",padding:18,borderRadius:12,marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.08)"};
const inp:React.CSSProperties={display:"block",width:"100%",padding:9,margin:"7px 0",boxSizing:"border-box",border:"1px solid #ccc",borderRadius:7};
const btn:React.CSSProperties={padding:"9px 14px",border:0,borderRadius:8,cursor:"pointer",background:"#111",color:"#fff",marginTop:4};

export default function Home(){
  const [role,setRole]=useState("richard");
  const [dash,setDash]=useState<any>(null);
  const [message,setMessage]=useState("");

  async function load(){
    const r=await fetch(`/api?action=dashboard&actor=${encodeURIComponent(role)}`);
    const j=await r.json();
    setDash(j);
  }
  useEffect(()=>{load()},[role]);

  async function api(payload:any){
    const r=await fetch("/api",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,actor:role})});
    const j=await r.json(); setMessage(JSON.stringify(j,null,2)); await load(); return j;
  }

  const isManager=role==="svetlana";

  return <main style={{maxWidth:1100,margin:"0 auto",padding:22,fontFamily:"Arial, sans-serif",background:"#f4f5f7",minHeight:"100vh"}}>
    <h1 style={{marginBottom:4}}>Friends Included Ltd — Finance System</h1>
    <p style={{marginTop:0}}><b>Student:</b> Denis Shuvayev</p>

    <section style={card}>
      <label><b>Demonstration role</b></label>
      <select style={inp} value={role} onChange={e=>setRole(e.target.value)}>
        {people.map(([v,n])=><option key={v} value={v}>{n}</option>)}
      </select>
      <small>Permissions are enforced on the server, not only by hiding buttons.</small>
    </section>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <section style={card}>
        <h2>Submit sale</h2>
        <form onSubmit={async e=>{
          e.preventDefault();
          const f=new FormData(e.currentTarget);
          await api({action:"sale",...Object.fromEntries(f.entries())});
          e.currentTarget.reset();
        }}>
          <input style={inp} name="reference" placeholder="Reference e.g. S02" />
          <input style={inp} name="customer" placeholder="Customer" />
          <select style={inp} name="project"><option>A</option><option>B</option></select>
          <input style={inp} name="description" placeholder="Description" />
          <input style={inp} name="amount" type="number" step="0.01" placeholder="Amount" />
          <input style={inp} name="proposed_richard" type="number" step="0.01" placeholder="Richard %" />
          <input style={inp} name="proposed_anastasia" type="number" step="0.01" placeholder="Anastasia %" />
          <input style={inp} name="proposed_jean" type="number" step="0.01" placeholder="Jean-Claude %" />
          <button style={btn}>Submit sale</button>
        </form>
      </section>

      <section style={card}>
        <h2>Submit expense</h2>
        <form onSubmit={async e=>{
          e.preventDefault();
          const f=new FormData(e.currentTarget);
          await api({action:"expense",...Object.fromEntries(f.entries())});
          e.currentTarget.reset();
        }}>
          <input style={inp} name="reference" placeholder="Reference e.g. E02" />
          <input style={inp} name="description" placeholder="Description" />
          <select style={inp} name="category"><option>Materials</option><option>Travel</option><option>Other</option></select>
          <input style={inp} name="amount" type="number" step="0.01" placeholder="Amount" />
          <select style={inp} name="proposed_allocation"><option>A</option><option>B</option><option>Company overhead</option></select>
          <button style={btn}>Submit expense</button>
        </form>
      </section>
    </div>

    <section style={card}>
      <h2>Financial dashboard</h2>
      {!dash?.projectA ? <p>Connect Supabase environment variables to load live data.</p> : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
        <Metric title="Project A result" value={dash.projectA.result}/>
        <Metric title="Project B result" value={dash.projectB.result}/>
        <Metric title="Company overhead" value={dash.company.overhead}/>
        <Metric title="Awaiting allocation" value={dash.company.awaiting}/>
        <Metric title="Total company result" value={dash.company.result}/>
        <div><b>Commissions</b><br/>Richard €{dash.commissions.richard.toFixed(2)}<br/>Anastasia €{dash.commissions.anastasia.toFixed(2)}<br/>Jean-Claude €{dash.commissions.jean.toFixed(2)}</div>
      </div>}
    </section>

    {dash && <section style={card}>
      <h2>{isManager ? "All records" : "My submissions"}</h2>
      <h3>Sales</h3>
      {dash.visibleSales?.length ? dash.visibleSales.map((s:any)=><RecordLine key={s.reference} x={s} kind="sale" api={api} manager={isManager}/>) : <p>No visible sales.</p>}
      <h3>Expenses</h3>
      {dash.visibleExpenses?.length ? dash.visibleExpenses.map((e:any)=><RecordLine key={e.reference} x={e} kind="expense" api={api} manager={isManager}/>) : <p>No visible expenses.</p>}
    </section>}

    {isManager && <section style={card}>
      <h2>Manager setup — Telegram linking</h2>
      <form onSubmit={async e=>{
        e.preventDefault(); const f=new FormData(e.currentTarget);
        await api({action:"linkTelegram",...Object.fromEntries(f.entries())});
      }}>
        <select style={inp} name="employee_code">{people.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select>
        <input style={inp} name="telegram_user_id" placeholder="Telegram user ID" />
        <input style={inp} name="telegram_chat_id" placeholder="Telegram chat ID" />
        <button style={btn}>Save Telegram link</button>
      </form>
    </section>}

    {isManager && dash && <section style={card}>
      <h2>Manager approvals</h2>
      <h3>Pending sales</h3>
      {dash.pendingSales?.length ? dash.pendingSales.map((s:any)=><SaleApproval key={s.reference} s={s} api={api}/>) : <p>None.</p>}
      <h3>Awaiting expense allocations</h3>
      {dash.awaitingExpenses?.length ? dash.awaitingExpenses.map((e:any)=><ExpenseApproval key={e.reference} e={e} api={api}/>) : <p>None.</p>}
    </section>}

    <section style={card}>
      <h2>Submission links</h2>
      <p><a href={process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "#"} target="_blank">Telegram bot</a></p>
      <p><a href={process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "#"} target="_blank">Google Sheets</a></p>
      <p><a href={process.env.NEXT_PUBLIC_GITHUB_URL || "#"} target="_blank">GitHub repository</a></p>
      <p><b>Instructions:</b> select a demonstration role. Salespeople submit sales, Kevin submits expenses, and Svetlana approves or corrects decisions. Telegram submissions use the same database and business rules.</p>
    </section>

    <section style={card}>
      <h2>System response</h2>
      <pre style={{whiteSpace:"pre-wrap",background:"#111",color:"#eee",padding:12,borderRadius:8,minHeight:40}}>{message || "No action yet."}</pre>
    </section>
  </main>
}

function Metric({title,value}:{title:string,value:number}){
  return <div><b>{title}</b><br/><span style={{fontSize:24}}>€{Number(value||0).toFixed(2)}</span></div>
}

function RecordLine({x,kind,api,manager}:{x:any,kind:"sale"|"expense",api:(p:any)=>Promise<any>,manager:boolean}){
  return <div style={{padding:"9px 0",borderTop:"1px solid #ddd"}}>
    <b>{x.reference}</b> — €{Number(x.amount).toFixed(2)} — {x.status}
    <div style={{fontSize:13}}>Sheet: {x.sheet_sync_status} | Notification: {x.notification_status}</div>
    {manager && x.sheet_sync_status==="failed" && <button style={btn} onClick={()=>api({action:"retrySync",kind,reference:x.reference})}>Retry Sheets sync</button>}
    {manager && x.notification_status==="failed" && <button style={{...btn,marginLeft:6}} onClick={()=>api({action:"retryNotification",kind,reference:x.reference})}>Retry Telegram notification</button>}
  </div>
}

function SaleApproval({s,api}:{s:any,api:(p:any)=>Promise<any>}){
  const [r,setR]=useState(String(s.proposed_richard));
  const [a,setA]=useState(String(s.proposed_anastasia));
  const [j,setJ]=useState(String(s.proposed_jean));
  return <div style={{padding:"10px 0",borderTop:"1px solid #ddd"}}>
    <b>{s.reference}</b> — €{Number(s.amount).toFixed(2)} — {s.customer} — Project {s.project}<br/>
    <small>Proposed: {s.proposed_richard}% / {s.proposed_anastasia}% / {s.proposed_jean}%</small><br/>
    <input value={r} onChange={e=>setR(e.target.value)} style={{width:65,marginRight:4}}/>
    <input value={a} onChange={e=>setA(e.target.value)} style={{width:65,marginRight:4}}/>
    <input value={j} onChange={e=>setJ(e.target.value)} style={{width:65,marginRight:4}}/>
    <button style={btn} onClick={()=>api({action:"approveSale",reference:s.reference,approved_richard:Number(r),approved_anastasia:Number(a),approved_jean:Number(j)})}>Approve sale</button>
  </div>
}

function ExpenseApproval({e,api}:{e:any,api:(p:any)=>Promise<any>}){
  const [v,setV]=useState(e.proposed_allocation);
  return <div style={{padding:"10px 0",borderTop:"1px solid #ddd"}}>
    <b>{e.reference}</b> — €{Number(e.amount).toFixed(2)} — {e.description}<br/>
    <small>Proposed allocation: {e.proposed_allocation}</small><br/>
    <select value={v} onChange={x=>setV(x.target.value)} style={{marginRight:8,padding:6}}>
      <option>A</option><option>B</option><option>Company overhead</option>
    </select>
    <button style={btn} onClick={()=>api({action:"approveExpense",reference:e.reference,final_allocation:v})}>Confirm allocation</button>
  </div>
}
