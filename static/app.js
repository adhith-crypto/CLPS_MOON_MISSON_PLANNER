// ============================================================
// LUNAR SOUTH POLE MISSION PLANNER
// ============================================================

let scene;
let camera;
let renderer;

let earth;
let moon;
let sun;
let sunLight;

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
const MOON_ORBIT_RADIUS = 2.15;

const EARTH_POSITION =
    new THREE.Vector3(-7.5, 3.5, -4.5);

const SUN_POSITION =
    new THREE.Vector3(12, 5, 8);

let cameraTarget =
    EARTH_POSITION.clone();

let cameraDistance = 12;
let cameraYaw = 0.65;
let cameraPitch = 0.25;

let dragging = false;
let lastX = 0;
let lastY = 0;


// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", start);

async function start() {

    const container =
        document.getElementById("three-container");

    if (!container) {
        console.error("three-container missing");
        return;
    }

    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x020406);


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    camera =
        new THREE.PerspectiveCamera(
            55,
            container.clientWidth /
                container.clientHeight,
            0.01,
            500
        );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

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

    renderer.toneMappingExposure = 0.7;

    container.appendChild(
        renderer.domElement
    );


    // --------------------------------------------------------
    // RAYCASTING
    // --------------------------------------------------------

    raycaster =
        new THREE.Raycaster();

    mouse =
        new THREE.Vector2();


    // --------------------------------------------------------
    // LIGHTING
    // --------------------------------------------------------

    /*
     * This is deliberately LOW.
     *
     * The Sun object remains visually bright.
     * This light controls illumination on Earth/Moon.
     */

    const ambient =
        new THREE.AmbientLight(
            0x59636b,
            0.12
        );

    scene.add(ambient);


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


    // --------------------------------------------------------
    // OBJECTS
    // --------------------------------------------------------

    createSun();

    createEarth();

    createMoon();

    createMoonOrbit();


    // --------------------------------------------------------
    // CONTROLS
    // --------------------------------------------------------

    setupMouseControls();

    setupButtons();

    setupResize();


    // --------------------------------------------------------
    // DATA
    // --------------------------------------------------------

    await loadData();


    // --------------------------------------------------------
    // INITIAL CAMERA
    // --------------------------------------------------------

    updateCamera();


    // --------------------------------------------------------
    // START
    // --------------------------------------------------------

    animate();
}


// ============================================================
// SUN
// ============================================================

function createSun() {

    const geometry =
        new THREE.SphereGeometry(
            1.15,
            48,
            48
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xd4a05b
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


    // Small visual glow only.
    // It does NOT illuminate planets.

    const glowGeometry =
        new THREE.SphereGeometry(
            1.30,
            32,
            32
        );

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xc58d4e,
            transparent: true,
            opacity: 0.025,
            depthWrite: false
        });

    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    sun.add(glow);

}


// ============================================================
// EARTH
// ============================================================

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS,
            64,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x315665,
            roughness: 0.95,
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


    // Subtle cloud layer

    const cloudGeometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS * 1.008,
            48,
            48
        );

    const cloudMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x9aa5a6,
            transparent: true,
            opacity: 0.06,
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

}


// ============================================================
// MOON
// ============================================================

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(
            MOON_RADIUS,
            64,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x5d5d5d,
            roughness: 1,
            metalness: 0
        });

    moon =
        new THREE.Mesh(
            geometry,
            material
        );

    scene.add(
        moon
    );


    craterGroup =
        new THREE.Group();

    moon.add(
        craterGroup
    );


    updateMoonPosition();

}


// ============================================================
// MOON ORBIT
// ============================================================

function createMoonOrbit() {

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

        points.push(
            new THREE.Vector3(
                Math.cos(angle) *
                    MOON_ORBIT_RADIUS,

                Math.sin(angle) *
                    0.22,

                Math.sin(angle) *
                    MOON_ORBIT_RADIUS
            )
        );

    }


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);


    const material =
        new THREE.LineBasicMaterial({
            color: 0x687862,
            transparent: true,
            opacity: 0.38
        });


    const orbit =
        new THREE.LineLoop(
            geometry,
            material
        );


    orbit.position.copy(
        EARTH_POSITION
    );


    scene.add(
        orbit
    );

}


// ============================================================
// MOON MOVEMENT
// ============================================================

function updateMoonPosition() {

    if (!moon) return;


    moon.position.set(

        EARTH_POSITION.x +
            Math.cos(moonAngle) *
                MOON_ORBIT_RADIUS,

        EARTH_POSITION.y +
            Math.sin(moonAngle) *
                0.22,

        EARTH_POSITION.z +
            Math.sin(moonAngle) *
                MOON_ORBIT_RADIUS

    );

}


// ============================================================
// DATA
// ============================================================

async function loadData() {

    try {

        const response =
            await fetch(
                "/api/craters"
            );

        if (response.ok) {

            craters =
                await response.json();

        }

    } catch (error) {

        console.error(
            "Craters failed:",
            error
        );

    }


    try {

        const response =
            await fetch(
                "/api/launch-sites"
            );

        if (response.ok) {

            launchSites =
                await response.json();

        }

    } catch (error) {

        console.error(
            "Launch sites failed:",
            error
        );

    }


    createCraterMarkers();

    populateCraterSelect();

    populateLaunchSelect();

}


// ============================================================
// CRATER MARKERS
// ============================================================

function createCraterMarkers() {

    if (!craterGroup) return;

    craterGroup.clear();

    craterMarkers = [];


    craters.forEach(
        (crater, index) => {

            const group =
                new THREE.Group();


            const lat =
                THREE.MathUtils.degToRad(
                    Number(crater.lat || 0)
                );

            const lon =
                THREE.MathUtils.degToRad(
                    Number(crater.lon || 0)
                );


            const radius =
                MOON_RADIUS * 1.015;


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


            group.position.set(
                x,
                y,
                z
            );


            const markerGeometry =
                new THREE.SphereGeometry(
                    0.035,
                    12,
                    12
                );


            const southPole =
                Math.abs(
                    Number(crater.lat || 0)
                ) >= 80;


            const markerMaterial =
                new THREE.MeshBasicMaterial({
                    color:
                        southPole
                            ? 0xffb84d
                            : 0x72c5a3
                });


            const marker =
                new THREE.Mesh(
                    markerGeometry,
                    markerMaterial
                );


            marker.userData.crater =
                crater;


            marker.userData.index =
                index;


            group.add(
                marker
            );


            group.userData.crater =
                crater;


            group.userData.index =
                index;


            craterGroup.add(
                group
            );


            craterMarkers.push(
                group
            );

        }
    );


    updateCraterVisibility();

}


// ============================================================
// CRATER SELECT
// ============================================================

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


// ============================================================
// LAUNCH SELECT
// ============================================================

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


// ============================================================
// CRATER FILTER
// ============================================================

function updateCraterVisibility() {

    const checkbox =
        document.getElementById(
            "crater-filter"
        );


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


// ============================================================
// CRATER SELECTION
// ============================================================

function selectCrater(
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


    highlightCrater(
        crater
    );


    showCrater(
        crater
    );


    analyzeCrater(
        crater
    );

}


// ============================================================
// HIGHLIGHT
// ============================================================

function highlightCrater(
    crater
) {

    craterMarkers.forEach(
        group => {

            const marker =
                group.children[0];

            if (!marker) return;


            const data =
                group.userData.crater;


            if (
                data &&
                data.name ===
                    crater.name
            ) {

                marker.scale.set(
                    2.4,
                    2.4,
                    2.4
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


                const southPole =
                    Math.abs(
                        Number(
                            data?.lat || 0
                        )
                    ) >= 80;


                marker.material.color.set(
                    southPole
                        ? 0xffb84d
                        : 0x72c5a3
                );

            }

        }
    );

}


// ============================================================
// SHOW CRATER
// ============================================================

function showCrater(
    crater
) {

    setText(
        "selected-site-name",
        crater.name ||
            "SELECTED SITE"
    );


    setText(
        "selected-site-lat",
        `${Number(
            crater.lat || 0
        ).toFixed(2)}°`
    );


    setText(
        "selected-site-lon",
        `${Number(
            crater.lon || 0
        ).toFixed(2)}°`
    );

}


// ============================================================
// ANALYZE
// ============================================================

async function analyzeCrater(
    crater
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
        dateInput?.value ||
        new Date()
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
        Number(
            hourInput?.value ||
            12
        );


    setStatus(
        "ANALYZING..."
    );


    try {

        const url =
            `/api/conditions` +
            `?latitude=${encodeURIComponent(
                crater.lat
            )}` +
            `&longitude=${encodeURIComponent(
                crater.lon
            )}` +
            `&date=${encodeURIComponent(
                date
            )}` +
            `&hour=${encodeURIComponent(
                hour
            )}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Analysis request failed"
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


// ============================================================
// TELEMETRY
// ============================================================

function updateTelemetry(
    data
) {

    setText(
        "sun-elevation",
        `${data.sun.elevation_degrees}°`
    );

    setText(
        "sun-elevation-value",
        `${data.sun.elevation_degrees}°`
    );


    setText(
        "power-potential",
        `${data.sun.power_potential_percent}%`
    );

    setText(
        "power-potential-value",
        `${data.sun.power_potential_percent}%`
    );


    setText(
        "earth-visibility",
        `${data.earth.visibility_percent}%`
    );

    setText(
        "earth-visibility-value",
        `${data.earth.visibility_percent}%`
    );


    setText(
        "communication-status",
        data.communication.status
    );

    setText(
        "communication-value",
        data.communication.status
    );


    setText(
        "analysis-warning",
        data.warning
    );


    updateBar(
        "power-bar",
        data.sun.power_potential_percent
    );


    updateBar(
        "earth-bar",
        data.earth.visibility_percent
    );

}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function updateBar(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;


    const amount =
        Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        );


    element.style.width =
        `${amount}%`;

}


function setStatus(
    message
) {

    document
        .querySelectorAll(
            ".status-text"
        )
        .forEach(
            element => {

                element.textContent =
                    message;

            }
        );


    setText(
        "system-status",
        message
    );

}


// ============================================================
// UI BUTTONS
// ============================================================

function setupButtons() {

    const analyze =
        document.getElementById(
            "analyze-button"
        );


    analyze?.addEventListener(
        "click",
        () => {

            if (selectedCrater) {

                analyzeCrater(
                    selectedCrater
                );

                return;

            }


            const select =
                document.getElementById(
                    "crater-select"
                );


            const crater =
                craters.find(
                    item =>
                        item.name ===
                        select?.value
                );


            if (crater) {

                selectCrater(
                    crater
                );

            } else {

                setStatus(
                    "SELECT A LANDING SITE"
                );

            }

        }
    );


    const craterSelect =
        document.getElementById(
            "crater-select"
        );


    craterSelect?.addEventListener(
        "change",
        event => {

            const crater =
                craters.find(
                    item =>
                        item.name ===
                        event.target.value
                );


            if (crater) {

                selectCrater(
                    crater
                );

            }

        }
    );


    const filter =
        document.getElementById(
            "crater-filter"
        );


    if (filter) {

        filter.checked = true;

        filter.addEventListener(
            "change",
            updateCraterVisibility
        );

    }


    document
        .getElementById(
            "reset-camera"
        )
        ?.addEventListener(
            "click",
            resetCamera
        );


    document
        .getElementById(
            "globe-view"
        )
        ?.addEventListener(
            "click",
            globeView
        );


    document
        .getElementById(
            "polar-view"
        )
        ?.addEventListener(
            "click",
            polarView
        );


    document
        .getElementById(
            "zoom-in"
        )
        ?.addEventListener(
            "click",
            () => {

                cameraDistance =
                    Math.max(
                        3,
                        cameraDistance -
                            1
                    );

                updateCamera();

            }
        );


    document
        .getElementById(
            "zoom-out"
        )
        ?.addEventListener(
            "click",
            () => {

                cameraDistance =
                    Math.min(
                        35,
                        cameraDistance +
                            1
                    );

                updateCamera();

            }
        );

}


// ============================================================
// MOUSE CONTROLS
// ============================================================

function setupMouseControls() {

    const container =
        document.getElementById(
            "three-container"
        );


    if (!container) return;


    container.addEventListener(
        "pointerdown",
        event => {

            dragging = true;

            lastX =
                event.clientX;

            lastY =
                event.clientY;

        }
    );


    window.addEventListener(
        "pointerup",
        () => {

            dragging = false;

        }
    );


    window.addEventListener(
        "pointermove",
        event => {

            if (!dragging) return;


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


            cameraPitch +=
                dy * 0.008;


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
                    3,
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

            const rect =
                renderer
                    .domElement
                    .getBoundingClientRect();


            mouse.x =
                (
                    (event.clientX -
                        rect.left) /
                    rect.width
                ) * 2 - 1;


            mouse.y =
                -(
                    (event.clientY -
                        rect.top) /
                    rect.height
                ) * 2 + 1;


            raycaster.setFromCamera(
                mouse,
                camera
            );


            const hits =
                raycaster.intersectObjects(
                    craterMarkers,
                    true
                );


            if (!hits.length) return;


            let object =
                hits[0].object;


            while (
                object &&
                !object.userData.crater
            ) {

                object =
                    object.parent;

            }


            if (
                object?.userData?.crater
            ) {

                selectCrater(
                    object.userData.crater
                );

            }

        }
    );

}


// ============================================================
// CAMERA
// ============================================================

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


function resetCamera() {

    cameraTarget.copy(
        EARTH_POSITION
    );

    cameraDistance = 12;

    cameraYaw = 0.65;

    cameraPitch = 0.25;

    updateCamera();

}


function globeView() {

    cameraTarget.copy(
        EARTH_POSITION
    );

    cameraDistance = 12;

    cameraYaw = 0.65;

    cameraPitch = 0.25;

    updateCamera();

}


function polarView() {

    if (moon) {

        cameraTarget.copy(
            moon.position
        );

    }

    cameraDistance = 2.8;

    cameraYaw = 0.4;

    cameraPitch = 0.25;

    updateCamera();

}


// ============================================================
// RESIZE
// ============================================================

function setupResize() {

    window.addEventListener(
        "resize",
        () => {

            const container =
                document.getElementById(
                    "three-container"
                );

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


// ============================================================
// ANIMATION
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // Moon actually travels around Earth.

    moonAngle +=
        0.0015;


    if (
        moonAngle >
        Math.PI * 2
    ) {

        moonAngle -=
            Math.PI * 2;

    }


    updateMoonPosition();


    // Slow rotations.

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


    // Polar camera follows Moon.

    if (moon &&
        cameraTarget &&
        cameraDistance < 5) {

        cameraTarget.lerp(
            moon.position,
            0.08
        );

        updateCamera();

    }


    updateLabels();


    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// LABELS
// ============================================================

function updateLabels() {

    if (!renderer || !camera) return;


    updateLabel(
        sun,
        document.getElementById(
            "sun-label"
        )
    );


    updateLabel(
        earth,
        document.getElementById(
            "earth-label"
        )
    );

}


function updateLabel(
    object,
    element
) {

    if (!object || !element) return;


    const position =
        object.position
            .clone()
            .project(camera);


    const width =
        renderer.domElement
            .clientWidth;


    const height =
        renderer.domElement
            .clientHeight;


    const x =
        (position.x * 0.5 + 0.5) *
        width;


    const y =
        (-position.y * 0.5 + 0.5) *
        height;


    if (
        position.z < -1 ||
        position.z > 1
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


// ============================================================
// KEYBOARD
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "r" ||
            event.key === "R"
        ) {

            resetCamera();

        }


        if (
            event.key === "+" ||
            event.key === "="
        ) {

            cameraDistance =
                Math.max(
                    3,
                    cameraDistance - 0.5
                );

            updateCamera();

        }


        if (
            event.key === "-" ||
            event.key === "_"
        ) {

            cameraDistance =
                Math.min(
                    35,
                    cameraDistance + 0.5
                );

            updateCamera();

        }

    }
);
