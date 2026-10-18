import styles from "./Skeleton.module.css";

function Skeleton({ height = 120 }) {
  return <div className={styles.skeleton} style={{ height }} aria-hidden="true" />;
}

export default Skeleton;
