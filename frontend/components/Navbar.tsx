"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Clock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav style={{
      position:"sticky",top:0,zIndex:50,
      background:"rgba(13,10,8,0.85)",backdropFilter:"blur(16px)",
      borderBottom:"1px solid rgba(255,255,255,0.06)",
      height:"64px",display:"flex",alignItems:"center",padding:"0 24px",
    }}>
      <div style={{maxWidth:1200,margin:"0 auto",width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <Link href="/" style={{textDecoration:"none",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#dc2626,#991b1b)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Scale size={18} color="#fff" />
          </div>
          <span style={{fontWeight:800,fontSize:18,color:"#f5f5f5",letterSpacing:"-0.02em"}}>
            Legal<span style={{color:"#f87171"}}>Ease</span>
          </span>
        </Link>
        <div style={{display:"flex",gap:8}}>
          {([{href:"/",label:"Analyze",icon:<Scale size={15}/>},{href:"/history",label:"History",icon:<Clock size={15}/>}] as const).map(({href,label,icon})=>{
            const active=pathname===href;
            return(
              <Link key={href} href={href} style={{
                textDecoration:"none",display:"flex",alignItems:"center",gap:6,
                padding:"7px 14px",borderRadius:10,fontSize:14,fontWeight:500,
                background:active?"rgba(220,38,38,0.15)":"transparent",
                color:active?"#f87171":"rgba(255,255,255,0.6)",
                border:active?"1px solid rgba(220,38,38,0.3)":"1px solid transparent",
                transition:"all 0.2s",
              }}>{icon}{label}</Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
