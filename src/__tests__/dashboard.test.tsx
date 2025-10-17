import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as dashboardService from '@services/dashboard';
import { useGetDashboard } from '@hooks/services';

const mockData = [{
    "participantName": "wallet2",
    "description": "wallet 2",
    "currency": "LRD",
    "balance": -101646.59,
    "currentPosition": -22.00,
    "ndcPercent": "-",
    "ndc": 50000.00,
    "ndcUsed": -0.04,
    "participantSettlementCurrencyId": 8,
    "participantPositionCurrencyId": 7,
    "isActive": true
}];

jest.spyOn(dashboardService, 'getParticipantPositionList').mockResolvedValue(mockData);

const wrapper = ({ children }: any) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useGetDashboard', () => {
    it('returns dashboard data', async () => {
        const { result } = renderHook(() => useGetDashboard(), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });
});