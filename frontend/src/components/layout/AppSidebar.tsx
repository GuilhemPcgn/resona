"use client";

import { useState } from "react";
import { 
  Home, 
  Calendar, 
  FolderOpen, 
  Music, 
  CreditCard, 
  Settings, 
  Users, 
  Mic,
  Headphones,
  Play
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Projets", url: "/projects", icon: FolderOpen },
  { title: "Calendrier", url: "/calendar", icon: Calendar },
  { title: "Studio", url: "/studio", icon: Mic },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Facturation", url: "/billing", icon: CreditCard },
];

const quickActions = [
  { title: "Nouvelle séance", url: "/session/new", icon: Headphones },
  { title: "Upload audio", url: "/upload", icon: Music },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => pathname === path;
  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-primary/20 text-primary border-r-2 border-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-48"} collapsible="icon">
      {/* div plain — bypass SidebarHeader (shadcn y ajoute p-2 + overflow hidden) */}
      <div
        className="border-b border-sidebar-border shrink-0"
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden", /* empêche l'image de déborder et bloquer d'autres éléments */
        }}
      >
        {!collapsed ? (
          <Image
            src="/logo_patchbay.png"
            alt="Resona"
            width={180}
            height={68}
            className="object-contain shrink-0"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo_icon.png"
            alt="Resona"
            style={{
              width: 120,
              height: 120,
              maxWidth: "none",
              maxHeight: "none",
              flexShrink: 0,
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
      </div>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      href={item.url} 
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Actions rapides
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="hover:bg-accent/10 text-sidebar-foreground hover:text-accent"
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}