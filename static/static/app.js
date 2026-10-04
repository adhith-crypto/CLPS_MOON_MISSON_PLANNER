let craters = [];
let launchSites = [];
let selectedCrater = null;

const craterSelect = document.getElementById("landingSite");
const launchSelect = document.getElementById("launchSite");
const dateInput = document.getElementById("missionDate");
const hourInput = document.getElementById("lunarHour");
const hourValue = document.getElementById("lunarHourValue");
const analyzeButton = document.getElementById("analyzeButton");

async function loadData() {
    try {
        const [craterResponse, launchResponse] = await Promise.all([
            fetch("/api/craters"),
            fetch("/api/launch-sites")
        ]);

        craters = await craterResponse.json();
        launchSites = await launchResponse.json();

        populateLaunchSites();
        populateCraters();
        renderCraters();

        if (craters.length > 0) {
            selectedCrater = craters[0];
            craterSelect.value = selectedCrater.name;
            analyzeSite();
        }
    } catch (error) {
        console.error("Failed to load mission data:", error);
    }
}

function populateLaunchSites() {
    launchSelect.innerHTML = "";

    launchSites.forEach(site => {
        const option = document.createElement("option");
        option.value = site.name;
        option.textContent = `${site.name} — ${site.country}`;
        launchSelect.appendChild(option);
    });
}

function populateCraters() {
    craterSelect.innerHTML = "";

    craters.forEach(crater => {
        const option = document.createElement("option");
        option.value = crater.name;
        option.textContent = crater.name;
        craterSelect.appendChild(option);
    });
}

function renderCraters() {
    const moon = document.getElementById("moon");
    if (!moon) return;

    document.querySelectorAll(".crater-marker").forEach(marker => marker.remove());
    document.querySelectorAll(".crater-label").forEach(label => label.remove());

    const southPoleOnly = document.getElementById("southPoleOnly")?.checked;
    const majorOnly = document.getElementById("majorOnly")?.checked;

    craters.forEach(crater => {
        if (southPoleOnly && crater.region !== "South Pole") {
            return;
        }

        if (majorOnly && crater.diameter_km < 50) {
            return;
        }

        const marker = document.createElement("div");
        marker.className = "crater-marker";

        const x = 50 + (crater.lon / 180) * 38;
        const y = 50 - ((crater.lat + 90) / 180) * 40;

        marker.style.left = `${Math.max(5, Math.min(95, x))}%`;
        marker.style.top = `${Math.max(5, Math.min(95, y))}%`;

        if (
            selectedCrater &&
            selectedCrater.name === crater.name
        ) {
            marker.classList.add("selected");
        }

        marker.title = crater.name;

        marker.addEventListener("click", () => {
            selectedCrater = crater;
            craterSelect.value = crater.name;
            renderCraters();
            analyzeSite();
        });

        moon.appendChild(marker);

        const label = document.createElement("div");
        label.className = "crater-label";
        label.textContent = crater.name;
        label.style.left = marker.style.left;
        label.style.top = marker.style.top;

        moon.appendChild(label);
    });
}

async function analyzeSite() {
    const name = craterSelect.value;

    selectedCrater = craters.find(
        crater => crater.name === name
    );

    if (!selectedCrater) return;

    renderCraters();

    const date = dateInput.value;
    const hour = hourInput.value;

    const params = new URLSearchParams({
        latitude: selectedCrater.lat,
        longitude: selectedCrater.lon,
        date: date,
        hour: hour
    });

    try {
        const response = await fetch(`/api/conditions?${params}`);
        const data = await response.json();

        updateConditions(data);
        updateSiteDetails(selectedCrater);
        updateComparison();
    } catch (error) {
        console.error("Analysis failed:", error);
    }
}

function updateConditions(data) {
    const sunElevation = data.sun.elevation_degrees;
    const power = data.sun.power_potential_percent;
    const earth = data.earth.visibility_percent;

    const sunElement = document.getElementById("sunElevation");
    const powerElement = document.getElementById("powerPotential");
    const earthElement = document.getElementById("earthVisibility");
    const communicationElement =
        document.getElementById("communicationStatus");

    if (sunElement) {
        sunElement.textContent = `${sunElevation.toFixed(1)}°`;
    }

    if (powerElement) {
        powerElement.textContent = `${power.toFixed(0)}%`;
    }

    if (earthElement) {
        earthElement.textContent = `${earth.toFixed(0)}%`;
    }

    if (communicationElement) {
        communicationElement.textContent =
            data.communication.status;
    }

    const powerBar = document.getElementById("powerBar");
    const earthBar = document.getElementById("earthBar");

    if (powerBar) {
        powerBar.style.width = `${power}%`;
    }

    if (earthBar) {
        earthBar.style.width = `${earth}%`;
    }
}

function updateSiteDetails(crater) {
    const name = document.getElementById("siteName");
    const coordinates = document.getElementById("siteCoordinates");
    const diameter = document.getElementById("siteDiameter");
    const region = document.getElementById("siteRegion");

    if (name) name.textContent = crater.name;

    if (coordinates) {
        coordinates.textContent =
            `${Number(crater.lat).toFixed(2)}°, ` +
            `${Number(crater.lon).toFixed(2)}°`;
    }

    if (diameter) {
        diameter.textContent =
            `${Number(crater.diameter_km).toFixed(1)} km`;
    }

    if (region) {
        region.textContent = crater.region;
    }
}

async function updateComparison() {
    const selected = craters
        .slice(0, 6)
        .map(crater => crater.name)
        .join(",");

    const date = dateInput.value;
    const hour = hourInput.value;

    try {
        const response = await fetch(
            `/api/compare?sites=${encodeURIComponent(selected)}` +
            `&date=${encodeURIComponent(date)}` +
            `&hour=${encodeURIComponent(hour)}`
        );

        const results = await response.json();
        renderComparison(results);
    } catch (error) {
        console.error("Comparison failed:", error);
    }
}

function renderComparison(results) {
    const container =
        document.getElementById("comparisonGrid");

    if (!container) return;

    container.innerHTML = "";

    results.forEach(site => {
        const card = document.createElement("div");
        card.className = "site-card";

        card.innerHTML = `
            <h3>${site.name}</h3>
            <p>Sun elevation: ${site.conditions.sun_elevation}°</p>
            <p>Solar potential: ${site.conditions.power_potential}%</p>
            <p>Earth visibility: ${site.conditions.earth_visibility}%</p>
            <p>Communication: ${site.conditions.communication}</p>
        `;

        container.appendChild(card);
    });
}

hourInput?.addEventListener("input", () => {
    hourValue.textContent = `${hourInput.value}:00`;
});

analyzeButton?.addEventListener("click", analyzeSite);

craterSelect?.addEventListener("change", analyzeSite);

document
    .getElementById("southPoleOnly")
    ?.addEventListener("change", renderCraters);

document
    .getElementById("majorOnly")
    ?.addEventListener("change", renderCraters);

dateInput?.addEventListener("change", analyzeSite);

loadData();
