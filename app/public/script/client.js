
(function($) {

    $(document).ready(function() {
        $("form").submit(function(e) {
            e.preventDefault();
            var t = $("input").val();
            if (t && t.length) {
                $.cookie('pivotalToken', t, { expires: 365 });
                alert("Great, thanks!");
            } else {
                alert("Hmm, I didn't get a token from you. Cna you try again?");
            }
            return false;
        });
    });

})(jQuery);