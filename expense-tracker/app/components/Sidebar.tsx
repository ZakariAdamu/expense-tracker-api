"use client";
import { usePathname } from "next/navigation";
import { sidebarStyles, cn } from "../assets/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSidebar } from "../context/SidebarContext";
import {
	ArrowDown,
	ArrowUp,
	HelpCircle,
	Home,
	Menu,
	User,
	X,
} from "lucide-react";
import Link from "next/link";

type MenuItem = {
	text: string;
	path: string;
	icon: ReactNode;
};

const MENU_ITEMS: MenuItem[] = [
	{ text: "Dashboard", path: "/", icon: <Home size={20} /> },
	{ text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
	{ text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
	{ text: "Profile", path: "/profile", icon: <User size={20} /> },
];

const Sidebar = () => {
	const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
	const pathname = usePathname();
	const sidebarRef = useRef<HTMLDivElement>(null);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [activeHover, setActiveHover] = useState<string | null>(null);
	const { name: username = "User", email = "zakari.adamu714@gmail.com" } = {
		name: "Zakari Adamu",
		email: "zakari.adamu714@gmail.com",
	};
	const initial = username.charAt(0).toUpperCase();

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? "hidden" : "auto";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, [mobileOpen]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				mobileOpen &&
				sidebarRef.current &&
				!sidebarRef.current.contains(e.target as Node)
			) {
				setMobileOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [mobileOpen]);

	const toggleSidebar = () => {
		setSidebarCollapsed(!sidebarCollapsed);
	};

	// helper component for menu items

	const renderMenuItem = ({ text, path, icon }: MenuItem) => {
		const isActive = pathname === path;
		return (
			<motion.li
				key={text}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				<Link
					href={path}
					className={cn(
						sidebarStyles.menuItem.base,
						isActive
							? sidebarStyles.menuItem.active
							: sidebarStyles.menuItem.inactive,
						sidebarCollapsed
							? sidebarStyles.menuItem.collapsed
							: sidebarStyles.menuItem.expanded,
					)}
					onMouseEnter={() => setActiveHover(text)}
					onMouseLeave={() => setActiveHover(null)}
				>
					<span
						className={
							isActive
								? sidebarStyles.menuIcon.active
								: sidebarStyles.menuIcon.inactive
						}
					>
						{icon}
					</span>
					{!sidebarCollapsed && (
						<motion.span
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -10 }}
						>
							{text}
						</motion.span>
					)}
					{activeHover === text && !isActive && !sidebarCollapsed && (
						<span className={sidebarStyles.activeIndicator}></span>
					)}
				</Link>
			</motion.li>
		);
	};

	return (
		<>
			<motion.div
				ref={sidebarRef}
				className={sidebarStyles.sidebarContainer.base}
				initial={{ x: -100, opacity: 0 }}
				animate={{ x: 0, opacity: 1, width: sidebarCollapsed ? 80 : 256 }}
				transition={{ type: "spring", damping: 25 }}
			>
				<div className={sidebarStyles.sidebarInner.base}>
					<button
						onClick={toggleSidebar}
						className={sidebarStyles.toggleButton.base}
					>
						<motion.div
							initial={{ rotate: 0 }}
							animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
							transition={{ duration: 0.3 }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline
									points={
										sidebarCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"
									}
								></polyline>
							</svg>
						</motion.div>
					</button>
					<div
						className={cn(
							sidebarStyles.userProfileContainer.base,
							sidebarCollapsed
								? sidebarStyles.userProfileContainer.collapsed
								: sidebarStyles.userProfileContainer.expanded,
						)}
					>
						<div className="flex items-center">
							<div className={sidebarStyles.userInitials.base}>{initial}</div>
							{!sidebarCollapsed && (
								<motion.div
									className="ml-3 overflow-hidden"
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -10 }}
								>
									<h2 className="text-sm font-bold text-gray-800 truncate">
										{username}
									</h2>
									<p className="text-xs font-normal text-gray-500 truncate">
										{email}
									</p>
								</motion.div>
							)}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
						<ul className={sidebarStyles.menuList.base}>
							{MENU_ITEMS.map((item) => renderMenuItem(item))}
						</ul>
					</div>
					<div
						className={cn(
							sidebarStyles.footerContainer.base,
							sidebarCollapsed
								? sidebarStyles.footerContainer.collapsed
								: sidebarStyles.footerContainer.expanded,
						)}
					>
						<Link
							href={"/"}
							className={cn(
								sidebarStyles.footerLink.base,
								sidebarCollapsed && sidebarStyles.footerLink.collapsed,
							)}
						>
							<HelpCircle size={20} className="text-gray-500" />
							{!sidebarCollapsed && <span>Support</span>}
						</Link>
					</div>
				</div>
			</motion.div>

			{/* Mobile overlay */}

			<motion.button
				onClick={() => setMobileOpen((prev) => !prev)}
				className={sidebarStyles.mobileMenuButton}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
			>
				{mobileOpen ? <X size={24} /> : <Menu size={24} />}
			</motion.button>

			<AnimatePresence>
				{mobileOpen && (
					<motion.div
						className={sidebarStyles.mobileOverlay}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className={sidebarStyles.mobileBackdrop}
							onClick={() => setMobileOpen(false)}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						/>

						<motion.div
							ref={sidebarRef}
							className={sidebarStyles.mobileSidebar.base}
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
						>
							<div className="relative h-full flex flex-col">
								<div className={sidebarStyles.mobileHeader}>
									<div className={sidebarStyles.mobileUserContainer}>
										<div className={sidebarStyles.userInitials.base}>
											{initial}
										</div>
										<div className="">
											<h2 className="text-lg font-bold text-gray-800">
												{username}
											</h2>
											<p className="text-sm font-normal text-gray-500">
												{email}
											</p>
										</div>
									</div>
									<button
										className={sidebarStyles.mobileCloseButton}
										onClick={() => setMobileOpen(false)}
									>
										<X size={24} className="text-gray-600" />
									</button>
								</div>
								<div className="flex-1 overflow-y-auto py-4">
									<ul className={sidebarStyles.mobileMenuList}>
										{MENU_ITEMS.map(({ text, path, icon }) => (
											<motion.li key={text} whileTap={{ scale: 0.98 }}>
												<Link
													href={path}
													onClick={() => setMobileOpen(false)}
													className={cn(
														sidebarStyles.mobileMenuItem.base,
														pathname === path
															? sidebarStyles.mobileMenuItem.active
															: sidebarStyles.mobileMenuItem.inactive,
													)}
												>
													<span
														className={
															pathname === path
																? sidebarStyles.menuIcon.active
																: sidebarStyles.menuIcon.inactive
														}
													>
														{icon}
													</span>
													<span>{text}</span>
												</Link>
											</motion.li>
										))}
									</ul>
								</div>
								<div className={sidebarStyles.mobileFooter}>
									<Link
										onClick={() => setMobileOpen(false)}
										href={"/"}
										className={sidebarStyles.mobileFooterLink}
									>
										<HelpCircle size={20} className="text-gray-500" />
										<span>Support</span>
									</Link>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default Sidebar;
