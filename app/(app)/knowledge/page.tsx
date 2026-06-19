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
                <div className="ab"><div className="at">Customers and their history</div><div className="am">The customer records on screen, with their orders, notes, and consultations, are sample entries added to test the layout. Real shop customers appear here once the live shop is connected.</div></div>
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
                <div className="ab"><div className="at">Staff accounts</div><div className="am">A private internal list of staff logins. It checks the email and password and sets what each person can open. Customers are not in it.</div></div>
              </div>
              <div className="att">
                <span className="ic io-accent"><ShoppingCart size={16} /></span>
                <div className="ab"><div className="at">Customer information</div><div className="am">The online shop's records. Orders, profiles, and consultation results are read from there.</div></div>
              </div>
              <div className="att">
                <span className="ic io-accent"><Database size={16} /></span>
                <div className="ab"><div className="at">Product barcodes</div><div className="am">The operations system that already holds the barcode pool.</div></div>
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
