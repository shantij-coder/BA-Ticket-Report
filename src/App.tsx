import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutDashboard, RefreshCw, AlertTriangle, Clock, TrendingUp,
  BarChart3, Sun, Moon, ChevronDown, Info, AlertCircle
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Line, LabelList
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
  const ts=dark?"#8891b0":"#8e97b0";
  const cardBg = dark ? `${vc}15` : `${vc}08`;
  const cardBd = dark ? `${vc}33` : `${vc}20`;

  return(
    <div 
      className="flex flex-col justify-center min-h-[110px] p-5 rounded-xl shadow-sm border transition-all hover:shadow-md relative overflow-hidden"
      style={{background:cardBg, borderColor:cardBd, zIndex: ih ? 30 : 1}}
    >
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{color:ts}}>{label}</span>
            {icon}
            {info && (
              <div className="relative" onMouseEnter={()=>setIh(true)} onMouseLeave={()=>setIh(false)}>
                <Info size={12} className="cursor-help" style={{color:ts}}/>
                {ih && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-4 rounded-xl shadow-2xl z-[100] text-xs border"
                    style={{
                      background:dark?"#1a1f30":"#fff",
                      borderColor:cardBd,
                      color:dark?"#e8ecf8":"#0f1623"
                    }}
                  >
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold tracking-tight leading-none" style={{color:vc, textShadow: dark ? `0 0 10px ${vc}33` : 'none'}}>{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{color:ts}}>{sub}</div>
          </div>
        </div>
        {bd2 && <div className="hidden sm:flex border-l pl-5 items-center min-h-[48px]" style={{borderColor:cardBd}}>{bd2}</div>}
      </div>
      {bd2 && <div className="sm:hidden border-t mt-4 pt-4 flex items-center justify-center" style={{borderColor:cardBd}}>{bd2}</div>}
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
  const [showStatusTrend, setShowStatusTrend] = useState(false);
  const [vis, setVis] = useState<Record<string, boolean>>({
    Total: false, InBucket: true, OutBucket: true, OpeningBalance: true, Closed: false, Open: false, Resolved: false,
    O: true, P: true, W: true, B: true, RC: true
  });
  const [filters,setFilters]=useState({fy:"",qtr:"",month:"",spoc:"",priority:"",status:"",type:""});
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

  const rf=()=>setFilters({fy:"",qtr:"",month:"",spoc:"",priority:"",status:"",type:""});

  const pool=useMemo(()=>ibON ? tickets.filter(t=>{
    const b=ib(t);
    return b||(["closed","resolved"].includes(t.closureStatus.toLowerCase())&&t.closureDate===TF);
  }) : tickets,[tickets,ibON]);

  const fil=useMemo(()=>pool.filter(t=>{
    if(filters.fy&&t.fiscalYear!==filters.fy)return false;
    if(filters.qtr&&t.qtrLabel!==filters.qtr)return false;
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

  const fo=useMemo(()=>{
    const sp=[...new Set(tickets.map(t=>t.spocPrimary))].filter(Boolean).sort();
    const pr=["Urgent","High","Medium","Low"];
    const st=[...new Set(tickets.map(t=>t.closureStatus))].filter(Boolean).sort();
    if(!st.includes("Closed Today")) st.push("Closed Today");
    const fyList=[...new Set(tickets.map(t=>t.fiscalYear))].filter(Boolean).sort();
    
    const yp=filters.fy?tickets.filter(t=>t.fiscalYear===filters.fy):tickets;
    const qp=filters.qtr?yp.filter(t=>t.qtrLabel===filters.qtr):yp;
    
    const mo=[...new Set(qp.map(t=>t.monthYear))].filter(m=>m!=="Unknown").sort((a,b)=>{
      const parse = (s: string) => {
        const [m, y] = (s as string).split(" ");
        const mi = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m);
        return new Date(parseInt(y), mi).getTime();
      };
      return parse(a as string) - parse(b as string);
    });

    const qt=[...new Set(yp.map(t=>t.qtrLabel))].filter(Boolean).sort((a,b)=>{
      const sa = a as string, sb = b as string;
      const ay=sa.match(/\((\d+-\d+)\)/)?.[1]||"", by=sb.match(/\((\d+-\d+)\)/)?.[1]||"";
      if(ay!==by) return ay.localeCompare(by);
      return sa.localeCompare(sb);
    });
    return{sp,pr,st,mo,qt,fyList};
  },[tickets,filters.qtr,filters.fy]);

  const M: Metrics=useMemo(()=>buildM(fil),[fil]);
  const SD: SPOCSummary[]=useMemo(()=>buildS(fil, filters.spoc ? [filters.spoc] : fo.sp),[fil, filters.spoc, fo.sp]);
  const trendFil=useMemo(()=>tickets.filter(t=>{
    if(filters.fy&&t.fiscalYear!==filters.fy)return false;
    if(filters.qtr&&t.qtrLabel!==filters.qtr)return false;
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
  }),[tickets,filters]);

  const TD=useMemo(()=>buildTr(trendFil, ibON),[trendFil, ibON]);
  const KD=useMemo(()=>buildK(fil,kkjType),[fil,kkjType]);

  const TT={backgroundColor:dark?"#131722":"#fff",borderColor:dark?"#232a3e":"#dde1ed",borderRadius:8,fontSize:11,color:tp};
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
      <header className="sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:px-8 shadow-sm transition-all border-b" style={{background:cbg, borderColor:cbd, minHeight:72}}>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{background:C_.primary, boxShadow:`0 4px 12px ${C_.primary}33`}}>
            <LayoutDashboard size={20} color="#fff"/>
          </div>
          <div className="overflow-hidden">
            <div className="text-sm sm:text-lg font-black tracking-tighter leading-tight truncate uppercase italic" style={{color:tp}}>BA Team · Tickets Dashboard</div>
            <div className="text-[10px] sm:text-xs font-bold mt-1 truncate opacity-60" style={{color:ts}}>{SHEET_NAME}{at?` · Last updated: ${at}`:""}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase" style={{background:abg2, borderColor:`${C_.primary}33`, color:C_.primary}}>
            {fil.length} TICKETS
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-2 h-9 px-4 rounded-lg border font-semibold text-xs transition-all hover:bg-black/5 active:scale-95" style={{borderColor:cbd, background:"transparent", color:tp}}>
              <RefreshCw size={14} className={status==="loading"?"animate-spin":""}/> <span className="hidden xs:inline">Refresh</span>
            </button>
            <button onClick={()=>setDark(d=>!d)} className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:bg-black/5 active:scale-95" style={{borderColor:cbd, background:"transparent"}}>
              {dark?<Sun size={18} className="text-amber-500"/>:<Moon size={18} style={{color:C_.primary}}/>}
            </button>
          </div>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="sticky top-[120px] sm:top-[72px] z-40 flex items-center overflow-x-auto no-scrollbar shadow-sm border-b" style={{background:cbg, borderColor:cbd}}>
        <div className="sticky left-0 z-10 flex items-center gap-3 px-4 sm:pl-8 pr-5 border-r shrink-0 py-3" style={{background:cbg, borderColor:cbd}}>
          <span className="text-xs font-bold" style={{color:ts}}>In Bucket</span>
          <button onClick={()=>{setIbON(v=>!v);rf();}} className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0" style={{background:ibON?C_.primary:(dark?"#2a3050":"#cbd5e1")}}>
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200" style={{transform:ibON?"translateX(20px)":"none"}}/>
          </button>
          <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wide whitespace-nowrap" style={{color:ibON?C_.primary:C_.warning}}>
            {ibON?"Bucketed view · filters disabled":"Historical view · filters enabled"}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 sm:pr-8 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest shrink-0" style={{color:ts}}>Filters</span>
          <div className="flex items-center gap-2">
            {[["fy","All FY",fo.fyList.map(f=>({v:f,l:`FY ${f}`}))],
              ["qtr","All Quarters",fo.qt.map(q=>({v:q,l:q}))],
              ["month","All Months",fo.mo.map(m=>({v:m,l:m}))],
              ["spoc","All SPOCs",fo.sp.map(s=>({v:s,l:s}))],
              ["priority","All Priority",fo.pr.map(p=>({v:p,l:p}))],
              ["status","All Status",fo.st.map(s=>({v:s,l:s}))],
              ["type","All Types",[{v:"idea",l:"Ideas"},{v:"bug",l:"Bugs"},{v:"g1",l:"G1"}]],
            ].map(([key,ph,opts])=>(
              <select key={key} value={filters[key as keyof typeof filters]}
                disabled={ibON}
                className="h-9 px-3 rounded-lg border text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{background:sbg, borderColor:cbd, color:tp}}
                onChange={e=>{
                  const val = e.target.value;
                  const n={...filters,[key]:val};
                  if(key==="fy"){n.qtr=""; n.month="";}
                  if(key==="qtr")n.month="";
                  setFilters(n);
                }}>
                <option value="">{ph}</option>
                {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ))}
            <button onClick={rf} disabled={ibON} className="h-9 px-4 rounded-lg border text-xs font-bold transition-all hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0" style={{borderColor:cbd, background:"transparent", color:ts}}>↺ Reset</button>
          </div>
        </div>
      </div>

      <main className="p-3 sm:p-6 max-w-[1600px] mx-auto space-y-5">
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard dark={dark} label={ibON?"Bucket Load":"Total Tickets"} vc={ibON?C_.primary:C_.warning}
            value={ibON?M.totalInBABucket:fil.length} sub={ibON?`${M.totalInBABucket} Active in Bucket`:`${fil.length} total records`}
            icon={<LayoutDashboard size={14} color={ibON?C_.primary:C_.warning}/>}
            bd2={ibON?(
              <div className="flex flex-col gap-2 min-w-[140px]">
                <div className="text-[8px] font-bold uppercase tracking-wider text-center border-b pb-1.5" style={{color:ts, borderColor:cbd}}>In Bucket</div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-3 gap-y-1 items-center text-center">
                  {["InB","ClsdT","NewT"].map((l,i,a)=>[
                    <span key={`l${i}`} className="text-[7px] font-bold uppercase leading-tight" style={{color:ts}}>{l}</span>,
                    i<a.length-1&&<span key={`s${i}`} className="text-[10px] opacity-20">|</span>
                  ])}
                  <span className="text-sm font-black" style={{color:C_.primary}}>{M.totalInBABucket}</span>
                  <span className="text-sm opacity-20">|</span>
                  <span className="text-sm font-black" style={{color:M.closedToday>0?C_.error:ts}}>{M.closedToday>0?`-${M.closedToday}`:"0"}</span>
                  <span className="text-sm opacity-20">|</span>
                  <span className="text-sm font-black" style={{color:C_.success}}>{M.newToday}</span>
                </div>
              </div>
            ):(
              <div className="flex flex-col gap-2 min-w-[140px]">
                <div className="text-[8px] font-bold uppercase tracking-wider text-center border-b pb-1.5" style={{color:ts, borderColor:cbd}}>Status Mix</div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-3 gap-y-1 items-center text-center">
                  {["Active","Closed","Reslv"].map((l,i,a)=>[
                    <span key={`l${i}`} className="text-[7px] font-bold uppercase leading-tight" style={{color:ts}}>{l}</span>,
                    i<a.length-1&&<span key={`s${i}`} className="text-[10px] opacity-20">|</span>
                  ])}
                  <span className="text-sm font-black" style={{color:C_.warning}}>{M.total}</span>
                  <span className="text-sm opacity-20">|</span>
                  <span className="text-sm font-black" style={{color:C_.success}}>{M.closed}</span>
                  <span className="text-sm opacity-20">|</span>
                  <span className="text-sm font-black" style={{color:C_.violet}}>{M.resolved}</span>
                </div>
              </div>
            )}
          />
          <StatCard dark={dark} label={ibON?"Active Workload":"Closure Status"} sub={ibON?"Active Statuses":"Closed + Resolved"}
            value={ibON?M.total:(M.closed+M.resolved)} vc={C_.success}
            icon={<Clock size={14} color={C_.success}/>}
            info={<div style={{fontSize:10}}><div style={{fontWeight:700,borderBottom:`1px solid ${cbd}`,paddingBottom:4,marginBottom:4}}>Status Legend</div>
              {[["O","Open"],["P","Pending"],["W","Waiting On Third Party"],["B","Blank Status"],["R/C","Resolved / Closed"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",gap:6,marginBottom:2}}><span style={{fontWeight:700,minWidth:24}}>{k}:</span><span>{v}</span></div>))}</div>}
            bd2={<div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto_auto] gap-x-3 gap-y-1 items-center text-center">
              {[["O",C_.warning],["P","#ea580c"],["W","#2563eb"],["B",ts],["R/C",C_.success]].flatMap(([l,col],i,a)=>[
                <span key={l} className="text-[8px] font-bold uppercase" style={{color:col}}>{l}</span>,
                i<a.length-1&&<span key={`s${i}`} className="text-[10px] opacity-20">|</span>
              ]).filter(Boolean)}
              {[M.open,M.pending,M.waiting,M.blank,M.closed+M.resolved].flatMap((v,i,a)=>[
                <span key={`v${i}`} className="text-sm font-black" style={{color:[C_.warning,"#ea580c","#2563eb",ts,C_.success][i]}}>{v}</span>,
                i<a.length-1&&<span key={`vs${i}`} className="text-sm opacity-20">|</span>
              ]).filter(Boolean)}
            </div>}
          />
          <StatCard dark={dark} label="Priority" sub="Urgent & High"
            value={M.priorityBreakdown.urgent+M.priorityBreakdown.high} vc={C_.error}
            icon={<AlertTriangle size={14} color={C_.error}/>}
            bd2={<div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-x-3 gap-y-1 items-center text-center">
              {[["U",C_.error],["H",C_.warning],["M","#60a5fa"],["L",ts]].flatMap(([l,col],i,a)=>[
                <span key={l} className="text-[8px] font-bold uppercase" style={{color:col}}>{l}</span>,
                i<a.length-1&&<span key={`s${i}`} className="text-[10px] opacity-20">|</span>
              ]).filter(Boolean)}
              {[M.priorityBreakdown.urgent,M.priorityBreakdown.high,M.priorityBreakdown.medium,M.priorityBreakdown.low].flatMap((v,i,a)=>[
                <span key={`v${i}`} className="text-sm font-black" style={{color:[C_.error,C_.warning,"#60a5fa",ts][i]}}>{v}</span>,
                i<a.length-1&&<span key={`vs${i}`} className="text-sm opacity-20">|</span>
              ]).filter(Boolean)}
            </div>}
          />
          <StatCard dark={dark} label="Adherence Rate" vc={C_.violet}
            value={`${ibON?M.adherePct:M.adherePctHist}%`}
            sub={ibON?`${M.openingBalance} Total`:`${M.withTA} Total`}
            icon={<TrendingUp size={14} color={C_.violet}/>}
            bd2={<div className="grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-1 items-center text-center">
              <span className="text-[8px] font-bold uppercase" style={{color:C_.success}}>Adhered</span>
              <span className="text-[10px] opacity-20">|</span>
              <span className="text-[8px] font-bold uppercase" style={{color:C_.error}}>Delayed</span>
              <span className="text-sm font-black" style={{color:C_.success}}>{M.adhered}</span>
              <span className="text-sm opacity-20">|</span>
              <span className="text-sm font-black" style={{color:C_.error}}>{M.delayed}</span>
            </div>}
          />
        </div>

        {/* SPOC TABLE */}
        <div className="rounded-2xl border shadow-sm overflow-hidden mb-5" style={{background:cbg, borderColor:cbd}}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{background:dark?"#0f1220":abg2, borderColor:cbd}}>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold tracking-tight">SPOC Performance Summary</span>
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{color:ts}}>{SD.length} SPOCs · sorted by total load</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{background:C_.success}}/>
                <span className="text-[10px] font-bold uppercase" style={{color:ts}}>Adhered</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-2 h-2 rounded-full" style={{background:C_.error}}/>
                <span className="text-[10px] font-bold uppercase" style={{color:ts}}>Delayed</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-20" style={{background:cbg}}>
                <tr style={{borderColor:cbd}}>
                  {[["SPOC",""],["Total","r"],["Open",C_.warning],["Closed",C_.success],["Resolved",C_.violet],["Pending",C_.error],["Ideas",""],["Bugs",""],["G1",""],["Adhered",C_.success],["Delayed",C_.error],["Adherence","r"]].map(([h,col], idx)=>(
                    <th key={h} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-b ${idx===0?"sticky left-0 z-30 border-r":""}`}
                      style={{
                        background:idx===0?cbg:undefined,
                        borderColor:cbd,
                        color:col&&col!=="r"?col:ts,
                        textAlign:(col==="r"||["Total","Ideas","Bugs","G1","Adherence"].includes(h))?"right":"left"
                      }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{borderColor:cbd}}>
                {SD.map(s=>(
                  <tr key={s.name} className="transition-colors hover:bg-black/5">
                    <td className="px-6 py-4 sticky left-0 z-10 border-r border-b" style={{background:cbg, borderColor:cbd}}>
                      <span className="px-3 py-1 rounded-lg text-[11px] font-bold tracking-tight" style={{background:`${SC[s.name]||C_.primary}18`,color:SC[s.name]||C_.primary}}>{s.name}</span>
                    </td>
                    {[s.total,s.open,s.closed,s.resolved,s.pending,s.ideas,s.bugs,s.g1,s.adhered,s.delayed].map((v,i)=>(
                      <td key={i} className="px-6 py-4 text-right text-xs font-semibold border-b"
                        style={{
                          borderColor:cbd,
                          color:i===1?C_.warning:i===2?C_.success:i===3?C_.violet:i===4?C_.error:i===8?C_.success:i===9?C_.error:tp
                        }}>{v}</td>
                    ))}
                    <td className="px-6 py-4 text-right border-b" style={{borderColor:cbd}}>
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#232a3e":"#e2e8f0"}}>
                          <div className="h-full transition-all duration-500" style={{width:`${s.pct}%`,background:abg(s.pct,C_)}}/>
                        </div>
                        <span className="text-[11px] font-bold min-w-[32px]" style={{color:abg(s.pct,C_)}}>{s.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-20 border-t" style={{background:dark?"#1a1f30":"#f8fafc", borderColor:cbd}}>
                <tr className="font-bold">
                  <td className="px-6 py-4 text-xs uppercase tracking-wider sticky left-0 z-10 border-r" style={{background:dark?"#1a1f30":"#f8fafc", borderColor:cbd}}>Total Aggregates</td>
                  {[SD.reduce((a,b)=>a+b.total,0),SD.reduce((a,b)=>a+b.open,0),SD.reduce((a,b)=>a+b.closed,0),SD.reduce((a,b)=>a+b.resolved,0),SD.reduce((a,b)=>a+b.pending,0),SD.reduce((a,b)=>a+b.ideas,0),SD.reduce((a,b)=>a+b.bugs,0),SD.reduce((a,b)=>a+b.g1,0),SD.reduce((a,b)=>a+b.adhered,0),SD.reduce((a,b)=>a+b.delayed,0)].map((v,i)=>(
                    <td key={i} className="px-6 py-4 text-right text-xs" style={{borderColor:cbd, color:i===1?C_.warning:i===2?C_.success:i===3?C_.violet:i===4?C_.error:i===8?C_.success:i===9?C_.error:tp}}>{v}</td>
                  ))}
                  <td className="px-6 py-4 text-right" style={{borderColor:cbd}}>
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#232a3e":"#e2e8f0"}}>
                        <div className="h-full" style={{width:`${ibON?M.adherePct:M.adherePctHist}%`,background:C_.primary}}/>
                      </div>
                      <span className="text-[11px] font-bold min-w-[32px]">{ibON?M.adherePct:M.adherePctHist}%</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
            {fil.length===0&&<div className="py-20 text-center text-sm font-medium" style={{color:ts}}>No tickets match current filters</div>}
          </div>
        </div>

        {/* CHARTS TOGGLE */}
        <button onClick={()=>setChartsOpen(o=>!o)} className="w-full rounded-2xl border shadow-sm p-4 flex items-center justify-between transition-all hover:shadow-md active:scale-[0.99]" style={{background:cbg, borderColor:cbd}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{background:chartsOpen?C_.primary:`${C_.primary}18`}}>
              <BarChart3 size={16} color={chartsOpen?"#fff":C_.primary}/>
            </div>
            <span className="text-sm font-bold tracking-tight">{chartsOpen?"Hide Analytics Charts":"Show Analytics Charts"}</span>
          </div>
          <ChevronDown size={20} className="transition-transform duration-300" style={{color:ts, transform:chartsOpen?"rotate(180deg)":"none"}}/>
        </button>

        {chartsOpen&&(
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{background:cbg, borderColor:cbd}}>
              <div className="flex border-b" style={{background:dark?"#0f1220":abg2, borderColor:cbd}}>
                {[["load","📊 Ticket Load"],["adhere","⏱ Adherence"],["kkj","✅ KKJ Quality"]].map(([t,l])=>(
                  <button key={t} onClick={()=>setActiveTab(t)} className="flex-1 py-3 text-[10px] font-bold tracking-wider uppercase transition-all border-b-2" style={{borderColor:activeTab===t?C_.primary:"transparent", color:activeTab===t?C_.primary:ts}}>{l}</button>
                ))}
              </div>
              <div className="p-4 flex-1 min-h-[300px] flex items-center justify-center">
                {SD.length===0?<div style={{color:ts,fontSize:12,fontWeight:500}}>No data available for charts</div>:(
                  <>
                    {activeTab==="load"&&(
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={SD} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                            label={({name,percent})=>`${name} ${Math.round(percent*100)}%`} labelLine={false}>
                            {SD.map((e,i)=><Cell key={i} fill={SC[e.name]||C_.primary}/>)}
                          </Pie>
                          <Tooltip contentStyle={TT} itemStyle={{color:tp}}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    {activeTab==="adhere"&&(
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={SD} margin={{top:10,bottom:10}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd}/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:ts}}/>
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                          <Tooltip contentStyle={TT} itemStyle={{color:tp}}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                          <Bar dataKey="adhered" name="Adhered" fill={C_.success} radius={[4,4,0,0]} barSize={20}/>
                          <Bar dataKey="delayed" name="Delayed" fill={C_.error} radius={[4,4,0,0]} barSize={20}/>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {activeTab==="kkj"&&(
                      <div className="flex flex-col h-full w-full gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider transition-colors" style={{color:kkjType==="ticket"?tp:ts}}>Tickets</span>
                          <button 
                            onClick={()=>setKkjType(kkjType==="idea"?"ticket":"idea")} 
                            className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0" 
                            style={{background:kkjType==="idea"?C_.primary:(dark?"#2a3050":"#cbd5e1")}}>
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200" style={{transform:kkjType==="idea"?"translateX(20px)":"none"}}/>
                          </button>
                          <span className="text-[10px] font-bold uppercase tracking-wider transition-colors" style={{color:kkjType==="idea"?tp:ts}}>Ideas</span>
                        </div>
                        <div className="flex-1 min-h-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={KD} margin={{top:10,bottom:10}}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd}/>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fontWeight:700,fill:ts}}/>
                              <YAxis domain={[0,100]} axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                              <Tooltip contentStyle={TT} itemStyle={{color:tp}}/><Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700}}/>
                              <Bar dataKey="Pass" name="Pass %" fill={C_.success} radius={[4,4,0,0]} barSize={20}/>
                              <Bar dataKey="Fail" name="Fail %" fill={C_.error} radius={[4,4,0,0]} barSize={20}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{background:cbg, borderColor:cbd}}>
              <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{background:dark?"#0f1220":abg2, borderColor:cbd}}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{color:C_.primary}}/>
                  <span className="text-sm font-bold tracking-tight">Ticket Volume · {ibON ? "Weekly" : "Monthly"} Trend</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={showStatusTrend} 
                        onChange={(e) => setShowStatusTrend(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-4 rounded-full transition-colors duration-200 ${showStatusTrend ? C_.primary : (dark ? "#2a3050" : "#cbd5e1")}`} />
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${showStatusTrend ? "translate-x-4" : ""}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{color: showStatusTrend ? tp : ts}}>Show Status Breakdown</span>
                  </label>
                </div>
              </div>
              <div className="p-4 flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={TD} margin={{top:10,right:10,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C_.primary} stopOpacity={.12}/>
                        <stop offset="95%" stopColor={C_.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={cbd} opacity={0.5}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:8,fontWeight:700,fill:ts}} interval={ibON ? 1 : 0}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:ts}}/>
                    <Tooltip 
                      contentStyle={{...TT, padding: '8px 12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                      itemStyle={{fontSize: 11, fontWeight: 600}}
                      cursor={{stroke: cbd, strokeWidth: 1}}
                    />
                    <Legend iconType="circle" wrapperStyle={{fontSize:10,fontWeight:700, paddingTop: 10}}/>
                    
                    {vis.InBucket && (
                      <Area type="monotone" dataKey="InBucket" name="In Bucket" stroke={C_.primary} fillOpacity={0.1} fill="url(#gT)" strokeWidth={3} animationDuration={500}/>
                    )}
                    {vis.OpeningBalance && (
                      <Line type="monotone" dataKey="OpeningBalance" name="Opening Balance" stroke={C_.warning} strokeWidth={2} dot={{r:3, fill: C_.warning}} animationDuration={500}/>
                    )}
                    {vis.OutBucket && (
                      <Line type="monotone" dataKey="OutBucket" name="Out of Bucket" stroke={C_.error} strokeWidth={2} dot={{r:2}} strokeDasharray="5 5" animationDuration={500}/>
                    )}
                    
                    {showStatusTrend && (
                      <>
                        <Line type="monotone" dataKey="O" name="Open (O)" stroke={C_.warning} strokeWidth={1.5} dot={{r:2, fill: C_.warning}} animationDuration={500}/>
                        <Line type="monotone" dataKey="P" name="Pending (P)" stroke="#ea580c" strokeWidth={1.5} dot={{r:2, fill: "#ea580c"}} animationDuration={500}/>
                        <Line type="monotone" dataKey="W" name="Waiting (W)" stroke="#2563eb" strokeWidth={1.5} dot={{r:2, fill: "#2563eb"}} animationDuration={500}/>
                        <Line type="monotone" dataKey="B" name="Blank (B)" stroke={ts} strokeWidth={1.5} dot={{r:2, fill: ts}} animationDuration={500}/>
                        <Line type="monotone" dataKey="RC" name="Res/Clsd (R/C)" stroke={C_.success} strokeWidth={1.5} dot={{r:2, fill: C_.success}} animationDuration={500}/>
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="py-6 px-8 text-center border-t mt-8" style={{borderColor:cbd, color:ts}}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
          BA Tickets Analytics Dashboard · {SHEET_NAME} · {tickets.length} records
        </p>
      </footer>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
