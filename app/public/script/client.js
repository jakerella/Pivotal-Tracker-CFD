
(function($) {

    var app = window.PTCFD = (window.PTCFD || {});
    app.cookie = "ptcfd_token";

    app.checkForCookie = function() {
        var t = $.cookie(app.cookie);
        console.log("token:", t);
        if (t && t.length) {
            app.redirectToProjects();
        }
    };

    app.redirectToProjects = function() {
        window.location.replace("/projects");
    };

    app.initLoginForm = function(form) {
        $(form).submit(function(e) {
            e.preventDefault();
            var ld = $(this).find(".loading").show();
            app.clearMessages(function() {

                app.getProjects($("input:text").val(), function(result) {
                    if (result.isValidToken === true) {
                        
                        //$.cookie(app.cookie, t, { expires: 365 });
                        
                        app.success("Thanks! You'll be redirected in just a sec...");
                        setTimeout(function() {
                            app.redirectToProjects();
                        }, 2000);

                    } else {
                        app.error("Sorry, but that is not a valid token for this system!");
                    }
                });
                ld.hide();

            });
            return false;
        });
    };

    app.getProjects = function(t, cb) {
        if (app.projects) {
            cb({
                isValidToken: null,
                projects: app.projects
            });
            return;
        }

        $.ajax({
            url: "/projects",
            data: { token: t },
            type: "post",
            dataType: "json",
            success: function(d) {
                console.log("Projects received: ", d);
                if (d.projects) {
                    app.projects = d.projects;
                }
                cb({
                    isValidToken: d.isValidToken,
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