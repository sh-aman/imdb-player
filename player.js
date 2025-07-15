const apiKey = 'ca23bb10';
const params = new URLSearchParams(window.location.search);
const imdbID = params.get('id');

const titleEl = document.getElementById('title');
const playerEl = document.getElementById('player');
const controls = document.getElementById('controls');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

let currentSeason = 1;
let currentEpisode = 1;
let totalSeasons = 1;
const episodesPerSeason = {};

if (!imdbID) {
  titleEl.textContent = '❌ No IMDb ID provided';
} else {
  fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      if (data.Type === 'movie') {
        titleEl.textContent = data.Title;
        playerEl.src = `https://multiembed.mov/?video_id=${imdbID}`;
      } else if (data.Type === 'series') {
        titleEl.textContent = `${data.Title} - S1E1`;
        initSeries(data.Title);
      } else {
        titleEl.textContent = 'Unsupported type';
      }
    });
}

function initSeries(seriesTitle) {
  fetch(`https://www.omdbapi.com/?i=${imdbID}&Season=1&apikey=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      totalSeasons = parseInt(data.totalSeasons || 1);
      updateDropdowns(seriesTitle);
      updateIframe(seriesTitle);
      controls.classList.remove('hidden');
      attachHandlers(seriesTitle);
    });
}

function fetchSeason(season, cb) {
  if (episodesPerSeason[season]) {
    cb();
    return;
  }
  fetch(`https://www.omdbapi.com/?i=${imdbID}&Season=${season}&apikey=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      episodesPerSeason[season] = data.Episodes.length;
      cb();
    });
}

function updateDropdowns(seriesTitle) {
  seasonSelect.innerHTML = '';
  for (let i = 1; i <= totalSeasons; i++) {
    seasonSelect.innerHTML += `<option value="${i}">Season ${i}</option>`;
  }
  seasonSelect.value = currentSeason;

  const epCount = episodesPerSeason[currentSeason] || 1;
  episodeSelect.innerHTML = '';
  for (let i = 1; i <= epCount; i++) {
    episodeSelect.innerHTML += `<option value="${i}">Episode ${i}</option>`;
  }
  episodeSelect.value = currentEpisode;
}

function updateIframe(seriesTitle) {
  playerEl.src = `https://multiembed.mov/?video_id=${imdbID}&s=${currentSeason}&e=${currentEpisode}`;
  titleEl.textContent = `${seriesTitle} - S${currentSeason}E${currentEpisode}`;
}

function attachHandlers(seriesTitle) {
  seasonSelect.addEventListener('change', () => {
    currentSeason = parseInt(seasonSelect.value);
    currentEpisode = 1;
    fetchSeason(currentSeason, () => {
      updateDropdowns(seriesTitle);
      updateIframe(seriesTitle);
    });
  });

  episodeSelect.addEventListener('change', () => {
    currentEpisode = parseInt(episodeSelect.value);
    updateIframe(seriesTitle);
  });

  prevBtn.addEventListener('click', () => {
    if (currentEpisode > 1) {
      currentEpisode--;
      updateIframe(seriesTitle);
    } else if (currentSeason > 1) {
      currentSeason--;
      fetchSeason(currentSeason, () => {
        currentEpisode = episodesPerSeason[currentSeason];
        updateDropdowns(seriesTitle);
        updateIframe(seriesTitle);
      });
    }
  });

  nextBtn.addEventListener('click', () => {
    fetchSeason(currentSeason, () => {
      if (currentEpisode < episodesPerSeason[currentSeason]) {
        currentEpisode++;
        updateIframe(seriesTitle);
      } else if (currentSeason < totalSeasons) {
        currentSeason++;
        currentEpisode = 1;
        fetchSeason(currentSeason, () => {
          updateDropdowns(seriesTitle);
          updateIframe(seriesTitle);
        });
      }
    });
  });
}
