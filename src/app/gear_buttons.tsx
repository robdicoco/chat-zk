import React from 'react';
// import { useRouter } from 'next/navigation';
import { 
  FaHome, 
  FaCode, 
  FaGem, 
  FaCog,
  FaBuilding
} from 'react-icons/fa';
// import Image from 'next/image';

interface TopButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const TopButton: React.FC<TopButtonProps> = ({ 
  icon, 
  label, 
  href,
  onClick,
  isActive = false
}) => {
  // const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(); 
    } else if (href) {
      window.open(href, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2
        px-4 py-2 rounded-lg transition-all duration-300 mx-4
        ${isActive 
          ? 'bg-gradient-to-r from-[#6B46C1] to-[#48BB78] text-white' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <div className="text-base sm:text-lg">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};

interface GearButtonsProps {
  onGearClick?: () => void;
  onHomeClick?: () => void; 
}

const GearButtons: React.FC<GearButtonsProps> = ({ onGearClick, onHomeClick }) => {
  const buttons = [
    {
      icon: <FaHome />,
      label: 'Home',  
      onClick: onHomeClick
    },
    {
      icon: <FaBuilding />,
      label: 'Institutional ',
      href: 'https://chatpaygo.com'
    },
    {
      icon: <FaCode />,
      label: 'Code',
      href: 'https://github.com/vanbarros76/chatpay-go'
    },
    {
      icon: <FaGem />,
      label: 'XION',
      href: 'https://xion.burnt.com/'
    },
    {
      icon: <FaCog />,
      label: 'Tools',
      onClick: onGearClick
    }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-[#1A202C] via-[#1E2433] to-[#1A202C] border-b border-[#2D3748]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold bg-gradient-to-r from-[#6B46C1] to-[#48BB78] text-transparent bg-clip-text">
              ChatPay Go
            </div>
            <nav className="flex items-center justify-around w-[600px]">
              {buttons.map((button) => (
                <TopButton
                  key={button.label}
                  icon={button.icon}
                  label={button.label}
                  href={button.href}
                  onClick={button.onClick}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GearButtons;