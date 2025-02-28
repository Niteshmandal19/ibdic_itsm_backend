require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const orgRoutes = require('./routes/orgRoutes')
const ticketTypesRoutes = require('./routes/ticketTypes');
const productRoutes = require('./routes/productRoutes');
const index = require('./routes/levelManagementRoutes')
const sftpRoutes = require('./routes/sftpRoutes')
const commentRoutes = require('./routes/commentRoutes');
const filterRoutes = require('./routes/filterRoutes');
const fileRoutes = require('./routes/fileRoutes')



// const level_issueTypeRoutes = require("./routes/levels_issueTypeRoutes");
// const level_requestTypeRoutes = require("./routes/levels_requestTypeRoutes");





const app = express();
const corsOptions = {
  origin: 'http://localhost:5173', // Replace with your React app's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/organization', orgRoutes);
app.use('/api/tickets', ticketTypesRoutes);
app.use( '/api/products', productRoutes);
app.use( '/api/sftp', sftpRoutes);
app.use('/api', commentRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/files', fileRoutes);

// app.use(level_issueTypeRoutes);
// app.use(level_requestTypeRoutes);

app.use('/api/index', index)


// Database connection and sync
const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync({ 
      // alter: true // Uncomment this in development to auto-modify tables
    });
    console.log('Database models synchronized');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
};

startServer();
