import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Pencil, Pin, User } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useEffect, useState } from 'react';

function BottomNav() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Debug logging for navigation state
  console.log('Mobile Nav - Current location:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  });

  // Add scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY < 10 || scrollDelta < 0) {
        setIsVisible(true);
      } 
      // Hide navigation when scrolling down
      else if (scrollDelta > 5) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => {
    // For the Read button, consider it active on root path, /read, and book/chapter paths
    if (path === '/') {
      const isReadActive = location.pathname === '/' || 
        location.pathname.startsWith('/read') ||
        /^\/[a-z]+\/\d+$/.test(location.pathname); // Matches paths like /genesis/1
      console.log('Mobile Nav - Read button active check:', {
        path,
        currentPath: location.pathname,
        isActive: isReadActive,
        matchesBookChapter: /^\/[a-z]+\/\d+$/.test(location.pathname)
      });
      return isReadActive;
    }
    const isActive = location.pathname === path;
    console.log('Mobile Nav - Other button active check:', {
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
    { path: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  // Only show bottom navigation on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-sm border-t border-dark-800 z-10 shadow-lg transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex items-center justify-around h-14">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex flex-col items-center justify-center flex-1 py-1 transition-colors
              ${isActive(item.path)
                ? 'text-olive-300'
                : 'text-dark-300 hover:text-dark-200'
              }
            `}
          >
            {item.icon}
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;