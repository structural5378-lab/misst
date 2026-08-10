import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mist } from '@/api/mist';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Search, Gift, Calendar } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

// GiftBadgeDialog — lets a member gift a badge to another user with a custom
// message, scheduled delivery, and anonymous option. Recipients are searched
// via the searchUsers backend function.
export default function GiftBadgeDialog({ badge, onClose, onConfirm }) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['gift-user-search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await mist.functions.invoke('searchUsers', { query });
      return res?.data?.users || [];
    },
    enabled: query.trim().length >= 2,
    staleTime: 30000,
  });

  const confirm = () => {
    if (!recipient) { toast({ title: 'Choose a recipient', variant: 'destructive' }); return; }
    onConfirm({
      gift_to: recipient.id,
      gift_to_name: recipient.full_name || recipient.callsign || '',
      gift_message: message,
      scheduled_delivery_at: schedule ? new Date(schedule).toISOString() : '',
      is_anonymous_gift: anonymous,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" /> Gift "{badge?.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-2"><PremiumBadge badge={badge} size="xl" /></div>

        <div className="space-y-3">
          <div>
            <Label>Search for a member</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setRecipient(null); }} placeholder="Name or callsign…" className="pl-8" />
            </div>
            {query.trim().length >= 2 && !recipient && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-border bg-card/60">
                {users.length === 0 ? <p className="p-2 text-xs text-muted-foreground text-center">No members found.</p> : users.map((u) => (
                  <button key={u.id} onClick={() => setRecipient(u)} className="w-full flex items-center gap-2 p-2 hover:bg-secondary text-left">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">{(u.full_name || '?')[0]}</div>}
                    <div className="min-w-0"><p className="text-sm text-foreground truncate">{u.full_name || u.callsign}</p>{u.callsign && <p className="text-[10px] text-muted-foreground truncate">{u.callsign}</p>}</div>
                  </button>
                ))}
              </div>
            )}
            {recipient && (
              <div className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                {recipient.avatar_url ? <img src={recipient.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">{(recipient.full_name || '?')[0]}</div>}
                <span className="text-sm text-foreground">To: {recipient.full_name || recipient.callsign}</span>
                <button onClick={() => setRecipient(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Change</button>
              </div>
            )}
          </div>

          <div><Label>Custom message</Label><Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Happy birthday! Welcome to the net…" /></div>

          <div>
            <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Schedule delivery (optional)</Label>
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={anonymous} onCheckedChange={setAnonymous} /> Anonymous gift (hide your name)
          </label>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={confirm} disabled={!recipient} className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
            <Gift className="w-4 h-4 mr-1" /> Gift · ${Number(badge?.price || 0).toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}