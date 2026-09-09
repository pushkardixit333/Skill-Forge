import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pill from "../components/Pill";
import { fetchTrainees, fetchCourses, fetchProviders, createTrainee } from "../api/api";

const emptyForm = {
  name: "",
  phone: "",
  gender: "male",
  category: "general",
  dob: "",
  courseId: "",
  providerId: "",
  enrollmentDate: "",
  state: "",
  district: "",
  areaType: "rural",
  consentScope: ["followup_contact"],
};

export default function Trainees() {
  const [trainees, setTrainees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const load = () => {
    fetchTrainees({ search: search || undefined, completionStatus: statusFilter || undefined })
      .then(setTrainees)
      .catch((e) => setLoadError(e.message));
  };

  useEffect(() => {
    load();
    fetchCourses().then(setCourses).catch(() => {});
    fetchProviders().then(setProviders).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const toggleScope = (scope) => {
    setForm((f) => ({
      ...f,
      consentScope: f.consentScope.includes(scope)
        ? f.consentScope.filter((s) => s !== scope)
        : [...f.consentScope, scope],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTrainee({
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        category: form.category,
        dob: form.dob || undefined,
        courseId: form.courseId,
        providerId: form.providerId,
        enrollmentDate: form.enrollmentDate,
        address: { state: form.state, district: form.district, areaType: form.areaType },
        consentScope: form.consentScope,
        consentChannel: "portal",
      });
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
        <h1>Trainee registry</h1>
        <div className="eyebrow-line">Consent-based enrollment records linked to course, batch and provider</div>
      </div>

      <div className="toolbar">
        <div className="filter-row">
          <input
            placeholder="Search name, code or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="dropped_out">Dropped out</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Enroll trainee
        </button>
      </div>

      {loadError && <div className="empty-state card">{loadError}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Course</th>
              <th>District</th>
              <th>Status</th>
              <th>Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {trainees.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">No trainees found. Try adjusting filters or enroll a new trainee.</td>
              </tr>
            )}
            {trainees.map((t) => (
              <tr key={t._id}>
                <td><Link to={`/trainees/${t._id}`}>{t.traineeCode}</Link></td>
                <td>{t.name}</td>
                <td>{t.courseId?.name || "—"}</td>
                <td>{t.address?.district}</td>
                <td><Pill value={t.completionStatus} label={t.completionStatus.replaceAll("_", " ")} /></td>
                <td>{new Date(t.enrollmentDate).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Enroll trainee</h2>
            <p className="eyebrow-line" style={{ marginBottom: 16 }}>
              Recorded consent is required before any follow-up contact or data sharing occurs.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <div className="field-group">
                  <label>Full name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field-group">
                  <label>Phone</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="transgender">Transgender</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Social category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                    <option value="ews">EWS</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Course</label>
                  <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Provider / training center</label>
                  <select required value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}>
                    <option value="">Select provider</option>
                    {providers.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.district})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Enrollment date</label>
                  <input required type="date" value={form.enrollmentDate} onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })} />
                </div>
                <div className="field-group">
                  <label>Area type</label>
                  <select value={form.areaType} onChange={(e) => setForm({ ...form, areaType: e.target.value })}>
                    <option value="rural">Rural</option>
                    <option value="urban">Urban</option>
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>State</label>
                  <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="field-group">
                  <label>District</label>
                  <input required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
              </div>

              <div className="consent-note">
                <strong>Consent to record.</strong> Select what this trainee agrees to share. This is logged with a timestamp and can be revoked later from their profile.
              </div>
              <div className="field-group" style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                {[
                  { key: "followup_contact", label: "Follow-up contact" },
                  { key: "share_with_government", label: "Share with government" },
                  { key: "share_with_employer", label: "Share with employer" },
                  { key: "wage_verification", label: "Wage verification" },
                  { key: "share_with_researcher", label: "Share with researchers" },
                ].map((opt) => (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: "0.86rem" }}>
                    <input
                      type="checkbox"
                      checked={form.consentScope.includes(opt.key)}
                      onChange={() => toggleScope(opt.key)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || form.consentScope.length === 0}>
                  {submitting ? "Saving..." : "Enroll trainee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
