import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { downloadReceipt } from '@/utils/receiptGenerator';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  CameraOff,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Download,
  RefreshCw,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Loader2,
  History,
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  Flashlight,
  FlashlightOff,
  Volume2,
  VolumeX,
  Scan,
  X
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  variant_selections?: Record<string, any>;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  username?: string;
  phone_number: string | null;
  status: string;
  amount: number | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  items: OrderItem[] | null;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_receipt_number?: string | null;
}

interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
  change_reason: string | null;
}

const orderStatuses = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-500' },
  { value: 'packed', label: 'Packed', icon: PackageCheck, color: 'bg-purple-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-indigo-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
];

// Valid status transitions based on the DB trigger logic
const getValidNextStatuses = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case 'pending': return ['processing', 'cancelled'];
    case 'processing': return ['packed', 'cancelled'];
    case 'packed': return ['shipped', 'cancelled'];
    case 'shipped': return ['delivered', 'cancelled'];
    case 'delivered': return []; // Terminal state
    case 'cancelled': return []; // Terminal state
    default: return [];
  }
};

const AdminQRCodeScannerPage = () => {
  const [manualOrderId, setManualOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [recentScans, setRecentScans] = useState<Order[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null); // Ref mirror for interval access
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isScanningRef = useRef(false); // Use ref for immediate access in interval

  // Load recent scans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentOrderScans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent scans to localStorage
  const saveRecentScan = (scannedOrder: Order) => {
    setRecentScans(prev => {
      const filtered = prev.filter(o => o.order_id !== scannedOrder.order_id);
      const updated = [scannedOrder, ...filtered].slice(0, 10);
      localStorage.setItem('recentOrderScans', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch order by ID
  const fetchOrder = async (orderId: string) => {
    if (!orderId.trim()) {
      toast({ title: 'Error', description: 'Please enter an order ID', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      // Try exact match first
      let { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          mpesa_payments!left(mpesa_receipt_number)
        `)
        .eq('order_id', orderId)
        .maybeSingle();

      // If no exact match, try partial match
      if (!data && !error) {
        const { data: fuzzyData, error: fuzzyError } = await supabase
          .from('orders')
          .select(`
            *,
            mpesa_payments!left(mpesa_receipt_number)
          `)
          .ilike('order_id', `%${orderId}%`)
          .limit(1);

        if (fuzzyError) throw fuzzyError;
        data = fuzzyData?.[0] || null;
      }

      if (error) throw error;
      if (!data) throw new Error('No order found');

      const orderData: Order = {
        ...data,
        items: data.items as unknown as OrderItem[] | null,
        username: data.username ?? undefined,
        mpesa_receipt_number: (data.mpesa_payments as any)?.[0]?.mpesa_receipt_number || null,
      };

      setOrder(orderData);
      const validNext = getValidNextStatuses(orderData.status);
      setNewStatus(validNext.length > 0 ? validNext[0] : orderData.status);
      setTrackingNumber(orderData.tracking_number || '');
      saveRecentScan(orderData);
      fetchStatusHistory(orderData.order_id);
      toast({ title: 'Order Found', description: `Order #${orderData.order_id.slice(0, 8)} loaded` });
    } catch (error: any) {
      toast({ title: 'Order Not Found', description: 'No order found with that ID', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch order status history
  const fetchStatusHistory = async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false });

    if (!error && data) {
      setStatusHistory(data);
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!order || !newStatus) return;

    // Validate transition before sending to DB
    const validStatuses = getValidNextStatuses(order.status);
    if (!validStatuses.includes(newStatus)) {
      toast({ 
        title: 'Invalid Transition', 
        description: `Cannot change from "${order.status}" to "${newStatus}". Valid: ${validStatuses.join(', ') || 'none (terminal state)'}`,
        variant: 'destructive' 
      });
      return;
    }

    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (trackingNumber && (newStatus === 'shipped' || newStatus === 'delivered')) {
        updateData.tracking_number = trackingNumber;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', order.order_id);

      if (updateError) {
        // Parse DB trigger error for a friendly message
        const msg = updateError.message || '';
        if (msg.includes('Invalid transition') || msg.includes('Cannot change status')) {
          throw new Error(msg.split('DETAIL:')[0].trim());
        }
        throw updateError;
      }

      // Note: Status history is logged automatically by the DB trigger
      // Do NOT manually insert into order_status_history to avoid duplicates

      // Trigger email notification via edge function
      try {
        await supabase.functions.invoke('order-fulfillment', {
          body: {
            orderId: order.order_id,
            status: newStatus,
            trackingNumber: trackingNumber || null,
            notes: statusNote || null,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
      }

      toast({ title: 'Success', description: `Order status updated to ${newStatus}` });

      // Refresh order data
      await fetchOrder(order.order_id);
      setStatusNote('');
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message || 'Failed to update order status', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // Generate tracking number
  const generateTrackingNumber = () => {
    const prefix = 'SK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setTrackingNumber(`${prefix}${timestamp}${random}`);
  };

  // Delete order
  const handleDeleteOrder = async () => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', order.order_id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Order deleted successfully' });
      setOrder(null);
      setIsDeleteDialogOpen(false);
      setRecentScans(prev => prev.filter(o => o.order_id !== order.order_id));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete order', variant: 'destructive' });
    }
  };

  // Download receipt
  const handleDownloadReceipt = () => {
    if (!order) return;
    try {
      downloadReceipt(order);
      toast({ title: 'Success', description: 'Receipt downloaded' });
    } catch {
      toast({ title: 'Error', description: 'Failed to download receipt', variant: 'destructive' });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  };

  // Play success sound
  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Create a pleasant beep sound
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  }, [soundEnabled]);

  // Animate scan line
  useEffect(() => {
    if (!cameraActive) {
      setScanLinePosition(0);
      return;
    }

    let direction = 1;
    const animate = () => {
      setScanLinePosition(prev => {
        const newPos = prev + direction * 2;
        if (newPos >= 100) direction = -1;
        if (newPos <= 0) direction = 1;
        return Math.max(0, Math.min(100, newPos));
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraActive]);

  // Camera handling for QR scanning
  const startCamera = async () => {
    try {
      setCameraError(null);
      setLastScannedCode(null);
      
      // First try with environment camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }
      
      streamRef.current = stream;
      
      // Check if torch is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setTorchSupported(capabilities?.torch === true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Use onloadedmetadata to ensure video is ready
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setCameraActive(true);
            setIsScanning(true);
            isScanningRef.current = true; // Set ref immediately
            startScanning();
            toast({ title: 'Camera Ready', description: 'Point at a QR code to scan' });
          } catch (playError) {
            console.error('Video play error:', playError);
            setCameraError('Could not start video playback');
          }
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Failed to access camera');
      toast({ 
        title: 'Camera Error', 
        description: 'Could not access camera. Please check permissions or use manual input.', 
        variant: 'destructive' 
      });
    }
  };

  const stopCamera = useCallback(() => {
    setIsScanning(false);
    isScanningRef.current = false; // Update ref immediately
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const newTorchState = !torchOn;
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: newTorchState } as any],
      });
      setTorchOn(newTorchState);
    } catch (e) {
      console.error('Could not toggle torch:', e);
      toast({ title: 'Torch Error', description: 'Could not toggle flashlight', variant: 'destructive' });
    }
  };

  const startScanning = () => {
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      // Use ref for immediate access instead of state
      if (!isScanningRef.current) return;
      
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth', // Try both normal and inverted
          });
          
          if (code && code.data && code.data !== lastScannedCodeRef.current) {
            console.log('QR Code detected:', code.data);
            lastScannedCodeRef.current = code.data;
            setLastScannedCode(code.data);
            setIsScanning(false);
            isScanningRef.current = false; // Update ref immediately
            playSuccessSound();
            
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Parse the QR code data - it might be a URL or just an order ID
            let orderId = code.data;
            
            // Check if it's a URL containing the order ID
            try {
              const url = new URL(code.data);
              const pathParts = url.pathname.split('/').filter(Boolean);
              const orderIdFromPath = pathParts.find(part => part.length >= 8);
              const orderIdFromQuery = url.searchParams.get('order') || url.searchParams.get('orderId') || url.searchParams.get('id');
              orderId = orderIdFromQuery || orderIdFromPath || code.data;
            } catch {
              // Not a URL, use the raw data as order ID
              orderId = code.data.trim();
            }
            
            toast({ 
              title: 'QR Code Detected!', 
              description: `Fetching order: ${orderId.slice(0, 20)}${orderId.length > 20 ? '...' : ''}` 
            });
            
            fetchOrder(orderId);
            
            // Resume scanning after a delay
            setTimeout(() => {
              setIsScanning(true);
              isScanningRef.current = true;
              lastScannedCodeRef.current = null;
              setLastScannedCode(null);
            }, 3000);
          }
        }
      }
    }, 100); // Faster scanning interval for better detection
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCamera]);

  const getStatusColor = (status: string) => {
    const found = orderStatuses.find(s => s.value === status);
    return found?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const found = orderStatuses.find(s => s.value === status);
    return found?.icon || Package;
  };

  return (
    <AdminLayout>
      <QuickActionsBar title="QR Code Scanner" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Compact Scanner Trigger */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Scan className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">QR Scanner</p>
                  <p className="text-xs text-muted-foreground">Tap to open full screen</p>
                </div>
              </div>
              <Button
                size="icon"
                onClick={() => {
                  setScannerOpen(true);
                  startCamera();
                }}
                className="h-11 w-11 rounded-2xl shadow-md"
                aria-label="Open scanner"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Fullscreen Scanner Overlay */}
          {scannerOpen && (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col">
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Top bar */}
              <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
                <Button
                  onClick={() => { stopCamera(); setScannerOpen(false); }}
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                >
                  <X className="h-5 w-5" />
                </Button>
                <p className="text-white text-sm font-medium">Scan QR Code</p>
                {torchSupported ? (
                  <Button
                    onClick={toggleTorch}
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-full ${torchOn ? 'bg-amber-500/30 text-amber-300' : 'bg-black/40 text-white hover:bg-black/60'}`}
                  >
                    {torchOn ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
                  </Button>
                ) : (
                  <div className="w-10" />
                )}
              </div>

              {/* Scanning frame */}
              <div className="relative flex-1 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, transparent 140px, black 141px)',
                  maskImage: 'radial-gradient(circle at center, transparent 140px, black 141px)'
                }} />
                <div className="relative w-72 h-72 max-w-[80vw] max-h-[80vw]">
                  <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-primary rounded-br-2xl" />
                  <div
                    className="absolute left-2 right-2 h-[3px] bg-primary shadow-[0_0_20px_hsl(var(--primary))]"
                    style={{ top: `${scanLinePosition}%`, transition: 'none' }}
                  />
                </div>
              </div>

              {/* Bottom controls */}
              <div className="relative z-10 p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-3">
                <p className="text-white/80 text-xs">Align QR code within the frame</p>
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4 mr-1" /> : <VolumeX className="h-4 w-4 mr-1" />}
                  Sound {soundEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {cameraError && (
                <div className="absolute bottom-24 left-4 right-4 bg-red-500/90 text-white text-xs p-3 rounded-lg text-center">
                  {cameraError}
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Search
              </CardTitle>
              <CardDescription>
                Enter order ID to search manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Order ID..."
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrder(manualOrderId)}
                />
                <Button onClick={() => fetchOrder(manualOrderId)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent scans
                </p>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {recentScans.map((scan) => {
                      const StatusIcon = getStatusIcon(scan.status);
                      return (
                        <button
                          key={scan.order_id}
                          onClick={() => fetchOrder(scan.order_id)}
                          className="w-full p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">#{scan.order_id.slice(0, 8)}</span>
                            <Badge variant="outline" className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {scan.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {scan.username || scan.email}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : !order ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Order Selected</h3>
                  <p className="text-sm">Scan a QR code or search for an order to view details</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Order Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold font-mono">
                          #{order.order_id.slice(0, 8)}
                        </h2>
                        <button
                          onClick={() => copyToClipboard(order.order_id, 'Order ID')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {format(new Date(order.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(order.status)} text-white px-3 py-1`}>
                        {React.createElement(getStatusIcon(order.status), { className: 'h-4 w-4 mr-1' })}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button onClick={handleDownloadReceipt} variant="outline" className="h-auto py-3">
                  <div className="flex flex-col items-center gap-1">
                    <Download className="h-5 w-5" />
                    <span className="text-xs">Receipt</span>
                  </div>
                </Button>
                <Button onClick={() => fetchOrder(order.order_id)} variant="outline" className="h-auto py-3">
                  <div className="flex flex-col items-center gap-1">
                    <RefreshCw className="h-5 w-5" />
                    <span className="text-xs">Refresh</span>
                  </div>
                </Button>
                <Button
                  onClick={() => order.email && window.open(`mailto:${order.email}`)}
                  variant="outline"
                  className="h-auto py-3"
                  disabled={!order.email}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Send className="h-5 w-5" />
                    <span className="text-xs">Email</span>
                  </div>
                </Button>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                  className="h-auto py-3"
                >
                  <div className="flex flex-col items-center gap-1">
                    <XCircle className="h-5 w-5" />
                    <span className="text-xs">Delete</span>
                  </div>
                </Button>
              </div>

              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.username || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{order.email || 'N/A'}</span>
                      {order.email && (
                        <button onClick={() => copyToClipboard(order.email!, 'Email')}>
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{order.phone_number || 'N/A'}</span>
                      {order.phone_number && (
                        <button onClick={() => copyToClipboard(order.phone_number!, 'Phone')}>
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{order.shipping_address || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-4 w-4" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>KSH {((order.amount || 0) - (order.delivery_fee || 0) + (order.discount_amount || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>KSH {(order.delivery_fee || 0).toLocaleString()}</span>
                    </div>
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-KSH {order.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>KSH {(order.amount || 0).toLocaleString()}</span>
                    </div>
                    {order.mpesa_receipt_number && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground text-sm">M-Pesa Receipt</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary">{order.mpesa_receipt_number}</code>
                          <button onClick={() => copyToClipboard(order.mpesa_receipt_number!, 'Receipt')}>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground text-sm">Tracking #</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono">{order.tracking_number}</code>
                          <button onClick={() => copyToClipboard(order.tracking_number!, 'Tracking')}>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Order Items ({order.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.items && order.items.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {item.product.image && (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <span className="font-medium line-clamp-1">{item.product.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.variant_selections ? (
                                  <div className="text-xs text-muted-foreground">
                                    {Object.entries(item.variant_selections).map(([key, value]) => (
                                      <span key={key} className="block">
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">KSH {item.product.price.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">
                                KSH {(item.product.price * item.quantity).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No items in this order</p>
                  )}
                </CardContent>
              </Card>

              {/* Update Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Edit className="h-4 w-4" />
                    Update Order Status
                  </CardTitle>
                  {/* Status flow indicator */}
                  <CardDescription>
                    Current: <span className="font-medium capitalize">{order.status}</span>
                    {getValidNextStatuses(order.status).length > 0 
                      ? ` → Valid next: ${getValidNextStatuses(order.status).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
                      : ' (terminal state — no further transitions)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getValidNextStatuses(order.status).length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">This order is in a terminal state and cannot be updated further.</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>New Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses
                                .filter(status => getValidNextStatuses(order.status).includes(status.value))
                                .map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                      <status.icon className="h-4 w-4" />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {(newStatus === 'shipped' || newStatus === 'delivered') && (
                          <div className="space-y-2">
                            <Label>Tracking Number</Label>
                            <div className="flex gap-2">
                              <Input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                              />
                              <Button variant="outline" size="icon" onClick={generateTrackingNumber}>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Status Note (Optional)</Label>
                        <Textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Add a note about this status change..."
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={updateOrderStatus}
                        disabled={updating || newStatus === order.status || !getValidNextStatuses(order.status).includes(newStatus)}
                        className="w-full"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Status & Notify Customer
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No status history</p>
                  ) : (
                    <div className="space-y-3">
                      {statusHistory.map((history) => (
                        <div key={history.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(history.new_status)}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {history.old_status && (
                                  <>
                                    <span className="text-muted-foreground">{history.old_status}</span>
                                    <span className="mx-2">→</span>
                                  </>
                                )}
                                {history.new_status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(history.changed_at), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                            {history.change_reason && (
                              <p className="text-sm text-muted-foreground mt-1">{history.change_reason}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{order?.order_id.slice(0, 8)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQRCodeScannerPage;
