/**
 * WhitelistManager - Admin panel for managing email whitelist
 */
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Trash2, Plus, Shield, Mail, Clock, User } from 'lucide-react';
import { getWhitelist, addToWhitelist, removeFromWhitelist, type AllowedEmail } from '@/api/endpoints';

interface WhitelistManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitelistManager: React.FC<WhitelistManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Load whitelist when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWhitelist();
    }
  }, [isOpen]);

  const loadWhitelist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getWhitelist();
      if (response.success && response.data) {
        setEmails(response.data.emails);
      } else {
        setError(response.message || 'Failed to load whitelist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load whitelist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      const response = await addToWhitelist(newEmail.trim());
      if (response.success) {
        setNewEmail('');
        await loadWhitelist(); // Reload to get updated list
      } else {
        setError(response.message || 'Failed to add email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add email');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (email: string) => {
    setDeletingEmail(email);
    setError(null);
    try {
      const response = await removeFromWhitelist(email);
      if (response.success) {
        await loadWhitelist(); // Reload to get updated list
      } else {
        setError(response.message || 'Failed to remove email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove email');
    } finally {
      setDeletingEmail(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Whitelist Management" size="lg">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <Shield className="w-5 h-5 text-blue-500" />
          <span>Only users with emails in the whitelist can access the system.</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Add new email */}
        <div className="flex gap-2">
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newEmail.trim()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        </div>

        {/* Email list */}
        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No emails in whitelist. Add the first one!
            </div>
          ) : (
            emails.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 truncate">
                      {item.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {item.added_by && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.added_by}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.email)}
                  disabled={deletingEmail === item.email}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  {deletingEmail === item.email ? (
                    <span className="text-xs">Removing...</span>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="text-xs text-gray-500 text-center">
          Total: {emails.length} email(s) in whitelist
        </div>
      </div>
    </Modal>
  );
};
