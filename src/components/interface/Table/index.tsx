import {
    Td,
    Th,
} from '@chakra-ui/react';

export const Cell = ({ borderColor, ...props }: any) => (
    <Td border={`1px solid ${borderColor}`} px={4} py={2} textAlign="center" {...props} />
);


export const HeaderCell = ({ borderColor, ...props }: any) => (
    <Th border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold" textAlign="center" {...props} />
);