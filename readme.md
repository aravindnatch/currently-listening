# currently listening
an express microservice to get my currently listening spotify track

### Run Locally

```bash
# clone the repository
git clone https://github.com/aravindnatch/currently-listening.git

# install the dependencies
npm install

# create and populate .env file
touch .env && \
echo "client_id='<your_client_id>'" > .env && \
echo "client_secret='<your_client_secret>'" >> .env \
echo "refresh_token='<your_spotify_refresh_token>'" >> .env

# start the development server
node main.js
```
