class ButterchurnVisualizer extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        // Create internal elements
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'butterchurn-canvas';

        this.presetDropdown = document.createElement('select');
        this.presetDropdown.id = 'preset-dropdown';

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'Visaliseur.css';

        shadow.appendChild(styleLink);
        shadow.appendChild(this.canvas);
        shadow.appendChild(this.presetDropdown);

        this.visualizer = null;
        this.presets = null;
    }

    connectedCallback() {
        // Écoute l'événement personnalisé pour obtenir l'élément audio
        window.addEventListener('audio-ready', (event) => {
            this.initVisualizer(event.detail.audioElement);
        });

        this.populatePresets();
        this.handleResize();
    }

    initVisualizer(audioElement) {
        const audioContext = new AudioContext();
        this.visualizer = butterchurn.default.createVisualizer(audioContext, this.canvas, {
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
        });

        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(audioContext.destination);
        this.visualizer.connectAudio(source);

        audioElement.addEventListener('play', () => audioContext.resume());
        this.startRendering();
    }

    startRendering() {
        const renderLoop = () => {
            if (this.visualizer) {
                this.visualizer.render();
            }
            requestAnimationFrame(renderLoop);
        };
        renderLoop();
    }

    handleResize() {
        const resizeCanvas = () => {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            if (this.visualizer) {
                this.visualizer.setRendererSize(this.canvas.clientWidth, this.canvas.clientHeight);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }

    populatePresets() {
        // Charge les presets depuis butterchurn-presets
        this.presets = butterchurnPresets.getPresets();
    
        // Remplit la liste déroulante
        for (const presetName in this.presets) {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName; 
            option.style.whiteSpace = 'pre-wrap'; // Permet un retour à la ligne
            option.style.wordWrap = 'break-word'; // Assure la coupure des mots longs
            option.style.lineHeight = '1.4'; // Ajoute de l'espace entre les lignes
            this.presetDropdown.appendChild(option);
        }
    
        // Charge un preset par défaut
        const defaultPreset = Object.keys(this.presets)[0];
        if (this.visualizer) {
            this.visualizer.loadPreset(this.presets[defaultPreset], 0.0);
        }
    
        // Change de preset à la sélection
        this.presetDropdown.addEventListener('change', (event) => {
            const selectedPreset = event.target.value;
            console.log(`Changing preset to: ${selectedPreset}`);
            if (this.visualizer) {
                this.visualizer.loadPreset(this.presets[selectedPreset], 0.0);
            }
        });
    }
}

// Enregistre le Web Component
customElements.define('butterchurn-visualizer', ButterchurnVisualizer);
