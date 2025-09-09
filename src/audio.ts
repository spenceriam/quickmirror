// AudioManager class for QuickMirror - handles audio visualization and microphone management

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private dataArray: Uint8Array | null = null;
    private animationId: number | null = null;
    private stream: MediaStream | null = null;
    private currentDeviceId: string | null = null;
    private currentAudioLevel: number = 0;

    async initialize(deviceId?: string): Promise<void> {
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.audioContext = new AudioContext();
            
            // Resume audio context if suspended (required by modern browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.currentDeviceId = deviceId || null;
            this.startVisualization();
            
            console.log('Audio context initialized:', {
                state: this.audioContext.state,
                deviceId: this.currentDeviceId
            });
            
        } catch (error: any) {
            console.error('Audio access failed:', error);
            if (error.name === 'NotAllowedError') {
                this.updateAudioStatus('Microphone permission denied');
            } else if (error.name === 'NotFoundError') {
                this.updateAudioStatus('No microphone found');
            } else {
                this.updateAudioStatus('Microphone unavailable');
            }
            throw error;
        }
    }

    private startVisualization(): void {
        if (!this.analyser || !this.dataArray) {
            console.warn('Audio visualization: missing analyser or dataArray');
            return;
        }

        console.log('Starting audio visualization...');
        
        const updateLevel = () => {
            if (!this.analyser || !this.dataArray) return;

            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate RMS (Root Mean Square) for more accurate level detection
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i] * this.dataArray[i];
            }
            const rms = Math.sqrt(sum / this.dataArray.length);
            
            // Convert to percentage (0-100) with better scaling
            const level = Math.min(100, Math.max(0, (rms / 128) * 200));
            
            // Store current audio level
            this.currentAudioLevel = level;
            
            // Update progress bar if it exists (legacy support)
            this.updateProgressBar(level);
            
            // Debug logging (remove after testing)
            if (Math.random() < 0.001) { // Log occasionally to avoid spam
                console.log('Audio level:', level.toFixed(1));
            }
            
            this.animationId = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
    }

    private updateProgressBar(level: number): void {
        const progressBar = document.getElementById('audio-level') as HTMLProgressElement;
        if (progressBar) {
            progressBar.value = level;
        }
    }

    async getDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('Failed to enumerate audio devices:', error);
            return [];
        }
    }

    async switchMicrophone(deviceId: string): Promise<void> {
        if (this.currentDeviceId === deviceId) {
            return; // Already using this device
        }
        
        this.stop();
        await this.initialize(deviceId);
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.analyser = null;
        this.dataArray = null;
        this.currentDeviceId = null;
        
        // Reset progress bar
        this.updateProgressBar(0);
    }

    getCurrentDeviceId(): string | null {
        return this.currentDeviceId;
    }

    isActive(): boolean {
        return this.audioContext !== null && this.audioContext.state === 'running';
    }

    getAudioLevel(): number {
        return this.currentAudioLevel;
    }

    private updateAudioStatus(message: string): void {
        // Could update a status element if needed
        console.log('Audio status:', message);
    }
}
