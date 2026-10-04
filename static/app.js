let scene;
let camera;
let renderer;

let earth;
let moon;
let sun;
let sunLight;

let craterGroup;
let craterMarkers = [];

let transferOrbit;
let thrustMarker;
let thrustGlow;

let craters = [];
let launchSites = [];

let raycaster;
let mouse;

let selectedCrater = null;

let moonAngle = 0;

const EARTH_RADIUS = 0.95;
const MOON_RADIUS = 0.50;

/*
    Moon is intentionally farther from Earth
    than the previous version.
*/
const MOON_ORBIT_RADIUS = 3.6;

const EARTH_POSITION =
    new THREE.Vector3(
        -7.5,
        3.5,
        -4.5
    );

const SUN_POSITION =
    new THREE.Vector3(
        12,
        5,
        8
    );


/*
    Camera begins focused on Moon.
*/
let cameraTarget =
    new THREE.Vector3(
        0,
        0,
        0
    );

let cameraDistance = 5.5;
let cameraYaw = 0.35;
let cameraPitch = 0.18;

let dragging = false;
let lastX = 0;
let lastY = 0;

let simulationTime = 0;


/* =========================================
   DOM
========================================= */

function $(id) {
    return document.getElementById(id);
}


const loadingOverlay =
    $("loading-overlay");

const loadingProgress =
    $("loadingProgress");

const loadingText =
    $("loadingText");


/* =========================================
   LOADING
========================================= */

function updateLoading(
    percent,
    message
) {

    percent =
        Math.max(
            0,
            Math.min(
                100,
                percent
            )
        );


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

    updateLoading(
        100,
        "Mission environment ready."
    );


    if (!loadingOverlay) {
        return;
    }


    setTimeout(
        () => {

            loadingOverlay.style.opacity =
                "0";


            setTimeout(
                () => {

                    loadingOverlay.style.display =
                        "none";

                },
                500
            );

        },
        400
    );

}


function showLoadingError(
    message
) {

    console.error(
        "MISSION PLANNER ERROR:",
        message
    );


    if (loadingText) {

        loadingText.textContent =
            "ERROR: " + message;

    }

}


/* =========================================
   START
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
            typeof THREE ===
            "undefined"
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
            "Building 3D mission environment..."
        );


        /* ================================
           SCENE
        ================================= */

        scene =
            new THREE.Scene();

        scene.background =
            new THREE.Color(
                0x020406
            );


        /* ================================
           CAMERA
        ================================= */

        const width =
            container.clientWidth ||
            900;

        const height =
            container.clientHeight ||
            600;


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
                window.devicePixelRatio ||
                1,
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
            0.65;


        container.appendChild(
            renderer.domElement
        );


        updateLoading(
            25,
            "Initializing lighting..."
        );


        /* ================================
           LIGHTING
        ================================= */

        const ambient =
            new THREE.AmbientLight(
                0x55616a,
                0.08
            );

        scene.add(
            ambient
        );


        sunLight =
            new THREE.PointLight(
                0xffe0a0,
                2.4,
                0,
                2
            );


        sunLight.position.copy(
            SUN_POSITION
        );


        scene.add(
            sunLight
        );


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
            "Creating realistic lunar surface..."
        );


        createMoon();


        updateLoading(
            65,
            "Building lunar orbit..."
        );


        createMoonOrbit();


        updateLoading(
            70,
            "Calculating transfer trajectory..."
        );


        createTransferOrbit();


        setupMouseControls();

        setupButtons();

        setupResize();


        updateLoading(
            76,
            "Loading lunar landing sites..."
        );


        await loadData();


        updateLoading(
            92,
            "Preparing landing telemetry..."
        );


        setDefaultDate();


        updateCamera();


        if (
            craters.length > 0
        ) {

            selectCrater(
                craters[0]
            );

            analyzeSite();

        }


        updateComparison();


        updateLoading(
            100,
            "Mission environment ready."
        );


        finishLoading();


        animate();

    }
    catch (error) {

        showLoadingError(
            error.message ||
            "Unknown startup error."
        );

    }

}


/* =========================================
   DEFAULT DATE
========================================= */

function setDefaultDate() {

    const input =
        $("mission-date");


    if (!input) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    input.value =
        `${year}-${month}-${day}`;

}


/* =========================================
   SUN
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
            color: 0xffd36b
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


    const glowGeometry =
        new THREE.SphereGeometry(
            0.75,
            32,
            32
        );


    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffc95d,
            transparent: true,
            opacity: 0.08
        });


    const glow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );


    sun.add(
        glow
    );

}


/* =========================================
   EARTH
========================================= */

function createEarth() {

    const geometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS,
            64,
            64
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width = 512;
    canvas.height = 256;


    const ctx =
        canvas.getContext(
            "2d"
        );


    /*
        Procedural Earth texture.
        Gives ocean/land/cloud-like
        visual breakup without another
        asset dependency.
    */

    const image =
        ctx.createImageData(
            canvas.width,
            canvas.height
        );


    for (
        let y = 0;
        y < canvas.height;
        y++
    ) {

        for (
            let x = 0;
            x < canvas.width;
            x++
        ) {

            const nx =
                x / canvas.width;

            const ny =
                y / canvas.height;


            const wave =
                Math.sin(
                    nx * 20
                ) *
                Math.cos(
                    ny * 11
                );


            const land =
                Math.sin(
                    nx * 13 +
                    wave
                ) +
                Math.cos(
                    ny * 17
                );


            const i =
                (
                    y *
                    canvas.width +
                    x
                ) * 4;


            if (
                land > 0.55
            ) {

                image.data[i] =
                    62;

                image.data[i + 1] =
                    96;

                image.data[i + 2] =
                    70;

            }
            else {

                image.data[i] =
                    25;

                image.data[i + 1] =
                    68;

                image.data[i + 2] =
                    105;

            }


            image.data[i + 3] =
                255;

        }

    }


    ctx.putImageData(
        image,
        0,
        0
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    const material =
        new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.85,
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


    const atmosphereGeometry =
        new THREE.SphereGeometry(
            EARTH_RADIUS * 1.06,
            48,
            48
        );


    const atmosphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x4b9ed0,
            transparent: true,
            opacity: 0.06,
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


/* =========================================
   MOON REALISTIC PROCEDURAL TEXTURE
========================================= */

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(
            MOON_RADIUS,
            96,
            96
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width = 1024;
    canvas.height = 512;


    const ctx =
        canvas.getContext(
            "2d"
        );


    const image =
        ctx.createImageData(
            canvas.width,
            canvas.height
        );


    /*
        Layered procedural noise creates
        lunar regolith-like variation.
    */

    for (
        let y = 0;
        y < canvas.height;
        y++
    ) {

        for (
            let x = 0;
            x < canvas.width;
            x++
        ) {

            const nx =
                x / canvas.width;

            const ny =
                y / canvas.height;


            const large =
                Math.sin(
                    nx * 31
                ) *
                Math.cos(
                    ny * 23
                );


            const medium =
                Math.sin(
                    nx * 83 +
                    ny * 17
                ) *
                Math.cos(
                    ny * 61
                );


            const small =
                Math.sin(
                    nx * 210 +
                    ny * 140
                );


            let value =
                126 +
                large * 17 +
                medium * 9 +
                small * 4;


            value =
                Math.max(
                    65,
                    Math.min(
                        165,
                        value
                    )
                );


            const i =
                (
                    y *
                    canvas.width +
                    x
                ) * 4;


            image.data[i] =
                value;

            image.data[i + 1] =
                value;

            image.data[i + 2] =
                value - 2;

            image.data[i + 3] =
                255;

        }

    }


    ctx.putImageData(
        image,
        0,
        0
    );


    /*
        Add procedural crater marks.
    */

    for (
        let i = 0;
        i < 220;
        i++
    ) {

        const x =
            Math.random() *
            canvas.width;

        const y =
            Math.random() *
            canvas.height;

        const radius =
            2 +
            Math.random() *
            14;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            `rgba(
                45,
                45,
                45,
                ${0.08 +
                Math.random() * 0.15}
            )`;


        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x - radius * 0.2,
            y - radius * 0.2,
            radius * 0.7,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "rgba(210,210,210,0.10)";


        ctx.stroke();

    }


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.wrapS =
        THREE.RepeatWrapping;


    const material =
        new THREE.MeshStandardMaterial({

            map: texture,

            roughness: 1.0,

            metalness: 0.0

        });


    moon =
        new THREE.Mesh(
            geometry,
            material
        );


    moon.position.set(
        EARTH_POSITION.x +
        MOON_ORBIT_RADIUS,

        EARTH_POSITION.y,

        EARTH_POSITION.z
    );


    scene.add(
        moon
    );


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

    const segments = 160;


    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const angle =
            (
                i /
                segments
            ) *
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
            color: 0x394954,
            transparent: true,
            opacity: 0.4
        });


    const orbit =
        new THREE.Line(
            geometry,
            material
        );


    scene.add(
        orbit
    );

}


/* =========================================
   MOON POSITION
========================================= */

function updateMoonPosition() {

    moonAngle +=
        0.0008;


    moon.position.set(

        EARTH_POSITION.x +
        Math.cos(
            moonAngle
        ) *
        MOON_ORBIT_RADIUS,

        EARTH_POSITION.y,

        EARTH_POSITION.z +
        Math.sin(
            moonAngle
        ) *
        MOON_ORBIT_RADIUS

    );


    if (
        !dragging &&
        cameraTarget
    ) {

        cameraTarget.lerp(
            moon.position,
            0.018
        );

    }

}


/* =========================================
   TRANSFER ORBIT
========================================= */

function createTransferOrbit() {

    const points = [];

    const segments = 180;


    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const t =
            i / segments;


        const angle =
            Math.PI *
            0.18 +
            t *
            Math.PI *
            0.96;


        const radius =
            1.15 +
            t *
            (
                MOON_ORBIT_RADIUS -
                1.15
            );


        points.push(

            new THREE.Vector3(

                EARTH_POSITION.x +
                Math.cos(angle) *
                radius,

                EARTH_POSITION.y +
                Math.sin(
                    t *
                    Math.PI
                ) *
                0.55,

                EARTH_POSITION.z +
                Math.sin(angle) *
                radius

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
            color: 0x6d91a3,
            transparent: true,
            opacity: 0.5
        });


    transferOrbit =
        new THREE.Line(
            geometry,
            material
        );


    scene.add(
        transferOrbit
    );


    createThrustMarker();

}


/* =========================================
   THRUST MARKER
========================================= */

function createThrustMarker() {

    const geometry =
        new THREE.SphereGeometry(
            0.075,
            24,
            24
        );


    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffa62b
        });


    thrustMarker =
        new THREE.Mesh(
            geometry,
            material
        );


    scene.add(
        thrustMarker
    );


    const glowGeometry =
        new THREE.SphereGeometry(
            0.15,
            24,
            24
        );


    const glowMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffa62b,
            transparent: true,
            opacity: 0.12
        });


    thrustGlow =
        new THREE.Mesh(
            glowGeometry,
            glowMaterial
        );


    thrustMarker.add(
        thrustGlow
    );


    updateThrustPoint();

}


/* =========================================
   DATE → THRUST POINT
========================================= */

function updateThrustPoint() {

    if (!thrustMarker) {
        return;
    }


    const dateInput =
        $("mission-date");


    let date;


    if (
        dateInput &&
        dateInput.value
    ) {

        date =
            new Date(
                dateInput.value +
                "T00:00:00Z"
            );

    }
    else {

        date =
            new Date();

    }


    const day =
        Math.floor(
            date.getTime() /
            86400000
        );


    /*
        Simulated orbital phase.

        This gives the user a visual
        "SFS-like" departure point without
        pretending to calculate an
        operational trajectory.
    */

    const phase =
        (
            day % 360
        ) / 360;


    const angle =
        Math.PI *
        0.18 +
        phase *
        Math.PI *
        0.72;


    const radius =
        1.5;


    thrustMarker.position.set(

        EARTH_POSITION.x +
        Math.cos(angle) *
        radius,

        EARTH_POSITION.y +
        Math.sin(
            phase *
            Math.PI
        ) *
        0.45,

        EARTH_POSITION.z +
        Math.sin(angle) *
        radius

    );


    const label =
        $("thrust-label");


    /*
        The actual 3D label follows the
        marker approximately through the
        render loop.
    */

    updateBurnInformation(
        phase
    );

}


/* =========================================
   BURN INFORMATION
========================================= */

function updateBurnInformation(
    phase
) {

    const progress =
        Math.round(
            phase * 100
        );


    const burn =
        $("burn-progress");


    if (burn) {

        burn.style.width =
            `${progress}%`;

    }


    const windowDisplay =
        $("burn-window");


    if (windowDisplay) {

        const day =
            Math.round(
                phase * 360
            );


        windowDisplay.textContent =
            `SIMULATED TRANSFER PHASE: DAY ${day} / 360`;

    }

}


/* =========================================
   DATA
========================================= */

async function loadData() {

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
            "Crater database could not be loaded."
        );

    }


    if (!launchResponse.ok) {

        throw new Error(
            "Launch-site database could not be loaded."
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


/* =========================================
   CRATER MARKERS
========================================= */

function createCraterMarkers() {

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
            0.027,
            16,
            16
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
            0.014;


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
   SELECT DATA
========================================= */

function populateCraterSelect() {

    const select =
        $("crater-select");


    if (!select) {
        return;
    }


    select.innerHTML = "";


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
        craters.length
    ) {

        select.value =
            craters[0].name;

    }

}


function populateLaunchSelect() {

    const select =
        $("launch-site-select");


    if (!select) {
        return;
    }


    select.innerHTML = "";


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
            crater.name ||
            "--";

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


    analyzeSite();

}


/* =========================================
   COORDINATES
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
        `LAT ${Number(
            lat
        ).toFixed(2)}° / LON ${Number(
            lon
        ).toFixed(2)}°`;

}


/* =========================================
   ANALYZE
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

                selectedCrater =
                    crater;

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
                .slice(
                    0,
                    10
                );


    const hour =
        hourInput
            ? Number(
                hourInput.value
            )
            : 12;


    try {

        const response =
            await fetch(
                `/api/conditions?latitude=${encodeURIComponent(
                    selectedCrater.lat
                )}&longitude=${encodeURIComponent(
                    selectedCrater.lon
                )}&date=${encodeURIComponent(
                    date
                )}&hour=${encodeURIComponent(
                    hour
                )}`
            );


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


        updateThrustPoint();


        updateComparison();

    }
    catch (error) {

        console.error(
            error
        );


        setAssessment(
            "Unable to calculate mission conditions."
        );

    }

}


/* =========================================
   TELEMETRY
========================================= */

function updateTelemetry(
    data
) {

    const sun =
        data.sun || {};


    const earth =
        data.earth || {};


    const communication =
        data.communication || {};


    const landing =
        data.landing || {};


    const sunElevation =
        $("sunElevation");


    const powerPotential =
        $("powerPotential");


    const earthVisibility =
        $("earthVisibility");


    const communicationStatus =
        $("communicationStatus");


    if (sunElevation) {

        sunElevation.textContent =
            `${Number(
                sun.elevation_degrees ||
                0
            ).toFixed(1)}°`;

    }


    if (powerPotential) {

        powerPotential.textContent =
            `${Number(
                sun.power_potential_percent ||
                0
            ).toFixed(0)}%`;

    }


    if (earthVisibility) {

        earthVisibility.textContent =
            `${Number(
                earth.visibility_percent ||
                0
            ).toFixed(0)}%`;

    }


    if (communicationStatus) {

        communicationStatus.textContent =
            communication.status ||
            "--";

    }


    const powerBar =
        $("powerBar");


    if (powerBar) {

        powerBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        sun.power_potential_percent ||
                        0
                    )
                )
            )}%`;

    }


    const earthBar =
        $("earthBar");


    if (earthBar) {

        earthBar.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        earth.visibility_percent ||
                        0
                    )
                )
            )}%`;

    }


    const altitude =
        $("landing-altitude");


    const velocity =
        $("landing-velocity");


    const rate =
        $("landing-rate");


    const angle =
        $("landing-angle");


    const phase =
        $("flight-phase");


    const score =
        $("landing-score");


    const risk =
        $("landing-risk");


    if (altitude) {

        altitude.textContent =
            `${landing.altitude_km || "--"} km`;

    }


    if (velocity) {

        velocity.textContent =
            `${landing.velocity_mps || "--"} m/s`;

    }


    if (rate) {

        rate.textContent =
            `${landing.descent_rate_mps || "--"} m/s`;

    }


    if (angle) {

        angle.textContent =
            `${landing.descent_angle_deg || "--"}°`;

    }


    if (phase) {

        phase.textContent =
            landing.flight_phase ||
            "--";

    }


    if (score) {

        score.textContent =
            `${landing.landing_score || 0}%`;

    }


    if (risk) {

        risk.textContent =
            landing.landing_risk ||
            "--";

    }


    const warning =
        $("analysis-warning");


    if (warning) {

        warning.textContent =
            data.warning ||
            "";

    }

}


/* =========================================
   ASSESSMENT
========================================= */

function updateAssessment(
    data
) {

    const landing =
        data.landing || {};


    const power =
        data.sun
            ? data.sun.power_potential_percent
            : 0;


    const communication =
        data.communication
            ? data.communication.status
            : "Unknown";


    const score =
        landing.landing_score ||
        0;


    let message;


    if (
        score >= 80 &&
        power >= 70
    ) {

        message =
            "Strong simulated landing candidate. Solar availability and descent conditions are favorable.";

    }
    else if (
        score >= 60
    ) {

        message =
            "Moderate simulated candidate. Review descent profile, power availability and communications.";

    }
    else {

        message =
            "Challenging simulated landing profile. A trajectory or descent correction may be required.";

    }


    if (
        communication ===
        "Limited"
    ) {

        message +=
            " Direct-to-Earth visibility is limited.";

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
   COMPARISON
========================================= */

function updateComparison() {

    const grid =
        $("comparisonGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    const candidates =
        craters.slice(
            0,
            8
        );


    candidates.forEach(
        crater => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "comparison-card";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                crater.name;


            card.appendChild(
                title
            );


            const stats =
                document.createElement(
                    "div"
                );


            stats.className =
                "comparison-stats";


            const lat =
                document.createElement(
                    "div"
                );


            lat.className =
                "comparison-stat";


            lat.innerHTML =
                `LAT<strong>${Number(
                    crater.lat
                ).toFixed(1)}°</strong>`;


            const lon =
                document.createElement(
                    "div"
                );


            lon.className =
                "comparison-stat";


            lon.innerHTML =
                `LON<strong>${Number(
                    crater.lon
                ).toFixed(1)}°</strong>`;


            const type =
                document.createElement(
                    "div"
                );


            type.className =
                "comparison-stat";


            type.innerHTML =
                `REGION<strong>${Math.abs(
                    Number(
                        crater.lat
                    )
                ) >= 80
                    ? "SOUTH POLE"
                    : "GLOBAL"
                }</strong>`;


            stats.appendChild(
                lat
            );


            stats.appendChild(
                lon
            );


            stats.appendChild(
                type
            );


            card.appendChild(
                stats
            );


            card.addEventListener(
                "click",
                () => {

                    selectCrater(
                        crater
                    );

                }
            );


            grid.appendChild(
                card
            );

        }
    );

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


    const missionDate =
        $("mission-date");


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
                        2.5,
                        cameraDistance -
                        0.8
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
                        cameraDistance +
                        0.8
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


                cameraYaw =
                    0;


                cameraPitch =
                    Math.PI /
                    2.7;


                cameraDistance =
                    2.8;


                updateCamera();

            }
        );

    }


    if (globeView) {

        globeView.addEventListener(
            "click",
            () => {

                cameraTarget =
                    moon.position.clone();


                cameraYaw =
                    0.35;


                cameraPitch =
                    0.18;


                cameraDistance =
                    5.5;


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


                const hour =
                    Math.floor(
                        value
                    );


                const display =
                    $("lunarHourValue");


                if (display) {

                    display.textContent =
                        `${String(
                            hour
                        ).padStart(
                            2,
                            "0"
                        )}:00`;

                }


                if (
                    selectedCrater
                ) {

                    analyzeSite();

                }

            }
        );

    }


    if (missionDate) {

        missionDate.addEventListener(
            "change",
            () => {

                updateThrustPoint();

                analyzeSite();

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
                event.deltaY *
                0.01;


            cameraDistance =
                Math.max(
                    2.5,
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
                ) *
                2 -
                1;


            mouse.y =
                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) *
                2 +
                1;


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
                    hits[0]
                        .object
                        .userData;


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
                ) *
                2 -
                1;


            mouse.y =
                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) *
                2 +
                1;


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
                    hits[0]
                        .object
                        .userData
                );

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
        Math.cos(
            cameraYaw
        ) *
        Math.cos(
            cameraPitch
        ) *
        cameraDistance;


    const y =
        cameraTarget.y +
        Math.sin(
            cameraPitch
        ) *
        cameraDistance;


    const z =
        cameraTarget.z +
        Math.sin(
            cameraYaw
        ) *
        Math.cos(
            cameraPitch
        ) *
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
            `${cameraDistance.toFixed(
                2
            )} AU`;

    }

}


/* =========================================
   RESET
========================================= */

function resetCamera() {

    cameraTarget =
        moon
            ? moon.position.clone()
            : new THREE.Vector3(
                0,
                0,
                0
            );


    cameraDistance =
        5.5;


    cameraYaw =
        0.35;


    cameraPitch =
        0.18;


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
   LABEL POSITIONING
========================================= */

function updateLabels() {

    if (
        !camera ||
        !renderer
    ) {
        return;
    }


    positionLabel(
        $("moon-label"),
        moon
    );


    positionLabel(
        $("thrust-label"),
        thrustMarker
    );


    positionLabel(
        $("earth-label"),
        earth
    );


    positionLabel(
        $("sun-label"),
        sun
    );

}


function positionLabel(
    element,
    object
) {

    if (
        !element ||
        !object
    ) {
        return;
    }


    const position =
        object.position.clone();


    position.project(
        camera
    );


    const rect =
        renderer.domElement
            .getBoundingClientRect();


    const x =
        (
            position.x * 0.5 +
            0.5
        ) *
        rect.width;


    const y =
        (
            -position.y * 0.5 +
            0.5
        ) *
        rect.height;


    element.style.left =
        `${x}px`;


    element.style.top =
        `${y}px`;

}


/* =========================================
   ANIMATION
========================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    simulationTime +=
        0.016;


    if (earth) {

        earth.rotation.y +=
            0.00025;

    }


    if (moon) {

        moon.rotation.y +=
            0.0006;


        updateMoonPosition();

    }


    if (sun) {

        sun.rotation.y +=
            0.00015;

    }


    if (thrustMarker) {

        const pulse =
            1 +
            Math.sin(
                simulationTime * 5
            ) *
            0.15;


        thrustMarker.scale.set(
            pulse,
            pulse,
            pulse
        );

    }


    updateCamera();

    updateLabels();


    if (
        renderer &&
        scene &&
        camera
    ) {

        renderer.render(
            scene,
            camera
        );

    }

}
