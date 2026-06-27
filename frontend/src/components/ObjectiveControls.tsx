import type { Objective, RiskModel } from '../api/types'

interface Props {
  objective: Objective
  riskModel: RiskModel
  targetReturnPct: number
  targetRiskPct: number
  cvarConfidencePct: number
  maxWeightPct: number
  lookbackDays: number
  onObjective: (value: Objective) => void
  onRiskModel: (value: RiskModel) => void
  onTargetReturnPct: (value: number) => void
  onTargetRiskPct: (value: number) => void
  onCvarConfidencePct: (value: number) => void
  onMaxWeightPct: (value: number) => void
  onLookbackDays: (value: number) => void
}

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'max_sharpe', label: 'Maximum Sharpe' },
  { value: 'min_variance', label: 'Minimum Variance' },
  { value: 'risk_parity', label: 'Risk Parity' },
  { value: 'max_diversification', label: 'Max Diversification' },
  { value: 'cvar', label: 'Minimum CVaR' },
  { value: 'target_return', label: 'Target Return' },
  { value: 'target_risk', label: 'Target Risk' },
]

const RISK_MODELS: { value: RiskModel; label: string }[] = [
  { value: 'sample', label: 'Sample covariance' },
  { value: 'ledoit_wolf', label: 'Ledoit-Wolf shrinkage' },
  { value: 'ewma', label: 'EWMA' },
]

const LOOKBACKS: { value: number; label: string }[] = [
  { value: 252, label: '1 year' },
  { value: 504, label: '2 years' },
  { value: 756, label: '3 years' },
  { value: 1260, label: '5 years' },
]

export function ObjectiveControls(props: Props) {
  return (
    <>
      <div className="field">
        <label>Objective</label>
        <select value={props.objective} onChange={(event) => props.onObjective(event.target.value as Objective)}>
          {OBJECTIVES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Risk model</label>
        <select value={props.riskModel} onChange={(event) => props.onRiskModel(event.target.value as RiskModel)}>
          {RISK_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {props.objective === 'target_return' && (
        <div className="field">
          <label>Target annual return: {props.targetReturnPct}%</label>
          <input
            type="range"
            min={1}
            max={40}
            value={props.targetReturnPct}
            onChange={(event) => props.onTargetReturnPct(Number(event.target.value))}
          />
        </div>
      )}

      {props.objective === 'target_risk' && (
        <div className="field">
          <label>Target annual volatility: {props.targetRiskPct}%</label>
          <input
            type="range"
            min={5}
            max={50}
            value={props.targetRiskPct}
            onChange={(event) => props.onTargetRiskPct(Number(event.target.value))}
          />
        </div>
      )}

      {props.objective === 'cvar' && (
        <div className="field">
          <label>CVaR confidence: {props.cvarConfidencePct}%</label>
          <input
            type="range"
            min={80}
            max={99}
            value={props.cvarConfidencePct}
            onChange={(event) => props.onCvarConfidencePct(Number(event.target.value))}
          />
        </div>
      )}

      <div className="field">
        <label>Max weight per asset: {props.maxWeightPct}%</label>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={props.maxWeightPct}
          onChange={(event) => props.onMaxWeightPct(Number(event.target.value))}
        />
      </div>

      <div className="field">
        <label>Lookback window</label>
        <select value={props.lookbackDays} onChange={(event) => props.onLookbackDays(Number(event.target.value))}>
          {LOOKBACKS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
