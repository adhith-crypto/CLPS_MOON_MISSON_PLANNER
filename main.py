<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Lunar South Pole Mission Planner</title>

    <link
        rel="stylesheet"
        href="{{ url_for('static', filename='style.css') }}"
    >
</head>

<body>

<div id="app">

    <!-- =========================================
         TOP MISSION BAR
    ========================================== -->

    <header id="topbar">

        <div class="brand">

            <div class="brand-title">
                LUNAR MISSION PLANNER
            </div>

            <div class="brand-subtitle">
                SOUTH POLE SITE ANALYSIS
            </div>

        </div>

        <div class="mission-status">

            <span class="status-light"></span>

            <span>
                MISSION SYSTEM ONLINE
            </span>

        </div>

    </header>


    <!-- =========================================
         MAIN MISSION SCREEN
    ========================================== -->

    <main id="mission-screen">

        <!-- =====================================
             LEFT CONTROL PANEL
        ====================================== -->

        <aside
            id="left-panel"
            class="hud-panel"
        >

            <div class="panel-heading">
                MISSION
            </div>

            <div class="control-group">

                <label for="launch-site-select">
                    EARTH LAUNCH SITE
                </label>

                <select id="launch-site-select">
                    <option value="">
                        Select launch site
                    </option>
                </select>

            </div>

            <div class="control-group">

                <label for="crater-select">
                    LUNAR LANDING SITE
                </label>

                <select id="crater-select">
                    <option value="">
                        Select landing site
                    </option>
                </select>

            </div>

            <div class="control-group">

                <label for="mission-date">
                    MISSION DATE
                </label>

                <input
                    type="date"
                    id="mission-date"
                >

            </div>

            <div class="control-group">

                <label for="lunar-hour">
                    LUNAR LOCAL TIME
                </label>

                <div class="slider-row">

                    <input
                        type="range"
                        id="lunar-hour"
                        min="0"
                        max="24"
                        step="1"
                        value="12"
                    >

                    <span id="lunarHourValue">
                        12:00
                    </span>

                </div>

            </div>

            <button
                type="button"
                id="analyze-button"
                class="primary-button"
            >
                ANALYZE SITE
            </button>

            <button
                type="button"
                id="reset-camera"
                class="secondary-button"
            >
                RESET CAMERA
            </button>

            <div class="panel-divider"></div>


            <!-- VISUALIZATION -->

            <div class="panel-heading">
                VISUALIZATION
            </div>

            <label class="checkbox-row">

                <input
                    type="checkbox"
                    id="crater-filter"
                    checked
                >

                <span>
                    Show crater sites
                </span>

            </label>


            <div class="camera-buttons">

                <button
                    type="button"
                    id="zoom-in"
                >
                    +
                </button>

                <button
                    type="button"
                    id="zoom-out"
                >
                    −
                </button>

                <button
                    type="button"
                    id="polar-view"
                >
                    POLAR
                </button>

                <button
                    type="button"
                    id="globe-view"
                >
                    GLOBE
                </button>

            </div>

            <div class="panel-divider"></div>


            <!-- CAMERA HELP -->

            <div class="panel-heading">
                CAMERA
            </div>

            <div class="camera-help">

                <div>
                    <strong>DRAG</strong>
                    <span>Rotate camera</span>
                </div>

                <div>
                    <strong>SCROLL</strong>
                    <span>Zoom</span>
                </div>

                <div>
                    <strong>CLICK</strong>
                    <span>Select site</span>
                </div>

                <div>
                    <strong>R</strong>
                    <span>Reset camera</span>
                </div>

            </div>

        </aside>


        <!-- =====================================
             3D VIEWPORT
        ====================================== -->

        <section id="viewport">

            <div id="three-container"></div>


            <!-- VIEW HEADER -->

            <div id="scene-header">

                <div>

                    <strong>
                        LUNAR SOUTH POLAR REGION
                    </strong>

                    <span>
                        3D MISSION VISUALIZATION
                    </span>

                </div>

            </div>


            <!-- CENTER RETICLE -->

            <div id="target-reticle">

                <div class="reticle-corner top-left"></div>

                <div class="reticle-corner top-right"></div>

                <div class="reticle-corner bottom-left"></div>

                <div class="reticle-corner bottom-right"></div>

            </div>


            <!-- SPACE OBJECT LABELS -->

            <div id="scene-labels">

                <div
                    id="sun-label"
                    class="space-label"
                >
                    SUN
                </div>

                <div
                    id="earth-label"
                    class="space-label"
                >
                    EARTH
                </div>

            </div>


            <!-- CAMERA READOUT -->

            <div id="camera-readout">

                <div>
                    CAMERA RANGE
                </div>

                <strong id="cameraDistance">
                    -- km
                </strong>

            </div>


            <!-- COORDINATE READOUT -->

            <div id="coordinate-readout">

                <span id="cursorCoords">
                    LAT -- / LON --
                </span>

            </div>


            <!-- LOADING SCREEN -->

            <div id="loading-overlay">

                <div class="loading-box">

                    <div class="loading-title">
                        INITIALIZING MISSION VIEW
                    </div>

                    <div class="loading-bar">

                        <div id="loadingProgress"></div>

                    </div>

                    <div id="loadingText">
                        Loading lunar environment...
                    </div>

                </div>

            </div>

        </section>


        <!-- =====================================
             RIGHT TELEMETRY PANEL
        ====================================== -->

        <aside
            id="right-panel"
            class="hud-panel"
        >

            <div class="panel-heading">
                MISSION TELEMETRY
            </div>


            <!-- SUN -->

            <div class="telemetry-block">

                <div class="telemetry-label">
                    SUN ELEVATION
                </div>

                <div
                    class="telemetry-value"
                    id="sunElevation"
                >
                    --°
                </div>

            </div>


            <!-- SOLAR POWER -->

            <div class="telemetry-block">

                <div class="telemetry-label">
                    SOLAR POWER POTENTIAL
                </div>

                <div
                    class="telemetry-value"
                    id="powerPotential"
                >
                    --%
                </div>

                <div class="telemetry-bar">

                    <div id="powerBar"></div>

                </div>

            </div>


            <!-- EARTH VISIBILITY -->

            <div class="telemetry-block">

                <div class="telemetry-label">
                    EARTH VISIBILITY
                </div>

                <div
                    class="telemetry-value"
                    id="earthVisibility"
                >
                    --%
                </div>

                <div class="telemetry-bar">

                    <div id="earthBar"></div>

                </div>

            </div>


            <!-- COMMUNICATION -->

            <div class="telemetry-block">

                <div class="telemetry-label">
                    DIRECT-TO-EARTH
                </div>

                <div
                    class="communication-value"
                    id="communicationStatus"
                >
                    --
                </div>

            </div>


            <div class="panel-divider"></div>


            <!-- SELECTED SITE -->

            <div class="panel-heading">
                SELECTED SITE
            </div>

            <div class="site-data">

                <div class="data-row">

                    <span>
                        NAME
                    </span>

                    <strong id="selected-site-name">
                        --
                    </strong>

                </div>

                <div class="data-row">

                    <span>
                        LATITUDE
                    </span>

                    <strong id="selected-site-lat">
                        --
                    </strong>

                </div>

                <div class="data-row">

                    <span>
                        LONGITUDE
                    </span>

                    <strong id="selected-site-lon">
                        --
                    </strong>

                </div>

            </div>


            <div class="panel-divider"></div>


            <!-- ANALYSIS -->

            <div class="panel-heading">
                MISSION ASSESSMENT
            </div>

            <div
                id="assessment"
                class="assessment"
            >
                Select a landing site.
            </div>

            <div
                id="analysis-warning"
                class="assessment"
                style="margin-top: 8px;"
            >
            </div>

        </aside>

    </main>


    <!-- =========================================
         BOTTOM COMPARISON PANEL
    ========================================== -->

    <section id="comparison-panel">

        <div class="comparison-title">

            <div>

                <strong>
                    LANDING SITE COMPARISON
                </strong>

                <span>
                    Candidate sites for current mission conditions
                </span>

            </div>

        </div>

        <div
            id="comparisonGrid"
            class="comparison-grid"
        ></div>

    </section>

</div>


<!-- =========================================
     THREE.JS
     ========================================== -->

<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js"></script>


<!-- =========================================
     APPLICATION
     ========================================== -->

<script src="{{ url_for('static', filename='app.js') }}"></script>

</body>

</html>
