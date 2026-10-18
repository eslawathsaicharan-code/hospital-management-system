import { useEffect, useState } from "react";
import { getWards, createPatient, getErrorMessage } from "../services/api";
import styles from "./NewPatient.module.css";

const ESI_LEVELS = [
  { level: 1, title: "Resuscitation", text: "Needs immediate life-saving action" },
  { level: 2, title: "Emergent", text: "High risk, should not wait" },
  { level: 3, title: "Urgent", text: "Needs several resources" },
  { level: 4, title: "Less urgent", text: "Needs one resource" },
  { level: 5, title: "Non-urgent", text: "Needs no resources" },
];

const EMPTY_FORM = { name: "", age: "", diagnosis: "", esi_level: "", required_ward_type: "" };

function NewPatient() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [wardTypes, setWardTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  // Load ward types once, to fill the dropdown
  useEffect(() => {
    getWards()
      .then((wards) => setWardTypes([...new Set(wards.map((w) => w.ward_type))]))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.esi_level) return setError("Please choose a triage level (ESI 1-5).");

    setSubmitting(true);
    setError(null);
    try {
      const patient = await createPatient({
        ...form,
        age: Number(form.age),
        esi_level: Number(form.esi_level),
      });
      setCreated(patient);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Register patient</h1>
        <p>Enter triage details. The patient joins the waiting queue until a bed is allocated.</p>
      </header>

      {created && (
        <div className={styles.success}>
          <span>
            <strong>{created.name}</strong> registered (patient #{created.id}, ESI {created.esi_level}).
          </span>
          <button type="button" onClick={() => setCreated(null)}>Register another</button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Full name</span>
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className={`${styles.field} ${styles.narrow}`}>
            <span>Age</span>
            <input
              name="age"
              type="number"
              min="1"
              max="149"
              value={form.age}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Diagnosis</span>
          <input
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            placeholder="e.g. Fracture"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Ward needed</span>
          <select
            name="required_ward_type"
            value={form.required_ward_type}
            onChange={handleChange}
            required
          >
            <option value="">Select ward type</option>
            {wardTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {wardTypes.length === 0 && (
            <small>No wards found. Create one in the API docs first (POST /wards).</small>
          )}
        </label>

        <fieldset className={styles.esi}>
          <legend>Triage level (ESI)</legend>
          <div className={styles.esiGrid}>
            {ESI_LEVELS.map((o) => (
              <label
                key={o.level}
                className={styles.esiOption}
                style={{ "--esi": `var(--esi-${o.level})` }}
              >
                <input
                  type="radio"
                  name="esi_level"
                  value={o.level}
                  checked={Number(form.esi_level) === o.level}
                  onChange={handleChange}
                />
                <span className={styles.esiBody}>
                  <b>{o.level}</b>
                  <span>{o.title}</span>
                  <small>{o.text}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting ? "Registering..." : "Register patient"}
        </button>
      </form>
    </div>
  );
}

export default NewPatient;
