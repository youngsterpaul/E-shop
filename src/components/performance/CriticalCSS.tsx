<<<<<<< HEAD

import { useEffect } from 'react';

const CriticalCSS = () => {
  useEffect(() => {
    // Inline critical CSS for above-the-fold content
    const criticalStyles = `
      .hero-section {
        min-height: 60vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = criticalStyles;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
};

export default CriticalCSS;
=======

import { useEffect } from 'react';

const CriticalCSS = () => {
  useEffect(() => {
    // Inline critical CSS for above-the-fold content
    const criticalStyles = `
      .hero-section {
        min-height: 60vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;

    const style = document.createElement('style');
    style.textContent = criticalStyles;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
};

export default CriticalCSS;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
