import { useState, useEffect } from 'react';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    // Try to get existing device ID from localStorage
    let existingDeviceId = localStorage.getItem('flameforge-device-id');
    
    if (!existingDeviceId) {
      // Generate new device ID
      existingDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('flameforge-device-id', existingDeviceId);
    }
    
    setDeviceId(existingDeviceId);
  }, []);

  return deviceId;
};