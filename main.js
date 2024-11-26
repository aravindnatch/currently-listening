const express = require('express');
const axios = require('axios');
const apicache = require('apicache');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const { CronJob } = require('cron');

dotenv.config();

const app = express();
app.use(cors({ origin: ['https://aravindnatch.me', 'http://localhost:3000'] }));
const cache = apicache.middleware;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './tracks.db',
  logging: false,
});

const Play = sequelize.define('Play', {
  played_at: {
    type: DataTypes.DATE,
    unique: true,
  },
  data: DataTypes.JSON,
});

sequelize.sync();

const refreshToken = process.env.refresh_token;
const clientId = process.env.client_id;
const clientSecret = process.env.client_secret;

const getToken = async () => {
  const authOptions = {
    method: 'POST',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    params: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  };

  const { data } = await axios(authOptions);
  return data.access_token;
};

const getRecentlyPlayedTracks = async (token) => {
  try {
    const { data } = await axios.get("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (data && data.items) {
      for (const item of data.items) {
        const playedAt = new Date(item.played_at);

        await Play.findOrCreate({
          where: { played_at: playedAt },
          defaults: { data: item },
        });
      }
    }
  } catch (err) {
    console.error(err)
  }
};

const job = new CronJob('0 * * * *', async () => {
  const token = await getToken();
  await getRecentlyPlayedTracks(token);
});

job.start();

app.get('/', (_req, res) => {
  res.redirect('https://aravindnatch.me');
});

app.get('/spotify/current', cache('5 seconds'), async (_req, res) => {
  const token = await getToken();

  try {
    const { data } = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data && data.item) {
      res.json(data);
      return;
    }
    res.send(null);
  } catch (err) {
    console.error(err.message);

    const errorResponse = err.response ? {
      status: err.response.status,
      statusText: err.response.statusText,
      data: err.response.data,
    } : 'Internal server error';

    res.status(500).send(errorResponse);
  }
});

app.get('/tracks', async (_req, res) => {
  try {
    const tracks = await Play.findAll({
      order: [['played_at', 'DESC']],
    });

    const response = [];
    tracks.forEach((track) => {
      const { name, artists, album } = track.data.track;
      response.push({
        name,
        artists: artists.map((artist) => artist.name).join(', '),
        album: album.name,
        album_cover: album.images[0].url,
        played_at: track.played_at,
      });
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.listen(33329, () => {
  console.log('Server listening on port 33329');
});
