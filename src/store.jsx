import {createContext,useContext,useEffect,useState,useCallback} from 'react'
export const today=()=>new Date().toISOString().slice(0,10)
export const addD=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
export const addM=(s,n)=>{const d=new Date(s);d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10)}
export const mk=o=>{const d=new Date();d.setMonth(d.getMonth()+o,1);return d.toISOString().slice(0,7)}
export const fmt=n=>'$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2})
export const nextId=(p,l)=>p+(Math.max(1000,...l.map(x=>+String(x.id).replace(/\D/g,'')||0))+1)
export const TYPES=['Apartment','House','Office','Commercial']
export const UNIT_STATUS=['Available','Occupied','Reserved','Under Maintenance']
export const CATS=['Plumbing','Electrical','Painting','HVAC','General']
export const EXP=['Maintenance','Utilities','Security','Cleaning','Insurance','Other']
export const lstat=l=>l.status==='Terminated'?'Terminated':l.end<today()?'Expired':l.start>today()?'Upcoming':'Active'
export const live=l=>['Active','Upcoming'].includes(lstat(l))
export const overlap=(db,unitId,a,b,ign)=>db.leases.some(l=>l.unitId===unitId&&l.id!==ign&&live(l)&&a<l.end&&b>l.start)
export const invPaid=(db,i)=>db.payments.filter(p=>p.invoiceId===i.id).reduce((s,p)=>s+p.amount,0)
export const invBal=(db,i)=>i.amount-invPaid(db,i)
export const invStatus=(db,i)=>{const p=invPaid(db,i);return p>=i.amount-.005?'Paid':i.due<today()?'Overdue':p>0?'Partial':'Unpaid'}
export const propOf=(db,unitId)=>db.units.find(u=>u.id===unitId)?.propertyId
export const csv=(name,rows)=>{const t=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download=name;a.click()}
const K='keystone-pms',V=1
function seed(){
 const properties=[['Harbor View Apartments','Apartment','12 Marina Rd','Grace Njeri'],['Maple Court Houses','House','48 Maple Ave','Grace Njeri'],['Central Plaza','Commercial','2 Market Sq','Daniel Kimani']].map((p,i)=>({id:'PRP'+(1001+i),name:p[0],type:p[1],address:p[2],owner:p[3],desc:p[1]+' property in a prime location.',amenities:'Parking, Security, Water tank',hue:200+i*50}))
 const units=[];const cfg=[[5,1200],[4,1800],[3,2500]]
 cfg.forEach(([n,rent],pi)=>{for(let k=0;k<n;k++)units.push({id:'UNT'+(1001+units.length),propertyId:properties[pi].id,number:'ABC'[pi]+(101+k),beds:pi===2?0:1+(k%3),baths:1+(k%2),floor:1+Math.floor(k/2),rent:rent+k*100,deposit:rent+k*100,status:'Available'})})
 const names=['Amina Hassan','Peter Otieno','Laura Smith','Kofi Mensah','Nadia Ali','Victor Mwangi','Jane Wafula']
 const tenants=names.map((n,i)=>({id:'TNT'+(1001+i),name:n,email:n.split(' ')[0].toLowerCase()+'@mail.com',phone:'+25470000'+(1100+i*11),emergency:'Relative · +25471100'+(2000+i),status:'Active',registered:addD(-300)}))
 const leases=[],invoices=[],payments=[]
 names.forEach((_,i)=>{const u=units[i],end=i===1?addD(25):addM(today(),4+i),start=addM(end,-12);leases.push({id:'LSE'+(1001+i),tenantId:tenants[i].id,unitId:u.id,start,end,rent:u.rent,deposit:u.deposit,status:'Active'});u.status='Occupied'
  for(let o=-2;o<=0;o++){const id='INV'+(1001+invoices.length);invoices.push({id,leaseId:'LSE'+(1001+i),tenantId:tenants[i].id,month:mk(o),amount:u.rent,due:mk(o)+'-05'})
   const full=o===-2||(o===-1&&i!==2&&i!==5)||(o===0&&i<2);if(full)payments.push({id:'PAY'+(1001+payments.length),invoiceId:id,amount:u.rent,method:['Cash','Bank Transfer','Card','Mobile Money'][i%4],ref:'REF'+(5000+payments.length),date:mk(o)+'-03'})
   else if(o===-1&&i===5)payments.push({id:'PAY'+(1001+payments.length),invoiceId:id,amount:400,method:'Cash',ref:'',date:mk(o)+'-06'})}})
 units[7].status='Under Maintenance'
 const applications=[{id:'APP1001',name:'Chris Njoroge',email:'chris@mail.com',phone:'+254722000111',unitId:units[10].id,moveIn:addD(14),income:5200,status:'Pending'},{id:'APP1002',name:'Ruth Adhiambo',email:'ruth@mail.com',phone:'+254722000222',unitId:units[8].id,moveIn:addD(30),income:4100,status:'Approved'}]
 const users=[['Ada Admin','admin'],['Grace Owner','owner'],['Mark Manager','manager'],['Alan Accountant','accountant'],['Tom Technician','technician'],['Amina Hassan','tenant']].map((u,i)=>({id:'USR'+(1001+i),name:u[0],email:u[1]+'@keystone.com',password:'Rent@1234',role:u[1],active:true,tenantId:u[1]==='tenant'?'TNT1001':''}))
 const requests=[{id:'REQ1001',unitId:units[0].id,tenantId:'TNT1001',category:'Plumbing',desc:'Kitchen sink is leaking',priority:'High',status:'Pending',assignee:'',estCost:0,actualCost:0,created:addD(-1)},{id:'REQ1002',unitId:units[7].id,tenantId:'',category:'Electrical',desc:'Rewire hallway lighting',priority:'Medium',status:'In Progress',assignee:'USR1005',estCost:300,actualCost:0,created:addD(-6)}]
 const expenses=[0,1,2].flatMap(p=>[{id:'EXP'+(1001+p*2),propertyId:properties[p].id,category:'Utilities',amount:420+p*60,date:addD(-20),note:'Water and power'},{id:'EXP'+(1002+p*2),propertyId:properties[p].id,category:'Security',amount:300,date:addD(-10),note:'Guard service'}])
 return{v:V,session:null,theme:'light',properties,units,tenants,leases,invoices,payments,applications,requests,expenses,users}
}
const load=()=>{try{const s=JSON.parse(localStorage.getItem(K));if(s&&s.v===V)return s}catch{}return seed()}
const Ctx=createContext();export const useDb=()=>useContext(Ctx)
export function DbProvider({children}){
 const [db,setDb]=useState(load),[toasts,setT]=useState([])
 useEffect(()=>{localStorage.setItem(K,JSON.stringify(db));document.documentElement.dataset.theme=db.theme},[db])
 const act=useCallback(fn=>setDb(p=>{const n=structuredClone(p);fn(n);return n}),[])
 const toast=useCallback((m,t='ok')=>{const id=Math.random();setT(x=>[...x,{id,m,t}]);setTimeout(()=>setT(x=>x.filter(y=>y.id!==id)),3200)},[])
 const reset=()=>{localStorage.removeItem(K);setDb(seed())}
 return <Ctx.Provider value={{db,act,toast,reset}}>{children}<div className="toasts">{toasts.map(t=><div key={t.id} className={'toast '+t.t}>{t.m}</div>)}</div></Ctx.Provider>
}
