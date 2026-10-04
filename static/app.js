let scene;
let camera;
let renderer;

let earth;
let moon;
let sun;
let sunLight;

let moonOrbit;
let spacecraft;
let transferMarker;
let transferLine;

let craterGroup;
let craterMarkers = [];
let craters = [];
let launchSites = [];

let raycaster;
let mouse;

let selectedCrater = null;
let moonAngle = 0;

const EARTH_RADIUS = 0.95;
const MOON_RADIUS = 0.42;

/* Moon is farther away now */
const MOON_ORBIT_RADIUS = 3.25;

const EARTH_POSITION = new THREE.Vector3(-7.5, 3.5, -4.5);
const SUN_POSITION = new THREE.Vector3(12, 5, 8);

let cameraTarget = new THREE.Vector3();
let cameraDistance = 8.5;

let cameraYaw = 0.65;
let cameraPitch = 0.25;

let dragging = false;
let lastX = 0;
let lastY = 0;

let animationStarted = false;

const loadingOverlay = document.getElementById("loading-overlay");
const loadingProgress = document.getElementById("loadingProgress");
const loadingText = document.getElementById("loadingText");


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function updateLoading(percent, message) {
    if (loadingProgress) {
        loadingProgress.style.width = `${percent}%`;
    }

    if (loadingText) {
        loadingText.textContent = message;
    }
}

function finishLoading() {
    if (!loadingOverlay) return;

    loadingOverlay.style.opacity = "0";

    setTimeout(() => {
        loadingOverlay.style.display = "none";
    }, 500);
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", start);

async function start() {

    try {

        updateLoading(5, "Starting lunar mission environment...");

        const container = $("three-container");

        if (!container) {
            throw new Error("3D viewport was not found.");
        }

        if (typeof THREE === "undefined") {
            throw new Error("Three.js failed to load.");
        }

        initializeThree(container);

        updateLoading(25, "Building Earth, Moon and Sun...");

        setupControls();

        updateLoading(40, "Loading lunar mission data...");

        await loadData();

        updateLoading(75, "Creating crater landing sites...");

        createCraterMarkers();

        updateLoading(90, "Calculating lunar orbit...");

        if (landingSiteSelect && landingSiteSelect.options.length > 0) {
            landingSiteSelect.selectedIndex = 0;
            selectCraterByName(landingSiteSelect.value);
        }

        updateLoading(100, "Mission environment ready.");

        finishLoading();

        animationStarted = true;

        updateCamera();

        animate();

    } catch (error) {

        console.error("STARTUP ERROR:", error);

        if (loadingText) {
            loadingText.textContent = "Startup error: " + error.message;
        }

        if (loadingProgress) {
            loadingProgress.style.width = "100%";
        }
    }
}


/* =========================================================
   DOM REFERENCES
========================================================= */

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


/* =========================================================
   THREE.JS INITIALIZATION
========================================================= */

function initializeThree(container) {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x020406);

    camera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / container.clientHeight,
        0.01,
        500
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7;

    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    /*
     * Very low ambient light.
     * This keeps the lunar lighting dramatic.
     */
    const ambient = new THREE.AmbientLight(
        0x59636b,
        0.12
    );

    scene.add(ambient);

    /*
     * Sun.
     */
    sunLight = new THREE.PointLight(
        0xffe2a0,
        4,
        0,
        2
    );

    sunLight.position.copy(SUN_POSITION);

    scene.add(sunLight);

    createSun();
    createEarth();
    createMoon();
    createMoonOrbit();

    /*
     * New spacecraft.
     */
    createSpacecraft();

    /*
     * New transfer point.
     */
    createTransferMarker();

    setupMouseControls();
    setupResize();

    /*
     * Start camera focused on Moon.
     */
    cameraTarget.copy(getMoonWorldPosition());

    cameraDistance = 4.5;
}


/* =========================================================
   SUN
========================================================= */

function createSun() {

    const geometry = new THREE.SphereGeometry(
        0.75,
        32,
        32
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0xffd27a
    });

    sun = new THREE.Mesh(
        geometry,
        material
    );

    sun.position.copy(SUN_POSITION);

    scene.add(sun);

    const glowGeometry = new THREE.SphereGeometry(
        0.95,
        24,
        24
    );

    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0.12
    });

    const glow = new THREE.Mesh(
        glowGeometry,
        glowMaterial
    );

    sun.add(glow);

    if (sunLabel) {
        sunLabel.textContent = "SUN";
    }
}


/* =========================================================
   EARTH
========================================================= */

function createEarth() {

    const geometry = new THREE.SphereGeometry(
        EARTH_RADIUS,
        64,
        64
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x285c86,
        roughness: 0.75,
        metalness: 0
    });

    earth = new THREE.Mesh(
        geometry,
        material
    );

    earth.position.copy(EARTH_POSITION);

    scene.add(earth);

    /*
     * Subtle atmosphere.
     */
    const atmosphereGeometry = new THREE.SphereGeometry(
        EARTH_RADIUS * 1.05,
        48,
        48
    );

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x3c9bd6,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide
    });

    const atmosphere = new THREE.Mesh(
        atmosphereGeometry,
        atmosphereMaterial
    );

    earth.add(atmosphere);

    if (earthLabel) {
        earthLabel.textContent = "EARTH";
    }
}


/* =========================================================
   MOON
========================================================= */

function createMoon() {

    const geometry = new THREE.SphereGeometry(
        MOON_RADIUS,
        64,
        64
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x8e8e8e,
        roughness: 1,
        metalness: 0
    });

    moon = new THREE.Mesh(
        geometry,
        material
    );

    moon.position.copy(
        getMoonWorldPosition()
    );

    scene.add(moon);

    /*
     * Small darker polar cap effect.
     */
    const polarGeometry = new THREE.SphereGeometry(
        MOON_RADIUS * 1.002,
        32,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.32
    );

    const polarMaterial = new THREE.MeshStandardMaterial({
        color: 0xb7b7b7,
        roughness: 1
    });

    const polarCap = new THREE.Mesh(
        polarGeometry,
        polarMaterial
    );

    polarCap.rotation.x = Math.PI;

    moon.add(polarCap);
}


/* =========================================================
   MOON ORBIT
========================================================= */

function createMoonOrbit() {

    const points = [];

    const segments = 160;

    for (let i = 0; i <= segments; i++) {

        const angle =
            (i / segments) * Math.PI * 2;

        points.push(
            new THREE.Vector3(
                EARTH_POSITION.x +
                Math.cos(angle) * MOON_ORBIT_RADIUS,

                EARTH_POSITION.y,

                EARTH_POSITION.z +
                Math.sin(angle) * MOON_ORBIT_RADIUS
            )
        );
    }

    const geometry =
        new THREE.BufferGeometry().setFromPoints(points);

    const material =
        new THREE.LineBasicMaterial({
            color: 0x66717a,
            transparent: true,
            opacity: 0.45
        });

    moonOrbit = new THREE.Line(
        geometry,
        material
    );

    scene.add(moonOrbit);
}


/* =========================================================
   MOON POSITION
========================================================= */

function getMoonWorldPosition() {

    return new THREE.Vector3(

        EARTH_POSITION.x +
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,

        EARTH_POSITION.y,

        EARTH_POSITION.z +
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS

    );
}


/* =========================================================
   SPACECRAFT
========================================================= */

function createSpacecraft() {

    spacecraft = new THREE.Group();

    /*
     * Main spacecraft body.
     */
    const bodyGeometry =
        new THREE.CylinderGeometry(
            0.055,
            0.075,
            0.22,
            12
        );

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd7d7d7,
            roughness: 0.45,
            metalness: 0.55
        });

    const body = new THREE.Mesh(
        bodyGeometry,
        bodyMaterial
    );

    body.rotation.z = Math.PI / 2;

    spacecraft.add(body);


    /*
     * Small cockpit.
     */
    const cockpitGeometry =
        new THREE.SphereGeometry(
            0.065,
            16,
            16
        );

    const cockpitMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x6f8794,
            roughness: 0.25,
            metalness: 0.5
        });

    const cockpit =
        new THREE.Mesh(
            cockpitGeometry,
            cockpitMaterial
        );

    cockpit.position.x = 0.1;

    spacecraft.add(cockpit);


    /*
     * Solar panels.
     */
    const panelGeometry =
        new THREE.BoxGeometry(
            0.18,
            0.01,
            0.07
        );

    const panelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x203d5c,
            roughness: 0.4,
            metalness: 0.3
        });

    const panelLeft =
        new THREE.Mesh(
            panelGeometry,
            panelMaterial
        );

    const panelRight =
        new THREE.Mesh(
            panelGeometry,
            panelMaterial
        );

    panelLeft.position.z = 0.09;
    panelRight.position.z = -0.09;

    spacecraft.add(panelLeft);
    spacecraft.add(panelRight);


    scene.add(spacecraft);
}


/* =========================================================
   TRANSFER MARKER
========================================================= */

function createTransferMarker() {

    transferMarker = new THREE.Group();

    /*
     * White navigation ring.
     * No weird orange glowing sphere.
     */
    const ringGeometry =
        new THREE.RingGeometry(
            0.075,
            0.095,
            24
        );

    const ringMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });

    const ring =
        new THREE.Mesh(
            ringGeometry,
            ringMaterial
        );

    ring.rotation.x = Math.PI / 2;

    transferMarker.add(ring);


    /*
     * Small central point.
     */
    const pointGeometry =
        new THREE.SphereGeometry(
            0.025,
            12,
            12
        );

    const pointMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    const point =
        new THREE.Mesh(
            pointGeometry,
            pointMaterial
        );

    transferMarker.add(point);

    scene.add(transferMarker);


    /*
     * Thin transfer line.
     */
    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: 0xb9c5cc,
            transparent: true,
            opacity: 0.5
        });

    const lineGeometry =
        new THREE.BufferGeometry();

    transferLine =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );

    scene.add(transferLine);
}


/* =========================================================
   UPDATE SPACECRAFT + TRANSFER POINT
========================================================= */

function updateTransferSystem() {

    if (!spacecraft || !transferMarker) {
        return;
    }

    const moonPosition =
        getMoonWorldPosition();

    /*
     * Put spacecraft slightly behind and above Moon.
     */
    const spacecraftOffset =
        new THREE.Vector3(
            -0.35,
            0.18,
            0.22
        );

    spacecraft.position.copy(
        moonPosition.clone().add(
            spacecraftOffset
        )
    );

    /*
     * Make spacecraft face roughly along
     * the direction of lunar orbital motion.
     */
    const tangent =
        new THREE.Vector3(
            -Math.sin(moonAngle),
            0,
            Math.cos(moonAngle)
        );

    spacecraft.lookAt(
        spacecraft.position.clone().add(tangent)
    );


    /*
     * Transfer point is ahead of the Moon.
     *
     * This is intentionally a simplified
     * educational visualization.
     */
    const transferAngle =
        moonAngle +
        THREE.MathUtils.degToRad(25);

    const transferPosition =
        new THREE.Vector3(

            EARTH_POSITION.x +
            Math.cos(transferAngle) *
            MOON_ORBIT_RADIUS,

            EARTH_POSITION.y,

            EARTH_POSITION.z +
            Math.sin(transferAngle) *
            MOON_ORBIT_RADIUS

        );

    transferMarker.position.copy(
        transferPosition
    );


    /*
     * Connect spacecraft to transfer point.
     */
    const linePoints = [
        spacecraft.position.clone(),
        transferPosition.clone()
    ];

    transferLine.geometry.dispose();

    transferLine.geometry =
        new THREE.BufferGeometry()
            .setFromPoints(linePoints);
}


/* =========================================================
   CRATER MARKERS
========================================================= */

function createCraterMarkers() {

    if (!scene) return;

    if (craterGroup) {
        scene.remove(craterGroup);
    }

    craterGroup = new THREE.Group();

    craterMarkers = [];

    for (const crater of craters) {

        const marker =
            createCraterMarker(crater);

        if (!marker) continue;

        craterGroup.add(marker);

        craterMarkers.push({
            object: marker,
            data: crater
        });
    }

    scene.add(craterGroup);

    applyCraterFilters();
}


/* =========================================================
   INDIVIDUAL CRATER MARKER
========================================================= */

function createCraterMarker(crater) {

    const latitude =
        Number(crater.lat);

    const longitude =
        Number(
            crater.lon !== undefined
                ? crater.lon
                : crater.longitude
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return null;
    }

    /*
     * Convert lunar latitude/longitude
     * to a point on the Moon.
     */
    const lat =
        THREE.MathUtils.degToRad(latitude);

    const lon =
        THREE.MathUtils.degToRad(longitude);

    const radius =
        MOON_RADIUS * 1.025;

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

    const marker =
        new THREE.Group();

    marker.userData.crater = crater;

    /*
     * Small white target ring.
     */
    const ringGeometry =
        new THREE.RingGeometry(
            0.018,
            0.030,
            20
        );

    const ringMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xdce4e8,
            side: THREE.DoubleSide
        });

    const ring =
        new THREE.Mesh(
            ringGeometry,
            ringMaterial
        );

    ring.lookAt(
        new THREE.Vector3(x, y, z)
    );

    marker.add(ring);


    /*
     * Small centre point.
     */
    const pointGeometry =
        new THREE.SphereGeometry(
            0.012,
            10,
            10
        );

    const pointMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xdce4e8
        });

    const point =
        new THREE.Mesh(
            pointGeometry,
            pointMaterial
        );

    point.position.set(
        x,
        y,
        z
    );

    marker.add(point);


    /*
     * Put marker relative to Moon.
     */
    marker.position.set(
        0,
        0,
        0
    );

    marker.userData.localPosition =
        new THREE.Vector3(
            x,
            y,
            z
        );

    /*
     * Store objects for raycasting.
     */
    ring.userData.crater = crater;
    point.userData.crater = crater;

    ring.userData.markerGroup = marker;
    point.userData.markerGroup = marker;

    return marker;
}


/* =========================================================
   UPDATE CRATER POSITIONS
========================================================= */

function updateCraterPositions() {

    if (!moon || !craterMarkers) {
        return;
    }

    const moonPosition =
        moon.position;

    for (const item of craterMarkers) {

        const marker =
            item.object;

        const localPosition =
            marker.userData.localPosition;

        if (!localPosition) continue;

        /*
         * Lunar surface coordinates rotate
         * with the Moon.
         */
        const rotated =
            localPosition.clone();

        rotated.applyEuler(
            moon.rotation
        );

        marker.position.copy(
            moonPosition.clone().add(
                rotated
            )
        );

        /*
         * Keep the marker facing outward.
         */
        marker.lookAt(
            moonPosition.clone().add(
                rotated.clone().multiplyScalar(2)
            )
        );
    }
}


/* =========================================================
   SELECT CRATER
========================================================= */

function selectCrater(crater) {

    if (!crater) return;

    selectedCrater = crater;

    /*
     * Update dropdown.
     */
    if (landingSiteSelect) {

        const targetName =
            String(
                crater.name || ""
            ).toLowerCase();

        for (
            let i = 0;
            i < landingSiteSelect.options.length;
            i++
        ) {

            if (
                landingSiteSelect.options[i]
                    .value
                    .toLowerCase() === targetName
            ) {
                landingSiteSelect.selectedIndex = i;
                break;
            }
        }
    }

    /*
     * Update right panel.
     */
    setText(
        "siteName",
        crater.name || "Unknown Site"
    );

    setText(
        "siteLatitude",
        formatCoordinate(crater.lat, "N", "S")
    );

    setText(
        "siteLongitude",
        formatCoordinate(crater.lon, "E", "W")
    );

    setText(
        "siteDiameter",
        crater.diameter
            ? `${crater.diameter} km`
            : "N/A"
    );

    setText(
        "siteRegion",
        crater.region ||
        crater.type ||
        "Lunar South Pole"
    );

    /*
     * Highlight selected marker.
     */
    updateMarkerSelection();

    /*
     * Focus camera on Moon.
     */
    cameraTarget.copy(
        moon.position
    );

    cameraDistance = 2.2;

    updateCamera();

    /*
     * Run landing analysis.
     */
    analyzeMission();
}


/* =========================================================
   MARKER HIGHLIGHT
========================================================= */

function updateMarkerSelection() {

    for (const item of craterMarkers) {

        const marker =
            item.object;

        const isSelected =
            selectedCrater &&
            item.data.name ===
            selectedCrater.name;

        marker.scale.setScalar(
            isSelected ? 1.8 : 1
        );
    }
}


/* =========================================================
   SELECT BY NAME
========================================================= */

function selectCraterByName(name) {

    if (!name) return;

    const crater =
        craters.find(
            c =>
                String(c.name || "")
                    .toLowerCase() ===
                String(name)
                    .toLowerCase()
        );

    if (crater) {
        selectCrater(crater);
    }
}


/* =========================================================
   FILTERS
========================================================= */

function applyCraterFilters() {

    for (const item of craterMarkers) {

        const crater =
            item.data;

        let visible = true;

        /*
         * South Pole filter.
         */
        if (
            southPoleOnly &&
            southPoleOnly.checked
        ) {

            const latitude =
                Number(crater.lat);

            visible =
                Math.abs(latitude) >= 80 ||
                String(
                    crater.region || ""
                )
                    .toLowerCase()
                    .includes("south pole");
        }

        /*
         * Major crater filter.
         */
        if (
            visible &&
            majorOnly &&
            majorOnly.checked
        ) {

            const diameter =
                Number(crater.diameter);

            if (Number.isFinite(diameter)) {
                visible = diameter >= 50;
            }
        }

        item.object.visible = visible;
    }
}


/* =========================================================
   FORMAT COORDINATES
========================================================= */

function formatCoordinate(
    value,
    positive,
    negative
) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "N/A";
    }

    const direction =
        number >= 0
            ? positive
            : negative;

    return `${Math.abs(number).toFixed(2)}° ${direction}`;
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

    const craterResponse =
        await fetch("/api/craters");

    if (!craterResponse.ok) {
        throw new Error(
            "Could not load crater data."
        );
    }

    craters =
        await craterResponse.json();


    const launchResponse =
        await fetch("/api/launch-sites");

    if (!launchResponse.ok) {
        throw new Error(
            "Could not load launch site data."
        );
    }

    launchSites =
        await launchResponse.json();

    populateLaunchSelect();
    populateCraterSelect();

    createCraterMarkers();
}


/* =========================================================
   POPULATE LAUNCH SITES
========================================================= */

function populateLaunchSelect() {

    if (!launchSiteSelect) return;

    launchSiteSelect.innerHTML = "";

    for (const site of launchSites) {

        const option =
            document.createElement("option");

        option.value = site.name;
        option.textContent =
            `${site.name} — ${site.country}`;

        launchSiteSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   POPULATE CRATERS
========================================================= */

function populateCraterSelect() {

    if (!landingSiteSelect) return;

    landingSiteSelect.innerHTML = "";

    for (const crater of craters) {

        const option =
            document.createElement("option");

        option.value = crater.name;
        option.textContent = crater.name;

        landingSiteSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   MISSION ANALYSIS
========================================================= */

async function analyzeMission() {

    if (!selectedCrater) {
        return;
    }

    const latitude =
        Number(selectedCrater.lat);

    const longitude =
        Number(selectedCrater.lon);

    const date =
        missionDate &&
        missionDate.value
            ? missionDate.value
            : new Date()
                .toISOString()
                .split("T")[0];

    const hour =
        lunarHour
            ? Number(lunarHour.value)
            : 12;

    try {

        const response =
            await fetch(
                `/api/conditions?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&date=${encodeURIComponent(date)}&hour=${encodeURIComponent(hour)}`
            );

        if (!response.ok) {
            throw new Error(
                "Condition analysis failed."
            );
        }

        const data =
            await response.json();

        updateTelemetry(data);

        updateAssessment(data);

        updateComparison();

    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );

        if (assessment) {
            assessment.textContent =
                "Unable to calculate mission conditions.";
        }
    }
}


/* =========================================================
   TELEMETRY
========================================================= */

function updateTelemetry(data) {

    const sun =
        data.sun || {};

    const earth =
        data.earth || {};

    const communication =
        data.communication || {};

    setText(
        "sunElevation",
        `${Number(
            sun.elevation_degrees || 0
        ).toFixed(1)}°`
    );

    setText(
        "powerPotential",
        `${Number(
            sun.power_potential_percent || 0
        ).toFixed(0)}%`
    );

    setText(
        "earthVisibility",
        `${Number(
            earth.visibility_percent || 0
        ).toFixed(0)}%`
    );

    setText(
        "communicationStatus",
        communication.status ||
        "Unknown"
    );

    if (powerBar) {

        powerBar.style.width =
            `${clamp(
                Number(
                    sun.power_potential_percent || 0
                ),
                0,
                100
            )}%`;
    }

    if (earthBar) {

        earthBar.style.width =
            `${clamp(
                Number(
                    earth.visibility_percent || 0
                ),
                0,
                100
            )}%`;
    }
}


/* =========================================================
   ASSESSMENT
========================================================= */

function updateAssessment(data) {

    if (!assessment) return;

    const power =
        Number(
            data.sun?.power_potential_percent || 0
        );

    const earth =
        Number(
            data.earth?.visibility_percent || 0
        );

    let message =
        "Landing conditions require further assessment.";

    if (
        power >= 75 &&
        earth >= 85
    ) {

        message =
            "Favorable planning conditions: good illumination and strong Earth visibility.";
    } else if (
        power >= 50 &&
        earth >= 70
    ) {

        message =
            "Moderate planning conditions: review illumination and communications carefully.";
    } else {

        message =
            "Challenging conditions: low illumination or limited Earth visibility.";
    }

    assessment.textContent =
        message;
}


/* =========================================================
   COMPARISON
========================================================= */

function updateComparison() {

    if (!comparisonGrid || !selectedCrater) {
        return;
    }

    comparisonGrid.innerHTML = "";

    const comparisonSites =
        craters
            .filter(
                crater =>
                    crater.name ===
                    selectedCrater.name ||
                    Math.abs(
                        Number(crater.lat)
                    ) >= 80
            )
            .slice(0, 6);

    for (const crater of comparisonSites) {

        const card =
            document.createElement("div");

        card.className =
            "comparison-card";

        card.innerHTML = `
            <strong>${escapeHtml(crater.name || "Unknown")}</strong>
            <span>
                ${formatCoordinate(
                    crater.lat,
                    "N",
                    "S"
                )}
            </span>
            <span>
                ${formatCoordinate(
                    crater.lon,
                    "E",
                    "W"
                )}
            </span>
        `;

        card.addEventListener(
            "click",
            () => selectCrater(crater)
        );

        comparisonGrid.appendChild(card);
    }
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   CONTROLS
========================================================= */

function setupControls() {

    if (landingSiteSelect) {

        landingSiteSelect.addEventListener(
            "change",
            () => {
                selectCraterByName(
                    landingSiteSelect.value
                );
            }
        );
    }


    if (missionDate) {

        missionDate.addEventListener(
            "change",
            () => {
                analyzeMission();
                updateTransferSystem();
            }
        );
    }


    if (lunarHour) {

        lunarHour.addEventListener(
            "input",
            () => {

                if (lunarHourValue) {
                    lunarHourValue.textContent =
                        `${lunarHour.value}:00`;
                }

                analyzeMission();
            }
        );
    }


    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            () => {
                analyzeMission();
            }
        );
    }


    if (southPoleOnly) {

        southPoleOnly.addEventListener(
            "change",
            applyCraterFilters
        );
    }


    if (majorOnly) {

        majorOnly.addEventListener(
            "change",
            applyCraterFilters
        );
    }


    if (zoomIn) {

        zoomIn.addEventListener(
            "click",
            () => {

                cameraDistance =
                    clamp(
                        cameraDistance - 0.5,
                        1.5,
                        30
                    );

                updateCamera();
            }
        );
    }


    if (zoomOut) {

        zoomOut.addEventListener(
            "click",
            () => {

                cameraDistance =
                    clamp(
                        cameraDistance + 0.5,
                        1.5,
                        30
                    );

                updateCamera();
            }
        );
    }


    if (viewTop) {

        viewTop.addEventListener(
            "click",
            () => {

                cameraYaw = 0;
                cameraPitch = 1.25;

                cameraDistance = 3.5;

                cameraTarget.copy(
                    getMoonWorldPosition()
                );

                updateCamera();
            }
        );
    }


    if (viewGlobe) {

        viewGlobe.addEventListener(
            "click",
            () => {

                cameraYaw = 0.65;
                cameraPitch = 0.25;

                cameraDistance = 8.5;

                cameraTarget.copy(
                    EARTH_POSITION
                );

                updateCamera();
            }
        );
    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                cameraYaw = 0.65;
                cameraPitch = 0.25;

                cameraDistance = 4.5;

                cameraTarget.copy(
                    getMoonWorldPosition()
                );

                updateCamera();
            }
        );
    }
}


/* =========================================================
   MOUSE / TOUCH CAMERA
========================================================= */

function setupMouseControls() {

    const canvas =
        renderer.domElement;

    canvas.addEventListener(
        "pointerdown",
        event => {

            dragging = true;

            lastX = event.clientX;
            lastY = event.clientY;

            canvas.setPointerCapture(
                event.pointerId
            );
        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            updateCursorCoordinates(
                event
            );

            if (!dragging) {
                return;
            }

            const dx =
                event.clientX - lastX;

            const dy =
                event.clientY - lastY;

            lastX = event.clientX;
            lastY = event.clientY;

            cameraYaw -=
                dx * 0.008;

            cameraPitch -=
                dy * 0.008;

            cameraPitch =
                clamp(
                    cameraPitch,
                    -1.35,
                    1.35
                );

            updateCamera();
        }
    );


    canvas.addEventListener(
        "pointerup",
        event => {

            dragging = false;

            try {
                canvas.releasePointerCapture(
                    event.pointerId
                );
            } catch (error) {
                /* Pointer capture may already be released. */
            }
        }
    );


    canvas.addEventListener(
        "pointerleave",
        () => {
            dragging = false;
        }
    );


    canvas.addEventListener(
        "wheel",
        event => {

            event.preventDefault();

            cameraDistance +=
                event.deltaY * 0.003;

            cameraDistance =
                clamp(
                    cameraDistance,
                    1.3,
                    30
                );

            updateCamera();
        },
        {
            passive: false
        }
    );


    canvas.addEventListener(
        "click",
        event => {

            if (dragging) {
                return;
            }

            const rect =
                canvas.getBoundingClientRect();

            mouse.x =
                ((event.clientX - rect.left) /
                    rect.width) * 2 - 1;

            mouse.y =
                -((event.clientY - rect.top) /
                    rect.height) * 2 + 1;

            raycaster.setFromCamera(
                mouse,
                camera
            );

            const clickableObjects = [];

            for (const item of craterMarkers) {

                if (!item.object.visible) {
                    continue;
                }

                item.object.traverse(
                    child => {

                        if (
                            child.isMesh
                        ) {
                            clickableObjects.push(
                                child
                            );
                        }
                    }
                );
            }

            const hits =
                raycaster.intersectObjects(
                    clickableObjects,
                    false
                );

            if (hits.length === 0) {
                return;
            }

            const hit =
                hits[0].object;

            const crater =
                hit.userData.crater;

            if (crater) {
                selectCrater(crater);
            }
        }
    );
}


/* =========================================================
   CURSOR COORDINATES
========================================================= */

function updateCursorCoordinates(event) {

    if (!cursorCoords) return;

    const rect =
        renderer.domElement
            .getBoundingClientRect();

    const x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    const y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

    cursorCoords.textContent =
        `X ${x.toFixed(2)}  Y ${y.toFixed(2)}`;
}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (!camera) return;

    const x =
        Math.cos(cameraPitch) *
        Math.sin(cameraYaw) *
        cameraDistance;

    const y =
        Math.sin(cameraPitch) *
        cameraDistance;

    const z =
        Math.cos(cameraPitch) *
        Math.cos(cameraYaw) *
        cameraDistance;

    camera.position.set(
        cameraTarget.x + x,
        cameraTarget.y + y,
        cameraTarget.z + z
    );

    camera.lookAt(
        cameraTarget
    );

    if (cameraDistanceDisplay) {

        cameraDistanceDisplay.textContent =
            `${cameraDistance.toFixed(1)} AU`;
    }
}


/* =========================================================
   RESIZE
========================================================= */

function setupResize() {

    window.addEventListener(
        "resize",
        () => {

            const container =
                $("three-container");

            if (!container) return;

            camera.aspect =
                container.clientWidth /
                container.clientHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                container.clientWidth,
                container.clientHeight
            );
        }
    );
}


/* =========================================================
   MOON ANIMATION
========================================================= */

function updateMoonPosition() {

    if (!moon) return;

    /*
     * Slow orbital movement.
     */
    moonAngle += 0.0009;

    const position =
        getMoonWorldPosition();

    moon.position.copy(
        position
    );

    /*
     * Slow lunar rotation.
     */
    moon.rotation.y += 0.0005;

    /*
     * Keep orbit centered on Earth.
     */
    if (moonOrbit) {
        moonOrbit.position.set(
            0,
            0,
            0
        );
    }

    /*
     * Move all interactive crater markers.
     */
    updateCraterPositions();

    /*
     * Move spacecraft and transfer point
     * with the Moon's changing position.
     */
    updateTransferSystem();

    /*
     * If the camera is currently focused
     * on the Moon, follow it.
     */
    if (
        selectedCrater ||
        cameraDistance <= 5
    ) {

        cameraTarget.lerp(
            position,
            0.08
        );
    }
}


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animate() {

    if (!animationStarted) {
        requestAnimationFrame(animate);
        return;
    }

    requestAnimationFrame(
        animate
    );

    updateMoonPosition();

    /*
     * Gentle Earth rotation.
     */
    if (earth) {
        earth.rotation.y += 0.0002;
    }

    /*
     * Sun stays fixed.
     */
    if (sun) {
        sun.rotation.y += 0.0001;
    }

    updateCamera();

    renderer.render(
        scene,
        camera
    );
}
