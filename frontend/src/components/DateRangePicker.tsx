import React, { useState, useRef, useEffect } from 'react';
import { debounce } from '../utils/debounce';
import './DateRangePicker.css';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDateRangeChange }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Create debounced version of the callback
  const debouncedOnChange = useRef(
    debounce((start: string | null, end: string | null) => {
      onDateRangeChange(start, end);
    }, 500)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      // Clear any pending debounced calls
    };
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    debouncedOnChange(value || null, endDate || null);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    debouncedOnChange(startDate || null, value || null);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange(null, null);
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeChange(startStr, endStr);
  };

  return (
    <div className="date-range-picker">
      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">From:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            max={endDate || undefined}
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="end-date">To:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
          />
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            title="Clear dates"
          >
            ✕
          </button>
        )}
      </div>
      <div className="date-presets">
        <button
          type="button"
          className="btn-preset"
          onClick={() => handlePreset(7)}
        >
          Last 7 days
        </button>
        <button
          type="button"
          className="btn-preset"
          onClick={() => handlePreset(30)}
        >
          Last 30 days
        </button>
        <button
          type="button"
          className="btn-preset"
          onClick={() => handlePreset(90)}
        >
          Last 90 days
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
