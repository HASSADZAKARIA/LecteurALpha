export class MyAudioPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const baseUrl = this.getBaseURL();
    console.log("BB"+baseUrl);
    const htmlResponse = await fetch(baseUrl + "lecteuraudio.html");
    const htmlContent = await htmlResponse.text();
    const cssResponse = await fetch(baseUrl + "lecteuraudio.css");
    const cssContent = await cssResponse.text();

    this.shadowRoot.innerHTML = `
            <style>${cssContent}</style>
            ${htmlContent}
        `;

    // Set the src for the audio file
    this.src = this.getAttribute("src");
    this.audioContext = new AudioContext();
    const player = this.shadowRoot.querySelector("#player");
    player.src = this.src;
    // Dispatch custom event with the audio element
    this.dispatchEvent(
      new CustomEvent("audio-ready", {
        detail: { audioElement: player },
        bubbles: true,
        composed: true,
      })
    );

    // Load icons using base URL
    this.shadowRoot.querySelector("#play-icon").src =
      baseUrl + "icons/play.svg";
    this.shadowRoot.querySelector("#pause-icon").src =
      baseUrl + "icons/pause.svg";
    this.shadowRoot.querySelector("#stop-icon").src =
      baseUrl + "icons/stop.svg";
    this.shadowRoot.querySelector("#mute-icon").src =
      baseUrl + "icons/unmute.svg";
    this.shadowRoot.querySelector("#speedup-icon").src =
      baseUrl + "icons/speed-up.svg";
    this.shadowRoot.querySelector("#slowdown-icon").src =
      baseUrl + "icons/slow-down.svg";

      const audioPlayer = this.shadowRoot.querySelector('#player');

    // Initialize event listeners and audio graph
    this.defineListeners(baseUrl);
    this.buildAudioGraph();
    this.setupVisualizer();
  }

  async playFirstTrackFromPlaylist(playlistBar) {
    const firstTrack = playlistBar ? playlistBar.getFirstTrack() : null; // Vérifie si la playlist existe et contient une piste
    
    const audioPlayer = this.shadowRoot.querySelector("#player");
    if (firstTrack) {
        // Si une piste existe dans la playlist
        audioPlayer.src = firstTrack.uri;
        await audioPlayer.play();
        console.log(`Lecture de la première piste : ${firstTrack.title}`);
        playlistBar.updateTrackButtonState(0, "playing"); // Met à jour l'état dans la playlist
    } else {
        // Si la playlist est vide, lire le morceau par défaut
        audioPlayer.src = this.src; // Défini dans l'attribut `src` de l'élément
        await audioPlayer.play();
        console.log("Lecture du morceau par défaut.");
    }
}


  getBaseURL() {
    return new URL(".", import.meta.url).href;
  }

  buildAudioGraph() {
    const player = this.shadowRoot.querySelector("#player");
    if (!player._source) {
      const source = this.audioContext.createMediaElementSource(player);
      this.stereoPanner = this.audioContext.createStereoPanner();
      source.connect(this.stereoPanner);
      this.stereoPanner.connect(this.audioContext.destination);
      player._source = source;
    }
  }

  setButtonState(play, pause, stop) {
    const playButton = this.shadowRoot.querySelector("#play");
    const pauseButton = this.shadowRoot.querySelector("#pause");
    const stopButton = this.shadowRoot.querySelector("#stop");
    playButton.disabled = play;
    pauseButton.disabled = pause;
    stopButton.disabled = stop;
  }

  setupIndexPlaylist(indexPlaylist) {
    this.indexPlaylist = indexPlaylist;
    console.log("Index de la playlist bzzz : "+this.indexPlaylist);
  }

  defineListeners(baseUrl) {
    const player = this.shadowRoot.querySelector("#player");
    const playButton = this.shadowRoot.querySelector("#play");
    const pauseButton = this.shadowRoot.querySelector("#pause");
    const stopButton = this.shadowRoot.querySelector("#stop");
    const muteButton = this.shadowRoot.querySelector("#mute");
    const speedUpButton = this.shadowRoot.querySelector("#speed-up");
    const slowDownButton = this.shadowRoot.querySelector("#slow-down");
    const playlistBar = document.querySelector("playlist-bar");

    let isMuted = false;

    // playButton.addEventListener('click', () => {
    //     player.play();
    //     this.audioContext.resume();
    //     playButton.disabled = true;
    //     pauseButton.disabled = false;
    //     stopButton.disabled = false;
    // });

    playButton.addEventListener("click", async () => {
      
  
      if (player.src && player.currentTime > 0) {
        // Si une piste est déjà en cours, reprendre la lecture
        await player.play();
        playlistBar.updateTrackButtonState(this.indexPlaylist, "playing");
        console.log("Reprise de la lecture du morceau en cours.");
    } else if(playlistBar.getFirstTrack()) {
          // Si la playlist existe et contient une piste
          await this.playFirstTrackFromPlaylist(playlistBar);
      
      } else {
          // Si la playlist est vide, lire le morceau par défaut
          player.src = this.src;
          await player.play();
      }
  
      this.audioContext.resume();
      playButton.disabled = true;
      pauseButton.disabled = false;
      stopButton.disabled = false;
  });
  
    pauseButton.addEventListener("click", () => {
      player.pause();
      playlistBar.updateTrackButtonState(this.indexPlaylist, "paused");
      console.log("Pause de la lecture du morceau : "+this.indexPlaylist);
      playButton.disabled = false;
      pauseButton.disabled = true;
    });

    stopButton.addEventListener("click", () => {
      player.pause();
      playlistBar.updateTrackButtonState(this.indexPlaylist, "stopped");
      player.currentTime = 0;
      playButton.disabled = false;
      pauseButton.disabled = true;
      stopButton.disabled = true;
    });

    muteButton.addEventListener("click", () => {
      isMuted = !isMuted;
      player.muted = isMuted;
      muteButton.querySelector("img").src = isMuted
        ? baseUrl + "icons/mute.svg"
        : baseUrl + "icons/unmute.svg";
    });

    speedUpButton.addEventListener("click", () => {
      player.playbackRate += 0.1;
    });

    slowDownButton.addEventListener("click", () => {
      player.playbackRate = Math.max(0.1, player.playbackRate - 0.1);
    });

    this.shadowRoot.querySelector("#volume").addEventListener("input", () => {
      player.volume = this.shadowRoot.querySelector("#volume").value;
    });

    player.addEventListener("timeupdate", () => {
      const progress = this.shadowRoot.querySelector("#progress");
      if (player.duration) {
        progress.value = (player.currentTime / player.duration) * 100;
      }
    });

    this.shadowRoot
      .querySelector("#progress")
      .addEventListener("click", (event) => {
        const progress = this.shadowRoot.querySelector("#progress");
        const position = event.offsetX / progress.offsetWidth;
        player.currentTime = position * player.duration;
      });

    this.shadowRoot.querySelector("#stereo").addEventListener("input", () => {
      this.stereoPanner.pan.value =
        this.shadowRoot.querySelector("#stereo").value;
    });
  }

  
  

  setupVisualizer() {
    const canvas = this.shadowRoot.querySelector("#visualizer");
    const canvasContext = canvas.getContext("2d");
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
        canvasContext.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2
        );

        x += barWidth + 1;
      }
    };

    draw();
  }
}

customElements.define("my-audio-player", MyAudioPlayer);
