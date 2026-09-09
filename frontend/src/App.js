import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trainees from "./pages/Trainees";
import TraineeDetail from "./pages/TraineeDetail";
import Placements from "./pages/Placements";
import FollowUps from "./pages/FollowUps";
import Analytics from "./pages/Analytics";

function AppShell() {
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trainees" element={<Trainees />} />
            <Route path="/trainees/:id" element={<TraineeDetail />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
