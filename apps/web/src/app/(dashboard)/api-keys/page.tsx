/**
 * API Keys Page
 * Phase 4: User Story 2 (T051)
 * List of API keys with "Generate New Key" button
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeyList } from '@/components/dashboard/api-key-list';
import { ApiKeyCreateDialog } from '@/components/dashboard/api-key-create';
import { Plus } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/api-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setKeys(data.keys || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleKeyCreated = () => {
    setIsCreateDialogOpen(false);
    fetchKeys(); // Refresh the list
  };

  const handleKeyRevoked = () => {
    fetchKeys(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
        <p className="text-muted-foreground">
          Manage your API keys for authenticating PDF generation requests
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              You can create up to 10 API keys. Keep them secure and never share them publicly.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={keys.length >= 10}>
            <Plus className="mr-2 h-4 w-4" />
            Generate New Key
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {keys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t created any API keys yet
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Key
                  </Button>
                </div>
              ) : (
                <ApiKeyList keys={keys} onKeyRevoked={handleKeyRevoked} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ApiKeyCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onKeyCreated={handleKeyCreated}
      />
    </div>
  );
}
