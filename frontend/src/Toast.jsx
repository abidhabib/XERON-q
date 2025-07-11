import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`${bgColor} text-white rounded-lg p-4 shadow-lg mb-2 transform transition-all duration-300 translate-x-0 opacity-100`}>
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-2" />
        <span className="font-medium">{message}</span>
        <button
          onClick={onDismiss}
          className="ml-auto pl-4"
        >
          <XMarkIcon className="w-5 h-5 hover:text-gray-200" />
        </button>
      </div>
    </div>
  );
};