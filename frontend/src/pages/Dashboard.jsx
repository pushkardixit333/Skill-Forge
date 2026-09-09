import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import StatCard from "../components/StatCard";
import { fetchSummary, fetchByDistrict, fetchWageProgression } from "../api/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byDistrict, setByDistrict] = useState([]);
  const [wageData, setWageData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchByDistrict(), fetchWageProgression()])
      .then(([s, d, w]) => {
        setSummary(s);
        setByDistrict(d);
        setWageData(w);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state card">
        Could not reach the API ({error}). Make sure the backend server is running on the configured
        REACT_APP_API_URL.
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Programme overview</h1>
        <div className="eyebrow-line">Live snapshot of enrollment, placement and retention across all courses</div>
      </div>

      <div className="grid-cards">
        <StatCard label="Total trainees" value={summary?.totalTrainees ?? "—"} />
        <StatCard label="Completed training" value={summary?.completed ?? "—"} />
        <StatCard label="Placed (all outcome types)" value={summary?.placed ?? "—"} sub={`${summary?.placementRate ?? 0}% placement rate`} />
        <StatCard label="Not placed" value={summary?.notPlaced ?? "—"} />
        <StatCard label="180-day retention" value={summary?.retentionRate180Day != null ? `${summary.retentionRate180Day}%` : "—"} />
        <StatCard label="Dropped out during training" value={summary?.droppedOut ?? "—"} />
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="section-title">Placement rate by district</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDistrict}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="district" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="placementRate" fill="#0F8B8D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Average wage progression (₹/month)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={wageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="checkpointDay" tick={{ fontSize: 12 }} tickFormatter={(d) => `Day ${d}`} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(d) => `Day ${d}`} />
              <Legend />
              <Line type="monotone" dataKey="avgWage" name="Avg. wage" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Outcome breakdown</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Outcome type</th>
                <th>Count</th>
                <th>Avg. initial wage (₹)</th>
              </tr>
            </thead>
            <tbody>
              {summary?.outcomeBreakdown?.map((o) => (
                <tr key={o._id}>
                  <td style={{ textTransform: "capitalize" }}>{o._id.replaceAll("_", " ")}</td>
                  <td>{o.count}</td>
                  <td>{o.avgWage ? Math.round(o.avgWage).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
