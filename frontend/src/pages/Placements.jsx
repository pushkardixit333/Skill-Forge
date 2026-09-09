import React, { useEffect, useState } from "react";
import Pill from "../components/Pill";
import {
  fetchPlacements,
  fetchTrainees,
  fetchEmployers,
  createPlacement,
} from "../api/api";

const emptyForm = {
  traineeId: "",
  outcomeType: "wage_employment",
  employerId: "",
  role: "",
  placementDate: "",
  initialWage: "",
  isApprenticeship: false,
  apprenticeshipStipend: "",
  businessType: "",
  udyamRegistered: false,
  monthlyIncomeBand: "10k_20k",
  nonPlacementReason: "skill_mismatch",
  source: "campus_placement",
};

export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    fetchPlacements({ outcomeType: outcomeFilter || undefined })
      .then(setPlacements)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    fetchTrainees({ completionStatus: "completed" }).then(setTrainees).catch(() => {});
    fetchEmployers().then(setEmployers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(load, [outcomeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { traineeId: form.traineeId, outcomeType: form.outcomeType, source: form.source };

      if (form.outcomeType === "wage_employment") {
        Object.assign(payload, {
          employerId: form.employerId,
          role: form.role,
          placementDate: form.placementDate,
          initialWage: Number(form.initialWage),
        });
      } else if (form.outcomeType === "apprenticeship") {
        Object.assign(payload, {
          employerId: form.employerId,
          role: form.role,
          placementDate: form.placementDate,
          isApprenticeship: true,
          apprenticeshipStipend: Number(form.apprenticeshipStipend),
        });
      } else if (form.outcomeType === "self_employment") {
        Object.assign(payload, {
          placementDate: form.placementDate,
          businessType: form.businessType,
          udyamRegistered: form.udyamRegistered,
          monthlyIncomeBand: form.monthlyIncomeBand,
        });
      } else if (form.outcomeType === "not_placed") {
        Object.assign(payload, { nonPlacementReason: form.nonPlacementReason });
      }

      await createPlacement(payload);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Placements &amp; outcomes</h1>
        <div className="eyebrow-line">Wage employment, apprenticeships, self-employment and documented non-placements</div>
      </div>

      <div className="toolbar">
        <div className="filter-row">
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}>
            <option value="">All outcome types</option>
            <option value="wage_employment">Wage employment</option>
            <option value="apprenticeship">Apprenticeship</option>
            <option value="self_employment">Self-employment</option>
            <option value="not_placed">Not placed</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Record outcome</button>
      </div>

      {error && <div className="empty-state card">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trainee</th>
              <th>Outcome</th>
              <th>Employer / detail</th>
              <th>Date</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            {placements.length === 0 && (
              <tr><td colSpan={5} className="empty-state">No outcome records yet.</td></tr>
            )}
            {placements.map((p) => (
              <tr key={p._id}>
                <td>{p.traineeId?.name} <span style={{ color: "var(--color-ink-soft)" }}>({p.traineeId?.traineeCode})</span></td>
                <td style={{ textTransform: "capitalize" }}>{p.outcomeType.replaceAll("_", " ")}</td>
                <td>
                  {p.outcomeType === "not_placed"
                    ? p.nonPlacementReason?.replaceAll("_", " ")
                    : p.employerId?.name || p.businessType || "—"}
                </td>
                <td>{p.placementDate ? new Date(p.placementDate).toLocaleDateString("en-IN") : "—"}</td>
                <td><Pill value={p.verificationStatus} label={p.verificationStatus?.replaceAll("_", " ")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Record placement outcome</h2>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label>Trainee (completed training only)</label>
                <select required value={form.traineeId} onChange={(e) => setForm({ ...form, traineeId: e.target.value })}>
                  <option value="">Select trainee</option>
                  {trainees.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.traineeCode})</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Outcome type</label>
                <select value={form.outcomeType} onChange={(e) => setForm({ ...form, outcomeType: e.target.value })}>
                  <option value="wage_employment">Wage employment</option>
                  <option value="apprenticeship">Apprenticeship</option>
                  <option value="self_employment">Self-employment</option>
                  <option value="not_placed">Not placed</option>
                </select>
              </div>

              {(form.outcomeType === "wage_employment" || form.outcomeType === "apprenticeship") && (
                <>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Employer</label>
                      <select required value={form.employerId} onChange={(e) => setForm({ ...form, employerId: e.target.value })}>
                        <option value="">Select employer</option>
                        {employers.map((e) => (
                          <option key={e._id} value={e._id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Role</label>
                      <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Placement date</label>
                      <input required type="date" value={form.placementDate} onChange={(e) => setForm({ ...form, placementDate: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label>{form.outcomeType === "wage_employment" ? "Initial wage (₹/month)" : "Stipend (₹/month)"}</label>
                      <input
                        required
                        type="number"
                        value={form.outcomeType === "wage_employment" ? form.initialWage : form.apprenticeshipStipend}
                        onChange={(e) =>
                          form.outcomeType === "wage_employment"
                            ? setForm({ ...form, initialWage: e.target.value })
                            : setForm({ ...form, apprenticeshipStipend: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {form.outcomeType === "self_employment" && (
                <>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Business type</label>
                      <input required value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label>Start date</label>
                      <input required type="date" value={form.placementDate} onChange={(e) => setForm({ ...form, placementDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Monthly income band</label>
                      <select value={form.monthlyIncomeBand} onChange={(e) => setForm({ ...form, monthlyIncomeBand: e.target.value })}>
                        <option value="below_5k">Below ₹5,000</option>
                        <option value="5k_10k">₹5,000 – ₹10,000</option>
                        <option value="10k_20k">₹10,000 – ₹20,000</option>
                        <option value="20k_40k">₹20,000 – ₹40,000</option>
                        <option value="above_40k">Above ₹40,000</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={form.udyamRegistered} onChange={(e) => setForm({ ...form, udyamRegistered: e.target.checked })} />
                        Udyam registered
                      </label>
                    </div>
                  </div>
                </>
              )}

              {form.outcomeType === "not_placed" && (
                <div className="field-group">
                  <label>Reason for non-placement</label>
                  <select value={form.nonPlacementReason} onChange={(e) => setForm({ ...form, nonPlacementReason: e.target.value })}>
                    <option value="skill_mismatch">Skill mismatch</option>
                    <option value="low_wage_expectations">Low wage expectations</option>
                    <option value="location_constraint">Location constraint</option>
                    <option value="personal_family_reason">Personal/family reason</option>
                    <option value="further_studies">Pursuing further studies</option>
                    <option value="health_reason">Health reason</option>
                    <option value="no_local_demand">No local demand</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save outcome"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
