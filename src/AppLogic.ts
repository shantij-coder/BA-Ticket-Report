
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
    monthYear:my, quarterNum:qn,
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
export const C={primary:"#4763f5",success:"#15803d",warning:"#b45309",error:"#b91c1c",violet:"#6d28d9",text3:"#8e97b0"};
export const CD={primary:"#5b78ff",success:"#4ade80",warning:"#fbbf24",error:"#f87171",violet:"#a78bfa",text3:"#4e5a7a"};
export const SC: Record<string, string>={SBJ:"#4763f5",MG:"#7c3aed",CS:"#d97706",DD:"#be185d",HC:"#15803d",KKJ:"#0369a1",Unassigned:"#8e97b0"};
export function abg(p: number,cl?: any){const c=cl||C;return p>=80?c.success:p>=60?c.warning:c.error;}

export const SHEET_NAME  = "FY 25-26";
export const PUBHTML_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv3ckmYhzL_P_ahjGThiMLHzPfCRvlmkByCTxmHzPsLvRqbj8v_r7opd66fzXsVvJ6BN6nk44EQmkX/pubhtml";

/* ── Fetch via Anthropic API ─────────────────────────────────────────────── */
export async function fetchSheetData() {
  // Note: This implementation is as provided by the user.
  // In a real environment, this would require an API key and potentially a backend proxy.
  // For demonstration, we'll try to fetch directly if possible or use a fallback.
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // "x-api-key": "YOUR_API_KEY" // This would be needed
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Fetch the content of this Google Sheets published page: ${PUBHTML_URL}

Extract ALL the data rows from the spreadsheet table and return them as CSV.
The columns are: Qtr,In Bucket,Date,Adherence Date,Last date for adherence,Age,Timeline Adherence,Ticket no.,Case Number,Subject,SPOC (Primary),SPOC (Secondary),Quality Check (DD),Priority,Is IDEA ?,Is idea Urgent?,Is Bug? (ERP/POS),Is G1?,Closure Date,Delay Reason,Adjusted Adherence status,Quality Check (KKJ),Review Date (KKJ),Remarks by KKJ,Closure status,Understanding/Update,Jira Id/Dev id,Update,Remarks (Optional),Account Name,BA Code

Return ONLY raw CSV data starting with the header row. No markdown, no explanation, no code blocks. Wrap values containing commas in double quotes.`
        }]
      })
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    if (!text || text.length < 200) throw new Error("Empty response from API");
    return text;
  } catch (e) {
    // Fallback: Try to fetch the CSV directly if the sheet is published as CSV
    const csvUrl = PUBHTML_URL.replace("/pubhtml", "/pub?output=csv");
    const res = await fetch(csvUrl);
    if (!res.ok) throw e;
    return await res.text();
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
  Closed: number;
  Open: number;
  Resolved: number;
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

export function buildS(T: Ticket[]): SPOCSummary[] {
  return[...new Set(T.map(t=>t.spocPrimary))].filter(Boolean).sort().map(s=>{
    const r=T.filter(t=>t.spocPrimary===s),ad=r.filter(t=>(t.timelineAdherence||"").toLowerCase()==="adhered").length,dl=r.filter(t=>(t.timelineAdherence||"").toLowerCase()==="delayed").length;
    return{name:s as string,total:r.length,open:r.filter(t=>t.closureStatus==="Open").length,closed:r.filter(t=>t.closureStatus==="Closed").length,
      resolved:r.filter(t=>t.closureStatus==="Resolved").length,pending:r.filter(t=>t.closureStatus==="Pending").length,
      ideas:r.filter(t=>(t.isIdea||"").toLowerCase()==="yes").length,bugs:r.filter(t=>(t.isBug||"").toLowerCase()==="yes").length,
      g1:r.filter(t=>(t.isG1||"").toLowerCase()==="yes").length,adhered:ad,delayed:dl,pct:(ad+dl)?Math.round(ad/(ad+dl)*100):0};
  }).sort((a,b)=>b.total-a.total);
}

export function buildTr(T: Ticket[]): TrendData[] {
  return[...new Set(T.map(t=>t.monthYear))].filter(m=>m!=="Unknown").sort((a,b)=>MO.indexOf(a as string)-MO.indexOf(b as string)).map(m=>{
    const mt=T.filter(t=>t.monthYear===m);
    return{name:(m as string).replace(" 20","'"),Total:mt.length,Closed:mt.filter(t=>t.closureStatus==="Closed").length,Open:mt.filter(t=>t.closureStatus==="Open").length,Resolved:mt.filter(t=>t.closureStatus==="Resolved").length};
  });
}

export function buildK(T: Ticket[],kt: string): QualityData[] {
  return[...new Set(T.map(t=>t.spocPrimary))].filter(Boolean).sort().map(s=>{
    const pl=T.filter(t=>t.spocPrimary===s&&(kt==="idea"?(t.isIdea||"").toLowerCase()==="yes":(t.isIdea||"").toLowerCase()!=="yes"));
    const rv=pl.filter(t=>t.qualityCheckKKJ),ps=rv.filter(t=>(t.qualityCheckKKJ||"").toLowerCase()==="pass").length,tot=rv.length;
    return{name:s as string,Pass:tot?Math.round(ps/tot*100):0,Fail:tot?Math.round((tot-ps)/tot*100):0};
  });
}
