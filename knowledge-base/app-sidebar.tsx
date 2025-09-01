import { BarChart3, Leaf, DollarSign, TrendingUp, Vote, Home, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Overview",
    url: "#overview",
    icon: Home,
  },
  {
    title: "Financial",
    url: "#financial",
    icon: DollarSign,
  },
  {
    title: "Yield Analytics",
    url: "#yield",
    icon: BarChart3,
  },
  {
    title: "Environmental",
    url: "#environmental",
    icon: Leaf,
  },
  {
    title: "Investor Insights",
    url: "#investor",
    icon: TrendingUp,
  },
  {
    title: "DAO Governance",
    url: "#governance",
    icon: Vote,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">DAO-REIT</h2>
            <p className="text-xs text-muted-foreground">Agricultural Investments</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#settings">
                <Settings />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
