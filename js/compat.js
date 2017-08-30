$(document).ready(function() {
  "use strict";
  var data, language,
    local, info,
    compfail = 0,
    infofail = 0,
    defaultLang = "en",
    slideIndex = 1;
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
      console.log("INFO")
      console.log(info)
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

      var hosts = [];
      console.log("DATA")
      console.log(data)
      $.each(data, function(key) {
        hosts.push(createLi(key));
      });
      $('#host-connection').html(hosts.join(""));

      // Looks better with something already here, so load with USB-C just in case.
      var targets = []
      $.each(data['USB-C'], function(key) {
        targets.push(createLi(key));
      })
      console.log(targets);

      $('#target-connection').html(targets.join(""));


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
    var str = '<li>'
    str += key;
    if (info[key]['image']) {
      str += '<img src="' + info[key]['image'] + '" class="selectimg">'
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
    $('#host-connection').selectable({
      selected: function(event, ui) {
        $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        targetSet(event, ui)
      }
    });
    $('#target-connection').selectable({
      selected: function(event, ui) {
        $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected")
        output(event, ui)
      }
    });
  }


  function minimize(what) {
    $('#' + what).addClass("minimize");
    $('#' + what).after("<span class='clear'>CLEAR</span>")
    $(".clear").on("click", demini)
  }

  function demini() {
    $('.ui.selected').removeClass("ui-selected");
    clearResults()
    $('.minimize').removeClass("minimize");
    $('.clear').remove();
  }
  /* sets the image and text for host, and then adds options for target */
  function targetSet(event, ui) {
    demini()
    minimize("host-connection")
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
    $('#firstouttext').attr("style", "display:hidden")
    $('#target-connection').html(targets);
    $("#target-connection").selectable("refresh");

  }

  function imageSet(img, val, local) {
    if (local) {
      try {
        img.attr("src", info[val]["image"]);
      } catch (err) {
        console.error("image for " + val + "had error: " + err);
      }
    } else {
      img.attr("src", "http://plugable.com/images/" + val + "/main_256.jpg");
    }
    img.attr("alt", "image of " + val);
    img.on('error', function() {
      this.style.visibility = 'hidden';
    });
    img.on('load', function() {
      this.style.visibility = 'visible';
    });
    return img;
  }
  /* outputs results based on hostinput and targetinput */
  function output(event, ui) {
    minimize("target-connection")
    $('.results').html("<div id='out'></div>");
    $('#out').before('<h3 id="firstouttext" class="text"> YOU WILL NEED </h3>');
    var host = $('#host-connection .ui-selected').map(function() {
      return $(this).text();
    }).get();

    var target = $('#target-connection .ui-selected').map(function() {
      return $(this).text();
    }).get();

    var str = data[host][target];
    //NOTE: Adding to DOM every time. May be better t do strings instead?
    for (var i in str) {
      addSolution(i, str);
    }

    slideIndex = 1;
    if (str.length > 1) {
      slideShow()
    }
  }

  function addSolution(i, val) {
    var str = "";
    str += "<div class='result'><div class='resleft'>"
    str += '<h3 class="productname">' + val[i] + '</h3>'
    str += '<p class="outtext" id="secoundouttext">' + info[val[i]]['description'][language] + '</p>'
    str += "<a href='http://plugable.com/" + language + "/products/" + val[i] + "' class='outlink' target='_top'>Purchase Here</a>"
    str += "</div><div class='resright'>"
    str += "<img class='outimg' id='outimg" + i + "'>"
    str += "</div></div>"
    console.log(str);
    $('#out').append(str);
    imageSet($('#outimg' + i), val[i].toLowerCase(), false);

  }

  function slideShow() {
    $('#out').prepend('<button class="slidearrow" id="slideback">&#10094;</button>')
    $('#out').append('<button class="slidearrow" id="slideforward">&#10095;</button>')
    $('#slideback').on('click', function() {
      plusDivs(-1)
    })
    $('#slideforward').on('click', function() {
      plusDivs(1)
    })
    showDivs(slideIndex);
  }

  function plusDivs(n) {
    showDivs(slideIndex += n);
  }

  function showDivs(n) {
    var i;
    var len = $('.result').length;
    if (n > len) {
      slideIndex = 1
    }
    if (n < 1) {
      slideIndex = len
    }
    $('.result').each(function(index) {
      if (index == (slideIndex - 1)) {
        $(this).attr("style", "display:block;")
      } else {
        $(this).attr("style", "display:none;")
      }
    });
  }

  function clearResults() {
    $('#firstouttext').remove();
    $('#out').remove();
  }
});
