import { useState } from "react";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
    <Routes>
      <Route path="/" element={<Login />} />
    <Route path="Dashboard" element={<Dashboard />}/>
      
    </Routes>
  </Router>
  )
}

export default App
