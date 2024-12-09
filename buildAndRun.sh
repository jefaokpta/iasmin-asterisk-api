#!/usr/bin/env bash

git pull
npm run build
rm /var/log/iasmin-asterisk-api.log
systemctl restart iasmin-asterisk-manager