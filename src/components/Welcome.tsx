import { useState, useEffect } from 'react';

function Welcome() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('hasVisitedOlive');
    
    if (!hasVisited) {
      setShow(true);
      localStorage.setItem('hasVisitedOlive', 'true');
      
      // Hide the welcome screen after 6 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 6000); // 6 seconds total (5 seconds display + 1 second fade out)

      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 bg-dark-900
        flex flex-col items-center justify-center
        animate-[fadeOut_1s_ease-in-out_5s_forwards]
      `}
    >
      <h1 
        className="text-4xl md:text-5xl font-serif font-bold text-olive-300 mb-4
          opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_forwards]"
      >
        Welcome to Olive
      </h1>
      <p 
        className="text-xl text-dark-200 mb-8
          opacity-0 animate-[fadeIn_0.6s_ease-out_0.8s_forwards]"
      >
        A Bible app made for studying the Word
      </p>
      <p 
        className="text-sm text-dark-400
          opacity-0 animate-[fadeIn_0.6s_ease-out_1.4s_forwards]"
      >
        There may be bugs
      </p>
    </div>
  );
}

export default Welcome;