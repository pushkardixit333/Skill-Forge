import React from "react";

const VARIANT_MAP = {
  completed: "positive",
  active: "positive",
  employer_confirmed: "positive",
  govt_database_verified: "positive",
  dropped_out: "clay",
  exited: "clay",
  no_response: "clay",
  in_progress: "teal",
  pending: "teal",
  enrolled: "neutral",
  unverified: "neutral",
  self_reported: "neutral",
  self_declared: "neutral",
};

export default function Pill({ value, label }) {
  const variant = VARIANT_MAP[value] || "neutral";
  return <span className={`pill pill-${variant}`}>{label || value}</span>;
}
