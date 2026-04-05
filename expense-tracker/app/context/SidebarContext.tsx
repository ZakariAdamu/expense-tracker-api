"use client";

import { createContext, useContext } from "react";

type SidebarContextValue = {
	sidebarCollapsed: boolean;
	setSidebarCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

type SidebarProviderProps = {
	sidebarCollapsed: boolean;
	setSidebarCollapsed: (collapsed: boolean) => void;
	children: React.ReactNode;
};

export function SidebarProvider({
	sidebarCollapsed,
	setSidebarCollapsed,
	children,
}: SidebarProviderProps) {
	return (
		<SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);

	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}

	return context;
}
