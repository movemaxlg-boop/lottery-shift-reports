

'use client';

import { useState, useEffect } from 'react';
import { Check, Store, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';

interface StoreData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface StoreSelectorProps {
  selectedStoreId: string | null;
  onStoreChange: (storeId: string) => void;
}

export function StoreSelector({ selectedStoreId, onStoreChange }: StoreSelectorProps) {
  const { data: session } = useSession() || {};
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedStore = stores.find((store) => store.id === selectedStoreId);
  const isManager = (session?.user as any)?.role === 'manager';

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stores');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setStores(data.stores || []);

      // If no store is selected and there are stores, select the first one
      if (!selectedStoreId && data.stores?.length > 0) {
        onStoreChange(data.stores[0].id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName,
          address: newStoreAddress,
          phone: newStorePhone,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create store');
      }

      const data = await res.json();
      setStores([...stores, data.store]);
      onStoreChange(data.store.id);
      setShowCreateDialog(false);
      setNewStoreName('');
      setNewStoreAddress('');
      setNewStorePhone('');
    } catch (error) {
      console.error('Error creating store:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-slate-500" />
              <span className="truncate">
                {loading ? 'Loading...' : selectedStore?.name || 'Select store...'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Search stores..." />
            <CommandList>
              <CommandEmpty>No store found.</CommandEmpty>
              <CommandGroup>
                {stores.map((store) => (
                  <CommandItem
                    key={store.id}
                    value={store.name}
                    onSelect={() => {
                      onStoreChange(store.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedStoreId === store.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{store.name}</div>
                      {store.address && (
                        <div className="text-xs text-muted-foreground">{store.address}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {isManager && (
                <>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setShowCreateDialog(true);
                        setOpen(false);
                      }}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Store
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Store</DialogTitle>
            <DialogDescription>
              Add a new store to the system. You can configure its settings after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name *</Label>
              <Input
                id="store-name"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="e.g., Downtown Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input
                id="store-address"
                value={newStoreAddress}
                onChange={(e) => setNewStoreAddress(e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone</Label>
              <Input
                id="store-phone"
                value={newStorePhone}
                onChange={(e) => setNewStorePhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateStore} disabled={!newStoreName.trim() || creating}>
              {creating ? 'Creating...' : 'Create Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
