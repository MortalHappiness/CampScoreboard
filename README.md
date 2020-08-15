# CampScoreboard

Scoreboard for the game "Monopoly" for NTUEE orientation camp 2020.

## Demo

### [The demo video](https://mortalhappiness.github.io/CampScoreboard/)

### Screenshot (Click to see the demo video)

[![demo image](/demo/demo.png)](https://mortalhappiness.github.io/CampScoreboard/)

## Usage

After cloning this repo, make sure you have nodeJS, mongo, and Redis installed.

Prepare environment variables (or write it into `.env` file)
The following is an example environment variables setup.

```
EXTEND_ESLINT=true
HTTPS=true
SSL_CRT_FILE=.cert/localhost.crt
SSL_KEY_FILE=.cert/localhost.key
MONGO_HOST=localhost
MONGO_DB_NAME=camp-scoreboard
REDIS_HOST=localhost
SESSION_PREFIX=camp-scoreboard-session:
REACT_APP_PROXY_TARGET=https://localhost:8000
```

Run the following command:

```sh
npm install
npm run reset-db
```

### Development

```sh
npm run develop  # start the proxy server
```

```sh
npm start        # start the frontend server
```

### Production

```sh
npm run build
npm run serve
```

## Used packages

### Frontend

create-react-app, redux, react-router-dom, material-ui, clsx, date-fns

### Backend

express, mongoose, redis, bcrypt, yargs

### Other

socket.io, dotenv, nodemon, eslint, prettier, lint-staged

## Contribution

This is the first frontend + backend project done only by myself, any advice, issues, and pull requests are welcomed!
