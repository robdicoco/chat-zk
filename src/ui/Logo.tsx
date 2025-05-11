import Image from 'next/image';

const Logo = ({ size = 120 }: { size?: number }) => {
  return (
    <div 
      className="relative rounded-full overflow-hidden bg-gradient-to-br from-[#6B46C1] to-[#48BB78] p-[2px]"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center p-2">
        <Image 
          src="/7a660382-8c2c-4b01-ab86-9f8b1b2c3695.png" 
          alt="ChatPay Go Logo" 
          width={size * 0.85} // 85% of the container size
          height={size * 0.85} // 85% of the container size
          className="rounded-full"
          priority // Optional: Use this if the image is above-the-fold
        />
      </div>
    </div>
  );
};

export default Logo;