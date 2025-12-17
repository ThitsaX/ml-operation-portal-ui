import {
    Box,
    VStack,
    Text,
    Button,
    Tooltip
} from "@chakra-ui/react";

interface SupportCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onClick: () => void;
    color?: string;
    isLoading?: boolean;
    tooltipLabel?: string;
}

export const SupportCard = ({
    icon,
    title,
    description,
    actionLabel,
    onClick,
    color = "blue.700",
    isLoading = false,
    tooltipLabel = ""
}: SupportCardProps) => {


    return (
        <VStack
            flex="1 1 250px"
            maxW="320px"
            minW="300px"
            p={10}
            spacing={8}
            border="1px"
            borderColor="gray.300"
            borderRadius="lg"
            bg="gray.50"
            align="center"
        >
            <Box fontSize="3xl" color="orange.600">
                {icon}
            </Box>
            <Text fontWeight="bold" fontSize="lg">
                {title}
            </Text>
            <Text fontWeight="medium" fontSize="md" textAlign="center" minH="48px">
                {description}
            </Text>
            <Box flex="1">
                <Tooltip label={isLoading ? tooltipLabel : ""} shouldWrapChildren>
                    <Button
                        onClick={onClick}
                        bg={color}
                        color="white"
                        px={4}
                        py={2}
                        borderRadius="md"
                        textAlign="center"
                        isDisabled={isLoading}
                        _hover={!isLoading ? { bg: color.replace(".700", ".800") } : {}}
                    >
                        {actionLabel}
                    </Button>
                </Tooltip>
            </Box>
        </VStack>
    );
};