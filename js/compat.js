$(document).ready(function () {
    "use strict";
    var data, language,
        local, info, defaultLang = "en";
    getLang();
    localize();
    load();


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

    function localize() {
        var url = "js/local.json";
        local = $.getJSON(url).fail(function (jqxhr, textStatus, error) {
            loadError(jqxhr, textStatus, error);
        });
        local.done(function () {
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

    function load() {
        var compaturl = "download/compatibility.json";
        var infourl = "download/information.json";
        data = $.getJSON(compaturl, function (data) {
            console.log('it was a scuess');
            var hosts = [];
            $.each(data, function (key) {
                hosts.push('<option value = "' + key + '"/>');
            });
            $('#host-connection').html(hosts.join(""));
            listeners();
        });
        data.done(function () {
            data = data.responseJSON;
        });
        data.fail(function (jqxhr, textStatus, error) {
            loadError(jqxhr, textStatus, error, compaturl);
        });

        info = $.getJSON(infourl);
        info.done(function () {
            info = info.responseJSON;
        });
        info.fail(function (jqxhr, textStatus, error) {
            loadError(jqxhr, textStatus, error, infourl);
        });
    }

    function loadError(jqxhr, textStatus, error, url) {
        var err = textStatus + ", " + error;
        console.error("Request Failed for " + url + " : " + err);

        var php = $.get("download.php", function (data) {
            console.log("attempting to download.... ");
        });
        php.done(function () {
            console.log("download complete");
            load();
        });
    }

    function listeners() {
        $('#hostinput').on('input', targetSet);
        $('#hostinput').on('click', clearAll);
        $('#targetinput').on('input', targetInput);
        $('#targetinput').on('click', clearTarget);
    }

    function targetSet() {
        var host = $('#hostinput').val();
        if (data.hasOwnProperty(host)) {
            imageSet($('#hostimg'), $('#hostinput').val(), true);
            infoSet("host");
            $('#target-connection').val("");
            var targets = "";
            for (var i in data[host]) {
                if (data[host].hasOwnProperty(i)) {
                    targets += '<option value = "' + i.replace('"', '&#34;') + '"/>';
                }
            }
            $('#target-connection').html(targets);
        }
    }

    function targetInput() {
        var host = $('#hostinput').val(),
            target = $('#targetinput').val();
        if (data[host].hasOwnProperty(target)) {
            imageSet($('#targetimg'), target, true);
            infoSet("target");
            output();
        }
    }

    function imageSet(img, val, local) {
        if (local) {
            img.attr("src", "images/" + val + ".jpg");
        } else {
            img.attr("src", "http://plugable.com/images/" + val + "/main_256.jpg");
        }
        img.attr("alt", "image of " + val);
        img.on('error', function () {
            this.style.visibility = 'hidden';
        });
        img.on('load', function () {
            this.style.visibility = 'visible';
        });
        return img;
    }

    function infoSet(id) {
        var infotext = $('#' + id + 'info');
        var val = $('#' + id + 'input').val();
        if (info.hasOwnProperty(val)) {
            if (info[val]["description"].hasOwnProperty(language)) {
                infotext.html(info[val]["description"][language]);
            } else {
                console.warn(val + " has no translation for " + language + ". Defaulting to " + defaultLang);
                infotext.html(info[val]["description"][defaultLang]);
            }
        } else {
            console.warn(val + " has no listed description");
            infotext.html("");
        }
    }

    function output() {
        $('#out').html("");
        var str = data[$('#hostinput').val()][$('#targetinput').val()];
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

    function clearAll() {
        $('#hostinfo').html("");
        $('#hostinput').val("");
        $('#hostimg').attr("src", "");
        clearTarget();
    }

    function clearResults() {
        $('#secondouttext').attr("style", "visibility:'hidden'");
        $('#out').html("");
    }

    function clearTarget() {
        $('#targetimg').attr("src", "");
        $('#targetinput').html("");
        $('#targetinput').val("");
        $('#targetinfo').html("");
        clearResults();
    }
});
