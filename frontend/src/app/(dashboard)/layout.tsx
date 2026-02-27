'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PermissionGate from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Users,
  Shield,
  Menu,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', permission: 'dashboard.view', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', permission: 'products.view', icon: Package },
  { href: '/dashboard/godowns', label: 'Godowns', permission: 'godowns.view', icon: Warehouse },
  { href: '/dashboard/stock', label: 'Stock', permission: 'stock.view', icon: ClipboardList },
  { href: '/dashboard/purchases', label: 'Purchases', permission: 'purchases.view', icon: ShoppingCart },
  { href: '/dashboard/sales', label: 'Sales', permission: 'sales.view', icon: TrendingUp },
  { href: '/dashboard/reports', label: 'Reports', permission: 'reports.view', icon: BarChart3 },
  { href: '/dashboard/users', label: 'Users', permission: 'users.view', icon: Users },
  { href: '/dashboard/roles', label: 'Roles', permission: 'roles.view', icon: Shield },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-foreground">Inventory</h1>
        <p className="text-xs text-muted-foreground mt-1">{user?.role?.name ?? ''}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <PermissionGate key={item.href} permission={item.permission}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </PermissionGate>
        ))}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-card lg:border-r">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent pathname={pathname} onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
