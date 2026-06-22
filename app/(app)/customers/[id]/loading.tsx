/**
 * Instant skeleton for a customer profile. Shown the moment a customer row is
 * clicked, while the profile's data is fetched. Pairs with the row's hover
 * prefetch so opening a record feels responsive even though the profile data
 * isn't preloaded with the list.
 */
export default function Loading() {
  return (
    <>
      <div className="pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="sk" style={{ width: 44, height: 44, borderRadius: "50%" }} />
          <div>
            <div className="sk sk-title" style={{ width: 180 }} />
            <div className="sk sk-text" style={{ marginTop: 8, width: 220 }} />
          </div>
        </div>
      </div>

      <div className="sk-cards">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="card" key={i}>
            <div className="card-b">
              <div className="sk sk-line" style={{ width: "55%" }} />
              <div className="sk sk-line" style={{ width: "70%", height: 22, margin: "12px 0" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-h"><div className="sk sk-line" style={{ width: 150 }} /></div>
        <div className="card-b">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="sk sk-line" key={i} style={{ width: `${92 - i * 8}%`, margin: "11px 0" }} />
          ))}
        </div>
      </div>
    </>
  );
}
