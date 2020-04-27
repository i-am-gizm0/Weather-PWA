/*
 * This service worker code was derived from two different samples on
 * https://serviceworke.rs ("Cache and update" and "Offline Fallback")
 */

const CACHE_NAME = "wx-4-27-2020";
const URLS_TO_CACHE = [
    '',
    'index.html',
    'scripts/app.js',
    'styles/main.css',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Two+Tone',
    'https://fonts.gstatic.com/s/raleway/v14/1Ptsg8zYS_SKggPNwE44TYFq.woff2',
    'https://fonts.gstatic.com/s/raleway/v14/1Ptug8zYS_SKggPNyC0ITw.woff2',
    'https://fonts.gstatic.com/s/sen/v1/6xKjdSxYI9_3nPWN.woff2',
    'https://fonts.googleapis.com/css2?family=Raleway:wght@100;300;400&family=Sen:wght@300;400&display=swap'
];

self.addEventListener('install', function(evt) {
    console.log('[ SW ]\tInstalling service worker...');

    evt.waitUntil(precache());
});

self.addEventListener('fetch', function(evt) {

    console.log(`[ SW ]\t${evt.request.method}ing ${evt.request.url} (accepts ${evt.request.headers.get('accept')})`);

    var request = evt.request;

    evt.respondWith(fromNetwork(evt.request, 5000).catch(async function() {
        return fromCache(evt.request).catch(async () => {
            console.log('No Cache! Returning Offline');
            console.log('return nothing');
            return Promise.reject('null');
        });
    }));
});

async function precache() {
    const cache = await caches.open(CACHE_NAME);
    return cache.addAll(URLS_TO_CACHE);
}

function fromNetwork(request, timeout) {
    console.log('[ SW ]\tLoading from network (fails in ' + timeout + 'ms)');
    return new Promise(function (fulfill, reject) {
        var timeoutID = setTimeout(reject, timeout);

        fetch(request).then(async function(response) {
            console.log('[ SW ]\tLoaded from network');
            clearTimeout(timeoutID);

            update(request);
            fulfill(response);
        }, reject);
    });
}

async function update(request) {
    console.log('updating cache for', request);
    return caches.open(CACHE_NAME).then(async (cache) => {
        const response = await fetch(request);
        return cache.put(request, response);
    });
}

async function fromCache(request, timeout) {
    console.log('[ SW ]\tOpening cache ' + CACHE_NAME + ' for request', request);
    const cache = await caches.open(CACHE_NAME);
    console.log('[ SW ]\tOpened cache ' + CACHE_NAME);
    console.log('[ SW ]\tAttempting to match request', request);
    const matching = await cache.match(request);
    console.log('[ SW ]\tMatching:', matching);
    console.log('[ SW ]\tLoaded from cache');
    return matching || Promise.reject('no-cache');
}