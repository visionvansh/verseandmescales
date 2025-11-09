"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaSearch } from 'react-icons/fa';

const countries = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: '+358', flag: '🇫🇮' },
  { name: 'Poland', code: '+48', flag: '🇵🇱' },
  { name: 'Czech Republic', code: '+420', flag: '🇨🇿' },
  { name: 'Hungary', code: '+36', flag: '🇭🇺' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Greece', code: '+30', flag: '🇬🇷' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Peru', code: '+51', flag: '🇵🇪' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

const CountryCodeSelector = ({ value, onChange }: CountryCodeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedCountry = countries.find(c => c.code === value) || countries[0];
  
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full xs:w-auto">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full xs:w-auto bg-gray-800/40 border border-gray-600/40 rounded-lg hover:border-red-500/60 transition-all duration-300 backdrop-blur-sm focus:bg-gray-800/60
                   p-2.5 sm:p-3 px-3 sm:px-4 xs:min-w-[110px] sm:min-w-[120px]"
        style={{ boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.2)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">{selectedCountry.flag}</span>
          <span className="text-white font-medium text-sm sm:text-base">{selectedCountry.code}</span>
        </div>
        <FaChevronDown className={`text-gray-400 transition-transform text-xs ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 xs:left-0 xs:right-auto mt-2 bg-gray-800/98 backdrop-blur-2xl border border-gray-600/50 rounded-xl shadow-2xl z-50 overflow-hidden
                       w-full xs:w-72 sm:w-80"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ 
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              maxHeight: "min(400px, 60vh)"
            }}
          >
            {/* Search */}
            <div className="p-2 sm:p-3 border-b border-gray-600/50 sticky top-0 bg-gray-800/95 backdrop-blur-xl z-10">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500/60 transition-colors
                            text-xs sm:text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-[280px] sm:max-h-[320px] overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code + country.name}
                    onClick={() => {
                      onChange(country.code);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-gray-700/50 transition-colors ${
                      country.code === value ? 'bg-red-900/20 border-l-2 border-red-500' : ''
                    }`}
                  >
                    <span className="text-base sm:text-lg flex-shrink-0">{country.flag}</span>
                    <span className="text-white font-medium min-w-[45px] sm:min-w-[50px] text-xs sm:text-sm">
                      {country.code}
                    </span>
                    <span className="text-gray-300 truncate text-xs sm:text-sm">
                      {country.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <p className="text-gray-400 text-xs sm:text-sm">No countries found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountryCodeSelector;