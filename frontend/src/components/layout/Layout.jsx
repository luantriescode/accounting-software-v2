import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const Layout = ({ children, onNavigate, breadcrumbs = [] }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onNavigate={onNavigate} />
      <Topbar breadcrumbs={breadcrumbs} />
      <main className="ml-[260px] mt-[52px] p-5 min-h-[calc(100vh-52px)]">
        {children}
      </main>
    </div>
  )
}

export default Layout