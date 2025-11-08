import React from "react";
import { useTranslation } from "react-i18next";
import { FloatingNav } from "../ui/floating-navbar.jsx";
import SearchUsers from "../SearchUsers";
import LanguageSwitcher from "../ui/LanguageSwitcher.jsx";
import { IconHome, IconUser, IconLogin, IconDatabase, IconLogout, IconCompass, IconVideo, IconBell } from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import { usePostNotifications } from "../../hooks/usePostNotifications";

const Navbar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, logout, token, user } = useAuth();
  
  // Post notifications hook
  const { notifications } = usePostNotifications(token, user?._id);

  // Left group (desktop center-left): main links. Right group: actions like Login/Signup or Profile/Logout
  const navItems = [
    { name: t("common.home"), link: "/", icon: <IconHome size={18} /> },
    ...(isAuthenticated() ? [{ name: "Discover", link: "/discover", icon: <IconCompass size={18} /> }] : []),
    ...(isAuthenticated() ? [{ name: "Video Chat", link: "/video-chat", icon: <IconVideo size={18} /> }] : []),
    { name: t("common.about"), link: "/about", icon: <IconDatabase size={18} /> },
    { name: t("common.courses"), link: "/courses", icon: <IconDatabase size={18} /> },
    { name: t("common.challenges"), link: "/challenges", icon: <IconDatabase size={18} /> },
    { name: t("common.reels"), link: "/reels", icon: <IconDatabase size={18} /> },
    { name: t("common.classroom"), link: "/vr", icon: <IconDatabase size={18} /> },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const actions = isAuthenticated() 
    ? [
        { 
          name: `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`, 
          link: "/notifications", 
          icon: (
            <div className="relative">
              <IconBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )
        },
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
