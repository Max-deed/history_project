function removeMiniPreview() {
  $('.tl-timemarker-content-container').hide();
  $('.tl-timemarker-media-container').hide();

  setTimeout(function () {
    $('.tl-timemarker-content-container').hide();
    $('.tl-timemarker-media-container').hide();
  }, 300);
}

$(function () {
  var people = {};
  var factsData = { pairs: [] };
  var timeline = null;

  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildLinks(items, emptyText) {
    if (!items || !items.length) return '<p>' + emptyText + '</p>';

    var html = '<ul>';
    $.each(items, function (_, item) {
      html += '<li><a href="' + esc(item.file || '#') + '" target="_blank" rel="noopener noreferrer">' +
        esc(item.title || 'Файл') + '</a></li>';
    });
    html += '</ul>';
    return html;
  }

  function buildVideo(items) {
    if (!items || !items.length) return '<p>Видео пока не добавлено.</p>';

    var html = '';
    $.each(items, function (_, item) {
      html += '<div class="person-video">';
      html += '<p><strong>' + esc(item.title || 'Видео') + '</strong></p>';
      html += '<video controls preload="metadata"' + (item.poster ? ' poster="' + esc(item.poster) + '"' : '') + '>';
      html += '<source src="' + esc(item.file || '') + '" type="video/mp4">';
      html += 'Ваш браузер не поддерживает видео.';
      html += '</video>';
      html += '</div>';
    });
    return html;
  }

  function buildAudio(items) {
    if (!items || !items.length) return '<p>Аудио пока не добавлено.</p>';

    var html = '';
    $.each(items, function (_, item) {
      html += '<div class="person-audio">';
      html += '<p><strong>' + esc(item.title || 'Аудио') + '</strong></p>';
      html += '<audio controls preload="metadata">';
      html += '<source src="' + esc(item.file || '') + '" type="audio/mpeg">';
      html += 'Ваш браузер не поддерживает аудио.';
      html += '</audio>';
      html += '</div>';
    });
    return html;
  }

  function buildFacts(items, emptyText) {
    if (!items || !items.length) return '<p>' + emptyText + '</p>';

    var html = '<ul>';
    $.each(items, function (_, item) {
      html += '<li>' + esc(item) + '</li>';
    });
    html += '</ul>';
    return html;
  }

  function slideCard(personId) {
    var p = people[personId];
    if (!p) return '<p>Нет данных.</p>';

    return (
      '<div class="timeline-slide-card">' +
        (p.media && p.media.photo ? '<img src="' + esc(p.media.photo) + '" alt="' + esc(p.name) + '">' : '') +
        '<h3>' + esc(p.name) + '</h3>' +
      '</div>'
    );
  }

  function renderTimelinePairs() {
    setTimeout(function () {
      $('.timeline-pair-placeholder').each(function () {
        var $node = $(this);
        var defendantId = $node.attr('data-defendant-id');
        var prosecutionId = $node.attr('data-prosecution-id');

        $node.html(
          '<div class="timeline-slide-pair">' +
            slideCard(defendantId) +
            slideCard(prosecutionId) +
          '</div>'
        );
      });
    }, 150);
  }

  function personDetails(personId, personFacts) {
    var p = people[personId];
    if (!p) return '<p>Данные участника не найдены.</p>';

    var html = '<div class="person-detail-full">';

    html += '<div class="person-detail-header">';
    if (p.media && p.media.photo) {
      html += '<img src="' + esc(p.media.photo) + '" alt="' + esc(p.name) + '">';
    }

    html += '<div class="person-detail-meta">';
    html += '<h3>' + esc(p.name) + '</h3>';
    if (p.role) html += '<p><strong>Раздел:</strong> ' + esc(p.role) + '</p>';
    if (p.short_bio) html += '<p><strong>Краткая справка:</strong> ' + esc(p.short_bio) + '</p>';
    html += '</div>';
    html += '</div>';

    html += '<div class="person-detail-section">';
    html += '<h4>Ключевые тезисы</h4>';
    html += buildFacts(personFacts, 'Факты для этого участника пока не добавлены.');
    html += '</div>';

    html += '<div class="person-detail-section">';
    html += '<h4>Видео</h4>';
    html += buildVideo(p.media && p.media.video ? p.media.video : []);
    html += '</div>';

    html += '<div class="person-detail-section">';
    html += '<h4>Аудио</h4>';
    html += buildAudio(p.media && p.media.audio ? p.media.audio : []);
    html += '</div>';

    html += '</div>';
    return html;
  }

  function hideShared() {
    $('#shared-details-section').addClass('shared-details-hidden');
    $('#pair-facts-content').empty();
    $('#details-defendants').empty();
    $('#details-prosecution').empty();
  }

  function showShared(index) {
    var pair = factsData.pairs[index];

    if (!pair || !pair.defendant_id || !pair.prosecution_id) {
      hideShared();
      return;
    }

    $('#shared-details-section').removeClass('shared-details-hidden');
    $('#pair-facts-content').html(
      buildFacts(pair.shared_facts, 'Общие факты для этого шага пока не добавлены.')
    );
    $('#details-defendants').html(
      personDetails(pair.defendant_id, pair.defendant_facts || [])
    );
    $('#details-prosecution').html(
      personDetails(pair.prosecution_id, pair.prosecution_facts || [])
    );
  }

  function renderByIndex(index) {
    if (typeof index !== 'number' || index < 0) index = 0;

    if (index === 0) {
      hideShared();
    } else {
      showShared(index);
    }
  }

  function bindTimeline() {
    timeline.on('loaded', function () {
      setTimeout(function () {
        renderTimelinePairs();
        removeMiniPreview(); 
        renderByIndex(0);
      }, 700);
    });

    timeline.on('change', function (data) {
      setTimeout(function () {
        renderTimelinePairs();
        removeMiniPreview(); // 👈 ДОБАВИЛИ
      }, 150);

      var uniqueId = data && data.unique_id ? data.unique_id : 'pair-0';
      var match = /^pair-(\d+)$/.exec(uniqueId);
      var index = match ? parseInt(match[1], 10) : 0;

      renderByIndex(index);
    });
  }

  function initTimeline() {
    timeline = new TL.Timeline('timeline-embed', 'data/timeline.json', {
      language: 'ru',
      start_at_slide: 0,
      initial_zoom: 2,
      timenav_height: 160
    });

    bindTimeline();
  }

  function loadFacts(done) {
    $.getJSON('data/facts.json')
      .done(function (data) {
        factsData = data || { pairs: [] };
        done();
      })
      .fail(function () {
        factsData = { pairs: [] };
        done();
      });
  }

  $.getJSON('data/people.json')
    .done(function (data) {
      var persons = data && data.persons ? data.persons : [];
      $.each(persons, function (_, p) {
        if (p && p.id) people[p.id] = p;
      });

      loadFacts(initTimeline);
    })
    .fail(function () {
      loadFacts(initTimeline);
    });
});
$(function () {
  $('#toggle-theory').on('click', function () {
    $('#theory-block').toggleClass('theory-hidden');

    if ($('#theory-block').hasClass('theory-hidden')) {
      $(this).text('Показать подробнее');
    } else {
      $(this).text('Скрыть');
    }
    });
  });