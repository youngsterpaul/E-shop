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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          mpesa_payments!left(mpesa_receipt_number)
        `)
        .or(`order_id.eq.${orderId},order_id.ilike.%${orderId}%`)
        .limit(1)
        .single();

      if (error) throw error;

      const orderData: Order = {
        ...data,
        items: data.items as unknown as OrderItem[] | null,
        username: data.username ?? undefined,
        mpesa_receipt_number: (data.mpesa_payments as any)?.[0]?.mpesa_receipt_number || null,
      };

      setOrder(orderData);
      setNewStatus(orderData.status);
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

      if (updateError) throw updateError;

      // Log status change
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.order_id,
          old_status: order.status,
          new_status: newStatus,
          change_reason: statusNote || null,
        });

      if (historyError) console.error('Failed to log status change:', historyError);

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
      toast({ title: 'Error', description: error.message || 'Failed to update order', variant: 'destructive' });
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
          
          if (code && code.data && code.data !== lastScannedCode) {
            console.log('QR Code detected:', code.data);
            setLastScannedCode(code.data);
            setIsScanning(false);
            isScanningRef.current = false; // Update ref immediately
            playSuccessSound();
            
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            toast({ 
              title: 'QR Code Detected!', 
              description: `Scanning order: ${code.data.slice(0, 20)}...` 
            });
            
            // Fetch the order
            fetchOrder(code.data);
            
            // Resume scanning after a delay
            setTimeout(() => {
              setIsScanning(true);
              isScanningRef.current = true;
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
          {/* Camera Scanner */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-primary" />
                    QR Scanner
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Point camera at order QR code
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? 'Mute sound' : 'Enable sound'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="relative aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                {/* Hidden video and canvas for processing */}
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                  playsInline
                  muted
                  autoPlay
                  webkit-playsinline="true"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {cameraActive ? (
                  /* Scanning overlay when camera is active */
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner markers - larger and more prominent */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-64 h-64 sm:w-56 sm:h-56">
                        {/* Glowing corner markers */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
                        
                        {/* Animated scan line */}
                        <div 
                          className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full shadow-[0_0_20px_4px_hsl(var(--primary)/0.8)]"
                          style={{ 
                            top: `${scanLinePosition}%`,
                            transition: 'none',
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Scanning status pill */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                      <div className={`px-5 py-2.5 rounded-full backdrop-blur-xl border ${isScanning ? 'bg-primary/20 border-primary/30' : 'bg-green-500/20 border-green-500/30'}`}>
                        <div className="flex items-center gap-2.5 text-white text-sm font-semibold">
                          {isScanning ? (
                            <>
                              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                              <span>Scanning...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span>Code detected!</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Vignette overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                  </div>
                ) : (
                  /* Inactive state with nice UI */
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    {/* Animated icon container */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                      <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-full border border-primary/20">
                        <QrCode className="h-16 w-16 text-primary/80" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Scan</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Tap the button below to activate your camera and scan order QR codes
                    </p>
                    
                    {cameraError && (
                      <div className="mt-4 px-4 py-3 bg-destructive/10 rounded-xl border border-destructive/20">
                        <div className="flex items-center gap-2 text-destructive">
                          <XCircle className="h-4 w-4" />
                          <p className="text-xs font-medium">{cameraError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Camera controls - Enhanced */}
              <div className="flex gap-3">
                <Button
                  onClick={cameraActive ? stopCamera : startCamera}
                  variant={cameraActive ? 'destructive' : 'default'}
                  className={`flex-1 h-12 text-base font-semibold ${!cameraActive ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25' : ''}`}
                  size="lg"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="h-5 w-5 mr-2" />
                      Stop Scanner
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 mr-2" />
                      Start Scanner
                    </>
                  )}
                </Button>
                
                {cameraActive && torchSupported && (
                  <Button
                    onClick={toggleTorch}
                    variant={torchOn ? 'secondary' : 'outline'}
                    size="lg"
                    className={`h-12 px-5 ${torchOn ? 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30' : ''}`}
                    title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                  >
                    {torchOn ? (
                      <Flashlight className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <FlashlightOff className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <p className="text-xs text-muted-foreground">
                  {cameraActive 
                    ? `Scanning active${torchSupported ? ' • Torch available' : ''}`
                    : 'Camera ready to activate'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((status) => (
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
                    disabled={updating || newStatus === order.status}
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
