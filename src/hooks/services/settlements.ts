import {
    getUserListByParticipant, getRoleListByParticipant, getOrganizationListByParticipant, getContactList, getParticipantProfile,
    getParticipantCurrencyList, getHubCurrency, getLiquidityProfileList, getParticipantList
} from '@services/participant'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import {
    type IApiErrorResponse, type IParticipantUser,
} from '@typescript/services'
import { ISettlementWindow, IFinalizeSettlement } from '@typescript/services'
import { getSettlementWindowsList, getFinalizeSettlementList } from '@services/settlements'

export const useGetFinalizeSettlementList = (
    options?: UseQueryOptions<IFinalizeSettlement[],
        IApiErrorResponse
    >
) =>
    useQuery<IFinalizeSettlement[], IApiErrorResponse>({
        queryKey: ['getFinalizeSettlementList'],
        queryFn: getFinalizeSettlementList,
        ...options
    })

export const useGetSettlementWindowList = (
    options?: UseQueryOptions<ISettlementWindow[],
        IApiErrorResponse
    >
) =>
    useQuery<ISettlementWindow[], IApiErrorResponse>({
        queryKey: ['getSettlementWindowsList'],
        queryFn: getSettlementWindowsList,
        ...options
    })