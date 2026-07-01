import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, Calendar, Info, RefreshCw, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { getPosts } from '../../lib/supabase';
import { Post } from '../../lib/types';

interface CalendarEvent {
  postId: string;
  postTitle: string;
  postTitleHindi: string | null;
  postSlug: string;
  eventName: string;
  eventDateStr: string; // original string (e.g., "2026-07-15" or "September 2026")
  parsedDate: Date | null;
  type: 'last_date' | 'exam_date' | 'result_date' | 'admit_card' | 'other';
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // State for current month and year in visual calendar
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Default to July 2026 for development / context
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const allPosts = await getPosts({ status: 'published' });
        setPosts(allPosts);

        // Parse important dates from each post
        const parsedEvents: CalendarEvent[] = [];
        allPosts.forEach(post => {
          if (post.important_dates && Array.isArray(post.important_dates)) {
            post.important_dates.forEach(dateItem => {
              if (!dateItem.date || !dateItem.event) return;

              // Parse date
              let parsedDate: Date | null = null;
              // Attempt standard YYYY-MM-DD parsing
              const dateMatch = dateItem.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (dateMatch) {
                parsedDate = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
              } else {
                // Try simple string date matching
                const d = new Date(dateItem.date);
                if (!isNaN(d.getTime())) {
                  parsedDate = d;
                }
              }

              // Determine event type
              const eventLower = dateItem.event.toLowerCase();
              let type: CalendarEvent['type'] = 'other';
              if (eventLower.includes('last') || eventLower.includes('end') || eventLower.includes('close') || eventLower.includes('deadline')) {
                type = 'last_date';
              } else if (eventLower.includes('exam') || eventLower.includes('cbt') || eventLower.includes('written') || eventLower.includes('test')) {
                type = 'exam_date';
              } else if (eventLower.includes('result') || eventLower.includes('scorecard') || eventLower.includes('merit')) {
                type = 'result_date';
              } else if (eventLower.includes('admit') || eventLower.includes('hall ticket') || eventLower.includes('call letter')) {
                type = 'admit_card';
              }

              parsedEvents.push({
                postId: post.id,
                postTitle: post.title || post.title_en,
                postTitleHindi: post.title_hindi || post.title_hi || null,
                postSlug: post.slug,
                eventName: dateItem.event,
                eventDateStr: dateItem.date,
                parsedDate,
                type
              });
            });
          }
        });

        setEvents(parsedEvents);

        // Set default selected date as today or first available
        const todayStr = new Date(2026, 6, 15).toISOString().split('T')[0]; // Middle of default month
        setSelectedDateStr('2026-07-15');
        const defaultEvents = parsedEvents.filter(ev => ev.eventDateStr === '2026-07-15');
        setSelectedDateEvents(defaultEvents);

      } catch (err) {
        console.error('Error loading calendar events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth); // 0 = Sunday, 1 = Monday, etc.

  // Shift to start week on Monday
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Helper to format date key: YYYY-MM-DD
  const formatDateKey = (day: number) => {
    const y = currentYear;
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Filter events for a specific day
  const getEventsForDay = (day: number) => {
    const key = formatDateKey(day);
    return events.filter(ev => {
      if (ev.eventDateStr === key) return true;
      if (ev.parsedDate) {
        const ey = ev.parsedDate.getFullYear();
        const em = ev.parsedDate.getMonth();
        const ed = ev.parsedDate.getDate();
        return ey === currentYear && em === currentMonth && ed === day;
      }
      return false;
    });
  };

  const handleDayClick = (day: number) => {
    const key = formatDateKey(day);
    const dayEvents = getEventsForDay(day);
    setSelectedDateStr(key);
    setSelectedDateEvents(dayEvents);
  };

  // Styling helpers for event types
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'last_date':
        return 'bg-amber-500 text-white';
      case 'exam_date':
        return 'bg-blue-600 text-white';
      case 'result_date':
        return 'bg-emerald-600 text-white';
      case 'admit_card':
        return 'bg-indigo-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'last_date':
        return 'Apply Last Date';
      case 'exam_date':
        return 'Exam Date';
      case 'result_date':
        return 'Result Announcement';
      case 'admit_card':
        return 'Admit Card Release';
      default:
        return 'Other Important Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
        <Link to="/" className="hover:text-primary flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary">Exam Calendar 2026</span>
      </nav>

      {/* Header Banner */}
      <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <span>ResultVeda Exams & Applications Calendar 2026</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          Stay ahead of key deadlines! Track direct apply last dates, admit card downloads, answer keys, and computer-based test (CBT) schedules across all verified recruitments.
        </p>
      </div>

      {/* Legend & Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amber Dot</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Apply Last Date</p>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blue Dot</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Exam Date</p>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Green Dot</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Result Date</p>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0"></span>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Indigo Dot</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Admit Card Date</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Building timeline calendar...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left/Center Column: Calendar Visualizer (70%) */}
          <div className="lg:col-span-2 card p-6 bg-white dark:bg-slate-900 shadow-sm rounded-xl space-y-4">
            
            {/* Calendar Controller Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="font-bold text-slate-800 dark:text-white text-base">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(2026, 6, 1))}
                  className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Reset (Jul '26)
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider py-1.5 bg-slate-50 dark:bg-slate-950/20 rounded">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {/* Empty starting cells */}
                {Array.from({ length: adjustedFirstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-slate-50/40 dark:bg-slate-950/5 rounded-md border border-transparent"></div>
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDateStr === formatDateKey(day);

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => handleDayClick(day)}
                      className={`h-16 sm:h-20 p-1.5 rounded-md border text-left flex flex-col justify-between transition-all relative outline-none focus:ring-1 focus:ring-primary ${
                        isSelected 
                          ? 'border-primary bg-primary/5 dark:bg-primary/5' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-primary font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                      </span>

                      {/* Render event indicators */}
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 max-w-full overflow-hidden mt-1">
                          {dayEvents.slice(0, 3).map((ev, evIdx) => (
                            <span 
                              key={evIdx} 
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                ev.type === 'last_date' ? 'bg-amber-500' :
                                ev.type === 'exam_date' ? 'bg-blue-600' :
                                ev.type === 'result_date' ? 'bg-emerald-600' :
                                ev.type === 'admit_card' ? 'bg-indigo-600' : 'bg-slate-400'
                              }`}
                              title={`${ev.eventName}: ${ev.postTitle}`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-bold text-slate-400 leading-none">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Event Details panel (30%) */}
          <div className="space-y-4">
            
            <div className="card p-5 bg-white dark:bg-slate-900 shadow-sm rounded-xl space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timeline Details</span>
                <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                  {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select a date'}
                </span>
              </div>

              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No key exam events recorded for this date.</p>
                  <p className="text-[10px] mt-1 text-slate-400/80">Click highlighted dates with dots to view recruitment actions.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((ev, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border-l-4 border-l-primary hover:border-l-primary-hover transition-all space-y-2"
                      style={{ borderLeftColor: ev.type === 'last_date' ? '#f59e0b' : ev.type === 'exam_date' ? '#2563eb' : ev.type === 'result_date' ? '#059669' : ev.type === 'admit_card' ? '#4f46e5' : '#64748b' }}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ev.type === 'last_date' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                          ev.type === 'exam_date' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                          ev.type === 'result_date' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          ev.type === 'admit_card' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-950/30 dark:text-slate-400'
                        }`}>
                          {getEventTypeLabel(ev.type)}
                        </span>
                      </div>

                      <h4 className="font-hindi font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        {ev.postTitleHindi || ev.postTitle}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <span>Action:</span>
                        <span className="text-primary font-bold">{ev.eventName}</span>
                      </p>

                      <div className="pt-2 flex justify-end">
                        <Link 
                          to={`/job/${ev.postSlug}`}
                          className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider"
                        >
                          View Job Alert →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informational Alert */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Weekly Update Cycle</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Dates are parsed from the official gazettes automatically. In case of updates, exam boards might extend deadlines which are updated inside ResultVeda within 12 hours.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
