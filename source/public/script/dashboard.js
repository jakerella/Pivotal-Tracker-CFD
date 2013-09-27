$(document).ready(function () {

	var projects = $('.project-list > a');

	$(projects).mouseenter(function(){
		header = $(this).find('h3');
		overlay = $(this).find('.info-overlay');

		$(header)
			.stop()
			.animate({background: 'rgba(0, 0, 0, .8)'}, 200);
		$(overlay)
			.stop()
			.animate({opacity: 1}, 200);
	});

	$(projects).mouseleave(function(){
		header = $(this).find('h3');
		overlay = $(this).find('.info-overlay');

		$(header)
			.stop()
			.animate({background: 'rgba(0, 0, 0, .1)'}, 200);
		$(overlay)
			.stop()
			.animate({opacity: 0}, 200);
	});

});