import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/flow", label: "Patient flow" },
  { to: "/patients/new", label: "New patient" },
];

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>+</span>
        <span>Bed Allocator</span>
      </div>
      <nav className={styles.nav}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
