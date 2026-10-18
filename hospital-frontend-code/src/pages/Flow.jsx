import { useCallback, useEffect, useState } from "react";
import {
  getQueue,
  getActiveAllocations,
  allocatePatient,
  dischargeAllocation,
  getOverflow,
  getErrorMessage,
} from "../services/api";
import { HOSPITAL_LOCATION } from "../config";
import EsiBadge from "../components/EsiBadge";
import OverflowPanel from "../components/OverflowPanel";
import Skeleton from "../components/Skeleton";
import { timeAgo, hoursRemaining, formatRemaining } from "../utils/time";
import styles from "./Flow.module.css";

function Estimate({ allocation }) {
  if (allocation.expected_stay_hours == null) {
    return <span className={styles.estMuted}>No stay history for this diagnosis yet</span>;
  }
  const left = hoursRemaining(allocation.allocated_at, allocation.expected_stay_hours);
  const n = allocation.sample_size;
  return (
    <span className={left <= 0 ? styles.estLate : styles.est}>
      Est. discharge {formatRemaining(left)} · avg {allocation.expected_stay_hours} h from {n} past case
      {n === 1 ? "" : "s"}
    </span>
  );
}

function Flow() {
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [overflow, setOverflow] = useState(null);

  const load = useCallback(async () => {
    try {
      const [q, a] = await Promise.all([getQueue(), getActiveAllocations()]);
      setQueue(q);
      setActive(a);
      setLoadError(null);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  // One helper for every action. `onError` lets a caller handle a failure itself.
  async function run(key, action, successMessage, onError) {
    setBusy(key);
    setActionError(null);
    setNotice(null);
    setOverflow(null);
    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (err) {
      const handled = onError ? await onError(err) : false;
      if (!handled) setActionError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  // Ward is full -> instead of a plain error, look for partner hospitals
  async function suggestOverflow(patient, err) {
    const wardFull =
      err.response?.status === 404 && /no available bed/i.test(err.response?.data?.detail ?? "");
    if (!wardFull) return false;

    try {
      const hospitals = await getOverflow(
        patient.required_ward_type,
        HOSPITAL_LOCATION.lat,
        HOSPITAL_LOCATION.lon
      );
      setOverflow({ patient, hospitals });
    } catch (e) {
      if (e.response?.status === 404) setOverflow({ patient, hospitals: [] });
      else setActionError(getErrorMessage(e));
    }
    return true;
  }

  const handleAllocate = (p) =>
    run(`a${p.id}`, () => allocatePatient(p.id), `${p.name} was given a bed.`, (err) =>
      suggestOverflow(p, err)
    );

  const handleDischarge = (a) => {
    if (!window.confirm(`Discharge ${a.patient_name} from ${a.bed_number}?`)) return;
    run(
      `d${a.allocation_id}`,
      () => dischargeAllocation(a.allocation_id),
      `${a.patient_name} discharged. ${a.bed_number} is free again.`
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div>
          <h1>Patient flow</h1>
          <p>Most urgent patients first. Allocate beds and discharge from here.</p>
        </div>
        <button
          className={styles.primary}
          disabled={queue.length === 0 || busy !== null}
          onClick={() => handleAllocate(queue[0])}
        >
          Allocate next patient
        </button>
      </header>

      {loadError && <div className={styles.error}>{loadError}</div>}
      {actionError && <div className={styles.error}>{actionError}</div>}
      {notice && <div className={styles.notice}>{notice}</div>}
      {overflow && (
        <OverflowPanel
          patient={overflow.patient}
          hospitals={overflow.hospitals}
          onClose={() => setOverflow(null)}
        />
      )}

      {loading ? (
        <div className={styles.grid}>
          <Skeleton height={320} />
          <Skeleton height={320} />
        </div>
      ) : (
        <div className={styles.grid}>
          {/* ---------- Waiting queue ---------- */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Waiting queue</h2>
              <span className={styles.count}>{queue.length}</span>
            </div>
            {queue.length === 0 ? (
              <p className={styles.empty}>No patients waiting.</p>
            ) : (
              <ul className={styles.list}>
                {queue.map((p, index) => (
                  <li
                    key={p.id}
                    className={styles.item}
                    style={{ "--esi": `var(--esi-${p.esi_level})` }}
                  >
                    <div className={styles.main}>
                      <div className={styles.name}>
                        {index === 0 && <span className={styles.next}>NEXT </span>}
                        {p.name} <EsiBadge level={p.esi_level} />
                      </div>
                      <div className={styles.meta}>
                        {p.age} yrs · {p.diagnosis} · needs {p.required_ward_type} · waiting{" "}
                        {timeAgo(p.arrival_time)}
                      </div>
                    </div>
                    <button
                      className={styles.action}
                      disabled={busy !== null}
                      onClick={() => handleAllocate(p)}
                    >
                      {busy === `a${p.id}` ? "Allocating..." : "Allocate bed"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- Currently in beds ---------- */}
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>In beds</h2>
              <span className={styles.count}>{active.length}</span>
            </div>
            {active.length === 0 ? (
              <p className={styles.empty}>No patients are currently in beds.</p>
            ) : (
              <ul className={styles.list}>
                {active.map((a) => (
                  <li
                    key={a.allocation_id}
                    className={styles.item}
                    style={{ "--esi": `var(--esi-${a.esi_level})` }}
                  >
                    <div className={styles.main}>
                      <div className={styles.name}>
                        {a.patient_name} <EsiBadge level={a.esi_level} />
                      </div>
                      <div className={styles.meta}>
                        {a.ward_name} · {a.bed_number} · {a.diagnosis} · in bed {timeAgo(a.allocated_at)}
                      </div>
                      <Estimate allocation={a} />
                    </div>
                    <button
                      className={`${styles.action} ${styles.danger}`}
                      disabled={busy !== null}
                      onClick={() => handleDischarge(a)}
                    >
                      {busy === `d${a.allocation_id}` ? "Discharging..." : "Discharge"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Flow;
