import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard'
import CotizacionesMenu from "./components/CotizacionesMenu";
import CotizacionesCrear from "./components/CotizacionesCrear";
import BuscarCotizaciones from "./components/BuscarCotizaciones";
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="Dashboard" element={<Dashboard />}/>
      <Route path="cotizacionesMenu" element={<CotizacionesMenu />}/>
     <Route path="cotizacionesCrear" element={<CotizacionesCrear />}/>
     <Route path="/cotizacionesBuscar" component={BuscarCotizaciones} /> 

      
      
    </Routes>
  </Router>
  )
}

export default App
