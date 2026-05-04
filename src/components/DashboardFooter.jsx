export default function DashboardFooter() {
  return (
    <footer style={{
      flexShrink:0,
      borderTop:"1px solid rgba(255,255,255,0.06)",
      padding:"16px 24px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background:"#050505",
    }}>
      <p style={{color:"rgba(255,255,255,0.15)", fontSize:"11px", margin:0}}>© 2026 Nova AI · All rights reserved</p>
      <div style={{display:"flex", gap:20}}>
        {[["Pricing","/pricing"],["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]].map(([l,h]) => (
          <a key={h} href={h} style={{
            color:"rgba(255,255,255,0.15)", fontSize:"11px",
            textDecoration:"none", fontWeight:600,
            transition:"color 0.15s",
          }}
          onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.6)"}
          onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.15)"}
          >{l}</a>
        ))}
      </div>
    </footer>
  );
}