import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Flow from "./pages/Flow";
import NewPatient from "./pages/NewPatient";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/flow" element={<Flow />} />
          <Route path="/patients/new" element={<NewPatient />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
