import { useCallback, useEffect, useState } from "react";
import { getWards, getBeds, getActiveAllocations, getErrorMessage } from "../services/api";
import WardCard from "../components/WardCard";
import Skeleton from "../components/Skeleton";
import { hoursRemaining, formatRemaining } from "../utils/time";
import styles from "./Dashboard.module.css";

function StatTile({ label, value, accent }) {
  return (
    <div className={styles.stat} style={{ "--accent": accent }}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function Dashboard() {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [w, b, a] = await Promise.all([getWards(), getBeds(), getActiveAllocations()]);
      setWards(w);
      setBeds(b);
      setActive(a);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // refresh every 15 seconds
    return () => clearInterval(id);      // stop when leaving the page
  }, [load]);

  const total = beds.length;
  const occupied = beds.filter((b) => b.is_occupied).length;
  const free = total - occupied;
  const pct = total ? Math.round((occupied / total) * 100) : 0;

  // Beds expected to free up soonest (only where we have stay history)
  const upcoming = active
    .filter((a) => a.expected_stay_hours != null)
    .map((a) => ({ ...a, left: hoursRemaining(a.allocated_at, a.expected_stay_hours) }))
    .sort((x, y) => x.left - y.left)
    .slice(0, 5);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div>
          <h1>Bed availability</h1>
          <p>Live view of every ward. Refreshes automatically.</p>
        </div>
        <div className={styles.refresh}>
          {updatedAt && <span>Updated {updatedAt.toLocaleTimeString()}</span>}
          <button className={styles.refreshBtn} onClick={load}>Refresh</button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <>
          <div className={styles.stats}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={84} />)}
          </div>
          <div className={styles.wards}>
            {[0, 1, 2].map((i) => <Skeleton key={i} height={200} />)}
          </div>
        </>
      ) : (
        <>
          <div className={styles.stats}>
            <StatTile label="Total beds" value={total} accent="var(--ink)" />
            <StatTile label="Occupied" value={occupied} accent="var(--esi-2)" />
            <StatTile label="Available" value={free} accent="var(--brand)" />
            <StatTile label="Occupancy" value={`${pct}%`} accent="var(--esi-5)" />
          </div>

          <section className={styles.soon}>
            <h2>Beds freeing up soon</h2>
            {upcoming.length === 0 ? (
              <p className={styles.soonEmpty}>
                Not enough history yet. Estimates appear once patients with the same diagnosis have
                been discharged before.
              </p>
            ) : (
              <ul className={styles.soonList}>
                {upcoming.map((a) => (
                  <li key={a.allocation_id}>
                    <span className={styles.soonBed}>{a.ward_name} · {a.bed_number}</span>
                    <span className={styles.soonDx}>{a.diagnosis}</span>
                    <span className={styles.soonTime}>{formatRemaining(a.left)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className={styles.legend}>
            <span><i className={`${styles.swatch} ${styles.swFree}`} /> Free</span>
            <span><i className={`${styles.swatch} ${styles.swOcc}`} /> Occupied</span>
          </div>

          {wards.length === 0 ? (
            <div className={styles.empty}>
              <h2>No wards yet</h2>
              <p>Create a ward with POST /wards in the API docs, or run seed_demo.py.</p>
            </div>
          ) : (
            <div className={styles.wards}>
              {wards.map((ward) => (
                <WardCard
                  key={ward.id}
                  ward={ward}
                  beds={beds.filter((b) => b.ward_id === ward.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
