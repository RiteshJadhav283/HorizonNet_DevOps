require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('./models/Station');

const sampleStations = [
  {
    name: "Station Alpha-7",
    type: "ground_station",
    location: "Reykjavik, Iceland",
    status: "online",
    signalStrength: 95
  },
  {
    name: "Svalbard Ground Terminal",
    type: "ground_station",
    location: "Svalbard, Norway",
    status: "online",
    signalStrength: 98
  },
  {
    name: "Horizon-1 Communications Satellite",
    type: "satellite",
    location: "Geostationary Orbit 35.8° E",
    status: "online",
    signalStrength: 82
  },
  {
    name: "Station Beta-3",
    type: "ground_station",
    location: "McMurdo Station, Antarctica",
    status: "maintenance",
    signalStrength: 45
  },
  {
    name: "Aura Earth Observer",
    type: "satellite",
    location: "Sun-Synchronous Orbit",
    status: "offline",
    signalStrength: 0
  },
  {
    name: "Station Gamma-9",
    type: "ground_station",
    location: "Hartebeesthoek, South Africa",
    status: "online",
    signalStrength: 88
  },
  {
    name: "StellarLink-12",
    type: "satellite",
    location: "Low Earth Orbit 550km",
    status: "online",
    signalStrength: 91
  },
  {
    name: "Station Delta-2",
    type: "ground_station",
    location: "Perth, Australia",
    status: "maintenance",
    signalStrength: 60
  },
  {
    name: "Aeolus Wind Satellite",
    type: "satellite",
    location: "Low Earth Orbit 320km",
    status: "online",
    signalStrength: 76
  }
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/horizonnet';
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    event: 'db_seed_start',
    mongoUri
  }));

  try {
    await mongoose.connect(mongoUri);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'db_seed_connected'
    }));

    // Clear existing data
    await Station.deleteMany({});
    
    // Seed new data
    const inserted = await Station.insertMany(sampleStations);
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'db_seed_success',
      count: inserted.length
    }));

    process.exit(0);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'db_seed_failure',
      error: error.message
    }));
    process.exit(1);
  }
}

seed();
