// initial process
$(function() {
  searchTweet();
  getData();
});

// update on submit in #form
$('#form').submit(function() {
  updateData();
  return false;
});

// search tweet about #TodaysMazai
function searchTweet() {
  $.post('search', null);
}

// get data and re-draw
function getData() {
  var $settings = $('#settings');
  $settings.fadeOut(function() {
    $settings.children().remove();
    $.get('fetch', function(res) {
      var lfd = res.lastFoundDate;
      var tfd = res.totalFirstDate;
      var tc = res.totalCount;
      var tyc = res.thisYearCount;
      updateForm(lfd, tfd, tc, tyc);
      $settings.append('<p>Latest tweet date found in search result of #TodaysMazai : ' + lfd + '<br>' +
        '#TodaysMazai start date : ' + tfd + '<br>' +
        'Total count of #TodaysMazai : ' + tc + '<br>' +
        'This year count of #TodaysMazai : ' + tyc + '</p>'
      );
      $settings.fadeIn();
    });
  });
}

// update data
function updateData() {
  var lfd = $('#lfd').val() + '.000Z';
  var tfd = $('#tfd').val() + '.000Z';
  var tc = $('#tc').val();
  var tyc = $('#tyc').val();
  updateForm(lfd, tfd, tc, tyc);
  $.post('update', {
    lfd: lfd,
    tfd: tfd,
    tc: tc,
    tyc: tyc
  }, function(res) {
    console.log(res);
    getData();
  });
}

// update form
function updateForm(lfd, tfd, tc, tyc) {
  $('#lfd').val(new Date(lfd).toISOString().split('.')[0]);
  $('#tfd').val(new Date(tfd).toISOString().split('.')[0]);
  $('#tc').val(parseInt(tc));
  $('#tyc').val(parseInt(tyc));
}
