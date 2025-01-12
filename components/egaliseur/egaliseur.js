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

        this.bands.forEach((band, index) => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = band.frequency;
            filter.Q.value = 1;
            filter.gain.value = 0;
            this.filters.push(filter);

            if (index === 0) {
                this.inputNode.connect(filter);
            } else {
                this.filters[index - 1].connect(filter);
            }
        });

        this.filters[this.filters.length - 1].connect(this.outputNode);
    }

    addEventListeners() {
        this.shadowRoot.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (event) => {
                const frequency = event.target.dataset.frequency;
                const filter = this.filters.find(f => f.frequency.value == frequency);
                if (filter) {
                    filter.gain.value = event.target.value;
                    console.log(`Updated ${frequency} Hz gain to ${event.target.value} dB`);
                }
            });
        });
    }

    connect(audioNode) {
        audioNode.connect(this.inputNode);
        this.outputNode.connect(audioNode.context.destination);
    }
}

customElements.define('audio-egaliseur', AudioEgaliseur);
