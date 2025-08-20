import {
  Button,
  HStack,
  IconButton,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiEdit, FiToggleRight } from 'react-icons/fi';

// Sample data
const usersData = [
  {
    email: 'testuser1@gmail.com',
    name: 'Test User One',
    role: 'DFSP - Admin',
    status: 'Active'
  },
  {
    email: 'testuser2@gmail.com',
    name: 'Test User Two',
    role: 'DFSP - Operation',
    status: 'Active'
  },
  {
    email: 'testuser3@gmail.com',
    name: 'Test User Three',
    role: 'HUB - Admin',
    status: 'Active'
  },
  {
    email: 'testuser4@gmail.com',
    name: 'Test User Four',
    role: 'HUB - Manager',
    status: 'Active'
  },
  {
    email: 'testuser5@gmail.com',
    name: 'Test User Five',
    role: 'HUB - User',
    status: 'Inactive'
  }
];

const ParticipantList = () => {
  const [filterStatus, setFilterStatus] = useState('Active');
  const [filteredUsers, setFilteredUsers] = useState(usersData);

  useEffect(() => {
    const filtered = usersData.filter(user =>
      filterStatus === 'All' ? true : user.status === filterStatus
    );
    setFilteredUsers(filtered);
  }, [filterStatus]);

  return (
    <VStack w="full" align="flex-start" spacing={6} p={4}>
      <Heading size="lg">Participant List</Heading>

      <HStack w="full" justifyContent="space-between">
        <Select
          width="200px"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="All">All</option>
        </Select>

        <Button colorScheme="blue">New User</Button>
      </HStack>

      <TableContainer w="full" border="1px" borderColor="gray.100" rounded="md">
        <Table variant="simple">
          <Thead bg="gray.100">
            <Tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user, index) => (
              <Tr key={index}>
                <Td fontWeight="bold">{user.email}</Td>
                <Td>{user.name}</Td>
                <Td>{user.role}</Td>
                <Td>{user.status}</Td>
                <Td>
                  <HStack spacing={3}>
                    <IconButton
                      icon={<FiEdit />}
                      aria-label="Edit"
                      size="lg"
                      variant="ghost"
                    />
                    <IconButton
                      icon={<FiToggleRight />}
                      aria-label="Toggle"
                      size="sm"
                      variant="outline"
                      colorScheme="green"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
            {filteredUsers.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center">
                  <Text>No users found.</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

    </VStack>
  );
};

export default ParticipantList;
