#!/usr/bin/env bash

echo "🚀 Buildando Iasmin Asterisk Manager"

echo "🔄 Sincronizando com GitHub"
git pull

echo "📦 Instalando dependências"
npm install

echo "🛠️ Buildando o projeto"
npm run build

echo "🧹 Limpando logs antigos"
rm /var/log/iasmin-asterisk-api.log

echo "🔄 Reiniciando serviço Iasmin Asterisk API"
systemctl restart iasmin-asterisk-api

echo "✅ Iasmin Asterisk API rodando"
