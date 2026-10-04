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

let cameraTarget = EARTH_POSITION.clone();

let cameraDistance = 12;
let cameraYaw = 0.65;
let cameraPitch = 0.25;

let dragging = false;
let lastX = 0;
let lastY = 0;


/* =========================================
   DOM HELPERS
========================================= */

function $(id) {
    return document.getElementById(id);
}

const loadingOverlay = $("loading-overlay");
const loadingProgress = $("loadingProgress");
const loadingText = $("loadingText");


function updateLoading(percent, message) {

    const safePercent = Math.max(
        0,
        Math.min(100, percent)
    );

    if (loadingProgress) {
        loadingProgress.style.width = `${safePercent}%`;
    }

    if (loadingText) {
        loadingText.textContent = message;
    }
}


function finishLoading() {

    updateLoading(
        100,
        "Mission environment ready."
    );

    if (!loadingOverlay) {
        return;
    }

    setTimeout(() => {

        loadingOverlay.style.opacity = "0";

        setTimeout(() => {

            loadingOverlay.style.display = "none";

        }, 500);

    }, 400);
}


function showLoadingError(message) {

    if (loadingText) {
        loadingText.textContent =
            "ERROR: " + message;
    }

    if (loadingProgress) {
        loadingProgress.style.width = "100%";
    }

    console.error(
        "LUNAR MISSION PLANNER ERROR:",
        message
    );
}


/* =========================================
   START APPLICATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    start
);


async function start() {

    try {

        updateLoading(
            5,
            "Starting mission systems..."
        );

        if (
            typeof THREE === "undefined"
        ) {
            throw new Error(
                "Three.js failed to load."
            );
        }

        const container =
            $("three-container");

        if (!container) {
            throw new Error(
                "3D viewport not found."
            );
        }


        updateLoading(
            15,
            "Initializing 3D environment..."
        );


        /* ================================
           SCENE
        ================================= */

        scene = new THREE.Scene();

        scene.background =
            new THREE.Color(0x020406);


        /* ================================
           CAMERA
        ================================= */

        const width =
            container.clientWidth || 800;

        const height =
            container.clientHeight || 600;

        camera =
            new THREE.PerspectiveCamera(
                55,
                width / height,
                0.01,
                500
            );


        /* ================================
           RENDERER
        ================================= */

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
            width,
            height
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


        updateLoading(
            25,
            "Creating solar lighting..."
        );


        /* ================================
           RAYCASTER
        ================================= */

        raycaster =
            new THREE.Raycaster();

        mouse =
            new THREE.Vector2();


        /* ================================
           AMBIENT LIGHT
        ================================= */

        const ambient =
            new THREE.AmbientLight(
                0x59636b,
                0.12
            );

        scene.add(ambient);


        /* ================================
           SUN LIGHT
        ================================= */

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

        scene.add(sunLight);


        /* ================================
           CREATE SPACE OBJECTS
        ================================= */

        updateLoading(
            35,
            "Creating Sun..."
        );

        createSun();


        updateLoading(
            45,
            "Creating Earth..."
        );

        createEarth();


        updateLoading(
            55,
            "Creating Moon..."
        );

        createMoon();


        updateLoading(
            62,
            "Creating lunar orbit..."
        );

        createMoonOrbit();


        /* ================================
           CONTROLS
        ================================= */

        setupMouseControls();

        setupButtons();

        setupResize();


        updateLoading(
            70,
            "Loading lunar mission data..."
        );


        /* ================================
           DATA
        ================================= */

        await loadData();


        updateLoading(
            92,
            "Preparing mission telemetry..."
        );


        updateCamera();


        updateLoading(
            100,
            "Mission environment ready."
        );


        /* ================================
           INITIAL SITE
        ================================= */

        if (
            craters.length > 0
        ) {

            selectCrater(
                craters[0]
            );

        }


        finishLoading();


        /* ================================
           ANIMATION
        ================================= */

        animate();

    }
    catch (error) {

        console.error(
            "STARTUP ERROR:",
            error
        );

        showLoadingError(
            error.message ||
            "Unknown startup error."
        );

    }

}


/* =========================================
   CREATE SUN
========================================= */

function createSun() {

    const geometry =
        new THREE.SphereGeometry(
            0.55,
            32,
            32
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffd66b
        });

    sun =
        new THREE.Mesh(
            geometry,
            material
        );

    sun.position.copy(
        SUN_POSITION
    );

    scene.add(sun);


    const glowGeometry =
        new THREE.SphereGeometry(
            0.72,
            32,
            32
        );

    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffc857,
            transparent: true,
            opacity: 0.12
        });

    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );

    sun.add(glow);

}


/* =========================================
   CREATE EARTH
========================================= */

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS,
            48,
            48
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x356fa3,
            roughness: 0.8,
            metalness: 0.05
        });

    earth =
        new THREE.Mesh(
            geometry,
            material
        );

    earth.position.copy(
        EARTH_POSITION
    );

    scene.add(earth);


    /* Atmosphere */

    const atmosphereGeometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS * 1.06,
            48,
            48
        );

    const atmosphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x4aa3ff,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide
        });

    const atmosphere =
        new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
        );

    earth.add(atmosphere);

}


/* =========================================
   CREATE MOON
========================================= */

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(
            MOON_RADIUS,
            48,
            48
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 1,
            metalness: 0
        });

    moon =
        new THREE.Mesh(
            geometry,
            material
        );

    moon.position.copy(
        EARTH_POSITION
    );

    moon.position.x +=
        MOON_ORBIT_RADIUS;

    scene.add(moon);


    craterGroup =
        new THREE.Group();

    moon.add(
        craterGroup
    );

}


/* =========================================
   MOON ORBIT
========================================= */

function createMoonOrbit() {

    const points = [];

    const segments = 128;

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
            .setFromPoints(points);

    const material =
        new THREE.LineBasicMaterial({
            color: 0x3d4b57,
            transparent: true,
            opacity: 0.45
        });

    const orbit =
        new THREE.Line(
            geometry,
            material
        );

    scene.add(orbit);

}


/* =========================================
   UPDATE MOON POSITION
========================================= */

function updateMoonPosition() {

    moonAngle += 0.0015;

    moon.position.set(

        EARTH_POSITION.x +
        Math.cos(moonAngle) *
        MOON_ORBIT_RADIUS,

        EARTH_POSITION.y,

        EARTH_POSITION.z +
        Math.sin(moonAngle) *
        MOON_ORBIT_RADIUS

    );

}


/* =========================================
   LOAD DATA
========================================= */

async function loadData() {

    try {

        const [
            craterResponse,
            launchResponse
        ] = await Promise.all([

            fetch(
                "/api/craters"
            ),

            fetch(
                "/api/launch-sites"
            )

        ]);


        if (!craterResponse.ok) {

            throw new Error(
                "Could not load crater data."
            );

        }


        if (!launchResponse.ok) {

            throw new Error(
                "Could not load launch-site data."
            );

        }


        craters =
            await craterResponse.json();

        launchSites =
            await launchResponse.json();


        createCraterMarkers();

        populateCraterSelect();

        populateLaunchSelect();

    }
    catch (error) {

        console.error(
            "DATA LOAD ERROR:",
            error
        );

        throw error;

    }

}


/* =========================================
   CREATE CRATER MARKERS
========================================= */

function createCraterMarkers() {

    if (!craterGroup) {
        return;
    }


    craterMarkers.forEach(
        marker => {

            if (
                marker.parent
            ) {

                marker.parent.remove(
                    marker
                );

            }

        }
    );


    craterMarkers = [];


    craters.forEach(
        crater => {

            const marker =
                createCraterMarker(
                    crater
                );

            craterMarkers.push(
                marker
            );

            craterGroup.add(
                marker
            );

        }
    );

}


/* =========================================
   CRATER MARKER
========================================= */

function createCraterMarker(
    crater
) {

    const geometry =
        new THREE.SphereGeometry(
            0.025,
            12,
            12
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0x6bdcff
        });

    const marker =
        new THREE.Mesh(
            geometry,
            material
        );


    const lat =
        Number(
            crater.lat
        );

    const lon =
        Number(
            crater.lon
        );


    if (
        Number.isFinite(lat) &&
        Number.isFinite(lon)
    ) {

        const latRad =
            THREE.MathUtils.degToRad(
                lat
            );

        const lonRad =
            THREE.MathUtils.degToRad(
                lon
            );


        const r =
            MOON_RADIUS +
            0.012;


        marker.position.set(

            r *
            Math.cos(latRad) *
            Math.cos(lonRad),

            r *
            Math.sin(latRad),

            r *
            Math.cos(latRad) *
            Math.sin(lonRad)

        );

    }


    marker.userData =
        crater;


    return marker;

}


/* =========================================
   POPULATE CRATER SELECT
========================================= */

function populateCraterSelect() {

    const select =
        $("crater-select");

    if (!select) {
        return;
    }


    select.innerHTML =
        "";


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


    if (
        craters.length > 0
    ) {

        select.value =
            craters[0].name;

    }

}


/* =========================================
   POPULATE LAUNCH SELECT
========================================= */

function populateLaunchSelect() {

    const select =
        $("launch-site-select");

    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    launchSites.forEach(
        site => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                site.name;

            option.textContent =
                `${site.name} — ${site.country}`;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================
   SELECT CRATER
========================================= */

function selectCrater(
    crater
) {

    if (!crater) {
        return;
    }


    selectedCrater =
        crater;


    const name =
        $("selected-site-name");

    const lat =
        $("selected-site-lat");

    const lon =
        $("selected-site-lon");


    if (name) {
        name.textContent =
            crater.name || "--";
    }


    if (lat) {
        lat.textContent =
            `${Number(
                crater.lat
            ).toFixed(3)}°`;
    }


    if (lon) {
        lon.textContent =
            `${Number(
                crater.lon
            ).toFixed(3)}°`;
    }


    const select =
        $("crater-select");

    if (select) {

        select.value =
            crater.name;

    }


    updateCoordinates(
        crater.lat,
        crater.lon
    );

}


/* =========================================
   UPDATE COORDINATES
========================================= */

function updateCoordinates(
    lat,
    lon
) {

    const display =
        $("cursorCoords");

    if (!display) {
        return;
    }


    if (
        lat === undefined ||
        lon === undefined
    ) {

        display.textContent =
            "LAT -- / LON --";

        return;

    }


    display.textContent =
        `LAT ${Number(lat).toFixed(2)}° / LON ${Number(lon).toFixed(2)}°`;

}


/* =========================================
   ANALYZE SITE
========================================= */

async function analyzeSite() {

    if (!selectedCrater) {

        const select =
            $("crater-select");

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
                selectCrater(crater);
            }

        }

    }


    if (!selectedCrater) {

        setAssessment(
            "Select a lunar landing site first."
        );

        return;

    }


    const dateInput =
        $("mission-date");

    const hourInput =
        $("lunar-hour");


    const date =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : new Date()
                .toISOString()
                .slice(0, 10);


    const hour =
        hourInput
            ? Number(hourInput.value)
            : 12;


    try {

        const url =
            `/api/conditions?latitude=${encodeURIComponent(
                selectedCrater.lat
            )}&longitude=${encodeURIComponent(
                selectedCrater.lon
            )}&date=${encodeURIComponent(
                date
            )}&hour=${encodeURIComponent(
                hour
            )}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Mission analysis failed."
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


    }
    catch (error) {

        console.error(
            "ANALYSIS ERROR:",
            error
        );

        setAssessment(
            "Unable to calculate mission conditions."
        );

    }

}


/* =========================================
   UPDATE TELEMETRY
========================================= */

function updateTelemetry(
    data
) {

    const sunElevation =
        $("sunElevation");

    const powerPotential =
        $("powerPotential");

    const earthVisibility =
        $("earthVisibility");

    const communicationStatus =
        $("communicationStatus");

    const powerBar =
        $("powerBar");

    const earthBar =
        $("earthBar");


    const elevation =
        data.sun &&
        data.sun.elevation_degrees !== undefined
            ? data.sun.elevation_degrees
            : 0;


    const power =
        data.sun &&
        data.sun.power_potential_percent !== undefined
            ? data.sun.power_potential_percent
            : 0;


    const earth =
        data.earth &&
        data.earth.visibility_percent !== undefined
            ? data.earth.visibility_percent
            : 0;


    const communication =
        data.communication &&
        data.communication.status
            ? data.communication.status
            : "--";


    if (sunElevation) {

        sunElevation.textContent =
            `${Number(elevation).toFixed(1)}°`;

    }


    if (powerPotential) {

        powerPotential.textContent =
            `${Number(power).toFixed(0)}%`;

    }


    if (earthVisibility) {

        earthVisibility.textContent =
            `${Number(earth).toFixed(0)}%`;

    }


    if (communicationStatus) {

        communicationStatus.textContent =
            communication;

    }


    if (powerBar) {

        powerBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    power
                )
            )}%`;

    }


    if (earthBar) {

        earthBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    earth
                )
            )}%`;

    }


    const warning =
        $("analysis-warning");

    if (warning) {

        warning.textContent =
            data.warning || "";

    }

}


/* =========================================
   ASSESSMENT
========================================= */

function updateAssessment(
    data
) {

    const power =
        data.sun
            ? data.sun.power_potential_percent
            : 0;

    const communication =
        data.communication
            ? data.communication.status
            : "Unknown";


    let message;


    if (
        power >= 80 &&
        (
            communication ===
            "Excellent" ||
            communication ===
            "Good"
        )
    ) {

        message =
            "Strong candidate. Solar conditions and Earth communication are favorable.";

    }
    else if (
        power >= 50
    ) {

        message =
            "Moderate candidate. Solar conditions should be evaluated alongside communication constraints.";

    }
    else {

        message =
            "Challenging candidate. Low solar availability may create significant power constraints.";

    }


    setAssessment(
        message
    );

}


function setAssessment(
    message
) {

    const assessment =
        $("assessment");

    if (assessment) {

        assessment.textContent =
            message;

    }

}


/* =========================================
   BUTTONS
========================================= */

function setupButtons() {

    const craterSelect =
        $("crater-select");

    const analyzeButton =
        $("analyze-button");

    const resetButton =
        $("reset-camera");

    const zoomIn =
        $("zoom-in");

    const zoomOut =
        $("zoom-out");

    const polarView =
        $("polar-view");

    const globeView =
        $("globe-view");

    const lunarHour =
        $("lunar-hour");

    const craterFilter =
        $("crater-filter");


    if (craterSelect) {

        craterSelect.addEventListener(
            "change",
            () => {

                const crater =
                    craters.find(
                        item =>
                            item.name ===
                            craterSelect.value
                    );

                if (crater) {

                    selectCrater(
                        crater
                    );

                    analyzeSite();

                }

            }
        );

    }


    if (analyzeButton) {

        analyzeButton.addEventListener(
            "click",
            analyzeSite
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetCamera
        );

    }


    if (zoomIn) {

        zoomIn.addEventListener(
            "click",
            () => {

                cameraDistance =
                    Math.max(
                        3,
                        cameraDistance - 1
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
                    Math.min(
                        30,
                        cameraDistance + 1
                    );

                updateCamera();

            }
        );

    }


    if (polarView) {

        polarView.addEventListener(
            "click",
            () => {

                cameraTarget =
                    moon.position.clone();

                cameraYaw = 0;

                cameraPitch =
                    Math.PI / 2.8;

                cameraDistance = 4;

                updateCamera();

            }
        );

    }


    if (globeView) {

        globeView.addEventListener(
            "click",
            () => {

                cameraTarget =
                    EARTH_POSITION.clone();

                cameraYaw = 0.65;

                cameraPitch = 0.25;

                cameraDistance = 12;

                updateCamera();

            }
        );

    }


    if (lunarHour) {

        lunarHour.addEventListener(
            "input",
            () => {

                const value =
                    Number(
                        lunarHour.value
                    );


                const display =
                    $("lunarHourValue");

                if (display) {

                    const hour =
                        Math.floor(value);

                    const minutes =
                        Math.round(
                            (
                                value -
                                hour
                            ) * 60
                        );


                    display.textContent =
                        `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

                }

            }
        );

    }


    if (craterFilter) {

        craterFilter.addEventListener(
            "change",
            () => {

                craterMarkers.forEach(
                    marker => {

                        marker.visible =
                            craterFilter.checked;

                    }
                );

            }
        );

    }


    /* Keyboard reset */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key.toLowerCase() ===
                "r"
            ) {

                resetCamera();

            }

        }
    );

}


/* =========================================
   MOUSE CONTROLS
========================================= */

function setupMouseControls() {

    const container =
        $("three-container");

    if (!container) {
        return;
    }


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
                dx * 0.005;

            cameraPitch -=
                dy * 0.005;


            cameraPitch =
                Math.max(
                    -1.4,
                    Math.min(
                        1.4,
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
                event.deltaY * 0.01;


            cameraDistance =
                Math.max(
                    3,
                    Math.min(
                        30,
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
        "pointermove",
        event => {

            const rect =
                container.getBoundingClientRect();


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


            const hits =
                raycaster.intersectObjects(
                    craterMarkers
                );


            if (
                hits.length > 0
            ) {

                const crater =
                    hits[0].object.userData;

                updateCoordinates(
                    crater.lat,
                    crater.lon
                );

            }

        }
    );


    container.addEventListener(
        "click",
        event => {

            const rect =
                container.getBoundingClientRect();


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


            const hits =
                raycaster.intersectObjects(
                    craterMarkers
                );


            if (
                hits.length > 0
            ) {

                selectCrater(
                    hits[0].object.userData
                );

                analyzeSite();

            }

        }
    );

}


/* =========================================
   CAMERA
========================================= */

function updateCamera() {

    if (
        !camera ||
        !cameraTarget
    ) {

        return;

    }


    const x =
        cameraTarget.x +
        Math.cos(cameraYaw) *
        Math.cos(cameraPitch) *
        cameraDistance;


    const y =
        cameraTarget.y +
        Math.sin(cameraPitch) *
        cameraDistance;


    const z =
        cameraTarget.z +
        Math.sin(cameraYaw) *
        Math.cos(cameraPitch) *
        cameraDistance;


    camera.position.set(
        x,
        y,
        z
    );


    camera.lookAt(
        cameraTarget
    );


    const display =
        $("cameraDistance");

    if (display) {

        display.textContent =
            `${cameraDistance.toFixed(1)} AU`;

    }

}


/* =========================================
   RESET CAMERA
========================================= */

function resetCamera() {

    cameraTarget =
        EARTH_POSITION.clone();

    cameraDistance = 12;

    cameraYaw = 0.65;

    cameraPitch = 0.25;

    updateCamera();

}


/* =========================================
   RESIZE
========================================= */

function setupResize() {

    window.addEventListener(
        "resize",
        () => {

            const container =
                $("three-container");

            if (
                !container ||
                !camera ||
                !renderer
            ) {

                return;

            }


            const width =
                container.clientWidth;

            const height =
                container.clientHeight;


            if (
                width <= 0 ||
                height <= 0
            ) {

                return;

            }


            camera.aspect =
                width / height;

            camera.updateProjectionMatrix();


            renderer.setSize(
                width,
                height
            );

        }
    );

}


/* =========================================
   ANIMATION
========================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    if (earth) {

        earth.rotation.y +=
            0.0004;

    }


    if (moon) {

        moon.rotation.y +=
            0.001;

        updateMoonPosition();

    }


    if (sun) {

        sun.rotation.y +=
            0.0002;

    }


    updateCamera();


    if (renderer && scene && camera) {

        renderer.render(
            scene,
            camera
        );

    }

}
