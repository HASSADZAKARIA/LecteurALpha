class AudioEgaliseur extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.bands = [
            { label: 'Bass', frequency: 60 },
            { label: 'Mid', frequency: 1000 },
            { label: 'Treble', frequency: 14000 }
        ];
        this.filters = [];
        this.audioContext = null;
        this.sourceNode = null;
        this.outputNode = null;
    }

    connect(audioNode) {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            console.log('Disconnected previous source node');
        }
    
        this.sourceNode = audioNode;
    
        // Connect the source node to the first filter
        this.sourceNode.connect(this.filters[0]);
        console.log('Connected source node to first filter');
    
        // Chain all the filters
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
            console.log(`Connected filter ${i} to filter ${i + 1}`);
        }
    
        // Connect the last filter to the audio context's destination
        this.filters[this.filters.length - 1].connect(this.audioContext.destination);
        console.log('Connected last filter to AudioContext destination');
    }
    

    connectedCallback() {
        this.loadStylesAndHtml();
        this.waitForAudioElement();
    }

    async loadStylesAndHtml() {
        const styleResponse = await fetch('components/egaliseur/egaliseur.css');
        const styleContent = await styleResponse.text();
        const htmlResponse = await fetch('components/egaliseur/egaliseur.html');
        const htmlContent = await htmlResponse.text();

        this.shadowRoot.innerHTML = `
            <style>${styleContent}</style>
            ${htmlContent}
        `;
    }

    setupFilters() {
        this.outputNode = this.audioContext.createGain();

        this.bands.forEach((band) => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = band.frequency;
            filter.Q.value = 1;
            filter.gain.value = 0;
            this.filters.push(filter);
        });

        // Connect the filters in series
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }

        // Connect the last filter to the output node
        this.filters[this.filters.length - 1].connect(this.outputNode);
    }

    waitForAudioElement() {
        // Listen for the "audio-ready" event to get the audio element
        window.addEventListener('audio-ready', (event) => {
            const audioElement = event.detail.audioElement;
            this.audioContext = new AudioContext();
            this.setupFilters();

            // Create a MediaElementAudioSourceNode
            this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

            // Connect the source node to the first filter
            this.sourceNode.connect(this.filters[0]);

            // Connect the output node to the audio context destination
            this.outputNode.connect(this.audioContext.destination);

            console.log('Equalizer connected to audio element');
            audioElement.addEventListener('play', () => this.audioContext.resume());
        });
    }
}

customElements.define('audio-egaliseur', AudioEgaliseur);
