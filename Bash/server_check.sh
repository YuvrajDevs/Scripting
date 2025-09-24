#!/bin/bash

SERVERS=("google.com" "github.com" "192.168.1.100")

echo "Pinging Servers ..."

for SERVER in "${SERVERS[@]}"; do
	ping -c 1 -W 1 "$SERVER" &> /dev/null
	
	if [ $? -eq 0 ]; then
	  echo "Host $SERVER is up"
	else
	  echo "Host $SERVER is down"
	fi
done

