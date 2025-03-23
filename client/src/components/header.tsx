import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link href="/" className="font-semibold text-lg">
            Observe & Report
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          {!isMobile && (
            <>
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                Home
              </Link>
              <Link href="/input" className="text-sm font-medium transition-colors hover:text-primary">
                New Observation
              </Link>
              <Link href="/search" className="text-sm font-medium transition-colors hover:text-primary">
                Search
              </Link>
            </>
          )}
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-semibold">
                {user?.username}
              </DropdownMenuItem>
              {isMobile && (
                <>
                  <Link href="/">
                    <DropdownMenuItem>Home</DropdownMenuItem>
                  </Link>
                  <Link href="/input">
                    <DropdownMenuItem>New Observation</DropdownMenuItem>
                  </Link>
                  <Link href="/search">
                    <DropdownMenuItem>Search</DropdownMenuItem>
                  </Link>
                </>
              )}
              <DropdownMenuItem onClick={logout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}