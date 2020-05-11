# Weather App
A simple weather PWA using the Dark Sky and LocationIQ APIs.  
I know that the Dark Sky API will be shut down next year and before then, I will transition to a different API.
## Secrets
Create a `secret.php` file in the `api` directory. It should be structured like so:
```
<?php
    $geocode_token = "<YOUR LOCATIONIQ TOKEN>";
    $secret_referrer = "<YOUR LOCATIONIQ SECRET REFERRER>";
    $weather_token = "<YOUR DARK SKY TOKEN>";
?>
```
## Requirements
You will need to `npm install skycons-ts` and download [`skycons.js`](https://github.com/darkskyapp/skycons/blob/master/skycons.js) and put it in the `scripts` directory