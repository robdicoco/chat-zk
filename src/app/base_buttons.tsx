import React, { useState } from 'react';
import { 
  FaHome, 
  FaMoneyBillWave, 
  FaComments, 
  FaAddressBook,
  FaChevronUp, // For the toggle button
  FaChevronDown // For the toggle button
} from 'react-icons/fa';

interface BaseButtonProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
  onClick: (path: string) => void;
}

const BaseButton: React.FC<BaseButtonProps> = ({ 
  icon, 
  label, 
  path, 
  isActive = false,
  onClick
}) => {
  return (
    <button
      onClick={() => onClick(path)}
      className={`
        flex flex-col items-center justify-center
        p-3 sm:p-4 rounded-xl transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-r from-[#6B46C1] to-[#553C9A] text-white shadow-lg' 
          : 'bg-[#2D3748]/50 text-gray-300 hover:bg-[#4A5568] hover:text-white'
        }
        w-full h-full
        focus:outline-none focus:ring-2 focus:ring-[#6B46C1] focus:ring-offset-2 focus:ring-offset-[#1A202C]
      `}
    >
      <div className="text-xl sm:text-2xl mb-1">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium">
        {label}
      </span>
    </button>
  );
};

interface BaseButtonsProps {
  activePath?: string;
  onNavigate: (path: string) => void;
}

const BaseButtons: React.FC<BaseButtonsProps> = ({ activePath = '/', onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true); // State to control visibility

  const buttons = [
    {
      icon: <FaHome />,
      label: 'Dashboard',
      path: 'home'
    },
    {
      icon: <FaMoneyBillWave />,
      label: 'Payments',
      path: 'payments'
    },
    {
      icon: <FaComments />,
      label: 'Chat',
      path: 'chat'
    },
    {
      icon: <FaAddressBook />,
      label: 'Contacts',
      path: 'contacts'
    }
  ];

  // Toggle visibility function
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0">
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="w-full bg-blue-900 p-2 flex items-center justify-center text-white"
      >
        {isVisible ? <FaChevronDown /> : <FaChevronUp />}
      </button>

      {/* Conditional Rendering of the Component */}
      {isVisible && (
        <div className="bg-[#1A202C]/80 backdrop-blur-sm border-t border-[#2D3748] shadow-lg">
          <div className="grid grid-cols-4 gap-2 p-3 max-w-md mx-auto">
            {buttons.map((button) => (
              <BaseButton
                key={button.path}
                icon={button.icon}
                label={button.label}
                path={button.path}
                isActive={activePath === button.path}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseButtons;