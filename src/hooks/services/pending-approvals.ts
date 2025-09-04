import { getAllPendingApprovals } from '@services/pending-approvals'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { type IApiErrorResponse } from '@typescript/services'
import { type IPendingApproval } from '@typescript/services/pending-approvals'

export const useGetPendingApprovalList = (
  options?: UseQueryOptions<IPendingApproval[], IApiErrorResponse>
) =>
  useQuery<IPendingApproval[], IApiErrorResponse>({
    queryKey: ['getAllPendingApprovals'],
    queryFn: getAllPendingApprovals,
    ...options
  })
