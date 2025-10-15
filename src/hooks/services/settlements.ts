import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { 
    type IApiErrorResponse,
    ISettlementWindowState,
    ISettlementModel,
    ISettlementState,
} from '@typescript/services';
import { 
    getSettlementWindowStateList, 
    getSettlementModelList, 
    getSettlementStateList 
} from '@services/settlements';


export const useGetSettlementWindowStateList = (
    options?: UseQueryOptions<ISettlementWindowState[], IApiErrorResponse>
) => useQuery<ISettlementWindowState[], IApiErrorResponse>({
        queryKey: ['getSettlementWindowStateList'],
        queryFn: getSettlementWindowStateList,
        ...options
    });

export const useGetSettlementModelList = (
    options?: UseQueryOptions<ISettlementModel[], IApiErrorResponse>
) => useQuery<ISettlementModel[], IApiErrorResponse>({
        queryKey: ['getSettlementModelList'],
        queryFn: getSettlementModelList,
        ...options
    });

export const useGetSettlementStateList = (
    options?: UseQueryOptions<ISettlementState[], IApiErrorResponse>
) => useQuery<ISettlementState[], IApiErrorResponse>({
        queryKey: ['getSettlementStateList'],
        queryFn: getSettlementStateList,
        ...options
    });