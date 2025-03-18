import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard'
import Cotizaciones from "./components/Cotizaciones";

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="Dashboard" element={<Dashboard />}/>
      <Route path="Cotizaciones" element={<Cotizaciones />}/>
      
    </Routes>
  </Router>
  )
}

export default App
