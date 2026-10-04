// ============================================================
// LUNAR SOUTH POLE MISSION PLANNER
// 3D KSP-inspired mission interface
// ============================================================

const THREE = window.THREE;

// ------------------------------------------------------------
// GLOBAL STATE
// ------------------------------------------------------------

let scene;
let camera;
let renderer;
let clock;

let earth;
let moon;
let sun;

let moonOrbitGroup;
let craterGroup;

let sunLight;
let ambientLight;

let moonOrbitAngle = 0;

const EARTH_RADIUS = 0.95;
const MOON_RADIUS = 0.42;

// Visual scale — not physically to scale
const MOON_ORBIT_RADIUS = 2.05;

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

let selectedCrater = null;
let craterMarkers = [];

let craters = [];
let launchSites = [];

let raycaster;
let mouse;

let animationStarted = false;

let cameraTarget = new THREE.Vector3(
    EARTH_POSITION.x,
    EARTH_POSITION.y,
    EARTH_POSITION.z
);

let cameraDistance = 12;
let cameraYaw = 0.65;
let cameraPitch = 0.28;

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

let currentView = "globe";


// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    initialize();

});


async function initialize() {

    setupScene();
    setupCamera();
    setupRenderer();
    setupLights();

    createSun();
    createEarth();
    createMoonSystem();
    createMoonOrbit();

    setupInteraction();

    setupUI();

    await loadMissionData();

    updateCamera();

    animationStarted = true;

    animate();

}


// ------------------------------------------------------------
// THREE.JS SCENE
// ------------------------------------------------------------

function setupScene() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x020504);

    clock = new THREE.Clock();

    raycaster = new THREE.Raycaster();

    mouse = new THREE.Vector2();

}


// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

function setupCamera() {

    camera = new THREE.PerspectiveCamera(
        55,
        1,
        0.01,
        500
    );

    camera.position.set(
        4,
        5,
        12
    );

    camera.lookAt(
        cameraTarget
    );

}


function updateCamera() {

    if (!camera) return;

    const cosPitch =
        Math.cos(cameraPitch);

    camera.position.x =
        cameraTarget.x +
        Math.cos(cameraYaw) *
        cosPitch *
        cameraDistance;

    camera.position.y =
        cameraTarget.y +
        Math.sin(cameraPitch) *
        cameraDistance;

    camera.position.z =
        cameraTarget.z +
        Math.sin(cameraYaw) *
        cosPitch *
        cameraDistance;

    camera.lookAt(
        cameraTarget
    );

}


// ------------------------------------------------------------
// RENDERER
// ------------------------------------------------------------

function setupRenderer() {

    const container =
        document.getElementById(
            "three-container"
        );

    if (!container) {
        console.error(
            "three-container not found."
        );
        return;
    }

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
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

    renderer.toneMappingExposure = 0.7;

    container.appendChild(
        renderer.domElement
    );

    window.addEventListener(
        "resize",
        resizeRenderer
    );

}


function resizeRenderer() {

    const container =
        document.getElementById(
            "three-container"
        );

    if (!container || !renderer) return;

    const width =
        container.clientWidth;

    const height =
        container.clientHeight;

    if (width <= 0 || height <= 0) return;

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height
    );

}


// ------------------------------------------------------------
// LIGHTING
// ------------------------------------------------------------

function setupLights() {

    /*
     * VERY IMPORTANT:
     *
     * The Sun object itself is still bright.
     * This light controls how strongly the
     * Sun illuminates Earth and Moon.
     */

    ambientLight =
        new THREE.AmbientLight(
            0x657080,
            0.12
        );

    scene.add(
        ambientLight
    );


    sunLight =
        new THREE.PointLight(
            0xffe4a0,
            5,
            0,
            2
        );

    sunLight.position.copy(
        SUN_POSITION
    );

    scene.add(
        sunLight
    );

}


// ------------------------------------------------------------
// SUN
// ------------------------------------------------------------

function createSun() {

    const geometry =
        new THREE.SphereGeometry(
            1.15,
            48,
            48
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xd9a85d
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


    /*
     * Subtle glow.
     * This is visual only.
     * It does NOT illuminate the planets.
     */

    const glowGeometry =
        new THREE.SphereGeometry(
            1.32,
            32,
            32
        );

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xc58b45,
            transparent: true,
            opacity: 0.035,
            depthWrite: false
        });

    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    sun.add(
        glow
    );


    createLabel(
        "SUN",
        "sun-label"
    );

}


// ------------------------------------------------------------
// EARTH
// ------------------------------------------------------------

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS,
            64,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x274d5c,
            roughness: 0.92,
            metalness: 0.02
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


    /*
     * Simple continent-like surface details.
     * These are intentionally subtle.
     */

    const cloudGeometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS * 1.008,
            48,
            48
        );

    const cloudMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x8ca3a5,
            transparent: true,
            opacity: 0.08,
            depthWrite: false
        });

    const clouds =
        new THREE.Mesh(
            cloudGeometry,
            cloudMaterial
        );

    earth.add(
        clouds
    );


    createLabel(
        "EARTH",
        "earth-label"
    );

}


// ------------------------------------------------------------
// MOON
// ------------------------------------------------------------

function createMoonSystem() {

    /*
     * Moon is created separately from Earth.
     *
     * Its WORLD position is calculated from
     * Earth's position + orbital position.
     */

    const geometry =
        new THREE.SphereGeometry(
            MOON_RADIUS,
            64,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x686868,
            roughness: 1.0,
            metalness: 0.0
        });

    moon =
        new THREE.Mesh(
            geometry,
            material
        );


    /*
     * Start directly ON the orbit.
     */

    updateMoonOrbitPosition();

    scene.add(
        moon
    );


    /*
     * Craters are children of the Moon.
     * Therefore they travel with the Moon.
     */

    craterGroup =
        new THREE.Group();

    moon.add(
        craterGroup
    );

}


// ------------------------------------------------------------
// MOON ORBIT
// ------------------------------------------------------------

function createMoonOrbit() {

    moonOrbitGroup =
        new THREE.Group();

    const points = [];

    const segments = 256;

    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const angle =
            (i / segments) *
            Math.PI *
            2;

        /*
         * Slightly inclined visual orbit.
         */

        const x =
            Math.cos(angle) *
            MOON_ORBIT_RADIUS;

        const y =
            Math.sin(angle) *
            0.22;

        const z =
            Math.sin(angle) *
            MOON_ORBIT_RADIUS;

        points.push(
            new THREE.Vector3(
                x,
                y,
                z
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
            color: 0x65755c,
            transparent: true,
            opacity: 0.38
        });


    const orbit =
        new THREE.LineLoop(
            geometry,
            material
        );


    /*
     * Earth is the center of the orbit.
     */

    orbit.position.copy(
        EARTH_POSITION
    );

    moonOrbitGroup.add(
        orbit
    );

    scene.add(
        moonOrbitGroup
    );

}


// ------------------------------------------------------------
// MOON ORBIT MOTION
// ------------------------------------------------------------

function updateMoonOrbitPosition() {

    if (!moon || !earth) return;

    const angle =
        moonOrbitAngle;


    const x =
        Math.cos(angle) *
        MOON_ORBIT_RADIUS;


    const z =
        Math.sin(angle) *
        MOON_ORBIT_RADIUS;


    /*
     * Small inclination.
     */

    const y =
        Math.sin(angle) *
        0.22;


    moon.position.set(

        EARTH_POSITION.x + x,

        EARTH_POSITION.y + y,

        EARTH_POSITION.z + z

    );

}


// ------------------------------------------------------------
// LABELS
// ------------------------------------------------------------

function createLabel(
    text,
    id
) {

    const label =
        document.getElementById(
            id
        );

    if (label) {
        label.textContent =
            text;
    }

}


function updateSpaceLabels() {

    if (!camera || !renderer) return;


    updateObjectLabel(
        sun,
        document.getElementById(
            "sun-label"
        )
    );


    updateObjectLabel(
        earth,
        document.getElementById(
            "earth-label"
        )
    );

}


function updateObjectLabel(
    object,
    element
) {

    if (!object || !element) return;


    const position =
        object.position.clone();


    position.project(
        camera
    );


    const x =
        (position.x * 0.5 + 0.5) *
        renderer.domElement.clientWidth;


    const y =
        (-position.y * 0.5 + 0.5) *
        renderer.domElement.clientHeight;


    if (
        position.z > 1 ||
        position.z < -1
    ) {

        element.style.display =
            "none";

        return;

    }


    element.style.display =
        "block";


    element.style.left =
        `${x}px`;

    element.style.top =
        `${y}px`;

}


// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

async function loadMissionData() {

    try {

        const craterResponse =
            await fetch(
                "/api/craters"
            );

        if (
            craterResponse.ok
        ) {

            craters =
                await craterResponse.json();

        }

    } catch (error) {

        console.error(
            "Could not load craters:",
            error
        );

    }


    try {

        const launchResponse =
            await fetch(
                "/api/launch-sites"
            );

        if (
            launchResponse.ok
        ) {

            launchSites =
                await launchResponse.json();

        }

    } catch (error) {

        console.error(
            "Could not load launch sites:",
            error
        );

    }


    createCraterMarkers();

    populateCraterSelect();

    populateLaunchSelect();

}


// ------------------------------------------------------------
// CRATER MARKERS
// ------------------------------------------------------------

function createCraterMarkers() {

    if (!moon || !craterGroup) return;


    craterGroup.clear();

    craterMarkers = [];


    craters.forEach(
        (crater, index) => {

            const marker =
                createCraterMarker(
                    crater,
                    index
                );

            craterGroup.add(
                marker
            );

            craterMarkers.push(
                marker
            );

        }
    );


    /*
     * Correct checkbox semantics:
     *
     * checked = markers visible
     * unchecked = markers hidden
     */

    updateCraterVisibility();

}


// ------------------------------------------------------------
// CREATE CRATER MARKER
// ------------------------------------------------------------

function createCraterMarker(
    crater,
    index
) {

    const group =
        new THREE.Group();


    /*
     * Convert lunar latitude/longitude
     * to a point on the Moon.
     */

    const latitude =
        Number(
            crater.lat || 0
        );

    const longitude =
        Number(
            crater.lon || 0
        );


    const lat =
        THREE.MathUtils.degToRad(
            latitude
        );

    const lon =
        THREE.MathUtils.degToRad(
            longitude
        );


    const r =
        MOON_RADIUS *
        1.015;


    const x =
        r *
        Math.cos(lat) *
        Math.cos(lon);


    const y =
        r *
        Math.sin(lat);


    const z =
        r *
        Math.cos(lat) *
        Math.sin(lon);


    group.position.set(
        x,
        y,
        z
    );


    /*
     * Marker sphere.
     */

    const geometry =
        new THREE.SphereGeometry(
            0.035,
            12,
            12
        );


    const material =
        new THREE.MeshBasicMaterial({
            color:
                isSouthPoleSite(crater)
                    ? 0xffb84d
                    : 0x75c7a5
        });


    const marker =
        new THREE.Mesh(
            geometry,
            material
        );


    marker.userData.crater =
        crater;


    marker.userData.index =
        index;


    group.add(
        marker
    );


    /*
     * Vertical indicator line.
     */

    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(
                    0,
                    0,
                    0
                ),

                new THREE.Vector3(
                    0,
                    0.10,
                    0
                )
            ]);


    const lineMaterial =
        new THREE.LineBasicMaterial({
            color:
                isSouthPoleSite(crater)
                    ? 0xffb84d
                    : 0x75c7a5
        });


    const line =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );


    group.add(
        line
    );


    /*
     * Make the whole group clickable.
     */

    group.userData.crater =
        crater;

    group.userData.index =
        index;


    return group;

}


function isSouthPoleSite(
    crater
) {

    const lat =
        Number(
            crater.lat || 0
        );

    return Math.abs(lat) >= 80;

}


// ------------------------------------------------------------
// CRATER SELECT
// ------------------------------------------------------------

function populateCraterSelect() {

    const select =
        document.getElementById(
            "crater-select"
        );

    if (!select) return;


    select.innerHTML =
        `<option value="">Select landing site</option>`;


    craters.forEach(
        crater => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                crater.name;

            option.textContent =
                crater.name;

            select.appendChild(
                option
            );

        }
    );

}


// ------------------------------------------------------------
// LAUNCH SELECT
// ------------------------------------------------------------

function populateLaunchSelect() {

    const select =
        document.getElementById(
            "launch-site-select"
        );

    if (!select) return;


    select.innerHTML =
        `<option value="">Select launch site</option>`;


    launchSites.forEach(
        site => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                site.name;

            option.textContent =
                site.name;

            select.appendChild(
                option
            );

        }
    );

}


// ------------------------------------------------------------
// CRATER VISIBILITY
// ------------------------------------------------------------

function updateCraterVisibility() {

    const checkbox =
        document.getElementById(
            "crater-filter"
        );


    /*
     * CHECKED = SHOW
     * UNCHECKED = HIDE
     */

    const visible =
        checkbox
            ? checkbox.checked
            : true;


    craterMarkers.forEach(
        marker => {

            marker.visible =
                visible;

        }
    );

}


// ------------------------------------------------------------
// CRATER CLICKING
// ------------------------------------------------------------

function handleCraterClick(
    crater
) {

    if (!crater) return;


    selectedCrater =
        crater;


    const select =
        document.getElementById(
            "crater-select"
        );


    if (select) {

        select.value =
            crater.name || "";

    }


    highlightSelectedCrater(
        crater
    );


    showCraterInformation(
        crater
    );


    analyzeCrater(
        crater
    );

}


// ------------------------------------------------------------
// HIGHLIGHT SELECTED CRATER
// ------------------------------------------------------------

function highlightSelectedCrater(
    crater
) {

    craterMarkers.forEach(
        group => {

            const marker =
                group.children[0];

            if (!marker) return;


            const markerCrater =
                group.userData.crater;


            if (
                markerCrater &&
                markerCrater.name ===
                crater.name
            ) {

                marker.scale.set(
                    2.2,
                    2.2,
                    2.2
                );

                marker.material.color.set(
                    0xffffff
                );

            } else {

                marker.scale.set(
                    1,
                    1,
                    1
                );

                marker.material.color.set(
                    isSouthPoleSite(
                        markerCrater || {}
                    )
                        ? 0xffb84d
                        : 0x75c7a5
                );

            }

        }
    );

}


// ------------------------------------------------------------
// CRATER INFORMATION
// ------------------------------------------------------------

function showCraterInformation(
    crater
) {

    const title =
        document.getElementById(
            "selected-site-name"
        );

    if (title) {

        title.textContent =
            crater.name ||
            "Selected Site";

    }


    const latitude =
        document.getElementById(
            "selected-site-lat"
        );

    if (latitude) {

        latitude.textContent =
            formatCoordinate(
                crater.lat,
                "°"
            );

    }


    const longitude =
        document.getElementById(
            "selected-site-lon"
        );

    if (longitude) {

        longitude.textContent =
            formatCoordinate(
                crater.lon,
                "°"
            );

    }

}


// ------------------------------------------------------------
// ANALYZE
// ------------------------------------------------------------

async function analyzeCrater(
    crater = selectedCrater
) {

    if (!crater) {

        setStatus(
            "SELECT A LANDING SITE"
        );

        return;

    }


    const dateInput =
        document.getElementById(
            "mission-date"
        );


    const date =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


    const hourInput =
        document.getElementById(
            "lunar-hour"
        );


    const hour =
        hourInput
            ? Number(
                hourInput.value || 12
            )
            : 12;


    setStatus(
        "ANALYZING..."
    );


    try {

        const url =
            `/api/conditions?latitude=${encodeURIComponent(
                crater.lat
            )}&longitude=${encodeURIComponent(
                crater.lon
            )}&date=${encodeURIComponent(
                date
            )}&hour=${encodeURIComponent(
                hour
            )}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Analysis request failed."
            );

        }


        const data =
            await response.json();


        updateTelemetry(
            data
        );


        setStatus(
            "ANALYSIS COMPLETE"
        );


    } catch (error) {

        console.error(
            error
        );

        setStatus(
            "ANALYSIS ERROR"
        );

    }

}


// ------------------------------------------------------------
// TELEMETRY
// ------------------------------------------------------------

function updateTelemetry(
    data
) {

    setText(
        [
            "sun-elevation",
            "sun-elevation-value"
        ],
        `${data.sun.elevation_degrees}°`
    );


    setText(
        [
            "power-potential",
            "power-potential-value"
        ],
        `${data.sun.power_potential_percent}%`
    );


    setText(
        [
            "earth-visibility",
            "earth-visibility-value"
        ],
        `${data.earth.visibility_percent}%`
    );


    setText(
        [
            "communication-status",
            "communication-value"
        ],
        data.communication.status
    );


    setText(
        [
            "analysis-warning"
        ],
        data.warning
    );


    updateProgress(
        "power-bar",
        data.sun.power_potential_percent
    );


    updateProgress(
        "earth-bar",
        data.earth.visibility_percent
    );

}


function setText(
    ids,
    value
) {

    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {

                element.textContent =
                    value;

            }

        }
    );

}


function updateProgress(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) return;


    element.style.width =
        `${Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        )}%`;

}


// ------------------------------------------------------------
// UI
// ------------------------------------------------------------

function setupUI() {

    const analyzeButton =
        document.getElementById(
            "analyze-button"
        );


    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            () => {

                if (!selectedCrater) {

                    const select =
                        document.getElementById(
                            "crater-select"
                        );


                    if (
                        select &&
                        select.value
                    ) {

                        const crater =
                            craters.find(
                                item =>
                                    item.name ===
                                    select.value
                            );


                        if (crater) {

                            handleCraterClick(
                                crater
                            );

                            return;

                        }

                    }


                    setStatus(
                        "SELECT A LANDING SITE"
                    );

                    return;

                }


                analyzeCrater();

            }
        );

    }


    const craterSelect =
        document.getElementById(
            "crater-select"
        );


    if (craterSelect) {

        craterSelect.addEventListener(
            "change",
            event => {

                const crater =
                    craters.find(
                        item =>
                            item.name ===
                            event.target.value
                    );


                if (crater) {

                    handleCraterClick(
                        crater
                    );

                }

            }
        );

    }


    const craterCheckbox =
        document.getElementById(
            "crater-filter"
        );


    if (craterCheckbox) {

        craterCheckbox.checked =
            true;


        craterCheckbox.addEventListener(
            "change",
            updateCraterVisibility
        );

    }


    const resetButton =
        document.getElementById(
            "reset-camera"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetCamera
        );

    }


    const globeButton =
        document.getElementById(
            "globe-view"
        );


    if (globeButton) {

        globeButton.addEventListener(
            "click",
            setGlobeView
        );

    }


    const polarButton =
        document.getElementById(
            "polar-view"
        );


    if (polarButton) {

        polarButton.addEventListener(
            "click",
            setPolarView
        );

    }


    const zoomIn =
        document.getElementById(
            "zoom-in"
        );


    if (zoomIn) {

        zoomIn.addEventListener(
            "click",
            () => {

                cameraDistance =
                    Math.max(
                        4,
                        cameraDistance -
                        1
                    );

                updateCamera();

            }
        );

    }


    const zoomOut =
        document.getElementById(
            "zoom-out"
        );


    if (zoomOut) {

        zoomOut.addEventListener(
            "click",
            () => {

                cameraDistance =
                    Math.min(
                        40,
                        cameraDistance +
                        1
                    );

                updateCamera();

            }
        );

    }

}


// ------------------------------------------------------------
// 3D INTERACTION
// ------------------------------------------------------------

function setupInteraction() {

    const container =
        document.getElementById(
            "three-container"
        );


    if (!container) return;


    container.addEventListener(
        "pointerdown",
        event => {

            isDragging =
                true;

            previousMouseX =
                event.clientX;

            previousMouseY =
                event.clientY;

        }
    );


    window.addEventListener(
        "pointerup",
        () => {

            isDragging =
                false;

        }
    );


    window.addEventListener(
        "pointermove",
        event => {

            if (!isDragging) return;


            const deltaX =
                event.clientX -
                previousMouseX;


            const deltaY =
                event.clientY -
                previousMouseY;


            previousMouseX =
                event.clientX;


            previousMouseY =
                event.clientY;


            cameraYaw -=
                deltaX *
                0.008;


            cameraPitch +=
                deltaY *
                0.008;


            cameraPitch =
                Math.max(
                    -1.35,
                    Math.min(
                        1.35,
                        cameraPitch
                    )
                );


            updateCamera();

        }
    );


    container.addEventListener(
        "wheel",
        event => {

            event.preventDefault();


            cameraDistance +=
                event.deltaY *
                0.008;


            cameraDistance =
                Math.max(
                    3.5,
                    Math.min(
                        35,
                        cameraDistance
                    )
                );


            updateCamera();

        },
        {
            passive: false
        }
    );


    container.addEventListener(
        "click",
        event => {

            /*
             * Ignore clicks after dragging.
             */

            const rect =
                renderer
                    .domElement
                    .getBoundingClientRect();


            mouse.x =
                (
                    (event.clientX -
                        rect.left) /
                    rect.width
                ) *
                2 -
                1;


            mouse.y =
                -(
                    (event.clientY -
                        rect.top) /
                    rect.height
                ) *
                2 +
                1;


            raycaster.setFromCamera(
                mouse,
                camera
            );


            const intersections =
                raycaster.intersectObjects(
                    craterMarkers,
                    true
                );


            if (
                intersections.length ===
                0
            ) return;


            let object =
                intersections[0]
                    .object;


            while (
                object &&
                !object.userData.crater
            ) {

                object =
                    object.parent;

            }


            if (
                object &&
                object.userData.crater
            ) {

                handleCraterClick(
                    object.userData.crater
                );

            }

        }
    );

}


// ------------------------------------------------------------
// CAMERA MODES
// ------------------------------------------------------------

function setGlobeView() {

    currentView =
        "globe";


    cameraTarget.copy(
        EARTH_POSITION
    );


    cameraDistance =
        12;


    cameraYaw =
        0.65;


    cameraPitch =
        0.28;


    updateCamera();

}


function setPolarView() {

    currentView =
        "polar";


    if (moon) {

        cameraTarget.copy(
            moon.position
        );

    }


    cameraDistance =
        3.0;


    cameraYaw =
        0.4;


    cameraPitch =
        0.25;


    updateCamera();

}


function resetCamera() {

    setGlobeView();

}


// ------------------------------------------------------------
// STATUS
// ------------------------------------------------------------

function setStatus(
    message
) {

    const elements =
        document.querySelectorAll(
            ".status-text"
        );


    elements.forEach(
        element => {

            element.textContent =
                message;

        }
    );


    const status =
        document.getElementById(
            "system-status"
        );


    if (status) {

        status.textContent =
            message;

    }

}


// ------------------------------------------------------------
// COORDINATES
// ------------------------------------------------------------

function formatCoordinate(
    value,
    suffix = ""
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "--";

    }


    const direction =
        suffix === "°"
            ? ""
            : "";


    return `${number.toFixed(2)}${suffix}${direction}`;

}


// ------------------------------------------------------------
// MOUSE / CURSOR TELEMETRY
// ------------------------------------------------------------

function updateCursorCoordinates() {

    const coordinateElement =
        document.getElementById(
            "cursor-coordinates"
        );


    if (!coordinateElement) return;


    if (!moon) {

        coordinateElement.textContent =
            "LAT -- / LON --";

        return;

    }


    const worldPosition =
        new THREE.Vector3();


    moon.getWorldPosition(
        worldPosition
    );


    /*
     * Convert Moon position
     * back into lunar coordinates.
     */

    const relative =
        worldPosition
            .clone()
            .sub(
                EARTH_POSITION
            );


    /*
     * This is a visual telemetry
     * readout rather than a real
     * spacecraft navigation solution.
     */

    coordinateElement.textContent =
        `MOON ORBIT ${(
            moonOrbitAngle *
            180 /
            Math.PI
        ).toFixed(1)}°`;

}


// ------------------------------------------------------------
// ANIMATION
// ------------------------------------------------------------

function animate() {

    if (!animationStarted) return;


    requestAnimationFrame(
        animate
    );


    /*
     * --------------------------------------------------------
     * MOON ACTUALLY MOVES AROUND EARTH
     * --------------------------------------------------------
     */

    moonOrbitAngle +=
        0.0015;


    if (
        moonOrbitAngle >
        Math.PI * 2
    ) {

        moonOrbitAngle -=
            Math.PI * 2;

    }


    updateMoonOrbitPosition();


    /*
     * Slow rotation.
     */

    if (moon) {

        moon.rotation.y +=
            0.00025;

    }


    if (earth) {

        earth.rotation.y +=
            0.00012;

    }


    if (sun) {

        sun.rotation.y +=
            0.00015;

    }


    /*
     * Polar camera follows Moon.
     */

    if (
        currentView ===
        "polar" &&
        moon
    ) {

        cameraTarget.lerp(
            moon.position,
            0.08
        );

        updateCamera();

    }


    updateSpaceLabels();

    updateCursorCoordinates();


    if (renderer) {

        renderer.render(
            scene,
            camera
        );

    }

}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function getCraterByName(
    name
) {

    return craters.find(
        crater =>
            crater.name ===
            name
    );

}


// ------------------------------------------------------------
// KEYBOARD CONTROLS
// ------------------------------------------------------------

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            selectedCrater =
                null;

            setStatus(
                "READY"
            );

        }


        if (
            event.key ===
            "r" ||
            event.key ===
            "R"
        ) {

            resetCamera();

        }


        if (
            event.key ===
            "+" ||
            event.key ===
            "="
        ) {

            cameraDistance =
                Math.max(
                    3.5,
                    cameraDistance -
                    0.5
                );

            updateCamera();

        }


        if (
            event.key ===
            "-" ||
            event.key ===
            "_"
        ) {

            cameraDistance =
                Math.min(
                    35,
                    cameraDistance +
                    0.5
                );

            updateCamera();

        }

    }
);
