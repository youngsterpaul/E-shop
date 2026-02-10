/**
 * Flash Sale Time Slot Utilities
 * Manages 2-hour time slots for flash sales
 */

export interface TimeSlot {
  label: string;
  startHour: number;
  endHour: number;
}

// 12 time slots per day, each 2 hours
export const TIME_SLOTS: TimeSlot[] = [
  { label: '12AM - 2AM', startHour: 0, endHour: 2 },
  { label: '2AM - 4AM', startHour: 2, endHour: 4 },
  { label: '4AM - 6AM', startHour: 4, endHour: 6 },
  { label: '6AM - 8AM', startHour: 6, endHour: 8 },
  { label: '8AM - 10AM', startHour: 8, endHour: 10 },
  { label: '10AM - 12PM', startHour: 10, endHour: 12 },
  { label: '12PM - 2PM', startHour: 12, endHour: 14 },
  { label: '2PM - 4PM', startHour: 14, endHour: 16 },
  { label: '4PM - 6PM', startHour: 16, endHour: 18 },
  { label: '6PM - 8PM', startHour: 18, endHour: 20 },
  { label: '8PM - 10PM', startHour: 20, endHour: 22 },
  { label: '10PM - 12AM', startHour: 22, endHour: 24 },
];

export const getCurrentSlotIndex = (): number => {
  const hour = new Date().getHours();
  return Math.floor(hour / 2);
};

export const getSlotDates = (date: Date, slot: TimeSlot): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(slot.startHour, 0, 0, 0);
  const end = new Date(date);
  if (slot.endHour === 24) {
    end.setHours(23, 59, 59, 999);
  } else {
    end.setHours(slot.endHour, 0, 0, 0);
  }
  return { start, end };
};

export const getSlotStatus = (sale: { start_date: string; end_date: string; is_active: boolean }): 'live' | 'upcoming' | 'ended' | 'inactive' => {
  if (!sale.is_active) return 'inactive';
  const now = new Date();
  const start = new Date(sale.start_date);
  const end = new Date(sale.end_date);
  if (now >= start && now <= end) return 'live';
  if (now < start) return 'upcoming';
  return 'ended';
};

export const formatSlotTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}${ampm}`;
};

export const generateSlotTitle = (date: Date, slot: TimeSlot): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Flash Sale - ${months[date.getMonth()]} ${date.getDate()} (${slot.label})`;
};
