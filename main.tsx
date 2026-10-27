import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type InfoLink = { label: string; url: string };
const officialLinks: InfoLink[] = [
  { label: "Comcast Corporate", url: "https://corporate.comcast.com/" },
  { label: "Xfinity services", url: "https://www.xfinity.com/" },
  { label: "Xfinity Support", url: "https://www.xfinity.com/support/" },
  { label: "Investor Relations", url: "https://www.cmcsa.com/" }
];
const topics = [
  { icon: "⌁", title: "Internet & Wi-Fi", text: "Learn the basics of broadband, home networking, routers, and common connection issues.", category: "internet" },
  { icon: "▣", title: "Mobile", text: "Explore public information about mobile plans, devices, and support options.", category: "mobile" },
  { icon: "▶", title: "TV & Streaming", text: "Find official resources for television, streaming, voice remotes, and entertainment.", category: "tv-streaming" },
  { icon: "$", title: "Billing guidance", text: "Find official billing and payment help without entering payment details here.", category: "billing" },
  { icon: "◉", title: "Accessibility", text: "Locate accessibility resources and official contact paths.", category: "accessibility" },
  { icon: "?", title: "General support", text: "Send a message to this independent guide or continue to official support.", category: "other" }
];
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", category: "internet", message: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingRef, setTrackingRef] = useState("");
  const [trackingResult, setTrackingResult] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [health, setHealth] = useState<any>(null);
  const filtered = useMemo(() => topics.filter(t => `${t.title} ${t.text}`.toLowerCase().includes(search.toLowerCase())), [search]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setNotice("");
    try {
      const response = await fetch("/api/support-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit request.");
      setNotice(`${data.notice} Reference: ${data.request.reference}`);
      setForm({ name: "", email: "", category: "internet", message: "" });
    } catch (err) { setNotice(err instanceof Error ? err.message : "Unable to submit request."); }
    finally { setLoading(false); }
  }
  async function trackRequest(e: React.FormEvent) {
    e.preventDefault(); setTrackingResult("Checking…");
    try {
      const response = await fetch(`/api/support-requests/${encodeURIComponent(trackingRef.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not find request.");
      setTrackingResult(`Status: ${data.request.status}. Created: ${new Date(data.request.createdAt).toLocaleString()}. ${data.notice}`);
    } catch (err) { setTrackingResult(err instanceof Error ? err.message : "Could not find request."); }
  }
  async function checkHealth() {
    try { const r = await fetch("/api/health"); setHealth(await r.json()); }
    catch { setHealth({ status: "unavailable" }); }
  }
  const jump = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
  return <div>
    <div className="topline">Independent information guide <span>Not affiliated with or endorsed by Comcast or Xfinity</span></div>
    <header className="header">
      <a className="brand" href="#home" aria-label="Connect Guide home"><span className="brand-mark">C</span><span>connect<span className="brand-light">guide</span><small>PUBLIC INFORMATION HUB</small></span></a>
      <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? "✕" : "☰"}</button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <button onClick={() => jump("overview")}>Overview</button><button onClick={() => jump("services")}>Services</button><button onClick={() => jump("support")}>Support guide</button><button onClick={() => jump("official")}>Official links</button>
        <button className="nav-cta" onClick={() => jump("support")}>Contact guide ↗</button>
      </nav>
    </header>
    <main id="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"></span> CONNECTIVITY, MADE CLEAR</div>
          <h1>Find your way<br/>through <em>connectivity.</em></h1>
          <p className="hero-lede">A straightforward independent guide to Comcast, Xfinity services, public company information, and the official support resources that can help.</p>
          <div className="hero-actions"><button className="btn primary" onClick={() => jump("services")}>Explore services <span>↗</span></button><button className="btn ghost" onClick={() => jump("official")}>Visit official resources</button></div>
          <div className="trust-row"><span className="trust-icon">✓</span><span>Public information only</span><i></i><span>No account credentials collected</span></div>
        </div>
        <div className="hero-visual" aria-label="Abstract connectivity illustration">
          <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="orb-core"><span>↗</span></div>
          <div className="float-card card-a"><span className="mini-icon blue">⌁</span><span><b>Internet</b><small>Home connectivity</small></span><strong>01</strong></div>
          <div className="float-card card-b"><span className="mini-icon gold">▣</span><span><b>Mobile</b><small>On-the-go access</small></span><strong>02</strong></div>
          <div className="float-card card-c"><span className="mini-icon green">◉</span><span><b>Support</b><small>Find the right help</small></span><strong>03</strong></div>
          <div className="visual-caption">A clearer path to the information you need.</div>
        </div>
      </section>
      <section className="metrics" id="overview">
        <div><b>01</b><span>Understand services</span><small>Plain-language summaries</small></div><div><b>02</b><span>Find official sources</span><small>Direct links, no guesswork</small></div><div><b>03</b><span>Request guide support</span><small>Independent request tracking</small></div><div><b>04</b><span>Know what’s connected</span><small>Honest integration status</small></div>
      </section>
      <section className="section services-section" id="services">
        <div className="section-head"><div><div className="eyebrow">EXPLORE THE GUIDE</div><h2>What are you looking for?</h2><p>Browse a topic or search the guide. For account-specific support, use the official Xfinity channels below.</p></div><label className="searchbox"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..." aria-label="Search topics"/></label></div>
        <div className="topic-grid">{filtered.map(t => <article className="topic-card" key={t.category}><div className="topic-top"><span className="topic-icon">{t.icon}</span><span className="topic-arrow">↗</span></div><h3>{t.title}</h3><p>{t.text}</p><button onClick={() => { setForm({...form, category:t.category}); jump("support"); }}>Get guidance <span>→</span></button></article>)}</div>
        {filtered.length === 0 && <p className="empty">No matching topics. Try “internet”, “billing”, or “mobile”.</p>}
      </section>
      <section className="split-section">
        <div className="split-art"><div className="grid-lines"></div><div className="signal signal-1"></div><div className="signal signal-2"></div><div className="signal signal-3"></div><div className="art-label"><span className="live-dot"></span> INFORMATION, NOT ACCOUNT ACCESS</div><div className="art-big">Clear<br/><em>connections.</em></div><div className="art-foot">Know where this guide ends — and official support begins.</div></div>
        <div className="split-copy"><div className="eyebrow">A NOTE ON ACCOUNT SECURITY</div><h2>Your account deserves<br/>the official route.</h2><p>This independent guide does not sign you in to Comcast or Xfinity, access private billing, or control equipment. We keep the boundary clear so you can reach the right authorized channel.</p>
          <div className="security-list"><div><span>✓</span><div><b>No password collection</b><small>Never enter your Comcast password or verification code here.</small></div></div><div><span>✓</span><div><b>No fake account data</b><small>Billing, outage and service records are not simulated.</small></div></div><div><span>✓</span><div><b>Official support links</b><small>Continue securely to the provider for private account matters.</small></div></div></div>
          <button className="btn primary" onClick={() => jump("official")}>Open official resources ↗</button>
        </div>
      </section>
      <section className="section support-section" id="support">
        <div className="support-intro"><div className="eyebrow">INDEPENDENT GUIDE DESK</div><h2>Need help finding<br/>the right resource?</h2><p>Send a question to this site's guide desk. A reference only tracks your request to this independent project; it does not open an official Comcast support ticket.</p><div className="support-note"><span>i</span><p>Do not include account passwords, verification codes, payment-card details, or other sensitive information.</p></div>
          <div className="track-card"><h3>Already have a guide reference?</h3><form onSubmit={trackRequest}><input value={trackingRef} onChange={e=>setTrackingRef(e.target.value)} placeholder="e.g. CG-ABC123-DEF456" required aria-label="Reference number"/><button className="btn dark" type="submit">Track request →</button></form>{trackingResult && <p className="inline-result" role="status">{trackingResult}</p>}</div>
        </div>
        <form className="support-form" onSubmit={submitRequest}><div className="form-title"><div><span className="form-step">01 / SEND A MESSAGE</span><h3>How can we guide you?</h3></div><span className="form-badge">Guide desk</span></div>
          <div className="field-row"><label>Your name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} minLength={2} maxLength={100} required placeholder="Name"/></label><label>Email address<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} maxLength={254} required placeholder="you@example.com"/></label></div>
          <label>What is this about?<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="internet">Internet & Wi-Fi</option><option value="billing">Billing guidance</option><option value="mobile">Mobile</option><option value="tv-streaming">TV & Streaming</option><option value="accessibility">Accessibility</option><option value="other">Other</option></select></label>
          <label>Your message<textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} minLength={10} maxLength={2000} required rows={5} placeholder="Tell us what information you're trying to find. Please don't include private account details."/></label>
          <button className="btn primary submit-btn" disabled={loading} type="submit">{loading ? "Sending…" : "Submit guide request"} <span>↗</span></button>
          {notice && <p className="form-notice" role="status">{notice}</p>}<small className="privacy-note">Submitting sends your message to this independent project, not to Comcast.</small>
        </form>
      </section>
      <section className="official-section" id="official"><div className="official-head"><div><div className="eyebrow">GO STRAIGHT TO THE SOURCE</div><h2>Official resources</h2></div><p>These links open provider-operated websites in a new tab.</p></div>
        <div className="official-grid">{officialLinks.map((l,i)=><a href={l.url} target="_blank" rel="noopener noreferrer" key={l.label} className="official-link"><span className="official-number">0{i+1}</span><span><b>{l.label}</b><small>{new URL(l.url).hostname}</small></span><span className="external">↗</span></a>)}</div>
      </section>
      <section className="status-section"><div><div className="eyebrow">SYSTEM TRANSPARENCY</div><h2>Integration status</h2><p>This panel reports configuration only; it does not claim customer systems are connected.</p></div><div className="status-panel"><button className="status-check" onClick={checkHealth}>Check backend status ↻</button>{health ? <div className="status-list"><span>Backend: <b>{health.status}</b></span><span>Database configured: <b>{String(health.databaseConfigured)}</b></span><span>Telegram configured: <b>{String(health.telegramConfigured)}</b></span><span>Auth provider configured: <b>{String(health.authProviderConfigured)}</b></span></div> : <p>Press the button to check backend configuration.</p>}</div></section>
    </main>
    <footer><div className="footer-brand"><span className="brand-mark">C</span><span>connect<span className="brand-light">guide</span></span></div><p>An independent public-information demo. Not affiliated with Comcast Corporation or Xfinity.</p><div className="footer-links"><a href="https://corporate.comcast.com/" target="_blank" rel="noreferrer">Comcast Corporate ↗</a><a href="https://www.xfinity.com/support/" target="_blank" rel="noreferrer">Official Xfinity Support ↗</a></div><small>© {new Date().getFullYear()} Connect Guide. Independent project.</small></footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<App />);
