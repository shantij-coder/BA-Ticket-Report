import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutDashboard, RefreshCw, AlertTriangle, Clock, TrendingUp,
  BarChart3, Sun, Moon, ChevronDown, Info, AlertCircle
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Line
} from "recharts";
import {
  SHEET_NAME, PUBHTML_URL, fetchSheetData, parseCSV, mapRow, isValid,
  buildM, buildS, buildTr, buildK, ib, TF, TI, SC, abg, MO,
  Ticket, Metrics, SPOCSummary, C, CD
} from "./AppLogic";

/* ── StatCard ─────────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  vc: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  bd2?: React.ReactNode;
  dark: boolean;
}

function StatCard({label,value,sub,vc,icon,info,bd2,dark}: StatCardProps){
  const [ih,setIh]=useState(false);
  const bg=dark?"#131722":"#fff",bd=dark?"#232a3e":"#e2e8f0",ts=dark?"#8891b0":"#8e97b0";
  return(
    <div style={{background:bg,border:`1px solid ${bd}`,borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,.05)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:700,color:ts,textTransform:"uppercase",letterSpacing:".08em"}}>{label}</span>
            {icon}
            {info&&<div style={{position:"relative"}} onMouseEnter={()=>setIh(true)} onMouseLeave={()=>setIh(false)}>
              <Info size={10} style={{color:ts,cursor:"help"}}/>
              {ih&&<div style={{position:"absolute",bottom:"100%",left:0,marginBottom:8,width:180,padding:"8px 10px",
                background:dark?"#1a1f30":"#fff",border:`1px solid ${bd}`,borderRadius:8,
                boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:50,color:dark?"#e8ecf8":"#0f1623"}}>{info}</div>}
            </div>}
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <div style={{fontSize:30,fontWeight:700,color:vc,lineHeight:1}}>{value}</div>
            <div style={{fontSize:11,color:ts,fontWeight:500}}>{sub}</div>
          </div>
        </div>
        {bd2&&<div style={{borderLeft:`1px solid ${bd}`,paddingLeft:16,display:"flex",alignItems:"center"}}>{bd2}</div>}
      </div>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────────────────── */
export default function App(){
  const [dark,setDark]=useState(false);
  const [ibON,setIbON]=useState(true);
  const [chartsOpen,setChartsOpen]=useState(false);
  const [activeTab,setActiveTab]=useState("load");
  const [kkjType,setKkjType]=useState("idea");
  const [filters,setFilters]=useState({qtr:"",month:"",spoc:"",priority:"",status:"",type:""});
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [status,setStatus]=useState("loading");
  const [err,setErr]=useState("");
  const [at,setAt]=useState("");

  const C_=dark?CD:C;
  const bg=dark?"#0b0e18":"#f8fafc",cbg=dark?"#131722":"#fff",cbd=dark?"#232a3e":"#dde1ed";
  const tp=dark?"#e8ecf8":"#0f1623",ts=dark?"#8891b0":"#8e97b0";
  const abg2=dark?"#1a2050":"#eef0fe",abd=dark?"#232a3e":"#dde1ed",sbg=dark?"#1a1f30":"#f1f5f9";

  const load=useCallback(async()=>{
    setStatus("loading"); setErr("");
    try{
      const csv=await fetchSheetData();
      const rows=parseCSV(csv);
      const t=rows.filter(isValid).map(mapRow);
      setTickets(t);
      setAt(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
      setStatus("ok");
    }catch(e: any){setErr(e.message);setStatus("error");}
  },[]);

  useEffect(()=>{load();},[load]);

  const rf=()=>setFilters({qtr:"",month:"",spoc:"",priority:"",status:"",type:""});

  const pool=useMemo(()=>tickets.filter(t=>{
    const b=ib(t);
    if(ibON){return b||(["closed","resolved"].includes(t.closureStatus.toLowerCase())&&t.closureDate===TF);}
    return !b;
  }),[tickets,ibON]);

  const fil=useMemo(()=>pool.filter(t=>{
    if(filters.qtr&&String(t.quarterNum)!==filters.qtr)return false;
    if(filters.month&&t.monthYear!==filters.month)return false;
    if(filters.spoc&&t.spocPrimary!==filters.spoc)return false;
    if(filters.priority&&t.priority!==filters.priority)return false;
    if(filters.status){
      if(filters.status==="Closed Today"){if(!(["closed","resolved"].includes(t.closureStatus.toLowerCase())&&t.closureDate===TF))return false;}
      else if(t.closureStatus!==filters.status)return false;
    }
    if(filters.type==="idea"&&(t.isIdea||"").toLowerCase()!=="yes")return false;
    if(filters.type==="bug"&&(t.isBug||"").toLowerCase()!=="yes")return false;
    if(filters.type==="g1"&&(t.isG1||"").toLowerCase()!=="yes")return false;
    return true;
  }),[pool,filters]);

  const M: Metrics=useMemo(()=>buildM(fil),[fil]);
  const SD: SPOCSummary[]=useMemo(()=>buildS(fil),[fil]);
  const TD=useMemo(()=>buildTr(pool),[pool]);
  const KD=useMemo(()=>buildK(fil,kkjType),[fil,kkjType]);

  const fo=useMemo(()=>{
    const sp=[...new Set(pool.map(t=>t.spocPrimary))].filter(Boolean).sort();
    const pr=["Urgent","High","Medium","Low"].filter(p=>pool.some(t=>t.priority===p));
    const st=[...new Set(pool.map(t=>t.closureStatus))].filter(Boolean).sort();
    const qp=filters.qtr?pool.filter(t=>String(t.quarterNum)===filters.qtr):pool;
    const mo=[...new Set(qp.map(t=>t.monthYear))].filter(m=>m!=="Unknown").sort((a,b)=>MO.indexOf(a as string)-MO.indexOf(b as string));
    const qt=[...new Set(pool.map(t=>String(t.quarterNum)))].filter(Boolean).sort();
    return{sp,pr,st,mo,qt};
  },[pool,filters.qtr]);

  const TT={backgroundColor:dark?"#131722":"#fff",borderColor:dark?"#232a3e":"#dde1ed",borderRadius:8,fontSize:11};
  const sel=(d=false)=>({height:32,padding:"0 8px",background:sbg,border:`1px solid ${cbd}`,color:d?ts:tp,borderRadius:8,fontSize:11,fontWeight:500,outline:"none",cursor:d?"not-allowed":"pointer",opacity:d?.5:1});
  const tb=(a)=>({flex:1,padding:"10px 8px",fontSize:11,fontWeight:700,border:"none",borderBottom:a?`2px solid ${C_.primary}`:"2px solid transparent",background:a?cbg:"transparent",color:a?C_.primary:ts,cursor:"pointer"});

  const spin=<div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${cbd}`,borderTopColor:C_.primary,animation:"spin 0.8s linear infinite"}}/>;

  if(status==="loading")return(
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      {spin}
      <div style={{fontSize:14,fontWeight:600,color:tp}}>Fetching live data from Google Sheets…</div>
      <div style={{fontSize:12,color:ts}}>{SHEET_NAME}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(status==="error")return(
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:24}}>
      <AlertTriangle size={36} color={C_.error}/>
      <div style={{fontSize:14,fontWeight:700,color:tp,textAlign:"center",maxWidth:440}}>{err}</div>
      <button onClick={load} style={{padding:"10px 28px",borderRadius:8,background:C_.primary,color:"#fff",fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>Retry</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:bg,color:tp,fontFamily:`"Inter",-apple-system,sans-serif`,transition:"all .3s"}}>
      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:50,background:cbg,borderBottom:`1px solid ${cbd}`,height:56,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:C_.primary,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px ${C_.primary}33`}}>
            <LayoutDashboard size={18} color="#fff"/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,lineHeight:1}}>BA Team · Tickets Dashboard</div>
            <div style={{fontSize:10,color:ts,marginTop:3,fontWeight:500}}>{SHEET_NAME}{at?` · ${at}`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{padding:"4px 12px",background:abg2,borderRadius:999,border:`1px solid ${C_.primary}33`,color:C_.primary,fontSize:10,fontWeight:700}}>
            {fil.length} TICKETS
          </div>
          <button onClick={load} style={{display:"flex",alignItems:"center",gap:6,height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${cbd}`,background:"transparent",color:tp,fontSize:11,fontWeight:500,cursor:"pointer"}}>
            <RefreshCw size={12}/> Refresh
          </button>
          <button onClick={()=>setDark(d=>!d)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${cbd}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            {dark?<Sun size={16} style={{color:"#f59e0b"}}/>:<Moon size={16} style={{color:C_.primary}}/>}
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div style={{background:cbg,borderBottom:`1px solid ${cbd}`,padding:"8px 24px",display:"flex",alignItems:"center",gap:12,overflowX:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:16,borderRight:`1px solid ${cbd}`,flexShrink:0}}>
          <span style={{fontSize:11,fontWeight:700,color:ts}}>In Bucket</span>
          <button onClick={()=>{setIbON(v=>!v);rf();}} style={{position:"relative",width:36,height:20,borderRadius:999,background:ibON?C_.primary:(dark?"#2a3050":"#cbd5e1"),border:"none",cursor:"pointer",transition:"background .2s"}}>
            <div style={{position:"absolute",top:3,left:3,width:14,height:14,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transform:ibON?"translateX(16px)":"none",transition:"transform .2s"}}/>
          </button>
          <span style={{fontSize:10,fontWeight:700,whiteSpace:"nowrap",color:ibON?C_.primary:C_.warning}}>
            {ibON?"Bucketed view · filters locked":"Historical view · filters enabled"}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontWeight:700,color:ts,textTransform:"uppercase"}}>Filter</span>
          {[["qtr","All Quarters",fo.qt.map(q=>({v:q,l:`Q${q}`}))],
            ["month","All Months",fo.mo.map(m=>({v:m,l:m}))],
            ["spoc","All SPOCs",fo.sp.map(s=>({v:s,l:s}))],
            ["priority","All Priority",fo.pr.map(p=>({v:p,l:p}))],
            ["status","All Status",fo.st.map(s=>({v:s,l:s}))],
            ["type","All Types",[{v:"idea",l:"Ideas"},{v:"bug",l:"Bugs"},{v:"g1",l:"G1"}]],
          ].map(([key,ph,opts])=>(
            <select key={key} disabled={ibON} value={filters[key]}
              onChange={e=>{const n={...filters,[key]:e.target.value};if(key==="qtr")n.month="";setFilters(n);}}
              style={sel(ibON)}>
              <option value="">{ph}</option>
              {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ))}
          <button disabled={ibON} onClick={rf} style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${cbd}`,background:"transparent",color:ts,fontSize:11,fontWeight:700,cursor:ibON?"not-allowed":"pointer",opacity:ibON?.5:1}}>↺ Reset</button>
        </div>
      </div>

      <main style={{padding:"24px",maxWidth:1600,margin:"0 auto"}}>
        {/* STAT CARDS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginBottom:20}}>
          <StatCard dark={dark} label={ibON?"Total Tickets":"Historical Tickets"} vc={ibON?C_.primary:C_.warning}
            value={ibON?M.openingBalance:pool.length} sub={ibON?`${M.openingBalance} Opening Balance`:`${pool.length} historical records`}
            icon={<LayoutDashboard size={14} color={ibON?C_.primary:C_.warning}/>}
            bd2={ibON?(
              <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                <div style={{fontSize:8,fontWeight:700,color:ts,textTransform:"uppercase",textAlign:"center",borderBottom:`1px solid ${cbd}`,paddingBottom:3,marginBottom:2}}>In Bucket</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto 1fr",gap:"2px 4px",alignItems:"center",textAlign:"center"}}>
                  {["Total In BA Bucket","Closed Today","New Tickets"].map((l,i,a)=>[
                    <span key={`l${i}`} style={{fontSize:7,fontWeight:700,color:ts,textTransform:"uppercase",lineHeight:1.2}}>{l}</span>,
                    i<a.length-1&&<span key={`s${i}`} style={{fontSize:10,opacity:.3}}>|</span>
                  ])}
                  <span style={{fontSize:13,fontWeight:700}}>{M.totalInBABucket}</span>
                  <span style={{fontSize:13,opacity:.3}}>|</span>
                  <span style={{fontSize:13,fontWeight:700,color:M.closedToday>0?C_.error:ts}}>{M.closedToday>0?`-${M.closedToday}`:"0"}</span>
                  <span style={{fontSize:13,opacity:.3}}>|</span>
                  <span style={{fontSize:13,fontWeight:700}}>{M.newToday}</span>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:120}}>
                <div style={{fontSize:8,fontWeight:700,color:ts,textTransform:"uppercase",textAlign:"center",borderBottom:`1px solid ${cbd}`,paddingBottom:3,marginBottom:2}}>Breakdown</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"2px 6px",alignItems:"center",textAlign:"center"}}>
                  <span style={{fontSize:7,fontWeight:700,color:ts,textTransform:"uppercase"}}>Closed</span>
                  <span style={{fontSize:10,opacity:.3}}>|</span>
                  <span style={{fontSize:7,fontWeight:700,color:ts,textTransform:"uppercase"}}>Resolved</span>
                  <span style={{fontSize:13,fontWeight:700,color:C_.success}}>{M.closed}</span>
                  <span style={{fontSize:13,opacity:.3}}>|</span>
                  <span style={{fontSize:13,fontWeight:700,color:C_.violet}}>{M.resolved}</span>
                </div>
              </div>
            )}
          />
          <StatCard dark={dark} label={ibON?"Ticket Status":"Closure Status"} sub={ibON?"Active Statuses":"Closed + Resolved"}
            value={ibON?(M.open+M.pending+M.waiting):(M.closed+M.resolved)} vc={C_.warning}
            icon={<Clock size={14} color={C_.warning}/>}
            info={<div style={{fontSize:10}}><div style={{fontWeight:700,borderBottom:`1px solid ${cbd}`,paddingBottom:4,marginBottom:4}}>Status Legend</div>
              {[["O","Open"],["P","Pending"],["W","Waiting On Third Party"],["R/C","Resolved / Closed"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:6,marginBottom:2}}><span style={{fontWeight:700,minWidth:24}}>{k}:</span><span>{v}</span></div>))}</div>}
            bd2={<div style={{display:"grid",gridTemplateColumns:"auto auto auto auto auto auto auto",gap:"3px 6px",alignItems:"center",textAlign:"center"}}>
              {[["O",C_.warning],["P","#ea580c"],["W","#2563eb"],["R/C",C_.success]].flatMap(([l,col],i,a)=>[
                <span key={l} style={{fontSize:8,fontWeight:700,color:col,textTransform:"uppercase"}}>{l}</span>,
                i<a.length-1&&<span key={`s${i}`} style={{fontSize:10,opacity:.3}}>|</span>
              ]).filter(Boolean)}
              {[M.open,M.pending,M.waiting,M.closed+M.resolved].flatMap((v,i,a)=>[
                <span key={`v${i}`} style={{fontSize:14,fontWeight:700}}>{v}</span>,
                i<a.length-1&&<span key={`vs${i}`} style={{fontSize:14,opacity:.3}}>|</span>
              ]).filter(Boolean)}
            </div>}
          />
          <StatCard dark={dark} label="Priority" sub="Urgent & High"
            value={M.priorityBreakdown.urgent+M.priorityBreakdown.high} vc={C_.error}
            icon={<AlertTriangle size={14} color={C_.error}/>}
            bd2={<div style={{display:"grid",gridTemplateColumns:"auto auto auto auto auto auto auto",gap:"3px 6px",alignItems:"center",textAlign:"center"}}>
              {[["U",C_.error],["H",C_.warning],["M","#60a5fa"],["L",ts]].flatMap(([l,col],i,a)=>[
                <span key={l} style={{fontSize:8,fontWeight:700,color:col,textTransform:"uppercase"}}>{l}</span>,
                i<a.length-1&&<span key={`s${i}`} style={{fontSize:10,opacity:.3}}>|</span>
              ]).filter(Boolean)}
              {[M.priorityBreakdown.urgent,M.priorityBreakdown.high,M.priorityBreakdown.medium,M.priorityBreakdown.low].flatMap((v,i,a)=>[
                <span key={`v${i}`} style={{fontSize:14,fontWeight:700}}>{v}</span>,
                i<a.length-1&&<span key={`vs${i}`} style={{fontSize:14,opacity:.3}}>|</span>
              ]).filter(Boolean)}
            </div>}
          />
          <StatCard dark={dark} label="Adherence Rate" vc={C_.violet}
            value={`${ibON?M.adherePct:M.adherePctHist}%`}
            sub={ibON?`${M.adhered} adhered / ${M.openingBalance} total`:`${M.adhered} adhered / ${M.withTA} total`}
            icon={<TrendingUp size={14} color={C_.violet}/>}
            bd2={<div style={{display:"grid",gridTemplateColumns:"auto auto auto",gap:"3px 8px",alignItems:"center",textAlign:"center"}}>
              <span style={{fontSize:8,fontWeight:700,color:C_.success,textTransform:"uppercase"}}>Adhered</span>
              <span style={{fontSize:10,opacity:.3}}>|</span>
              <span style={{fontSize:8,fontWeight:700,color:C_.error,textTransform:"uppercase"}}>Delayed</span>
              <span style={{fontSize:14,fontWeight:700}}>{M.adhered}</span>
              <span style={{fontSize:14,opacity:.3}}>|</span>
              <span style={{fontSize:14,fontWeight:700}}>{M.delayed}</span>
            </div>}
          />
        </div>

        {/* SPOC TABLE */}
        <div style={{background:cbg,border:`1px solid ${cbd}`,borderRadius:12,boxShadow:"0 1px 3px rgba(0,0,0,.05)",overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${cbd}`,background:dark?"#0f1220":abg2,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:700}}>SPOC Performance Summary</span>
            <span style={{fontSize:11,color:ts,fontWeight:500}}>{SD.length} SPOCs · sorted by total</span>
          </div>
          <div style={{overflowX:"auto",maxHeight:420,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead style={{position:"sticky",top:0,zIndex:10,background:cbg}}>
                <tr style={{borderBottom:`2px solid ${cbd}`}}>
                  {[["SPOC",""],["Total","r"],["Open",C_.warning],["Closed",C_.success],["Resolved",C_.violet],["Pending",C_.error],["Ideas",""],["Bugs",""],["G1",""],["Adhered",C_.success],["Delayed",C_.error],["Adhere %","r"]].map(([h,col])=>(
                    <th key={h} style={{padding:"8px 14px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap",
                      color:col&&col!=="r"?col:ts,textAlign:(col==="r"||["Total","Ideas","Bugs","G1","Adhere %"].includes(h))?"right":"left"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SD.map(s=>(
                  <tr key={s.name} style={{borderBottom:`1px solid ${cbd}`}}>
                    <td style={{padding:"8px 14px"}}>
                      <span style={{padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700,background:`${SC[s.name]||C_.primary}18`,color:SC[s.name]||C_.primary}}>{s.name}</span>
                    </td>
                    {[s.total,s.open,s.closed,s.resolved,s.pending,s.ideas,s.bugs,s.g1,s.adhered,s.delayed].map((v,i)=>(
                      <td key={i} style={{padding:"8px 14px",textAlign:"right",fontSize:12,fontWeight:i===0?700:500,
                        color:i===1?C_.warning:i===2?C_.success:i===3?C_.violet:i===4?C_.error:i===8?C_.success:i===9?C_.error:tp}}>{v}</td>
                    ))}
                    <td style={{padding:"8px 14px",textAlign:"right"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}>
                        <div style={{width:48,height:4,background:dark?"#232a3e":"#e2e8f0",borderRadius:999,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${s.pct}%`,background:abg(s.pct,C_),borderRadius:999}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:abg(s.pct,C_),minWidth:28}}>{s.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{background:dark?"#1a1f30":"#f8fafc",borderTop:`2px solid ${cbd}`,fontWeight:700}}>
                  <td style={{padding:"10px 14px",fontSize:12}}>All SPOCs</td>
                  {[SD.reduce((a,b)=>a+b.total,0),SD.reduce((a,b)=>a+b.open,0),SD.reduce((a,b)=>a+b.closed,0),SD.reduce((a,b)=>a+b.resolved,0),SD.reduce((a,b)=>a+b.pending,0),SD.reduce((a,b)=>a+b.ideas,0),SD.reduce((a,b)=>a+b.bugs,0),SD.reduce((a,b)=>a+b.g1,0),SD.reduce((a,b)=>a+b.adhered,0),SD.reduce((a,b)=>a+b.delayed,0)].map((v,i)=>(
                    <td key={i} style={{padding:"10px 14px",textAlign:"right",fontSize:12,color:i===1?C_.warning:i===2?C_.success:i===3?C_.violet:i===4?C_.error:i===8?C_.success:i===9?C_.error:tp}}>{v}</td>
                  ))}
                  <td style={{padding:"10px 14px",textAlign:"right"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}>
                      <div style={{width:48,height:4,background:dark?"#232a3e":"#e2e8f0",borderRadius:999,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${ibON?M.adherePct:M.adherePctHist}%`,background:C_.primary,borderRadius:999}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,minWidth:28}}>{ibON?M.adherePct:M.adherePctHist}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            {fil.length===0&&<div style={{padding:"40px",textAlign:"center",color:ts,fontSize:14,fontWeight:500}}>No tickets match current filters</div>}
          </div>
        </div>

        {/* CHARTS TOGGLE */}
        <button onClick={()=>setChartsOpen(o=>!o)} style={{width:"100%",background:cbg,border:`1px solid ${cbd}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:chartsOpen?16:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:24,height:24,borderRadius:6,background:chartsOpen?C_.primary:`${C_.primary}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <BarChart3 size={14} color={chartsOpen?"#fff":C_.primary}/>
            </div>
            <span style={{fontSize:13,fontWeight:700}}>{chartsOpen?"Hide Charts":"Show Charts"}</span>
          </div>
          <ChevronDown size={16} style={{color:ts,transform:chartsOpen?"rotate(180deg)":"none",transition:"transform .3s"}}/>
        </button>

        {chartsOpen&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:cbg,border:`1px solid ${cbd}`,borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${cbd}`,background:dark?"#0f1220":abg2}}>
                {[["load","📊 Ticket Load"],["adhere","⏱ Adherence"],["kkj","✅ KKJ Quality"]].map(([t,l])=>(
                  <button key={t} onClick={()=>setActiveTab(t)} style={tb(activeTab===t)}>{l}</button>
                ))}
              </div>
              <div style={{padding:16,flex:1,minHeight:280}}>
                {activeTab==="load"&&(
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={SD} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({name,percent})=>`${name} ${Math.round(percent*100)}%`} labelLine={false}>
                        {SD.map((e,i)=><Cell key={i} fill={SC[e.name]||C_.primary}/>)}
                      </Pie>
                      <Tooltip contentStyle={TT}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {activeTab==="adhere"&&(
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={SD} margin={{top:10,bottom:10}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd}/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:ts}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                      <Tooltip contentStyle={TT}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                      <Bar dataKey="adhered" name="Adhered" fill={C_.success} radius={[4,4,0,0]} barSize={20}/>
                      <Bar dataKey="delayed" name="Delayed" fill={C_.error} radius={[4,4,0,0]} barSize={20}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {activeTab==="kkj"&&(
                  <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      {[["idea","Ideas"],["ticket","Tickets"]].map(([t,l])=>(
                        <button key={t} onClick={()=>setKkjType(t)} style={{padding:"4px 14px",borderRadius:999,fontSize:10,fontWeight:700,border:`1px solid ${kkjType===t?"transparent":cbd}`,background:kkjType===t?C_.primary:"transparent",color:kkjType===t?"#fff":ts,cursor:"pointer"}}>{l}</button>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={KD} margin={{top:10,bottom:10}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd}/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:ts}}/>
                        <YAxis domain={[0,100]} axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                        <Tooltip contentStyle={TT}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                        <Bar dataKey="Pass" name="Pass %" fill={C_.success} radius={[4,4,0,0]} barSize={20}/>
                        <Bar dataKey="Fail" name="Fail %" fill={C_.error} radius={[4,4,0,0]} barSize={20}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
            <div style={{background:cbg,border:`1px solid ${cbd}`,borderRadius:12,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${cbd}`,background:dark?"#0f1220":abg2,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:700}}>Ticket Volume · Monthly Trend</span>
                <span style={{fontSize:11,color:ts,fontWeight:500}}>{TD.length} months</span>
              </div>
              <div style={{padding:16,flex:1,minHeight:280}}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={TD} margin={{top:10,right:10,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C_.primary} stopOpacity={.12}/>
                        <stop offset="95%" stopColor={C_.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:9,fontWeight:700,fill:ts}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                    <Tooltip contentStyle={TT}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                    <Area type="monotone" dataKey="Total" stroke={C_.primary} fillOpacity={1} fill="url(#gT)" strokeWidth={2}/>
                    <Line type="monotone" dataKey="Closed" stroke={C_.success} strokeWidth={2} dot={{r:2}}/>
                    <Line type="monotone" dataKey="Open" stroke={C_.warning} strokeWidth={2} dot={{r:2}} strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="Resolved" stroke={C_.violet} strokeWidth={2} dot={{r:2}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer style={{padding:"24px",textAlign:"center",borderTop:`1px solid ${cbd}`,marginTop:24,color:ts}}>
        <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>
          BA Tickets Analytics Dashboard · {SHEET_NAME} · {tickets.length} rows
        </p>
      </footer>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
