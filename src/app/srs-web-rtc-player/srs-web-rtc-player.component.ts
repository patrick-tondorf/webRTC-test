import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-srs-webrtc-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="player-container">
      <h1>📹 Player WebRTC - SRS Stream (DEBUG MODE)</h1>
    
      <!-- CONFIGURAÇÃO -->
      @if (!isPlaying) {
        <div class="config-panel">
          <h2>Configuração do Stream</h2>
          <div class="input-group">
            <label><strong>URL WebRTC:</strong></label>
            <textarea
              [(ngModel)]="webrtcUrl"
              (ngModelChange)="parseUrl()"
              placeholder="webrtc://servidor.com/live/stream?schema=https"
              rows="3"
              class="input-url"
            ></textarea>
            <small>Cole aqui a URL completa do WebRTC</small>
          </div>
          @if (parsedUrl) {
            <div class="url-info">
              <h3>📊 URL Parseada:</h3>
              <div class="info-item"><strong>Servidor:</strong> {{ parsedUrl.server }}</div>
              <div class="info-item"><strong>Aplicação:</strong> {{ parsedUrl.app }}</div>
              <div class="info-item"><strong>Stream:</strong> {{ parsedUrl.stream }}</div>
              <div class="info-item"><strong>Schema:</strong> {{ parsedUrl.schema }}</div>
              <div class="info-item"><strong>API URL:</strong> {{ parsedUrl.apiUrl }}</div>
            </div>
          }
          <button (click)="startPlay()" class="btn-play" [disabled]="!webrtcUrl">
            ▶ Iniciar Player
          </button>
        </div>
      }
    
      <!-- PLAYER -->
      @if (isPlaying) {
        <div class="video-wrapper">
          <div class="status-bar">
            <span class="status" [ngClass]="statusClass">
              {{ statusMessage }}
            </span>
            <span class="info">{{ parsedUrl?.stream || 'Stream' }}</span>
            <button (click)="stop()" class="btn-stop">⏹ Parar</button>
          </div>
          <!-- DIAGNÓSTICO DE VÍDEO -->
          @if (!hasVideo) {
            <div class="video-debug">
              <div class="warning-box">
                <h3>⚠ Sem Vídeo Detectado</h3>
                <div class="diagnostic">
                  <div class="diag-item"><strong>Tracks recebidos:</strong> {{ tracksReceived }}</div>
                  <div class="diag-item"><strong>Video tracks:</strong> {{ videoTracks }}</div>
                  <div class="diag-item"><strong>Audio tracks:</strong> {{ audioTracks }}</div>
                  <div class="diag-item">
                    <strong>Video element srcObject:</strong>
                    {{ videoElement?.srcObject ? 'SET' : 'NULL' }}
                  </div>
                  <div class="diag-item">
                    <strong>Video readyState:</strong>
                    {{ videoElement?.readyState }}
                  </div>
                  <div class="diag-item">
                    <strong>Video networkState:</strong>
                    {{ videoElement?.networkState }}
                  </div>
                  <div class="diag-item">
                    <strong>Video paused:</strong>
                    {{ videoElement?.paused }}
                  </div>
                </div>
                <button (click)="forceVideoPlay()" class="btn-force">🔄 Forçar Play</button>
              </div>
            </div>
          }
          <video
            #videoElement
            autoplay
            playsinline
            [muted]="muted"
            class="video-player"
            (loadedmetadata)="onVideoMetadata($event)"
            (loadeddata)="onVideoLoaded($event)"
            (canplay)="onCanPlay($event)"
            (play)="onVideoPlay($event)"
            (error)="onVideoError($event)"
          ></video>
          <div class="controls">
            <button (click)="toggleMute()" class="control-btn">
              {{ muted ? '🔇' : '🔊' }} {{ muted ? 'Desmutar' : 'Mutar' }}
            </button>
            <button (click)="toggleFullscreen()" class="control-btn">🖥 Tela Cheia</button>
            <button (click)="restart()" class="control-btn">🔄 Reconectar</button>
            <button (click)="forceVideoPlay()" class="control-btn">▶ Forçar Play</button>
          </div>
        </div>
      }
    
      <!-- INFORMAÇÕES TÉCNICAS -->
      @if (isPlaying) {
        <div class="info-panel">
          <h3>ℹ Informações Técnicas</h3>
          <div class="tech-info">
            <div class="info-row">
              <strong>Estado da Conexão:</strong>
              <span [class.success]="connectionState === 'connected'">
                {{ connectionState }}
              </span>
            </div>
            <div class="info-row">
              <strong>ICE State:</strong>
              <span
              [class.success]="
                iceConnectionState === 'connected' || iceConnectionState === 'completed'
              "
                >
                {{ iceConnectionState }}
              </span>
            </div>
            <div class="info-row"><strong>Signaling State:</strong> {{ signalingState }}</div>
            <div class="info-row"><strong>Resolução:</strong> {{ videoResolution }}</div>
            <div class="info-row"><strong>Codec de Vídeo:</strong> {{ videoCodec }}</div>
            <div class="info-row"><strong>Bitrate:</strong> {{ videoBitrate }}</div>
            <div class="info-row"><strong>Frames Recebidos:</strong> {{ framesReceived }}</div>
            <div class="info-row"><strong>Frames Decodificados:</strong> {{ framesDecoded }}</div>
            <div class="info-row"><strong>Frames Dropados:</strong> {{ framesDropped }}</div>
          </div>
        </div>
      }
    
      <!-- SDP DEBUG -->
      @if (isPlaying && showSdp) {
        <div class="sdp-panel">
          <h3>📝 SDP Debug</h3>
          <div class="sdp-section">
            <h4>OFFER (enviado):</h4>
            <pre>{{ localSdp }}</pre>
          </div>
          <div class="sdp-section">
            <h4>ANSWER (recebido):</h4>
            <pre>{{ remoteSdp }}</pre>
          </div>
        </div>
      }
    
      <!-- DEBUG LOG -->
      <div class="debug-panel">
        <div class="debug-header">
          <h3>🐛 Debug Log Detalhado</h3>
          <div>
            <button (click)="showSdp = !showSdp" class="btn-toggle">
              {{ showSdp ? 'Ocultar' : 'Mostrar' }} SDP
            </button>
            <button (click)="clearLogs()" class="btn-clear">🗑 Limpar</button>
          </div>
        </div>
        <div class="logs">
          @for (log of logs; track log) {
            <div [class]="'log-' + log.type">
              {{ log.message }}
            </div>
          }
        </div>
      </div>
    
      <!-- SOLUÇÕES COMUNS -->
      <div class="solutions-panel">
        <h3>🔧 Problemas Comuns e Soluções</h3>
        <details open>
          <summary>✅ Conecta mas não mostra vídeo</summary>
          <ul>
            <li><strong>Causa 1:</strong> Stream offline ou câmera desconectada</li>
            <li><strong>Causa 2:</strong> Codec não suportado pelo navegador</li>
            <li><strong>Causa 3:</strong> Video element não recebeu os tracks</li>
            <li><strong>Solução:</strong> Clique em "Forçar Play" e verifique o log de tracks</li>
          </ul>
        </details>
        <details>
          <summary>❌ Erro CORS</summary>
          <ul>
            <li>O servidor SRS precisa permitir sua origem</li>
            <li>Verifique se a API está acessível no navegador</li>
          </ul>
        </details>
        <details>
          <summary>⚠ ICE Connection Failed</summary>
          <ul>
            <li>Problema de firewall ou NAT</li>
            <li>Pode precisar de servidor TURN</li>
          </ul>
        </details>
      </div>
    </div>
    `,
  styles: [
    `
      .player-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      h1 {
        color: #1f2937;
        text-align: center;
        margin-bottom: 30px;
      }

      .config-panel,
      .info-panel,
      .debug-panel,
      .sdp-panel,
      .solutions-panel {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }

      h2,
      h3 {
        color: #1f2937;
        margin: 0 0 20px 0;
        font-size: 20px;
      }

      h4 {
        color: #374151;
        margin: 15px 0 10px 0;
        font-size: 14px;
      }

      .input-group {
        margin-bottom: 20px;
      }

      .input-group label {
        display: block;
        margin-bottom: 8px;
        color: #374151;
      }

      .input-url {
        width: 100%;
        padding: 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        font-family: monospace;
        resize: vertical;
        box-sizing: border-box;
      }

      .input-url:focus {
        outline: none;
        border-color: #3b82f6;
      }

      small {
        display: block;
        color: #6b7280;
        font-size: 12px;
        margin-top: 6px;
      }

      .url-info {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .url-info h3 {
        font-size: 16px;
        margin: 0 0 12px 0;
      }

      .info-item {
        padding: 6px 0;
        color: #4b5563;
        font-size: 14px;
        word-break: break-all;
      }

      .info-item strong {
        color: #1f2937;
        margin-right: 8px;
      }

      .btn-play {
        width: 100%;
        padding: 16px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-play:hover:not(:disabled) {
        background: #059669;
        transform: translateY(-2px);
      }

      .btn-play:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      .video-wrapper {
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        margin-bottom: 20px;
        position: relative;
      }

      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
      }

      .status {
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
      }

      .status.connecting {
        background: #fbbf24;
        color: #92400e;
      }

      .status.connected {
        background: #10b981;
        color: white;
      }

      .status.error {
        background: #ef4444;
        color: white;
      }

      .info {
        color: #9ca3af;
        font-size: 14px;
      }

      .btn-stop {
        padding: 10px 20px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      }

      .btn-stop:hover {
        background: #dc2626;
      }

      .video-debug {
        padding: 20px;
        background: rgba(251, 191, 36, 0.1);
      }

      .warning-box {
        background: white;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #fbbf24;
      }

      .warning-box h3 {
        color: #92400e;
        margin: 0 0 15px 0;
        font-size: 18px;
      }

      .diagnostic {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 15px;
      }

      .diag-item {
        padding: 6px 0;
        color: #4b5563;
        font-size: 13px;
        font-family: monospace;
      }

      .diag-item strong {
        color: #1f2937;
      }

      .btn-force {
        width: 100%;
        padding: 12px;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-force:hover {
        background: #d97706;
      }

      .video-player {
        width: 100%;
        height: auto;
        display: block;
        min-height: 400px;
        background: #1a1a1a;
      }

      .controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.9);
      }

      .control-btn {
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s;
      }

      .control-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }

      .tech-info {
        display: grid;
        gap: 12px;
      }

      .info-row {
        padding: 10px;
        background: #f9fafb;
        border-radius: 6px;
        font-size: 14px;
      }

      .info-row strong {
        color: #374151;
        margin-right: 8px;
      }

      .info-row span {
        color: #6b7280;
      }

      .info-row span.success {
        color: #10b981;
        font-weight: 600;
      }

      .sdp-section {
        margin-bottom: 20px;
      }

      .sdp-section pre {
        background: #1f2937;
        color: #34d399;
        padding: 15px;
        border-radius: 6px;
        font-size: 11px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .debug-header > div {
        display: flex;
        gap: 10px;
      }

      .btn-toggle {
        padding: 6px 12px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }

      .btn-clear {
        padding: 6px 12px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }

      .logs {
        max-height: 300px;
        overflow-y: auto;
        background: #1f2937;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
      }

      .logs > div {
        padding: 4px 0;
        border-bottom: 1px solid #374151;
      }

      .log-info {
        color: #60a5fa;
      }
      .log-success {
        color: #34d399;
      }
      .log-error {
        color: #f87171;
      }
      .log-warning {
        color: #fbbf24;
      }

      .solutions-panel ul {
        margin: 10px 0;
        padding-left: 25px;
        color: #4b5563;
        font-size: 14px;
        line-height: 1.8;
      }

      details {
        margin-bottom: 10px;
        padding: 12px;
        background: #f3f4f6;
        border-radius: 6px;
      }

      summary {
        cursor: pointer;
        font-weight: 600;
        color: #374151;
      }

      @media (max-width: 768px) {
        .controls {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SrsWebRtcPlayerComponent implements OnDestroy {
  ngOnDestroy() {
    this.stop();
  }
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @Input() showDebug: boolean = true;

  // URL do WebRTC
  webrtcUrl = '';

  // Estado
  isPlaying = false;
  muted = true;
  statusMessage = 'Desconectado';
  statusClass = 'error';
  connectionState = 'new';
  iceConnectionState = 'new';
  signalingState = 'stable';
  videoResolution = 'N/A';
  videoCodec = 'N/A';
  videoBitrate = 'N/A';
  hasVideo = false;
  showSdp = false;

  // Diagnóstico
  tracksReceived = 0;
  videoTracks = 0;
  audioTracks = 0;
  framesReceived = 0;
  framesDecoded = 0;
  framesDropped = 0;

  // SDP
  localSdp = '';
  remoteSdp = '';

  // Logs
  logs: Array<{ type: string; message: string }> = [];

  // WebRTC
  private peerConnection: RTCPeerConnection | null = null;
  private statsInterval: any;
  private lastBytesReceived = 0;
  private lastTimestamp = 0;

  // URL parseada
  parsedUrl: {
    server: string;
    app: string;
    stream: string;
    schema: string;
    apiUrl: string;
  } | null = null;

  parseUrl() {
    if (!this.webrtcUrl) {
      this.parsedUrl = null;
      return;
    }

    try {
      const urlPattern = /webrtc:\/\/([^\/]+)\/([^\/]+)\/([^\?]+)\??(.*)$/;
      const match = this.webrtcUrl.match(urlPattern);

      if (match) {
        const server = match[1];
        const app = match[2];
        const stream = match[3];
        const params = new URLSearchParams(match[4]);
        const schema = params.get('schema') || 'https';

        this.parsedUrl = {
          server,
          app,
          stream,
          schema,
          apiUrl: `${schema}://${server}/rtc/v1/play/`,
        };
      } else {
        this.parsedUrl = null;
      }
    } catch (error: any) {
      this.parsedUrl = null;
    }
  }

  async startPlay() {
    if (!this.parsedUrl) {
      this.parseUrl();
      if (!this.parsedUrl) {
        alert('❌ URL inválida!');
        return;
      }
    }

    try {
      this.isPlaying = true;
      this.hasVideo = false;
      this.tracksReceived = 0;
      this.videoTracks = 0;
      this.audioTracks = 0;

      this.updateStatus('Conectando...', 'connecting');
      this.addLog('=== INICIANDO CONEXÃO WEBRTC ===', 'info');

      this.addLog('Criando RTCPeerConnection...', 'info');
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      this.setupPeerConnectionListeners();

      this.addLog('Adicionando transceivers...', 'info');
      this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });
      this.peerConnection.addTransceiver('video', { direction: 'recvonly' });

      this.addLog('Criando offer SDP...', 'info');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.localSdp = offer.sdp || '';
      this.addLog(`✅ Offer criado (${this.localSdp.length} bytes)`, 'success');

      const apiUrl = `${this.parsedUrl.apiUrl}`;
      const streamUrl = `/${this.parsedUrl.app}/${this.parsedUrl.stream}`;

      this.addLog(`Enviando POST para: ${apiUrl}`, 'info');
      this.addLog(`Stream URL: ${streamUrl}`, 'info');

      const requestBody = {
        api: apiUrl,
        streamurl: streamUrl,
        sdp: offer.sdp,
        tid: this.generateTid(),
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      this.addLog(`Response status: ${response.status} ${response.statusText}`, 'info');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.addLog(`Response data: ${JSON.stringify(data)}`, 'info');

      if (data.code !== 0 && data.code !== undefined) {
        throw new Error(`SRS Error ${data.code}: ${data.msg || 'Unknown error'}`);
      }

      if (!data.sdp) {
        throw new Error('SRS não retornou SDP no answer');
      }

      this.remoteSdp = data.sdp;
      this.addLog(`✅ Answer SRS recebido (${data.sdp.length} bytes)`, 'success');

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: data.sdp,
      };

      this.addLog('Aplicando remote description...', 'info');
      await this.peerConnection.setRemoteDescription(answer);
      this.addLog('✅ Remote description aplicado!', 'success');

      this.updateStatus('Aguardando stream...', 'connecting');
      this.startStats();

      setTimeout(() => {
        if (!this.hasVideo && this.isPlaying) {
          this.addLog(
            '⚠ AVISO: Conexão estabelecida mas nenhum vídeo recebido após 10s',
            'warning'
          );
          this.addLog(
            'Possíveis causas: Stream offline, codec incompatível, ou sem permissão',
            'warning'
          );
        }
      }, 10000);
    } catch (error: any) {
      this.addLog(`❌ ERRO CRÍTICO: ${error.message}`, 'error');
      this.addLog(`Stack: ${error.stack}`, 'error');
      this.updateStatus('Erro na conexão', 'error');
      alert(`Erro ao conectar: ${error.message}`);
      this.stop();
    }
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    this.peerConnection.ontrack = (event) => {
      this.tracksReceived++;
      this.addLog(`🎬 TRACK RECEBIDO! Tipo: ${event.track.kind}, ID: ${event.track.id}`, 'success');
      this.addLog(
        `  - Enabled: ${event.track.enabled}, ReadyState: ${event.track.readyState}`,
        'info'
      );
      this.addLog(`  - Streams: ${event.streams.length}`, 'info');

      if (event.track.kind === 'video') {
        this.videoTracks++;
        this.addLog('✅ Video track detectado!', 'success');
      } else if (event.track.kind === 'audio') {
        this.audioTracks++;
        this.addLog('✅ Audio track detectado!', 'success');
      }

      if (this.videoElement?.nativeElement) {
        const videoEl = this.videoElement.nativeElement;

        if (!videoEl.srcObject) {
          this.addLog('Aplicando srcObject ao video element...', 'info');
          videoEl.srcObject = event.streams[0];

          setTimeout(() => {
            videoEl
              .play()
              .then(() => {
                this.addLog('✅ Video.play() executado com sucesso!', 'success');
                this.hasVideo = true;
              })
              .catch((err) => {
                this.addLog(`⚠ Erro ao executar video.play(): ${err.message}`, 'error');
                this.addLog('Tente clicar em "Forçar Play"', 'warning');
              });
          }, 100);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.connectionState = this.peerConnection?.connectionState || 'unknown';
      this.addLog(`🔗 Connection state: ${this.connectionState}`, 'info');

      if (this.connectionState === 'connected') {
        this.updateStatus('Conectado - Aguardando mídia', 'connected');
      } else if (this.connectionState === 'failed') {
        this.updateStatus('Falha na conexão', 'error');
        this.addLog('❌ PeerConnection falhou!', 'error');
      } else if (this.connectionState === 'disconnected') {
        this.updateStatus('Desconectado', 'error');
      } else if (this.connectionState === 'closed') {
        this.updateStatus('Fechado', 'error');
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.iceConnectionState = this.peerConnection?.iceConnectionState || 'unknown';
      this.addLog(`🧊 ICE state: ${this.iceConnectionState}`, 'info');
    };

    this.peerConnection.onsignalingstatechange = () => {
      this.signalingState = this.peerConnection?.signalingState || 'stable';
      this.addLog(`📡 Signaling state: ${this.signalingState}`, 'info');
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.addLog(`🧊 ICE candidate: ${event.candidate.type}`, 'info');
      } else {
        this.addLog('✅ ICE gathering completo', 'success');
      }
    };

    this.peerConnection.onicecandidateerror = (event: any) => {
      this.addLog(`❌ ICE candidate error: ${event.errorText || 'Unknown'}`, 'error');
    };
  }

  onVideoMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.videoResolution = `${video.videoWidth}x${video.videoHeight}`;
    this.addLog(`📐 Metadata carregado: ${this.videoResolution}`, 'success');
    this.hasVideo = true;
    this.updateStatus('Reproduzindo', 'connected');
  }

  onVideoLoaded(event: Event) {
    this.addLog('✅ Video data carregado (loadeddata)', 'success');
  }

  onCanPlay(event: Event) {
    this.addLog('✅ Video pronto para play (canplay)', 'success');
  }

  onVideoPlay(event: Event) {
    this.addLog('▶ Video começou a reproduzir!', 'success');
    this.hasVideo = true;
  }

  onVideoError(event: Event) {
    const video = event.target as HTMLVideoElement;
    const error = video.error;
    if (error) {
      this.addLog(`❌ Video error: ${error.code} - ${error.message}`, 'error');
    }
  }

  forceVideoPlay() {
    this.addLog('🔄 Forçando play do vídeo...', 'info');
    const video = this.videoElement?.nativeElement;
    if (!video) {
      this.addLog('❌ Video element não encontrado', 'error');
      return;
    }

    this.addLog(`Video srcObject: ${video.srcObject ? 'SET' : 'NULL'}`, 'info');

    if (!video.srcObject) {
      this.addLog('❌ srcObject é NULL! Não há stream para reproduzir', 'error');
      return;
    }

    const stream = video.srcObject as MediaStream;
    this.addLog(`Stream tracks: ${stream.getTracks().length}`, 'info');

    stream.getTracks().forEach((track) => {
      this.addLog(
        `  - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`,
        'info'
      );
    });

    video
      .play()
      .then(() => {
        this.addLog('✅ Play executado com sucesso!', 'success');
        this.hasVideo = true;
      })
      .catch((error) => {
        this.addLog(`❌ Erro ao executar play: ${error.message}`, 'error');

        if (error.name === 'NotAllowedError') {
          this.addLog('Tentando desmutar e reproduzir novamente...', 'warning');
          video.muted = true;
          this.muted = true;
          video
            .play()
            .then(() => this.addLog('✅ Play com mute funcionou!', 'success'))
            .catch((err) => this.addLog(`❌ Falhou novamente: ${err.message}`, 'error'));
        }
      });
  }

  private startStats() {
    if (this.statsInterval) return;

    this.statsInterval = setInterval(async () => {
      if (!this.peerConnection) return;

      try {
        const stats = await this.peerConnection.getStats();

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            this.framesReceived = report.framesReceived || 0;
            this.framesDecoded = report.framesDecoded || 0;
            this.framesDropped = report.framesDropped || 0;

            const bytesReceived = report.bytesReceived || 0;
            const timestamp = report.timestamp || 0;

            if (this.lastTimestamp > 0) {
              const timeDiff = (timestamp - this.lastTimestamp) / 1000;
              const bytesDiff = bytesReceived - this.lastBytesReceived;
              const bitrate = Math.round((bytesDiff * 8) / timeDiff / 1000);
              this.videoBitrate = `${bitrate} kbps`;
            }

            this.lastBytesReceived = bytesReceived;
            this.lastTimestamp = timestamp;

            if (report.codecId) {
              stats.forEach((codecReport) => {
                if (codecReport.id === report.codecId && codecReport.mimeType) {
                  this.videoCodec = codecReport.mimeType.split('/')[1];
                }
              });
            }

            if (this.framesReceived > 0 && !this.hasVideo) {
              this.addLog(
                `⚠ Recebendo frames (${this.framesReceived}) mas vídeo não está visível!`,
                'warning'
              );
              this.addLog('Tente clicar em "Forçar Play"', 'warning');
            }
          }
        });
      } catch (error) {
        console.error('Erro ao obter stats:', error);
      }
    }, 1000);
  }

  stop() {
    this.addLog('⏹ Parando player...', 'warning');

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      this.addLog('PeerConnection fechado', 'info');
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
      this.videoElement.nativeElement.load();
    }

    this.isPlaying = false;
    this.hasVideo = false;
    this.tracksReceived = 0;
    this.videoTracks = 0;
    this.audioTracks = 0;
    this.updateStatus('Desconectado', 'error');
    this.videoBitrate = 'N/A';
    this.videoCodec = 'N/A';
    this.framesReceived = 0;
    this.framesDecoded = 0;
    this.framesDropped = 0;
  }

  restart() {
    this.addLog('🔄 Reconectando...', 'info');
    this.stop();
    setTimeout(() => this.startPlay(), 1000);
  }

  toggleMute() {
    const video = this.videoElement?.nativeElement;
    if (!video) return;
    this.muted = !this.muted;
    video.muted = this.muted;
    this.addLog(`${this.muted ? '🔇' : '🔊'} Áudio ${this.muted ? 'mutado' : 'ativado'}`, 'info');
  }

  toggleFullscreen() {
    const video = this.videoElement?.nativeElement;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen();
      this.addLog('🖥 Entrando em tela cheia', 'info');
    } else {
      document.exitFullscreen();
      this.addLog('↩ Saindo de tela cheia', 'info');
    }
  }

  private updateStatus(message: string, className: string) {
    this.statusMessage = message;
    this.statusClass = className;
  }

  private addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push({ type, message: `[${timestamp}] ${message}` });
    if (this.logs.length > 100) this.logs.shift();
    console.log(`[${type.toUpperCase()}]`, message);
  }

  clearLogs() {
    this.logs = [];
    this.addLog('Logs limpos', 'info');
  }

  private generateTid(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
