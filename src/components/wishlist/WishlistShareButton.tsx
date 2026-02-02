import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Link2, Eye, Trash2 } from 'lucide-react';
import { useWishlistSharing } from '@/hooks/useWishlistSharing';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface WishlistShareButtonProps {
  variant?: 'button' | 'icon';
}

export const WishlistShareButton = ({ variant = 'button' }: WishlistShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { sharedWishlists, createShareLink, isCreating, deleteShareLink } = useWishlistSharing();

  const handleCreateShare = () => {
    createShareLink({ title: 'My Wishlist' });
  };

  const handleCopyLink = (shareCode: string) => {
    const url = `${window.location.origin}/wishlist/shared/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (variant === 'icon') {
    return (
      <>
        <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
          <Share2 className="h-4 w-4" />
        </Button>
        <ShareDialog 
          open={open} 
          onOpenChange={setOpen} 
          sharedWishlists={sharedWishlists || []}
          onCreateShare={handleCreateShare}
          isCreating={isCreating}
          onCopyLink={handleCopyLink}
          copiedId={copiedId}
          onDelete={deleteShareLink}
        />
      </>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share Wishlist
      </Button>
      <ShareDialog 
        open={open} 
        onOpenChange={setOpen} 
        sharedWishlists={sharedWishlists || []}
        onCreateShare={handleCreateShare}
        isCreating={isCreating}
        onCopyLink={handleCopyLink}
        copiedId={copiedId}
        onDelete={deleteShareLink}
      />
    </>
  );
};

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharedWishlists: any[];
  onCreateShare: () => void;
  isCreating: boolean;
  onCopyLink: (code: string) => void;
  copiedId: string | null;
  onDelete: (id: string) => void;
}

const ShareDialog = ({
  open,
  onOpenChange,
  sharedWishlists,
  onCreateShare,
  isCreating,
  onCopyLink,
  copiedId,
  onDelete
}: ShareDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Your Wishlist
          </DialogTitle>
          <DialogDescription>
            Create a shareable link to let friends see your wishlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Button 
            onClick={onCreateShare} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create New Share Link'}
          </Button>

          {sharedWishlists.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Your Shared Links</h4>
              {sharedWishlists.map((wishlist) => (
                <Card key={wishlist.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{wishlist.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {wishlist.view_count} views
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(wishlist.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCopyLink(wishlist.share_code)}
                        >
                          {copiedId === wishlist.share_code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(wishlist.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
