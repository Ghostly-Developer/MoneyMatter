import { useState } from 'react';
import './App.css';
import { Box, Button, Stack } from '@mui/material';
import { InsertTranscation } from './components/InsertTranscation';
import { ViewTranscation } from './components/ViewTranscation';

function App() {
    const [page, setPage] = useState('add');

    return (
        <div id="App" className='Dark'>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    variant={page === 'add' ? 'contained' : 'outlined'}
                    onClick={() => setPage('add')}
                >
                    Add Transaction
                </Button>
                <Button
                    variant={page === 'view' ? 'contained' : 'outlined'}
                    onClick={() => setPage('view')}
                >
                    View Transaction
                </Button>
            </Box>

            <Box sx={{ p: 2 }}>
                {page === 'add' ? <InsertTranscation /> : <ViewTranscation />}
            </Box>
        </div>
    );
}

export default App;
