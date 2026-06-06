import { useState } from "react";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Alert,
    CircularProgress,
} from "@mui/material";
import { SaveTransaction } from "../../wailsjs/go/main/App";

const categoryOptions = [
    "Food",
    "Transport",
    "Entertainment",
    "Utilities",
    "Misc",
];

export function InsertTranscation() {
    const [category, setCategory] = useState("");
    const [transactionType, setTransactionType] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleCategoryChange = (event) => {
        setCategory(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Clear previous messages
        setSuccessMessage("");
        setErrorMessage("");

        // Validation
        if (!category || !transactionType || !amount) {
            setErrorMessage("Please fill in all fields");
            return;
        }

        const numAmount = Number(amount);
        if (numAmount <= 0) {
            setErrorMessage("Amount must be greater than 0");
            return;
        }

        setLoading(true);

        try {
            const result = await SaveTransaction(category, transactionType, numAmount);
            
            setSuccessMessage(
                `Transaction saved successfully! ID: ${result.id}`
            );
            
            // Clear form
            setCategory("");
            setTransactionType("");
            setAmount("");

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setErrorMessage(`Error saving transaction: ${err.message}`);
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                width: "100%",
                maxWidth: 480,
                mx: "auto",
                px: 2,
                py: 3,
                backgroundColor: "background.paper",
                borderRadius: 2,
                boxShadow: 1,
            }}
        >
            <Typography variant="h5" component="h2" gutterBottom>
                Insert Transaction
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            <Stack spacing={2}>
                <FormControl fullWidth>
                    <InputLabel id="transaction-category-label">Category</InputLabel>
                    <Select
                        labelId="transaction-category-label"
                        id="transaction-category"
                        value={category}
                        label="Category"
                        onChange={handleCategoryChange}
                        disabled={loading}
                    >
                        {categoryOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="Transaction Description"
                    value={transactionType}
                    onChange={(event) => setTransactionType(event.target.value)}
                    placeholder="e.g. Grocery, Taxi, Movie"
                    variant="outlined"
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    variant="outlined"
                    disabled={loading}
                />

                <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Saving..." : "Add Transaction"}
                </Button>
            </Stack>
        </Box>
    );
}
