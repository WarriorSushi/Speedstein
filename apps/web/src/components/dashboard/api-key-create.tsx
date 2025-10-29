/**
 * API Key Create Dialog
 * Phase 4: User Story 2 (T053)
 * Modal with name input, generates key, shows full key once with copy button
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface ApiKeyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated: () => void;
}

export function ApiKeyCreateDialog({ open, onOpenChange, onKeyCreated }: ApiKeyCreateDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('[API Key Create] Sending request with name:', name.trim());

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      console.log('[API Key Create] Response status:', response.status);
      console.log('[API Key Create] Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('[API Key Create] Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[API Key Create] Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      console.log('API Response:', { status: response.status, data });

      if (!response.ok) {
        // Better error messaging for authentication issues
        if (response.status === 401) {
          throw new Error('You must be logged in to create API keys. Please sign in first.');
        }
        // Log the full error details for debugging
        console.error('API Key Creation Failed:', { status: response.status, error: data.error, details: data.details });
        throw new Error(data.error || 'Failed to create API key');
      }

      // Show the full key (only time it will be displayed)
      setCreatedKey(data.apiKey);
    } catch (err: any) {
      console.error('Error creating API key:', err);
      setError(err.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    if (createdKey) {
      // Key was created, refresh parent list
      onKeyCreated();
    }
    // Reset state
    setName('');
    setCreatedKey(null);
    setError(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your API key a descriptive name to help you remember what it&apos;s for.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API, Test Environment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a name that helps you identify where this key is used
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                  {loading ? 'Creating...' : 'Create Key'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created!</DialogTitle>
              <DialogDescription>
                <strong className="text-destructive">Important:</strong> Copy your API key now.
                You won&apos;t be able to see it again!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdKey}
                    readOnly
                    className="font-mono text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Security Notice</p>
                    <p className="mt-1 text-xs">
                      This key provides full access to your account. Keep it secure and never
                      commit it to version control or share it publicly.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                I&apos;ve Saved My Key
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
