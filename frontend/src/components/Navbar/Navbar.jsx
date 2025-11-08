import React from "react";
import { useTranslation } from "react-i18next";
import { FloatingNav } from "../ui/floating-navbar.jsx";
import SearchUsers from "../SearchUsers";
import LanguageSwitcher from "../ui/LanguageSwitcher.jsx";
import { IconHome, IconUser, IconLogin, IconDatabase, IconLogout, IconCompass } from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();

  // Left group (desktop center-left): main links. Right group: actions like Login/Signup or Profile/Logout
  const navItems = [
    { name: t("common.home"), link: "/", icon: <IconHome size={18} /> },
    ...(isAuthenticated() ? [{ name: "Discover", link: "/discover", icon: <IconCompass size={18} /> }] : []),
    { name: t("common.about"), link: "/about", icon: <IconDatabase size={18} /> },
    { name: t("common.courses"), link: "/courses", icon: <IconDatabase size={18} /> },
    { name: t("common.challenges"), link: "/challenges", icon: <IconDatabase size={18} /> },
    { name: t("common.reels"), link: "/reels", icon: <IconDatabase size={18} /> },
    { name: t("common.classroom"), link: "/vr", icon: <IconDatabase size={18} /> },
  ];

  const actions = isAuthenticated()
    ? [
        { name: t("common.profile"), link: "/profile", icon: <IconUser size={18} /> },
        { name: t("common.logout"), link: "#", icon: <IconLogout size={18} />, onClick: logout },
      ]
    : [
        { name: t("common.login"), link: "/login", icon: <IconLogin size={18} /> },
        { name: t("common.signup"), link: "/signup", icon: <IconUser size={18} /> },
      ];

  return (
    <>
      <FloatingNav navItems={navItems} actions={actions} extraCenter={<SearchUsers />} />
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </>
  );
};

export default Navbar;
