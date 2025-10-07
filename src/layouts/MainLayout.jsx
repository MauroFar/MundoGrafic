import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const MainLayout = () => {
  return (
    <div className="main-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="layout-body" style={{ display: 'flex', flex: 1, width: '100%' }}>
        <Sidebar />
        <div className="layout-content" style={{ width: '100%', flex: 1, padding: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
