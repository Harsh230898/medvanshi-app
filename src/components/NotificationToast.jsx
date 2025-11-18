// src/components/NotificationToast.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lightbulb, X } from 'lucide-react';

const NotificationToast = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4700);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const bgColor = notification.type === 'success' 
    ? 'bg-emerald-500 border-emerald-600'
    : notification.type === 'error'
    ? 'bg-rose-500 border-rose-600'
    : 'bg-blue-500 border-blue-600';

  return (
    <div 
      className={`relative flex items-center justify-between p-4 rounded-xl shadow-2xl text-white ${bgColor} border-2 transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
        {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
        {notification.type === 'info' && <Lightbulb className="w-5 h-5" />}
        <p className="font-semibold text-sm">{notification.message}</p>
      </div>
      <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-white/20">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotificationToast;