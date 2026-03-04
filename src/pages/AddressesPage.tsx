import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MapPin, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useDeliveryAddresses } from '@/hooks/useDeliveryAddresses';
import { Link } from 'react-router-dom';

const AddressesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { addresses, loading: isLoading } = useDeliveryAddresses();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Delivery Addresses
          </p>
          <Link to="/profile" className="text-[12px] text-primary font-semibold">
            + Add New
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {addresses.map((addr: any, i: number) => (
              <div
                key={addr.id}
                className={`flex items-center gap-4 px-4 py-3.5 ${i !== addresses.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-[18px] h-[18px] text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-foreground truncate">
                      {addr.address_name || addr.full_name}
                    </p>
                    {addr.is_default && (
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {addr.street_address}, {addr.city}, {addr.county}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm p-8 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">No addresses saved</p>
            <p className="text-[12px] text-muted-foreground mt-1">Add a delivery address from your profile</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressesPage;
