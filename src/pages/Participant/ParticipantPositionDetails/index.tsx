import { VStack, Heading} from '@chakra-ui/react';
import LiquidityProfile from '@components/interface/LiquidityProfile';
import OrganizationProfile from '@components/interface/OrganizationProfile';
import BusinessContact from '@components/interface/BusinessContact';
import { useLocation, useParams } from 'react-router-dom';


const ParticipantPositionDetails = () => {

    const { dfspId } = useParams<{ dfspId: string }>();
    const location = useLocation();
    const { participantId } = location.state || {};
    return (
        <VStack align="flex-start" w="full" h="full" p="3" spacing={6} mt={10}>
            <Heading fontSize="2xl" fontWeight="bold" mb={6}>{dfspId}</Heading>

            <OrganizationProfile participantId={participantId} />
            <BusinessContact participantId={participantId} />
            <LiquidityProfile participantId={participantId} />

        </VStack>
    );
};

export default ParticipantPositionDetails;
