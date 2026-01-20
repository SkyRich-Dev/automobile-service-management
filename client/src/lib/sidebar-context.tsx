import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';
const BRANCH_STORAGE_KEY = 'selected-branch';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  const [selectedBranch, setSelectedBranchState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(BRANCH_STORAGE_KEY) || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem(BRANCH_STORAGE_KEY, selectedBranch);
  }, [selectedBranch]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const setCollapsed = (collapsed: boolean) => setIsCollapsed(collapsed);
  const setSelectedBranch = (branchId: string) => setSelectedBranchState(branchId);

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      toggleSidebar, 
      setCollapsed,
      selectedBranch,
      setSelectedBranch 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
