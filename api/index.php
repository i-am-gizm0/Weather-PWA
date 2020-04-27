<?php
    /*
     * Load $geocode_token, $secret_referrer, and $weather_token
     */
    include("secret.php");

    function error($error) {
        echo "{\"error\":\"" . $error . "\"}";
        http_response_code(400);
        die();
    }
    function expandedError($error, $more) {
        echo "{\"error\":\"" . $error . "\",\"more\":\"" . $more . "\"}";
        http_response_code(400);
        die();
    }
    header('Content-Type: text/json');
    if (array_key_exists("a", $_GET)) {
        # It has an action!
        if ($_GET["a"] == "r") {
            # Reverse geocode
            if (array_key_exists("d", $_GET)) {
                $d = base64_decode($_GET["d"]);
                # TODO: Add Regex check for valid data
                $d = explode(",", $d);
                $lat = $d[0];
                $lon = $d[1];

                $ch = curl_init("https://us1.locationiq.com/v1/reverse.php?key=" . $geocode_token . "&lat=" . $lat . "&lon=" . $lon . "&zoom=16&format=json");
                curl_setopt($ch, CURLOPT_REFERER, $secret_referrer);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
                $response = curl_exec($ch);

                if (curl_error($ch) === FALSE || $response === FALSE) {
                    expandedError("ce",curl_error($ch));
                }

                echo $response;

                curl_close($ch);
            } else {
                error("dn");
            }
        } else if ($_GET["a"] == "g") {
            # Geocode
            if (array_key_exists("d", $_GET)) {
                $d = base64_decode($_GET["d"]);
                # TODO: Add Regex check for valid data
                // $d = explode(",", $d);

                $ch = curl_init("https://us1.locationiq.com/v1/search.php?key=" . $geocode_token . "&q=" . $d . "&limit=1&format=json");
                curl_setopt($ch, CURLOPT_REFERER, $secret_referrer);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
                $response = curl_exec($ch);

                if (curl_error($ch) === FALSE || $response === FALSE) {
                    expandedError("ce",curl_error($ch));
                }

                echo $response;

                curl_close($ch);
            } else {
                error("dn");
            }
        } else if ($_GET["a"] == "w") {
            # Get weather
            if (array_key_exists("d", $_GET)) {
                $d = base64_decode($_GET["d"]);
                # TODO: Add Regex check for valid data
                // $d = explode(",", $d);
                // $lat = $d[0];
                // $lon = $d[1];

                $ch = curl_init("https://api.darksky.net/forecast/" . $weathertoken . "/" . $d);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
                $response = curl_exec($ch);

                if (curl_error($ch) === FALSE || $response === FALSE) {
                    expandedError("ce",curl_error($ch));
                }

                echo $response;

                curl_close($ch);
            }
        } else {
            error("au"); # Action Unrecognized
        }
    } else {
        error("an"); # Action Nonexistent
    }
?>