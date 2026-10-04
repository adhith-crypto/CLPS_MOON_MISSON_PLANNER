from flask import Flask, render_template, jsonify, request
import json
import math
import os
from datetime import datetime, timezone

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


# ---------------------------------------------------------
# DATA LOADING
# ---------------------------------------------------------

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []


def get_craters():
    return load_json("craters.json")


def get_launch_sites():
    return load_json("launch_sites.json")


# ---------------------------------------------------------
# BASIC MOON / SUN CALCULATIONS
# ---------------------------------------------------------

def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def calculate_sun_elevation(latitude, longitude, date_string, lunar_hour=12):
    """
    Approximate lunar Sun elevation.

    This is a visualization/planning estimate, NOT mission-grade
    ephemeris data. A future version can replace this with SPICE.
    """

    try:
        date = datetime.fromisoformat(date_string.replace("Z", "+00:00"))
    except ValueError:
        date = datetime.now(timezone.utc)

    # Convert date to a rough day number.
    day_of_year = date.timetuple().tm_yday

    # Approximate solar declination on the Moon.
    declination = 1.54 * math.sin(
        math.radians((day_of_year / 365.25) * 360)
    )

    # Approximate local lunar hour angle.
    hour_angle = (lunar_hour - 12) * 15

    lat_rad = math.radians(latitude)
    dec_rad = math.radians(declination)
    hour_rad = math.radians(hour_angle)

    sin_elevation = (
        math.sin(lat_rad) * math.sin(dec_rad)
        + math.cos(lat_rad)
        * math.cos(dec_rad)
        * math.cos(hour_rad)
    )

    elevation = math.degrees(math.asin(clamp(sin_elevation, -1, 1)))

    return round(elevation, 2)


def calculate_power_potential(sun_elevation):
    """
    Convert approximate Sun elevation into a simple solar-power
    potential score from 0-100.
    """

    if sun_elevation <= 0:
        return 0

    if sun_elevation >= 15:
        return 100

    # At very low elevations, useful sunlight is much harder to obtain.
    score = (sun_elevation / 15) * 100

    return round(clamp(score, 0, 100), 1)


def calculate_earth_visibility(latitude, longitude):
    """
    Simplified Earth-visibility estimate.

    The lunar south-pole region can have restricted Earth visibility
    depending on terrain and local horizon conditions.
    """

    abs_lat = abs(latitude)

    if abs_lat >= 85:
        visibility = 65
    elif abs_lat >= 80:
        visibility = 80
    elif abs_lat >= 70:
        visibility = 90
    else:
        visibility = 100

    # Longitude is retained for future geometry improvements.
    _ = longitude

    return visibility


def calculate_communication(earth_visibility):
    if earth_visibility >= 90:
        return {
            "status": "Excellent",
            "score": earth_visibility
        }

    if earth_visibility >= 75:
        return {
            "status": "Good",
            "score": earth_visibility
        }

    if earth_visibility >= 50:
        return {
            "status": "Limited",
            "score": earth_visibility
        }

    return {
        "status": "Poor",
        "score": earth_visibility
    }


# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/craters")
def api_craters():
    return jsonify(get_craters())


@app.route("/api/launch-sites")
def api_launch_sites():
    return jsonify(get_launch_sites())


@app.route("/api/conditions")
def api_conditions():
    """
    Example:

    /api/conditions?latitude=-89.9&longitude=0&date=2026-10-04&hour=12
    """

    try:
        latitude = float(request.args.get("latitude", -89.9))
        longitude = float(request.args.get("longitude", 0))
        date_string = request.args.get(
            "date",
            datetime.now(timezone.utc).strftime("%Y-%m-%d")
        )
        lunar_hour = float(request.args.get("hour", 12))

    except ValueError:
        return jsonify({
            "error": "Invalid latitude, longitude, date, or hour."
        }), 400

    # Keep coordinates within valid lunar ranges.
    latitude = clamp(latitude, -90, 90)
    longitude = ((longitude + 180) % 360) - 180
    lunar_hour = clamp(lunar_hour, 0, 24)

    sun_elevation = calculate_sun_elevation(
        latitude,
        longitude,
        date_string,
        lunar_hour
    )

    power = calculate_power_potential(sun_elevation)

    earth_visibility = calculate_earth_visibility(
        latitude,
        longitude
    )

    communication = calculate_communication(
        earth_visibility
    )

    return jsonify({
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "date": date_string,

        "lunar_hour": lunar_hour,

        "sun": {
            "elevation_degrees": sun_elevation,
            "power_potential_percent": power,
            "above_horizon": sun_elevation > 0
        },

        "earth": {
            "visibility_percent": earth_visibility
        },

        "communication": communication,

        "warning": (
            "Approximate planning visualization. "
            "Not suitable for real mission operations."
        )
    })


# ---------------------------------------------------------
# CRATER LOOKUP
# ---------------------------------------------------------

@app.route("/api/crater/<name>")
def api_crater(name):

    craters = get_craters()

    for crater in craters:
        if crater.get("name", "").lower() == name.lower():
            return jsonify(crater)

    return jsonify({
        "error": "Crater not found"
    }), 404


# ---------------------------------------------------------
# LAUNCH SITE LOOKUP
# ---------------------------------------------------------

@app.route("/api/launch-site/<name>")
def api_launch_site(name):

    launch_sites = get_launch_sites()

    for site in launch_sites:
        if site.get("name", "").lower() == name.lower():
            return jsonify(site)

    return jsonify({
        "error": "Launch site not found"
    }), 404


# ---------------------------------------------------------
# COMPARISON ENDPOINT
# ---------------------------------------------------------

@app.route("/api/compare")
def api_compare():

    crater_names = request.args.get("sites", "")

    if not crater_names:
        return jsonify([])

    requested_names = [
        name.strip().lower()
        for name in crater_names.split(",")
        if name.strip()
    ]

    craters = get_craters()
    results = []

    date_string = request.args.get(
        "date",
        datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )

    hour = float(request.args.get("hour", 12))

    for crater in craters:

        crater_name = crater.get("name", "").lower()

        if crater_name not in requested_names:
            continue

        latitude = float(crater.get("lat", 0))
        longitude = float(crater.get("lon", 0))

        sun_elevation = calculate_sun_elevation(
            latitude,
            longitude,
            date_string,
            hour
        )

        power = calculate_power_potential(
            sun_elevation
        )

        earth_visibility = calculate_earth_visibility(
            latitude,
            longitude
        )

        communication = calculate_communication(
            earth_visibility
        )

        results.append({
            **crater,

            "conditions": {
                "sun_elevation": sun_elevation,
                "power_potential": power,
                "earth_visibility": earth_visibility,
                "communication": communication["status"]
            }
        })

    return jsonify(results)


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.route("/health")
def health():
    return jsonify({
        "status": "online",
        "service": "Lunar South Pole Mission Planner"
    })


# ---------------------------------------------------------
# RUN SERVER
# ---------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
