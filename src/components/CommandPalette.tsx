import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, FileText, Users, Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Assuming you use React Router

// Define your commands/actions here
const COMMANDS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: FileText, action: '/dashboard', type: 'navigation' },
  { id: 'nav-staff', label: 'Manage Staff', icon: Users, action: '/staff', type: 'navigation' },
  { id: 'nav-inventory', label: 'View Inventory', icon: Package, action: '/inventory', type: 'navigation' },
  { id: 'nav-appointments', label: 'Calendar / Appointments', icon: Calendar, action: '/appointments', type: 'navigation' },
  { id: 'action-logout', label: 'Sign Out', icon: X, action: 'logout', type: 'action' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [isOpen]);

  // Filter commands based on search
  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd: typeof COMMANDS[0]) => {
    if (cmd.action === 'logout') {
      // Handle logout logic here
      console.log('Logging out...');
    } else {
      navigate(cmd.action);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full px-3 py-4 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No results found</div>
          ) : (
            <ul className="space-y-1">
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <li 
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-rose-500 text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <span className="flex-1 font-medium text-sm">{cmd.label}</span>
                    {isSelected && <ArrowRight className="w-4 h-4 opacity-70" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex justify-between">
          <span><kbd className="font-sans bg-gray-200 dark:bg-gray-700 px-1 rounded">↑↓</kbd> to navigate</span>
          <span><kbd className="font-sans bg-gray-200 dark:bg-gray-700 px-1 rounded">↵</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}