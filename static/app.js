let scene;
let camera;
let renderer;

let earth;
let moon;
let sun;
let sunLight;

let moonOrbit;
let earthMoonCurve;
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

/* Moon farther from Earth */
const MOON_ORBIT_RADIUS = 3.25;

const EARTH_POSITION = new THREE.Vector3(
    -7.5,
    3.5,
    -4.5
);

const SUN_POSITION = new THREE.Vector3(
    12,
    5,
    8
);

let cameraTarget;
let cameraDistance = 4.5;
let cameraYaw = 0.65;
let cameraPitch = 0.25;

let dragging = false;
let lastX = 0;
let lastY = 0;


/* =========================================================
   DOM
========================================================= */

const launchSiteSelect =
    document.getElementById("launchSite");

const landingSiteSelect =
    document.getElementById("landingSite");

const missionDate =
    document.getElementById("missionDate");

const lunarHour =
    document.getElementById("lunarHour");

const lunarHourValue =
    document.getElementById("lunarHourValue");

const analyzeButton =
    document.getElementById("analyzeButton");

const resetButton =
    document.getElementById("resetButton");

const southPoleOnly =
    document.getElementById("southPoleOnly");

const majorOnly =
    document.getElementById("majorOnly");

const zoomIn =
    document.getElementById("zoomIn");

const zoomOut =
    document.getElementById("zoomOut");

const viewTop =
    document.getElementById("viewTop");

const viewGlobe =
    document.getElementById("viewGlobe");

const sunElevation =
    document.getElementById("sunElevation");

const powerPotential =
    document.getElementById("powerPotential");

const earthVisibility =
    document.getElementById("earthVisibility");

const communicationStatus =
    document.getElementById("communicationStatus");

const powerBar =
    document.getElementById("powerBar");

const earthBar =
    document.getElementById("earthBar");

const siteName =
    document.getElementById("siteName");

const siteLatitude =
    document.getElementById("siteLatitude");

const siteLongitude =
    document.getElementById("siteLongitude");

const siteDiameter =
    document.getElementById("siteDiameter");

const siteRegion =
    document.getElementById("siteRegion");

const assessment =
    document.getElementById("assessment");

const comparisonGrid =
    document.getElementById("comparisonGrid");

const cameraDistanceDisplay =
    document.getElementById("cameraDistance");

const cursorCoords =
    document.getElementById("cursorCoords");

const loadingOverlay =
    document.getElementById("loading-overlay");

const loadingProgress =
    document.getElementById("loadingProgress");

const loadingText =
    document.getElementById("loadingText");


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    start
);


async function start() {

    try {

        updateLoading(
            5,
            "Starting lunar mission environment..."
        );

        const container =
            document.getElementById(
                "three-container"
            );

        if (!container) {
            throw new Error(
                "3D viewport not found."
            );
        }

        if (
            typeof THREE === "undefined"
        ) {
            throw new Error(
                "Three.js failed to load."
            );
        }

        cameraTarget =
            new THREE.Vector3();

        initializeThree(
            container
        );

        updateLoading(
            30,
            "Building Earth and Moon..."
        );

        setupControls();

        updateLoading(
            50,
            "Loading crater database..."
        );

        await loadMissionData();

        updateLoading(
            75,
            "Creating interactive landing sites..."
        );

        createCraterMarkers();

        updateLoading(
            90,
            "Calculating lunar orbit..."
        );

        if (
            landingSiteSelect &&
            landingSiteSelect.options.length > 0
        ) {

            landingSiteSelect.selectedIndex = 0;

            selectCraterByName(
                landingSiteSelect.value
            );
        }

        updateLoading(
            100,
            "Mission environment ready."
        );

        setTimeout(
            finishLoading,
            350
        );

        animate();

    } catch (error) {

        console.error(
            "STARTUP ERROR:",
            error
        );

        if (loadingText) {
            loadingText.textContent =
                "Startup error: " +
                error.message;
        }
    }
}


/* =========================================================
   LOADING
========================================================= */

function updateLoading(
    percent,
    message
) {

    if (loadingProgress) {
        loadingProgress.style.width =
            `${percent}%`;
    }

    if (loadingText) {
        loadingText.textContent =
            message;
    }
}


function finishLoading() {

    if (!loadingOverlay) {
        return;
    }

    loadingOverlay.style.opacity =
        "0";

    setTimeout(
        () => {
            loadingOverlay.style.display =
                "none";
        },
        500
    );
}


/* =========================================================
   THREE INITIALIZATION
========================================================= */

function initializeThree(container) {

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x020406
        );


    camera =
        new THREE.PerspectiveCamera(
            55,
            container.clientWidth /
                container.clientHeight,
            0.01,
            500
        );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        0.7;


    container.appendChild(
        renderer.domElement
    );


    raycaster =
        new THREE.Raycaster();

    mouse =
        new THREE.Vector2();


    const ambient =
        new THREE.AmbientLight(
            0x59636b,
            0.12
        );

    scene.add(
        ambient
    );


    sunLight =
        new THREE.PointLight(
            0xffe2a0,
            4,
            0,
            2
        );

    sunLight.position.copy(
        SUN_POSITION
    );

    scene.add(
        sunLight
    );


    createSun();

    createEarth();

    createMoon();

    createMoonOrbit();

    createEarthMoonCurve();


    cameraTarget.copy(
        getMoonWorldPosition()
    );


    setupMouseControls();

    setupResize();
}


/* =========================================================
   SUN
========================================================= */

function createSun() {

    const geometry =
        new THREE.SphereGeometry(
            0.75,
            32,
            32
        );


    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffd27a
        });


    sun =
        new THREE.Mesh(
            geometry,
            material
        );


    sun.position.copy(
        SUN_POSITION
    );


    scene.add(
        sun
    );
}


/* =========================================================
   EARTH
========================================================= */

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS,
            64,
            64
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x285c86,
            roughness: 0.75,
            metalness: 0
        });


    earth =
        new THREE.Mesh(
            geometry,
            material
        );


    earth.position.copy(
        EARTH_POSITION
    );


    scene.add(
        earth
    );


    const atmosphereGeometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS * 1.05,
            48,
            48
        );


    const atmosphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x3c9bd6,
            transparent: true,
            opacity: 0.07,
            side: THREE.BackSide
        });


    const atmosphere =
        new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
        );


    earth.add(
        atmosphere
    );
}


/* =========================================================
   MOON
========================================================= */

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(
            MOON_RADIUS,
            64,
            64
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x929292,
            roughness: 1,
            metalness: 0
        });


    moon =
        new THREE.Mesh(
            geometry,
            material
        );


    moon.position.copy(
        getMoonWorldPosition()
    );


    scene.add(
        moon
    );
}


/* =========================================================
   MOON POSITION
========================================================= */

function getMoonWorldPosition() {

    return new THREE.Vector3(

        EARTH_POSITION.x +
            Math.cos(moonAngle) *
            MOON_ORBIT_RADIUS,

        EARTH_POSITION.y,

        EARTH_POSITION.z +
            Math.sin(moonAngle) *
            MOON_ORBIT_RADIUS
    );
}


/* =========================================================
   MOON ORBIT
========================================================= */

function createMoonOrbit() {

    const points = [];

    const segments = 160;

    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const angle =
            (i / segments) *
            Math.PI *
            2;


        points.push(
            new THREE.Vector3(

                EARTH_POSITION.x +
                    Math.cos(angle) *
                    MOON_ORBIT_RADIUS,

                EARTH_POSITION.y,

                EARTH_POSITION.z +
                    Math.sin(angle) *
                    MOON_ORBIT_RADIUS
            )
        );
    }


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );


    const material =
        new THREE.LineBasicMaterial({
            color: 0x59636b,
            transparent: true,
            opacity: 0.45
        });


    moonOrbit =
        new THREE.Line(
            geometry,
            material
        );


    scene.add(
        moonOrbit
    );
}


/* =========================================================
   EARTH -> MOON CURVED LINE
========================================================= */

function createEarthMoonCurve() {

    const start =
        EARTH_POSITION.clone();

    const end =
        getMoonWorldPosition();


    const middle =
        start.clone().lerp(
            end,
            0.5
        );


    middle.y += 1.2;


    const curve =
        new THREE.QuadraticBezierCurve3(
            start,
            middle,
            end
        );


    const points =
        curve.getPoints(
            100
        );


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );


    const material =
        new THREE.LineBasicMaterial({
            color: 0x8ca8bb,
            transparent: true,
            opacity: 0.55
        });


    earthMoonCurve =
        new THREE.Line(
            geometry,
            material
        );


    scene.add(
        earthMoonCurve
    );
}


/* =========================================================
   UPDATE EARTH -> MOON CURVE
========================================================= */

function updateEarthMoonCurve() {

    if (!earthMoonCurve) {
        return;
    }


    const start =
        EARTH_POSITION.clone();

    const end =
        getMoonWorldPosition();


    const middle =
        start.clone().lerp(
            end,
            0.5
        );


    middle.y += 1.2;


    const curve =
        new THREE.QuadraticBezierCurve3(
            start,
            middle,
            end
        );


    const points =
        curve.getPoints(
            100
        );


    earthMoonCurve.geometry.dispose();


    earthMoonCurve.geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadMissionData() {

    const craterResponse =
        await fetch(
            "/api/craters"
        );


    if (!craterResponse.ok) {
        throw new Error(
            "Could not load crater data."
        );
    }


    craters =
        await craterResponse.json();


    const launchResponse =
        await fetch(
            "/api/launch-sites"
        );


    if (!launchResponse.ok) {
        throw new Error(
            "Could not load launch site data."
        );
    }


    launchSites =
        await launchResponse.json();


    populateLaunchSites();

    populateCraterSites();
}


/* =========================================================
   LAUNCH SITE DROPDOWN
========================================================= */

function populateLaunchSites() {

    if (!launchSiteSelect) {
        return;
    }


    launchSiteSelect.innerHTML =
        "";


    for (
        const site of launchSites
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            site.name;


        option.textContent =
            `${site.name} — ${site.country}`;


        launchSiteSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   CRATER DROPDOWN
========================================================= */

function populateCraterSites() {

    if (!landingSiteSelect) {
        return;
    }


    landingSiteSelect.innerHTML =
        "";


    for (
        const crater of craters
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            crater.name;


        option.textContent =
            crater.name;


        landingSiteSelect.appendChild(
            option
        );
    }
}


/* =========================================================
   CRATER MARKERS
========================================================= */

function createCraterMarkers() {

    if (!scene) {
        return;
    }


    if (craterGroup) {

        scene.remove(
            craterGroup
        );
    }


    craterGroup =
        new THREE.Group();


    craterMarkers = [];


    for (
        const crater of craters
    ) {

        const marker =
            createCraterMarker(
                crater
            );


        if (!marker) {
            continue;
        }


        craterGroup.add(
            marker
        );


        craterMarkers.push({
            object: marker,
            data: crater
        });
    }


    scene.add(
        craterGroup
    );


    applyCraterFilters();
}


/* =========================================================
   BLUE CRATER SPOT
========================================================= */

function createCraterMarker(
    crater
) {

    const latitude =
        Number(
            crater.lat
        );


    const longitude =
        Number(
            crater.lon
        );


    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {
        return null;
    }


    const lat =
        THREE.MathUtils.degToRad(
            latitude
        );


    const lon =
        THREE.MathUtils.degToRad(
            longitude
        );


    /*
     * Position on lunar surface.
     */
    const radius =
        MOON_RADIUS *
        1.035;


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


    /*
     * Blue interactive dot.
     */
    const geometry =
        new THREE.SphereGeometry(
            0.025,
            16,
            16
        );


    const material =
        new THREE.MeshBasicMaterial({
            color: 0x168cff
        });


    const marker =
        new THREE.Mesh(
            geometry,
            material
        );


    marker.userData.crater =
        crater;


    marker.userData.localPosition =
        new THREE.Vector3(
            x,
            y,
            z
        );


    marker.userData.baseScale =
        1;


    return marker;
}


/* =========================================================
   UPDATE CRATER POSITIONS
========================================================= */

function updateCraterPositions() {

    if (
        !moon ||
        !craterMarkers
    ) {
        return;
    }


    const moonPosition =
        moon.position;


    for (
        const item of craterMarkers
    ) {

        const marker =
            item.object;


        const localPosition =
            marker.userData
                .localPosition;


        if (!localPosition) {
            continue;
        }


        /*
         * Move blue spot with Moon.
         */
        const worldPosition =
            localPosition.clone();


        worldPosition.applyQuaternion(
            moon.quaternion
        );


        marker.position.copy(
            moonPosition
                .clone()
                .add(
                    worldPosition
                )
        );
    }
}


/* =========================================================
   SELECT CRATER
========================================================= */

function selectCrater(
    crater
) {

    if (!crater) {
        return;
    }


    selectedCrater =
        crater;


    /*
     * Sync dropdown.
     */
    if (landingSiteSelect) {

        const target =
            String(
                crater.name || ""
            ).toLowerCase();


        for (
            let i = 0;
            i < landingSiteSelect.options.length;
            i++
        ) {

            if (
                landingSiteSelect
                    .options[i]
                    .value
                    .toLowerCase() ===
                target
            ) {

                landingSiteSelect
                    .selectedIndex =
                    i;

                break;
            }
        }
    }


    /*
     * Update information panel.
     */
    setText(
        "siteName",
        crater.name ||
            "Unknown Site"
    );


    setText(
        "siteLatitude",
        formatCoordinate(
            crater.lat,
            "N",
            "S"
        )
    );


    setText(
        "siteLongitude",
        formatCoordinate(
            crater.lon,
            "E",
            "W"
        )
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
            "Lunar South Pole"
    );


    updateMarkerSelection();


    /*
     * Focus Moon.
     */
    cameraTarget.copy(
        moon.position
    );


    cameraDistance =
        2.0;


    updateCamera();


    analyzeMission();
}


/* =========================================================
   DROPDOWN SELECTION
========================================================= */

function selectCraterByName(
    name
) {

    if (!name) {
        return;
    }


    const crater =
        craters.find(
            item =>
                String(
                    item.name || ""
                ).toLowerCase() ===
                String(
                    name
                ).toLowerCase()
        );


    if (crater) {
        selectCrater(
            crater
        );
    }
}


/* =========================================================
   HIGHLIGHT SELECTED BLUE SPOT
========================================================= */

function updateMarkerSelection() {

    for (
        const item of craterMarkers
    ) {

        const marker =
            item.object;


        const selected =
            selectedCrater &&
            item.data.name ===
                selectedCrater.name;


        if (selected) {

            marker.scale.setScalar(
                1.8
            );

            marker.material.color.set(
                0x6fc2ff
            );

        } else {

            marker.scale.setScalar(
                1
            );

            marker.material.color.set(
                0x168cff
            );
        }
    }
}


/* =========================================================
   FILTERS
========================================================= */

function applyCraterFilters() {

    for (
        const item of craterMarkers
    ) {

        const crater =
            item.data;


        let visible =
            true;


        /*
         * South pole filter.
         */
        if (
            southPoleOnly &&
            southPoleOnly.checked
        ) {

            const latitude =
                Number(
                    crater.lat
                );


            visible =
                Math.abs(
                    latitude
                ) >= 80;
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
                Number(
                    crater.diameter
                );


            if (
                Number.isFinite(
                    diameter
                )
            ) {

                visible =
                    diameter >= 50;
            }
        }


        item.object.visible =
            visible;
    }
}


/* =========================================================
   COORDINATES
========================================================= */

function formatCoordinate(
    value,
    positive,
    negative
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {
        return "N/A";
    }


    const direction =
        number >= 0
            ? positive
            : negative;


    return (
        Math.abs(
            number
        ).toFixed(2) +
        "° " +
        direction
    );
}


/* =========================================================
   MISSION ANALYSIS
========================================================= */

async function analyzeMission() {

    if (!selectedCrater) {
        return;
    }


    const latitude =
        Number(
            selectedCrater.lat
        );


    const longitude =
        Number(
            selectedCrater.lon
        );


    const date =
        missionDate &&
        missionDate.value
            ? missionDate.value
            : new Date()
                .toISOString()
                .split("T")[0];


    const hour =
        lunarHour
            ? Number(
                lunarHour.value
            )
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


        updateTelemetry(
            data
        );


        updateAssessment(
            data
        );


        updateComparison();

    } catch (error) {

        console.error(
            "ANALYSIS ERROR:",
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

function updateTelemetry(
    data
) {

    const sun =
        data.sun || {};


    const earthData =
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
            earthData.visibility_percent || 0
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
                    sun.power_potential_percent ||
                    0
                ),
                0,
                100
            )}%`;
    }


    if (earthBar) {

        earthBar.style.width =
            `${clamp(
                Number(
                    earthData.visibility_percent ||
                    0
                ),
                0,
                100
            )}%`;
    }
}


/* =========================================================
   ASSESSMENT
========================================================= */

function updateAssessment(
    data
) {

    if (!assessment) {
        return;
    }


    const power =
        Number(
            data.sun
                ?.power_potential_percent ||
            0
        );


    const earth =
        Number(
            data.earth
                ?.visibility_percent ||
            0
        );


    if (
        power >= 75 &&
        earth >= 85
    ) {

        assessment.textContent =
            "Favorable planning conditions: good illumination and strong Earth visibility.";

    } else if (
        power >= 50 &&
        earth >= 70
    ) {

        assessment.textContent =
            "Moderate planning conditions: review illumination and communications carefully.";

    } else {

        assessment.textContent =
            "Challenging conditions: low illumination or limited Earth visibility.";
    }
}


/* =========================================================
   COMPARISON
========================================================= */

function updateComparison() {

    if (
        !comparisonGrid ||
        !selectedCrater
    ) {
        return;
    }


    comparisonGrid.innerHTML =
        "";


    const sites =
        craters
            .filter(
                crater =>
                    crater.name ===
                        selectedCrater.name ||
                    Math.abs(
                        Number(
                            crater.lat
                        )
                    ) >= 80
            )
            .slice(
                0,
                6
            );


    for (
        const crater of sites
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "comparison-card";


        card.innerHTML = `
            <strong>
                ${escapeHtml(
                    crater.name ||
                    "Unknown"
                )}
            </strong>

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
            () => {
                selectCrater(
                    crater
                );
            }
        );


        comparisonGrid.appendChild(
            card
        );
    }
}


/* =========================================================
   SAFE TEXT
========================================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
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
                        cameraDistance -
                            0.5,
                        1.2,
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
                        cameraDistance +
                            0.5,
                        1.2,
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

                cameraPitch =
                    1.25;

                cameraDistance =
                    3.5;

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

                cameraYaw =
                    0.65;

                cameraPitch =
                    0.25;

                cameraDistance =
                    8.5;

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

                cameraYaw =
                    0.65;

                cameraPitch =
                    0.25;

                cameraDistance =
                    4.5;

                cameraTarget.copy(
                    getMoonWorldPosition()
                );

                updateCamera();
            }
        );
    }
}


/* =========================================================
   MOUSE / TOUCH
========================================================= */

function setupMouseControls() {

    const canvas =
        renderer.domElement;


    canvas.addEventListener(
        "pointerdown",
        event => {

            dragging = true;

            lastX =
                event.clientX;

            lastY =
                event.clientY;

            canvas.setPointerCapture(
                event.pointerId
            );
        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            updateCursor(
                event
            );


            if (!dragging) {
                return;
            }


            const dx =
                event.clientX -
                lastX;


            const dy =
                event.clientY -
                lastY;


            lastX =
                event.clientX;

            lastY =
                event.clientY;


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

            dragging =
                false;


            try {

                canvas.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {
                /* Already released. */
            }
        }
    );


    canvas.addEventListener(
        "pointerleave",
        () => {

            dragging =
                false;
        }
    );


    canvas.addEventListener(
        "wheel",
        event => {

            event.preventDefault();


            cameraDistance +=
                event.deltaY *
                0.003;


            cameraDistance =
                clamp(
                    cameraDistance,
                    1.2,
                    30
                );


            updateCamera();

        },
        {
            passive: false
        }
    );


    /*
     * CLICK BLUE CRATER SPOTS
     */
    canvas.addEventListener(
        "click",
        event => {

            const rect =
                canvas.getBoundingClientRect();


            mouse.x =
                (
                    (
                        event.clientX -
                        rect.left
                    ) /
                    rect.width
                ) * 2 - 1;


            mouse.y =
                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) * 2 + 1;


            raycaster.setFromCamera(
                mouse,
                camera
            );


            const objects = [];


            for (
                const item of craterMarkers
            ) {

                if (
                    !item.object.visible
                ) {
                    continue;
                }


                objects.push(
                    item.object
                );
            }


            const hits =
                raycaster.intersectObjects(
                    objects,
                    false
                );


            if (
                hits.length === 0
            ) {
                return;
            }


            const crater =
                hits[0]
                    .object
                    .userData
                    .crater;


            if (crater) {

                selectCrater(
                    crater
                );
            }
        }
    );
}


/* =========================================================
   CURSOR
========================================================= */

function updateCursor(
    event
) {

    if (!cursorCoords) {
        return;
    }


    const rect =
        renderer.domElement
            .getBoundingClientRect();


    const x =
        (
            (
                event.clientX -
                rect.left
            ) /
            rect.width
        ) * 2 - 1;


    const y =
        -(
            (
                event.clientY -
                rect.top
            ) /
            rect.height
        ) * 2 + 1;


    cursorCoords.textContent =
        `X ${x.toFixed(2)}  Y ${y.toFixed(2)}`;
}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (!camera) {
        return;
    }


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


    if (
        cameraDistanceDisplay
    ) {

        cameraDistanceDisplay.textContent =
            `${cameraDistance.toFixed(1)}`;
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
                document.getElementById(
                    "three-container"
                );


            if (!container) {
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
    );
}


/* =========================================================
   MOON ANIMATION
========================================================= */

function updateMoonPosition() {

    if (!moon) {
        return;
    }


    /*
     * Slow Moon orbit.
     */
    moonAngle +=
        0.0009;


    const position =
        getMoonWorldPosition();


    moon.position.copy(
        position
    );


    /*
     * Slow lunar rotation.
     */
    moon.rotation.y +=
        0.0005;


    /*
     * Move blue crater spots
     * with the Moon.
     */
    updateCraterPositions();


    /*
     * Update curved Earth -> Moon
     * line so it always reaches Moon.
     */
    updateEarthMoonCurve();


    /*
     * Follow Moon when camera is close.
     */
    if (
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

    requestAnimationFrame(
        animate
    );


    updateMoonPosition();


    if (earth) {

        earth.rotation.y +=
            0.0002;
    }


    if (sun) {

        sun.rotation.y +=
            0.0001;
    }


    updateCamera();


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   CLAMP
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


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {
        element.textContent =
            value;
    }
}
