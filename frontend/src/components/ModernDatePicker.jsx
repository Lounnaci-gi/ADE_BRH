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
    
    // ✅ CRÉER LES DATES AVEC MIDI LOCAL POUR ÉVITER LES DÉCALAGES
    for (let day = 1; day <= daysInMonth; day++) {
      // Créer la date à midi local pour éviter les problèmes de fuseau horaire
      const dayDate = new Date(year, month, day, 12, 0, 0, 0);
      days.push(dayDate);
    }
    
    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    
    // ✅ GARANTIR LA DATE EXACTE SÉLECTIONNÉE SANS DÉCALAGE DE FUSEAU HORAIRE
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    console.log('🔍 DEBUG ModernDatePicker - Date sélectionnée:', {
      date,
      year,
      month,
      day,
      localDateString
    });
    
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
      // ✅ PARSER LA DATE SANS DÉCALAGE DE FUSEAU HORAIRE
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day, 12, 0, 0, 0);
        const formatted = date.toLocaleDateString('fr-FR');
        
        console.log('🔍 DEBUG formatDisplayDate:', {
          dateString,
          parts,
          year,
          month: month + 1,
          day,
          date,
          formatted
        });
        
        return formatted;
      }
      
      // Fallback pour les autres formats
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('❌ Erreur formatDisplayDate:', error);
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
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md text-left flex items-center justify-between font-medium text-gray-700"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="h-4 w-4 text-gray-400" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 p-4 min-w-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <h3 className="text-base font-bold text-gray-800">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {daysOfWeek.map(day => (
              <div key={day} className="text-xs font-semibold text-gray-600 text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((day, index) => {
              if (!day) {
                return <div key={index} className="h-9"></div>;
              }

              const isCurrentDay = isToday(day);
              const isSelectedDay = isSelected(day);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`h-9 w-9 text-sm rounded-lg font-medium transition-all duration-200 ${
                    isSelectedDay
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'
                      : isCurrentDay
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 rounded-lg transition-all duration-200 font-medium"
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
