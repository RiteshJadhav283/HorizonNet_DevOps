const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const requireAuth = require('../middleware/requireAuth');

// Protected route to fetch all stations
router.get('/', requireAuth, async (req, res) => {
  try {
    const stations = await Station.find({});
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'stations_fetched',
      count: stations.length
    }));

    res.json(stations);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'stations_fetch_error',
      error: error.message
    }));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Protected route to update station status
router.post('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const validStatuses = ['online', 'offline', 'maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    const oldStatus = station.status;
    station.status = status;
    station.lastPing = new Date();
    await station.save();

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'status_changed',
      stationId: id,
      oldStatus: oldStatus,
      newStatus: status
    }));

    res.json(station);
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'status_change_error',
      stationId: id,
      error: error.message
    }));
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
