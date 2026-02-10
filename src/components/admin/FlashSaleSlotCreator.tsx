import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Clock, CalendarPlus, ChevronLeft, ChevronRight, Copy, PackagePlus } from 'lucide-react';
import { TIME_SLOTS, getSlotDates, getCurrentSlotIndex, generateSlotTitle, getSlotStatus, type TimeSlot } from '@/utils/flashSaleSlots';
import { format, addDays } from 'date-fns';
import type { FlashSale } from '@/hooks/useFlashSales';

interface FlashSaleSlotCreatorProps {
  flashSales: FlashSale[];
  productCounts?: Record<string, number>;
  onQuickCreate: (slotData: {
    title: string;
    start_date: string;
    end_date: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
  }) => void;
  onBatchCreate?: (slots: Array<{
    title: string;
    start_date: string;
    end_date: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
  }>) => void;
  onDuplicate: (sale: FlashSale) => void;
  onEdit: (sale: FlashSale) => void;
}

export const FlashSaleSlotCreator = ({ flashSales, productCounts, onQuickCreate, onBatchCreate, onDuplicate, onEdit }: FlashSaleSlotCreatorProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [defaultDiscount, setDefaultDiscount] = useState('10');
  const [defaultDiscountType, setDefaultDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const currentSlotIdx = getCurrentSlotIndex();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  const getSlotSale = (slot: TimeSlot): FlashSale | null => {
    const { start, end } = getSlotDates(selectedDate, slot);
    return flashSales?.find(sale => {
      const sStart = new Date(sale.start_date);
      const sEnd = new Date(sale.end_date);
      return sStart < end && sEnd > start;
    }) || null;
  };

  const handleQuickCreate = (slot: TimeSlot) => {
    const { start, end } = getSlotDates(selectedDate, slot);
    onQuickCreate({
      title: generateSlotTitle(selectedDate, slot),
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      discount_type: defaultDiscountType,
      discount_value: parseFloat(defaultDiscount) || 10,
    });
  };

  const [isFilling, setIsFilling] = useState(false);

  const handleFillAllEmpty = async () => {
    const emptySlots = TIME_SLOTS.filter((slot, idx) => {
      if (isToday && idx < currentSlotIdx) return false;
      return !getSlotSale(slot);
    });
    if (emptySlots.length === 0) return;
    if (!confirm(`Create ${emptySlots.length} flash sale(s) with ${defaultDiscount}${defaultDiscountType === 'percentage' ? '%' : ' KES'} discount?`)) return;

    if (onBatchCreate) {
      setIsFilling(true);
      const slots = emptySlots.map(slot => {
        const { start, end } = getSlotDates(selectedDate, slot);
        return {
          title: generateSlotTitle(selectedDate, slot),
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          discount_type: defaultDiscountType,
          discount_value: parseFloat(defaultDiscount) || 10,
        };
      });
      onBatchCreate(slots);
      setIsFilling(false);
    } else {
      handleQuickCreate(emptySlots[0]);
    }
  };

  const filledCount = TIME_SLOTS.filter(slot => getSlotSale(slot)).length;
  const emptyFutureCount = TIME_SLOTS.filter((slot, idx) => {
    if (isToday && idx < currentSlotIdx) return false;
    return !getSlotSale(slot);
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              2-Hour Time Slots
            </CardTitle>
            <CardDescription>Quick-create flash sales for each 2-hour window</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Default:</Label>
              <Input
                type="number"
                value={defaultDiscount}
                onChange={e => setDefaultDiscount(e.target.value)}
                className="w-16 h-8 text-sm"
                min="1"
              />
              <Select value={defaultDiscountType} onValueChange={(v: 'percentage' | 'fixed_amount') => setDefaultDiscountType(v)}>
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed_amount">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {emptyFutureCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleFillAllEmpty} disabled={isFilling}>
                <PackagePlus className="h-3.5 w-3.5 mr-1" />
                {isFilling ? 'Creating...' : `Fill Empty (${emptyFutureCount})`}
              </Button>
            )}
          </div>
        </div>
        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[160px]">
            <span className="font-semibold">{format(selectedDate, 'EEE, MMM dd yyyy')}</span>
            {isToday && <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {TIME_SLOTS.map((slot, idx) => {
            const sale = getSlotSale(slot);
            const status = sale ? getSlotStatus(sale) : null;
            const isPast = isToday && idx < currentSlotIdx;
            const isCurrent = isToday && idx === currentSlotIdx;
            const pCount = sale && productCounts ? (productCounts[sale.id] || 0) : 0;

            return (
              <div
                key={idx}
                className={`relative rounded-lg border-2 p-2.5 transition-all ${
                  isCurrent && status === 'live'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : isCurrent
                    ? 'border-primary bg-primary/5'
                    : sale
                    ? 'border-border bg-muted/30'
                    : isPast
                    ? 'border-border/50 bg-muted/50 opacity-60'
                    : 'border-dashed border-border hover:border-primary/50'
                }`}
              >
                <div className="text-[11px] font-medium text-muted-foreground mb-1">{slot.label}</div>

                {sale ? (
                  <div className="space-y-1">
                    <Badge
                      variant={status === 'live' ? 'default' : status === 'upcoming' ? 'outline' : 'secondary'}
                      className={`text-[9px] ${status === 'live' ? 'bg-green-500 animate-pulse' : ''}`}
                    >
                      {status === 'live' && <Zap className="h-2.5 w-2.5 mr-0.5" />}
                      {status === 'live' ? 'LIVE' : status === 'upcoming' ? 'Scheduled' : status === 'ended' ? 'Ended' : 'Off'}
                    </Badge>
                    <p className="text-[10px] font-medium truncate">
                      {sale.discount_type === 'percentage' ? `${sale.discount_value}% OFF` : `KES ${sale.discount_value} OFF`}
                    </p>
                    {productCounts && (
                      <p className="text-[9px] text-muted-foreground">{pCount} product{pCount !== 1 ? 's' : ''}</p>
                    )}
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={() => onEdit(sale)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={() => onDuplicate(sale)}>
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">Empty</div>
                    {!isPast && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] w-full"
                        onClick={() => handleQuickCreate(slot)}
                      >
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        Create
                      </Button>
                    )}
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coverage indicator */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {filledCount}/{TIME_SLOTS.length} slots filled for {format(selectedDate, 'MMM dd')}
          </span>
          {emptyFutureCount > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              {emptyFutureCount} gap{emptyFutureCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
