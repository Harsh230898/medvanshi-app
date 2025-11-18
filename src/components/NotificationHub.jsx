// src/components/NotificationHub.jsx
import React, { useContext } from 'react';
import NotificationContext from '../context/NotificationContext';
import NotificationToast from './NotificationToast';

const NotificationHub = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div className="fixed top-24 right-6 z-[100] w-full max-w-sm space-y-3">
      {notifications.map(n => (
        <NotificationToast 
          key={n.id} 
          notification={n} 
          onDismiss={() => removeNotification(n.id)} 
        />
      ))}
    </div>
  );
};

export default NotificationHub;