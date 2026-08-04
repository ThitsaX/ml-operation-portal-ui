// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Badge,
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { type ITimezoneOption } from 'react-timezone-select';
import { Column, CellProps, useSortBy, useTable } from 'react-table';
import { FaRegEdit } from 'react-icons/fa';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  RevenueCard,
  RevenuePageShell,
  RevenueSearchInput,
  RevenueTableContainer,
  RevenueToolbar
} from '@pages/RevenueSharing/components';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { useGetRevenuePartyList } from '@hooks/services/revenue-sharing';
import {
  createRevenueParty,
  modifyRevenueParty,
  modifyRevenuePartyStatus
} from '@services/revenue-sharing';
import { type RootState } from '@store';
import {
  type IApiErrorResponse,
  type IRevenueParty,
  type IRevenuePartyFormValues,
  type RevenuePartyStatus,
  type RevenuePartyType
} from '@typescript/services';

const PARTY_TYPES: Array<{ label: string; value: RevenuePartyType }> = [
  { label: 'Responsible Ministry', value: 'Responsible Ministry' },
  { label: '3rd Party', value: '3rd Party' }
];

const EMPTY_FORM: IRevenuePartyFormValues = {
  revenuePartyId: '',
  partyCode: '',
  partyName: '',
  partyType: 'Responsible Ministry',
  description: '',
  status: 'ACTIVE'
};


const getRevenuePartyId = (party: IRevenueParty) => party.revenuePartyId || '';

const getPartyCode = (party: IRevenueParty) => party.partyCode || party.partyId || '';

const getPartyName = (party: IRevenueParty) => party.partyName || party.name || '';

const getPartyType = (party: IRevenueParty) => party.partyType || party.type || '';

const getPartyDescription = (party: IRevenueParty) => party.description || '';

const getPartyRecordField = (party: IRevenueParty, fieldNames: string[]) => {
  const record = party as unknown as Record<string, unknown>;
  const fieldName = fieldNames.find((name) => {
    const value = record[name];
    return value !== undefined && value !== null && value !== '';
  });

  return fieldName ? record[fieldName] : null;
};

const getPartyStatus = (party: IRevenueParty): RevenuePartyStatus | string => {
  const isActiveValue = getPartyRecordField(party, ['isActive', 'active']);

  if (typeof isActiveValue === 'boolean') return isActiveValue ? 'ACTIVE' : 'INACTIVE';
  if (typeof isActiveValue === 'string') {
    const normalized = isActiveValue.toUpperCase();
    if (normalized === 'TRUE') return 'ACTIVE';
    if (normalized === 'FALSE') return 'INACTIVE';
    if (normalized === 'ACTIVE' || normalized === 'INACTIVE') return normalized;
  }

  return party.status || '';
};

const getPartyLastUpdated = (party: IRevenueParty) => getPartyRecordField(party, [
  'lastUpdatedDate',
  'lastUpdateDate',
  'lastUpdatedAt',
  'updatedAt',
  'updatedDate',
  'modifiedAt',
  'modifiedDate',
  'respondedDate',
  'respondedAt',
  'createdAt',
  'createdDate'
]) as string | number | null;

const getPartyModifiedBy = (party: IRevenueParty) => {
  const value = getPartyRecordField(party, [
    'modifiedBy',
    'updatedBy',
    'lastUpdatedBy',
    'createdBy',
    'maker',
    'makerId',
    'username',
    'userName'
  ]);

  return value ? String(value) : '';
};

const getPartyTypeLabel = (value?: string) => {
  const normalized = value || '';
  const option = PARTY_TYPES.find((type) => type.value === normalized || (type.value === 'Responsible Ministry' && normalized === 'RESPONSIBLE_MINISTRY') || (type.value === '3rd Party' && normalized === 'THIRD_PARTY'));
  if (option) return option.label;
  return normalized.replace(/_/g, ' ') || '-';
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return { bg: 'green.50', color: 'green.700' };
    case 'INACTIVE':
      return { bg: 'red.50', color: 'red.700' };
    default:
      return { bg: 'gray.100', color: 'gray.700' };
  }
};

const formatDate = (value?: string | number | null) => {
  if (!value) return '-';
  if (typeof value === 'string') return value.split('T')[0].split(' ')[0];
  const timestamp = value < 10000000000 ? value * 1000 : value;
  return new Date(timestamp).toISOString().split('T')[0];
};

const PartyRegistry = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>((state) => state.app.selectedTimezone);
  const selectedTZString = selectedTimezone.value;
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formValues, setFormValues] = useState<IRevenuePartyFormValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetRevenuePartyList({
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (isError) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_fetch_revenue_parties'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [error, isError, t, toast]);

  const parties = useMemo(() => data || [], [data]);

  const filteredParties = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return parties;

    return parties.filter((party) =>
      [getPartyCode(party), getPartyName(party), getPartyTypeLabel(getPartyType(party)), getPartyDescription(party), getPartyStatus(party), getPartyModifiedBy(party)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [parties, search]);

  const closeModal = () => {
    setIsOpen(false);
    setFormValues(EMPTY_FORM);
    setIsEdit(false);
  };

  const openCreateModal = () => {
    setFormValues(EMPTY_FORM);
    setIsEdit(false);
    setIsOpen(true);
  };

  const openEditModal = (party: IRevenueParty) => {
    setFormValues({
      revenuePartyId: getRevenuePartyId(party),
      partyCode: getPartyCode(party),
      partyName: getPartyName(party),
      partyType: getPartyTypeLabel(getPartyType(party)),
      description: getPartyDescription(party),
      status: (getPartyStatus(party) as RevenuePartyStatus) || 'ACTIVE'
    });
    setIsEdit(true);
    setIsOpen(true);
  };

  const saveParty = async () => {
    if (!formValues.partyCode.trim() || !formValues.partyName.trim()) {
      toast({
        position: 'top',
        description: t('ui.party_id_and_name_are_required'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        await modifyRevenueParty({
          revenuePartyId: formValues.revenuePartyId || '',
          partyCode: formValues.partyCode,
          partyName: formValues.partyName,
          partyType: formValues.partyType,
          description: formValues.description
        });
      } else {
        await createRevenueParty({
          partyCode: formValues.partyCode,
          partyName: formValues.partyName,
          partyType: formValues.partyType,
          description: formValues.description,
          status: formValues.status
        });
      }

      toast({
        position: 'top',
        description: isEdit
          ? t('ui.revenue_party_updated_successfully')
          : t('ui.revenue_party_created_successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      closeModal();
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_save_revenue_party'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (party: IRevenueParty, checked: boolean) => {
    const nextStatus: RevenuePartyStatus = checked ? 'ACTIVE' : 'INACTIVE';

    try {
      await modifyRevenuePartyStatus({
        revenuePartyId: getRevenuePartyId(party),
        status: nextStatus
      });
      toast({
        position: 'top',
        description: t('ui.revenue_party_status_updated_successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_update_revenue_party_status'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const columns = useMemo<Column<IRevenueParty>[]>(() => [
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.party_id')}</Text>,
      id: 'partyCode',
      accessor: (party) => getPartyCode(party),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.name')}</Text>,
      id: 'partyName',
      accessor: (party) => getPartyName(party),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => (
        <Text color="gray.700" textAlign="left">{value || '-'}</Text>
      )
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.type')}</Text>,
      id: 'partyType',
      accessor: (party) => getPartyType(party),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => {
        const isThirdParty = value === 'THIRD_PARTY' || value === '3rd Party';
        return (
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            textTransform="none"
            bg={isThirdParty ? 'purple.100' : 'green.50'}
            color={isThirdParty ? 'purple.700' : 'green.700'}
            fontSize="xs"
            fontWeight="bold"
          >
            {getPartyTypeLabel(value)}
          </Badge>
        );
      }
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.status')}</Text>,
      id: 'status',
      accessor: (party) => getPartyStatus(party),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => {
        const statusStyle = getStatusColor(value);
        return (
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            textTransform="none"
            bg={statusStyle.bg}
            color={statusStyle.color}
            fontSize="xs"
            fontWeight="bold"
          >
            {value === 'ACTIVE' ? t('ui.active') : value === 'INACTIVE' ? t('ui.inactive') : value || '-'}
          </Badge>
        );
      }
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.last_updated_date')}</Text>,
      id: 'lastUpdatedDate',
      accessor: (party) => formatEpochToTZ(getPartyLastUpdated(party) || '', selectedTZString),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.modified_by')}</Text>,
      id: 'modifiedBy',
      accessor: (party) => getPartyModifiedBy(party),
      Cell: ({ value }: CellProps<IRevenueParty, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.action')}</Text>,
      id: 'action',
      disableSortBy: true,
      Cell: ({ row }: CellProps<IRevenueParty>) => (
        <HStack justify="center" spacing={3}>
          <Tooltip label={t('ui.edit')} placement="top">
            <IconButton
              aria-label={t('ui.edit')}
              icon={<FaRegEdit />}
              size="sm"
              variant="ghost"
              onClick={() => openEditModal(row.original)}
              isDisabled={!hasActionPermission("ModifyRevenueParty")}
            />
          </Tooltip>
          <Switch
            colorScheme="green"
            size="sm"
            isChecked={getPartyStatus(row.original) === 'ACTIVE'}
            onChange={(event) => toggleStatus(row.original, event.target.checked)}
            isDisabled={!hasActionPermission("ModifyRevenuePartyStatus")}
          />
        </HStack>
      )
    }
  ], [selectedTZString, t]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: filteredParties,
      autoResetSortBy: false
    },
    useSortBy
  );

  const isTableLoading = isLoading || isFetching;
  const isPartyFormValid = Boolean(
    formValues.partyCode.trim() &&
    formValues.partyName.trim() &&
    formValues.partyType &&
    (isEdit || formValues.status)
  );

  return (
    <RevenuePageShell title={t('ui.party_registry')}>
      <RevenueCard
        title={t('ui.registered_parties')}
        description={t('ui.registered_parties_description')}
      >
        <RevenueToolbar
          action={
            hasActionPermission("CreateRevenueParty") ? (
              <Button colorScheme="blue" onClick={openCreateModal}>{t('ui.add_party')}</Button>
            ) : null
          }
        >
          <RevenueSearchInput
            value={search}
            placeholder={t('ui.search_parties')}
            onChange={setSearch}
          />
        </RevenueToolbar>

        <RevenueTableContainer>
            <Table variant="simple" {...getTableProps()}>
              <Thead bg="gray.100">
                {headerGroups.map((headerGroup) => {
                  const headerGroupProps = headerGroup.getHeaderGroupProps();
                  const { key: headerGroupKey, ...headerGroupRest } = headerGroupProps;

                  return (
                    <Tr key={headerGroupKey} {...headerGroupRest}>
                      {headerGroup.headers.map((column) => {
                        const headerProps = column.getHeaderProps(
                          column.disableSortBy ? undefined : column.getSortByToggleProps()
                        );
                        const { key: headerKey, ...headerRest } = headerProps;

                        return (
                          <Th key={headerKey} px={3} textAlign="center" textTransform="none" borderColor="gray.100" {...headerRest}>
                            <HStack align="center" justify="center" spacing="2">
                              {column.render('Header')}
                              {column.disableSortBy ? null : (
                                <VStack display="inline-flex" align="center" spacing={0}>
                                  <Icon as={IoChevronUp} color={!column.isSorted ? 'gray.400' : !column.isSortedDesc ? 'gray.700' : 'gray.400'} />
                                  <Icon as={IoChevronDown} color={!column.isSorted ? 'gray.400' : column.isSortedDesc ? 'gray.700' : 'gray.400'} />
                                </VStack>
                              )}
                            </HStack>
                          </Th>
                        );
                      })}
                    </Tr>
                  );
                })}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {isTableLoading ? (
                  <Tr>
                    <Td colSpan={columns.length} py={12}>
                      <Center>
                        <VStack spacing={3}>
                          <Spinner color="blue.500" />
                          <Text color="gray.600" fontSize="sm">{t('ui.loading_revenue_parties')}</Text>
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                ) : rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} py={10} textAlign="center" color="gray.600">
                      {t('ui.no_revenue_parties_found')}
                    </Td>
                  </Tr>
                ) : (
                  rows.map((row) => {
                    prepareRow(row);
                    const rowProps = row.getRowProps();
                    const { key: rowKey, ...rowRest } = rowProps;

                    return (
                      <Tr key={rowKey} fontSize="sm" _hover={{ bg: 'muted.50' }} {...rowRest}>
                        {row.cells.map((cell) => {
                          const cellProps = cell.getCellProps();
                          const { key: cellKey, ...cellRest } = cellProps;

                          return (
                            <Td key={cellKey} py={2} px={3} textAlign="center" borderColor="gray.100" {...cellRest}>
                              {cell.render('Cell')}
                            </Td>
                          );
                        })}
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
        </RevenueTableContainer>
      </RevenueCard>

      <Modal isOpen={isOpen} onClose={closeModal} size="lg">
        <ModalOverlay bg="blackAlpha.500" />
        <ModalContent rounded="xl" boxShadow="2xl">
          <ModalHeader pb={3}>{isEdit ? t('ui.edit_party') : t('ui.add_party')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>{t('ui.party_id')}</FormLabel>
                <Input
                  value={formValues.partyCode}
                  isDisabled={isEdit}
                  onChange={(event) => setFormValues((current) => ({ ...current, partyCode: event.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{t('ui.type')}</FormLabel>
                <Select
                  value={formValues.partyType}
                  onChange={(event) => setFormValues((current) => ({ ...current, partyType: event.target.value }))}
                >
                  {PARTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Full name</FormLabel>
                <Input
                  value={formValues.partyName}
                  onChange={(event) => setFormValues((current) => ({ ...current, partyName: event.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('ui.description')}</FormLabel>
                <Input
                  value={formValues.description}
                  onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
                />
              </FormControl>
              {!isEdit && (
                <FormControl isRequired>
                  <FormLabel>{t('ui.status')}</FormLabel>
                  <Select
                    value={formValues.status}
                    onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as RevenuePartyStatus }))}
                  >
                    <option value="ACTIVE">{t('ui.active')}</option>
                    <option value="INACTIVE">{t('ui.inactive')}</option>
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModal}>{t('ui.cancel')}</Button>
            <Button colorScheme="blue" onClick={saveParty} isLoading={isSaving} isDisabled={!isPartyFormValid}>
              {isEdit ? t('ui.update') : t('ui.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </RevenuePageShell>
  );
};

export default PartyRegistry;
