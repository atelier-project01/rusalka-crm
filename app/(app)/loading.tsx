/**
 * Instant navigation skeleton. Rendered the moment a module link is clicked,
 * while the destination server component runs its database queries. The
 * persistent app shell (sidebar, top bar) stays in place — only this content
 * area swaps — so navigation feels immediate instead of frozen.
 *
 * This is the shared fallback for every module route; a route can add its own
 * loading.tsx to show a more tailored skeleton.
 */
export default function Loading() {
  return (
    <>
      <div className="pagehead">
        <div>
          <div className="sk sk-title" />
          <div className="sk sk-text" style={{ marginTop: 8 }} />
        </div>
      </div>

      <div className="sk-cards">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="card" key={i}>
            <div className="card-b">
              <div className="sk sk-line" style={{ width: "45%" }} />
              <div className="sk sk-line" style={{ width: "65%", height: 22, margin: "12px 0" }} />
              <div className="sk sk-line" style={{ width: "55%" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-h">
          <div className="sk sk-line" style={{ width: 160 }} />
        </div>
        <div className="card-b">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="sk sk-line" key={i} style={{ width: `${92 - i * 7}%`, margin: "11px 0" }} />
          ))}
        </div>
      </div>
    </>
  );
}
