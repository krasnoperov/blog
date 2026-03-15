import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FormContainer, FormTitle } from '../components/forms';
import { requestContract } from '../lib/api';
import { oauthApprovalRequestQueryOptions } from '../queries/pageQueries';
import type { ApiResponse } from '../../shared/api-contracts';
import styles from './AuthorizationApprovalPage.module.css';

interface AuthorizationApprovalPageProps {
  initialRequest?: ApiResponse<'oauthApprovalRequest'> | null;
  requestId?: string;
}

export default function AuthorizationApprovalPage({
  initialRequest = null,
  requestId: initialRequestId,
}: AuthorizationApprovalPageProps) {
  const [error, setError] = useState<string | null>(null);
  const requestId = initialRequestId;
  const missingRequestError = !requestId ? 'Missing request parameter' : null;

  const approvalQuery = useQuery({
    ...oauthApprovalRequestQueryOptions(requestId || ''),
    enabled: Boolean(requestId),
    initialData: initialRequest ?? undefined,
  });

  const decisionMutation = useMutation({
    mutationFn: async (approved: boolean) => requestContract('oauthApprovalDecision', undefined, {
      body: {
        requestId: requestId || '',
        approved,
      },
    }),
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to process decision');
    },
  });

  const handleDecision = async (approved: boolean) => {
    if (!requestId) return;
    await decisionMutation.mutateAsync(approved);
  };

  const request = approvalQuery.data ?? null;
  const submitting = decisionMutation.isPending;

  if (error || missingRequestError) {
    return (
      <div className={styles.page}>
        <FormContainer maxWidth={500}>
          <FormTitle>Authorization Error</FormTitle>
          <div className={styles.errorBox}>
            <p>{error || missingRequestError}</p>
          </div>
        </FormContainer>
      </div>
    );
  }

  if (!request) {
    return (
      <div className={styles.page}>
        <FormContainer maxWidth={500}>
          <div className={styles.loading}>
            {approvalQuery.isError ? 'Failed to load authorization request' : 'Loading...'}
          </div>
        </FormContainer>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <FormContainer maxWidth={500}>
        <FormTitle>Authorize Application</FormTitle>

        <div className={styles.clientInfo}>
          <div className={styles.clientName}>{request.clientName}</div>
          <p className={styles.clientDescription}>
            wants to access your account
          </p>
        </div>

        <div className={styles.userInfo}>
          <p>
            Logged in as: <strong>{request.user.email}</strong>
          </p>
        </div>

        <div className={styles.permissions}>
          <h4>This application will be able to:</h4>
          <ul>
            <li>View your profile and email address</li>
            <li>Access your data on your behalf</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => handleDecision(false)}
            disabled={submitting}
            className={styles.denyButton}
          >
            Deny
          </button>
          <button
            onClick={() => handleDecision(true)}
            disabled={submitting}
            className={styles.approveButton}
          >
            Grant Access
          </button>
        </div>
      </FormContainer>
    </div>
  );
}
