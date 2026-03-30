import {
  Button, FormControl, FormErrorMessage, FormLabel, Heading,
  Stack,
  VStack, SimpleGrid,
  useToast,
  Box
} from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { ManagementSummaryReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateManagementSummaryReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type IManagementSummaryReport } from '@typescript/form/report'

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone'
import { useMemo, useEffect, memo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from "react-redux";
import { RootState } from "@store";
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from "@helpers/errors";
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';

const managementSummaryReportHelper = new ManagementSummaryReportHelper()
const initialFileName = 'ManagementSummaryReport'

const ManagementSummaryReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const { t } = useTranslation();
  const [runButtonState, setRunButtonState] = useState(true);
  // Redux
  const user = useGetUserState()
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const onDownloadChangeHandler = (e: any) => {
    start()

    const formData = getValues();
    const fileType = formData.fileType;

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    let tzOffSet: string = moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateManagementSummaryReport(user, {
      startDate: StartDate,
      endDate: EndDate,
      timezoneOffset: tzOffSet,
      fileType: fileType,
    })
      .then((res: any) => {
        if (res?.rptByte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.rptByte)
        } else {
          showDataNotFound(toast);
        }
      }).catch((error: IApiErrorResponse) => {
        if (error.error_code === REPORT_NOT_FOUND_ERROR) {
          showDataNotFound(toast);
          return;
        } else {
          toast({
            position: 'top',
            description: getErrorMessage(error) || t('ui.failed_to_download'),
            status: 'error',
            isClosable: true,
            duration: 3000
          });
        }
      }).finally(() => {
        setRunButtonState(true);
        complete()
      })
  }

  const { control, trigger, setValue, getValues, formState: { errors, isValid } } = useForm<IManagementSummaryReport>({
    resolver: zodResolver(managementSummaryReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      fileType: 'xlsx'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  return (

    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
{t('ui.management_summary_report')}
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.startDate)} pb="1">
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange, onBlur } }) => {
                return (
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('endDate');
                    }}
                    onBlur={onBlur}
                  />
                );
              }}
              name="startDate"
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.endDate)} pb="1">
            <FormLabel>{t('ui.end_date')}</FormLabel>
            <Controller
              control={control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error }
              }) => {
                return (
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('startDate');
                    }}
                    onBlur={onBlur}
                  />
                );
              }}
              name="endDate"
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl w="100%" mt={8}>
            <Controller
              control={control}
              name="fileType"
              render={({ field }) => (
                <CustomSelect
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'xlsx', label: 'XLSX' },
                  ]}
                  value={
                    field
                      ? {
                        value: field.value,
                        label: field.value.toUpperCase(),
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder={t('ui.choose_format')}
                />
              )}
            />
          </FormControl>

        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">

          <Box />
          <Box />
          <Box />
          <FormControl w="100%"
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
          >
            <Button
              flex={{ base: '1', md: '0 0 50%' }}
              colorScheme="blue"
              isDisabled={!isValid || !runButtonState}
              onClick={onDownloadChangeHandler}
              w={{ base: "100%", sm: "auto" }}
            >{t('ui.download')}</Button>
          </FormControl>
        </SimpleGrid>
      </Stack>
    </VStack >
  );
};

export default memo(ManagementSummaryReport)
