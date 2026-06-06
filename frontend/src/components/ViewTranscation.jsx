import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { GetTransactions } from '../../wailsjs/go/main/App';

const categoryOptions = [
    'All',
    'Food',
    'Transport',
    'Entertainment',
    'Utilities',
    'Misc',
];

export function ViewTranscation() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const loadTransactions = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await GetTransactions();
                setTransactions(result || []);
            } catch (err) {
                console.error(err);
                setError(err?.message || 'Unable to load transactions.');
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, [refreshKey]);

    const filteredTransactions = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        return transactions.filter((transaction) => {
            const categoryMatches =
                categoryFilter === 'All' || transaction.category === categoryFilter;

            const searchMatches =
                !searchTerm ||
                transaction.category?.toLowerCase().includes(searchTerm) ||
                transaction.type?.toLowerCase().includes(searchTerm) ||
                String(transaction.amount)?.toLowerCase().includes(searchTerm) ||
                new Date(transaction.created_at)
                    .toLocaleString()
                    .toLowerCase()
                    .includes(searchTerm);

            return categoryMatches && searchMatches;
        });
    }, [transactions, search, categoryFilter]);

    const totalExpense = filteredTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount || 0),
        0
    );

    return (
        <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                    <Typography variant="h5" component="h2">
                        View Transactions
                    </Typography>
                    <Button variant="contained" onClick={() => setRefreshKey((key) => key + 1)}>
                        Refresh
                    </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                    <TextField
                        label="Filter by text or amount"
                        placeholder="Search category, description, date, or amount"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        fullWidth
                        InputLabelProps={{ style: { color: '#ffffffcc' } }}
                        sx={{
                            input: { color: '#ffffff' },
                            '.MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.23)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.87)',
                            },
                        }}
                    />
                    <FormControl
                        sx={{
                            minWidth: 180,
                            '& .MuiInputLabel-root': { color: '#ffffffcc' },
                            '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.23)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.5)',
                                },
                            },
                            '& .MuiSvgIcon-root': { color: '#ffffffcc' },
                        }}
                    >
                        <InputLabel id="category-filter-label">Category</InputLabel>
                        <Select
                            labelId="category-filter-label"
                            value={categoryFilter}
                            label="Category"
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            sx={{ color: '#ffffff' }}
                        >
                            {categoryOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No transactions match your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{transaction.id}</TableCell>
                                            <TableCell>{transaction.category}</TableCell>
                                            <TableCell>{transaction.type}</TableCell>
                                            <TableCell align="right">
                                                {Number(transaction.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(transaction.created_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Typography fontWeight="bold">Total Expense</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight="bold">{totalExpense.toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                )}
            </Stack>
        </Box>
    );
}
