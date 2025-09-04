import {
    Box,
    VStack,
    Text,
    Link,
    Button,
} from "@chakra-ui/react";

interface SupportCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onClick: () => void;
    href?: string;
    color?: string;
}

export const SupportCard = ({
    icon,
    title,
    description,
    actionLabel,
    onClick,
    href,
    color = "blue.700",
}: SupportCardProps) => {
    const ActionComponent = href ? Link : Button;

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
            <Box fontSize="4xl" color="orange.600">
                {icon}
            </Box>
            <Text fontWeight="bold" fontSize="lg">
                {title}
            </Text>
            <Text fontWeight="bold" textAlign="center">
                {description}
            </Text>
            <ActionComponent
                {...(href ? { href, isExternal: true } : { onClick })}
                bg={color}
                color="white"
                px={4}
                py={2}
                borderRadius="md"
                _hover={{ bg: `${color.replace(".700", ".800")}` }}
                textAlign="center"
            >
                {actionLabel}
            </ActionComponent>
        </VStack>
    );
};