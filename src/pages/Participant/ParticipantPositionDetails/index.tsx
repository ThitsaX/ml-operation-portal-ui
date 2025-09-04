import {
    VStack,
    Heading,
} from '@chakra-ui/react';
import LiquidityProfile from '@components/interface/LiquidityProfile';
import OrganizationProfile from '@components/interface/OrganizationProfile';
import BusinessContact from '@components/interface/BusinessContact';


const ParticipantPositionDetails = () => {

    return (
        <VStack w="full" align="flex-start" spacing={6} p={4}>
            <Heading size="md">Participant Positions</Heading>

            <OrganizationProfile />
            <BusinessContact />
            <LiquidityProfile />

        </VStack>
    );
};

export default ParticipantPositionDetails;
