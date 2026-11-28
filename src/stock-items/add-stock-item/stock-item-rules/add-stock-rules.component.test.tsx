import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockWorkspace2Props } from '@mocks';

vi.mock('./stock-rules.resource', () => ({ createOrUpdateStockRule: vi.fn() }));
vi.mock('../../stock-items.resource', () => ({
  useStockItemPackagingUOMs: () => ({ items: { results: [] } }),
}));
vi.mock('../../../stock-lookups/stock-lookups.resource', () => ({
  useRoles: () => ({ items: { results: [] } }),
  useStockTagLocations: () => ({ stockLocations: [{ id: 'location-uuid', name: 'Main pharmacy' }] }),
}));
vi.mock('../../../utils', () => ({ useHandleMutate: () => vi.fn() }));

import { createOrUpdateStockRule } from './stock-rules.resource';
import StockRulesAddOrUpdate from './add-stock-rules.component';

describe('StockRulesAddOrUpdate', () => {
  it('disables location changes while editing a stock rule', () => {
    render(
      <StockRulesAddOrUpdate
        {...mockWorkspace2Props({
          model: {
            uuid: 'rule-uuid',
            stockItemUuid: 'item-uuid',
            name: 'Low stock alert',
            description: '',
            locationUuid: 'location-uuid',
            locationName: 'Main pharmacy',
            enabled: true,
            stockItemPackagingUOMUuid: 'packaging-uom-uuid',
            packagingUomName: 'Box',
            lastEvaluation: new Date('2025-01-01T00:00:00Z'),
            nextEvaluation: new Date('2025-01-02T00:00:00Z'),
            lastActionDate: new Date('2025-01-01T00:00:00Z'),
            permission: {
              canView: true,
              canEdit: true,
              canApprove: false,
              canReceiveItems: false,
              canDisplayReceivedItems: false,
              isRequisitionAndCanIssueStock: false,
              canUpdateBatchInformation: false,
            },
            enableDescendants: false,
          },
        })}
      />,
    );

    expect(screen.getByRole('combobox', { name: /location/i })).toBeDisabled();
  });

  it('disables Save until the save finishes', async () => {
    const user = userEvent.setup();
    let failSave: (error: Error) => void;
    vi.mocked(createOrUpdateStockRule).mockReturnValue(new Promise((_, reject) => (failSave = reject)) as never);
    render(<StockRulesAddOrUpdate {...mockWorkspace2Props({ stockItemUuid: 'item-uuid' })} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();

    await act(async () => failSave(new Error('Server error')));

    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
  });
});
