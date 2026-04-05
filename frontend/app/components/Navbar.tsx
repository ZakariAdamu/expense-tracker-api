"use client";
import Image from "next/image";
import { navbarStyles } from "../assets/styles";
import img1 from "../assets/logo.png";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
// import axios from "axios";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type NavbarProps = {
	user?: {
		name: string;
		email: string;
	};
};

const Navbar = ({ user: propUser }: NavbarProps) => {
	// fetch user data from server

	// useEffect(() => {
	// 	const fetchUserData = async () => {
	// 		try {
	// 			const token = localStorage.getItem("token");
	// 			if (!token) {
	// 				return;
	// 			}
	// 			const response = await axios.get(`${API_BASE_URL}/users/me`, {
	// 				headers: { Authorization: `Bearer ${token}` },
	// 			});

	// 			const userData = response.data.user || response.data;
	// 		} catch (error) {
	// 			console.error("Error fetching user data:", error);
	// 		}
	// 	};
	// 	if (!propUser) {
	// 		fetchUserData();
	// 	}
	// }, [propUser]);

	const router = useRouter();
	const menuRef = useRef<HTMLDivElement>(null);
	const [menuOpen, setMenuOpen] = useState(false);

	const user = propUser || {
		name: "Zakari Adamu",
		email: "zakari.adamu714@gmail.com",
	};

	const toggleMenu = () => {
		setMenuOpen((prev) => !prev);
	};

	// close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<header className={navbarStyles.header}>
			<div className={navbarStyles.container}>
				{/* logo */}
				<div
					onClick={() => router.push("/")}
					className={navbarStyles.logoContainer}
				>
					<div className={navbarStyles.logoImage}>
						<Image src={img1} alt="logo" width={50} height={50} />
					</div>
					<span className={navbarStyles.logoText}>Expense Tracker</span>
				</div>
				{user && (
					<div className={navbarStyles.userContainer} ref={menuRef}>
						<button onClick={toggleMenu} className={navbarStyles.userButton}>
							<div className="relative">
								<div className={navbarStyles.userAvatar}>
									{user?.name?.[0]?.toUpperCase() || "U"}
								</div>
								<div className={navbarStyles.statusIndicator}></div>
							</div>
							<div className={navbarStyles.userTextContainer}>
								<p className={navbarStyles.userName}>{user?.name || "User"}</p>
								<p className={navbarStyles.userEmail}>{user?.email}</p>
							</div>
							<ChevronDown
								size={16}
								className={`${navbarStyles.chevronIcon} ${menuOpen ? "rotate-180" : ""}`}
							/>
						</button>

						{/* dropdown menu */}
						{menuOpen && (
							<div className={navbarStyles.dropdownMenu}>
								<div className={navbarStyles.dropdownHeader}>
									<div className="flex items-center gap-3">
										<div className={navbarStyles.dropdownAvatar}>
											{user?.name?.[0]?.toUpperCase() || "U"}
										</div>
										<div className="">
											<div className={navbarStyles.dropdownName}>
												{user?.name || "User"}
											</div>
											<div className={navbarStyles.dropdownEmail}>
												{user?.email}
											</div>
										</div>
									</div>
								</div>
								<div className={navbarStyles.menuItemContainer}>
									<button
										onClick={() => {
											setMenuOpen(false);
											router.push("/profile");
										}}
										className={navbarStyles.menuItem}
									>
										<User size={16} className="mr-2" />
										<span>My Profile</span>
									</button>
								</div>
								<div className={navbarStyles.menuItemBorder}>
									<button
										onClick={() => {}}
										className={navbarStyles.logoutButton}
									>
										<LogOut size={16} className="mr-2" />
										<span>Logout</span>
									</button>
								</div>
							</div>
						)}
					</div>
				)}
				;
			</div>
		</header>
	);
};

export default Navbar;
