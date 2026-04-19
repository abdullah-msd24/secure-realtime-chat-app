import React from 'react'
import { Users, LayoutDashboard, FileText, MessageSquare } from 'lucide-react'

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-md p-5 hidden md:block">
      <h1 className="text-2xl font-bold mb-8">Admin</h1>

      <nav className="space-y-4">
        <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <SidebarItem icon={<Users size={18} />} label="Users" />
        <SidebarItem icon={<MessageSquare size={18} />} label="Rooms" />
        <SidebarItem icon={<FileText size={18} />} label="Logs" />
      </nav>
    </div>
  )
}

const SidebarItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
    {icon}
    <span>{label}</span>
  </div>
)

export default Sidebar