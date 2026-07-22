import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/analytics">Analytics</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}
