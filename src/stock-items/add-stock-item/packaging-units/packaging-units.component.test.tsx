import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createStockItemPackagingUnit } from '../../stock-items.resource';
import PackagingUnits from './packaging-units.component';

vi.mock('./packaging-units.resource', () => {
  const items = [
    {
      uuid: 'saved-unit',
      packagingUomName: 'Box',
      packagingUomUuid: 'uom-1',
      factor: 10,
      stockItemUuid: 'stock-item-uuid',
    },
  ];

  return {
    useStockItemPackageUnitsHook: () => ({
      items,
      isLoading: false,
      setStockItemUuid: vi.fn(),
      mutate: vi.fn(),
    }),
  };
});

vi.mock('../../stock-items.resource', () => ({
  createStockItemPackagingUnit: vi.fn(),
  updateStockItemPackagingUnit: vi.fn(),
}));

vi.mock('../../../utils', () => ({
  useHandleMutate: () => vi.fn(),
}));

// Clicking it picks a packaging unit for the new row
vi.mock('../packaging-units-concept-selector/packaging-units-concept-selector.component', () => ({
  default: ({ onPackageUnitChange }) => (
    <div onClick={() => onPackageUnitChange({ uuid: 'uom-2', display: 'Bottle' })}>New packaging unit</div>
  ),
}));

describe('PackagingUnits', () => {
  it('shows a delete action only for saved packaging units', () => {
    render(<PackagingUnits stockItemUuid="stock-item-uuid" handleTabChange={vi.fn()} />);

    const [, savedRow, newRow] = screen.getAllByRole('row');

    expect(within(savedRow).getByRole('button')).toBeInTheDocument();
    expect(within(newRow).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('New packaging unit')).toBeInTheDocument();
  });

  it('disables Save until the save finishes', async () => {
    const user = userEvent.setup();
    let failSave: (error: Error) => void;
    vi.mocked(createStockItemPackagingUnit).mockReturnValue(new Promise((_, reject) => (failSave = reject)) as never);
    render(<PackagingUnits stockItemUuid="stock-item-uuid" handleTabChange={vi.fn()} />);

    await user.click(screen.getByText('New packaging unit'));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();

    await act(async () => failSave(new Error('Server error')));

    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
  });
});
