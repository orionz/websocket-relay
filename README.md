
### Simple WebSocket Relay Server

This is intended to be a very simple websocket relay server to allow two programs to connect to each other.  Given a known common secret each side connects to

```javascript
  const ws = new WebSocket(`ws://${host}/connect/${secret}`);
```

and any messages sent over the websocket will be sent to (or queued until peer connect) to the other peer connecting to the same URL.  If a third websocket it opened on the same URL it will receive an error 409.

This app should be deployable as-is to Heroku

