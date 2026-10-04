<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lunar South Pole Mission Planner</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>

<body>

<header class="topbar">
    <div>
        <h1>LUNAR SOUTH POLE</h1>
        <span>Mission Planning & Landing-Site Analysis</span>
    </div>

    <div class="system-status">
        <span class="status-dot"></span>
        SYSTEM ONLINE
    </div>
</header>

<main class="app">

    <!-- LEFT CONTROL PANEL -->
    <aside class="sidebar">

        <div class="panel-title">MISSION CONFIGURATION</div>

        <label>EARTH LAUNCH SITE</label>
        <select id="launchSite"></select>

        <label>LUNAR LANDING SITE</label>
        <select id="landingSite"></select>

        <label>MISSION DATE</label>
        <input type="date" id="missionDate">

        <label>LUNAR LOCAL TIME</label>

        <div class="time-row">
            <input type="range" id="lunarHour" min="0" max="24" step="1" value="12">
            <span id="lunarHourValue">12:00</span>
        </div>

        <button id="analyzeButton" class="primary-button">
            ANALYZE SITE
        </button>

        <button id="resetButton" class="secondary-button">
            RESET VIEW
        </button>

        <div class="divider"></div>

        <div class="panel-title">MAP CONTROLS</div>

        <label class="check">
            <input type="checkbox" id="southPoleOnly" checked>
            South-pole sites
        </label>

        <label class="check">
            <input type="checkbox" id="majorOnly">
            Major craters
        </label>

        <button id="zoomIn" class="small-button">＋ ZOOM IN</button>
        <button id="zoomOut" class="small-button">－ ZOOM OUT</button>

    </aside>


    <!-- MAIN VISUALIZATION -->
    <section class="visualization">

        <div class="view-header">
            <div>
                <strong>MOON — SOUTH POLAR REGION</strong>
                <span>Interactive landing-site visualization</span>
            </div>

            <div class="view-controls">
                <button id="viewTop">POLAR</button>
                <button id="viewGlobe">GLOBE</button>
            </div>
        </div>

        <div id="space">

            <div class="sun-light"></div>

            <div id="moon">

                <div class="moon-surface"></div>

                <div class="south-pole-line"></div>

                <div class="pole-text">
                    SOUTH POLE
                </div>

            </div>

            <div id="earth-indicator">
                <div class="earth-circle"></div>
                <span>EARTH</span>
            </div>

            <div id="sun-indicator">
                ☼
                <span>SUN</span>
            </div>

            <div id="craterLayer"></div>

        </div>

        <div class="coordinates">
            <span id="cursorCoords">LAT -- / LON --</span>
            <span>DRAG TO ROTATE • SCROLL TO ZOOM</span>
        </div>

    </section>


    <!-- RIGHT INFORMATION PANEL -->
    <aside class="info-panel">

        <div class="panel-title">MISSION CONDITIONS</div>

        <div class="metric-card">
            <span>SUN ELEVATION</span>
            <strong id="sunElevation">--°</strong>
        </div>

        <div class="metric-card">
            <span>SOLAR POWER POTENTIAL</span>
            <strong id="powerPotential">--%</strong>

            <div class="progress">
                <div id="powerBar"></div>
            </div>
        </div>

        <div class="metric-card">
            <span>EARTH VISIBILITY</span>
            <strong id="earthVisibility">--%</strong>

            <div class="progress">
                <div id="earthBar"></div>
            </div>
        </div>

        <div class="metric-card">
            <span>DIRECT-TO-EARTH</span>
            <strong class="communication" id="communicationStatus">
                --
            </strong>
        </div>

        <div class="divider"></div>

        <div class="panel-title">SELECTED SITE</div>

        <div class="site-info">
            <div>
                <span>NAME</span>
                <strong id="siteName">--</strong>
            </div>

            <div>
                <span>COORDINATES</span>
                <strong id="siteCoordinates">--</strong>
            </div>

            <div>
                <span>DIAMETER</span>
                <strong id="siteDiameter">--</strong>
            </div>

            <div>
                <span>REGION</span>
                <strong id="siteRegion">--</strong>
            </div>
        </div>

        <div class="divider"></div>

        <div class="panel-title">MISSION ASSESSMENT</div>

        <div id="assessment" class="assessment">
            Select a landing site to begin analysis.
        </div>

    </aside>

</main>


<!-- COMPARISON SECTION -->

<section class="comparison">

    <div class="comparison-header">
        <div>
            <h2>LANDING SITE COMPARISON</h2>
            <span>Candidate sites evaluated for the selected mission date</span>
        </div>
    </div>

    <div id="comparisonGrid" class="comparison-grid"></div>

</section>


<script src="{{ url_for('static', filename='app.js') }}"></script>

</body>
</html>
