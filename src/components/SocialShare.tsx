import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link2, 
  Share2,
  MessageCircle,
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SocialShareProps {
  url?: string;
  title: string;
  description?: string;
  image?: string;
  variant?: 'default' | 'compact' | 'icons-only';
}

export const SocialShare = ({ 
  url = window.location.href,
  title,
  description = '',
  image = '',
  variant = 'default'
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: 'hover:bg-[#0A66C2] hover:text-white',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366] hover:text-white',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  if (variant === 'icons-only') {
    return (
      <div className="flex items-center gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full transition-colors ${link.color}`}
            onClick={() => handleShare(link.url)}
            title={`Share on ${link.name}`}
          >
            <link.icon className="w-4 h-4" />
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full hover:bg-muted"
          onClick={handleCopyLink}
          title="Copy link"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="flex items-center gap-1">
            {shareLinks.map((link) => (
              <Button
                key={link.name}
                variant="ghost"
                size="icon"
                className={`w-9 h-9 rounded-lg transition-colors ${link.color}`}
                onClick={() => handleShare(link.url)}
                title={`Share on ${link.name}`}
              >
                <link.icon className="w-4 h-4" />
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-lg hover:bg-muted"
              onClick={handleCopyLink}
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Share this product</span>
      <div className="flex items-center gap-2 flex-wrap">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            className={`gap-2 rounded-xl transition-colors ${link.color}`}
            onClick={() => handleShare(link.url)}
          >
            <link.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{link.name}</span>
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
        </Button>
        {typeof navigator.share === 'function' && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl sm:hidden"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SocialShare;
