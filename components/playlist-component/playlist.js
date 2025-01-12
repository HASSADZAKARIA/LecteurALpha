class PlaylistBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tracks = [];
    this.loadJsMediaTags();
  }

  getBaseURL() {
    return new URL('.', import.meta.url).href;
  }

  async loadTracks() {
    this.files = await this.loadFiles();
    this.tracks = [];
    this.tracks = await this.readMetadata(this.files);
    console.log("Fichiers chargés:", this.tracks);
    this.renderTracks();
  }

  async connectedCallback() {
    window.addEventListener('audio-ready', (event) => {
      this.setupPlaylist(event.detail.audioElement);
    });
    await this.render();
    console.log("PlaylistBar rendu dans le DOM");
    this.tracksContainer = this.shadowRoot.getElementById("tracks");
    console.log("tracksContainer :", this.tracksContainer);
    this.loadTracks();

    

    const addMusic = this.shadowRoot.getElementById("add-music");
    addMusic.addEventListener("click", (event) => {
      event.stopPropagation();
      if(this.tracks.length < 5){
        this.loadTracks();
      }
    });

    const deleteAllMusic = this.shadowRoot.getElementById("clear-playlist");
    deleteAllMusic.addEventListener("click", (event) => {
      event.stopPropagation();
      this.tracks = [];
      this.renderTracks();
    });

    const importTrack = this.shadowRoot.getElementById("file-input");
    importTrack.addEventListener("change", async (event) => {
      event.stopPropagation();
      const files = event.target.files;
      const newTracks = await this.readMetadata(files);
      this.tracks.push(...newTracks);
      this.renderTracks();
    });
  }

  createTrackElement(track, index) {
    const trackElement = document.createElement("div");
    trackElement.classList.add("track");
    trackElement.setAttribute("draggable", "true");
    trackElement.dataset.index = index;

    trackElement.innerHTML = `
      <div class="track-info">
        <span class="track-number">${index + 1}.</span>
        <div class="track-details">
          <p class="track-title">${track.title}</p>
          <p class="track-artist">${track.artist}</p>
      </div>
      </div>
      <div class="track-actions">
        <button class="play-pause-button" data-uri="${track.uri}" data-index="${index}">&#9654;</button>
        <button class="delete-button" data-index="${index}">🗑</button> 
      </div>
    `;

    // Gestion des événements Drag & Drop
    trackElement.addEventListener("dragstart", this.handleDragStart.bind(this));
    trackElement.addEventListener("dragover", this.handleDragOver.bind(this));
    trackElement.addEventListener("drop", this.handleDrop.bind(this));

    // Gestion du bouton Play/Pause
    const playPauseButton = trackElement.querySelector(".play-pause-button");
    playPauseButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.togglePlayPause(index, playPauseButton);
    });

    const trashMusic = trackElement.querySelector(".delete-button");
    trashMusic.addEventListener("click", (event) => {
      event.stopPropagation();
      this.tracks.splice(index, 1);
      this.renderTracks();
    });

    

    return trackElement;
  }

  // Affiche toutes les pistes dans le conteneur
  renderTracks() {
    this.tracksContainer.innerHTML = ""; // Efface le contenu existant
    this.tracks.forEach((track, index) => {
      const trackElement = this.createTrackElement(track, index);
      this.tracksContainer.appendChild(trackElement);
    });
  }

  handleDragStart(event) {
    this.draggedIndex = Number(event.target.dataset.index);
    console.log("Drag started for index:", this.draggedIndex);
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  handleDrop(event) {
    event.preventDefault();
    const dropTarget = event.currentTarget;
    const targetIndex = Number(dropTarget.dataset.index);

    if (targetIndex === this.draggedIndex) return;

    console.log(`Déplacement de ${this.draggedIndex} vers ${targetIndex}`);
    const movedTrack = this.tracks.splice(this.draggedIndex, 1)[0];
    this.tracks.splice(targetIndex, 0, movedTrack);

    this.renderTracks(); // Réaffiche les pistes avec le nouvel ordre
  }

  async loadFiles() {
    // Exemple d'utilisation avec des URLs
    const fileUrls = [
      "https://hassadzakaria.github.io/LecteurALpha/components/music/track-01.mp3",
      "https://hassadzakaria.github.io/LecteurALpha/components/music/track-02.mp3",
      "https://hassadzakaria.github.io/LecteurALpha/components/music/track-03.mp3",
      "https://hassadzakaria.github.io/LecteurALpha/components/music/track-04.mp3",
      "https://hassadzakaria.github.io/LecteurALpha/components/music/track-05.mp3",
    ];

    const responses = await Promise.all(fileUrls.map((url) => fetch(url)));
    return Promise.all(responses.map((res) => res.blob()));
  }

  togglePlayPause(index, button) {
    const selectedTrack = this.tracks[index];
    const lecteurAudio = document.querySelector("my-audio-player");

    if (!this.audioElement) {
      console.error("Élément audio non initialisé.");
      return;
    }

    // Si la piste sélectionnée est déjà chargée dans l'élément audio
    if (this.audioElement.src === selectedTrack.uri) {
      if (this.audioElement.paused) {
        // Si elle est en pause, reprenez la lecture
        this.audioElement
          .play()
          .then(() => {
            console.log("Lecture reprise :", selectedTrack.uri);
            lecteurAudio.setButtonState(true, false, false);
            button.innerHTML = "&#9208;"; // Icône Pause
          })
          .catch((error) => {
            console.error("Erreur lors de la reprise de la lecture :", error);
          });
      } else {
        // Si elle est en cours de lecture, mettez-la en pause
        this.audioElement.pause();
        lecteurAudio.setButtonState(false, true, false);
        button.innerHTML = "&#9654;"; // Icône Play
      }
    } else {
      // Charger une nouvelle piste si elle n'est pas déjà en cours de lecture
      this.audioElement.src = selectedTrack.uri;
      this.audioElement
        .play()
        .then(() => {
          console.log("Nouvelle lecture commencée :", selectedTrack.uri);
          lecteurAudio.setButtonState(true, false, false);
          button.innerHTML = "&#9208;"; // Icône Pause
        })
        .catch((error) => {
          console.error("Erreur lors de la lecture :", error);
        });
        lecteurAudio.setupIndexPlaylist(index);
      // Réinitialisez les autres boutons Play/Pause
      this.resetOtherButtons(index);
    }
  }

  getFirstTrack() {
    if (this.tracks.length > 0) {
        return this.tracks[0]; // Retourne la première piste de la playlist
    }
    return null;
}

updateTrackButtonState(index, state) {
    const buttons = this.shadowRoot.querySelectorAll(".play-pause-button");
    if (state === "stopped") {
        this.audioElement.currentTime = 0;
    }
    buttons.forEach((button, i) => {
        if (i === index) {
            button.innerHTML = state === "playing" ? "&#9208;" : "&#9654;"; // Pause ou Play
        } else {
            button.innerHTML = "&#9654;"; // Remet les autres boutons à l'état "Play"
        }
    });
}


  resetOtherButtons(activeIndex) {
    const buttons = this.tracksContainer.querySelectorAll(".play-pause-button");
    buttons.forEach((button, index) => {
      if (index !== activeIndex) {
        button.innerHTML = "&#9654;"; // Icône Play
      }
    });
  }

  setupPlaylist(audioElement) {
    this.audioElement = audioElement;
}


  selectTrack(index) {
    if (!this.audioElement) {
      console.error(
        "Élément audio non initialisé. Impossible de lire la piste."
      );
      return;
    }
    const selectedTrack = this.tracks[index];
    this.audioElement.src = selectedTrack.uri;
    this.audioElement.play();

    this.updateActiveTrack(index);
  }

  updateActiveTrack(activeIndex) {
    Array.from(this.tracksContainer.children).forEach((trackElement, index) => {
      trackElement.classList.toggle("active", index === activeIndex);
    });
  }

  async readMetadata(files) {
    const results = [];

    for (const file of files) {
      const jsmediatags = window.jsmediatags; // Ou importez jsmediatags directement si vous utilisez ES Modules
      if (!jsmediatags) {
        console.error(
          "jsmediatags n'est pas défini. Assurez-vous que la bibliothèque est correctement chargée."
        );
        return [];
      }
      await new Promise((resolve, reject) => {
        jsmediatags.read(file, {
          onSuccess: function (tag) {
            const { title, artist, picture } = tag.tags;

            // Récupérer les données de l'image si disponible
            let imageBase64 = null;
            if (picture) {
              const base64String = picture.data
                .map((byte) => String.fromCharCode(byte))
                .join("");
              imageBase64 = `data:${picture.format};base64,${btoa(
                base64String
              )}`;
            }

            results.push({
              fileName: file.name,
              title: title || "Titre inconnu",
              artist: artist || "Artiste inconnu",
              image: imageBase64,
              uri: URL.createObjectURL(file),
            });

            resolve();
          },
          onError: function (error) {
            console.error(`Erreur pour le fichier ${file.name}:`, error);
            results.push({
              fileName: file.name,
              title: "Erreur lors de la lecture",
              artist: null,
              image: null,
            });
            resolve();
          },
        });
      });
    }

    return results;
  }

  loadJsMediaTags() {
    // Vérifiez si jsmediatags est déjà disponible
    if (window.jsmediatags) {
      console.log("jsmediatags déjà chargé");

      return;
    }

    // Créez dynamiquement un script
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/jsmediatags@latest/dist/jsmediatags.min.js";

    // Ajoutez un gestionnaire d'événement pour savoir quand le script est chargé
    script.onload = () => {
      console.log("jsmediatags chargé avec succès");
    };

    script.onerror = () => {
      console.error("Erreur lors du chargement de jsmediatags");
    };

    // Ajoutez le script au Shadow DOM (ou au document global si nécessaire)
    document.head.appendChild(script); // Ajoutez-le au document principal
  }

  async render() {
    const baseUrl = this.getBaseURL();
    const htmlResponse = await fetch(baseUrl + "playlist.html");
    const htmlContent = await htmlResponse.text();
    const cssResponse = await fetch(baseUrl + "playlist.css");
    const cssContent = await cssResponse.text();
    this.shadowRoot.innerHTML = `
    <style>${cssContent}</style>
    ${htmlContent}`;
  }
}
console.log("Script playlist.js chargé");

customElements.define("playlist-bar", PlaylistBar);
