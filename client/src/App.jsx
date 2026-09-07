import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from "./dashboard/admindashboard"; 
import EmployeeDashboard from "./employeedashboard/dash1";
import Signup from "./Signup";
import Login from "./login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/employeedashboard" element={<EmployeeDashboard />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;