const PROVIDER_NAMES: Record<string, string> = {
  fmp: 'Financial Modeling Prep',
  sample: 'Sample data (no API key configured)',
}

const day = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  provider: string
  start: string
  end: string
  assets: number
}

export function DataProvenance({ provider, start, end, assets }: Props) {
  const name = PROVIDER_NAMES[provider] ?? provider
  const simulated = provider === 'sample'

  return (
    <p className={simulated ? 'provenance-line is-sample' : 'provenance-line'}>
      <span className="provenance-line__mark" aria-hidden="true">
        {simulated ? '!' : '✓'}
      </span>
      <span>
        {simulated ? (
          'Built on simulated prices. Add an FMP API key on the server to run this on real market data.'
        ) : (
          <>
            Built on real daily closes for {assets} {assets === 1 ? 'asset' : 'assets'} from <strong>{name}</strong>,{' '}
            {day(start)} to {day(end)}.
          </>
        )}
      </span>
    </p>
  )
}
