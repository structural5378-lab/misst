import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, MessageCircle, Users, Menu } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', getPath: (slug) => `/c/${slug}` },
  { icon: MessageSquare, label: 'Forum', getPath: (slug) => `/c/${slug}/forum` },
  { icon: MessageCircle, label: 'Chat', getPath: (slug) => `/c/${slug}/chat`, center: true },
  { icon: Users, label: 'Members', getPath: (slug) => `/c/${slug}/members` },
  { icon: Menu, label: 'More', getPath: (slug) => `/c/${slug}/more` },
];

export default function CommunityBottomNav({ slug }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === `/c/${slug}`) return location.pathname === `/c/${slug}`;
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[70] bg-background/90 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around max-w-2xl mx-auto px-2 h-16">
        {navItems.map((item) => {
          const path = item.getPath(slug);
          const active = isActive(path);
          const Icon = item.icon;

          if (item.center) {
            return (
              <button
                key={item.label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                    active ? 'bg-primary' : 'bg-primary/80'
                  }`}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-0.5 text-muted-foreground">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center flex-1"
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span
                className={`text-[10px] mt-0.5 ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}