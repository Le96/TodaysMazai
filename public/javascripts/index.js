// initial process
$(function(){
  getData();
});

// update on submit in #form
$('#form').submit(function(){
  updateData();
  return false;
});

// get data and re-draw
function getData(){
  var $settings = $('.settings');
  $settings.fadeOut(function(){
    $settings.children().remove();
    $.get('fetch', function(setting){
      var lfd = new Date(setting.lastFoundDate);
      var tfd = new Date(setting.totalFirstDate);
      var tc = setting.totalCount;
      var tyc = setting.thisYearCount;
      $settings.append('<p>Latest tweet date found in search result of #TodaysMazai : ' + lfd + '</p><br>' +
        '<p>#TodaysMazai start date : ' + tfd + '</p><br>' +
        '<p>Total count of #TodaysMazai : ' + tc + '</p><br>' +
        '<p>This year count of #TodaysMazai : ' + tyc + '</p>'
      );
      $settings.fadeIn();
    });
  });
}

// update data
function updateData(){
  var lfd = new Date($('#lfd').val());
  var tfd = new Date($('#tfd').val());
  var tc = parseInt($('#tc').val());
  var tyc = parseInt($('#tyc').val());
  clearForm();
  $.post('update', {
    lastFoundDate: lfd,
    totalFirstDate: tfd,
    totalCount: tc,
    thisYearCount: tyc
  }, function(res){
    console.log(res);
    getData();
  })
}

// clear form
function clearForm(){
  $('.input').val('');
}
