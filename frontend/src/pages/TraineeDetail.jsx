import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Pill from "../components/Pill";
import { fetchTrainee, fetchPlacements, updateConsent } from "../api/api";

const SCOPE_LABELS = {
  followup_contact: "Follow-up contact",
  share_with_government: "Share with government",
  share_with_employer: "Share with employer",
  wage_verification: "Wage verification",
  share_with_researcher: "Share with researchers",
};

export default function TraineeDetail() {
  const { id } = useParams();
  const [trainee, setTrainee] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [error, setError] = useState(null);

  const load = () => {
    fetchTrainee(id).then(setTrainee).catch((e) => setError(e.message));
    fetchPlacements({ traineeId: id }).then(setPlacements).catch(() => {});
  };

  useEffect(load, [id]);

  const handleRevoke = async (scope) => {
    if (!window.confirm(`Revoke consent for "${SCOPE_LABELS[scope]}"?`)) return;
    await updateConsent(id, { action: "revoked", scope: [scope] });
    load();
  };

  if (error) return <div className="empty-state card">{error}</div>;
  if (!trainee) return <div className="empty-state card">Loading...</div>;

  const activeScopes = Object.keys(SCOPE_LABELS).filter((s) =>
    (() => {
      const relevant = trainee.consentLedger.filter((c) => c.scope.includes(s));
      if (relevant.length === 0) return false;
      const latest = relevant.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0];
      return latest.action === "granted";
    })()
  );

  return (
    <div>
      <div className="page-header">
        <Link to="/trainees" style={{ fontSize: "0.85rem" }}>&larr; Back to registry</Link>
        <h1 style={{ marginTop: 10 }}>{trainee.name}</h1>
        <div className="eyebrow-line">{trainee.traineeCode} · {trainee.courseId?.name} · {trainee.providerId?.name}</div>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        <div className="card">
          <div className="section-title">Profile</div>
          <table>
            <tbody>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Phone</td><td>{trainee.phone}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Gender</td><td style={{ textTransform: "capitalize" }}>{trainee.gender}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Category</td><td style={{ textTransform: "uppercase" }}>{trainee.category}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>District</td><td>{trainee.address?.district}, {trainee.address?.state}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Area type</td><td style={{ textTransform: "capitalize" }}>{trainee.address?.areaType}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Enrollment date</td><td>{new Date(trainee.enrollmentDate).toLocaleDateString("en-IN")}</td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Status</td><td><Pill value={trainee.completionStatus} label={trainee.completionStatus.replaceAll("_", " ")} /></td></tr>
              <tr><td style={{ color: "var(--color-ink-soft)" }}>Aadhaar-linked</td><td>{trainee.aadhaarLinked ? "Yes" : "No"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">Active consent</div>
          {activeScopes.length === 0 && <div className="eyebrow-line">No active consent scopes.</div>}
          {activeScopes.map((s) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.88rem" }}>{SCOPE_LABELS[s]}</span>
              <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.76rem" }} onClick={() => handleRevoke(s)}>
                Revoke
              </button>
            </div>
          ))}

          <div className="section-title" style={{ marginTop: 20 }}>Consent ledger</div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {[...trainee.consentLedger].reverse().map((c, i) => (
              <div key={i} style={{ fontSize: "0.8rem", padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                <strong style={{ textTransform: "capitalize" }}>{c.action}</strong> — {c.scope.map((s) => SCOPE_LABELS[s] || s).join(", ")}
                <div style={{ color: "var(--color-ink-soft)" }}>{new Date(c.recordedAt).toLocaleString("en-IN")} via {c.channel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Placement / outcome history</div>
        {placements.length === 0 ? (
          <div className="empty-state">No outcome recorded yet for this trainee.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Outcome type</th>
                  <th>Detail</th>
                  <th>Date</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p) => (
                  <tr key={p._id}>
                    <td style={{ textTransform: "capitalize" }}>{p.outcomeType.replaceAll("_", " ")}</td>
                    <td>
                      {p.outcomeType === "wage_employment" && `${p.role || "—"} at ${p.employerId?.name || "—"} · ₹${p.initialWage}`}
                      {p.outcomeType === "apprenticeship" && `${p.role || "—"} at ${p.employerId?.name || "—"} · stipend ₹${p.apprenticeshipStipend}`}
                      {p.outcomeType === "self_employment" && `${p.businessType || "—"} · ${p.monthlyIncomeBand?.replaceAll("_", "–")}`}
                      {p.outcomeType === "not_placed" && `Reason: ${p.nonPlacementReason?.replaceAll("_", " ")}`}
                    </td>
                    <td>{p.placementDate ? new Date(p.placementDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td><Pill value={p.verificationStatus} label={p.verificationStatus?.replaceAll("_", " ")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
