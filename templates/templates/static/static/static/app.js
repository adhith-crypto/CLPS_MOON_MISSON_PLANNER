let craters = [];
let launchSites = [];
let selectedCrater = null;
let comparisonSites = [];


// =====================================================
// STARTUP
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    setDefaultDate();

    await loadCraters();
    await loadLaunchSites();

    setupControls();

    renderCraters();

    if (craters.length > 0) {
        selectCrater(craters[0]);
    }
});


// =====================================================
// LOAD DATA
// =====================================================

async function loadCraters() {

    try {

        const response = await fetch("/api/craters");

        if (!response.ok) {
            throw new Error("Could not load crater data");
        }

        craters = await response.json();

        populateLandingSites();

    } catch (error) {

        console.error(error);

        document.getElementById("selectedTitle").textContent =
            "Crater data unavailable";
    }
}


async function loadLaunchSites() {

    try {

        const response = await fetch("/api/launch-sites");

        if (!response.ok) {
            throw new Error("Could not load launch sites");
        }

        launchSites = await response.json();

        populateLaunchSites();

    } catch (error) {

        console.error(error);

        const select = document.getElementById("launchSite");

        select.innerHTML =
            `<option value="">No launch sites available</option>`;
    }
}


// =====================================================
// DROPDOWNS
// =====================================================

function populateLandingSites() {

    const select = document.getElementById("landingSite");

    select.innerHTML = "";

    craters.forEach((crater, index) => {

        const option = document.createElement("option");

        option.value = index;

        option.textContent =
            `${crater.name} — ${crater.region}`;

        select.appendChild(option);
    });
}


function populateLaunchSites() {

    const select = document.getElementById("launchSite");

    select.innerHTML = "";

    launchSites.forEach((site, index) => {

        const option = document.createElement("option");

        option.value = index;

        option.textContent =
            `${site.name} — ${site.country}`;

        select.appendChild(option);
    });
}


// =====================================================
// CONTROLS
// =====================================================

function setupControls() {

    const landingSite =
        document.getElementById("landingSite");

    const lunarHour =
        document.getElementById("lunarHour");

    const southPoleOnly =
        document.getElementById("southPoleOnly");

    const majorOnly =
        document.getElementById("majorOnly");

    const analyzeBtn =
        document.getElementById("analyzeBtn");

    const clearBtn =
        document.getElementById("clearComparison");


    landingSite.addEventListener("change", () => {

        const index = Number(landingSite.value);

        if (craters[index]) {
            selectCrater(craters[index]);
        }
    });


    lunarHour.addEventListener("input", () => {

        updateHourDisplay();

        if (selectedCrater) {
            analyzeCrater(selectedCrater);
        }
    });


    southPoleOnly.addEventListener("change", () => {
        renderCraters();
        populateLandingSites();
    });


    majorOnly.addEventListener("change", () => {
        renderCraters();
        populateLandingSites();
    });


    analyzeBtn.addEventListener("click", () => {

        if (selectedCrater) {
            analyzeCrater(selectedCrater);
        }
    });


    clearBtn.addEventListener("click", () => {

        comparisonSites = [];

        renderComparison();
    });


    updateHourDisplay();
}


// =====================================================
// DATE
// =====================================================

function setDefaultDate() {

    const dateInput =
        document.getElementById("missionDate");

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const day =
        String(today.getDate()).padStart(2, "0");

    dateInput.value =
        `${year}-${month}-${day}`;
}


// =====================================================
// HOUR
// =====================================================

function updateHourDisplay() {

    const slider =
        document.getElementById("lunarHour");

    const output =
        document.getElementById("hourValue");

    const hour =
        Number(slider.value);

    const hours =
        Math.floor(hour);

    const minutes =
        Math.round((hour - hours) * 60);

    output.textContent =
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


// =====================================================
// CRATER FILTERING
// =====================================================

function getFilteredCraters() {

    const southPoleOnly =
        document.getElementById("southPoleOnly").checked;

    const majorOnly =
        document.getElementById("majorOnly").checked;

    return craters.filter(crater => {

        if (
            southPoleOnly &&
            crater.region !== "South Pole"
        ) {
            return false;
        }

        if (
            majorOnly &&
            crater.region !== "Major"
        ) {
            return false;
        }

        return true;
    });
}


// =====================================================
// RENDER MOON CRATERS
// =====================================================

function renderCraters() {

    const layer =
        document.getElementById("craterLayer");

    layer.innerHTML = "";

    const visibleCraters =
        getFilteredCraters();

    visibleCraters.forEach(crater => {

        const marker =
            document.createElement("div");

        marker.className =
            "crater-marker";

        marker.title =
            `${crater.name} (${crater.lat}°, ${crater.lon}°)`;

        /*
         * Convert longitude to horizontal position.
         * Latitude is compressed toward the south-pole
         * region for this visualization.
         */

        let x =
            ((crater.lon + 180) / 360) * 100;

        let y =
            ((90 - crater.lat) / 180) * 100;

        x = clamp(x, 5, 95);
        y = clamp(y, 5, 95);

        marker.style.left =
            `${x}%`;

        marker.style.top =
            `${y}%`;

        marker.addEventListener("click", () => {

            selectCrater(crater);

        });

        layer.appendChild(marker);
    });

    updateSelectedMarker();
}


// =====================================================
// SELECT CRATER
// =====================================================

function selectCrater(crater) {

    selectedCrater = crater;

    document.getElementById("landingSite").value =
        craters.indexOf(crater);

    document.getElementById("selectedTitle").textContent =
        crater.name;

    document.getElementById("infoName").textContent =
        crater.name;

    document.getElementById("coordinates").textContent =
        `${formatCoordinate(crater.lat, true)} / ${formatCoordinate(crater.lon, false)}`;

    document.getElementById("latitude").textContent =
        `${crater.lat.toFixed(2)}°`;

    document.getElementById("longitude").textContent =
        `${crater.lon.toFixed(2)}°`;

    document.getElementById("diameter").textContent =
        `${crater.diameter_km} km`;

    updateSelectedMarker();

    analyzeCrater(crater);
}


// =====================================================
// SELECTED MARKER
// =====================================================

function updateSelectedMarker() {

    const markers =
        document.querySelectorAll(".crater-marker");

    markers.forEach(marker => {

        marker.classList.remove("selected");

        if (!selectedCrater) {
            return;
        }

        const lat =
            selectedCrater.lat;

        const lon =
            selectedCrater.lon;

        let x =
            ((lon + 180) / 360) * 100;

        let y =
            ((90 - lat) / 180) * 100;

        x = clamp(x, 5, 95);
        y = clamp(y, 5, 95);

        const markerX =
            parseFloat(marker.style.left);

        const markerY =
            parseFloat(marker.style.top);

        if (
            Math.abs(markerX - x) < 0.5 &&
            Math.abs(markerY - y) < 0.5
        ) {
            marker.classList.add("selected");
        }
    });
}


// =====================================================
// ANALYSIS
// =====================================================

async function analyzeCrater(crater) {

    const date =
        document.getElementById("missionDate").value;

    const hour =
        document.getElementById("lunarHour").value;

    if (!date) {
        return;
    }

    try {

        const params =
            new URLSearchParams({

                latitude: crater.lat,
                longitude: crater.lon,
                date: date,
                hour: hour

            });

        const response =
            await fetch(`/api/conditions?${params}`);

        if (!response.ok) {
            throw new Error("Analysis failed");
        }

        const data =
            await response.json();

        updateDashboard(data);

        addToComparison(crater, data);

    } catch (error) {

        console.error(error);

        document.getElementById(
            "communicationStatus"
        ).textContent = "ERROR";
    }
}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard(data) {

    const sunElevation =
        data.sun.elevation_degrees;

    const power =
        data.sun.power_potential_percent;

    const earth =
        data.earth.visibility_percent;

    document.getElementById("sunElevation").textContent =
        `${sunElevation.toFixed(1)}°`;

    document.getElementById("powerPotential").textContent =
        `${power.toFixed(0)}%`;

    document.getElementById("earthVisibility").textContent =
        `${earth.toFixed(0)}%`;


    const sunBar =
        document.getElementById("sunBar");

    const powerBar =
        document.getElementById("powerBar");

    const earthBar =
        document.getElementById("earthBar");


    /*
     * Sun elevation can be negative, so convert it
     * into a 0–100 visualization scale.
     */

    const sunPercentage =
        clamp(
            ((sunElevation + 10) / 40) * 100,
            0,
            100
        );


    sunBar.style.width =
        `${sunPercentage}%`;

    powerBar.style.width =
        `${power}%`;

    earthBar.style.width =
        `${earth}%`;


    document.getElementById(
        "communicationStatus"
    ).textContent =
        data.communication.status;
}


// =====================================================
// COMPARISON
// =====================================================

function addToComparison(crater, data) {

    const existing =
        comparisonSites.find(
            site => site.crater.name === crater.name
        );

    const entry = {
        crater: crater,
        data: data
    };

    if (existing) {

        existing.data = data;

    } else {

        comparisonSites.push(entry);
    }

    /*
     * Keep the comparison panel manageable.
     */

    if (comparisonSites.length > 6) {
        comparisonSites.shift();
    }

    renderComparison();
}


function renderComparison() {

    const container =
        document.getElementById("comparisonList");

    container.innerHTML = "";

    if (comparisonSites.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Select sites to compare them.
            </div>
        `;

        return;
    }


    comparisonSites.forEach(entry => {

        const crater =
            entry.crater;

        const data =
            entry.data;

        const card =
            document.createElement("div");

        card.className =
            "comparison-card";

        card.innerHTML = `
            <h3>${escapeHtml(crater.name)}</h3>

            <p>
                Sun:
                <strong>
                    ${data.sun.elevation_degrees.toFixed(1)}°
                </strong>
            </p>

            <p>
                Solar potential:
                <strong>
                    ${data.sun.power_potential_percent.toFixed(0)}%
                </strong>
            </p>

            <p>
                Earth visibility:
                <strong>
                    ${data.earth.visibility_percent.toFixed(0)}%
                </strong>
            </p>

            <p>
                Communication:
                <strong>
                    ${escapeHtml(data.communication.status)}
                </strong>
            </p>
        `;

        card.addEventListener("click", () => {

            selectCrater(crater);

        });

        container.appendChild(card);
    });
}


// =====================================================
// HELPERS
// =====================================================

function clamp(value, minimum, maximum) {

    return Math.max(
        minimum,
        Math.min(maximum, value)
    );
}


function formatCoordinate(value, latitude) {

    const direction = latitude
        ? value >= 0 ? "N" : "S"
        : value >= 0 ? "E" : "W";

    return `${Math.abs(value).toFixed(2)}° ${direction}`;
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
