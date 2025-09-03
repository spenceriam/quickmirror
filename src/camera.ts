// CameraManager class for QuickMirror - handles camera device access and management

export class CameraManager {
    private video: HTMLVideoElement;
    private stream: MediaStream | null = null;
    private currentDeviceId: string | null = null;

    constructor(videoElement: HTMLVideoElement) {
        this.video = videoElement;
    }

    async startCamera(deviceId?: string): Promise<void> {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: 280,
                    height: 180,
                    deviceId: deviceId ? { exact: deviceId } : undefined
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            this.currentDeviceId = deviceId || null;
            this.updateStatus('Camera OK');
        } catch (error: any) {
            console.error('Camera access failed:', error);
            if (error.name === 'NotAllowedError') {
                this.updateStatus('Camera permission denied');
            } else if (error.name === 'NotFoundError') {
                this.updateStatus('No camera found');
            } else if (error.name === 'NotReadableError') {
                this.updateStatus('Camera in use by another app');
            } else {
                this.updateStatus('Camera unavailable');
            }
            throw error;
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            this.updateStatus('Camera stopped');
        }
    }

    async getDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Failed to enumerate camera devices:', error);
            return [];
        }
    }

    async switchCamera(deviceId: string): Promise<void> {
        if (this.currentDeviceId === deviceId) {
            return; // Already using this device
        }
        
        this.stopCamera();
        await this.startCamera(deviceId);
    }

    getCurrentDeviceId(): string | null {
        return this.currentDeviceId;
    }

    isActive(): boolean {
        return this.stream !== null && this.stream.active;
    }

    private updateStatus(message: string): void {
        const statusElement = document.getElementById('camera-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
}
