/* =========================================================
   LUNAR SOUTH POLE MISSION PLANNER
   3D MISSION INTERFACE
========================================================= */

const THREE = window.THREE;


/* =========================================================
   GLOBAL STATE
========================================================= */

let scene;
let camera;
let renderer;

let moon;
let earth;
let sun;

let craterGroup;
let atmosphere;

let craterData = [];
let launchData = [];

let craterMeshes = [];

let selectedCrater = null;

let cameraDistance = 7.5;

let cameraYaw = 0.65;
let cameraPitch = 0.35;

let isDragging = false;
let previousMouse = {
    x: 0,
    y: 0
};

let raycaster;
let mouse;

let animationStarted = false;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const launchSiteSelect = $("launchSite");
const landingSiteSelect = $("landingSite");
const missionDate = $("missionDate");
const lunarHour = $("lunarHour");
const lunarHourValue = $("lunarHourValue");

const analyzeButton = $("analyzeButton");
const resetButton = $("resetButton");

const southPoleOnly = $("southPoleOnly");
const majorOnly = $("majorOnly");

const zoomIn = $("zoomIn");
const zoomOut = $("zoomOut");

const viewTop = $("viewTop");
const viewGlobe = $("viewGlobe");

const sunElevation = $("sunElevation");
const powerPotential = $("powerPotential");
const earthVisibility = $("earthVisibility");
const communicationStatus = $("communicationStatus");

const powerBar = $("powerBar");
const earthBar = $("earthBar");

const siteName = $("siteName");
const siteLatitude = $("siteLatitude");
const siteLongitude = $("siteLongitude");
const siteDiameter = $("siteDiameter");
const siteRegion = $("siteRegion");

const assessment = $("assessment");

const comparisonGrid = $("comparisonGrid");

const cameraDistanceDisplay = $("cameraDistance");

const cursorCoords = $("cursorCoords");

const sunLabel = $("sun-label");
const earthLabel = $("earth-label");

const loadingOverlay = $("loading-overlay");
const loadingProgress = $("loadingProgress");
const loadingText = $("loadingText");


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setDefaultDate();

    initializeThree();

    setupControls();

    updateLoading(15, "Initializing 3D environment...");

    await loadMissionData();

    updateLoading(100, "Mission environment ready.");

    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.style.opacity = "0";

            setTimeout(() => {
                loadingOverlay.style.display = "none";
            }, 500);
        }
    }, 400);

    if (landingSiteSelect.options.length > 0) {
        landingSiteSelect.selectedIndex = 0;
        selectCraterByName(landingSiteSelect.value);
    }

    animationStarted = true;
    animate();
});


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

    if (!missionDate) return;

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    missionDate.value = `${year}-${month}-${day}`;
}


/* =========================================================
   THREE.JS INITIALIZATION
========================================================= */

function initializeThree() {

    const container = $("three-container");

    if (!container) {
        console.error("3D container not found.");
        return;
    }

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x020304);


    /* CAMERA */

    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );

    camera.position.set(4.7, 3.2, 5.8);


    /* RENDERER */

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);


    /* LIGHTING */

    const ambientLight = new THREE.AmbientLight(
        0x303030,
        1.0
    );

    scene.add(ambientLight);


    /* SUN LIGHT */

    const sunlight = new THREE.PointLight(
        0xffffff,
        500,
        0,
        2
    );

    sunlight.position.set(
        12,
        5,
        8
    );

    sunlight.castShadow = true;

    scene.add(sunlight);


    /* STARS */

    createStars();


    /* MOON */

    createMoon();


    /* EARTH */

    createEarth();


    /* SUN */

    createSun();


    /* RAYCASTING */

    raycaster = new THREE.Raycaster();

    mouse = new THREE.Vector2();


    /* RESIZE */

    window.addEventListener(
        "resize",
        handleResize
    );


    /* MOUSE */

    renderer.domElement.addEventListener(
        "pointerdown",
        handlePointerDown
    );

    renderer.domElement.addEventListener(
        "pointermove",
        handlePointerMove
    );

    renderer.domElement.addEventListener(
        "pointerup",
        handlePointerUp
    );

    renderer.domElement.addEventListener(
        "pointerleave",
        handlePointerUp
    );

    renderer.domElement.addEventListener(
        "wheel",
        handleWheel,
        { passive: false }
    );

    renderer.domElement.addEventListener(
        "click",
        handleSceneClick
    );
}


/* =========================================================
   STARS
========================================================= */

function createStars() {

    const geometry = new THREE.BufferGeometry();

    const positions = [];

    for (let i = 0; i < 1800; i++) {

        const radius = 70 + Math.random() * 120;

        const theta = Math.random() * Math.PI * 2;

        const phi = Math.acos(
            2 * Math.random() - 1
        );

        positions.push(
            radius *
            Math.sin(phi) *
            Math.cos(theta)
        );

        positions.push(
            radius *
            Math.cos(phi)
        );

        positions.push(
            radius *
            Math.sin(phi) *
            Math.sin(theta)
        );
    }

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    const material = new THREE.PointsMaterial({
        color: 0xd7ddd7,
        size: 0.08,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(
        geometry,
        material
    );

    scene.add(stars);
}


/* =========================================================
   PROCEDURAL MOON TEXTURE
========================================================= */

function createMoonTexture() {

    const canvas = document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");

    const image = ctx.createImageData(
        canvas.width,
        canvas.height
    );

    for (let y = 0; y < canvas.height; y++) {

        for (let x = 0; x < canvas.width; x++) {

            const index =
                (y * canvas.width + x) * 4;

            let noise =
                Math.random() * 25;

            const base =
                112 + noise;

            image.data[index] = base;
            image.data[index + 1] = base;
            image.data[index + 2] = base - 3;
            image.data[index + 3] = 255;
        }
    }

    ctx.putImageData(image, 0, 0);


    /* LARGE CRATERS */

    for (let i = 0; i < 110; i++) {

        const x =
            Math.random() * canvas.width;

        const y =
            Math.random() * canvas.height;

        const radius =
            4 + Math.random() * 28;

        const gradient =
            ctx.createRadialGradient(
                x,
                y,
                radius * 0.2,
                x,
                y,
                radius
            );

        gradient.addColorStop(
            0,
            "rgba(45,45,43,0.65)"
        );

        gradient.addColorStop(
            0.7,
            "rgba(75,75,72,0.45)"
        );

        gradient.addColorStop(
            1,
            "rgba(170,170,165,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    return new THREE.CanvasTexture(canvas);
}


/* =========================================================
   MOON
========================================================= */

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(
            2.25,
            96,
            64
        );

    const texture =
        createMoonTexture();

    const material =
        new THREE.MeshStandardMaterial({

            map: texture,

            roughness: 1,

            metalness: 0,

            bumpMap: texture,

            bumpScale: 0.055
        });

    moon =
        new THREE.Mesh(
            geometry,
            material
        );

    moon.rotation.y = -0.35;

    moon.castShadow = true;

    moon.receiveShadow = true;

    scene.add(moon);


    /* SOUTH POLE AXIS */

    const poleGeometry =
        new THREE.BufferGeometry();

    poleGeometry.setFromPoints([
        new THREE.Vector3(
            0,
            -2.75,
            0
        ),
        new THREE.Vector3(
            0,
            -2.2,
            0
        )
    ]);

    const poleMaterial =
        new THREE.LineBasicMaterial({
            color: 0xa7bd8c
        });

    const pole =
        new THREE.Line(
            poleGeometry,
            poleMaterial
        );

    scene.add(pole);


    craterGroup =
        new THREE.Group();

    scene.add(craterGroup);
}


/* =========================================================
   EARTH
========================================================= */

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            0.62,
            64,
            48
        );

    const canvas =
        document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 256;

    const ctx =
        canvas.getContext("2d");


    /* OCEAN */

    ctx.fillStyle = "#183e5d";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* LAND */

    for (let i = 0; i < 35; i++) {

        ctx.fillStyle =
            i % 2 === 0
                ? "#4c6948"
                : "#637950";

        const x =
            Math.random() * canvas.width;

        const y =
            Math.random() * canvas.height;

        const w =
            15 + Math.random() * 80;

        const h =
            8 + Math.random() * 35;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            w,
            h,
            Math.random(),
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /* CLOUDS */

    for (let i = 0; i < 40; i++) {

        ctx.fillStyle =
            "rgba(235,240,235,0.28)";

        const x =
            Math.random() * canvas.width;

        const y =
            Math.random() * canvas.height;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            10 + Math.random() * 35,
            2 + Math.random() * 6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    const texture =
        new THREE.CanvasTexture(canvas);

    const material =
        new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.65,
            metalness: 0
        });

    earth =
        new THREE.Mesh(
            geometry,
            material
        );

    earth.position.set(
        -5.5,
        2.7,
        -2.5
    );

    scene.add(earth);


    /* EARTH ATMOSPHERE */

    const atmosphereGeometry =
        new THREE.SphereGeometry(
            0.68,
            48,
            32
        );

    const atmosphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x4d9bd4,
            transparent: true,
            opacity: 0.12,
            side: THREE.BackSide
        });

    atmosphere =
        new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
        );

    earth.add(atmosphere);
}


/* =========================================================
   SUN
========================================================= */

function createSun() {

    const geometry =
        new THREE.SphereGeometry(
            1.15,
            48,
            32
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffd76a
        });

    sun =
        new THREE.Mesh(
            geometry,
            material
        );

    sun.position.set(
        12,
        5,
        8
    );

    scene.add(sun);


    /* SUN GLOW */

    const glowGeometry =
        new THREE.SphereGeometry(
            1.5,
            32,
            32
        );

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffb83e,
            transparent: true,
            opacity: 0.13,
            side: THREE.BackSide
        });

    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    sun.add(glow);
}


/* =========================================================
   CRATER MARKERS
========================================================= */

function latitudeLongitudeToVector(
    latitude,
    longitude,
    radius
) {

    const lat =
        THREE.MathUtils.degToRad(latitude);

    const lon =
        THREE.MathUtils.degToRad(longitude);

    const x =
        radius *
        Math.cos(lat) *
        Math.cos(lon);

    const y =
        radius *
        Math.sin(lat);

    const z =
        radius *
        Math.cos(lat) *
        Math.sin(lon);

    return new THREE.Vector3(
        x,
        y,
        z
    );
}


function createCraterMarkers() {

    if (!craterGroup) return;

    while (
        craterGroup.children.length > 0
    ) {
        craterGroup.remove(
            craterGroup.children[0]
        );
    }

    craterMeshes = [];


    craterData.forEach((crater) => {

        const latitude =
            Number(
                crater.lat ??
                crater.latitude ??
                0
            );

        const longitude =
            Number(
                crater.lon ??
                crater.longitude ??
                0
            );


        const isSouthPole =
            latitude <= -70;

        const isMajor =
            !isSouthPole;


        const position =
            latitudeLongitudeToVector(
                latitude,
                longitude,
                2.29
            );


        /* MARKER */

        const markerGeometry =
            new THREE.SphereGeometry(
                isSouthPole
                    ? 0.055
                    : 0.035,
                12,
                8
            );

        const markerMaterial =
            new THREE.MeshBasicMaterial({
                color:
                    isSouthPole
                        ? 0xaacb7b
                        : 0xd6d6d6
            });

        const marker =
            new THREE.Mesh(
                markerGeometry,
                markerMaterial
            );

        marker.position.copy(
            position
        );


        marker.userData.crater =
            crater;

        marker.userData.isSouthPole =
            isSouthPole;

        marker.userData.isMajor =
            isMajor;


        craterGroup.add(marker);

        craterMeshes.push(marker);


        /* CRATER RING */

        if (isSouthPole) {

            const ringGeometry =
                new THREE.RingGeometry(
                    0.075,
                    0.095,
                    20
                );

            const ringMaterial =
                new THREE.MeshBasicMaterial({
                    color: 0x829a69,
                    transparent: true,
                    opacity: 0.65,
                    side: THREE.DoubleSide
                });

            const ring =
                new THREE.Mesh(
                    ringGeometry,
                    ringMaterial
                );

            ring.position.copy(
                position.clone().multiplyScalar(1.005)
            );

            ring.lookAt(
                new THREE.Vector3(0, 0, 0)
            );

            ring.userData.crater =
                crater;

            ring.userData.isSouthPole =
                true;

            ring.userData.isMajor =
                false;

            craterGroup.add(ring);

            craterMeshes.push(ring);
        }

    });


    updateCraterVisibility();
}


/* =========================================================
   FILTERS
========================================================= */

function updateCraterVisibility() {

    craterMeshes.forEach((mesh) => {

        const isSouthPole =
            mesh.userData.isSouthPole;

        const isMajor =
            mesh.userData.isMajor;


        /*
         * NORMAL CHECKBOX BEHAVIOR:
         *
         * checked = SHOW
         * unchecked = HIDE
         */

        const southVisible =
            southPoleOnly.checked;

        const majorVisible =
            majorOnly.checked;


        let visible = false;


        if (
            isSouthPole &&
            southVisible
        ) {
            visible = true;
        }


        if (
            isMajor &&
            majorVisible
        ) {
            visible = true;
        }


        mesh.visible = visible;
    });
}


/* =========================================================
   SELECT CRATER
========================================================= */

function selectCrater(crater) {

    if (!crater) return;

    selectedCrater = crater;


    /* DROPDOWN */

    if (landingSiteSelect) {

        landingSiteSelect.value =
            crater.name;
    }


    /* HIGHLIGHT */

    craterMeshes.forEach((mesh) => {

        if (
            mesh.userData.crater &&
            mesh.userData.crater.name ===
            crater.name
        ) {

            mesh.scale.set(
                2.2,
                2.2,
                2.2
            );

        } else {

            mesh.scale.set(
                1,
                1,
                1
            );
        }
    });


    updateSiteInformation(crater);

    analyzeSelectedSite();

    updateComparison();
}


function selectCraterByName(name) {

    const crater =
        craterData.find(
            c =>
                String(c.name).toLowerCase() ===
                String(name).toLowerCase()
        );

    if (crater) {
        selectCrater(crater);
    }
}


/* =========================================================
   SITE INFORMATION
========================================================= */

function updateSiteInformation(crater) {

    if (!crater) return;

    const lat =
        crater.lat ??
        crater.latitude ??
        "--";

    const lon =
        crater.lon ??
        crater.longitude ??
        "--";

    const diameter =
        crater.diameter ??
        crater.diameter_km ??
        "--";

    const region =
        crater.region ??
        (
            Number(lat) <= -70
                ? "Lunar South Polar Region"
                : "Lunar Surface"
        );


    siteName.textContent =
        crater.name ?? "--";

    siteLatitude.textContent =
        formatCoordinate(lat, "°");

    siteLongitude.textContent =
        formatCoordinate(lon, "°");

    siteDiameter.textContent =
        diameter === "--"
            ? "--"
            : `${diameter} km`;

    siteRegion.textContent =
        region;
}


function formatCoordinate(value, suffix) {

    if (value === "--") return "--";

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return `${number.toFixed(2)}${suffix}`;
}


/* =========================================================
   ANALYZE SITE
========================================================= */

async function analyzeSelectedSite() {

    if (!selectedCrater) return;


    const latitude =
        Number(
            selectedCrater.lat ??
            selectedCrater.latitude ??
            0
        );

    const longitude =
        Number(
            selectedCrater.lon ??
            selectedCrater.longitude ??
            0
        );


    const date =
        missionDate.value;


    const hour =
        Number(lunarHour.value);


    try {

        const url =
            `/api/conditions?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            `&date=${encodeURIComponent(date)}` +
            `&hour=${encodeURIComponent(hour)}`;


        const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }


        const data =
            await response.json();


        updateTelemetry(data);

        updateAssessment(data);

    }

    catch (error) {

        console.error(
            "Analysis failed:",
            error
        );

        assessment.textContent =
            "ANALYSIS ERROR — unable to retrieve mission conditions.";
    }
}


/* =========================================================
   TELEMETRY
========================================================= */

function updateTelemetry(data) {

    if (!data) return;


    const sun =
        data.sun || {};

    const earth =
        data.earth || {};

    const communication =
        data.communication || {};


    const elevation =
        Number(
            sun.elevation_degrees ?? 0
        );

    const power =
        Number(
            sun.power_potential_percent ?? 0
        );

    const visibility =
        Number(
            earth.visibility_percent ?? 0
        );


    sunElevation.textContent =
        `${elevation.toFixed(1)}°`;

    powerPotential.textContent =
        `${power.toFixed(0)}%`;

    earthVisibility.textContent =
        `${visibility.toFixed(0)}%`;

    communicationStatus.textContent =
        communication.status ?? "--";


    powerBar.style.width =
        `${clamp(power, 0, 100)}%`;

    earthBar.style.width =
        `${clamp(visibility, 0, 100)}%`;
}


/* =========================================================
   ASSESSMENT
========================================================= */

function updateAssessment(data) {

    if (!data || !selectedCrater) return;

    const elevation =
        Number(
            data.sun?.elevation_degrees ?? 0
        );

    const power =
        Number(
            data.sun?.power_potential_percent ?? 0
        );

    const communication =
        data.communication?.status ??
        "Unknown";


    let message = "";


    if (elevation > 10) {

        message +=
            "SUN ABOVE HORIZON. ";

    } else if (elevation > 0) {

        message +=
            "LOW-SUN ANGLE. ";

    } else {

        message +=
            "SUN BELOW HORIZON. ";
    }


    if (power >= 70) {

        message +=
            "Favorable solar-power conditions. ";

    } else if (power >= 30) {

        message +=
            "Moderate solar-power potential. ";

    } else {

        message +=
            "Limited solar-power potential. ";
    }


    message +=
        `DIRECT-TO-EARTH: ${communication}.`;


    assessment.textContent =
        message;
}


/* =========================================================
   ANALYZE BUTTON
========================================================= */

function analyzeButtonClicked() {

    const selectedName =
        landingSiteSelect.value;


    if (!selectedName) {

        assessment.textContent =
            "SELECT A LANDING SITE FIRST.";

        return;
    }


    selectCraterByName(
        selectedName
    );
}


/* =========================================================
   COMPARISON
========================================================= */

async function updateComparison() {

    if (!comparisonGrid) return;

    if (!craterData.length) return;


    comparisonGrid.innerHTML = "";


    const candidates =
        craterData
            .filter(crater => {

                const lat =
                    Number(
                        crater.lat ??
                        crater.latitude ??
                        0
                    );

                return lat <= -70;
            })
            .slice(0, 10);


    for (const crater of candidates) {

        let conditions = null;


        try {

            const lat =
                Number(
                    crater.lat ??
                    crater.latitude ??
                    0
                );

            const lon =
                Number(
                    crater.lon ??
                    crater.longitude ??
                    0
                );


            const url =
                `/api/conditions?latitude=${lat}` +
                `&longitude=${lon}` +
                `&date=${missionDate.value}` +
                `&hour=${lunarHour.value}`;


            const response =
                await fetch(url);


            if (response.ok) {
                conditions =
                    await response.json();
            }

        } catch (error) {

            console.warn(
                "Comparison error:",
                error
            );
        }


        createComparisonCard(
            crater,
            conditions
        );
    }
}


function createComparisonCard(
    crater,
    conditions
) {

    const card =
        document.createElement("div");


    card.className =
        "comparison-card";


    if (
        selectedCrater &&
        selectedCrater.name ===
        crater.name
    ) {

        card.classList.add(
            "selected"
        );
    }


    const power =
        conditions?.sun
            ?.power_potential_percent ??
        "--";


    const elevation =
        conditions?.sun
            ?.elevation_degrees ??
        "--";


    const communication =
        conditions?.communication
            ?.status ??
        "--";


    card.innerHTML = `

        <div class="comparison-card-name">
            ${escapeHTML(crater.name)}
        </div>

        <div class="comparison-card-row">
            <span>SUN</span>
            <strong>${elevation}°</strong>
        </div>

        <div class="comparison-card-row">
            <span>SOLAR</span>
            <strong>${power}%</strong>
        </div>

        <div class="comparison-card-row">
            <span>COMM</span>
            <strong>${escapeHTML(communication)}</strong>
        </div>

    `;


    card.addEventListener(
        "click",
        () => {
            selectCrater(crater);
        }
    );


    comparisonGrid.appendChild(
        card
    );
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadMissionData() {

    try {

        updateLoading(
            30,
            "Loading lunar crater database..."
        );


        const craterResponse =
            await fetch(
                "/api/craters"
            );


        if (!craterResponse.ok) {
            throw new Error(
                "Could not load craters."
            );
        }


        craterData =
            await craterResponse.json();


        updateLoading(
            55,
            "Loading Earth launch sites..."
        );


        const launchResponse =
            await fetch(
                "/api/launch-sites"
            );


        if (!launchResponse.ok) {
            throw new Error(
                "Could not load launch sites."
            );
        }


        launchData =
            await launchResponse.json();


        populateLaunchSites();

        populateLandingSites();

        createCraterMarkers();


        updateLoading(
            85,
            "Preparing mission telemetry..."
        );


        await updateComparison();


    }

    catch (error) {

        console.error(
            "Mission data loading failed:",
            error
        );


        if (loadingText) {

            loadingText.textContent =
                "DATA LOAD ERROR";
        }
    }
}


/* =========================================================
   DROPDOWNS
========================================================= */

function populateLaunchSites() {

    if (!launchSiteSelect) return;

    launchSiteSelect.innerHTML = "";


    launchData.forEach(site => {

        const option =
            document.createElement("option");


        option.value =
            site.name;


        option.textContent =
            `${site.name} — ${site.country}`;


        launchSiteSelect.appendChild(
            option
        );
    });
}


function populateLandingSites() {

    if (!landingSiteSelect) return;

    landingSiteSelect.innerHTML = "";


    craterData.forEach(crater => {

        const option =
            document.createElement("option");


        option.value =
            crater.name;


        option.textContent =
            crater.name;


        landingSiteSelect.appendChild(
            option
        );
    });
}


/* =========================================================
   CONTROLS
========================================================= */

function setupControls() {


    /* ANALYZE */

    analyzeButton.addEventListener(
        "click",
        analyzeButtonClicked
    );


    /* SITE DROPDOWN */

    landingSiteSelect.addEventListener(
        "change",
        () => {

            selectCraterByName(
                landingSiteSelect.value
            );

        }
    );


    /* DATE */

    missionDate.addEventListener(
        "change",
        () => {

            if (selectedCrater) {
                analyzeSelectedSite();
                updateComparison();
            }

        }
    );


    /* TIME */

    lunarHour.addEventListener(
        "input",
        () => {

            const hour =
                Number(lunarHour.value);


            lunarHourValue.textContent =
                formatTime(hour);


            if (selectedCrater) {
                analyzeSelectedSite();
            }

        }
    );


    /* SOUTH POLE FILTER */

    southPoleOnly.addEventListener(
        "change",
        updateCraterVisibility
    );


    /* MAJOR FILTER */

    majorOnly.addEventListener(
        "change",
        updateCraterVisibility
    );


    /* RESET */

    resetButton.addEventListener(
        "click",
        resetCamera
    );


    /* ZOOM */

    zoomIn.addEventListener(
        "click",
        () => {

            cameraDistance =
                Math.max(
                    3.5,
                    cameraDistance - 0.8
                );

            updateCamera();

        }
    );


    zoomOut.addEventListener(
        "click",
        () => {

            cameraDistance =
                Math.min(
                    15,
                    cameraDistance + 0.8
                );

            updateCamera();

        }
    );


    /* POLAR VIEW */

    viewTop.addEventListener(
        "click",
        setPolarView
    );


    /* GLOBE VIEW */

    viewGlobe.addEventListener(
        "click",
        setGlobeView
    );
}


/* =========================================================
   MOUSE CAMERA
========================================================= */

function handlePointerDown(event) {

    isDragging = true;

    previousMouse.x =
        event.clientX;

    previousMouse.y =
        event.clientY;
}


function handlePointerMove(event) {

    if (!isDragging) return;


    const dx =
        event.clientX -
        previousMouse.x;

    const dy =
        event.clientY -
        previousMouse.y;


    cameraYaw -=
        dx * 0.006;


    cameraPitch +=
        dy * 0.006;


    cameraPitch =
        clamp(
            cameraPitch,
            -1.35,
            1.35
        );


    previousMouse.x =
        event.clientX;

    previousMouse.y =
        event.clientY;


    updateCamera();


    updateCursorCoordinates(
        event
    );
}


function handlePointerUp() {

    isDragging = false;
}


function handleWheel(event) {

    event.preventDefault();


    cameraDistance +=
        event.deltaY * 0.005;


    cameraDistance =
        clamp(
            cameraDistance,
            3.3,
            16
        );


    updateCamera();
}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (!camera) return;


    const target =
        new THREE.Vector3(
            0,
            0,
            0
        );


    const x =
        cameraDistance *
        Math.cos(cameraPitch) *
        Math.sin(cameraYaw);


    const y =
        cameraDistance *
        Math.sin(cameraPitch);


    const z =
        cameraDistance *
        Math.cos(cameraPitch) *
        Math.cos(cameraYaw);


    camera.position.set(
        x,
        y,
        z
    );


    camera.lookAt(
        target
    );


    if (cameraDistanceDisplay) {

        cameraDistanceDisplay.textContent =
            `${cameraDistance.toFixed(1)} km`;
    }
}


/* =========================================================
   CAMERA VIEWS
========================================================= */

function setPolarView() {

    cameraDistance = 6.3;

    cameraYaw = 0;

    cameraPitch = -1.15;

    updateCamera();
}


function setGlobeView() {

    cameraDistance = 7.5;

    cameraYaw = 0.65;

    cameraPitch = 0.35;

    updateCamera();
}


function resetCamera() {

    cameraDistance = 7.5;

    cameraYaw = 0.65;

    cameraPitch = 0.35;

    updateCamera();
}


/* =========================================================
   CLICK CRATERS
========================================================= */

function handleSceneClick(event) {

    if (!renderer || !camera) return;


    const rect =
        renderer.domElement.getBoundingClientRect();


    mouse.x =
        (
            (event.clientX - rect.left) /
            rect.width
        ) * 2 - 1;


    mouse.y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const intersections =
        raycaster.intersectObjects(
            craterMeshes,
            false
        );


    if (!intersections.length) {
        return;
    }


    const object =
        intersections[0].object;


    const crater =
        object.userData.crater;


    if (crater) {

        selectCrater(
            crater
        );
    }
}


/* =========================================================
   CURSOR COORDINATES
========================================================= */

function updateCursorCoordinates(event) {

    if (!cursorCoords) return;

    if (!moon) return;


    const rect =
        renderer.domElement.getBoundingClientRect();


    const x =
        (
            (event.clientX - rect.left) /
            rect.width
        ) * 2 - 1;


    const y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) * 2 + 1;


    const localRay =
        new THREE.Raycaster();


    localRay.setFromCamera(
        new THREE.Vector2(x, y),
        camera
    );


    const intersections =
        localRay.intersectObject(
            moon
        );


    if (!intersections.length) {

        cursorCoords.textContent =
            "LAT -- / LON --";

        return;
    }


    const point =
        intersections[0].point.clone();


    const local =
        moon.worldToLocal(
            point
        );


    const radius =
        local.length();


    const latitude =
        THREE.MathUtils.radToDeg(
            Math.asin(
                local.y / radius
            )
        );


    const longitude =
        THREE.MathUtils.radToDeg(
            Math.atan2(
                local.z,
                local.x
            )
        );


    cursorCoords.textContent =
        `LAT ${latitude.toFixed(1)}° / LON ${longitude.toFixed(1)}°`;
}


/* =========================================================
   SPACE LABELS
========================================================= */

function updateSpaceLabels() {

    if (!camera) return;


    updateLabelPosition(
        sun,
        sunLabel
    );


    updateLabelPosition(
        earth,
        earthLabel
    );
}


function updateLabelPosition(
    object,
    label
) {

    if (!object || !label) return;


    const position =
        object.position.clone();


    position.project(
        camera
    );


    const width =
        renderer.domElement.clientWidth;


    const height =
        renderer.domElement.clientHeight;


    const x =
        (position.x * 0.5 + 0.5) *
        width;


    const y =
        (-position.y * 0.5 + 0.5) *
        height;


    label.style.left =
        `${x}px`;

    label.style.top =
        `${y}px`;


    label.style.display =
        position.z < 1
            ? "block"
            : "none";
}


/* =========================================================
   ANIMATION
========================================================= */

function animate() {

    if (!animationStarted) return;


    requestAnimationFrame(
        animate
    );


    if (moon) {

        /*
         * Very slow rotation.
         * This makes the globe feel alive without
         * changing the mission geometry rapidly.
         */

        moon.rotation.y +=
            0.00025;
    }


    if (earth) {

        earth.rotation.y +=
            0.001;
    }


    if (sun) {

        sun.rotation.y +=
            0.0005;
    }


    updateSpaceLabels();

    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   RESIZE
========================================================= */

function handleResize() {

    const container =
        $("three-container");


    if (!container || !camera || !renderer) {
        return;
    }


    camera.aspect =
        container.clientWidth /
        container.clientHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );
}


/* =========================================================
   UTILITIES
========================================================= */

function clamp(
    value,
    minimum,
    maximum
) {

    return Math.max(
        minimum,
        Math.min(
            maximum,
            value
        )
    );
}


function formatTime(hour) {

    const h =
        Math.floor(hour);


    return `${String(h).padStart(2, "0")}:00`;
}


function updateLoading(
    progress,
    message
) {

    if (loadingProgress) {

        loadingProgress.style.width =
            `${progress}%`;
    }


    if (loadingText) {

        loadingText.textContent =
            message;
    }
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   INITIAL CAMERA
========================================================= */

setTimeout(() => {

    if (camera) {
        updateCamera();
    }

}, 100);
