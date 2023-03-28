const express = require('express');
const axios = require('axios');
const apicache = require('apicache');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors( { origin: ['https://aravindnatch.me'] } ));
const cache = apicache.middleware;

const refreshToken = process.env.refresh_token
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

const getCurrentTrack = async (token) => {
  const options = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: { Authorization: `Bearer ${token}` },
  };

  try {
    const { data } = await axios(options);
    return data.item;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const cacheMiddleware = cache('1 minute');

app.get('/spotify/current', cacheMiddleware, async (_req, res) => {
  const token = await getToken();
  const track = await getCurrentTrack(token);

  if (track) {
    res.json(track);
  } else {
    res.send(null);
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
