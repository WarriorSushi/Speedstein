/**
 * API Key List Component
 * Phase 4: User Story 2 (T052)
 * Display table with name, prefix, created_at, last_used_at, is_active, actions (revoke)
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  onKeyRevoked: () => void;
}

export function ApiKeyList({ keys, onKeyRevoked }: ApiKeyListProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  const handleRevokeClick = (key: ApiKey) => {
    setSelectedKey(key);
    setShowRevokeDialog(true);
  };

  const handleRevokeConfirm = async () => {
    if (!selectedKey) return;

    try {
      setRevoking(selectedKey.id);

      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: selectedKey.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke key');
      }

      onKeyRevoked();
      setShowRevokeDialog(false);
      setSelectedKey(null);
    } catch (error) {
      console.error('Error revoking key:', error);
      alert('Failed to revoke API key. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {key.key_prefix}...
                </code>
              </TableCell>
              <TableCell>
                {key.is_active ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Revoked</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(key.created_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                {key.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeClick(key)}
                    disabled={revoking === key.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the key <strong>{selectedKey?.name}</strong>?
              <br />
              <br />
              This action cannot be undone. All requests using this key will be rejected immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? 'Revoking...' : 'Revoke Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
