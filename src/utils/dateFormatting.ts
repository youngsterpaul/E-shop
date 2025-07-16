
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

export const formatWhatsAppDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Day name like "Monday"
  }
  
  if (isThisYear(date)) {
    return format(date, 'MMM d'); // Like "Jan 15"
  }
  
  return format(date, 'MMM d, yyyy'); // Like "Jan 15, 2023"
};

export const shouldShowDateSeparator = (currentMessage: Date, previousMessage?: Date): boolean => {
  if (!previousMessage) return true;
  
  const currentDateStr = format(currentMessage, 'yyyy-MM-dd');
  const previousDateStr = format(previousMessage, 'yyyy-MM-dd');
  
  return currentDateStr !== previousDateStr;
};
