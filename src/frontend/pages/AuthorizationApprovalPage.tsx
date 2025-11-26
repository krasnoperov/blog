import { useEffect, useState } from 'react';
import { useSearchParams } from '../hooks/useSearchParams';
import { FormContainer, FormTitle } from '../components/forms';
import styles from './AuthorizationApprovalPage.module.css';

interface ApprovalRequest {
  clientId: string;
  clientName: string;
  scopes: string[];
  user: {
    id: number;
    email: string;
  };
}

export default function AuthorizationApprovalPage() {
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestId = searchParams.get('request');

  useEffect(() => {
    if (!requestId) {
      setError('Missing request parameter'); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    fetch(`/api/oauth/authorize/request?request=${requestId}`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load authorization request');
        }
        return res.json();
      })
      .then((data: unknown) => {
        const response = data as { error?: string } | ApprovalRequest;
        if ('error' in response && response.error) {
          setError(response.error);
        } else {
          setRequest(response as ApprovalRequest);
        }
      })
      .catch(() => setError('Failed to load authorization request'));
  }, [requestId]);

  const handleDecision = async (approved: boolean) => {
    if (!requestId) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/oauth/authorize/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approved }),
        credentials: 'include',
      });

      const data = (await response.json()) as { redirectUrl?: string; error?: string };

      if (response.ok && data.redirectUrl) {
        // Redirect to the client application
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || 'Failed to process decision');
        setSubmitting(false);
      }
    } catch {
      setError('Network error');
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className={styles.page}>
        <FormContainer maxWidth={500}>
          <FormTitle>Authorization Error</FormTitle>
          <div className={styles.errorBox}>
            <p>{error}</p>
          </div>
        </FormContainer>
      </div>
    );
  }

  if (!request) {
    return (
      <div className={styles.page}>
        <FormContainer maxWidth={500}>
          <div className={styles.loading}>Loading...</div>
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
