import styles from "./WardCard.module.css";

function toneFor(pct) {
  if (pct >= 90) return "var(--danger)";
  if (pct >= 70) return "var(--esi-3)";
  return "var(--brand)";
}

function WardCard({ ward, beds }) {
  const total = beds.length;
  const occupied = beds.filter((b) => b.is_occupied).length;
  const pct = total ? Math.round((occupied / total) * 100) : 0;

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.name}>{ward.name}</h2>
          <span className={styles.type}>{ward.ward_type}</span>
        </div>
        <div className={styles.count}>
          {total - occupied} free
          <small>{occupied} of {total} occupied</small>
        </div>
      </div>

      <div
        className={styles.bar}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${ward.name} occupancy`}
      >
        <div className={styles.fill} style={{ width: `${pct}%`, "--tone": toneFor(pct) }} />
      </div>

      {total === 0 ? (
        <p className={styles.noBeds}>No beds added to this ward yet.</p>
      ) : (
        <div className={styles.beds}>
          {[...beds]
            .sort((a, b) => a.id - b.id)
            .map((bed) => (
              <div
                key={bed.id}
                className={`${styles.bed} ${bed.is_occupied ? styles.occupied : styles.free}`}
                title={`${bed.bed_number}: ${bed.is_occupied ? "Occupied" : "Free"}`}
              >
                {bed.bed_number}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export default WardCard;
