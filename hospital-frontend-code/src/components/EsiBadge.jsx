import styles from "./EsiBadge.module.css";

function EsiBadge({ level }) {
  return (
    <span className={styles.badge} style={{ "--esi": `var(--esi-${level})` }}>
      ESI {level}
    </span>
  );
}

export default EsiBadge;
