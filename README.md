# CampScoreboard

Scoreboard for the game "Monopoly" for NTUEE orientation camp 2020.

[中文版說明](#chinese)

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

<span id="chinese"></span>
# 中文版說明

2020年台大電機宿營遊戲"大富翁"的計分板。
