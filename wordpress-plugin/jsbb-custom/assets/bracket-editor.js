/**
 * Bracket Inline Match Editor
 * ブラケット表に直接試合データを入力するためのUI
 */
(function ($) {
  'use strict';

  var ROUND_LABELS = ['1回戦', '2回戦', '3回戦', '準決勝', '決勝'];

  /**
   * チーム数から各ラウンドの試合数を計算する
   * 2の累乗でない場合は繰り上げ（シードあり扱い）
   */
  function buildRoundStructure(teamCount) {
    if (!teamCount || teamCount < 2) return [];
    // 最小の2の累乗を求める
    var rounds = [];
    var n = teamCount;
    var ri = 0;
    while (n > 1) {
      var matchCount = Math.floor(n / 2);
      rounds.push({ label: ROUND_LABELS[ri] || (ri + 1 + '回戦'), count: matchCount });
      n = Math.ceil(n / 2);
      ri++;
    }
    return rounds;
  }

  /**
   * 既存の試合データをラウンドラベルでマップ化
   */
  function buildMatchMap(matches) {
    var map = {};
    if (!matches) return map;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var key = m.round + ':' + m.match_idx;
      map[key] = m;
    }
    return map;
  }

  /**
   * テーブルを描画する
   */
  function renderTable(rounds, existingMatchMap) {
    var $tbody = $('#jsbb-bracket-matches-tbody');
    $tbody.empty();

    for (var ri = 0; ri < rounds.length; ri++) {
      var round = rounds[ri];
      for (var mi = 0; mi < round.count; mi++) {
        var key = round.label + ':' + mi;
        var m = existingMatchMap[key] || {};
        var rowClass = ri % 2 === 0 ? '' : 'jsbb-bm-alt';
        var tr = $('<tr class="jsbb-bm-row ' + rowClass + '">');

        // ラウンド（最初の試合のみspan表示にしたいが、rowspanが面倒なので全行に表示）
        tr.append('<td class="jsbb-bm-round">' + esc(round.label) + '<input type="hidden" name="bracket_matches[' + ri + '_' + mi + '][round]" value="' + esc(round.label) + '"><input type="hidden" name="bracket_matches[' + ri + '_' + mi + '][round_idx]" value="' + ri + '"><input type="hidden" name="bracket_matches[' + ri + '_' + mi + '][match_idx]" value="' + mi + '"></td>');

        // 試合番号
        tr.append('<td class="jsbb-bm-num">' + (mi + 1) + '</td>');

        // 試合日（YYYY-MM-DD） / 開始時刻（HH:MM） を別セルで表示
        var dateVal = '', timeVal = '';
        if (m.date) {
          if (m.date.indexOf('T') !== -1) {
            dateVal = m.date.substring(0, 10);
            timeVal = m.date.substring(11, 16);
          } else {
            dateVal = m.date.substring(0, 10);
          }
        }
        // 試合日セル
        tr.append('<td><input type="date" class="jsbb-bm-date" value="' + esc(dateVal) + '" style="width:130px"></td>');
        // 開始時刻セル
        tr.append('<td><input type="time" class="jsbb-bm-time" value="' + esc(timeVal) + '" style="width:90px"></td>');

        // 会場
        tr.append('<td><input type="text" name="bracket_matches[' + ri + '_' + mi + '][venue]" value="' + esc(m.venue || '') + '" placeholder="会場" class="jsbb-bm-venue"></td>');

        // ホームチーム
        tr.append('<td><input type="text" name="bracket_matches[' + ri + '_' + mi + '][home_name]" value="' + esc(m.home_name || '') + '" placeholder="チーム名" class="jsbb-bm-team jsbb-bm-home-name" data-ri="' + ri + '" data-mi="' + mi + '"></td>');

        // ホームスコア
        tr.append('<td><input type="number" name="bracket_matches[' + ri + '_' + mi + '][home_score]" value="' + (m.home_score !== undefined && m.home_score !== null ? m.home_score : '') + '" min="0" max="99" class="jsbb-bm-score jsbb-bm-score-home" data-ri="' + ri + '" data-mi="' + mi + '"></td>');

        // vs
        tr.append('<td class="jsbb-bm-vs">vs</td>');

        // アウェイスコア
        tr.append('<td><input type="number" name="bracket_matches[' + ri + '_' + mi + '][away_score]" value="' + (m.away_score !== undefined && m.away_score !== null ? m.away_score : '') + '" min="0" max="99" class="jsbb-bm-score jsbb-bm-score-away" data-ri="' + ri + '" data-mi="' + mi + '"></td>');

        // アウェイチーム
        tr.append('<td><input type="text" name="bracket_matches[' + ri + '_' + mi + '][away_name]" value="' + esc(m.away_name || '') + '" placeholder="チーム名" class="jsbb-bm-team jsbb-bm-away-name" data-ri="' + ri + '" data-mi="' + mi + '"></td>');

        // ステータス
        var statusOptions = ['試合前', '試合中', '試合終了', 'コールド', '中止'];
        var statusSel = '<select name="bracket_matches[' + ri + '_' + mi + '][status]" class="jsbb-bm-status">';
        for (var si = 0; si < statusOptions.length; si++) {
          var sel = (m.status === statusOptions[si]) ? ' selected' : '';
          statusSel += '<option value="' + statusOptions[si] + '"' + sel + '>' + statusOptions[si] + '</option>';
        }
        statusSel += '</select>';
        tr.append('<td>' + statusSel + '</td>');

        $tbody.append(tr);
      }
    }
  }

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 現在のフォームデータから試合リストを収集してJSONに変換
   */
  function collectMatchesJson() {
    var matches = [];
    $('#jsbb-bracket-matches-tbody tr.jsbb-bm-row').each(function () {
      var $tr = $(this);
      var ri = parseInt($tr.find('input[name$="[round_idx]"]').val());
      var mi = parseInt($tr.find('input[name$="[match_idx]"]').val());
      var key = ri + '_' + mi;
      var homeScore = $tr.find('input[name="bracket_matches[' + key + '][home_score]"]').val();
      var awayScore = $tr.find('input[name="bracket_matches[' + key + '][away_score]"]').val();

      var dateOnly = $tr.find('.jsbb-bm-date').val();
      var timeOnly = $tr.find('.jsbb-bm-time').val();
      var datetime = dateOnly ? (timeOnly ? dateOnly + 'T' + timeOnly + ':00' : dateOnly) : '';

      matches.push({
        id: 'r' + ri + 'm' + mi,
        round: $tr.find('input[name$="[round]"]').val(),
        round_idx: ri,
        match_idx: mi,
        date: datetime,
        venue: $tr.find('input[name$="[venue]"]').val(),
        home_name: $tr.find('.jsbb-bm-home-name').val(),
        away_name: $tr.find('.jsbb-bm-away-name').val(),
        home_score: homeScore !== '' ? parseInt(homeScore) : null,
        away_score: awayScore !== '' ? parseInt(awayScore) : null,
        status: $tr.find('.jsbb-bm-status').val()
      });
    });
    return JSON.stringify(matches);
  }

  $(document).ready(function () {

    // ----- 初期描画 -----
    var initialJson = $('#jsbb-bracket-matches-json').val();
    var existingMatches = [];
    try {
      if (initialJson) existingMatches = JSON.parse(initialJson);
    } catch (e) {}

    var teamCount = parseInt($('#jsbb-bracket-team-count-hidden').val()) || 0;
    var rounds = buildRoundStructure(teamCount);
    var matchMap = buildMatchMap(existingMatches);

    if (rounds.length > 0) {
      renderTable(rounds, matchMap);
    }

    // ----- 「ブラケット生成」ボタン -----
    $('#jsbb-bracket-generate-btn').on('click', function (e) {
      e.preventDefault();
      var n = parseInt($('#jsbb-bracket-team-count-hidden').val()) || 0;
      if (n < 2) {
        alert('出場チームを先に選択・保存してください。');
        return;
      }
      if ($('#jsbb-bracket-matches-tbody tr').length > 0) {
        if (!confirm('既存のデータがリセットされます。よろしいですか？')) return;
      }
      var r = buildRoundStructure(n);
      renderTable(r, {});
    });

    // ----- フォーム送信前にJSONを生成 -----
    $('form#post').on('submit', function () {
      $('#jsbb-bracket-matches-json').val(collectMatchesJson());
    });

    // ----- チーム数の表示 -----
    function updateTeamCountDisplay() {
      var n = $('.jsbb-bracket-team-cb:checked').length;
      $('#jsbb-bracket-team-count-hidden').val(n);
      $('#jsbb-bracket-team-count-for-editor').text(n + 'チーム（' + (buildRoundStructure(n).length) + 'ラウンド / ' + calcTotalMatches(n) + '試合）');
    }

    function calcTotalMatches(n) {
      var total = 0;
      var cur = n;
      while (cur > 1) {
        total += Math.floor(cur / 2);
        cur = Math.ceil(cur / 2);
      }
      return total;
    }

    $(document).on('change', '.jsbb-bracket-team-cb', updateTeamCountDisplay);
    updateTeamCountDisplay();

  });

})(jQuery);
