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
        this.inputNode = null;
        this.outputNode = null;
    }

    connectedCallback() {
        this.loadStylesAndHtml();
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

        this.setupFilters();
        this.addEventListeners();
    }

    setupFilters() {
        this.audioContext = new AudioContext();
        this.inputNode = this.audioContext.createGain();
        this.outputNode = this.audioContext.createGain();
    
        this.bands.forEach((band) => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = band.frequency;
            filter.Q.value = 1; // Quality factor, controls the bandwidth
            filter.gain.value = 0; // Default gain is 0 dB
            this.filters.push(filter);
        });
    }
    

    addEventListeners() {
        this.shadowRoot.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (event) => {
                const frequency = event.target.dataset.frequency;
                const filter = this.filters.find(f => f.frequency.value == frequency);
                if (filter) {
                    filter.gain.value = parseFloat(event.target.value); // Ensure the value is a number
                    console.log(`Updated ${frequency} Hz gain to ${event.target.value} dB`);
                }
            });
        });
    }    

    connect(audioNode) {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
    
        // Connect the audio node to the first filter
        audioNode.connect(this.filters[0]);
    
        // Chain all filters together
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
    
        // Connect the last filter to the output node
        this.filters[this.filters.length - 1].connect(this.outputNode);
    
        // Connect the output node to the AudioContext destination
        this.outputNode.connect(this.audioContext.destination);
    }
    
}

customElements.define('audio-egaliseur', AudioEgaliseur);
