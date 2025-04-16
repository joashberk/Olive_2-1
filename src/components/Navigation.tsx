import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Pencil, Pin, User } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function Navigation() {
  const location = useLocation();
  
  // Debug logging for navigation state
  console.log('Desktop Nav - Current location:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  });

  const isActive = (path: string) => {
    // For the Read button, consider it active on root path, /read, and book/chapter paths
    if (path === '/') {
      const isReadActive = location.pathname === '/' || 
        location.pathname.startsWith('/read') ||
        /^\/[a-z]+\/\d+$/.test(location.pathname); // Matches paths like /genesis/1
      console.log('Desktop Nav - Read button active check:', {
        path,
        currentPath: location.pathname,
        isActive: isReadActive,
        matchesBookChapter: /^\/[a-z]+\/\d+$/.test(location.pathname)
      });
      return isReadActive;
    }
    const isActive = location.pathname === path;
    console.log('Desktop Nav - Other button active check:', {
      path,
      currentPath: location.pathname,
      isActive
    });
    return isActive;
  };
  const isMobile = useMediaQuery('(max-width: 768px)');

  const navItems = [
    { path: '/', icon: <BookOpen className="w-5 h-5" />, label: 'Read' },
    { path: '/notes', icon: <Pencil className="w-5 h-5" />, label: 'Write' },
    { path: '/saved-verses', icon: <Pin className="w-5 h-5" />, label: 'Save' },
  ];

  // Don't render navigation on mobile
  if (isMobile) {
    return null;
  }

  return (
    <nav className={`bg-dark-900 sticky top-0 z-50 ${
      location.pathname === '/' || location.pathname.startsWith('/read') || /^\/[a-z]+\/\d+$/.test(location.pathname)
        ? 'border-b border-dark-800'
        : ''
    }`}>
      <div className="max-w-[97rem] mx-auto px-4 md:px-8">
        <div className="flex flex-col">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left side - Logo */}
            <Link to="/" className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-olive-300 hover:text-dark-50 transition-colors">
                Olive
              </span>
              <span className="text-xs font-medium text-olive-400">beta</span>
            </Link>

            {/* Right side - Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex space-x-2">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors
                      ${isActive(item.path)
                        ? 'bg-dark-800 text-olive-300'
                        : 'text-dark-100 hover:bg-dark-800 hover:text-dark-50'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Profile Button */}
              <Link
                to="/profile"
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-colors
                  ${isActive('/profile')
                    ? 'bg-dark-800 text-olive-300'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-50'
                  }
                `}
              >
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;