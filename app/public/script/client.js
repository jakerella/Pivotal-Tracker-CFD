
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
        options.series = (options.series || ["Accepted", "Delivered", "Finished", "Started", "Unstarted"]);

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
            t = (new Date(options.data[i].date+"T12:00:00")).getTime();

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
                    steps: true
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

    app.addStatsTooltip = function(options) {
        options = (options || {});

        $(options.node)
            .on("plothover", function (e, pos, item) {
                if (!app.hoverTO) {
                    app.hoverTO = setTimeout(function() {
                        _doAddStatsTooltip(e, pos, item);
                    }, 50);
                }
            })
            .on("mouseout", function() {
                app.hideTooltip();
            });
    };

    var _doAddStatsTooltip = function(e, pos, item) {
        app.hoverTO = null;

        var i, x, l, m, y, d, p1, p2, xTime,
               text = "",
             series = {},
                wip = 0,
               axes = app.plot.getAxes(),
            dataset = app.plot.getData();

        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
            pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
            // out of range
            app.hideTooltip();
            return;
        }
        
        for (i=0, l=dataset.length; i<l; ++i) {
            // Find the nearest points, x-wise
            for (x=0, m=dataset[i].data.length; x<m; ++x) {
                if (dataset[i].data[x][0] > pos.x) {
                    break;
                }
            }

            p1 = dataset[i].data[x - 1];
            p2 = dataset[i].data[x];

            if (p1 === null) {
                y = p2[1];
                xTime = p2[0];
            } else if (p2 === null) {
                y = p1[1];
                xTime = p1[0];
            } else if (p1 && p2 && (p2[0] - pos.x) < (pos.x - p1[0])) {
                y = p2[1];
                xTime = p2[0];
            } else {
                y = p1[1];
                xTime = p1[0];
            }

            series[dataset[i].label] = y;
            text += "<br />"+dataset[i].label+": "+y;
        }

        d = new Date(xTime);
        for (l in series) {
            if (l === "Started" || l == "Finished") {
                wip += series[l];
            }
        }

        app.showTooltip(
            pos.pageX,
            pos.pageY,
            "Stats for "+(d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()+": "+
            "<br />WIP: "+wip+
            text
        );

    };

    app.updateStats = function(data, cb) {
        cb = ($.isFunction(cb))? cb : (function() {});
        console.log("Updating stats with: ", data);

        // do the update ajax call
        $.ajax({
            url: "/project/"+data.project+"/stats/edit",
            data: { stats: data },
            type: "post",
            dataType: "json",
            success: function(d) {
                console.log("Stats updated: ", d);
                cb(null, d);
            },
            error: function(xhr) {
                try {
                    var e = JSON.parse(xhr.responseText);
                    console.error(e);
                    if (!e || !e.error || e.error.status >= 500) {
                        cb("Sorry, but there was an error on the server. Please try again or contact the administrator.");
                    } else {
                        cb(e.error.message);
                    }
                } catch (Error) {
                    console.error(xhr.responseText);
                    cb("Sorry, but there was an error on the server. Please try again or contact the administrator.");
                }
            }
        });
    };


    // ---------------- Helpers ---------------- //

    app.showTooltip = function(x, y, text) {
        if (!app.tooltip) {
            app.tooltip = $("<div class='tooltip'>" + text + "</div>").appendTo("body");
        } else {
            app.tooltip.html(text);
        }

        var  w = $(window),
            ww = w.width(),
            wh = w.height(),
             t = (y+10),
             r = "auto",
             b = "auto",
             l = (x+10);

        // check for right/bottom edges and move tooltip
        if ((app.tooltip.width() + x + 15) > ww) {
            r = (ww-(x-10));
            l = "auto";
        }
        if ((app.tooltip.height() + y + 15) > wh) {
            b = (wh-(y-10));
            t = "auto";
        }

        app.tooltip.css({ top: t, right: r, bottom: b, left: l }).show();
    };

    app.hideTooltip = function() {
        if (app.tooltip) { app.tooltip.hide(); }
    };

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