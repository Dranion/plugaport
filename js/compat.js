$(document).ready(function () {
    "use strict";
    var data, language = "english",
        local, info;
    localize(language);
    load();
    listeners();

    function localize(language) {
        var url = "js/local.json";
        local = $.getJSON(url).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err);
        });
        local.done(function () {
            local = local.responseJSON;
            var i;
            for (i in local) {
                if (local[i].hasOwnProperty(language)) {
                    $("#" + i).text(local[i][language]);
                } else {
                    console.log(i + " doesn't have language " + language);
                    $("#" + i).text(local[i][0]);
                }
            }
        });
    }

    function load() {
        data = $.getJSON("js/compatibility.json", function (data) {
            var hosts = [];
            $.each(data, function (key) {
                hosts.push('<option value = "' + key + '"/>');
            });
            $('#host-connection').html(hosts.join(""));
        });
        data.done(function () {
            data = data.responseJSON;
        });
        //NOTE: Could instead put this into one line?
        info = $.getJSON("js/information.json");
        info.done(function () {
            info = info.responseJSON;
        });
    }

    function listeners() {
        $('#hostinput').on('input', targetSet);
        $('#hostinput').on('click', clear);
        $('#targetinput').on('input', targetInput);

        $('#targetinput').on('click', function () {
            $('#targetinput').val("");
        });
        $('#hostinput').on('focus', function () {
            $('#targetimg').html('');
        });
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
        img.on('error', function () {
            this.style.visibility = 'hidden';
        });
        img.on('load', function () {
            this.style.visibility = 'visible';
        });
        return img;
    }

    function infoSet(id) {
        try {
            $('#' + id + 'info').html(info[$('#' + id + 'input').val()]["description"][language]);
        } catch (err) {
            console.log($('#' + id + 'input').val() + " either does not exist or does not have a translation for " + language);
            $('#' + id + 'info').html("");
        }
    }

    function output() {
        $('#out').html("");
        var str = data[$('#hostinput').val()][$('#targetinput').val()];
        var link;
        //NOTE: Adding to DOM every time. May be better to do strings instead?
        for (var i in str) {
            $('#out').append("<a href='http://plugable.com/products/" + str[i] + "' class='outlink' target='_top'></a>");
            link = $('.outlink:eq(' + i + ")");
            link.append("");
            link.append("<span class='outvar'>" + str[i] + "</span><br>");
            link.append("<img class='outimg' id='outimg" + i + "'>");
            imageSet($('#outimg' + i), str[i].toLowerCase(), false);
        }
        $('#secondouttext').attr("style", "visibility:visible");
    }

    function clear() {
        console.log("clearing....");
        $('#secondouttext').attr("style", "visibility:'hidden'");
        $('#out').html("");
        $('#hostinfo').html("");
        $('#targetinfo').html("");
        $('#hostinput').val("");
        $('#hostimg').attr("src", "");
        $('#targetimg').attr("src", "");
        $('#targetinput').html("");
        $('#targetinput').val("");
    }
});
