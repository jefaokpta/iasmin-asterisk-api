# iasmin-asterisk-api

Backend em NestJS responsável por integrar e orquestrar recursos do Asterisk (ARI e AMI), controlar o fluxo das ligações (inbound/outbound), criar e atualizar ramais PJSIP (peers) por usuário e receber/enviar CDRs para o iasmin-backend.

Este README documenta as tecnologias, arquitetura, variáveis de ambiente, como executar/depurar, boas práticas adotadas e orientações para manutenção e evolução (por humanos ou agentes de IA).


## Visão geral

- Framework: NestJS (v10)
- ARI (Asterisk REST Interface): usado para roteamento/controle de chamadas em tempo real.
- AMI (Asterisk Manager Interface): usado para eventos (CDR, segurança/anti-invasão) e comandos (ex.: pjsip reload).
- Gravações: cria gravações por canal/ponte e converte para MP3 com ffmpeg.
- Integração externa: envia CDRs e consulta empresas no iasmin-backend via HTTP.
- CORS: habilitado por padrão (main.ts).


## Tecnologias

- NestJs (framework): https://docs.nestjs.com
- Ari-Client (controle de fluxo de ligações via ARI): https://github.com/asterisk/node-ari-client
- Asterisk-Manager (AMI): https://github.com/pipobscure/NodeJS-AsteriskManager
- Axios (requisições HTTP externas)
- @nestjs/config, @nestjs/schedule, @nestjs/jwt, multer (upload via FileInterceptor)


## Arquitetura (módulos principais)

- AriModule
  - RouterCallAppService: conecta ao ARI e inicia 2 apps: outbound-router-call-app e inbound-router-call-app. Controla o fluxo de chamadas.
  - OutboundCallService/InternalCallService/InboundCallService: regras para chamadas externas, internas e de entrada.
  - CallAction utilitário: ações de canal/bridge/recording.
- AmiModule
  - AmiConnectionService: conecta ao AMI (keepConnected) e trata eventos de CDR e segurança (anti-invasão). Disponibiliza pjsipReload.
  - CdrService: converte gravações para MP3 (ffmpeg) e envia CDR ao iasmin-backend.
- CronModule
  - CronService: tarefas agendadas (limpeza de áudios após 10 dias, reinicialização de bloqueios de invasão, escrita de lista de invasores bloqueados a cada 5 min).
- UploadModule
  - UploadController/UploadService: POST /uploads/:id (field audio) salva arquivo .mp3 (até 5MB) em AUDIO_RECORD/mp3s.
- PeerModule
  - PeerController: POST /peers escreve configuração pjsip-peers.conf com base na lista de usuários recebida.
  - PeerWriter: gera conteúdo PJSIP para endpoints/aors/auth e escreve no diretório configurado.
- SecurityModule
  - Jwt global com secret definido por env; SecurityService gera/valida tokens (roles super/admin).
- CompaniesModule
  - CompanyClientService: consulta empresas via iasmin-backend (com Bearer obtido do SecurityService).

Ponto de entrada: main.ts (habilita CORS e escuta em PORT ou 3000).


## Fluxo de chamadas (resumo)

- Outbound (origem no peer):
  - RouterCallAppService (outbound-router-call-app)
  - Valida token X-CALL-TOKEN (exceto caller.number === "jefao").
  - Define CDR(userfield)=OUTBOUND e registra empresa/controle.
  - Se exten tem < 8 dígitos: chamada interna (ou assistente quando *12345).
  - Caso contrário: OutboundCallService disca via PJSIP usando prefixo e tronco configurados.
- Inbound (origem externa):
  - RouterCallAppService (inbound-router-call-app)
  - Define CDR(userfield)=INBOUND.
  - Descobre empresa pelo número discado e propaga chamada aos usuários da empresa.
- Gravações: cria snoops por perna A/B e gravação MIXED de bridge.
- CDRs: AMI emite; o serviço envia ao iasmin-backend, anexando nome do arquivo de gravação quando aplicável.

Observação: extensão especial *12345 invoca o AssistantCallService.


## Endpoints HTTP

- POST /peers
  - Body: array de usuários (id, name, controlNumber, ddr)
  - Efeito: reescreve pjsip-peers.conf no ASTERISK_CONFIG.
  - Exemplo (curl):
    curl -X POST http://localhost:3000/peers \
      -H "Content-Type: application/json" \
      -d '[{"id":"1001","name":"Alice","controlNumber":"CN-01","ddr":"5511999999999"}]'

- POST /uploads/:id
  - Form-Data: audio (mimetype audio/mpeg, até 5MB)
  - Retorno: { audio: "upload-<ts>-<id>.mp3" }
  - Exemplo (curl):
    curl -X POST http://localhost:3000/uploads/123 \
      -F "audio=@/caminho/arquivo.mp3;type=audio/mpeg"


## Variáveis de ambiente

- PORT: porta HTTP do Nest (default 3000)
- ARI_HOST: URL do ARI (ex.: http://127.0.0.1:8088)
- ARI_USER, ARI_PASS: credenciais do ARI
- AMI_HOST, AMI_PORT, AMI_USER, AMI_PASS: conexão ao AMI
- PABX_TRUNK: nome do tronco de saída (ex.: my-trunk)
- PABX_TECH_PREFIX: prefixo de tecnologia/operadora (ex.: 0, 031, etc.)
- ASTERISK_CONFIG: diretório onde será escrito pjsip-peers.conf
- AUDIO_RECORD: diretório base onde o Asterisk grava (e onde serão armazenados/conversos os áudios); subpasta mp3s é utilizada
- IASMIN_BACKEND_API: base URL do iasmin-backend (ex.: https://backend.local/api)
- JWT_SECRET: segredo para assinatura/validação dos JWTs internos

Dicas:
- Garanta que AUDIO_RECORD e ASTERISK_CONFIG existam e o processo tenha permissão de escrita.
- ffmpeg deve estar instalado e no PATH para conversão de áudio.


## Requisitos do ambiente

- Node.js 20+
- Asterisk com:
  - ARI habilitado e aplicações configuradas: outbound-router-call-app e inbound-router-call-app
  - AMI habilitado e credenciais
  - Contextos compatíveis (ex.: VIP-PEERS, TRANSFERING) e tronco configurado
- ffmpeg instalado


## Instalação

- npm install
- Crie um arquivo .env com as variáveis de ambiente listadas acima.


## Execução

- Desenvolvimento: npm run start (ou nest start)
- Watch (recomendado): npm run start:dev:asterisk
- Debug com inspect: npm run start:debug (porta 9229)
- Produção: npm run build && npm run start:prod


## Testes

- Unitários: npm run test
- E2E: npm run test:e2e
- Cobertura: npm run test:cov


## Boas práticas adotadas

- DRY (Don’t Repeat Yourself): https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
- Immutability (preferência por objetos imutáveis): https://en.wikipedia.org/wiki/Immutable_object
- Validação/DTOs: class-validator/class-transformer quando aplicável
- Logs com Nest Logger e tratamento de erros com mensagens claras
- Separação de responsabilidades por módulo/serviço


## Diretrizes para manutenção e agentes de IA

- Diagnóstico rápido:
  - Verifique conectividade ARI/AMI (variáveis de ambiente corretas, serviços do Asterisk ativos).
  - Cheque logs do Nest (níveis: log, warn, error) e eventos de ARI (StasisStart) e AMI (cdr/invalidaccountid).
  - Confirme permissões de escrita em AUDIO_RECORD e ASTERISK_CONFIG.
  - Valide presença do ffmpeg no PATH.
- Depuração:
  - Use npm run start:debug e anexe um debugger (porta 9229).
  - Pontos úteis: RouterCallAppService.outboundStasisStart/inboundStasisStart, OutboundCallService.externalCall,
    AmiConnectionService.onApplicationBootstrap, CdrService.cdrCreated.
- Extensões/Pontos de evolução:
  - Novas regras de roteamento: adicionar serviços no AriModule e chamar a partir do RouterCallAppService.
  - Novos eventos AMI: estender AmiConnectionService.
  - Novos endpoints HTTP: criar Controller/Service e registrar em um módulo específico.
  - Integrações externas: usar HttpService/Axios com timeouts e autenticação via SecurityService.
- Segurança:
  - Defina JWT_SECRET seguro e rotacione conforme necessário.
  - X-CALL-TOKEN é validado para chamadas outbound (exceto para caller "jefao").


## Licença

- Este projeto é UNLICENSED (conforme package.json).
