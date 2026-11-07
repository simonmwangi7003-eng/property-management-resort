import {useState} from 'react'
import {HashRouter,Routes,Route,NavLink,Navigate} from 'react-router-dom'
import {BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,Legend,ResponsiveContainer,CartesianGrid} from 'recharts'
import {LayoutDashboard,Building2,DoorOpen,Users,FileText,Banknote,Wrench,PieChart as Pie2,UserCog,Moon,Sun,LogOut,Menu,Bell,X,Plus,Printer,Download,KeyRound} from 'lucide-react'
import {DbProvider,useDb,today,addD,addM,mk,fmt,nextId,TYPES,UNIT_STATUS,CATS,EXP,lstat,live,overlap,invPaid,invBal,invStatus,propOf,csv} from './store'

const COL=['#1f3a5f','#d19a2a','#3c8d7a','#b5533c','#6b5ca5','#7b8794']
const Badge=({s})=><span className={'badge b-'+String(s).replace(/\s/g,'').toLowerCase()}>{s}</span>
const Field=({label,err,children})=><label className="fld"><span>{label}</span>{children}{err&&<em>{err}</em>}</label>
const Stat=({l,v})=><div className="stat"><small>{l}</small><b>{v}</b></div>
const Head=({t,children})=><div className="phead"><h2>{t}</h2><div>{children}</div></div>
const Sel=({v,set,opts,all})=><select value={v} onChange={e=>set(e.target.value)}>{all&&<option value="">{all}</option>}{opts.map(o=>Array.isArray(o)?<option key={o[0]} value={o[0]}>{o[1]}</option>:<option key={o}>{o}</option>)}</select>
function Modal({title,onClose,children,wide}){return <div className="ov" onClick={onClose}><div className={'modal'+(wide?' wide':'')} onClick={e=>e.stopPropagation()}><div className="mh"><h3>{title}</h3><button className="ic" aria-label="Close" onClick={onClose}><X size={18}/></button></div><div className="mb">{children}</div></div></div>}
function Table({cols,rows}){
 const [q,setQ]=useState(''),[sk,setSk]=useState(null),[asc,setAsc]=useState(true),[pg,setPg]=useState(0)
 let r=rows.filter(x=>JSON.stringify(Object.values(x)).toLowerCase().includes(q.toLowerCase()))
 if(sk)r=[...r].sort((a,b)=>(a[sk]>b[sk]?1:a[sk]<b[sk]?-1:0)*(asc?1:-1))
 const pages=Math.max(1,Math.ceil(r.length/8)),p=Math.min(pg,pages-1)
 return <div className="card"><input className="search" placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);setPg(0)}}/>
 {r.length?<div className="tw"><table><thead><tr>{cols.map(c=><th key={c.h} onClick={()=>c.k&&(setSk(c.k),setAsc(sk===c.k?!asc:true))}>{c.h}{sk===c.k?(asc?' ^':' v'):''}</th>)}</tr></thead>
 <tbody>{r.slice(p*8,p*8+8).map((x,i)=><tr key={x.id||i}>{cols.map(c=><td key={c.h}>{c.r?c.r(x):x[c.k]}</td>)}</tr>)}</tbody></table></div>:<div className="empty">No records match. Adjust the search or add a new record.</div>}
 <div className="pager"><span>{r.length} records</span><div><button className="btn sm" disabled={p===0} onClick={()=>setPg(p-1)}>Prev</button> {p+1}/{pages} <button className="btn sm" disabled={p+1>=pages} onClick={()=>setPg(p+1)}>Next</button></div></div></div>
}
const useLk=()=>{const {db}=useDb();return{pn:id=>db.properties.find(p=>p.id===id)?.name||'Removed',un:id=>{const u=db.units.find(x=>x.id===id);return u?u.number+' · '+(db.properties.find(p=>p.id===u.propertyId)?.name||''):'Removed'},tn:id=>db.tenants.find(t=>t.id===id)?.name||'Removed'}}
const MGR=['admin','manager']

/* Documents */
function Doc({kind,item,onClose}){
 const {db}=useDb(),{un,tn}=useLk()
 let body
 if(kind==='lease')body=<><h3>Residential Rental Agreement {item.id}</h3><p>Tenant <b>{tn(item.tenantId)}</b> rents unit <b>{un(item.unitId)}</b> from {item.start} to {item.end}.</p><div className="line"><span>Monthly rent</span><span>{fmt(item.rent)}</span></div><div className="line"><span>Security deposit</span><span>{fmt(item.deposit)}</span></div><p>Rent is due on the 5th of each month. The tenant keeps the unit in good condition and reports defects through the maintenance portal. Either party may terminate with notice under the agreed terms.</p><div className="sign"><span>Landlord signature</span><span>Tenant signature</span></div></>
 else{const pays=db.payments.filter(p=>p.invoiceId===item.id);body=<><h3>{kind==='invoice'?'Invoice '+item.id:'Receipt for '+item.id}</h3><p>{tn(item.tenantId)} · period {item.month} · due {item.due}</p><div className="line"><span>Monthly rent</span><span>{fmt(item.amount)}</span></div>{pays.map(p=><div className="line" key={p.id}><span>{p.id} · {p.method} · {p.date} {p.ref&&'· '+p.ref}</span><span>{fmt(p.amount)}</span></div>)}<div className="line tot"><span>Balance</span><span>{fmt(invBal(db,item))}</span></div></>}
 return <Modal title="Document" onClose={onClose} wide><div className="print">{body}</div><div className="acts"><button className="btn pri" onClick={()=>window.print()}><Printer size={16}/> Print</button></div></Modal>
}

/* Dashboard */
function Dashboard(){
 const {db}=useDb();const [pf,setPf]=useState('')
 const units=db.units.filter(u=>!pf||u.propertyId===pf),uid=new Set(units.map(u=>u.id))
 const leases=db.leases.filter(l=>uid.has(l.unitId)),lid=new Set(leases.map(l=>l.id)),inv=db.invoices.filter(i=>lid.has(i.leaseId)),pays=db.payments.filter(p=>inv.some(i=>i.id===p.invoiceId))
 const exp=db.expenses.filter(e=>!pf||e.propertyId===pf),cur=inv.filter(i=>i.month===mk(0))
 const out=inv.reduce((s,i)=>s+Math.max(0,invBal(db,i)),0),od=inv.filter(i=>invStatus(db,i)==='Overdue').reduce((s,i)=>s+invBal(db,i),0)
 const months=[-5,-4,-3,-2,-1,0].map(mk)
 const trend=months.map(m=>({m:m.slice(5),expected:inv.filter(i=>i.month===m).reduce((s,i)=>s+i.amount,0),collected:pays.filter(p=>p.date.startsWith(m)).reduce((s,p)=>s+p.amount,0)}))
 const grp=(a,f)=>Object.entries(a.reduce((m,x)=>(m[f(x)]=(m[f(x)]||0)+x.v,m),{})).map(([name,value])=>({name,value}))
 const perf=db.properties.map(p=>({name:p.name.split(' ')[0],net:db.payments.filter(x=>propOf(db,db.leases.find(l=>l.id===db.invoices.find(i=>i.id===x.invoiceId)?.leaseId)?.unitId)===p.id).reduce((s,x)=>s+x.amount,0)-db.expenses.filter(e=>e.propertyId===p.id).reduce((s,e)=>s+e.amount,0)}))
 const occ=units.length?Math.round(units.filter(u=>u.status==='Occupied').length/units.length*100):0
 return <><Head t="Dashboard"><Sel v={pf} set={setPf} all="All properties" opts={db.properties.map(p=>[p.id,p.name])}/></Head>
 <div className="stats"><Stat l="Properties" v={pf?1:db.properties.length}/><Stat l="Units" v={units.length}/><Stat l="Occupied" v={units.filter(u=>u.status==='Occupied').length}/><Stat l="Vacant" v={units.filter(u=>u.status==='Available').length}/><Stat l="Tenants" v={db.tenants.length}/>
 <Stat l="Active leases" v={leases.filter(l=>lstat(l)==='Active').length}/><Stat l="Expiring in 60 days" v={leases.filter(l=>lstat(l)==='Active'&&l.end<=addD(60)).length}/><Stat l="Expected this month" v={fmt(cur.reduce((s,i)=>s+i.amount,0))}/>
 <Stat l="Rent collected" v={fmt(pays.reduce((s,p)=>s+p.amount,0))}/><Stat l="Outstanding" v={fmt(out)}/><Stat l="Overdue" v={fmt(od)}/><Stat l="Pending maintenance" v={db.requests.filter(r=>uid.has(r.unitId)&&r.status!=='Completed').length}/><Stat l="Expenses" v={fmt(exp.reduce((s,e)=>s+e.amount,0))}/><Stat l="Occupancy" v={occ+'%'}/></div>
 <div className="charts">
 <div className="card"><h4>Expected vs collected rent</h4><ResponsiveContainer height={230}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" opacity={.3}/><XAxis dataKey="m"/><YAxis/><Tooltip/><Legend/><Line dataKey="expected" stroke={COL[1]} strokeWidth={2}/><Line dataKey="collected" stroke={COL[0]} strokeWidth={2.5}/></LineChart></ResponsiveContainer></div>
 <div className="card"><h4>Monthly revenue</h4><ResponsiveContainer height={230}><BarChart data={trend}><XAxis dataKey="m"/><YAxis/><Tooltip/><Bar dataKey="collected" fill={COL[2]}/></BarChart></ResponsiveContainer></div>
 <div className="card"><h4>Unit occupancy</h4><ResponsiveContainer height={230}><PieChart><Pie data={grp(units.map(u=>({name:u.status,v:1})),x=>x.name)} dataKey="value" outerRadius={85} label>{COL.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
 <div className="card"><h4>Net income by property</h4><ResponsiveContainer height={230}><BarChart data={perf}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="net" fill={COL[0]}/></BarChart></ResponsiveContainer></div>
 <div className="card"><h4>Expense distribution</h4><ResponsiveContainer height={230}><PieChart><Pie data={Object.entries(exp.reduce((m,e)=>(m[e.category]=(m[e.category]||0)+e.amount,m),{})).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" outerRadius={85} label>{COL.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div></>
}

/* Properties */
function PropForm({p,onClose}){
 const {act,toast}=useDb();const [f,setF]=useState(p||{name:'',type:'Apartment',address:'',owner:'',desc:'',amenities:'',hue:210}),[e,setE]=useState({}),s=(k,v)=>setF(x=>({...x,[k]:v}))
 const save=()=>{const er={};if(f.name.trim().length<3)er.name='Enter a property name';if(f.address.trim().length<5)er.address='Enter the address';if(!f.owner.trim())er.owner='Enter the owner';setE(er);if(Object.keys(er).length)return
  act(d=>{if(p)Object.assign(d.properties.find(x=>x.id===p.id),f);else d.properties.push({...f,id:nextId('PRP',d.properties)})});toast('Property saved');onClose()}
 return <Modal title={p?'Edit property':'Add property'} onClose={onClose}><div className="grid2"><Field label="Name" err={e.name}><input value={f.name} onChange={x=>s('name',x.target.value)}/></Field><Field label="Category"><Sel v={f.type} set={v=>s('type',v)} opts={TYPES}/></Field><Field label="Address" err={e.address}><input value={f.address} onChange={x=>s('address',x.target.value)}/></Field><Field label="Owner" err={e.owner}><input value={f.owner} onChange={x=>s('owner',x.target.value)}/></Field></div>
 <Field label="Amenities"><input value={f.amenities} onChange={x=>s('amenities',x.target.value)}/></Field><Field label="Description"><textarea value={f.desc} onChange={x=>s('desc',x.target.value)}/></Field><Field label={'Image colour (hue '+f.hue+')'}><input type="range" min="0" max="360" value={f.hue} onChange={x=>s('hue',+x.target.value)}/></Field>
 <div className="acts"><button className="btn pri" onClick={save}>Save property</button></div></Modal>
}
function Properties({user}){
 const {db,act,toast}=useDb();const [m,setM]=useState(null),[v,setV]=useState(null),[t,setT]=useState(''),can=MGR.includes(user.role)
 const del=p=>{if(db.units.some(u=>u.propertyId===p.id))return toast('Remove or reassign its units first','err');if(confirm('Delete '+p.name+'?')){act(d=>{d.properties=d.properties.filter(x=>x.id!==p.id)});toast('Property deleted')}}
 const vp=v&&db.properties.find(p=>p.id===v)
 return <><Head t="Properties"><Sel v={t} set={setT} all="All categories" opts={TYPES}/>{can&&<button className="btn pri" onClick={()=>setM({})}><Plus size={16}/> Add property</button>}</Head>
 <div className="cards">{db.properties.filter(p=>!t||p.type===t).map(p=>{const us=db.units.filter(u=>u.propertyId===p.id),oc=us.filter(u=>u.status==='Occupied').length
 return <div key={p.id} className="card room"><div className="img" style={{background:`linear-gradient(135deg,hsl(${p.hue} 40% 30%),hsl(${p.hue+30} 45% 55%))`}}><b>{p.name}</b></div><div className="rb"><div className="between"><span>{p.id}</span><Badge s={p.type}/></div><small>{p.address} · Owner {p.owner}</small><p>{us.length} units · {us.length?Math.round(oc/us.length*100):0}% occupied</p>
 <div className="row"><button className="btn sm" onClick={()=>setV(p.id)}>View</button>{can&&<><button className="btn sm" onClick={()=>setM(p)}>Edit</button><button className="btn sm dng" onClick={()=>del(p)}>Delete</button></>}</div></div></div>})}</div>
 {m&&<PropForm p={m.id?m:null} onClose={()=>setM(null)}/>}
 {vp&&<Modal title={vp.name} onClose={()=>setV(null)} wide><p>{vp.desc}<br/>Amenities: {vp.amenities||'None listed'}</p>{db.units.filter(u=>u.propertyId===vp.id).map(u=><div className="line" key={u.id}><span>{u.number} · {u.beds} bed · {u.baths} bath</span><span>{fmt(u.rent)} <Badge s={u.status}/></span></div>)}</Modal>}</>
}

/* Units */
function UnitForm({u,onClose}){
 const {db,act,toast}=useDb();const [f,setF]=useState(u||{propertyId:db.properties[0]?.id||'',number:'',beds:1,baths:1,floor:1,rent:1000,deposit:1000,status:'Available'}),[e,setE]=useState({}),s=(k,v)=>setF(x=>({...x,[k]:v}))
 const sug=pid=>{const p=db.properties.find(x=>x.id===pid);return (p?.name[0]||'U')+(101+db.units.filter(x=>x.propertyId===pid).length)}
 const num=f.number||sug(f.propertyId)
 const save=()=>{const er={};if(!f.propertyId)er.propertyId='Select a property'
  if(db.units.some(x=>x.propertyId===f.propertyId&&x.number===num&&x.id!==u?.id))er.number='Unit number already exists in this property'
  if(!(+f.rent>0))er.rent='Rent must be above 0';if(+f.deposit<0)er.deposit='Invalid deposit'
  if(u&&u.status==='Occupied'&&f.status!=='Occupied')er.status='Terminate the lease to free an occupied unit'
  if(f.status==='Occupied'&&!u)er.status='Occupied is set by creating a lease'
  setE(er);if(Object.keys(er).length)return
  act(d=>{const v={...f,number:num,beds:+f.beds,baths:+f.baths,floor:+f.floor,rent:+f.rent,deposit:+f.deposit};if(u)Object.assign(d.units.find(x=>x.id===u.id),v);else d.units.push({...v,id:nextId('UNT',d.units)})});toast('Unit saved');onClose()}
 return <Modal title={u?'Edit unit':'Add unit'} onClose={onClose}><div className="grid2"><Field label="Property" err={e.propertyId}><Sel v={f.propertyId} set={v=>s('propertyId',v)} opts={db.properties.map(p=>[p.id,p.name])}/></Field><Field label="Unit number" err={e.number}><input placeholder={num} value={f.number} onChange={x=>s('number',x.target.value)}/></Field>
 {[['beds','Bedrooms'],['baths','Bathrooms'],['floor','Floor']].map(([k,l])=><Field key={k} label={l}><input type="number" min="0" value={f[k]} onChange={x=>s(k,x.target.value)}/></Field>)}
 <Field label="Monthly rent ($)" err={e.rent}><input type="number" value={f.rent} onChange={x=>s('rent',x.target.value)}/></Field><Field label="Security deposit ($)" err={e.deposit}><input type="number" value={f.deposit} onChange={x=>s('deposit',x.target.value)}/></Field>
 <Field label="Status" err={e.status}><Sel v={f.status} set={v=>s('status',v)} opts={UNIT_STATUS}/></Field></div><div className="acts"><button className="btn pri" onClick={save}>Save unit</button></div></Modal>
}
function Units({user}){
 const {db,act,toast}=useDb();const {tn,pn}=useLk();const [m,setM]=useState(null),[h,setH]=useState(null),[pf,setPf]=useState(''),[sf,setSf]=useState(''),can=MGR.includes(user.role)
 const del=u=>{if(db.leases.some(l=>l.unitId===u.id))return toast('Unit has lease history and cannot be deleted','err');if(confirm('Delete unit '+u.number+'?')){act(d=>{d.units=d.units.filter(x=>x.id!==u.id)});toast('Unit deleted')}}
 const cur=u=>{const l=db.leases.find(x=>x.unitId===u.id&&lstat(x)==='Active');return l?tn(l.tenantId):'-'}
 const rows=db.units.filter(u=>(!pf||u.propertyId===pf)&&(!sf||u.status===sf)).map(u=>({...u,property:pn(u.propertyId),tenant:cur(u)}))
 return <><Head t="Rental units"><Sel v={pf} set={setPf} all="All properties" opts={db.properties.map(p=>[p.id,p.name])}/><Sel v={sf} set={setSf} all="All statuses" opts={UNIT_STATUS}/>{can&&<button className="btn pri" onClick={()=>setM({})}><Plus size={16}/> Add unit</button>}</Head>
 <Table rows={rows} cols={[{k:'number',h:'Unit'},{k:'property',h:'Property'},{k:'beds',h:'Beds'},{k:'baths',h:'Baths'},{k:'floor',h:'Floor'},{k:'rent',h:'Rent',r:u=>fmt(u.rent)},{k:'deposit',h:'Deposit',r:u=>fmt(u.deposit)},{k:'status',h:'Status',r:u=><Badge s={u.status}/>},{k:'tenant',h:'Tenant'},
 {h:'',r:u=><div className="row"><button className="btn sm" onClick={()=>setH(u)}>History</button>{can&&<><button className="btn sm" onClick={()=>setM(u)}>Edit</button><button className="btn sm dng" onClick={()=>del(u)}>Delete</button></>}</div>}]}/>
 {m&&<UnitForm u={m.id?m:null} onClose={()=>setM(null)}/>}
 {h&&<Modal title={'Rental history · '+h.number} onClose={()=>setH(null)}>{db.leases.filter(l=>l.unitId===h.id).map(l=><div className="line" key={l.id}><span>{tn(l.tenantId)} · {l.start} to {l.end}</span><Badge s={lstat(l)}/></div>)}{!db.leases.some(l=>l.unitId===h.id)&&<div className="empty">No rental history yet.</div>}</Modal>}</>
}

/* Tenants */
function TenantForm({t,onClose}){
 const {db,act,toast}=useDb();const [f,setF]=useState(t||{name:'',email:'',phone:'',emergency:'',status:'Active'}),[e,setE]=useState({}),s=(k,v)=>setF(x=>({...x,[k]:v}))
 const save=()=>{const er={};if(f.name.trim().length<2)er.name='Enter the full name';if(!/^\S+@\S+\.\S+$/.test(f.email))er.email='Enter a valid email';else if(db.tenants.some(x=>x.email===f.email&&x.id!==t?.id))er.email='Email already registered'
  if(f.phone.replace(/\D/g,'').length<7)er.phone='Enter a valid phone number';setE(er);if(Object.keys(er).length)return
  act(d=>{if(t)Object.assign(d.tenants.find(x=>x.id===t.id),f);else d.tenants.push({...f,id:nextId('TNT',d.tenants),registered:today()})});toast('Tenant saved');onClose()}
 return <Modal title={t?'Edit tenant':'Register tenant'} onClose={onClose}><div className="grid2">{[['name','Full name'],['email','Email'],['phone','Phone'],['emergency','Emergency contact']].map(([k,l])=><Field key={k} label={l} err={e[k]}><input value={f[k]} onChange={x=>s(k,x.target.value)}/></Field>)}<Field label="Status"><Sel v={f.status} set={v=>s('status',v)} opts={['Active','Former']}/></Field></div><div className="acts"><button className="btn pri" onClick={save}>Save tenant</button></div></Modal>
}
function Tenants(){
 const {db,act,toast}=useDb();const {un}=useLk();const [m,setM]=useState(null),[v,setV]=useState(null),[sf,setSf]=useState('')
 const out=t=>db.invoices.filter(i=>i.tenantId===t.id).reduce((s,i)=>s+Math.max(0,invBal(db,i)),0)
 const del=t=>{if(db.leases.some(l=>l.tenantId===t.id))return toast('Tenant has lease history. Mark as Former instead.','err');if(confirm('Delete '+t.name+'?')){act(d=>{d.tenants=d.tenants.filter(x=>x.id!==t.id)});toast('Tenant deleted')}}
 const vt=v&&db.tenants.find(t=>t.id===v)
 return <><Head t="Tenants"><Sel v={sf} set={setSf} all="All tenants" opts={['Active','Former']}/><button className="btn pri" onClick={()=>setM({})}><Plus size={16}/> Register tenant</button></Head>
 <Table rows={db.tenants.filter(t=>!sf||t.status===sf).map(t=>({...t,outstanding:out(t)}))} cols={[{k:'id',h:'ID'},{k:'name',h:'Name'},{k:'phone',h:'Phone'},{k:'email',h:'Email'},{k:'status',h:'Status',r:t=><Badge s={t.status}/>},{k:'outstanding',h:'Outstanding',r:t=>fmt(t.outstanding)},
 {h:'',r:t=><div className="row"><button className="btn sm" onClick={()=>setV(t.id)}>View</button><button className="btn sm" onClick={()=>setM(t)}>Edit</button><button className="btn sm dng" onClick={()=>del(t)}>Delete</button></div>}]}/>
 {m&&<TenantForm t={m.id?m:null} onClose={()=>setM(null)}/>}
 {vt&&<Modal title={vt.name+' · '+vt.id} onClose={()=>setV(null)} wide><p>{vt.email} · {vt.phone}<br/>Emergency: {vt.emergency||'-'}</p><h4>Agreements</h4>{db.leases.filter(l=>l.tenantId===vt.id).map(l=><div className="line" key={l.id}><span>{un(l.unitId)} · {l.start} to {l.end}</span><Badge s={lstat(l)}/></div>)}
 <h4>Payment history</h4>{db.payments.filter(p=>db.invoices.find(i=>i.id===p.invoiceId)?.tenantId===vt.id).map(p=><div className="line" key={p.id}><span>{p.date} · {p.method}</span><span>{fmt(p.amount)}</span></div>)}<p><b>Outstanding {fmt(out(vt))}</b></p></Modal>}</>
}

/* Leasing */
function AppForm({onClose}){
 const {db,act,toast}=useDb();const {un}=useLk();const av=db.units.filter(u=>u.status==='Available')
 const [f,setF]=useState({name:'',email:'',phone:'',unitId:av[0]?.id||'',moveIn:addD(14),income:''}),[e,setE]=useState({}),s=(k,v)=>setF(x=>({...x,[k]:v}))
 const save=()=>{const er={};if(f.name.trim().length<2)er.name='Enter the applicant name';if(!/^\S+@\S+\.\S+$/.test(f.email))er.email='Enter a valid email';if(f.phone.replace(/\D/g,'').length<7)er.phone='Enter a valid phone number'
  if(!f.unitId)er.unitId='No available unit selected';else if(overlap(db,f.unitId,f.moveIn,addM(f.moveIn,1)))er.moveIn='Unit has a lease covering that date';if(f.moveIn<today())er.moveIn='Move-in cannot be in the past';if(!(+f.income>0))er.income='Enter monthly income'
  setE(er);if(Object.keys(er).length)return;act(d=>{d.applications.push({...f,income:+f.income,id:nextId('APP',d.applications),status:'Pending'})});toast('Application submitted');onClose()}
 return <Modal title="New rental application" onClose={onClose}><div className="grid2"><Field label="Applicant" err={e.name}><input value={f.name} onChange={x=>s('name',x.target.value)}/></Field><Field label="Email" err={e.email}><input value={f.email} onChange={x=>s('email',x.target.value)}/></Field><Field label="Phone" err={e.phone}><input value={f.phone} onChange={x=>s('phone',x.target.value)}/></Field>
 <Field label="Available unit" err={e.unitId}><Sel v={f.unitId} set={v=>s('unitId',v)} opts={av.map(u=>[u.id,un(u.id)])}/></Field><Field label="Move-in date" err={e.moveIn}><input type="date" value={f.moveIn} onChange={x=>s('moveIn',x.target.value)}/></Field><Field label="Monthly income ($)" err={e.income}><input type="number" value={f.income} onChange={x=>s('income',x.target.value)}/></Field></div><div className="acts"><button className="btn pri" onClick={save}>Submit application</button></div></Modal>
}
function LeaseForm({a,onClose}){
 const {db,act,toast}=useDb();const u=db.units.find(x=>x.id===a.unitId)
 const [f,setF]=useState({start:a.moveIn,end:addM(a.moveIn,12),rent:u.rent,deposit:u.deposit}),[e,setE]=useState({})
 const save=()=>{const er={};if(f.end<=f.start)er.end='End date must be after start';if(overlap(db,u.id,f.start,f.end))er.start='Overlaps an existing lease on this unit';if(!(+f.rent>0))er.rent='Rent must be above 0';if(+f.deposit<0)er.deposit='Invalid deposit'
  setE(er);if(Object.keys(er).length)return
  act(d=>{let t=d.tenants.find(x=>x.email===a.email);if(!t){t={id:nextId('TNT',d.tenants),name:a.name,email:a.email,phone:a.phone,emergency:'',status:'Active',registered:today()};d.tenants.push(t)}t.status='Active'
   d.leases.push({id:nextId('LSE',d.leases),tenantId:t.id,unitId:u.id,start:f.start,end:f.end,rent:+f.rent,deposit:+f.deposit,status:'Active'});d.units.find(x=>x.id===u.id).status=f.start<=today()?'Occupied':'Reserved';d.applications.find(x=>x.id===a.id).status='Leased'});toast('Lease created and unit assigned');onClose()}
 return <Modal title={'Create lease · '+a.name} onClose={onClose}><div className="grid2"><Field label="Start" err={e.start}><input type="date" value={f.start} onChange={x=>setF({...f,start:x.target.value})}/></Field><Field label="End" err={e.end}><input type="date" value={f.end} onChange={x=>setF({...f,end:x.target.value})}/></Field><Field label="Monthly rent ($)" err={e.rent}><input type="number" value={f.rent} onChange={x=>setF({...f,rent:x.target.value})}/></Field><Field label="Security deposit ($)" err={e.deposit}><input type="number" value={f.deposit} onChange={x=>setF({...f,deposit:x.target.value})}/></Field></div><div className="acts"><button className="btn pri" onClick={save}>Create lease</button></div></Modal>
}
function Leasing(){
 const {db,act,toast}=useDb();const {un,tn}=useLk();const [tab,setTab]=useState('apps'),[m,setM]=useState(false),[ln,setLn]=useState(null),[doc,setDoc]=useState(null)
 const setApp=(a,s)=>{act(d=>{d.applications.find(x=>x.id===a.id).status=s});toast('Application '+s.toLowerCase())}
 const renew=l=>{const end=addM(l.end,12);if(overlap(db,l.unitId,l.end,end,l.id))return toast('Renewal overlaps another lease','err');act(d=>{const x=d.leases.find(y=>y.id===l.id);x.end=end;x.status='Active'});toast('Lease renewed to '+end)}
 const term=l=>{if(!confirm('Terminate lease '+l.id+'?'))return;act(d=>{d.leases.find(y=>y.id===l.id).status='Terminated';const u=d.units.find(x=>x.id===l.unitId);if(u.status!=='Under Maintenance')u.status='Available'
  if(!d.leases.some(y=>y.tenantId===l.tenantId&&y.id!==l.id&&live(y)))d.tenants.find(t=>t.id===l.tenantId).status='Former'});toast('Lease terminated. Unit released.')}
 return <><Head t="Applications & leases"><button className={'btn'+(tab==='apps'?' pri':'')} onClick={()=>setTab('apps')}>Applications</button><button className={'btn'+(tab==='leases'?' pri':'')} onClick={()=>setTab('leases')}>Leases</button>{tab==='apps'&&<button className="btn pri" onClick={()=>setM(true)}><Plus size={16}/> New application</button>}</Head>
 {tab==='apps'?<Table rows={db.applications} cols={[{k:'id',h:'Ref'},{k:'name',h:'Applicant'},{k:'unitId',h:'Unit',r:a=>un(a.unitId)},{k:'moveIn',h:'Move-in'},{k:'income',h:'Income',r:a=>fmt(a.income)},{k:'status',h:'Status',r:a=><Badge s={a.status}/>},
 {h:'',r:a=><div className="row">{a.status==='Pending'&&<><button className="btn sm pri" onClick={()=>setApp(a,'Approved')}>Approve</button><button className="btn sm dng" onClick={()=>setApp(a,'Rejected')}>Reject</button></>}{a.status==='Approved'&&<button className="btn sm pri" onClick={()=>setLn(a)}>Create lease</button>}</div>}]}/>
 :<Table rows={db.leases.map(l=>({...l,st:lstat(l),tenant:tn(l.tenantId),unit:un(l.unitId)}))} cols={[{k:'id',h:'Lease'},{k:'tenant',h:'Tenant'},{k:'unit',h:'Unit'},{k:'start',h:'Start'},{k:'end',h:'End'},{k:'rent',h:'Rent',r:l=>fmt(l.rent)},{k:'st',h:'Status',r:l=><><Badge s={l.st}/>{l.st==='Active'&&l.end<=addD(60)&&<Badge s="Expiring"/>}</>},
 {h:'',r:l=><div className="row"><button className="btn sm" onClick={()=>setDoc(l)}>Agreement</button>{['Active','Expired'].includes(l.st)&&<button className="btn sm" onClick={()=>renew(l)}>Renew</button>}{l.st!=='Terminated'&&<button className="btn sm dng" onClick={()=>term(l)}>Terminate</button>}</div>}]}/>}
 {m&&<AppForm onClose={()=>setM(false)}/>}{ln&&<LeaseForm a={ln} onClose={()=>setLn(null)}/>}{doc&&<Doc kind="lease" item={doc} onClose={()=>setDoc(null)}/>}</>
}

/* Rent */
function Rent({user}){
 const {db,act,toast}=useDb();const {tn,un}=useLk();const [pay,setPay]=useState(null),[f,setF]=useState({amount:'',method:'Cash',ref:'',date:today()}),[doc,setDoc]=useState(null),[mon,setMon]=useState(mk(0)),[sf,setSf]=useState('')
 const mgr=['admin','manager','accountant'].includes(user.role)
 const rows=db.invoices.filter(i=>(mgr||i.tenantId===user.tenantId)&&(!sf||invStatus(db,i)===sf)).map(i=>({...i,tenant:tn(i.tenantId),paid:invPaid(db,i),bal:invBal(db,i),st:invStatus(db,i)}))
 const gen=()=>{let n=0;act(d=>{d.leases.filter(l=>l.status!=='Terminated'&&l.start.slice(0,7)<=mon&&l.end.slice(0,7)>=mon).forEach(l=>{if(!d.invoices.some(i=>i.leaseId===l.id&&i.month===mon)){d.invoices.push({id:nextId('INV',d.invoices),leaseId:l.id,tenantId:l.tenantId,month:mon,amount:l.rent,due:mon+'-05'});n++}})});toast(n?n+' invoice(s) generated':'No new invoices needed for '+mon,n?'ok':'err')}
 const rec=()=>{const i=pay,bal=invBal(db,i),v=+f.amount
  if(!(v>0))return toast('Enter an amount above 0','err');if(v>bal+.005)return toast('Payment exceeds the balance of '+fmt(bal),'err');if(f.method!=='Cash'&&!f.ref.trim())return toast('Enter a payment reference','err');if(f.date>today())return toast('Payment date cannot be in the future','err')
  act(d=>{d.payments.push({id:nextId('PAY',d.payments),invoiceId:i.id,amount:v,method:f.method,ref:f.ref,date:f.date})});toast('Payment recorded');setPay(null);setF({amount:'',method:'Cash',ref:'',date:today()})}
 return <><Head t={mgr?'Rent collection':'My rent'}>{mgr&&<><input type="month" value={mon} onChange={e=>setMon(e.target.value)}/><button className="btn" onClick={gen}>Generate invoices</button></>}<Sel v={sf} set={setSf} all="All statuses" opts={['Paid','Partial','Unpaid','Overdue']}/></Head>
 <div className="stats"><Stat l="Invoiced" v={fmt(rows.reduce((s,i)=>s+i.amount,0))}/><Stat l="Collected" v={fmt(rows.reduce((s,i)=>s+i.paid,0))}/><Stat l="Outstanding" v={fmt(rows.reduce((s,i)=>s+Math.max(0,i.bal),0))}/></div>
 <Table rows={rows} cols={[{k:'id',h:'Invoice'},{k:'tenant',h:'Tenant'},{k:'month',h:'Period'},{k:'due',h:'Due'},{k:'amount',h:'Amount',r:i=>fmt(i.amount)},{k:'paid',h:'Paid',r:i=>fmt(i.paid)},{k:'bal',h:'Balance',r:i=>fmt(i.bal)},{k:'st',h:'Status',r:i=><Badge s={i.st}/>},
 {h:'',r:i=><div className="row">{mgr&&i.bal>.005&&<button className="btn sm pri" onClick={()=>setPay(i)}>Record payment</button>}<button className="btn sm" onClick={()=>setDoc({kind:i.paid>0?'receipt':'invoice',item:i})}>{i.paid>0?'Receipt':'Invoice'}</button></div>}]}/>
 {pay&&<Modal title={'Payment · '+pay.id} onClose={()=>setPay(null)}><p>Balance {fmt(invBal(db,pay))}</p><div className="grid2"><Field label="Amount ($)"><input type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field><Field label="Method"><Sel v={f.method} set={v=>setF({...f,method:v})} opts={['Cash','Bank Transfer','Card','Mobile Money']}/></Field><Field label="Reference"><input value={f.ref} onChange={e=>setF({...f,ref:e.target.value})}/></Field><Field label="Date"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field></div><div className="acts"><button className="btn pri" onClick={rec}>Record payment</button></div></Modal>}
 {doc&&<Doc {...doc} onClose={()=>setDoc(null)}/>}</>
}

/* Maintenance */
function Maintenance({user}){
 const {db,act,toast}=useDb();const {un,tn}=useLk();const [m,setM]=useState(false),[as,setAs]=useState(null),[cp,setCp]=useState(null),[sf,setSf]=useState('')
 const isT=user.role==='tenant',isTech=user.role==='technician',mgr=MGR.includes(user.role),techs=db.users.filter(u=>u.role==='technician'&&u.active)
 const myUnits=isT?db.leases.filter(l=>l.tenantId===user.tenantId&&lstat(l)==='Active').map(l=>l.unitId):db.units.map(u=>u.id)
 const rows=db.requests.filter(r=>(!isT||r.tenantId===user.tenantId)&&(!isTech||r.assignee===user.id)&&(!sf||r.status===sf))
 const [f,setF]=useState({unitId:myUnits[0]||'',category:'Plumbing',priority:'Medium',desc:''})
 const create=()=>{if(!f.unitId)return toast('You have no active unit to report on','err');if(f.desc.trim().length<5)return toast('Describe the problem (at least 5 characters)','err')
  const l=db.leases.find(x=>x.unitId===f.unitId&&lstat(x)==='Active');act(d=>{d.requests.push({...f,id:nextId('REQ',d.requests),tenantId:isT?user.tenantId:l?.tenantId||'',status:'Pending',assignee:'',estCost:0,actualCost:0,created:today()})});toast('Request submitted');setM(false);setF({...f,desc:''})}
 const setSt=(r,s,extra={})=>{act(d=>{const x=d.requests.find(y=>y.id===r.id);Object.assign(x,{status:s},extra);const u=d.units.find(y=>y.id===r.unitId)
  if(s==='In Progress')u.status='Under Maintenance'
  if(s==='Completed'){x.completed=today();if(u.status==='Under Maintenance')u.status=d.leases.some(l=>l.unitId===u.id&&lstat(l)==='Active')?'Occupied':'Available'
   if(extra.actualCost>0)d.expenses.push({id:nextId('EXP',d.expenses),propertyId:u.propertyId,category:'Maintenance',amount:extra.actualCost,date:today(),note:x.id+' '+x.category})}});toast('Request '+r.id+' is now '+s)}
 return <><Head t="Maintenance"><Sel v={sf} set={setSf} all="All statuses" opts={['Pending','Approved','Assigned','In Progress','Completed']}/><button className="btn pri" onClick={()=>setM(true)}><Plus size={16}/> New request</button></Head>
 <Table rows={rows.map(r=>({...r,unit:un(r.unitId),tech:db.users.find(u=>u.id===r.assignee)?.name||'-'}))} cols={[{k:'id',h:'Ref'},{k:'unit',h:'Unit'},{k:'category',h:'Category'},{k:'desc',h:'Issue'},{k:'priority',h:'Priority',r:r=><Badge s={r.priority}/>},{k:'tech',h:'Technician'},{k:'estCost',h:'Est.',r:r=>fmt(r.estCost)},{k:'actualCost',h:'Actual',r:r=>fmt(r.actualCost)},{k:'status',h:'Status',r:r=><Badge s={r.status}/>},
 {h:'',r:r=><div className="row">{mgr&&r.status==='Pending'&&<button className="btn sm pri" onClick={()=>setSt(r,'Approved')}>Approve</button>}{mgr&&['Approved','Assigned'].includes(r.status)&&<button className="btn sm" onClick={()=>setAs({r,tech:techs[0]?.id||'',est:r.estCost||''})}>Assign</button>}
 {(mgr||isTech)&&r.status==='Assigned'&&<button className="btn sm pri" onClick={()=>setSt(r,'In Progress')}>Start</button>}{(mgr||isTech)&&r.status==='In Progress'&&<button className="btn sm pri" onClick={()=>setCp({r,cost:r.estCost})}>Complete</button>}{r.completed&&<small>{r.completed}</small>}</div>}]}/>
 {m&&<Modal title="New maintenance request" onClose={()=>setM(false)}><div className="grid2"><Field label="Unit"><Sel v={f.unitId} set={v=>setF({...f,unitId:v})} opts={myUnits.map(u=>[u,un(u)])}/></Field><Field label="Category"><Sel v={f.category} set={v=>setF({...f,category:v})} opts={CATS}/></Field><Field label="Priority"><Sel v={f.priority} set={v=>setF({...f,priority:v})} opts={['Low','Medium','High']}/></Field></div><Field label="Description"><textarea value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}/></Field><div className="acts"><button className="btn pri" onClick={create}>Submit request</button></div></Modal>}
 {as&&<Modal title={'Assign '+as.r.id} onClose={()=>setAs(null)}><Field label="Technician"><Sel v={as.tech} set={v=>setAs({...as,tech:v})} opts={techs.map(u=>[u.id,u.name])}/></Field><Field label="Estimated cost ($)"><input type="number" value={as.est} onChange={e=>setAs({...as,est:e.target.value})}/></Field><div className="acts"><button className="btn pri" onClick={()=>{if(!as.tech)return toast('Select a technician','err');if(+as.est<0)return toast('Cost cannot be negative','err');setSt(as.r,'Assigned',{assignee:as.tech,estCost:+as.est||0});setAs(null)}}>Assign technician</button></div></Modal>}
 {cp&&<Modal title={'Complete '+cp.r.id} onClose={()=>setCp(null)}><Field label="Actual cost ($)"><input type="number" value={cp.cost} onChange={e=>setCp({...cp,cost:e.target.value})}/></Field><p>The cost is posted to property expenses and the unit is released.</p><div className="acts"><button className="btn pri" onClick={()=>{if(!(+cp.cost>=0))return toast('Enter a valid cost','err');setSt(cp.r,'Completed',{actualCost:+cp.cost});setCp(null)}}>Mark completed</button></div></Modal>}</>
}

/* Finance */
function Finance({user}){
 const {db,act,toast}=useDb();const {pn}=useLk();const [m,setM]=useState(null),[mon,setMon]=useState(''),can=['admin','manager','accountant'].includes(user.role)
 const ex=db.expenses.filter(e=>!mon||e.date.startsWith(mon))
 const prof=db.properties.map(p=>{const inc=db.payments.filter(x=>{const i=db.invoices.find(y=>y.id===x.invoiceId);return propOf(db,db.leases.find(l=>l.id===i?.leaseId)?.unitId)===p.id&&(!mon||x.date.startsWith(mon))}).reduce((s,x)=>s+x.amount,0),cost=ex.filter(e=>e.propertyId===p.id).reduce((s,e)=>s+e.amount,0);return{id:p.id,property:p.name,income:inc,expenses:cost,net:inc-cost}})
 const [f,setF]=useState({propertyId:db.properties[0]?.id||'',category:'Utilities',amount:'',date:today(),note:''})
 const save=()=>{if(!f.propertyId)return toast('Select a property','err');if(!(+f.amount>0))return toast('Amount must be above 0','err');if(f.date>today())return toast('Date cannot be in the future','err')
  act(d=>{if(m.id)Object.assign(d.expenses.find(x=>x.id===m.id),{...f,amount:+f.amount});else d.expenses.push({...f,amount:+f.amount,id:nextId('EXP',d.expenses)})});toast('Expense saved');setM(null)}
 const open=e=>{setF(e.id?{propertyId:e.propertyId,category:e.category,amount:e.amount,date:e.date,note:e.note}:{...f,amount:'',note:''});setM(e)}
 return <><Head t="Finance & reports"><input type="month" value={mon} onChange={e=>setMon(e.target.value)}/><button className="btn" onClick={()=>csv('profitability.csv',[['Property','Income','Expenses','Net'],...prof.map(p=>[p.property,p.income,p.expenses,p.net])])}><Download size={16}/> Profit CSV</button><button className="btn" onClick={()=>csv('expenses.csv',[['ID','Property','Category','Amount','Date','Note'],...ex.map(e=>[e.id,pn(e.propertyId),e.category,e.amount,e.date,e.note])])}><Download size={16}/> Expenses CSV</button>{can&&<button className="btn pri" onClick={()=>open({})}><Plus size={16}/> Add expense</button>}</Head>
 <div className="stats"><Stat l="Income" v={fmt(prof.reduce((s,p)=>s+p.income,0))}/><Stat l="Expenses" v={fmt(ex.reduce((s,e)=>s+e.amount,0))}/><Stat l="Net rental income" v={fmt(prof.reduce((s,p)=>s+p.net,0))}/></div>
 <h4>Property profitability</h4><Table rows={prof} cols={[{k:'property',h:'Property'},{k:'income',h:'Income',r:p=>fmt(p.income)},{k:'expenses',h:'Expenses',r:p=>fmt(p.expenses)},{k:'net',h:'Net',r:p=>fmt(p.net)}]}/>
 <h4>Expenses</h4><Table rows={ex.map(e=>({...e,property:pn(e.propertyId)}))} cols={[{k:'id',h:'ID'},{k:'property',h:'Property'},{k:'category',h:'Category'},{k:'amount',h:'Amount',r:e=>fmt(e.amount)},{k:'date',h:'Date'},{k:'note',h:'Note'},{h:'',r:e=>can&&<div className="row"><button className="btn sm" onClick={()=>open(e)}>Edit</button><button className="btn sm dng" onClick={()=>confirm('Delete expense?')&&(act(d=>{d.expenses=d.expenses.filter(x=>x.id!==e.id)}),toast('Expense deleted'))}>Delete</button></div>}]}/>
 {m&&<Modal title={m.id?'Edit expense':'Add expense'} onClose={()=>setM(null)}><div className="grid2"><Field label="Property"><Sel v={f.propertyId} set={v=>setF({...f,propertyId:v})} opts={db.properties.map(p=>[p.id,p.name])}/></Field><Field label="Category"><Sel v={f.category} set={v=>setF({...f,category:v})} opts={EXP}/></Field><Field label="Amount ($)"><input type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></Field><Field label="Date"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field></div><Field label="Note"><input value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></Field><div className="acts"><button className="btn pri" onClick={save}>Save expense</button></div></Modal>}</>
}

/* Users */
function UsersPage(){
 const {db,act,toast}=useDb();const [m,setM]=useState(false),[f,setF]=useState({name:'',email:'',role:'manager',password:'Rent@1234',tenantId:''})
 const add=()=>{if(f.name.trim().length<2)return toast('Enter a name','err');if(!/^\S+@\S+\.\S+$/.test(f.email)||db.users.some(u=>u.email===f.email))return toast('Enter a unique, valid email','err');if(f.role==='tenant'&&!f.tenantId)return toast('Link the account to a tenant','err');if(!pwOk(f.password))return toast(PWMSG,'err')
  act(d=>{d.users.push({...f,id:nextId('USR',d.users),active:true})});toast('Account created');setM(false)}
 return <><Head t="User accounts"><button className="btn pri" onClick={()=>setM(true)}><Plus size={16}/> Add account</button></Head>
 <Table rows={db.users} cols={[{k:'name',h:'Name'},{k:'email',h:'Email'},{k:'role',h:'Role'},{k:'active',h:'Status',r:u=><Badge s={u.active?'Active':'Disabled'}/>},{h:'',r:u=><button className="btn sm" onClick={()=>{if(u.role==='admin'&&u.active&&db.users.filter(x=>x.role==='admin'&&x.active).length<2)return toast('Keep at least one active administrator','err');act(d=>{const x=d.users.find(y=>y.id===u.id);x.active=!x.active});toast('Account updated')}}>{u.active?'Deactivate':'Activate'}</button>}]}/>
 {m&&<Modal title="Add account" onClose={()=>setM(false)}><div className="grid2"><Field label="Name"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Email"><input value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field><Field label="Role"><Sel v={f.role} set={v=>setF({...f,role:v})} opts={['admin','owner','manager','accountant','technician','tenant']}/></Field><Field label="Temporary password"><input value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></Field>
 {f.role==='tenant'&&<Field label="Tenant record"><Sel v={f.tenantId} set={v=>setF({...f,tenantId:v})} all="Select..." opts={db.tenants.map(t=>[t.id,t.name])}/></Field>}</div><div className="acts"><button className="btn pri" onClick={add}>Create account</button></div></Modal>}</>
}
const pwOk=p=>p.length>=8&&/[A-Z]/.test(p)&&/\d/.test(p),PWMSG='Password needs 8+ characters, an uppercase letter and a number'

/* Shell */
const NAV=[['/','Dashboard',LayoutDashboard,['admin','owner','manager','accountant'],Dashboard],['/properties','Properties',Building2,['admin','owner','manager'],Properties],['/units','Units',DoorOpen,['admin','owner','manager'],Units],['/tenants','Tenants',Users,['admin','manager'],Tenants],['/leasing','Leasing',FileText,['admin','manager'],Leasing],
['/rent','Rent',Banknote,['admin','manager','accountant','tenant'],Rent],['/maintenance','Maintenance',Wrench,['admin','manager','technician','tenant'],Maintenance],['/finance','Finance',Pie2,['admin','owner','manager','accountant'],Finance],['/users','Accounts',UserCog,['admin'],UsersPage]]
function Login(){
 const {db,act,toast}=useDb();const [em,setEm]=useState(''),[pw,setPw]=useState('')
 const go=(e,p)=>{const u=db.users.find(x=>x.email===e&&x.password===p);if(!u)return toast('Incorrect email or password','err');if(!u.active)return toast('This account is deactivated','err');act(d=>{d.session=u.id})}
 return <div className="login"><div className="card lcard"><h1>Keystone</h1><p>Property management</p><Field label="Email"><input value={em} onChange={e=>setEm(e.target.value)}/></Field><Field label="Password"><input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go(em,pw)}/></Field><button className="btn pri full" onClick={()=>go(em,pw)}>Sign in</button>
 <p className="hint">Demo accounts (password Rent@1234)</p><div className="chips">{db.users.map(u=><button key={u.id} className="btn sm" onClick={()=>go(u.email,u.password)}>{u.role}</button>)}</div></div></div>
}
function Profile({user,onClose}){
 const {act,toast}=useDb();const [f,setF]=useState({name:user.name,cur:'',nw:''})
 const save=()=>{if(f.name.trim().length<2)return toast('Enter a name','err');if(f.nw){if(f.cur!==user.password)return toast('Current password is incorrect','err');if(!pwOk(f.nw))return toast(PWMSG,'err')}
  act(d=>{const u=d.users.find(x=>x.id===user.id);u.name=f.name;if(f.nw)u.password=f.nw});toast('Profile updated');onClose()}
 return <Modal title="My profile" onClose={onClose}><p>{user.email} · {user.role}</p><Field label="Name"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Current password"><input type="password" value={f.cur} onChange={e=>setF({...f,cur:e.target.value})}/></Field><Field label="New password (optional)"><input type="password" value={f.nw} onChange={e=>setF({...f,nw:e.target.value})}/></Field><div className="acts"><button className="btn pri" onClick={save}>Save profile</button></div></Modal>
}
function Shell(){
 const {db,act,reset}=useDb();const [open,setOpen]=useState(false),[bell,setBell]=useState(false),[pf,setPf]=useState(false)
 const user=db.users.find(u=>u.id===db.session);if(!user)return <Login/>
 const nav=NAV.filter(n=>n[3].includes(user.role)),home=nav[0][0],mine=i=>user.role!=='tenant'||i.tenantId===user.tenantId
 const notes=[[db.invoices.filter(i=>mine(i)&&invStatus(db,i)==='Overdue').length,'overdue rent invoices'],[db.invoices.filter(i=>mine(i)&&invStatus(db,i)!=='Paid'&&i.due>=today()&&i.due<=addD(7)).length,'rent invoices due within 7 days']].concat(user.role==='tenant'?[]:[[db.leases.filter(l=>lstat(l)==='Active'&&l.end<=addD(60)).length,'leases expiring within 60 days'],[db.applications.filter(a=>a.status==='Pending').length,'new tenant applications'],[db.requests.filter(r=>r.status==='Pending').length,'new maintenance requests']]).filter(n=>n[0])
 return <div className="app"><aside className={open?'open':''}><h1>Keystone</h1>{nav.map(([p,l,I])=><NavLink key={p} to={p} end onClick={()=>setOpen(false)}><I size={18}/>{l}</NavLink>)}<button className="link" onClick={reset}>Reset demo data</button></aside>
 <main><header><button className="ic mob" aria-label="Menu" onClick={()=>setOpen(!open)}><Menu/></button><span className="grow"/><div className="bellw"><button className="ic" aria-label="Notifications" onClick={()=>setBell(!bell)}><Bell size={18}/>{notes.length>0&&<i>{notes.length}</i>}</button>{bell&&<div className="pop card">{notes.length?notes.map(n=><div key={n[1]}><b>{n[0]}</b> {n[1]}</div>):'All caught up'}</div>}</div>
 <button className="ic" aria-label="Theme" onClick={()=>act(d=>{d.theme=d.theme==='dark'?'light':'dark'})}>{db.theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="ic" aria-label="Profile" onClick={()=>setPf(true)}><KeyRound size={18}/></button><span className="who">{user.name}</span><button className="ic" aria-label="Sign out" onClick={()=>act(d=>{d.session=null})}><LogOut size={18}/></button></header>
 <section><Routes>{nav.map(([p,,,,C])=><Route key={p} path={p} element={<C user={user}/>}/>)}<Route path="*" element={<Navigate to={home}/>}/></Routes></section></main>{pf&&<Profile user={user} onClose={()=>setPf(false)}/>}</div>
}
export default function App(){return <DbProvider><HashRouter><Shell/></HashRouter></DbProvider>}
