$(document).ready(function() {
  "use strict";
  var data, language,
    local, info,
    compfail = 0,
    infofail = 0,
    defaultLang = "en";
  getLang();
  localize();
  load();

  /* gets languages based on the window's url. */
  function getLang() {
    var url = (window.location != window.parent.location) ?
      document.referrer :
      document.location.href;
    if (url.charAt(15) === "/") {
      language = url.substr(13, 2);
    } else {
      console.warn("defaulting on lang. url " + url + " not found to have language clue");
      language = defaultLang;
    }
  }

  /* loads localized text for static, inserts based on id*/
  function localize() {
    var url = "js/local.json";
    local = $.getJSON(url).fail(function(jqxhr, textStatus, error) {
      loadError(jqxhr, textStatus, error);
    });
    local.done(function() {
      local = local.responseJSON;
      var i;
      for (i in local) {
        if (local[i].hasOwnProperty(language)) {
          $("#" + i).text(local[i][language]);
        } else {
          console.warn(i + " doesn't have language " + language);
          $("#" + i).text(local[i][defaultLang]);
        }
      }
    });
  }

  /* loads the JSON for selection and description*/
  function load() {
    var infourl = "download/information.json";
    info = $.getJSON(infourl);
    info.done(function() {
      info = JSON.parse(info.responseText);
      dataLoad()
    });
    info.fail(function(jqxhr, textStatus, error) {
      if (infofail < 2) {
        console.log("infofail" + infofail);
        loadError(jqxhr, textStatus, error, infourl);
        infofail += 1;
      } else {
        $('body').html("Load failed - no JSON found")
        console.error("Total fail. Cannot load.")
      }
    });

  }

  function dataLoad() {
    var compaturl = "download/compatibility.json";
    data = $.getJSON(compaturl, function(data) {
      console.log('it was a scuess');
      var hosts = [];
      $.each(data, function(key) {
        hosts.push(createLi(key));
      });
      $('#host-connection').html(hosts.join(""));
      listeners();
    });
    data.done(function() {
      data = JSON.parse(data.responseText);
    });
    data.fail(function(jqxhr, textStatus, error) {
      if (compfail < 1) {
        console.log("compfail " + compfail)
        loadError(jqxhr, textStatus, error, compaturl);
        compfail += 1;
      } else {
        $('body').html("Load failed - no JSON found")
        console.error("Total fail. Cannot load.")
      }
    });

  }



  function createLi(key) {
    console.log("Create LI" + key);
    var str = '<li>'
    if (info[key]['image'] != "") {
      str += '<img src="' + info[key]['image'] + '" class="selectimg">'
    }
    key = key.replace('"', '&#34;')
    str += key;
    if (info[key]['description'][language] != "") {
      console.log("HEY")
      var quickkey = key.replace(" ", "_")
      str += '<span class="info" title="Click for more info" name="' + quickkey + '"> <i class="fa fa-info-circle" aria-hidden="true"></i>'
      if (key == "Thunderbolt 3" || key == "USB 3") {
        str += "Read this"
      } else {
        str += "More info"
      }
      str += "</span>"
      str += '<div class="dialog" title="' + key + ' Info" id="' + quickkey + '">' + info[key]['description'][language] + '</div>'
    }
    str += '</li>'
    return str;
  }


  /* attempts to re-run download.php in case of JSON error */
  function loadError(jqxhr, textStatus, error, url) {
    var err = textStatus + ", " + error;
    console.error("Request Failed for " + url + " : " + err);

    var php = $.get("download.php", function(data) {
      console.log("attempting to download.... ");
    });
    php.done(function() {
      console.log("download complete");
      load();
    });
  }

  /* sets up all listeners for user input */
  function listeners() {
    console.log("listeners");
    $('#host-connection').selectable({
      selected: function(event, ui) {
        $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        targetSet(event, ui)
      }
    });
    $('#target-connection').selectable({
      selected: function(event, ui) {
        $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        output(event, ui)
      }
    });
    $('.dialog').dialog({
      draggable: false,
      modal: true,
      autoOpen: false
    });
    $('.info').on("click", function(e) {
      showDescription($(this).attr("name"))
    })
  }

  /* sets the image and text for host, and then adds options for target */
  function targetSet(event, ui) {
    var hostAll = $('#host-connection .ui-selected').map(function() {
      return $(this).text();
    }).get();
    var len = hostAll.length;
    var targets = "";
    for (var i = 0; i < len; i++) {
      var host = hostAll[i];
      if (data.hasOwnProperty(host)) {
        for (var i in data[host]) {
          if (data[host].hasOwnProperty(i)) {
            targets += createLi(i);
          }
        }
      }
    }
    $('#out').html("");
    $('#target-connection').html(targets);
    $("#target-connection").selectable("refresh");

  }

  /* outputs results based on hostinput and targetinput */
  function output(event, ui) {
    $('#out').html("");

    var host = $('#host-connection .ui-selected').map(function() {
      return $(this).text();
    }).get();
    console.log("HOST");
    console.log(host)
    var target = $('#target-connection .ui-selected').map(function() {
      return $(this).text();
    }).get();
    console.log("TARGET");
    console.log(target)
    var str = data[host][target];
    var link;
    //NOTE: Adding to DOM every time. May be better t do strings instead?
    for (var i in str) {
      $('#out').append("<a href='http://plugable.com/" + language + "/products/" + str[i] + "' class='outlink' target='_top'></a>");
      link = $('.outlink:eq(' + i + ")");
      link.append("");
      link.append("<span class='outvar'>" + str[i] + "</span><br>");
      link.append("<img class='outimg' id='outimg" + i + "'>");
      imageSet($('#outimg' + i), str[i].toLowerCase(), false);
    }
    $('#secondouttext').attr("style", "visibility:visible");
  }

  /* Clear functions. Reset the areas that might have been modified */

  function clearAll() {
    $('#hostinfo').html("");
    $('#host-connection').val("");
    $('#hostimg').attr("src", "");
    clearTarget();
  }

  function clearResults() {
    $('#secondouttext').attr("style", "visibility:'hidden'");
    $('#out').html("");
  }


  function showDescription(id) {
    $('#' + id).dialog("open");
  }
});
