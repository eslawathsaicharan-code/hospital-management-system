import styles from "./OverflowPanel.module.css";

function OverflowPanel({ patient, hospitals, onClose }) {
  return (
    <div className={styles.panel} role="alert">
      <div className={styles.head}>
        <div>
          <strong>No free {patient.required_ward_type} bed here</strong>
          <p>
            {hospitals.length > 0
              ? `Nearest partner hospitals that can take ${patient.name}:`
              : `No partner hospital has a free ${patient.required_ward_type} bed right now.`}
          </p>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      </div>

      {hospitals.length > 0 && (
        <ul className={styles.list}>
          {hospitals.map((h, i) => (
            <li key={`${h.name}-${i}`} className={styles.item}>
              <span className={styles.rank}>{i + 1}</span>
              <span className={styles.name}>{h.name}</span>
              <span className={styles.stat}>{h.distance_km} km</span>
              <span className={styles.stat}>{h.available_beds} beds free</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OverflowPanel;
