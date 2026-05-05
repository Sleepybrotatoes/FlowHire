import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('FlowHire Backend API');
});

// TODO: Add routes for jobs, candidates, applications, etc.

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});