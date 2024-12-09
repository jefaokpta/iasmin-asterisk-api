#!/usr/bin/env bash

echo "Building and running Iasmin Asterisk Manager"

git pull
npm run build
rm /var/log/iasmin-asterisk-api.log
systemctl restart iasmin-asterisk-manager

echo "Iasmin Asterisk Manager is running"