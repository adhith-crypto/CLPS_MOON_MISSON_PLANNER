let craters = [];
let launchSites = [];
let selectedCrater = null;

let zoom = 1;
let rotationX = 0;
let rotationY = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;

const landingSite = document.getElementById("landingSite");
const launchSite = document.getElementById("launchSite");
const missionDate = document.getElementById("missionDate");
const lunarHour = document.getElementById("lunarHour");
const lunarHourValue = document.getElementById("lunarHourValue");

const moon = document.getElementById("moon");
const craterLayer = document.getElementById("craterLayer");
const space = document.getElementById("space");


// --------------------------------------------------
// INITIAL SETUP
// --------------------------------------------------

function setDefaultDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    missionDate.value = `${year}-${month}-${day}`;
}


// --------------------------------------------------
// LOAD NASA-STYLE DATA FROM FLASK
// --------------------------------------------------

async function loadData() {

    try {

        const [craterResponse, launchResponse] = await Promise.all([
            fetch("/api/craters"),
            fetch("/api/launch-sites")
        ]);

        if (!craterResponse.ok || !launchResponse.ok) {
            throw new Error("Could not load mission data.");
        }

        craters = await craterResponse.json();
        launchSites = await launchResponse.json();

        populateLaunchSites();
        populateLandingSites();

        renderCraters();

        if (craters.length > 0) {
            selectedCrater = craters[0];
            landingSite.value = selectedCrater.name;
            analyzeSite();
        }

    } catch (error) {

        console.error(error);

        document.getElementById("assessment").textContent =
            "Unable to load mission data.";
    }
}


// --------------------------------------------------
// DROPDOWNS
// --------------------------------------------------

function populateLaunchSites() {

    launchSite.innerHTML = "";

    launchSites.forEach(site => {

        const option = document.createElement("option");

        option.value = site.name;

        option.textContent =
            `${site.name} — ${site.country}`;

        launchSite.appendChild(option);
    });
}


function populateLandingSites() {

    landingSite.innerHTML = "";

    craters.forEach(crater => {

        const option = document.createElement("option");

        option.value = crater.name;
        option.textContent = crater.name;

        landingSite.appendChild(option);
    });
}


// --------------------------------------------------
// DRAW CRATERS
// --------------------------------------------------

function renderCraters() {

    if (!craterLayer) return;

    craterLayer.innerHTML = "";

    const southPoleOnly =
        document.getElementById("southPoleOnly").checked;

    const majorOnly =
        document.getElementById("majorOnly").checked;


    craters.forEach(crater => {

        if (
            southPoleOnly &&
            crater.region !== "South Pole"
        ) {
            return;
        }

        if (
            majorOnly &&
            Number(crater.diameter_km) < 50
        ) {
            return;
        }


        const marker = document.createElement("button");

        marker.className = "crater";

        marker.title = crater.name;

        /*
            Convert latitude/longitude into
            a position on the polar map.
        */

        const longitude =
            Number(crater.lon);

        const latitude =
            Number(crater.lat);


        let x =
            50 + (longitude / 180) * 42;

        let y =
            50 - ((latitude + 90) / 180) * 42;


        x = Math.max(8, Math.min(92, x));
        y = Math.max(8, Math.min(92, y));


        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;


        if (
            selectedCrater &&
            selectedCrater.name === crater.name
        ) {
            marker.classList.add("selected");
        }


        marker.addEventListener("click", function(event) {

            event.stopPropagation();

            selectedCrater = crater;

            landingSite.value = crater.name;

            renderCraters();

            analyzeSite();
        });


        const label = document.createElement("span");

        label.className = "crater-name";

        label.textContent = crater.name;

        marker.appendChild(label);

        craterLayer.appendChild(marker);
    });
}


// --------------------------------------------------
// ANALYZE SELECTED SITE
// --------------------------------------------------

async function analyzeSite() {

    if (!landingSite.value) return;

    selectedCrater =
        craters.find(
            crater =>
                crater.name === landingSite.value
        );

    if (!selectedCrater) return;


    const latitude =
        Number(selectedCrater.lat);

    const longitude =
        Number(selectedCrater.lon);

    const date =
        missionDate.value;

    const hour =
        Number(lunarHour.value);


    try {

        const params = new URLSearchParams({

            latitude: latitude,
            longitude: longitude,
            date: date,
            hour: hour

        });


        const response =
            await fetch(
                `/api/conditions?${params.toString()}`
            );


        if (!response.ok) {
            throw new Error("Analysis failed.");
        }


        const data =
            await response.json();


        updateMissionPanel(data);

        updateSiteInformation();

        updateAssessment(data);

        renderCraters();

        updateComparison();

    } catch (error) {

        console.error(error);

        document.getElementById("assessment").textContent =
            "Mission analysis unavailable.";
    }
}


// --------------------------------------------------
// UPDATE MISSION CONDITIONS
// --------------------------------------------------

function updateMissionPanel(data) {

    const sun =
        data.sun.elevation_degrees;

    const power =
        data.sun.power_potential_percent;

    const earth =
        data.earth.visibility_percent;


    document.getElementById(
        "sunElevation"
    ).textContent =
        `${Number(sun).toFixed(1)}°`;


    document.getElementById(
        "powerPotential"
    ).textContent =
        `${Number(power).toFixed(0)}%`;


    document.getElementById(
        "earthVisibility"
    ).textContent =
        `${Number(earth).toFixed(0)}%`;


    document.getElementById(
        "communicationStatus"
    ).textContent =
        data.communication.status;


    document.getElementById(
        "powerBar"
    ).style.width =
        `${power}%`;


    document.getElementById(
        "earthBar"
    ).style.width =
        `${earth}%`;
}


// --------------------------------------------------
// SITE INFORMATION
// --------------------------------------------------

function updateSiteInformation() {

    const crater =
        selectedCrater;


    document.getElementById(
        "siteName"
    ).textContent =
        crater.name;


    document.getElementById(
        "siteCoordinates"
    ).textContent =
        `${Number(crater.lat).toFixed(2)}°, ` +
        `${Number(crater.lon).toFixed(2)}°`;


    document.getElementById(
        "siteDiameter"
    ).textContent =
        `${Number(crater.diameter_km).toFixed(1)} km`;


    document.getElementById(
        "siteRegion"
    ).textContent =
        crater.region;
}


// --------------------------------------------------
// MISSION ASSESSMENT
// --------------------------------------------------

function updateAssessment(data) {

    const assessment =
        document.getElementById("assessment");


    const sun =
        Number(data.sun.elevation_degrees);

    const power =
        Number(data.sun.power_potential_percent);

    const earth =
        Number(data.earth.visibility_percent);


    let message = "";


    if (sun <= 0) {

        message =
            "Low-light conditions. " +
            "Solar power generation is currently limited.";

    } else if (power >= 80) {

        message =
            "Strong solar illumination. " +
            "Conditions are favorable for power generation.";

    } else if (power >= 40) {

        message =
            "Moderate illumination. " +
            "Solar availability should be considered during planning.";

    } else {

        message =
            "Limited illumination. " +
            "Power availability may be a significant constraint.";
    }


    if (earth >= 90) {

        message +=
            " Direct Earth visibility is favorable.";

    } else if (earth >= 70) {

        message +=
            " Earth visibility is generally good.";

    } else {

        message +=
            " Earth visibility may require additional communications planning.";
    }


    assessment.textContent = message;
}


// --------------------------------------------------
// SITE COMPARISON
// --------------------------------------------------

async function updateComparison() {

    const candidates =
        craters
            .slice(0, 8)
            .map(crater => crater.name)
            .join(",");


    if (!candidates) return;


    const params = new URLSearchParams({

        sites: candidates,

        date: missionDate.value,

        hour: lunarHour.value

    });


    try {

        const response =
            await fetch(
                `/api/compare?${params.toString()}`
            );


        const results =
            await response.json();


        renderComparison(results);

    } catch (error) {

        console.error(
            "Comparison failed:",
            error
        );
    }
}


function renderComparison(results) {

    const container =
        document.getElementById(
            "comparisonGrid"
        );


    container.innerHTML = "";


    results.forEach(site => {

        const card =
            document.createElement("div");


        card.className =
            "comparison-card";


        card.innerHTML = `

            <h3>${site.name}</h3>

            <div>
                Sun elevation:
                <strong>
                    ${site.conditions.sun_elevation}°
                </strong>
            </div>

            <div>
                Solar potential:
                <strong>
                    ${site.conditions.power_potential}%
                </strong>
            </div>

            <div>
                Earth visibility:
                <strong>
                    ${site.conditions.earth_visibility}%
                </strong>
            </div>

            <div>
                Communication:
                <strong>
                    ${site.conditions.communication}
                </strong>
            </div>

        `;


        card.addEventListener(
            "click",
            () => {

                landingSite.value =
                    site.name;

                selectedCrater =
                    craters.find(
                        crater =>
                            crater.name === site.name
                    );

                analyzeSite();
            }
        );


        container.appendChild(card);
    });
}


// --------------------------------------------------
// TIME SLIDER
// --------------------------------------------------

lunarHour.addEventListener(
    "input",
    () => {

        lunarHourValue.textContent =
            `${String(lunarHour.value).padStart(2, "0")}:00`;

    }
);


lunarHour.addEventListener(
    "change",
    analyzeSite
);


// --------------------------------------------------
// BUTTONS
// --------------------------------------------------

document
    .getElementById("analyzeButton")
    .addEventListener(
        "click",
        analyzeSite
    );


document
    .getElementById("resetButton")
    .addEventListener(
        "click",
        () => {

            zoom = 1;

            rotationX = 0;
            rotationY = 0;

            updateMoonTransform();
        }
    );


landingSite.addEventListener(
    "change",
    analyzeSite
);


missionDate.addEventListener(
    "change",
    analyzeSite
);


document
    .getElementById("southPoleOnly")
    .addEventListener(
        "change",
        renderCraters
    );


document
    .getElementById("majorOnly")
    .addEventListener(
        "change",
        renderCraters
    );


// --------------------------------------------------
// ZOOM
// --------------------------------------------------

document
    .getElementById("zoomIn")
    .addEventListener(
        "click",
        () => {

            zoom =
                Math.min(
                    zoom + 0.15,
                    2.5
                );

            updateMoonTransform();
        }
    );


document
    .getElementById("zoomOut")
    .addEventListener(
        "click",
        () => {

            zoom =
                Math.max(
                    zoom - 0.15,
                    0.7
                );

            updateMoonTransform();
        }
    );


// --------------------------------------------------
// DRAGGING / ROTATION
// --------------------------------------------------

space.addEventListener(
    "mousedown",
    event => {

        dragging = true;

        lastX = event.clientX;
        lastY = event.clientY;

        space.classList.add("dragging");
    }
);


window.addEventListener(
    "mouseup",
    () => {

        dragging = false;

        space.classList.remove("dragging");
    }
);


window.addEventListener(
    "mousemove",
    event => {

        if (!dragging) return;


        const deltaX =
            event.clientX - lastX;

        const deltaY =
            event.clientY - lastY;


        rotationY +=
            deltaX * 0.3;

        rotationX +=
            deltaY * 0.15;


        rotationX =
            Math.max(
                -45,
                Math.min(
                    45,
                    rotationX
                )
            );


        lastX = event.clientX;
        lastY = event.clientY;


        updateMoonTransform();
    }
);


space.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        if (event.deltaY < 0) {

            zoom =
                Math.min(
                    zoom + 0.1,
                    2.5
                );

        } else {

            zoom =
                Math.max(
                    zoom - 0.1,
                    0.7
                );
        }


        updateMoonTransform();
    },
    { passive: false }
);


// --------------------------------------------------
// MOON TRANSFORM
// --------------------------------------------------

function updateMoonTransform() {

    moon.style.transform =
        `scale(${zoom}) ` +
        `rotateX(${rotationX}deg) ` +
        `rotateY(${rotationY}deg)`;
}


// --------------------------------------------------
// VIEW BUTTONS
// --------------------------------------------------

document
    .getElementById("viewTop")
    .addEventListener(
        "click",
        () => {

            rotationX = 0;
            rotationY = 0;

            updateMoonTransform();
        }
    );


document
    .getElementById("viewGlobe")
    .addEventListener(
        "click",
        () => {

            rotationX = -18;
            rotationY = 25;

            updateMoonTransform();
        }
    );


// --------------------------------------------------
// CURSOR COORDINATES
// --------------------------------------------------

space.addEventListener(
    "mousemove",
    event => {

        const rect =
            space.getBoundingClientRect();


        const x =
            ((event.clientX - rect.left) /
                rect.width) * 360 - 180;


        const y =
            90 -
            ((event.clientY - rect.top) /
                rect.height) * 180;


        document.getElementById(
            "cursorCoords"
        ).textContent =
            `LAT ${y.toFixed(1)} / LON ${x.toFixed(1)}`;
    }
);


// --------------------------------------------------
// START APPLICATION
// --------------------------------------------------

setDefaultDate();

loadData();
