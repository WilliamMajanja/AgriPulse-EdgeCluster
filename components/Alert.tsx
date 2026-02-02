import React, { useEffect, useState } from 'react';
import { AlertIcon } from './Icons';

interface AlertProps {
  alert: { message: string; type: 'info' | 'warning' } | null;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ alert, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [alert]);

  if (!alert) return null;

  const colors = {
    info: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/50',
      text: 'text-sky-300',
      icon: 'text-sky-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      icon: 'text-amber-400',
    },
  };

  const selectedColor = colors[alert.type];

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start p-4 max-w-sm rounded-xl border shadow-lg transition-all duration-300 backdrop-blur-lg ${selectedColor.bg} ${selectedColor.border} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <AlertIcon className={`w-6 h-6 ${selectedColor.icon}`} />
      </div>
      <div className="ml-3">
        <p className={`text-sm font-semibold ${selectedColor.text}`}>{alert.message}</p>
      </div>
       <button
        type="button"
        className="ml-auto -mr-1.5 -my-1.5 bg-transparent rounded-md p-1.5 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        onClick={onClose}
        aria-label="Dismiss"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
};

export default Alert;