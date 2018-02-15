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
    $list.append('<tr><th>id</th><th>created_at</th><th>updated_at</th>' +
      '<th>screen_name</th><th>mention</th><th>last_status</th>' +
      '<th>started_at</th><th>total_count</th><th>this_year_count</th></tr>');
    $.get('fetch', res => {
      for (let r of res.rows) {
        const row = '<tr>' +
          '<td>' + r.id + '</td>' +
          '<td>' + r.created_at + '</td>' +
          '<td>' + r.updated_at + '</td>' +
          '<td><a href="https://twitter.com/' + r.screen_name + '/">' +
            r.screen_name + '</a></td>' +
          '<td>' + (r.mention ? '\u2611' : '\u2610') + '</td>' +
          '<td><a href="https://twitter.com/' + r.screen_name + '/status/' +
            r.last_status + '">' + r.last_status + '</a></td>' +
          '<td>' + r.started_at + '</td>' +
          '<td>' + (r.total_count ? r.total_count : '-') + '</td>' +
          '<td>' + r.this_year_count + '</td>' +
          '</tr>';
        $list.append(row);
      }
      $list.fadeIn();
    });
  });
};
