import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Smartphone, Mail, Key, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';

// Note: This component is designed for future MFA implementation
// Currently non-functional as it requires Supabase Pro plan features

const MFASetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = isMobileUserAgent();
  
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [step, setStep] = useState<'choose' | 'setup' | 'verify' | 'backup'>('choose');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Mock data for demonstration
  const mockTOTPSecret = 'JBSWY3DPEHPK3PXP';
  const mockQRCode = `otpauth://totp/SmartKenya?secret=${mockTOTPSecret}&issuer=SmartKenya`;
  const mockBackupCodes = [
    '1234-5678-9012',
    '3456-7890-1234',
    '5678-9012-3456',
    '7890-1234-5678',
    '9012-3456-7890',
  ];

  const handleMethodSelect = (method: 'totp' | 'sms' | 'email') => {
    setSelectedMethod(method);
    setStep('setup');
  };

  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Backup code copied to clipboard",
    });
  };

  const handleVerify = () => {
    // This would verify with backend in production
    toast({
      title: "MFA Feature Coming Soon",
      description: "Multi-factor authentication requires Supabase Pro plan",
      variant: "default",
    });
  };

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Multi-Factor Authentication</h1>
          <p className="text-muted-foreground">Add an extra layer of security to your account</p>
          <Badge variant="secondary" className="mt-2">
            <AlertCircle className="w-3 h-3 mr-1" />
            Coming Soon - Requires Pro Plan
          </Badge>
        </div>

        {step === 'choose' && (
          <div className="grid md:grid-cols-3 gap-4">
            {/* TOTP Method */}
            <Card className="p-6 cursor-pointer hover:border-primary transition-all" onClick={() => handleMethodSelect('totp')}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Authenticator App</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use apps like Google Authenticator or Authy
                </p>
                <Badge variant="outline">Recommended</Badge>
              </div>
            </Card>

            {/* SMS Method */}
            <Card className="p-6 cursor-pointer hover:border-primary transition-all" onClick={() => handleMethodSelect('sms')}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">SMS</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Receive codes via text message
                </p>
                <Badge variant="secondary">Standard</Badge>
              </div>
            </Card>

            {/* Email Method */}
            <Card className="p-6 cursor-pointer hover:border-primary transition-all" onClick={() => handleMethodSelect('email')}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Receive codes via email
                </p>
                <Badge variant="secondary">Basic</Badge>
              </div>
            </Card>
          </div>
        )}

        {step === 'setup' && (
          <Card className="p-8">
            <Tabs value={selectedMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="totp">Authenticator</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="totp" className="space-y-6 mt-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">Setup Authenticator App</h3>
                  
                  {/* QR Code Placeholder */}
                  <div className="inline-block p-6 bg-background border-2 border-dashed rounded-lg mb-4">
                    <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <Key className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">QR Code</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Can't scan? Enter this key manually:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono bg-background px-3 py-2 rounded">{mockTOTPSecret}</code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyBackupCode(mockTOTPSecret)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-left bg-muted/30 rounded-lg p-4 mb-6">
                    <p className="font-semibold mb-2">Steps:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Scan the QR code or enter the key manually</li>
                      <li>Enter the 6-digit code from your app below</li>
                    </ol>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button onClick={handleVerify} className="w-full" disabled={verificationCode.length !== 6}>
                      Verify & Continue
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Setup SMS Authentication</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254 712 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleVerify} className="w-full">
                      Send Verification Code
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-6 mt-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Setup Email Authentication</h3>
                  <div className="bg-muted/50 rounded-lg p-6 text-center mb-4">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      We'll send a verification code to your registered email whenever you sign in
                    </p>
                  </div>
                  <Button onClick={handleVerify} className="w-full">
                    Enable Email MFA
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button variant="ghost" onClick={() => setStep('choose')} className="mt-6">
              Back to Methods
            </Button>
          </Card>
        )}

        {step === 'backup' && (
          <Card className="p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
              <h3 className="text-2xl font-semibold mb-2">MFA Enabled Successfully!</h3>
              <p className="text-muted-foreground">Save your backup codes in a safe place</p>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-warning mb-1">Important:</p>
                  <p className="text-muted-foreground">
                    Store these codes securely. Each code can only be used once and you'll need them if you lose access to your authentication method.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {mockBackupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <code className="font-mono text-sm">{code}</code>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyBackupCode(code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate('/account')} className="flex-1">
                Done
              </Button>
              <Button variant="outline" onClick={() => {
                const codes = mockBackupCodes.join('\n');
                const blob = new Blob([codes], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'smartkenya-backup-codes.txt';
                a.click();
              }}>
                Download Codes
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileHeader title="MFA Setup" onBack={() => navigate('/account')} />
        <div className="pt-16">
          {content}
        </div>
      </>
    );
  }

  return content;
};

export default MFASetup;
