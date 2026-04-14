document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // SECTION 1: LIVE TRENDING FEED & CUSTOM COUNTRIES
    // ==========================================
    const top5Grid = document.getElementById('top-5-grid');
    const trigger = document.getElementById('dropdown-trigger');
    const optionsContainer = document.getElementById('dropdown-options');

    // Dictionary without emojis (we will use FlagCDN images instead)
    const itunesCountries = {
        "us": "United States", "ar": "Argentina", "au": "Australia", "at": "Austria",
        "be": "Belgium", "bo": "Bolivia", "br": "Brazil", "ca": "Canada",
        "cl": "Chile", "cn": "China", "co": "Colombia", "cr": "Costa Rica",
        "cz": "Czech Republic", "dk": "Denmark", "do": "Dominican Republic", "ec": "Ecuador",
        "eg": "Egypt", "sv": "El Salvador", "fi": "Finland", "fr": "France",
        "de": "Germany", "gh": "Ghana", "gr": "Greece", "gt": "Guatemala",
        "hn": "Honduras", "hk": "Hong Kong", "hu": "Hungary", "in": "India",
        "id": "Indonesia", "ie": "Ireland", "il": "Israel", "it": "Italy",
        "jp": "Japan", "jo": "Jordan", "ke": "Kenya", "lb": "Lebanon",
        "my": "Malaysia", "mx": "Mexico", "nl": "Netherlands", "nz": "New Zealand",
        "ni": "Nicaragua", "ng": "Nigeria", "no": "Norway", "om": "Oman",
        "pa": "Panama", "py": "Paraguay", "pe": "Peru", "ph": "Philippines",
        "pl": "Poland", "pt": "Portugal", "qa": "Qatar", "sa": "Saudi Arabia",
        "sg": "Singapore", "za": "South Africa", "kr": "South Korea", "es": "Spain",
        "se": "Sweden", "ch": "Switzerland", "tw": "Taiwan", "th": "Thailand",
        "tr": "Turkey", "ae": "United Arab Emirates", "gb": "United Kingdom",
        "uy": "Uruguay", "ve": "Venezuela", "vn": "Vietnam"
    };

    // Build the custom dropdown options
    if (optionsContainer) {
        for (const [code, name] of Object.entries(itunesCountries)) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-option';
            optionDiv.dataset.value = code;
            
            // Using FlagCDN to pull real images of the flags
            optionDiv.innerHTML = `
                <img src="https://flagcdn.com/w20/${code}.png" alt="${name} flag">
                <span>${name}</span>
            `;

            optionDiv.addEventListener('click', () => {
                // Update the trigger box with selected country
                trigger.innerHTML = `
                    <div><img src="https://flagcdn.com/w20/${code}.png" alt="flag"> <span>${name}</span></div>
                    <span style="font-size: 0.8em;">▼</span>
                `;
                optionsContainer.classList.remove('open');
                
                // Fetch the new songs!
                fetchTopSongs(code);
            });

            optionsContainer.appendChild(optionDiv);
        }

        // Toggle open/close on click
        trigger.addEventListener('click', () => {
            optionsContainer.classList.toggle('open');
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('country-dropdown').contains(e.target)) {
                optionsContainer.classList.remove('open');
            }
        });
        
        // Add the little arrow to the initial state
        trigger.innerHTML = `
            <div><img src="https://flagcdn.com/w20/mx.png" alt="flag"> <span>Mexico</span></div>
            <span style="font-size: 0.8em;">▼</span>
        `;
    }

    async function fetchTopSongs(countryCode = 'mx') {
        try {
            if (top5Grid) top5Grid.innerHTML = '<p class="loading" style="color: var(--text-muted); padding: 1rem;">Fetching live data...</p>';
            
            const response = await fetch(`https://itunes.apple.com/${countryCode}/rss/topsongs/limit=5/json`);
            const data = await response.json();
            const songs = data.feed.entry;
            
            if (top5Grid) {
                top5Grid.innerHTML = ''; 
                songs.forEach((song, index) => {
                    const title = song['im:name'].label;
                    const artist = song['im:artist'].label;
                    const imgUrl = song['im:image'][2].label;
                    
                    const card = document.createElement('div');
                    card.className = 'mini-song-card';
                    card.innerHTML = `
                        <div class="rank-badge">${index + 1}</div>
                        <img src="${imgUrl}" alt="${title} cover">
                        <h4 title="${title}">${title}</h4>
                        <p title="${artist}">${artist}</p>
                    `;
                    top5Grid.appendChild(card);
                });
            }
        } catch (error) {
            if (top5Grid) top5Grid.innerHTML = '<p>Error loading live feed for this region.</p>';
            console.error("RSS Error:", error);
        }
    }
    
    // Initial load
    fetchTopSongs();

    // ... KEEP THE REST OF YOUR JS EXACTLY THE SAME (Section 2 and Section 3) ...

    // ==========================================
    // SECTION 2: THE TIME MACHINE & BIOS
    // ==========================================
    const searchBtn = document.getElementById('search-btn');
    const dateInput = document.getElementById('birth-date');
    const resultDisplay = document.getElementById('result-display');

    // Fetch Artist Bio from Wikipedia API
    async function fetchArtistBio(artistName) {
        try {
            const mainArtist = artistName.split(/ feat\. | & |, /i)[0];
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(mainArtist)}`);
            const data = await response.json();
            
            if (data.type === 'standard' && data.extract) {
                return data.extract;
            }
            return "Artist bio currently unavailable.";
        } catch (error) {
            return "Artist bio currently unavailable.";
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const birthDate = dateInput.value;

            if (!birthDate) {
                alert("Please enter a valid date!");
                return;
            }

            const dateFormatted = new Date(birthDate).toLocaleDateString('en-US', { 
                timeZone: 'UTC',
                month: 'long', day: 'numeric', year: 'numeric' 
            });

            try {
                const dbResponse = await fetch('database.json');
                const database = await dbResponse.json();

                const targetTime = new Date(birthDate).getTime();
                let closestChart = null;
                let smallestDiff = Infinity;

                for (let i = 0; i < database.length; i++) {
                    const chartTime = new Date(database[i].date).getTime();
                    const diff = targetTime - chartTime;
                    
                    if (diff >= 0 && diff < smallestDiff) {
                        smallestDiff = diff;
                        closestChart = database[i];
                    }
                }

                if (!closestChart) {
                    resultDisplay.innerHTML = `<p style="margin-top: 20px;">Date too old or not found in database.</p>`;
                    resultDisplay.classList.remove('hidden');
                    return;
                }

                const foundSong = closestChart.data.find(track => track.this_week === 1) || closestChart.data[0];
                const query = encodeURIComponent(`${foundSong.song} ${foundSong.artist}`);
                const appleResponse = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
                const appleData = await appleResponse.json();

                if (appleData.results && appleData.results.length > 0) {
                    const trackData = appleData.results[0];
                    displayResult(trackData, dateFormatted, foundSong.song, foundSong.artist);
                } else {
                    resultDisplay.innerHTML = `<p style="margin-top: 20px;">Audio preview not found on Apple Music.</p>`;
                    resultDisplay.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                resultDisplay.innerHTML = `<p style="margin-top: 20px;">Error connecting to database.</p>`;
                resultDisplay.classList.remove('hidden');
            }
        });
    }

    async function displayResult(track, dateFormatted, originalTitle, originalArtist) {
        if (!resultDisplay) return;
        
        // Show loading state while fetching Wikipedia bio
        resultDisplay.classList.remove('hidden');
        resultDisplay.innerHTML = `<p style="text-align: center; color: var(--accent); margin-top: 20px;">Retrieving history & files...</p>`;
        
        const highResImage = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://via.placeholder.com/600';
        const artistToUse = track.artistName || originalArtist;
        const bioText = await fetchArtistBio(artistToUse);

        resultDisplay.innerHTML = `
            <div class="song-info">
                <h3 style="color: gray; font-size: 0.9rem; text-transform: uppercase;">The #1 Song on ${dateFormatted}</h3>
                <img src="${highResImage}" alt="Song Cover" style="width: 100%; max-width: 300px; border-radius: 8px; margin: 20px 0;">
                <h2>${track.trackName || originalTitle}</h2>
                <p style="font-weight: bold; color: var(--accent);">${artistToUse}</p>
                
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; max-width: 600px; font-size: 0.95rem; line-height: 1.5; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                    <p style="color: var(--text-muted);">${bioText}</p>
                </div>

                <audio id="preview-audio" controls crossorigin="anonymous" src="${track.previewUrl}" style="margin-top: 20px; width: 100%;"></audio>
            </div>
        `;

        const newAudio = document.getElementById('preview-audio');
        newAudio.addEventListener('play', () => {
            initVisualizer(newAudio);
        });
    }

    // ==========================================
    // SECTION 3: SAPPHIRE CASCADE VISUALIZER
    // ==========================================
    const visualizerWrapper = document.getElementById('visualizer-wrapper');
    const canvas = document.getElementById('visualizer-canvas');
    const ctx = canvas.getContext('2d');
    
    let audioCtx, analyzer, source, dataArray;
    let isAnimating = false;
    let time = 0;
    const particles = [];
    const particleCount = 600;

    visualizerWrapper.addEventListener('click', () => {
        visualizerWrapper.classList.toggle('fullscreen');
        resizeCanvas();
    });

    function resizeCanvas() {
        canvas.width = visualizerWrapper.clientWidth;
        canvas.height = visualizerWrapper.clientHeight;
        
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0,
                vy: Math.random() * 5 + 2,
                size: Math.random() * 2 + 1,
                baseAlpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    function initVisualizer(audioElement) {
        visualizerWrapper.classList.remove('hidden');
        resizeCanvas(); 

        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 512;
            dataArray = new Uint8Array(analyzer.frequencyBinCount);
            analyzer.connect(audioCtx.destination);
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        try {
            source = audioCtx.createMediaElementSource(audioElement);
            source.connect(analyzer);
        } catch (e) {
            console.log("Audio already routed to visualizer.");
        }

        if (!isAnimating) {
            isAnimating = true;
            animate();
        }
    }

    function animate() {
        if (!isAnimating) return;
        requestAnimationFrame(animate);
        analyzer.getByteFrequencyData(dataArray);
        time += 0.05;

        let bass = dataArray[2];
        let mid = dataArray[40];
        let treble = dataArray[150];

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - (canvas.height * 0.05); 
        const baseOrbRadius = Math.min(canvas.width, canvas.height) * 0.15;
        const orbRadius = baseOrbRadius + (bass * 0.3);

        // 1. CLEAR SCREEN
        let bgGrd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrd.addColorStop(0, '#010512');
        bgGrd.addColorStop(0.5, '#021026');
        bgGrd.addColorStop(1, '#001a4d');
        ctx.fillStyle = bgGrd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. THE WATERFALL ENGINE
        ctx.fillStyle = '#ffffff';
        particles.forEach(p => {
            p.vy += 0.05; 
            let currentSpeed = p.vy * (1 + (treble / 500));
            p.y += currentSpeed;
            p.x += p.vx;
            p.vx *= 0.95; 

            let dx = p.x - centerX;
            let dy = p.y - centerY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            let collisionRadius = orbRadius + 20;
            if (distance < collisionRadius) {
                let force = (collisionRadius - distance) / collisionRadius;
                p.vx += (dx / distance) * force * 5;
                if (p.y < centerY) p.vy = -1 - Math.random() * 2;
            }

            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
                p.vy = Math.random() * 5 + 2;
                p.vx = 0;
            }

            ctx.globalAlpha = p.baseAlpha + (mid / 255) * 0.5;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00e5ff';
            ctx.fillRect(p.x, p.y, p.size, p.size * (3 + currentSpeed/2));
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // 3. RADIAL FREQUENCY ORB
        let coreGlow = ctx.createRadialGradient(centerX, centerY, orbRadius * 0.5, centerX, centerY, orbRadius * 2);
        coreGlow.addColorStop(0, `rgba(0, 229, 255, ${0.1 + bass/300})`);
        coreGlow.addColorStop(0.5, `rgba(0, 102, 255, ${0.05 + bass/600})`);
        coreGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        const activeData = dataArray.slice(0, Math.floor(dataArray.length * 0.6));
        const totalPoints = activeData.length * 2;

        ctx.beginPath();
        ctx.lineWidth = visualizerWrapper.classList.contains('fullscreen') ? 4 : 2; 
        ctx.lineCap = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';

        for (let i = 0; i < totalPoints; i++) {
            let dataIndex = i < activeData.length ? i : totalPoints - i;
            let angle = (i / totalPoints) * Math.PI * 2 - Math.PI / 2;
            
            let waveScale = visualizerWrapper.classList.contains('fullscreen') ? 0.8 : 0.3;
            let waveHeight = activeData[dataIndex] * waveScale;
            let r = orbRadius + waveHeight;

            let px = centerX + Math.cos(angle) * r;
            let py = centerY + Math.sin(angle) * r;
            let ix = centerX + Math.cos(angle) * orbRadius;
            let iy = centerY + Math.sin(angle) * orbRadius;

            ctx.strokeStyle = `rgb(${200 - waveHeight}, ${255}, 255)`;
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(px, py);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#010512';
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbRadius - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. HORIZONTAL AUDIO WAVES
        let lakeY = canvas.height * 0.85;
        
        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();
            ctx.lineWidth = 3 - layer;
            ctx.strokeStyle = `rgba(${100 + layer*50}, ${200 + layer*20}, 255, ${0.8 - layer*0.2})`;
            
            for (let i = 0; i <= canvas.width; i += 10) {
                let audioIdx = Math.floor((i / canvas.width) * (dataArray.length * 0.5));
                let waveScale = visualizerWrapper.classList.contains('fullscreen') ? (0.3 + layer * 0.1) : 0.1;
                let audioSpike = dataArray[audioIdx] * waveScale;
                
                let y = lakeY + (layer * (canvas.height*0.03)) + Math.sin(i * 0.01 + time + layer) * 15 - audioSpike;
                
                if (i === 0) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.closePath();
            
            let waterGrd = ctx.createLinearGradient(0, lakeY, 0, canvas.height);
            waterGrd.addColorStop(0, `rgba(0, 102, 255, ${0.2 - layer*0.05})`);
            waterGrd.addColorStop(1, `rgba(0, 20, 50, 0.9)`);
            ctx.fillStyle = waterGrd;
            
            ctx.fill();
            ctx.stroke();
        }
    }

    window.addEventListener('resize', () => {
        if (!visualizerWrapper.classList.contains('hidden')) {
            resizeCanvas();
        }
    });
});