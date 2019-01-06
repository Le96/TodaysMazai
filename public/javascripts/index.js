// initial process
$(() => getData());

// get data on click reload button
$('#reload').click(() => {
  getData();
  return false;
})

// search tweet about #TodaysMazai
// Ly8gYnV0dG9uOiA8aW5wdXQgaWQ9J3NlYXJjaCcgdHlwZT0nYnV0dG9uJyB2YWx1ZT0nc2VhcmNoICNUb2RheXNNYXphaSc+
// Ly8gY29uc3Qgc2VhcmNoVHdlZXQgPSAoKSA9PiAkLnBvc3QoJ3NlYXJjaCcsIG51bGwpOw==

// get data and re-draw
const getData = () => {
  let $list = $('#list');
  $list.fadeOut(async () => {
    $list.empty();
    $list.append('<tr><th>id(screen_name)</th><th>mention</th>' +
      '<th>latest_status</th><th>prev_year_count</th><th>total_count</th>' + '<th>this_year_count</th><th>created_at</th><th>updated_at</th></tr>');
    $.get('fetch', res => {
      for (let r of res.rows) {
        const row = '<tr>' +
          '<td><a href="https://twitter.com/' + r.id + '/">' +
          r.id + '</a></td>' +
          '<td>' + (r.mention ? '\u2611' : '\u2610') + '</td>' +
          '<td><a href="https://twitter.com/' + r.id + '/status/' +
          r.latest_status + '">' + r.latest_status + '</a></td>' +
          '<td>' + r.prev_year_count + '</td>' +
          '<td>' + (r.total_count ? r.total_count : '-') + '</td>' +
          '<td>' + r.this_year_count + '</td>' +
          '<td>' + r.created_at + '</td>' +
          '<td>' + r.updated_at + '</td>' +
          '</tr>';
        $list.append(row);
      }
      $list.fadeIn();
    });
  });
};
