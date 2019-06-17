# lp-freightbot

Based on `shippingMethod`, `portOrigin` and `portDest`, the _lp-freightbot_ endpoint:

1. converts the human readable addresses in `portOrigin` and `portDest` to latitude/longitude, using the google places api
2. based on the `shippingTime` gets the shipping quote from the searates API

___

Base Endpoint: `http://lp-freightbot.herokuapp.com/`

NOTE: all parameters are passed on the URL, and the request must be made doing a `GET` http request

___

Available shippingMethods their parameters

✔: Required

✘: Not required

| shippingMethod | portOrigin | portDest | weight | volume |
| -------------- | ---------- | -------- | ------ | ------ |
|      fcl       |     ✔      |    ✔    |   ✘   |    ✘   |
|      lcl       |     ✔      |    ✔    |   ✔   |    ✔   |
|      rail      |     ✔      |    ✔    |   ✘   |    ✘   |
|      road      |     ✔      |    ✔    |   ✔   |    ✔   |
|      air       |     ✔      |    ✔    |   ✔   |    ✘   |

___

Example of an url request:

http://lp-freightbot.herokuapp.com/lp-freightbot?shippingMethod=fcl&portOrigin=singapore&portDest=rio%20de%20janeiro

---

For reference of how every parameter should be formatted, consult:
https://www.searates.com/reference/platform-api/
