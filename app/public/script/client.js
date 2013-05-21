
(function($) {

    window.console = (window.console || { log: function() {}, error: function() {}});

    var app = window.PTCFD = (window.PTCFD || {});
    app.cookie = "ptcfd_token";


    app.redirectToProjects = function() {
        window.location.replace("/projects");
    };


    app.initLoginForm = function(form) {
        $(form).submit(function(e) {
            e.preventDefault();
            var ld = $(this).find(".loading").show();
            app.clearMessages(function() {

                app.getProjects($("input:text").val(), function(result) {
                    if (result.projects && result.projects.length) {
                        
                        $.cookie(app.cookie, result.token, { expires: 365 });
                        
                        app.success("Thanks! You'll be redirected in just a sec...");
                        setTimeout(function() {
                            console.log("Redirecting to project listing page");
                            ld.hide();
                            app.redirectToProjects();
                        }, 2000);

                    } else {
                        ld.hide();
                        app.error("Sorry, but that is not a valid token for this system!");
                    }
                });

            });
            return false;
        });
    };


    app.getProjects = function(t, cb) {
        $.ajax({
            url: "/projects",
            data: { token: t },
            type: "post",
            dataType: "json",
            success: function(d) {
                console.log("Projects received: ", d);
                cb({
                    token: d.token,
                    projects: d.projects
                });
            },
            error: function(xhr) {
                var e = JSON.parse(xhr.responseText);
                console.error(e);
                if (!e.error || e.error.status >= 500) {
                    cb("Sorry, but there was an error on the server. Please try again or contact the administrator.");
                } else {
                    cb(e.error.message);
                }
            }
        });
    };


    app.showChart = function(options) {
        var i, j, l, m, t,
            seriesData = {},
             chartData = [];

        options = (options || {});
        options.node = $(options.node);
        options.data = (options.data || app.stats);
        options.series = (options.series || ["Accepted", "Finished", "Started", "Unstarted"]);

        if (!options.node.length || !options.data) {
            app.error("Sorry, but it looks like there's no data to display!");
            return;
        }

        // set up chart data series holders
        for (i=0, l=options.series.length; i<l; ++i) {
            chartData.push({
                label: options.series[i],
                data: []
            });
            seriesData[options.series[i]] = [];
        }

        // stuff all stats data into chart data series holders
        for (i=0, l=options.data.length; i<l; ++i) {
            // get timestamp from date entry
            t = (new Date(options.data[i].date)).getTime();

            // add data from each entry to series
            for (j=0, m=options.series.length; j<m; ++j) {
                seriesData[options.series[j]].push([t, (options.data[i][options.series[j].toLowerCase()] || 0)]);
            }
        }

        // prepare the final chart data object
        for (i=0, l=options.series.length; i<l; ++i) {
            chartData[i].data = seriesData[options.series[i]];
        }

        console.log("Plotting chart with:", chartData);
        $.plot(options.node, chartData, {
            legend: {
                position: "nw",
                backgroundOpacity: 0
            },
            xaxis: {
                mode: "time",
                minTickSize: [1, "day"],
                timeformat: "%Y-%m-%d"
            },
            series: {
                stack: true,
                lines: {
                    show: true,
                    fill: true,
                    steps: false
                }
            }
        });
    };



    // ---------------- Helpers ---------------- //

    app.messageNode = $("#messages");
    app.alert = function(msg, cls, to) {
        to = (to || 7000);
        cls = (cls || "error");
        var n = app.messageNode
                    .append("<p class='message "+cls+"'>"+msg+"</p>")
                    .find(".message:last")
                        .slideDown();
        if (to > 0) {
            setTimeout(function() {
                n.slideUp(function() { $(this).remove(); });
            }, to);
        }
    };
    app.info = function(msg, to) {
        app.alert(msg, "info", (to || null));
    };
    app.success = function(msg, to) {
        app.alert(msg, "success", (to || null));
    };
    app.error = function(msg, to) {
        app.alert(msg, "error", (to || -1));
    };
    app.clearMessages = function(cb) {
        cb = (cb || function() {});
        msg = app.messageNode.find(".message");
        if (msg.length) {
            app.messageNode.slideUp(function() {
                msg.remove().end().slideDown(50, function() { cb(); });
            });
        } else {
            cb();
        }
    };


})(jQuery);