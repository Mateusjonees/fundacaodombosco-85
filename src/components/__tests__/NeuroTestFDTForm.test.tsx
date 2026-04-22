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

    const errorInputs = container.querySelectorAll('input[type="number"][step="1"]');
    expect(errorInputs.length).toBeGreaterThan(0);

    fireEvent.change(errorInputs[0], { target: { value: '0' } });

    expect(errorInputs[0]).toHaveValue(0);

    // PercentilBadge renders text like "P>95" or "P75" — check for that pattern
    expect(container.textContent).toMatch(/P[>\d]/);
  });

  it('renders percentile badge when tempo field value is 0', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    const tempoInputs = container.querySelectorAll('input[type="number"][step="0.1"]');
    expect(tempoInputs.length).toBeGreaterThan(0);

    fireEvent.change(tempoInputs[0], { target: { value: '0' } });

    expect(tempoInputs[0]).toHaveValue(0);

    // Should show percentile text
    expect(container.textContent).toMatch(/P[>\d]/);
  });

  it('renders classification text when value is 0', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    const errorInputs = container.querySelectorAll('input[type="number"][step="1"]');
    fireEvent.change(errorInputs[0], { target: { value: '0' } });

    // Should show a classification like Superior, Média, etc.
    const classificationTexts = ['Superior', 'Média Superior', 'Média', 'Média Inferior', 'Inferior'];
    const hasClassification = classificationTexts.some(c => container.textContent?.includes(c));
    expect(hasClassification).toBe(true);
  });

  it('does NOT render percentile badge when field is empty', () => {
    const { container } = render(<NeuroTestFDTForm {...defaultProps} />);

    const tempoInputs = container.querySelectorAll('input[type="number"][step="0.1"]');
    expect(tempoInputs[0]).toHaveValue(null);

    // No percentile text like "P>95" should appear for unfilled fields
    // The only text should be labels/instructions, not percentile badges
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/P>\d+/);
  });

  it('calls onResultsChange with correct scores and classification when 0 is entered', () => {
    const onResultsChange = vi.fn();
    const { container } = render(
      <NeuroTestFDTForm {...defaultProps} onResultsChange={onResultsChange} />
    );

    const errorInputs = container.querySelectorAll('input[type="number"][step="1"]');
    fireEvent.change(errorInputs[0], { target: { value: '0' } });

    expect(onResultsChange).toHaveBeenCalled();
    const lastCall = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(lastCall.rawScores.errosLeitura).toBe(0);
    expect(lastCall.classifications.errosLeitura).toBeTruthy();
    expect(typeof lastCall.percentiles.errosLeitura).toBe('number');
  });
});
