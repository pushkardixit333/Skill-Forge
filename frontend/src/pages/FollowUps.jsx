import React, { useEffect, useState } from "react";
import Pill from "../components/Pill";
import { fetchFollowUps, attemptFollowUp, completeFollowUp, markNoResponse } from "../api/api";

const emptyResponse = {
  currentlyEmployed: true,
  currentWage: "",
  stillWithSameEmployer: true,
  satisfactionScore: 4,
  reasonForAttrition: "",
  freeText: "",
};

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [dueOnly, setDueOnly] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [response, setResponse] = useState(emptyResponse);
  const [error, setError] = useState(null);

  const load = () => {
    fetchFollowUps(dueOnly ? { due: "true" } : {})
      .then(setFollowUps)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [dueOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAttempt = async (id) => {
    await attemptFollowUp(id);
    load();
  };

  const handleNoResponse = async (id) => {
    await markNoResponse(id);
    load();
  };

  const openLogForm = (id) => {
    setActiveId(id);
    setResponse(emptyResponse);
  };

  const submitResponse = async (e, handledBy) => {
    e.preventDefault();
    await completeFollowUp(activeId, {
      handledBy,
      response: {
        ...response,
        currentWage: response.currentlyEmployed ? Number(response.currentWage) : undefined,
        reasonForAttrition: response.currentlyEmployed ? undefined : response.reasonForAttrition,
      },
    });
    setActiveId(null);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Follow-up queue</h1>
        <div className="eyebrow-line">Automated IVR/SMS/WhatsApp outreach, escalating to assisted calls after 3 unanswered attempts</div>
      </div>

      <div className="toolbar">
        <div className="filter-row">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.86rem" }}>
            <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} />
            Show only due follow-ups
          </label>
        </div>
      </div>

      {error && <div className="empty-state card">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trainee</th>
              <th>Checkpoint</th>
              <th>Due date</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {followUps.length === 0 && (
              <tr><td colSpan={7} className="empty-state">No follow-ups match this filter.</td></tr>
            )}
            {followUps.map((f) => (
              <tr key={f._id}>
                <td>{f.traineeId?.name} <span style={{ color: "var(--color-ink-soft)" }}>({f.traineeId?.traineeCode})</span></td>
                <td>Day {f.checkpointDay}</td>
                <td>{new Date(f.dueDate).toLocaleDateString("en-IN")}</td>
                <td style={{ textTransform: "capitalize" }}>{f.channel.replaceAll("_", " ")}</td>
                <td><Pill value={f.status} label={f.status.replaceAll("_", " ")} /></td>
                <td>{f.attempts}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  {f.status !== "completed" && f.status !== "no_response" && (
                    <>
                      <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.76rem" }} onClick={() => handleAttempt(f._id)}>
                        Attempt
                      </button>
                      <button className="btn btn-teal" style={{ padding: "4px 8px", fontSize: "0.76rem" }} onClick={() => openLogForm(f._id)}>
                        Log response
                      </button>
                      <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.76rem" }} onClick={() => handleNoResponse(f._id)}>
                        Mark no-response
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeId && (
        <div className="modal-backdrop" onClick={() => setActiveId(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Log follow-up response</h2>
            <form onSubmit={(e) => submitResponse(e, "call_center_agent")}>
              <div className="field-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={response.currentlyEmployed}
                    onChange={(e) => setResponse({ ...response, currentlyEmployed: e.target.checked })}
                  />
                  Currently employed / still in placement
                </label>
              </div>

              {response.currentlyEmployed ? (
                <div className="field-row">
                  <div className="field-group">
                    <label>Current wage (₹/month)</label>
                    <input type="number" required value={response.currentWage} onChange={(e) => setResponse({ ...response, currentWage: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={response.stillWithSameEmployer}
                        onChange={(e) => setResponse({ ...response, stillWithSameEmployer: e.target.checked })}
                      />
                      Same employer as placement
                    </label>
                  </div>
                </div>
              ) : (
                <div className="field-group">
                  <label>Reason for leaving</label>
                  <select value={response.reasonForAttrition} onChange={(e) => setResponse({ ...response, reasonForAttrition: e.target.value })}>
                    <option value="">Select reason</option>
                    <option value="better_opportunity">Found a better opportunity</option>
                    <option value="low_wage">Low wage</option>
                    <option value="workplace_issue">Workplace issue</option>
                    <option value="location_relocation">Location / relocation</option>
                    <option value="health_personal">Health / personal reason</option>
                    <option value="contract_ended">Contract ended</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="field-group">
                <label>Satisfaction score (1–5)</label>
                <input type="number" min={1} max={5} value={response.satisfactionScore} onChange={(e) => setResponse({ ...response, satisfactionScore: e.target.value })} />
              </div>

              <div className="field-group">
                <label>Notes (optional)</label>
                <textarea rows={3} value={response.freeText} onChange={(e) => setResponse({ ...response, freeText: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setActiveId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save response</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
