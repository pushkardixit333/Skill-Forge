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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  fetchByCourse,
  fetchByProvider,
  fetchByDemographic,
  fetchNonPlacementReasons,
  fetchAttritionReasons,
  fetchRetentionCurve,
  fetchSkillGaps,
} from "../api/api";

const COLORS = ["#0F8B8D", "#1B2A4A", "#C9622D", "#B8862B", "#2E7D5B", "#5B6270"];

export default function Analytics() {
  const [byCourse, setByCourse] = useState([]);
  const [byProvider, setByProvider] = useState([]);
  const [demographic, setDemographic] = useState({ byGender: [], byCategory: [] });
  const [nonPlacement, setNonPlacement] = useState([]);
  const [attrition, setAttrition] = useState([]);
  const [retention, setRetention] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchByCourse(),
      fetchByProvider(),
      fetchByDemographic(),
      fetchNonPlacementReasons(),
      fetchAttritionReasons(),
      fetchRetentionCurve(),
      fetchSkillGaps(),
    ])
      .then(([c, p, d, np, ar, rc, sg]) => {
        setByCourse(c);
        setByProvider(p);
        setDemographic(d);
        setNonPlacement(np.filter((x) => x.reason));
        setAttrition(ar.filter((x) => x.reason));
        setRetention(rc);
        setSkillGaps(sg);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty-state card">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics &amp; accountability</h1>
        <div className="eyebrow-line">Course, provider, district and demographic performance — for evidence-based programme decisions</div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="section-title">Placement rate by course</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCourse} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="course" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="placementRate" fill="#0F8B8D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Retention survival curve</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={retention}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="checkpointDay" tickFormatter={(d) => `Day ${d}`} tick={{ fontSize: 12 }} />
              <YAxis unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip labelFormatter={(d) => `Day ${d}`} />
              <Line type="monotone" dataKey="retentionRate" name="Still employed" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="section-title">Reasons for non-placement</div>
          {nonPlacement.length === 0 ? (
            <div className="empty-state">No non-placement records yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={nonPlacement} dataKey="count" nameKey="reason" outerRadius={95} label={(e) => e.reason.replaceAll("_", " ")}>
                  {nonPlacement.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-title">Reasons for job attrition</div>
          {attrition.length === 0 ? (
            <div className="empty-state">No attrition records yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={attrition} dataKey="count" nameKey="reason" outerRadius={95} label={(e) => e.reason.replaceAll("_", " ")}>
                  {attrition.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="section-title">Placement rate by gender</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demographic.byGender}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total trainees" fill="#E2E0D8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="placed" name="Placed" fill="#0F8B8D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">Placement rate by social category</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demographic.byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0D8" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total trainees" fill="#E2E0D8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="placed" name="Placed" fill="#1B2A4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Provider scorecards</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>District</th>
                <th>Accreditation</th>
                <th>Trainees</th>
                <th>Placed</th>
                <th>Placement rate</th>
                <th>Avg. wage (₹)</th>
              </tr>
            </thead>
            <tbody>
              {byProvider.map((p, i) => (
                <tr key={i}>
                  <td>{p.provider}</td>
                  <td>{p.district}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.accreditationStatus?.replaceAll("_", " ")}</td>
                  <td>{p.totalTrainees}</td>
                  <td>{p.placed}</td>
                  <td>{p.placementRate}%</td>
                  <td>{p.avgWage ? p.avgWage.toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Skill-gap signal (courses with highest reported skill-mismatch)</div>
        {skillGaps.length === 0 ? (
          <div className="empty-state">No skill-mismatch cases recorded yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Sector</th>
                  <th>Skill-mismatch cases</th>
                  <th>Curriculum skills taught</th>
                </tr>
              </thead>
              <tbody>
                {skillGaps.map((s, i) => (
                  <tr key={i}>
                    <td>{s.course}</td>
                    <td>{s.sector}</td>
                    <td>{s.skillMismatchCount}</td>
                    <td>{s.curriculumSkills?.join(", ")}</td>
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
