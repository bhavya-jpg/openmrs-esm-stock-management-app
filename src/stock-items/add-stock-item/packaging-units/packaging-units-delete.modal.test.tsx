import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { showSnackbar } from '@openmrs/esm-framework';
import { describe, expect, it, vi } from 'vitest';
import { type StockItemPackagingUOMDTO } from '../../../core/api/types/stockItem/StockItemPackagingUOM';
import { deleteStockItemPackagingUnit } from '../../stock-items.resource';
import DeletePackagingUnitModal from './packaging-units-delete.modal';

const mockDeleteStockItemPackagingUnit = vi.mocked(deleteStockItemPackagingUnit);
const mockMutate = vi.fn();

vi.mock('../../stock-items.resource', () => ({
  deleteStockItemPackagingUnit: vi.fn(),
}));

vi.mock('./packaging-units.resource', () => ({
  useStockItemPackageUnitsHook: () => ({
    mutate: mockMutate,
    setStockItemUuid: vi.fn(),
  }),
}));

const row: StockItemPackagingUOMDTO = {
  uuid: 'packaging-uuid',
  stockItemUuid: 'stock-item-uuid',
  packagingUomName: 'Box',
};

describe('DeletePackagingUnitModal', () => {
  it('sends the entered reason when deleting a packaging unit', async () => {
    const user = userEvent.setup();
    mockDeleteStockItemPackagingUnit.mockResolvedValue({} as never);

    render(<DeletePackagingUnitModal row={row} closeModal={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'No longer dispensed');
    await user.click(screen.getByRole('button', { name: /yes/i }));

    expect(mockDeleteStockItemPackagingUnit).toHaveBeenCalledWith('packaging-uuid', 'No longer dispensed');
    expect(mockMutate).toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ kind: 'success' }));
  });

  it('disables Yes until the delete finishes', async () => {
    const user = userEvent.setup();
    let failDelete: (error: Error) => void;
    mockDeleteStockItemPackagingUnit.mockReturnValue(new Promise((_, reject) => (failDelete = reject)) as never);
    render(<DeletePackagingUnitModal row={row} closeModal={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'No longer dispensed');
    await user.click(screen.getByRole('button', { name: /yes/i }));

    expect(screen.getByRole('button', { name: /yes/i })).toBeDisabled();

    await act(async () => failDelete(new Error('Server error')));

    expect(screen.getByRole('button', { name: /yes/i })).toBeEnabled();
  });
});
