import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import type { VerificationResult } from '../api/types'

export function VerifyPage({ credentialId }: { credentialId: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient
      .get<VerificationResult>(`/api/verify/${credentialId}`)
      .then((response) => setResult(response.data))
      .catch(() =>
        setResult({ valid: false, course: null, issued_to: null, issued_at: null, credential_id: null }),
      )
      .finally(() => setLoading(false))
  }, [credentialId])

  return (
    <div className="verify-page">
      <h1 className="landing-title">PortfoliU</h1>
      {loading ? (
        <p className="muted">Verifying credential…</p>
      ) : result?.valid ? (
        <div className="verify-card valid">
          <div className="cert-seal">✓</div>
          <h2>Valid credential</h2>
          <p>
            {result.issued_to ?? 'A learner'} successfully completed <strong>{result.course}</strong>
          </p>
          {result.issued_at && (
            <p className="muted">Issued {new Date(result.issued_at).toLocaleDateString()}</p>
          )}
          <p className="cert-id muted">Credential {result.credential_id}</p>
        </div>
      ) : (
        <div className="verify-card invalid">
          <h2>Credential not found</h2>
          <p className="muted">This credential id is invalid or does not exist in our records.</p>
        </div>
      )}
      <a className="back" href="/">
        ← Back to PortfoliU
      </a>
    </div>
  )
}
