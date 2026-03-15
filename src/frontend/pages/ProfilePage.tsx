import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '../components/Link';
import { useAuth } from '../contexts/useAuth';
import { AppHeader } from '../components/AppHeader';
import { HeaderNav } from '../components/HeaderNav';
import { FormContainer, FormTitle, ErrorMessage, formStyles } from '../components/forms';
import { requestContract } from '../lib/api';
import { userProfileQueryOptions } from '../queries/pageQueries';
import type { ApiResponse } from '../../shared/api-contracts';
import styles from './ProfilePage.module.css';

interface ProfilePageProps {
  initialProfile?: ApiResponse<'userProfileGet'>;
}

export default function ProfilePage({ initialProfile }: ProfilePageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [hasEditedName, setHasEditedName] = useState(false);

  const profileQuery = useQuery({
    ...userProfileQueryOptions(),
    initialData: initialProfile,
  });

  const saveMutation = useMutation({
    mutationFn: async (nextName: string) => requestContract('userProfileUpdate', undefined, {
      body: { name: nextName },
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfile'], data.user);
      setSuccessMessage('Profile updated successfully!');
      setError(null);
      setNameDraft('');
      setHasEditedName(false);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (err) => {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    },
  });

  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isLoading;
  const isSaving = saveMutation.isPending;
  const name = hasEditedName ? nameDraft : (profile?.name ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    await saveMutation.mutateAsync(name.trim());
  };

  const headerRightSlot = user ? (
    <HeaderNav userName={user.name} userEmail={user.email} />
  ) : (
    <Link to="/login" className={styles.authButton}>Sign In</Link>
  );

  return (
    <div className={styles.page}>
      <AppHeader
        leftSlot={(
          <Link to="/" className={styles.brand}>
            Whitelabel App
          </Link>
        )}
        rightSlot={headerRightSlot}
      />

      <main className={styles.main}>
        {isLoading ? (
          <FormContainer maxWidth={640}>
            <div className={styles.loading}>Loading your profile...</div>
          </FormContainer>
        ) : (
          <FormContainer maxWidth={640}>
            <FormTitle>Your Profile</FormTitle>

            <ErrorMessage message={error} />
            <ErrorMessage message={successMessage} />

            <form onSubmit={handleSubmit}>
              <div className={formStyles.formGroup}>
                <label htmlFor="name" className={formStyles.label}>
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setHasEditedName(true);
                    setNameDraft(e.target.value);
                  }}
                  className={formStyles.input}
                  placeholder="Enter your name"
                  disabled={isSaving}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label htmlFor="email" className={formStyles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  className={`${formStyles.input} ${formStyles.readonly}`}
                  disabled
                  readOnly
                />
              </div>

              <button
                type="submit"
                className={formStyles.submitButton}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </FormContainer>
        )}
      </main>
    </div>
  );
}
