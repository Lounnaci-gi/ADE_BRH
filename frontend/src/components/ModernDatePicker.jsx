import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Composant de sélecteur de date moderne
const ModernDatePicker = ({ value, onChange, placeholder = "Sélectionner une date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const datePickerRef = useRef(null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Ajouter les jours vides du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Corriger le bug de timezone en utilisant les composants locaux de la date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    onChange(localDateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return placeholder;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return placeholder;
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Fermer le calendrier si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
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

  // Mettre à jour le mois courant quand la valeur change
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setCurrentMonth(date);
        setSelectedDate(date);
      }
    }
  }, [value]);

  return (
    <div className="relative" ref={datePickerRef}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md text-xs text-left flex items-center justify-between min-w-[100px] max-w-[120px]"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="h-3 w-3 text-gray-400" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <h3 className="text-sm font-semibold text-gray-800">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, index) => {
              if (!day) {
                return <div key={index} className="h-8"></div>;
              }

              const isCurrentDay = isToday(day);
              const isSelectedDay = isSelected(day);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`h-8 w-8 text-xs rounded transition-colors ${
                    isSelectedDay
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : isCurrentDay
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1 rounded transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDatePicker;
