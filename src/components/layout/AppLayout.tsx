import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer mb-1 transition-all",
        active ? "bg-black text-neutral-100" : "text-neutral-600 hover:bg-neutral-200"
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname.split('/')[1] || 'pre-production';

  return (
    <div 
      className={cn(
        "bg-white h-full min-h-screen flex flex-col transition-all border-r border-neutral-200",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div className="py-6 px-3">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-center")}>
          <div className="w-[100px] flex items-center justify-center text-neutral-100 font-bold">
            <img src="/image.png" alt="Logo" className="w-full h-full" />
          </div>
          {!collapsed && <span className="ml-3 font-bold text-lg text-neutral-900"></span>}
        </div>
      </div>
      
      <div className="px-2 flex-1 py-4 pt-[0px]">
        {!collapsed ? (
          <>
            <SidebarItem
              icon={<span className="material-icons text-lg">inventory_2</span>}
              label="Pre-production"
              active={current === 'pre-production'}
              onClick={() => navigate('/pre-production')}
            />
            <SidebarItem
              icon={<span className="material-icons text-lg">precision_manufacturing</span>}
              label="Post-production"
              active={current === 'post-production'}
              onClick={() => navigate('/post-production')}
            />
            <SidebarItem
              icon={<span className="material-icons text-lg">receipt_long</span>}
              label="Billing"
              active={current === 'billing'}
              onClick={() => navigate('/billing')}
            />
            <SidebarItem
              icon={<span className="material-icons text-lg">history</span>}
              label="Billing History"
              active={current === 'billing-history'}
              onClick={() => navigate('/billing-history')}
            />
            <SidebarItem
              icon={<span className="material-icons text-lg">people</span>}
              label="Customers"
              active={current === 'customers'}
              onClick={() => navigate('/customers')}
            />
            <SidebarItem
              icon={<span className="material-icons text-lg">storage</span>}
              label="Database"
              active={current === 'database'}
              onClick={() => navigate('/database')}
            />
          </>
        ) : (
          <>
            <div 
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'pre-production' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/pre-production')}
            >
              <span className="material-icons text-lg">inventory_2</span>
            </div>
            <div 
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'post-production' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/post-production')}
            >
              <span className="material-icons text-lg">precision_manufacturing</span>
            </div>
            <div 
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'billing' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/billing')}
            >
              <span className="material-icons text-lg">receipt_long</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'billing-history' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/billing-history')}
            >
              <span className="material-icons text-lg">history</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'customers' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/customers')}
            >
              <span className="material-icons text-lg">people</span>
            </div>
            <div 
              className={cn(
                "flex items-center justify-center p-3 rounded-md cursor-pointer mb-1",
                current === 'database' ? "bg-black text-neutral-100" : "hover:bg-neutral-200"
              )}
              onClick={() => navigate('/database')}
            >
              <span className="material-icons text-lg">storage</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname.split('/')[1] || 'pre-production';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 text-neutral-900">
      <Sidebar 
        collapsed={collapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6 bg-neutral-50 pt-[36px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
