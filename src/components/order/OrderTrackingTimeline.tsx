import { CheckCircle2, Clock, Package, Settings, Truck, XCircle } from 'lucide-react';

interface GemFashionStyleTimelineProps {
  status: string;
  createdAt: string;
}

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Tailoring & Prep', icon: Settings },
  { key: 'packed', label: 'Atelier Packed', icon: Package },
  { key: 'shipped', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const GemFashionStyleTimeline = ({ status, createdAt }: GemFashionStyleTimelineProps) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 py-4 px-5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 shadow-sm">
        <XCircle className="h-5 w-5 stroke-[1.5]" />
        <span className="text-xs tracking-wider uppercase font-semibold">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = ORDER_STEPS.findIndex(s => s.key === status);

  return (
    <div className="py-6 px-2 bg-white rounded-2xl border border-neutral-100 shadow-sm">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-800">
          Gem Fashion Style
        </h3>
        <p className="text-[10px] text-neutral-400 mt-0.5 tracking-wider font-light">
          Bespoke Journey Tracking
        </p>
      </div>

      <div className="flex items-center justify-between relative">
        {/* Background Track Line */}
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[1px] bg-neutral-200" />
        
        {/* Fashion Progress Line */}
        {currentIndex > 0 && (
          <div
            className="absolute top-[18px] left-[10%] h-[1px] bg-amber-600 transition-all duration-700 ease-out"
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
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isComplete
                    ? isCurrent
                      ? 'bg-neutral-900 text-amber-400 ring-4 ring-amber-100 border border-neutral-900'
                      : 'bg-neutral-900 text-neutral-100'
                    : 'bg-neutral-50 text-neutral-400 border border-neutral-200/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isCurrent ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              
              <span
                className={`text-[10px] mt-2.5 text-center leading-tight tracking-wide transition-colors duration-300 ${
                  isCurrent 
                    ? 'text-neutral-900 font-semibold' 
                    : isComplete 
                      ? 'text-neutral-600 font-medium' 
                      : 'text-neutral-400 font-light'
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

export default GemFashionStyleTimeline;