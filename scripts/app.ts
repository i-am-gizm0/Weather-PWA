import type { Skycons } from 'skycons-ts';
import type { WeatherData, DataBlock, DataPoint, CurrentData, HourData, DayData, Alert, UnixTimeStamp, URI, WeatherIcon, PrecipitationType, AlertSeverity } from './weathertypes';

let app = { // This is mostly so VSCode can use Intellisense. If there is a better way to set this up, a PR or issue would be more than welcome!
    q: (selector:string) => <HTMLElement>document.querySelector(selector), // My own small selector (jQuery is massive and I'm stubborn and want to do things on my own)
    VERSION: '0.2.5', // Mostly so I can make sure the browser is updating the JS
    location: {
        key: 'location',
        string: localStorage.getItem('location') ||  '42.3601,-71.0589',
        store: (string:string) => {},
        load: () => {},
        isCurrent: false,
        data: {
            coords: {
                latitude: undefined,
                longitude: undefined
            }
        },
        address: undefined,
    },
    searchJSON: {},
    locationJson: {},
    weatherData: <WeatherData>undefined,
    touch: {
        MIN_DISTANCE: 1.0 / 6,
        start: {
            x: <number>undefined,
            y: <number>undefined
        },
        end: {
            x: <number>undefined,
            y: <number>undefined
        },
        movement: {
            x: <number>undefined,
            y: <number>undefined
        }
    },
    ui: {
        button: {
            location: <HTMLAnchorElement>undefined,
            menu: <HTMLAnchorElement>undefined,
            back: <HTMLAnchorElement>undefined,
            edit: <HTMLAnchorElement>undefined,
            settings: <HTMLAnchorElement>undefined,
            settingsBack: <HTMLAnchorElement>undefined
        },
        text: {
            location: <HTMLSpanElement>undefined,
            version: <HTMLSpanElement>undefined,
            currently: {
                temperature: <HTMLSpanElement>undefined,
                condition: <HTMLSpanElement>undefined,
                lastUpdate: <HTMLSpanElement>undefined
            },
            today: {
                condition: <HTMLSpanElement>undefined,
                temperature: <HTMLSpanElement>undefined
            }
        },
        input: {
            search: <HTMLInputElement>undefined
        },
        canvas: {
            currently: <HTMLCanvasElement>undefined
        },
        other: {
            drawer: <HTMLDivElement>undefined,
            navUnderlay: <HTMLDivElement>undefined,
            places: <HTMLDivElement>undefined,
            settings: <HTMLDivElement>undefined
        }
    },
    saved: {
        key: 'saved',
        add: (addr:string, coords:string) => {},
        remove: (index:number) => {},
        swap: (i1:number, i2:number) => {},
        set: (index:number, addr:string, coords:string) => {},
        get: (index:number) => {},
        load: () => {},
        store: () => {},
        places: [],
        editing: false
    },
    skycons: <Skycons>undefined,
    init: async() => {},
    initialized: false,
    updateLocation: async () => {},
    updateLocationText: async () => {},
    updateWeather: async () => {},
    timer: () => {},
    locationSearch: async () => {},
    closeOverlay: (e?:Event) => {}
};

app.init = async () => {
    if (app.initialized) { // We already initialized. We don't need to do it again
        return;
    }
    app.initialized = true;

    app.ui = { // Get all of the UI elements
        button: {
            location: <HTMLAnchorElement>app.q('#getlocation'),
            menu: <HTMLAnchorElement>app.q('#menu'),
            back: <HTMLAnchorElement>app.q('#back'),
            edit: <HTMLAnchorElement>app.q('#edit'),
            settings: <HTMLAnchorElement>app.q('#settings'),
            settingsBack: <HTMLAnchorElement>app.q('#sback')
        },
        text: {
            location: app.q('#location'),
            version: app.q('#version'),
            currently: {
                temperature: app.q('#temperature'),
                condition: app.q('#condition'),
                lastUpdate: app.q('#current .update')
            },
            today: {
                condition: app.q('.today .condition'),
                temperature: app.q('.today .temperature')
            }
        },
        input: {
            search: <HTMLInputElement>app.q('#locationsearch')
        },
        canvas: {
            currently: <HTMLCanvasElement>app.q('#current-icon')
        },
        other: {
            drawer: <HTMLDivElement>app.q('nav'),
            navUnderlay: <HTMLDivElement>app.q('.nav-underlay'),
            places: <HTMLDivElement>app.q('.places-container'),
            settings: <HTMLDivElement>app.q('.settings')
        }
    };
    app.ui.text.version.textContent = `App Version ${app.VERSION}`;

    /*
     * Location
     */
    app.location.store = (string) => {
        app.location.string = string;
        localStorage.setItem(app.location.key, string);
    }
    app.updateLocation = async () => { // Get the GPS location, reverse geocode it, and update the weather
        app.ui.text.location.textContent = "Getting Location...";
        app.ui.button.location.classList.add('aquiring');
        try {
            app.location.data = await (new Promise((resolve, reject)=>{
                navigator.geolocation.getCurrentPosition(resolve, reject)
            }));
        } catch (e) {
            console.warn(e.message);
            if (e.code == 1) {
                app.ui.text.location.textContent = "Location access was denied";
                app.ui.text.location.classList.add('error');
                app.ui.button.location.classList.remove('aquiring');
                app.ui.button.location.textContent = "location_disabled";
                app.ui.button.location.classList.add('error');
                setTimeout(()=>{app.ui.text.location.classList.remove('error');}, 5000);
            }
            return;
        }
        app.location.isCurrent = true;
        app.location.store(`${app.location.data.coords.latitude},${app.location.data.coords.longitude}`);
        app.ui.button.location.classList.remove('aquiring');
        app.updateLocationText();
        app.updateWeather();
    };
    app.updateLocationText = async () => { // Reverse geocode
        var encodedLocation = btoa(app.location.string);
        console.log(app.location.string, encodedLocation);
        console.log('Got location. Reverse geocoding...');
        var response = await fetch(`api/?a=r&d=${encodedLocation}`);
        var json = await response.json();
        app.locationJson = json;
        var a = json.address;
        var street = (a.road !== undefined) ? `${a.road}, ` : '';
        var town = a.town||a.city_district||a.city;
        app.location.address = `${street}${town}`;
        app.ui.text.location.innerHTML = ((app.location.isCurrent)? "Current Location<br>" : "") + app.location.address;
        var indexOfMatch = -1;
        for (var i = 0; i < app.saved.places.length; i++) {
            if (app.saved.places[i].addr == app.location.address) {
                indexOfMatch = i;
                break;
            }
        }
        if (!app.location.isCurrent && indexOfMatch === -1) { // Searched and is not already saved
            // Is not in Saved Places
            app.saved.add(app.location.address, app.location.string);
            app.saved.store();
            app.saved.load();
        }
    };
    app.locationSearch = async () => { // Geocode a location, reverse geocode it, and update the weather
        var location = app.ui.input.search.value;
        var encodedLocation = btoa(location);
        var response = await fetch(`api?a=g&d=${encodedLocation}`);
        var json = await response.json();
        console.log(json);
        app.searchJSON = json;
        var place = json[0];
        app.location.string = `${place.lat},${place.lon}`;
        app.location.isCurrent = false;
        app.updateLocationText();
        app.updateWeather();
        app.q('.content').classList.remove('nav-open');
    }

    app.updateWeather = async () => { // Query the API and update each field
        var encodedLocation = btoa(app.location.string);
        console.log(app.location.string, encodedLocation);
        console.log('Got location. Getting weather...');
        var response = await fetch(`api/?a=w&d=${encodedLocation}`);
        // console.log(response);
        var json = await response.json();
        console.log(json);
        app.weatherData = json;

        // Currently
        let currently = json.currently;
        app.ui.text.currently.temperature.innerHTML = `${Math.round(currently.temperature)}&deg;F`;
        app.ui.text.currently.condition.textContent = currently.summary;

        var today = json.daily.data[0];
        app.ui.text.today.condition.textContent = today.summary;
        app.ui.text.today.temperature.innerHTML = `↑${Math.round(today.temperatureHigh)} | ↓${Math.round(today.temperatureLow)}&deg;F`;


        var icon = currently.icon;
        app.skycons.set(app.ui.canvas.currently, icon);
        if (icon.includes('day')) {
            app.q('.content').classList.remove('night');
            app.q('.content').classList.add('day');
        } else if (icon.includes('night')) {
            app.q('.content').classList.remove('day');
            app.q('.content').classList.add('night');
        } else {
            var now = new Date();
            var sunrise = json.daily.data[0].sunriseTime * 1000;
            var sunset = json.daily.data[0].sunsetTime * 1000;
            if (now.getTime() <= sunrise || now.getTime() >= sunset) {
                app.q('.content').classList.remove('day');
                app.q('.content').classList.add('night');
            } else {
                app.q('.content').classList.remove('night');
                app.q('.content').classList.remove('day');
            }
        }

        app.q('#current').classList.remove('clear');
        app.q('#current').classList.remove('part-cloud');
        app.q('#current').classList.remove('rain');
        app.q('#current').classList.remove('snow');
        app.q('#current').classList.remove('sleet');
        app.q('#current').classList.remove('wind');
        app.q('#current').classList.remove('fog');
        app.q('#current').classList.remove('cloudy');

        app.q('header').classList.remove('clear');
        app.q('header').classList.remove('part-cloud');
        app.q('header').classList.remove('rain');
        app.q('header').classList.remove('snow');
        app.q('header').classList.remove('sleet');
        app.q('header').classList.remove('wind');
        app.q('header').classList.remove('fog');
        app.q('header').classList.remove('cloudy');

        if (icon.includes('clear')) {
            app.q('#current').classList.add('clear');
            app.q('header').classList.add('clear');
        } else if (icon.includes('partly-cloudy')) {
            app.q('#current').classList.add('part-cloud');
            app.q('header').classList.add('part-cloud');
        } else if (icon.includes('rain')) {
            app.q('#current').classList.add('rain');
            app.q('header').classList.add('rain');
        } else if (icon.includes('snow')) {
            app.q('#current').classList.add('snow');
            app.q('header').classList.add('snow');
        } else if (icon.includes('sleet')) {
            app.q('#current').classList.add('sleet');
            app.q('header').classList.add('sleet');
        } else if (icon.includes('wind')) {
            app.q('#current').classList.add('wind');
            app.q('header').classList.add('wind');
        } else if (icon.includes('fog')) {
            app.q('#current').classList.add('fog');
            app.q('header').classList.add('fog');
        } else if (icon.includes('cloudy')) {
            app.q('#current').classList.add('cloudy');
            app.q('header').classList.add('cloudy');
        }

        var color = window.getComputedStyle(document.querySelector('#current')).getPropertyValue("background-color");
        document.querySelector("meta[name=theme-color]").setAttribute("color", color);
    };
    app.timer = () => { // Update the 'Last updated' timer
        var lastUpdate = new Date(app.weatherData.currently.time * 1000);
        var now = new Date();
        var elapsed = now.getTime() - lastUpdate.getTime();
        elapsed /= 1000.0;
        elapsed /= 60;
        var text = "sometime";
        if (elapsed < 1) { // Less than a minute
            text = "just now";
        } else if (elapsed < 2) { // Just over a minute
            text = "1 minute ago";
        } else if (elapsed < 60) { // Less than an hour
            text = `${Math.floor(elapsed)} minutes ago`;
        } else if (elapsed < 120) { // Just over an hour
            text = `1 hour ago`;
        } else if (elapsed < 1440) { // Less than a day
            text = `${Math.floor(elapsed / 60)} hours ago`
        }
        app.ui.text.currently.lastUpdate.textContent = `Last updated: ${text}`;
        if (elapsed >= 5) {
            app.ui.text.currently.lastUpdate.innerHTML += '&nbsp;<a href="#" id="updateNow">Update Now</a>';
            app.q('#updateNow').onclick = (e) => {
                e.preventDefault();
                app.updateWeather();
                app.timer();
            };
        }
    }
    app.closeOverlay = (e?: Event) => { // Close the overlay
        if (e !== undefined) {
            e.preventDefault();
        } 
        app.q('.content').classList.remove('nav-open');
        document.body.classList.remove('scroll-lock');
    }

    /*
     * Saved Places
     */
    app.saved.add = (addr, coords) => { // Add a place to Saved Places
        app.saved.places.push({addr, coords});
    }
    app.saved.remove = (index) => { // Remove a place from Saved Places
        app.saved.places.splice(index);
    }
    app.saved.swap = (i1, i2) => { // Swap two Saved Places entries. Not implemented in the UI yet.
        var a = app.saved.places[i2];
        app.saved.places[i2] = app.saved.places[i1];
        app.saved.places[i1] = a;
    }
    app.saved.set = (index, addr, coords) => { // Update a Saved Places entry
        app.saved.places[index] = {addr, coords};
    }
    app.saved.get = (index) => { // Get a Saved Places entry
        return app.saved.places[index];
    }
    app.saved.load = () => {
        app.saved.places = JSON.parse(localStorage.getItem(app.saved.key)) || [];
        if (app.saved.places.length > 0) {
            app.ui.other.places.innerHTML = "";
            var i = 0;
            app.saved.places.forEach((e) => {
                var a = document.createElement('a');
                a.href = '#';
                a.setAttribute('data', btoa(e.coords));
                a.setAttribute('data-index', i.toString());
                a.textContent = e.addr || "Unknown Place";
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    let t = (<HTMLAnchorElement>(e.target)); // We love shimming!
                    if (t.getAttribute('data')) { 
                        app.location.store(atob(t.getAttribute('data')));
                        app.ui.text.location.textContent = t.innerText;
                        app.updateWeather();
                        app.closeOverlay();
                    }
                    // console.log(e);
                });
                var d = document.createElement('div');
                d.classList.add('edit');
                var del = document.createElement('a');
                del.href = "#";
                del.classList.add('material-icons-two-tone');
                del.textContent = "delete";
                del.addEventListener('click', e => {
                    e.preventDefault();
                    var i = parseInt((<HTMLElement>(e.target)).parentElement.parentElement.getAttribute('data-index'));
                    app.saved.remove(i);
                    app.saved.store();
                    app.saved.load();
                });
                d.appendChild(del);
                a.appendChild(d);
                app.ui.other.places.appendChild(a);
                app.ui.other.places.appendChild(document.createElement('br'));
                i++;
            });
        }
    }
    app.saved.store = () => {
        localStorage.setItem(app.saved.key, JSON.stringify(app.saved.places));
    }

    /*
     * Touch/UI Interaction
     */
    app.ui.button.location.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        app.updateLocation();
    });
    app.ui.button.menu.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        app.q('.content').classList.add('nav-open');
        document.body.classList.add('scroll-lock');
    });
    app.ui.button.back.addEventListener('click', app.closeOverlay);
    app.ui.other.navUnderlay.addEventListener('click', app.closeOverlay);
    app.ui.input.search.addEventListener('change', (e) => {
        app.locationSearch();
        app.ui.input.search.blur();
    });
    app.ui.button.edit.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        if (app.saved.editing) { // We *were* editing
            app.ui.button.edit.textContent = "edit";
            app.ui.other.places.classList.remove('editing');
        } else {
            app.ui.button.edit.textContent = "cancel";
            app.ui.other.places.classList.add('editing');
        }
        app.saved.editing = !app.saved.editing;
    });
    app.ui.button.settings.addEventListener('click', e => {
        e.preventDefault();
        app.closeOverlay();
        app.ui.other.settings.classList.add('show');
        document.body.classList.add('scroll-lock');
    });
    app.ui.button.settingsBack.addEventListener('click', e => {
        e.preventDefault();
        app.ui.other.settings.classList.remove('show');
        document.body.classList.remove('scroll-lock');
    });

    /*
     * Gestures
     */
    document.addEventListener('touchstart', (e) => {
        // console.log(e);
        if (app.touch.start.x == undefined && app.touch.start.x == undefined) {
            app.touch.start = {
                x: e.touches[0].pageX,
                y: e.touches[0].pageY
            };
        }
    });
    document.addEventListener('touchmove', (e) => {
        // console.log(e);
        app.touch.end = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY
        };
        app.touch.movement = {
            x: app.touch.end.x - app.touch.start.x,
            y: app.touch.end.y - app.touch.start.y
        }

        if (app.touch.movement.x >= app.touch.MIN_DISTANCE * window.innerWidth) {
            // It has moved more than the minimum distance to the right
            // Peek the drawer
            // I could do something better than this but that'll wait for later
            app.ui.other.drawer.classList.add('peek');
        } else {
            // It hasn't moved more than the minimum distance to the right
            // Make sure the drawer is closed
            app.ui.other.drawer.classList.remove('peek');
        }
    });
    document.addEventListener('touchend', (e) => {
        // console.log(e);
        app.ui.other.drawer.classList.remove('peek');

        if (app.touch.movement.x >= app.touch.MIN_DISTANCE * window.innerWidth) {
            // It moved more than the minimum distance to the right
            // Open the drawer
            app.q('.content').classList.add('nav-open');
        } else if (app.touch.movement.x <= -app.touch.MIN_DISTANCE * window.innerWidth) {
            // It moved more than the minimum distance to the left
            // Make sure the drawer is closed
            app.q('.content').classList.remove('nav-open');
        }

        app.touch.start = {
            x:undefined,
            y:undefined
        };
    });

    /*
     * Skycons
     */
    app.skycons = new Skycons({'color': 'white', 'resizeClear': true});
    app.skycons.add(app.ui.canvas.currently, 'clear-day');
    app.skycons.play();

    app.saved.load();

    app.updateLocationText();
    await app.updateWeather();

    setInterval(app.timer, 5000);
    app.timer();
};
app.init();