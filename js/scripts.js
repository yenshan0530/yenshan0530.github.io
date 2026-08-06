// Back-to-top button
var btn = $('#back-to-top-button');

$(window).scroll(function() {
    if ($(window).scrollTop() > 300) {
        btn.addClass('show');
    } else {
        btn.removeClass('show');
    }
});

btn.on('click', function(e) {
    e.preventDefault();
    $('html, body').animate({scrollTop: 0}, '300');
});


// Toggle "See More" / "See Less" text for abstracts
function toggleText(linkElement) {
    var collapseId = linkElement.getAttribute('href').substring(1);
    var collapseElement = document.getElementById(collapseId);

    $(collapseElement).on('hidden.bs.collapse', function() {
        linkElement.textContent = '... See More';
    });
    $(collapseElement).on('shown.bs.collapse', function() {
        linkElement.textContent = '... See Less';
    });
}

document.querySelectorAll('[data-toggle="collapse"]').forEach(function(linkElement) {
    toggleText(linkElement);
});


// Smooth scroll to a section by selector
function scrollToTopDiv(divTag) {
    $(divTag)[0].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


// Dark/light theme toggle
function toggleTheme() {
    const bodyEl = document.body;
    const buttonEl = document.querySelector('.toggle-theme-button');

    if (bodyEl.classList.contains('light-theme')) {
        bodyEl.classList.remove('light-theme');
        bodyEl.classList.add('dark-theme');
        buttonEl.innerText = '☀️';
    } else {
        bodyEl.classList.remove('dark-theme');
        bodyEl.classList.add('light-theme');
        buttonEl.innerText = '🌙';
    }
}


// Hide theme toggle while scrolling, show at top
window.addEventListener('scroll', function() {
    const buttonEl = document.querySelector('.toggle-theme-button');
    if (window.scrollY > 0) {
        buttonEl.style.display = 'none';
    } else {
        buttonEl.style.display = 'block';
    }
});


// Progress bar
window.onscroll = function() { progressBar(); };

function progressBar() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
}


// All Isotope logic only runs on pages that have the #projects element
if ($('#projects').length > 0) {


// Isotope layout update when abstracts expand/collapse
function updateLayout(collapseElement, isExpanding) {
    var iso = new Isotope('#projects', {
        itemSelector: '.project',
        layoutMode: 'vertical'
    });

    if (isExpanding) {
        $(collapseElement).css('display', 'none');
        iso.arrange();
        setTimeout(function() {
            $(collapseElement).css('display', '');
            iso.arrange();
        }, 300);
    } else {
        iso.arrange();
        setTimeout(function() {
            $(collapseElement).css('display', 'none');
            iso.arrange();
        }, 300);
    }
}

$('.collapse').on('show.bs.collapse', function() {
    updateLayout(this, true);
}).on('hide.bs.collapse', function() {
    updateLayout(this, false);
});


// Isotope pagination for research
var itemsPerPageDefault = 5;
var currentNumberPages = 1;
var currentPage = 1;
var currentFilter = '*';
var filterAtribute = 'data-filter';
var pageAtribute = 'data-page-project';
var pagerClass = 'isotope-pager-project';
var $projects = $('#projects').isotope({
    itemcategory: '.project',
    layoutMode: 'vertical'
});

function filterCategoryProjects(category) {
    $projects.isotope({ filter: category });
}

function showPageProjects(n) {
    currentPage = n;
    var category = '.project';
    category += (currentFilter != '*') ? '[' + filterAtribute + '="' + currentFilter + '"]' : '';
    category += '[' + pageAtribute + '="' + currentPage + '"]';
    filterCategoryProjects(category);
}

function updatePagerProjects() {
    var $isotopePager = ($('.' + pagerClass).length == 0)
        ? $('<div class="' + pagerClass + '"></div>')
        : $('.' + pagerClass);
    $isotopePager.html('');

    var $previous = $('<button class="pager" id="previous-page">&#8592; previous</button>');
    $previous.click(function() {
        if (currentPage > 1) {
            showPageProjects(currentPage - 1);
            updatePagerProjects();
            scrollToTopDiv('#research');
        }
    });
    if (currentPage === 1) $previous.prop('disabled', true);

    var $next = $('<button class="pager" id="next-page">next &#8594;</button>');
    $next.click(function() {
        if (currentPage < currentNumberPages) {
            showPageProjects(currentPage + 1);
            updatePagerProjects();
            scrollToTopDiv('#research');
        }
    });
    if (currentPage === currentNumberPages) $next.prop('disabled', true);

    var $currentPageIndicator = $('<span class="current-page">&nbsp; page ' + currentPage + ' of ' + currentNumberPages + ' &nbsp;</span>');

    $previous.appendTo($isotopePager);
    $currentPageIndicator.appendTo($isotopePager);
    $next.appendTo($isotopePager);
    $projects.after($isotopePager);
}

function setPaginationProjects() {
    var item = 1;
    var page = 1;
    var category = '.project';
    category += (currentFilter != '*') ? '[' + filterAtribute + '="' + currentFilter + '"]' : '';

    $projects.children(category).each(function() {
        if (item > itemsPerPageDefault) {
            page++;
            item = 1;
        }
        $(this).attr(pageAtribute, page);
        item++;
    });
    currentNumberPages = page;
    updatePagerProjects();
}

function initializeIsotopeProjects() {
    setPaginationProjects();
    showPageProjects(1);

    $('#filters-project .filter-button').click(function() {
        $('#filters-project .filter-button').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).attr('data-filter');
        setPaginationProjects();
        showPageProjects(1);
        updatePagerProjects();
    });
}


// Wait for images to load before initializing isotope
$(document).ready(function() {
    var images = $('img[src$=".jpg"], img[src$=".jpeg"], img[src$=".png"]').get();
    var imageLoadPromises = images.map(function(img) {
        return new Promise(function(resolve) {
            if (img.complete) {
                resolve();
            } else {
                img.onload = resolve;
            }
        });
    });

    Promise.all(imageLoadPromises).then(function() {
        initializeIsotopeProjects();
    });
});

} // end #projects guard


// Set theme based on time of day (dark 7PM–7AM, light otherwise)
document.addEventListener('DOMContentLoaded', function() {
    const buttonEl = document.querySelector('.toggle-theme-button');
    var currentHour = new Date().getHours();

    if (currentHour > 19 || currentHour <= 7) {
        document.body.classList.add('dark-theme');
        buttonEl.innerText = '☀️';
    } else {
        document.body.classList.add('light-theme');
        buttonEl.innerText = '🌙';
    }
});


// Auto-update copyright year in footer
var yearEl = document.getElementById("currentYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();


// Single-axis category filter, shared by the writing and photography pages.
// Cards carry data-category; clicking the active chip resets back to "all".
function initCategoryFilter(filterId, cardSelector, emptyId) {
    var box = document.getElementById(filterId);
    if (!box) return;

    var cards = document.querySelectorAll(cardSelector);
    var empty = document.getElementById(emptyId);
    var buttons = box.querySelectorAll('.filter-button');

    Array.prototype.forEach.call(buttons, function (btn) {
        btn.addEventListener('click', function () {
            var value = btn.getAttribute('data-value');
            if (btn.classList.contains('active') && value !== '*') value = '*';

            Array.prototype.forEach.call(buttons, function (b) {
                b.classList.toggle('active', b.getAttribute('data-value') === value);
            });

            var shown = 0;
            Array.prototype.forEach.call(cards, function (card) {
                var on = (value === '*' || card.getAttribute('data-category') === value);
                card.style.display = on ? '' : 'none';
                if (on) shown++;
            });

            if (empty) empty.style.display = shown ? 'none' : '';
        });
    });
}

initCategoryFilter('writing-filters', '.writing-card', 'writing-empty');
initCategoryFilter('photo-filters', '.album', 'photo-empty');


// Photo lightbox (photography albums + trip galleries)
(function () {
    var items = Array.prototype.slice.call(
        document.querySelectorAll('.album-cover, .album-thumb')
    );
    if (!items.length) return;

    var overlay = document.createElement('div');
    overlay.id = 'lightbox';
    overlay.innerHTML =
        '<button class="lightbox-close" aria-label="Close">&times;</button>' +
        '<button class="lightbox-prev" aria-label="Previous">&#10094;</button>' +
        '<img id="lightbox-img" alt="">' +
        '<button class="lightbox-next" aria-label="Next">&#10095;</button>' +
        '<div id="lightbox-caption"></div>';
    document.body.appendChild(overlay);

    var imgEl = overlay.querySelector('#lightbox-img');
    var capEl = overlay.querySelector('#lightbox-caption');
    var index = 0;

    function show(i) {
        index = (i + items.length) % items.length;
        var t = items[index];
        imgEl.src = t.getAttribute('data-full') || t.src;
        capEl.textContent = t.getAttribute('data-caption') || '';
    }

    function open(i) {
        show(i);
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    items.forEach(function (t, i) {
        t.addEventListener('click', function () { open(i); });
    });

    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    overlay.querySelector('.lightbox-prev').addEventListener('click', function (e) {
        e.stopPropagation(); show(index - 1);
    });
    overlay.querySelector('.lightbox-next').addEventListener('click', function (e) {
        e.stopPropagation(); show(index + 1);
    });
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
    });
})();
