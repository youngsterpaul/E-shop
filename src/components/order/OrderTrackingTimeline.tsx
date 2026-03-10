import { CheckCircle2, Clock, Package, Settings, Truck, XCircle } from 'lucide-react';

interface OrderTrackingTimelineProps {
  status: string;
  createdAt: string;
}

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Settings },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTrackingTimeline = ({ status, createdAt }: OrderTrackingTimelineProps) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-destructive/10 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.findIndex(s => s.key === status);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-muted" />
        {/* Progress line */}
        {currentIndex > 0 && (
          <div
            className="absolute top-4 left-[10%] h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(currentIndex / (ORDER_STEPS.length - 1)) * 80}%`,
            }}
          />
        )}

        {ORDER_STEPS.map((step, i) => {
          const isComplete = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight ${
                  isComplete ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTrackingTimeline;
