// components/builder/ButtonEditor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaRocket, 
  FaBolt, 
  FaFire, 
  FaStar, 
  FaCrown, 
  FaTrophy,
  FaEye,
  FaCog,
  FaPalette,
  FaDollarSign,
  FaClock,
  FaInfoCircle,
  FaLock,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface ButtonEditorProps {
  text: string;
  icon: string;
  price?: string;
  salePrice?: string;
  saleEndsAt?: string | null;
  onChange: (data: { text: string; icon: string }) => void;
  showPreview?: boolean;
}

// ✅ Countdown Timer Component
const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(endsAt).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-red-400">
      <FaClock className="text-xs animate-pulse" />
      <span className="text-xs font-semibold tabular-nums">
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s left
      </span>
    </div>
  );
};

const iconOptions = [
  { name: 'FaRocket', component: FaRocket, label: 'Rocket', desc: 'Launch' },
  { name: 'FaBolt', component: FaBolt, label: 'Bolt', desc: 'Speed' },
  { name: 'FaFire', component: FaFire, label: 'Fire', desc: 'Hot' },
  { name: 'FaStar', component: FaStar, label: 'Star', desc: 'Premium' },
  { name: 'FaCrown', component: FaCrown, label: 'Crown', desc: 'Elite' },
  { name: 'FaTrophy', component: FaTrophy, label: 'Trophy', desc: 'Winner' },
];

// ✅ Helper function to generate button text with price
const getButtonTextWithPrice = (text: string, price?: string, salePrice?: string) => {
  if (!price || price === "0" || price === "") {
    return text;
  }
  
  const priceNum = parseFloat(price);
  const salePriceNum = salePrice ? parseFloat(salePrice) : null;
  
  if (salePriceNum && salePriceNum > 0 && salePriceNum < priceNum) {
    return {
      text: text,
      hasPrice: true,
      originalPrice: priceNum,
      salePrice: salePriceNum,
      hasSale: true
    };
  }
  
  return {
    text: text,
    hasPrice: true,
    price: priceNum,
    hasSale: false
  };
};

const ButtonEditor: React.FC<ButtonEditorProps> = ({ 
  text, 
  icon,
  price,
  salePrice,
  saleEndsAt,
  onChange,
  showPreview = false
}) => {
  const selectedIconComponent = iconOptions.find((i) => i.name === icon)?.component || FaRocket;
  const selectedIcon = iconOptions.find((i) => i.name === icon) || iconOptions[0];

  // ✅ Calculate discount percentage
  const discountPercentage = price && salePrice && parseFloat(price) > 0 && parseFloat(salePrice) > 0
    ? Math.round(((parseFloat(price) - parseFloat(salePrice)) / parseFloat(price)) * 100)
    : 0;

  // ✅ Get button preview text
  const buttonPreview = getButtonTextWithPrice(text, price, salePrice);

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg xs:text-xl lg:text-2xl font-black text-white mb-1 truncate">
            CTA Button Editor
          </h2>
          <p className="text-gray-400 text-[10px] xs:text-xs lg:text-sm">
            Customize your main call-to-action button
          </p>
        </div>
      </div>

      {/* ✅ Pricing Info Section (Read-Only) */}
      {price && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-lg lg:rounded-xl p-3 xs:p-4 lg:p-5"
        >
          <div className="flex items-start gap-2 mb-3">
            <FaInfoCircle className="text-blue-400 text-sm mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-xs xs:text-sm lg:text-base font-bold text-blue-400 mb-1">
                Course Pricing (from Card Settings)
              </h3>
              <p className="text-[9px] xs:text-[10px] lg:text-xs text-gray-400">
                Price information is managed in Card Customization
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Price Display */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FaDollarSign className="text-green-400 text-sm" />
                <span className="text-xs text-gray-400">Price:</span>
                {salePrice && parseFloat(salePrice) > 0 ? (
                  <>
                    <span className="text-gray-500 line-through text-sm">${price}</span>
                    <span className="text-green-400 font-bold text-lg">${salePrice}</span>
                    {discountPercentage > 0 && (
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-green-400 font-bold text-lg">${price}</span>
                )}
              </div>
            </div>

            {/* Sale Timer */}
            {salePrice && parseFloat(salePrice) > 0 && saleEndsAt && (
              <div className="pt-2 border-t border-blue-500/20">
                <CountdownTimer endsAt={saleEndsAt} />
              </div>
            )}
          </div>
        </motion.div>
      )}

      

      {/* Button Text Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg lg:rounded-xl p-3 xs:p-4 lg:p-5">
        <h3 className="text-xs xs:text-sm lg:text-base font-bold text-white mb-2 xs:mb-3 flex items-center gap-1.5 lg:gap-2">
          <FaCog className="text-red-400 text-xs lg:text-sm" />
          Button Text (Before Price)
        </h3>
        
        <div>
          <label className="block text-[10px] xs:text-xs font-bold text-gray-400 mb-1.5">
            Button Label
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => onChange({ text: e.target.value, icon })}
            className="w-full px-3 xs:px-4 py-2 xs:py-2.5 lg:py-3 bg-gray-800 border-2 border-red-500/30 rounded-lg text-white font-bold text-xs xs:text-sm lg:text-base focus:outline-none focus:border-red-500 transition-colors"
            placeholder="START YOUR JOURNEY NOW"
          />
          <p className="mt-1.5 text-[9px] xs:text-[10px] lg:text-xs text-gray-400">
            {price && parseFloat(price) > 0 
              ? "Price will be added automatically after this text"
              : "Keep it short and action-oriented (recommended: 3-5 words)"
            }
          </p>
        </div>

        {/* ✅ Enhanced inline preview with price */}
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="space-y-2">
            <span className="text-[9px] xs:text-[10px] lg:text-xs text-gray-500 font-bold block">
              CURRENT BUTTON:
            </span>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg w-fit">
              {React.createElement(selectedIconComponent, { 
                className: 'text-xs xs:text-sm flex-shrink-0' 
              })}
              <span className="text-white font-black text-[10px] xs:text-xs lg:text-sm">
                {typeof buttonPreview === 'object' && buttonPreview.hasPrice ? (
                  <>
                    {buttonPreview.text}
                    {buttonPreview.hasSale ? (
                      <>
                        {" "}
                        <span className="line-through opacity-70">
                          ${buttonPreview.originalPrice?.toFixed(0)}
                        </span>
                        {" $"}{buttonPreview.salePrice?.toFixed(0)}
                      </>
                    ) : (
                      <>  ${buttonPreview.price?.toFixed(0)}</>
                    )}
                  </>
                ) : (
                  text || 'Button Text'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Icon Selection Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg lg:rounded-xl p-3 xs:p-4 lg:p-5">
        <h3 className="text-xs xs:text-sm lg:text-base font-bold text-white mb-2 xs:mb-3 flex items-center gap-1.5 lg:gap-2">
          <FaPalette className="text-red-400 text-xs lg:text-sm" />
          Button Icon
        </h3>
        
        <p className="text-[9px] xs:text-[10px] lg:text-xs text-gray-400 mb-3">
          Select an icon to appear alongside your button text
        </p>

        <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-3 gap-2">
          {iconOptions.map((option) => {
            const IconComp = option.component;
            return (
              <button
                key={option.name}
                onClick={() => onChange({ text, icon: option.name })}
                className={`flex flex-col items-center gap-1.5 p-2.5 xs:p-3 rounded-lg border-2 transition-all ${
                  icon === option.name
                    ? 'bg-red-600 border-red-500 text-white scale-105'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-500/50 hover:bg-gray-750'
                }`}
              >
                <IconComp className="text-xl xs:text-2xl" />
                <div className="text-center">
                  <span className="text-[9px] xs:text-[10px] lg:text-xs font-bold block">{option.label}</span>
                  <span className="text-[8px] xs:text-[9px] text-gray-400 block">
                    {option.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview (Optional) */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 xs:p-5 bg-black border-4 border-red-500/60 rounded-xl shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] xs:text-xs lg:text-sm font-bold text-gray-400 flex items-center gap-1.5">
              <FaEye className="text-red-400 text-xs" /> LIVE PREVIEW WITH PRICING
            </h3>
          </div>
          
          {/* Main Preview */}
          <div className="text-center mb-5">
            <p className="text-[9px] xs:text-[10px] text-gray-500 mb-3 font-bold">
              DESKTOP VIEW
            </p>
            <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-3 xs:py-4 lg:py-5 px-6 xs:px-8 lg:px-10 rounded-xl text-base xs:text-lg lg:text-xl inline-flex items-center justify-center gap-2 xs:gap-3 shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:scale-105 transition-transform cursor-pointer">
              {React.createElement(selectedIconComponent, { 
                className: 'text-lg xs:text-xl lg:text-2xl' 
              })}
              <span className="whitespace-nowrap leading-none">
                {typeof buttonPreview === 'object' && buttonPreview.hasPrice ? (
                  <>
                    {buttonPreview.text}
                    {buttonPreview.hasSale ? (
                      <>
                        {" "}
                        <span className="line-through opacity-70">
                          ${buttonPreview.originalPrice?.toFixed(0)}
                        </span>
                        {" $"}{buttonPreview.salePrice?.toFixed(0)}
                      </>
                    ) : (
                      <>  ${buttonPreview.price?.toFixed(0)}</>
                    )}
                  </>
                ) : (
                  text || 'Button Text'
                )}
              </span>
            </button>
          </div>

          {/* Responsive Size Variations */}
          <div className="bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-xl p-3 xs:p-4">
            <h4 className="text-[10px] xs:text-xs font-bold text-gray-400 mb-3">
              SIZE VARIATIONS
            </h4>
            
            <div className="space-y-3">
              {/* Desktop */}
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-14 xs:w-16 flex-shrink-0">
                  <p className="text-[9px] xs:text-[10px] text-gray-500 font-bold">Desktop</p>
                  <p className="text-[8px] xs:text-[9px] text-gray-600">1920px+</p>
                </div>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-3 xs:py-4 px-5 xs:px-8 rounded-lg lg:rounded-xl text-sm xs:text-base lg:text-lg inline-flex items-center gap-1.5 xs:gap-2">
                  {React.createElement(selectedIconComponent, { 
                    className: 'text-base xs:text-lg' 
                  })}
                  <span className="truncate">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `${buttonPreview.text}  $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : (text || 'Button Text')
                    }
                  </span>
                </button>
              </div>

              {/* Tablet */}
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-14 xs:w-16 flex-shrink-0">
                  <p className="text-[9px] xs:text-[10px] text-gray-500 font-bold">Tablet</p>
                  <p className="text-[8px] xs:text-[9px] text-gray-600">768px+</p>
                </div>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2.5 xs:py-3 px-4 xs:px-6 rounded-lg text-xs xs:text-sm lg:text-base inline-flex items-center gap-1.5 xs:gap-2">
                  {React.createElement(selectedIconComponent, { 
                    className: 'text-sm xs:text-base' 
                  })}
                  <span className="truncate max-w-[150px]">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `${buttonPreview.text.split(' ').slice(0, 2).join(' ')} $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : ((text || 'Button').split(' ').slice(0, 2).join(' '))
                    }
                  </span>
                </button>
              </div>

              {/* Mobile */}
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-14 xs:w-16 flex-shrink-0">
                  <p className="text-[9px] xs:text-[10px] text-gray-500 font-bold">Mobile</p>
                  <p className="text-[8px] xs:text-[9px] text-gray-600">320px+</p>
                </div>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2 xs:py-2.5 px-3 xs:px-4 rounded-md lg:rounded-lg text-[10px] xs:text-xs inline-flex items-center gap-1 xs:gap-1.5">
                  {React.createElement(selectedIconComponent, { 
                    className: 'text-sm xs:text-base' 
                  })}
                  <span className="truncate max-w-[80px] xs:max-w-[100px]">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `${(text || 'Start').split(' ')[0]} $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : ((text || 'Start').split(' ').slice(0, 2).join(' '))
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* States Preview */}
          <div className="mt-4 bg-gradient-to-br from-gray-900/90 to-black/95 border-2 border-red-500/40 rounded-xl p-3 xs:p-4">
            <h4 className="text-[10px] xs:text-xs font-bold text-gray-400 mb-3">
              BUTTON STATES
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Normal */}
              <div className="text-center">
                <p className="text-[9px] xs:text-[10px] text-gray-500 mb-2 font-bold">Normal</p>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2.5 xs:py-3 px-4 xs:px-6 rounded-lg text-xs xs:text-sm inline-flex items-center gap-1.5">
                  {React.createElement(selectedIconComponent, { className: 'text-sm xs:text-base' })}
                  <span className="truncate">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `Start $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : 'Start'
                    }
                  </span>
                </button>
              </div>

              {/* Hover */}
              <div className="text-center">
                <p className="text-[9px] xs:text-[10px] text-gray-500 mb-2 font-bold">Hover</p>
                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black py-2.5 xs:py-3 px-4 xs:px-6 rounded-lg text-xs xs:text-sm inline-flex items-center gap-1.5 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                  {React.createElement(selectedIconComponent, { className: 'text-sm xs:text-base' })}
                  <span className="truncate">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `Start $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : 'Start'
                    }
                  </span>
                </button>
              </div>

              {/* Active */}
              <div className="text-center">
                <p className="text-[9px] xs:text-[10px] text-gray-500 mb-2 font-bold">Active</p>
                <button className="bg-gradient-to-r from-red-700 to-red-800 text-white font-black py-2.5 xs:py-3 px-4 xs:px-6 rounded-lg text-xs xs:text-sm inline-flex items-center gap-1.5 scale-95">
                  {React.createElement(selectedIconComponent, { className: 'text-sm xs:text-base' })}
                  <span className="truncate">
                    {typeof buttonPreview === 'object' && buttonPreview.hasPrice
                      ? `Start $${buttonPreview.hasSale ? buttonPreview.salePrice?.toFixed(0) : buttonPreview.price?.toFixed(0)}`
                      : 'Start'
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ButtonEditor;