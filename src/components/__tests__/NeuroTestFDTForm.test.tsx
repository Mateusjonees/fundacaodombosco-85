import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NeuroTestFDTForm from '../NeuroTestFDTForm';

describe('NeuroTestFDTForm — zero value handling', () => {
  const defaultProps = {
    patientAge: 10,
    onResultsChange: vi.fn(),
    onRemove: vi.fn(),
  };

  it('renders percentile badge when error field value is 0', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    // Find the first error input (Leitura under Erros section)
    const errorInputs = container.querySelectorAll('input[type="number"][step="1"]');
    expect(errorInputs.length).toBeGreaterThan(0);

    // Type "0" into the first error field
    fireEvent.change(errorInputs[0], { target: { value: '0' } });

    // The input should retain the value "0", not become empty
    expect(errorInputs[0]).toHaveValue(0);

    // A percentile badge (P>95 or similar) should appear
    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders percentile badge when tempo field value is 0', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    // Find the first tempo input (Leitura under Tempos section)
    const tempoInputs = container.querySelectorAll('input[type="number"][step="0.1"]');
    expect(tempoInputs.length).toBeGreaterThan(0);

    // Type "0" into the first tempo field
    fireEvent.change(tempoInputs[0], { target: { value: '0' } });

    // The input should retain the value 0
    expect(tempoInputs[0]).toHaveValue(0);

    // A percentile badge should appear (not hidden because value is 0)
    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('does NOT render percentile badge when field is empty', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    // Without any input, no individual field badges should appear
    // (only check that error/tempo field badges are absent)
    const tempoInputs = container.querySelectorAll('input[type="number"][step="0.1"]');
    const firstInput = tempoInputs[0];
    
    // Ensure it's empty
    expect(firstInput).toHaveValue(null);

    // No badges next to inputs (interpretation section also hidden)
    const badges = container.querySelectorAll('[class*="badge"]');
    // Only the header badges (if any) should exist, not field-level percentile badges
    // Since no input is filled, the PercentilBadge components should not render
    expect(badges.length).toBe(0);
  });

  it('calls onResultsChange with correct scores when 0 is entered', () => {
    const onResultsChange = vi.fn();
    const { container } = render(
      <NeuroTestFDTForm {...defaultProps} onResultsChange={onResultsChange} />
    );

    const errorInputs = container.querySelectorAll('input[type="number"][step="1"]');
    fireEvent.change(errorInputs[0], { target: { value: '0' } });

    // onResultsChange should be called with rawScores.errosLeitura = 0
    expect(onResultsChange).toHaveBeenCalled();
    const lastCall = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(lastCall.rawScores.errosLeitura).toBe(0);
    // Classifications should exist (not empty)
    expect(lastCall.classifications.errosLeitura).toBeTruthy();
    // Percentiles should be a number
    expect(typeof lastCall.percentiles.errosLeitura).toBe('number');
  });
});
