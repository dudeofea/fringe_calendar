Venues = new Mongo.Collection('venues');

if (Meteor.isClient) {
	//calendar
	var venues_default = [{id: -1, name: 'Please pick a venue to get started', events: []}]
	Session.set('venues', venues_default);
	var dates = [14,15,16,17,18,19,20,21,22,23]
	Template.calendar.allDates = dates;
	Template.calendar.allTimes = function() {
		times = [];
		am_pm = ['AM', 'PM'];
		for(var d = 0; d < 10; d++){
			for (var i = 0; i < am_pm.length; i++) {
				for (var j = 0; j < 12; j++) {
					if(j == 0){
						times.push('12:00 '+am_pm[i]);
					}else{
						times.push(j+':00 '+am_pm[i]);
					}
				};
			};
		};
		return times;
	}
	Template.calendar.venues = function() {
		return Session.get('venues');
	}
	var slider_width_abs = 0;		//in pixels, width of slider
	var slider_left_abs = 0;		//in pixels, left of slider
	var slider_right_abs = 0;		//in pixels, right (left + width) of slider
	var slider_width_rel = 0;		//in percent, ...
	var slider_left_rel = 0;		//in percent, ...
	var slider_bar_width = 0;		//width of parent
	var slider_bar_left = 0;		//left of parent
	var slider_mouse_off = 0;		//mouse offset to substract
	var slider_watch = "";
	var calendar_scale = 1.0;		//1.0 is 24h per 100%
	//is passed the left and width in percent
	var calendar_update = function(left, width){
		console.log(left, width);
		calendar_scale = width / 10;	//10 days total
		//set scale
		$('.times').width((1000 / calendar_scale)+'%');
		$('.venue').width((1000 / calendar_scale)+'%');
		//set left
		var calendar_left = -10 * left / calendar_scale;
		$('.times').css('marginLeft', calendar_left+'%');
		$('.venue').css('marginLeft', calendar_left+'%');
	};
	Template.calendar.events = {
		//delete a venue
		'click .venue p': function(e){
			var venues = Session.get('venues');
			var id = parseInt(e.target.dataset['id']);
			if(id < 0){ return; }
			var i = 0;
			for (i = 0; i < venues.length; i++) {
				if(venues[i]['id'] == id){
					venues.splice(i, 1);
					break;
				}
			};
			if(venues.length == 0){
				venues = venues_default;
			}
			Session.set('venues', venues);
		},
		//move slider
		'mousedown [slider-right]': function(e) {
			slider_watch = "right";
			slider_width_abs = $('.slider').width();
			slider_bar_width = $('.slider-wrapper').width();
			slider_mouse_off = e.clientX - slider_width_abs;
		},
		'mousedown [slider-left]': function(e) {
			slider_watch = "left";
			slider_bar_width = $('.slider-wrapper').width();
			slider_bar_left = $('.slider-wrapper').offset().left;
			slider_left_abs = $('.slider').offset().left;
			slider_width_abs = $('.slider').width();
			slider_right_abs = slider_left_abs + slider_width_abs - slider_bar_left;
			slider_mouse_off = e.clientX - slider_left_abs + slider_bar_left;
		},
		'mousedown .slider': function(e){
			if(e.target.className != "slider"){ return; }
			slider_watch = "move";
			slider_bar_width = $('.slider-wrapper').width();
			slider_bar_left = $('.slider-wrapper').offset().left;
			slider_left_abs = $('.slider').offset().left;
			slider_width_abs = $('.slider').width();
			slider_mouse_off = e.clientX - slider_left_abs + slider_bar_left;
		},
		'mouseleave .calendar': function(){
			slider_watch = "";
		},
		'mousemove': function(e) {
			if(slider_watch == "right"){
				//set width
				slider_width_abs = e.clientX - slider_mouse_off;
				slider_width_rel = 100*slider_width_abs / slider_bar_width;
				//bound
				if(slider_width_rel < 2){ slider_width_rel = 2; }
				if(slider_width_rel + slider_left_rel > 100){ slider_width_rel = 100 - slider_left_rel; }
				$('.slider').width(slider_width_rel+'%');
			}else if(slider_watch == "left"){
				//get left
				slider_left_abs = e.clientX - slider_mouse_off;
				//bound
				if(slider_left_abs < 0){ slider_left_abs = 0; }
				slider_left_rel = 100*slider_left_abs / slider_bar_width;
				//get width
				slider_width_abs = slider_right_abs - slider_left_abs;
				slider_width_rel = 100*slider_width_abs / slider_bar_width;
				//bound
				if(slider_width_rel < 2){
					slider_width_rel = 2;
					slider_left_rel = 100*(slider_right_abs)/slider_bar_width - 2;
					console.log(slider_left_rel);
				}
				$('.slider').width(slider_width_rel+'%');
				$('.slider').css('marginLeft', slider_left_rel+'%');
			}else if(slider_watch == "move"){
				//get left
				slider_left_abs = e.clientX - slider_mouse_off;
				slider_left_rel = 100*slider_left_abs / slider_bar_width;
				//bound
				slider_width_rel = 100*slider_width_abs / slider_bar_width;
				if(slider_left_rel < 0){ slider_left_rel = 0; }
				if(slider_left_rel + slider_width_rel > 100){ slider_left_rel = 100 - slider_width_rel; }
				$('.slider').css('marginLeft', slider_left_rel+'%');
			}
			if(slider_watch != ""){
				calendar_update(slider_left_rel, slider_width_rel);
			}
		},
		'mouseup': function(){
			slider_watch = "";
		}
	}
	//picker
	Template.picker.allVenues = function () {
		return Venues.find({});
	};
	Template.picker.rendered =function(){
		$('#picker').change(function(){
			var venues = Session.get('venues');
			var id = parseInt($(this).val());
			var name = $('#picker option:selected').text();
			$(this).val(0);
			if(id == 0){ return; }
			if(venues[0]['id'] < 0){
				venues = [{id: id, name: name}];
			}else{
				venues.push({id: id, name: name});
			}
			Session.set('venues', venues);
		});
	};
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});
}
