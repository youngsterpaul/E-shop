import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useLocation, useNavigate } from 'react-router-dom';

export const useAndroidBackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let handler: any; // We'll get the actual handle after awaiting

    const registerBackButton = async () => {
      handler = await App.addListener('backButton', () => {
        const path = location.pathname;

        if (path === '/' || path === '/home') {
          App.exitApp();
        } else {
          navigate(-1);
        }
      });
    };

    registerBackButton();

    return () => {
      // Cleanup
      handler?.remove?.();
    };
  }, [location, navigate]);
};
