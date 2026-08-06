// Interactive travel map: Leaflet world map + multi-axis filters + chronological timeline.
//
// Two independent layers of narrowing:
//   filters    — year × region × purpose, AND-combined, drive map + timeline + list
//   selection  — click pins/dots to isolate one or more trips on the map (multi-select)
// A trip is drawn only if it passes the filters AND (nothing is selected OR it is selected).
//
// Only runs on pages with #travel-map.

(function () {
    var el = document.getElementById('travel-map');
    if (!el || typeof L === 'undefined') return;

    var dataEl = document.getElementById('travel-map-data');
    var data = { home: null, trips: [] };
    try { data = JSON.parse(dataEl.textContent) || data; } catch (e) { /* keep defaults */ }

    var TILES = {
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    };
    var ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
                 'contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    var ACCENT = '#bd5d38';
    var HOME_COLOR = '#2d7d6f';

    function num(attr, fallback) {
        var v = parseFloat(el.getAttribute(attr));
        return isNaN(v) ? fallback : v;
    }

    var map = L.map('travel-map', {
        worldCopyJump: true,
        scrollWheelZoom: false,
        minZoom: 1
    }).setView([num('data-center-lat', 20), num('data-center-lon', 10)], num('data-zoom', 2));

    function theme() {
        return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    }

    var tiles = L.tileLayer(TILES[theme()], {
        attribution: ATTRIB, subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    new MutationObserver(function () {
        tiles.setUrl(TILES[theme()]);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function valid(p) {
        return p && typeof p.lat === 'number' && typeof p.lon === 'number';
    }

    // ---- Home base: a landmark, never filtered, never drags the viewport -----
    if (valid(data.home)) {
        L.circleMarker([data.home.lat, data.home.lon], {
            radius: 8, color: HOME_COLOR, weight: 3,
            fillColor: '#ffffff', fillOpacity: 1
        }).addTo(map)
          .bindTooltip('🏠 ' + esc(data.home.name), { direction: 'top', offset: [0, -8] })
          .bindPopup('<div class="trip-popup"><span class="trip-popup-title">🏠 ' +
                     esc(data.home.name) + '</span><p class="trip-popup-summary">Home base.</p></div>');
    }

    // ---- Build one registry entry per trip -----------------------------------
    var registry = [];

    (data.trips || []).forEach(function (t, tripIndex) {
        var places = (t.places || []).filter(valid);
        if (!places.length) return;

        var coords = places.map(function (p) { return [p.lat, p.lon]; });
        var layers = [];

        if (places.length > 1) {
            layers.push(L.polyline(coords, {
                color: ACCENT, weight: 2,
                opacity: t.upcoming ? 0.35 : 0.5,
                dashArray: '5, 6'
            }));
        }

        // The preview is trip-level, so it is bound to the NORTHERNMOST stop only.
        // Popups open upward, so anchoring at the top of the route means the
        // preview sits in the cleared band above it rather than over the dashes.
        var topIdx = 0;
        places.forEach(function (p, i) { if (p.lat > places[topIdx].lat) topIdx = i; });

        var meta = [t.date, t.location].filter(Boolean).map(esc).join(' · ');

        var html = '<div class="trip-popup">';
        if (t.cover) html += '<img src="' + esc(t.cover) + '" alt="">';
        if (meta) html += '<div class="trip-popup-meta">' + meta + '</div>';
        html += t.url
            ? '<a class="trip-popup-title" href="' + esc(t.url) + '">' + esc(t.title) + '</a>'
            : '<span class="trip-popup-title">' + esc(t.title) + '</span>';
        if (t.event) html += '<div class="trip-popup-event">' + esc(t.event) + '</div>';
        if (t.upcoming) html += '<div class="trip-popup-stop">upcoming</div>';
        if (places.length > 1) html += '<div class="trip-popup-stop">' + places.length + ' stops</div>';
        if (t.summary) html += '<p class="trip-popup-summary">' + esc(t.summary) + '</p>';
        if (t.url) html += '<a class="trip-popup-link" href="' + esc(t.url) + '">read the post &rarr;</a>';
        html += '</div>';

        var topMarker = null;

        places.forEach(function (p, i) {
            var marker = L.circleMarker([p.lat, p.lon], {
                radius: 6,
                color: ACCENT,
                weight: 2,
                fillColor: t.upcoming ? '#ffffff' : ACCENT,
                fillOpacity: t.upcoming ? 0.9 : 0.65,
                dashArray: t.upcoming ? '3, 3' : null
            });

            // Every stop names itself on hover; only the top one carries the popup
            marker.bindTooltip(esc(p.name), { direction: 'top', offset: [0, -8] });

            if (i === topIdx) {
                marker.bindPopup(html, { maxWidth: 240, autoPanPadding: L.point(30, 30) });
                topMarker = marker;
            }

            marker.on('click', function (e) {
                L.DomEvent.stopPropagation(e);   // keep the map's own click handler out of it
                toggleTrip(tripIndex);
            });

            layers.push(marker);
        });

        registry.push({
            index: tripIndex,
            title: t.title,
            year: t.year,
            region: t.region,
            purpose: t.purpose || [],
            coords: coords,
            layers: layers,
            topMarker: topMarker,
            // Roughly how tall the popup renders; used to reserve headroom
            clearance: t.cover ? 300 : 195,
            visible: true          // passes the current filters
        });
    });

    // ---- State ---------------------------------------------------------------
    var selection = [];            // trip indices; empty means "show everything"
    var filterState = {};

    var timelineEl  = document.getElementById('trip-timeline');
    var selBar      = document.getElementById('selection-bar');
    var selCount    = document.getElementById('selection-count');
    var selClear    = document.getElementById('selection-clear');

    function isSelected(i) { return selection.indexOf(i) !== -1; }

    // Drawn on the map only if it survives both the filters and the selection
    function isShown(r) {
        return r.visible && (selection.length === 0 || isSelected(r.index));
    }

    // ---- Rendering -----------------------------------------------------------
    function renderLayers() {
        registry.forEach(function (r) {
            var on = isShown(r);
            r.layers.forEach(function (layer) {
                if (on) {
                    if (!map.hasLayer(layer)) layer.addTo(map);
                } else if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
        });
    }

    function renderSelectionUI() {
        if (timelineEl) {
            Array.prototype.forEach.call(timelineEl.querySelectorAll('.timeline-item'), function (n) {
                n.classList.toggle('active', isSelected(parseInt(n.getAttribute('data-index'), 10)));
            });
        }
        if (!selBar) return;

        if (selection.length === 0) {
            selBar.style.display = 'none';
        } else {
            selBar.style.display = '';
            var names = registry
                .filter(function (r) { return isSelected(r.index); })
                .map(function (r) { return r.title; });
            selCount.textContent = names.length === 1
                ? 'showing only: ' + names[0]
                : 'showing ' + names.length + ' trips: ' + names.join(', ');
        }
    }

    // `clearance` reserves headroom at the top of the viewport for the popup, so
    // the preview never lands on the dashed route it belongs to.
    function fitToShown(animate, clearance) {
        var coords = registry.reduce(function (acc, r) {
            return isShown(r) ? acc.concat(r.coords) : acc;
        }, []);
        if (!coords.length) return;

        var pad = 45;
        var top = clearance || pad;
        var cap = Math.round(map.getSize().y * 0.55);   // never squeeze the route too flat
        if (top > cap) top = cap;

        var opts = {
            paddingTopLeft: L.point(pad, top),
            paddingBottomRight: L.point(pad, pad),
            maxZoom: selection.length ? (coords.length > 1 ? 7 : 6) : 5
        };

        if (animate) { opts.duration = 0.7; map.flyToBounds(coords, opts); }
        else map.fitBounds(coords, opts);
    }

    function refresh(animate, clearance) {
        renderLayers();
        renderSelectionUI();
        fitToShown(animate, clearance);
    }

    // ---- Selection -----------------------------------------------------------
    function toggleTrip(index) {
        var r = registry.filter(function (x) { return x.index === index; })[0];
        if (!r || !r.visible) return;

        var at = selection.indexOf(index);
        var adding = at === -1;

        if (adding) selection.push(index);
        else selection.splice(at, 1);

        map.closePopup();
        refresh(true, adding ? r.clearance : null);

        // Opening a popup only makes sense for the trip you just added
        if (adding && r.topMarker) {
            map.once('moveend', function () { r.topMarker.openPopup(); });
        }
    }

    function clearSelection() {
        if (!selection.length) return;
        selection = [];
        map.closePopup();
        refresh(true);
    }

    if (timelineEl) {
        Array.prototype.forEach.call(timelineEl.querySelectorAll('.timeline-item'), function (item) {
            item.addEventListener('click', function () {
                toggleTrip(parseInt(item.getAttribute('data-index'), 10));
            });
        });
    }

    if (selClear) selClear.addEventListener('click', clearSelection);

    map.on('click', function () {
        map.scrollWheelZoom.enable();
        clearSelection();
    });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') clearSelection();
    });

    // ---- Filters (year × region × purpose, AND-combined) ---------------------
    function matches(attrs) {
        return Object.keys(filterState).every(function (k) {
            var want = filterState[k];
            if (want === '*') return true;
            var got = attrs[k];
            if (Array.isArray(got)) return got.indexOf(want) !== -1;
            return got === want;
        });
    }

    function nodeAttrs(node) {
        return {
            year: node.getAttribute('data-year'),
            region: node.getAttribute('data-region'),
            purpose: (node.getAttribute('data-purpose') || '').split(' ').filter(Boolean)
        };
    }

    function applyFilters() {
        var anyVisible = false;

        registry.forEach(function (r) {
            r.visible = matches({ year: r.year, region: r.region, purpose: r.purpose });
            if (r.visible) anyVisible = true;
        });

        // A filtered-out trip can't stay selected
        selection = selection.filter(function (i) {
            var r = registry.filter(function (x) { return x.index === i; })[0];
            return r && r.visible;
        });

        if (timelineEl) {
            Array.prototype.forEach.call(timelineEl.querySelectorAll('.timeline-item'), function (n) {
                n.style.display = matches(nodeAttrs(n)) ? '' : 'none';
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('.trip-card'), function (card) {
            card.style.display = matches(nodeAttrs(card)) ? '' : 'none';
        });

        var empty = document.getElementById('filter-empty');
        if (empty) empty.style.display = anyVisible ? 'none' : '';

        refresh(false);
    }

    Array.prototype.forEach.call(document.querySelectorAll('.filter-row'), function (row) {
        var key = row.getAttribute('data-filter-key');
        filterState[key] = '*';

        Array.prototype.forEach.call(row.querySelectorAll('.filter-button'), function (btn) {
            btn.addEventListener('click', function () {
                var value = btn.getAttribute('data-value');
                if (filterState[key] === value && value !== '*') value = '*';

                filterState[key] = value;
                Array.prototype.forEach.call(row.querySelectorAll('.filter-button'), function (b) {
                    b.classList.toggle('active', b.getAttribute('data-value') === value);
                });
                applyFilters();
            });
        });
    });

    refresh(false);
})();
