
(function($) {

    window.console = (window.console || { log: function() {}, error: function() {}});

    var app = window.PTCFD = (window.PTCFD || {});
    app.cookie = "ptcfd_token";
    app.plot = null; // the chart plot
    app.tooltip = null;
    app.hoverTO = null; // for tooltips



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
        var i, j, l, m, t, n,
            seriesData = {},
             chartData = [];

        options = (options || {});
        n = $(options.node);
        options.data = (options.data || app.stats);
        options.series = (options.series || ["Accepted", "Finished", "Started", "Unstarted"]);

        if (!n.length || !options.data) {
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
        app.plot = $.plot(n, chartData, {
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
            },
            crosshair: {
                mode: "x"
            },
            grid: {
                hoverable: true
            }
        });

        app.addStatsTooltip({ node: n });
    };

    /*
    
    STATS
    show label and value on hover over any area in the chart (not just on data points)
    show vertical line when hovering over x-axis
    show horizontal line when hovering over y-axis
    show all values for date when hovering over x-axis
    show WIP stats when hovering x-axis
    show avg lead time when hovering x-axis

     */

     app.addStatsTooltip = function(options) {
        options = (options || {});

        $(options.node).on("plothover", function (e, pos, item) {
            if (!app.hoverTO) {
                app.hoverTO = setTimeout(function() {
                    _doAddStatsTooltip(e, pos, item);
                }, 50);
            }
        });
     };

     var _doAddStatsTooltip = function(e, pos, item) {
        app.hoverTO = null;

        var i, j, l, m, y, d, p1, p2, series, xTime,
               text = "",
               axes = app.plot.getAxes(),
            dataset = app.plot.getData();

        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
            pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
            // out of range
            app.hideTooltip();
            return;
        }
        
        for (i=0, l=dataset.length; i<l; ++i) {
            y = 0;
            series = dataset[i];

            // Find the nearest points, x-wise
            for (j=0, m=series.data.length; j<m; ++j) {
                if (series.data[j][0] > pos.x) {
                    break;
                }
            }

            p1 = series.data[j - 1];
            p2 = series.data[j];

            if (p1 === null) {
                y = p2[1];
                xTime = p2[0];
            } else if (p2 === null) {
                y = p1[1];
                xTime = p1[0];
            } else if ((p2[0] - pos.x) < (pos.x - p1[0])) {
                y = p2[1];
                xTime = p2[0];
            } else {
                y = p1[1];
                xTime = p1[0];
            }

            text += "<br />"+series.label+": "+y;
        }

        d = new Date(xTime);

        app.showTooltip(
            pos.pageX,
            pos.pageY,
            "Stats for "+(d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()+": "+text
        );

    };

    app.showTooltip = function(x, y, text) {
        if (!app.tooltip) {
            app.tooltip = $("<div class='tooltip'>" + text + "</div>").appendTo("body");
        } else {
            app.tooltip.html(text);
        }

        // TODO: check for right/bottom edges and move tooltip

        app.tooltip.css({ top: (y + 5), left: (x + 5) }).show();
     };

     app.hideTooltip = function() {
        if (app.tooltip) { app.tooltip.hide(); }
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