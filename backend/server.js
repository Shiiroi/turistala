import 'dotenv/config'; // Use this syntax for ESM
import express from 'express';
import cors from 'cors';

// FIX: Import 'getDbClient' instead of 'connectDB'
import { connectDB } from './src/db/db.js'; 

import geographicRouter from './src/routes/geographic.route.js'; // Ensure path is correct

const app = express();
const port = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

app.use('/api/geographic', geographicRouter);

app.get('/', (req, res) => {
    res.send('Turistala API Server Running (ESM Mode)!');
});

app.listen(port, async () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
    
    let db;
    try {
        db = await connectDB.connect(); 
        const result = await db.query('SELECT NOW()'); 
        console.log('✅ Database Health Check: Connection successful!');
        console.log(`   DB Time: ${result.rows[0].now}`);
    } catch (error) {
        console.error('❌ Database Connection FAILED:', error.message);
    } finally {
        if (db) {
            db.release(); 
        }
    }
});