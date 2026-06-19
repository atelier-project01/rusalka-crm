import {
  BookOpen,
  Info,
  LayoutDashboard,
  UserRound,
  Truck,
  ScanBarcode,
  Headset,
  Megaphone,
  FlaskConical,
  CircleCheck,
  KeyRound,
  ShoppingCart,
  Database,
  Workflow,
} from "lucide-react";

const MODULES = [
  { icon: <LayoutDashboard size={16} />, name: "Overview Dashboard", desc: "A morning view of what needs attention: orders to pack, new customers, and open issues.", ready: true },
  { icon: <UserRound size={16} />, name: "Customer 360", desc: "One customer in one view: their orders, consultations, notes, and marketing consent.", ready: true },
  { icon: <Truck size={16} />, name: "Fulfillment", desc: "The order queue and pack room. Move an order from reserved to shipped and print its pack sheet.", ready: true },
  { icon: <ScanBarcode size={16} />, name: "Barcode / GTIN", desc: "The product barcode pool, with search and label details.", ready: true },
  { icon: <Headset size={16} />, name: "Customer Care", desc: "Log a customer question, assign it to someone, and mark it resolved.", ready: true },
  { icon: <Megaphone size={16} />, name: "Marketing Campaigns", desc: "Sending offers to groups of customers. Planned as a separate step, not part of this version.", ready: false },
];

export default function KnowledgePage() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Knowledge Base</h1>
          <p>A plain guide to what this hub does, what is ready, and where its information comes from.</p>
        </div>
      </div>

      <div className="kb">
        {/* intro */}
        <div className="card full">
          <div className="card-h"><span className="hicon io-info"><Info size={15} /></span><h2>What this is</h2></div>
          <div className="kbtext">
            This is the staff hub for <b>Atelier Rusalka</b>. It puts orders, customer details, product barcodes, and support notes in one place, so the team does not switch between systems all day. It is for staff only. Customers never see it. Use the menu on the left to move between the tools. You only see the tools your role needs.
          </div>
        </div>

        {/* how it is set up (diagram) */}
        <div className="card full">
          <div className="card-h"><span className="hicon io-accent"><Workflow size={15} /></span><h2>How it is set up</h2></div>
          <div className="kbtext">
            Everything runs as one app. Staff sign in, then reach the tools their role allows. The app does not keep its own copy of the information. It reads from the systems the business already uses. Customers never sign in here.
          </div>
          <div className="kbdiagram">
            <svg viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Setup overview. Staff sign in to one hub. The hub reads from rusalka-ops, rusalka-ecommerce, and recip3.">
              <defs>
                <marker id="kbarrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill="var(--text-faint)" />
                </marker>
              </defs>

              {/* Staff */}
              <rect x="340" y="22" width="220" height="66" rx="10" fill="var(--surface)" stroke="var(--border-2)" />
              <text x="450" y="50" textAnchor="middle" fontFamily="var(--font-body)" fontSize="15" fontWeight="600" fill="var(--text-strong)">Staff member</text>
              <text x="450" y="71" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fill="var(--text-muted)">Signs in with email and password</text>

              {/* Staff -> Hub */}
              <line x1="450" y1="88" x2="450" y2="126" stroke="var(--text-faint)" strokeWidth="1.5" markerEnd="url(#kbarrow)" />
              <text x="462" y="112" fontFamily="var(--font-body)" fontSize="11" fill="var(--text-muted)">signs in</text>

              {/* Hub */}
              <rect x="250" y="128" width="400" height="116" rx="12" fill="var(--accent-weak)" stroke="var(--accent)" strokeWidth="1.5" />
              <text x="450" y="170" textAnchor="middle" fontFamily="var(--font-body)" fontSize="17" fontWeight="700" fill="var(--accent-2)">The Hub</text>
              <text x="450" y="194" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12.5" fill="var(--text-muted)">One login. Staff only.</text>
              <text x="450" y="214" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12.5" fill="var(--text-muted)">All the tools in one place.</text>

              {/* distribution bus */}
              <line x1="450" y1="244" x2="450" y2="280" stroke="var(--text-faint)" strokeWidth="1.5" />
              <text x="462" y="266" fontFamily="var(--font-body)" fontSize="11" fill="var(--text-muted)">reads information from</text>
              <line x1="165" y1="280" x2="735" y2="280" stroke="var(--text-faint)" strokeWidth="1.5" />
              <line x1="165" y1="280" x2="165" y2="312" stroke="var(--text-faint)" strokeWidth="1.5" markerEnd="url(#kbarrow)" />
              <line x1="450" y1="280" x2="450" y2="312" stroke="var(--text-faint)" strokeWidth="1.5" markerEnd="url(#kbarrow)" />
              <line x1="735" y1="280" x2="735" y2="312" stroke="var(--text-faint)" strokeWidth="1.5" markerEnd="url(#kbarrow)" />

              {/* Sources (named the way the team refers to them) */}
              <rect x="35" y="314" width="260" height="150" rx="10" fill="var(--surface)" stroke="var(--border-2)" />
              <text x="165" y="340" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10.5" fontWeight="600" fill="var(--accent-2)">rusalka-ops</text>
              <text x="165" y="364" textAnchor="middle" fontFamily="var(--font-body)" fontSize="14" fontWeight="600" fill="var(--text-strong)">Staff accounts</text>
              <text x="165" y="387" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">Who can sign in, and</text>
              <text x="165" y="404" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">what each role can open.</text>
              <text x="165" y="436" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight="600" fill="var(--accent-2)">Sign in and roles</text>

              <rect x="320" y="314" width="260" height="150" rx="10" fill="var(--surface)" stroke="var(--border-2)" />
              <text x="450" y="340" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10.5" fontWeight="600" fill="var(--accent-2)">rusalka-ecommerce</text>
              <text x="450" y="364" textAnchor="middle" fontFamily="var(--font-body)" fontSize="14" fontWeight="600" fill="var(--text-strong)">Ecommerce</text>
              <text x="450" y="387" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">Customers, orders,</text>
              <text x="450" y="404" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">consultations, notes, care.</text>
              <text x="450" y="436" textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fontWeight="600" fill="var(--accent-2)">Customer 360 · Care · Fulfillment · Dashboard</text>

              <rect x="605" y="314" width="260" height="150" rx="10" fill="var(--surface)" stroke="var(--border-2)" />
              <text x="735" y="340" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10.5" fontWeight="600" fill="var(--accent-2)">recip3</text>
              <text x="735" y="364" textAnchor="middle" fontFamily="var(--font-body)" fontSize="14" fontWeight="600" fill="var(--text-strong)">Operations</text>
              <text x="735" y="387" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">The product barcode</text>
              <text x="735" y="404" textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fill="var(--text-muted)">(GTIN) pool.</text>
              <text x="735" y="436" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10.5" fontWeight="600" fill="var(--accent-2)">Barcode / GTIN</text>
            </svg>
          </div>
        </div>

        {/* modules */}
        <div className="card full">
          <div className="card-h"><span className="hicon io-accent"><LayoutDashboard size={15} /></span><h2>What the hub includes</h2></div>
          <div className="card-b flush">
            <div className="attlist">
              {MODULES.map((m) => (
                <div className="att" key={m.name}>
                  <span className="ic io-accent">{m.icon}</span>
                  <div className="ab"><div className="at">{m.name}</div><div className="am">{m.desc}</div></div>
                  <span className="aw">
                    {m.ready
                      ? <span className="chip ok"><span className="cdot" />Ready</span>
                      : <span className="chip neutral">Planned</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* real vs sample */}
        <div className="card">
          <div className="card-h"><span className="hicon io-warn"><FlaskConical size={15} /></span><h2>What is real, what is a sample</h2></div>
          <div className="card-b flush">
            <div className="kbsub">Real now</div>
            <div className="attlist">
              <div className="att">
                <span className="ic io-ok"><CircleCheck size={16} /></span>
                <div className="ab"><div className="at">Staff sign in</div><div className="am">The login is live and working.</div></div>
                <span className="aw"><span className="chip ok"><span className="cdot" />Live</span></span>
              </div>
              <div className="att">
                <span className="ic io-ok"><CircleCheck size={16} /></span>
                <div className="ab"><div className="at">Product barcodes</div><div className="am">These are the real barcodes from the operations system.</div></div>
                <span className="aw"><span className="chip ok"><span className="cdot" />Live</span></span>
              </div>
            </div>
            <div className="kbsub">Sample, for testing</div>
            <div className="attlist">
              <div className="att">
                <span className="ic io-warn"><FlaskConical size={16} /></span>
                <div className="ab"><div className="at">Customers and their history</div><div className="am">The customer records on screen, with their orders, notes, and consultations, are sample entries added to test the layout. Real customers appear here once the live Ecommerce data is connected.</div></div>
                <span className="aw"><span className="chip warn"><span className="cdot" />Sample</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* sources */}
        <div className="card">
          <div className="card-h"><span className="hicon io-violet"><Database size={15} /></span><h2>Where the information comes from</h2></div>
          <div className="card-b flush">
            <div className="attlist">
              <div className="att">
                <span className="ic io-accent"><KeyRound size={16} /></span>
                <div className="ab"><div className="at">Staff accounts</div><div className="am">A private internal list of staff logins. It checks the email and password and sets what each person can open. Customers are not in it. Powers sign-in and roles.</div></div>
              </div>
              <div className="att">
                <span className="ic io-accent"><ShoppingCart size={16} /></span>
                <div className="ab"><div className="at">Ecommerce</div><div className="am">The store's own records: customers, orders, and consultation results, plus the notes, consent, and care items the team adds. Powers Customer 360, Customer Care, Fulfillment, and the Dashboard.</div></div>
              </div>
              <div className="att">
                <span className="ic io-accent"><Database size={16} /></span>
                <div className="ab"><div className="at">Operations</div><div className="am">The operations system that holds the product barcode (GTIN) pool. Powers Barcode / GTIN.</div></div>
              </div>
            </div>
            <div className="kbtext muted" style={{ borderTop: "1px solid var(--border)" }}>
              The hub does not keep its own separate copy. It reads from the systems the business already uses, so the information stays in one place.
            </div>
          </div>
        </div>

        {/* signing in + roles */}
        <div className="card full">
          <div className="card-h"><span className="hicon io-ok"><KeyRound size={15} /></span><h2>Signing in, and who sees what</h2></div>
          <div className="kbtext">
            Staff sign in with an email and password. Customers cannot sign in here. Each person has a <b>role</b>, and the role decides which screens they see.
          </div>
          <div className="kbsub">Roles</div>
          <div className="kbrole"><span className="rn">Admin</span><span className="rd">Everything.</span></div>
          <div className="kbrole"><span className="rn">Operations</span><span className="rd">Orders, fulfillment, and customers.</span></div>
          <div className="kbrole"><span className="rn">Barcode</span><span className="rd">The barcode tools.</span></div>
          <div className="kbrole"><span className="rn">Care</span><span className="rd">Customers and support.</span></div>
          <div className="kbrole"><span className="rn">View only</span><span className="rd">Can look, but cannot make changes.</span></div>
          <div className="kbtext muted" style={{ borderTop: "1px solid var(--border)" }}>
            Sensitive actions are recorded with who did them and when.
          </div>
        </div>
      </div>
    </>
  );
}
