export class MyAudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        const baseUrl = this.getBaseURL();
        const htmlResponse = await fetch(baseUrl + 'lecteuraudio.html');
        const htmlContent = await htmlResponse.text();
        const cssResponse = await fetch(baseUrl + 'lecteuraudio.css');
        const cssContent = await cssResponse.text();

        this.shadowRoot.innerHTML = `
            <style>${cssContent}</style>
            ${htmlContent}
        `;

        // Set the src for the audio file
        this.src = this.getAttribute('src');
        this.audioContext = new AudioContext();
        this.shadowRoot.querySelector('#player').src = this.src;

        // Load icons using base URL
        this.shadowRoot.querySelector('#play-icon').src = baseUrl + 'icons/play.svg';
        this.shadowRoot.querySelector('#pause-icon').src = baseUrl + 'icons/pause.svg';
        this.shadowRoot.querySelector('#stop-icon').src = baseUrl + 'icons/stop.svg';
        this.shadowRoot.querySelector('#mute-icon').src = baseUrl + 'icons/unmute.svg';
        this.shadowRoot.querySelector('#speedup-icon').src = baseUrl + 'icons/speed-up.svg';
        this.shadowRoot.querySelector('#slowdown-icon').src = baseUrl + 'icons/slow-down.svg';
         
        // Initialize event listeners and audio graph
        this.defineListeners(baseUrl);
        this.buildAudioGraph();
        this.setupVisualizer();
    }

    getBaseURL() {
        return new URL('.', import.meta.url).href;
    }

    buildAudioGraph() {
        const player = this.shadowRoot.querySelector('#player');
        const source = this.audioContext.createMediaElementSource(player);
        this.stereoPanner = this.audioContext.createStereoPanner();
        source.connect(this.stereoPanner);
        this.stereoPanner.connect(this.audioContext.destination);
    }

    defineListeners(baseUrl) {
        const player = this.shadowRoot.querySelector('#player');
        const playButton = this.shadowRoot.querySelector('#play');
        const pauseButton = this.shadowRoot.querySelector('#pause');
        const stopButton = this.shadowRoot.querySelector('#stop');
        const muteButton = this.shadowRoot.querySelector('#mute');
        const speedUpButton = this.shadowRoot.querySelector('#speed-up');
        const slowDownButton = this.shadowRoot.querySelector('#slow-down');

        let isMuted = false;

        playButton.addEventListener('click', () => {
            player.play();
            this.audioContext.resume();
            playButton.disabled = true;
            pauseButton.disabled = false;
            stopButton.disabled = false;
        });

        pauseButton.addEventListener('click', () => {
            player.pause();
            playButton.disabled = false;
            pauseButton.disabled = true;
        });

        stopButton.addEventListener('click', () => {
            player.pause();
            player.currentTime = 0;
            playButton.disabled = false;
            pauseButton.disabled = true;
            stopButton.disabled = true;
        });

        muteButton.addEventListener('click', () => {
            isMuted = !isMuted;
            player.muted = isMuted;
            muteButton.querySelector('img').src = isMuted ? baseUrl + 'icons/mute.svg' : baseUrl + 'icons/unmute.svg';
        });

        speedUpButton.addEventListener('click', () => {
            player.playbackRate += 0.1;
        });

        slowDownButton.addEventListener('click', () => {
            player.playbackRate = Math.max(0.1, player.playbackRate - 0.1);
        });

        this.shadowRoot.querySelector('#volume').addEventListener('input', () => {
            player.volume = this.shadowRoot.querySelector('#volume').value;
        });

        player.addEventListener('timeupdate', () => {
            const progress = this.shadowRoot.querySelector('#progress');
            progress.value = (player.currentTime / player.duration) * 100;
        });

        this.shadowRoot.querySelector('#progress').addEventListener('click', (event) => {
            const progress = this.shadowRoot.querySelector('#progress');
            const position = event.offsetX / progress.offsetWidth;
            player.currentTime = position * player.duration;
        });

        this.shadowRoot.querySelector('#stereo').addEventListener('input', () => {
            this.stereoPanner.pan.value = this.shadowRoot.querySelector('#stereo').value;
        });
    }

    setupVisualizer() {
        const canvas = this.shadowRoot.querySelector('#visualizer');
        const canvasContext = canvas.getContext('2d');
        const analyser = this.audioContext.createAnalyser();
        this.stereoPanner.connect(analyser);
        analyser.connect(this.audioContext.destination);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            canvasContext.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                const r = barHeight + 25 * (i / bufferLength);
                const g = 250 * (i / bufferLength);
                const b = 50;

                canvasContext.fillStyle = `rgb(${r},${g},${b})`;
                canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };

        draw();
    }
}

customElements.define('my-audio-player', MyAudioPlayer);