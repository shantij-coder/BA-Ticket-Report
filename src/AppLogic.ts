
/* ── Date helpers ─────────────────────────────────────────────────────────── */
export const MS: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
export const MO = ["Apr 2024","May 2024","Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024","Nov 2024","Dec 2024",
            "Jan 2025","Feb 2025","Mar 2025","Apr 2025","May 2025","Jun 2025","Jul 2025","Aug 2025","Sep 2025",
            "Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026"];

export function tryParse(s: string | null | undefined): Date | null {
  if (!s?.trim()) return null;
  s = s.trim();
  let m;
  if ((m=s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/))) {
    const mon=MS[m[2].toLowerCase()]; if(mon===undefined)return null;
    return new Date(m[3].length===2?2000+parseInt(m[3]):+m[3], mon, +m[1]);
  }
  if ((m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return new Date(+m[1],+m[2]-1,+m[3]);
  if ((m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/))) return new Date(m[3].length===2?2000+parseInt(m[3]):+m[3],+m[2]-1,+m[1]);
  if ((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return new Date(+m[3],+m[2]-1,+m[1]);
  return null;
}

export function fmt(d: Date | null | undefined, f: string): string {
  if (!d||isNaN(d.getTime())) return "";
  const N=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dd=String(d.getDate()).padStart(2,"0"),mo=N[d.getMonth()],yy=d.getFullYear(),mm=String(d.getMonth()+1).padStart(2,"0");
  return f==="dmy"?`${dd}-${mo}-${yy}`:f==="iso"?`${yy}-${mm}-${dd}`:`${mo} ${yy}`;
}

export function getQ(d: Date | null | undefined): number { if(!d)return 0; const m=d.getMonth(); return m>=3&&m<=5?1:m>=6&&m<=8?2:m>=9&&m<=11?3:4; }
export function getFY(d: Date | null | undefined): string {
  if(!d) return "";
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m <= 2 ? y - 1 : y;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export const TF = fmt(new Date(),"dmy"), TI = fmt(new Date(),"iso");

/* ── CSV parser ───────────────────────────────────────────────────────────── */
export function parseCSV(text: string): any[] {
  const src=text.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
  const recs: string[][] = []; let row: string[] =[],cell="",inQ=false;
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(inQ){if(ch==='"'){if(src[i+1]==='"'){cell+='"';i++;}else inQ=false;}else cell+=ch;}
    else{if(ch==='"')inQ=true;else if(ch===','){row.push(cell);cell="";}else if(ch==="\n"){row.push(cell);cell="";recs.push(row);row=[];}else cell+=ch;}
  }
  if(cell||row.length){row.push(cell);recs.push(row);}
  if(recs.length<2)return[];
  const H=recs[0].map(h=>h.trim().toLowerCase());
  return recs.slice(1).filter(c=>c.some(v=>v.trim())).map(c=>{const r: any ={};H.forEach((h,i)=>{r[h]=(c[i]||"").trim();});return r;});
}

/* ── Row mapper ───────────────────────────────────────────────────────────── */
export function fv(r: any,...kk: string[]): string {for(const k of kk)if(r[k]?.trim())return r[k].trim();return"";}

export interface Ticket {
  qtr: string;
  quarterNum: number;
  fiscalYear: string;
  qtrLabel: string;
  inBucket: string;
  date: string;
  age: number;
  timelineAdherence: string;
  ticketNo: string;
  subject: string;
  spocPrimary: string;
  priority: string;
  closureDate: string;
  closureStatus: string;
  isIdea: string;
  isBug: string;
  isG1: string;
  qualityCheckKKJ: string;
  accountName: string;
  monthYear: string;
}

export function mapRow(r: any): Ticket {
  const pd=tryParse(fv(r,"date")),my=pd?fmt(pd,"my"):"Unknown",qn=pd?getQ(pd):parseInt(fv(r,"qtr"))||0;
  const fy=pd?getFY(pd):"";
  const ql=fy?`Q${qn} (${fy})`:`Q${qn}`;
  const rc=fv(r,"closure date","closuredate"); let cd=rc; if(rc){const p=tryParse(rc);if(p)cd=fmt(p,"dmy");}
  const rs=fv(r,"closure status","closer status","status","closure_status","closer_status");
  let cs=rs; const sl=rs.toLowerCase();
  if(sl.includes("open"))cs="Open"; else if(sl.includes("closed"))cs="Closed";
  else if(sl.includes("resolved"))cs="Resolved"; else if(sl.includes("pending"))cs="Pending";
  else if(sl.includes("waiting"))cs="Waiting on Third Party";
  if(cd&&!["closed","resolved"].includes(cs.toLowerCase()))cs="Closed";
  const rp=(fv(r,"priority")||"Medium").toLowerCase();
  const pr=rp==="urgent"?"Urgent":rp==="high"?"High":rp==="low"?"Low":"Medium";
  return {
    qtr:fv(r,"qtr")||String(qn), inBucket:fv(r,"in bucket","in bucket ","in bucket?","bucket","in-bucket"),
    date:pd?fmt(pd,"iso"):fv(r,"date"), age:parseInt(fv(r,"age"))||0,
    timelineAdherence:fv(r,"timeline adherence","timelineadherence"),
    ticketNo:fv(r,"ticket no.","ticket no","ticket #"),
    subject:fv(r,"subject","title","description"),
    spocPrimary:fv(r,"spoc (primary)","spoc primary","spoc")||"Unassigned",
    priority:pr, closureDate:cd, closureStatus:cs,
    isIdea:fv(r,"is idea ?","is idea?","is idea","is_idea"),
    isBug:fv(r,"is bug? (erp/pos)","is bug?","is bug"),
    isG1:fv(r,"is g1?","is g1"),
    qualityCheckKKJ:fv(r,"quality check (kkj)","quality check kkj"),
    accountName:fv(r,"account name")||"Unknown",
    monthYear:my, quarterNum:qn, fiscalYear:fy, qtrLabel:ql
  };
}

export function isValid(r: any): boolean {
  const v=Object.values(r).filter(x=>(x as string)?.trim()?.length>0);
  const s=((r["closure status"]||r["closer status"]||r["status"]||"") as string).toLowerCase().trim();
  return v.length>=2&&s!=="ticket closer";
}

/* ── Aggregators ──────────────────────────────────────────────────────────── */
export const ib= (t: any) =>["yes","y","true","1"].includes((t.inBucket||"").toLowerCase().trim());
export const ia= (t: any) =>!["closed","resolved"].includes(t.closureStatus.toLowerCase().trim());

/* ── Colours ─────────────────────────────────────────────────────────────── */
export const C={primary:"#3b52d4",success:"#166534",warning:"#92400e",error:"#991b1b",violet:"#5b21b6",text3:"#64748b"};
export const CD={primary:"#6366f1",success:"#22c55e",warning:"#f59e0b",error:"#ef4444",violet:"#8b5cf6",text3:"#94a3b8"};
export const SC: Record<string, string>={SBJ:"#3b52d4",MG:"#7c3aed",CS:"#d97706",DD:"#be185d",HC:"#166534",KKJ:"#0369a1",Unassigned:"#64748b"};
export function abg(p: number,cl?: any){const c=cl||C;return p>=80?c.success:p>=60?c.warning:c.error;}

export const SHEET_NAME  = "FY 25-26";
export const PUBHTML_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv3ckmYhzL_P_ahjGThiMLHzPfCRvlmkByCTxmHzPsLvRqbj8v_r7opd66fzXsVvJ6BN6nk44EQmkX/pubhtml";

/* ── Fetch via Anthropic API ─────────────────────────────────────────────── */
export async function fetchSheetData() {
  const csvUrl = PUBHTML_URL.replace("/pubhtml", "/pub?output=csv");
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    return await res.text();
  } catch (e: any) {
    console.error("Fetch failed:", e.message);
    throw new Error(`Could not load data from Google Sheets. Please ensure the sheet is published to web as CSV. (${e.message})`);
  }
}

export interface Metrics {
  total: number;
  closed: number;
  resolved: number;
  open: number;
  pending: number;
  waiting: number;
  blank: number;
  closedToday: number;
  newToday: number;
  openingBalance: number;
  totalInBABucket: number;
  adhered: number;
  delayed: number;
  withTA: number;
  adherePct: number;
  adherePctHist: number;
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SPOCSummary {
  name: string;
  total: number;
  open: number;
  closed: number;
  resolved: number;
  pending: number;
  ideas: number;
  bugs: number;
  g1: number;
  adhered: number;
  delayed: number;
  pct: number;
}

export interface TrendData {
  name: string;
  Total: number;
  InBucket: number;
  OutBucket: number;
  Closed: number;
  Open: number;
  Resolved: number;
  O: number;
  P: number;
  W: number;
  B: number;
  RC: number;
  OpeningBalance: number;
}

export interface QualityData {
  name: string;
  Pass: number;
  Fail: number;
}

export function buildM(T: Ticket[]): Metrics {
  const cl=T.filter(t=>t.closureStatus.toLowerCase()==="closed").length;
  const rv=T.filter(t=>t.closureStatus.toLowerCase()==="resolved").length;
  const op=T.filter(t=>t.closureStatus.toLowerCase()==="open").length;
  const pe=T.filter(t=>t.closureStatus.toLowerCase()==="pending").length;
  const wt=T.filter(t=>t.closureStatus.toLowerCase().includes("waiting")).length;
  const bl=T.filter(t=>!t.closureStatus||!t.closureStatus.trim()).length;
  const ct=T.filter(t=>["closed","resolved"].includes(t.closureStatus.toLowerCase())&&t.closureDate===TF).length;
  const nt=T.filter(t=>t.date===TI).length;
  const ca=T.filter(ia).length, ob=Math.max(0,ca+ct);
  const bb=T.filter(t=>ib(t)&&ia(t)).length;
  const ad=T.filter(t=>(t.timelineAdherence||"").toLowerCase().trim()==="adhered").length;
  const dl=T.filter(t=>(t.timelineAdherence||"").toLowerCase().trim()==="delayed").length;
  const wta=ad+dl;
  return {
    total:ca,closed:cl,resolved:rv,open:op,pending:pe,waiting:wt,blank:bl,
    closedToday:ct,newToday:nt,openingBalance:ob,totalInBABucket:bb,
    adhered:ad,delayed:dl,withTA:wta,
    adherePct:ob?Math.round(ad/ob*100):0, adherePctHist:wta?Math.round(ad/wta*100):0,
    priorityBreakdown:{urgent:T.filter(t=>t.priority==="Urgent").length,high:T.filter(t=>t.priority==="High").length,
      medium:T.filter(t=>t.priority==="Medium").length,low:T.filter(t=>t.priority==="Low").length},
  };
}

export function buildS(T: Ticket[], names?: string[]): SPOCSummary[] {
  const list = names || [...new Set(T.map(t=>t.spocPrimary))].filter(Boolean).sort();
  return list.map(s=>{
    const r=T.filter(t=>t.spocPrimary===s),ad=r.filter(t=>(t.timelineAdherence||"").toLowerCase().trim()==="adhered").length,dl=r.filter(t=>(t.timelineAdherence||"").toLowerCase().trim()==="delayed").length;
    return{name:s as string,total:r.length,open:r.filter(t=>t.closureStatus==="Open").length,closed:r.filter(t=>t.closureStatus==="Closed").length,
      resolved:r.filter(t=>t.closureStatus==="Resolved").length,pending:r.filter(t=>t.closureStatus==="Pending").length,
      ideas:r.filter(t=>(t.isIdea||"").toLowerCase().trim()==="yes").length,bugs:r.filter(t=>(t.isBug||"").toLowerCase().trim()==="yes").length,
      g1:r.filter(t=>(t.isG1||"").toLowerCase().trim()==="yes").length,adhered:ad,delayed:dl,pct:(ad+dl)?Math.round(ad/(ad+dl)*100):0};
  }).sort((a,b)=>b.total-a.total);
}

export function buildTr(T: Ticket[], isWeekly: boolean): TrendData[] {
  if (isWeekly) {
    const allDates = T.map(t => tryParse(t.date)).filter((d): d is Date => d !== null);
    if (allDates.length === 0) return [];
    
    const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
    const start = new Date(sortedDates[0]);
    start.setHours(0, 0, 0, 0);
    
    // Align to Monday (1=Mon, 0=Sun)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const weeks: TrendData[] = [];
    let curr = new Date(start);

    while (curr <= end) {
      const wStart = new Date(curr);
      const wEnd = new Date(curr);
      wEnd.setDate(curr.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      
      const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const label = `${wStart.getDate()} ${mon[wStart.getMonth()]} - ${wEnd.getDate()} ${mon[wEnd.getMonth()]}`;
      
      const inWeek = T.filter(t => {
        const d = tryParse(t.date);
        return d && d >= wStart && d <= wEnd;
      });

      const bucketed = inWeek.filter(ib);
      
      // Opening Balance for the week: Tickets created before wStart and (not closed or closed after wStart)
      // PLUS tickets created during the week (since they contribute to the "load" of that week)
      // Actually, standard definition: Open at start of period.
      const openAtStart = T.filter(t => {
        const cd = tryParse(t.date);
        const cld = tryParse(t.closureDate);
        const createdBefore = cd && cd < wStart;
        const notClosedYet = !cld || cld >= wStart;
        return createdBefore && notClosedYet;
      }).length;

      weeks.push({
        name: label,
        Total: inWeek.length,
        InBucket: bucketed.length,
        OutBucket: inWeek.filter(t => !ib(t)).length,
        Closed: inWeek.filter(t => t.closureStatus === "Closed").length,
        Open: inWeek.filter(t => t.closureStatus === "Open").length,
        Resolved: inWeek.filter(t => t.closureStatus === "Resolved").length,
        O: inWeek.filter(t => t.closureStatus === "Open").length,
        P: inWeek.filter(t => t.closureStatus === "Pending").length,
        W: inWeek.filter(t => t.closureStatus.toLowerCase().includes("waiting")).length,
        B: inWeek.filter(t => !t.closureStatus || !t.closureStatus.trim()).length,
        RC: inWeek.filter(t => ["closed", "resolved"].includes(t.closureStatus.toLowerCase())).length,
        OpeningBalance: openAtStart
      });

      curr.setDate(curr.getDate() + 7);
    }
    return weeks.slice(-12);
  } else {
    const parse = (s: string) => {
      const [m, y] = (s as string).split(" ");
      const mi = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m);
      return new Date(parseInt(y), mi).getTime();
    };
    return [...new Set(T.map(t => t.monthYear))].filter(m => m !== "Unknown").sort((a, b) => parse(a as string) - parse(b as string)).map(m => {
      const mt = T.filter(t => t.monthYear === m);
      
      // Find the first day of this month
      const [monStr, yearStr] = (m as string).split(" ");
      const monthIdx = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(monStr);
      const mStart = new Date(parseInt(yearStr), monthIdx, 1);

      const openAtStart = T.filter(t => {
        const cd = tryParse(t.date);
        const cld = tryParse(t.closureDate);
        const createdBefore = cd && cd < mStart;
        const notClosedYet = !cld || cld >= mStart;
        return createdBefore && notClosedYet;
      }).length;

      return {
        name: (m as string).replace(" 20", "'"),
        Total: mt.length,
        InBucket: mt.filter(ib).length,
        OutBucket: mt.filter(t => !ib(t)).length,
        Closed: mt.filter(t => t.closureStatus === "Closed").length,
        Open: mt.filter(t => t.closureStatus === "Open").length,
        Resolved: mt.filter(t => t.closureStatus === "Resolved").length,
        O: mt.filter(t => t.closureStatus === "Open").length,
        P: mt.filter(t => t.closureStatus === "Pending").length,
        W: mt.filter(t => t.closureStatus.toLowerCase().includes("waiting")).length,
        B: mt.filter(t => !t.closureStatus || !t.closureStatus.trim()).length,
        RC: mt.filter(t => ["closed", "resolved"].includes(t.closureStatus.toLowerCase())).length,
        OpeningBalance: openAtStart
      };
    });
  }
}

export function buildK(T: Ticket[],kt: string): QualityData[] {
  return[...new Set(T.map(t=>t.spocPrimary))].filter(Boolean).sort().map(s=>{
    const pl=T.filter(t=>t.spocPrimary===s&&(kt==="idea"?(t.isIdea||"").toLowerCase()==="yes":(t.isIdea||"").toLowerCase()!=="yes"));
    const rv=pl.filter(t=>t.qualityCheckKKJ),ps=rv.filter(t=>(t.qualityCheckKKJ||"").toLowerCase()==="pass").length,tot=rv.length;
    return{name:s as string,Pass:tot?Math.round(ps/tot*100):0,Fail:tot?Math.round((tot-ps)/tot*100):0};
  });
}
