/**************************************************************************
 * Themo Slider
 * @info: https://github.com/themology/themo-slider
 * @version: 1.0.0
 * @requires: jQuery v1.7 or later (tested on 1.11.1)
 * @author: Themology - http://www.themology.net
**************************************************************************/

;(function($,undefined) {
	
	$.fn.extend({	
	
		themoSlider:function(options) {
			
			//Default values
			var defaults = {
				startWidth:1170,
				startHeight:500,
				
				randomize:false,					//Randomize slide order	
				
				delay:8000,							//Default delay time	
				transition:"random",				//Effects	
	
				//Thumbnail
				thumbWidth:100,						//Thumb Width, Height and Amount (If navigation type set to thumb)
				thumbHeight:47,
				thumbAmount:5,
				thumbContainerBorder:1,
	
				//Navigation
				navType:"both", 				 	//bullet, thumb, none, both
				navStyle:"round",			   		//round, round-blue, round-black, number, navbar
				navArrow:"visible",					//visible, hidden
				showNavOnHover:false,
				showNavArrowOnHover:true,
				hideNavSpeed:300,
				touchEnabled:true,					//Enable swipe function
				
				navOffsetHorizontal:0,
				navOffsetVertical:10,
	
				//Timer
				showTimer:true,
				timerAlign:"bottom",				//bottom, top
				pauseOnHover:true,				    //Pause timer on hover
				
				//Shadow
				shadow:1,							//0 = no Shadow, 1,2,3 = 3 Different art of shadows
				
				//Caption
				hideCaptionAtResolution:0,			//It defines if a caption should be shown under a screen resolution (Based on the width of browser)
				captionEasing:"linear",
	
				//Lazy load
				lazyLoad:false,						//Load all images if no lazy load for each image
				
				//Stop loop
				stopLoop:false,				
				stopAfterLoops:-1,
				stopAtSlide:-1,
				
				//Current item
				currentItem:0,
				
				//Full width
				fullWidth:false,					//Turns on or off the fullwidth image centering in fullwidth modes
				
				//Full screen
				fullScreen:false,
				fullScreenOffsetContainer:"",
				
				//Video
				videoJsPath:"videojs/"
			};
	
			//Options
			var options = $.extend({}, defaults, options);
			
			//Effects
			var ei = 0;
			var EFFECTS = {
				"boxslide":ei++,			"boxfade":ei++,				"boxzigzag":ei++,		"slotslide-horizontal":ei++,	"slotslide-vertical":ei++,		
				"curtain-1":ei++,			"curtain-2":ei++,	   		"curtain-3":ei++,	  	"slotzoom-horizontal":ei++,	   	"slotzoom-vertical":ei++,		 
				"slotfade-horizontal":ei++, "slotfade-vertical":ei++,	"fade":ei++,		   	"slideleft":ei++,				"slideup":ei++,				   
				"slidedown":ei++,			"slideright":ei++,		   	"papercut":ei++,		"3dcurtain-horizontal":ei++,	"3dcurtain-vertical":ei++,		
				"cubic":ei++,				"flyin":ei++,				"turnoff":ei++,			"random":ei++
			};
			
			/***********************
			    - Slider class -
			***********************/
			function ThemoSlider($obj, options) {			
				//Variables
				this.container = $obj;
						
				this.preloader = $('<div class="preloader"></div>');
				this.timer;
				this.actli;
				this.nextli;
				this.actsh;
				this.nextsh;
				this.intervalId = null;
				this.masterspeed = 0;
				this.httpprefix = location.protocol==="https:" ? "https:" : "http:";
				this.noCSS3effectCount = 17;
				
				
				//Create some default options for later
				this.opt = options;		
				this.opt.container = this.container;
				this.opt.slots = 4;
				this.opt.act = -1;
				this.opt.next = this.opt.currentItem;
				this.opt.origcd = this.opt.delay;
				this.opt.startUp = true;
				this.opt.leftArrowPressed = false;
				
				//Navigation offset
				this.navOffV = this.opt.navOffsetVertical;
								
				//Browser
				this.opt.ie = false;
				this.opt.ie9 = false;	
				
				//Video
				this.opt.videoPlaying = false;
				this.opt.videoStarted = false;
				this.opt.videoStopped = false;	
					
				//Init slider
				this.init();
			}
			
			ThemoSlider.prototype = {
				
				//Init slider
				init:function() {
					var that = this;
					if (this.container.attr('id')==undefined) this.container.attr('id',"themo-slider-"+Math.round(Math.random()*1000+5));
					
					//Check browser type
					this.checkBrowser();
					
					//Check jQuery version
					this.checkJQueryVersion();
					
					//Delegate .transition() calls to .animate() if the browser can't do CSS transitions
					if (!$.support.transition) {$.fn.transition = $.fn.animate;}
					$.cssEase['bounce'] = 'cubic-bezier(0,1,0.5,1.3)';
	
					//Load YouTube API if necessary		
					this.loadYouTubeAPI();
	
					//Load Vimeo API if necessary
					this.loadVimeoAPI();
					
					//Load video.js API if necessary
					this.loadVideoJSAPI();

					//Randomize slides order if set
					if (this.opt.randomize) {
						this.randomizeSlides();
					}
					
					//Shortway usage of offsets
					this.opt.navOH = this.opt.navOffsetHorizontal;
					this.opt.navOV = this.opt.navOffsetVertical;
					
					//Preloader
					this.container.append(this.preloader);
	
					//Create timer
					this.createTimer();
					
					//Amount of the slides
					this.opt.slideCount = this.container.find('>ul:first >li').length;
					
					//A basic grid must be defined. If no default grid exists than we need a default value, actual size of container
					if (this.container.height()==0) this.container.height(this.opt.startHeight);
					if (this.opt.startWidth==0) this.opt.startWidth = this.container.width();
					if (this.opt.startHeight==0) this.opt.startHeight = this.container.height();
	
					//Option width & height should be set
					this.opt.width = this.container.width();
					this.opt.height = this.container.height();
	
					//Default dependencies
					this.opt.bw = this.opt.startWidth / this.container.width();
					this.opt.bh = this.opt.startHeight / this.container.height();
	
					//If the item already in a resized form
					if (this.opt.width!=this.opt.startWidth) {
						this.opt.height = Math.round(this.opt.startHeight*(this.opt.width/this.opt.startWidth));
						this.container.height(this.opt.height);
					}
	
					//Create shadow
					this.createShadow();
					
					if (!this.opt.lazyLoad) {
						//Wait for images to load
						this.container.waitForImages(function() {
							//Prepare the slides
							that.prepareSlides();
		
							//Create bullets
							if (that.opt.slideCount>1) {
								that.createBullets();
								that.createThumbs();
								that.createArrows();
							}
							that.swipeAction();
		
							if (that.opt.showNavOnHover || that.opt.showNavArrowOnHover) that.hideThumbs();
		
							that.container.waitForImages(function() {
								//Start the first slide
								that.preloader.fadeOut(600);
								setTimeout(function() {
									that.swapSlide();
									//Start timer
									if (that.opt.slideCount>1) that.countDown();
									//Onloaded event trigger
									that.container.trigger('themo_slider.onloaded');
								}, 600);
							});
						});
					} else {
						//If lazy load is activated
						var fli = this.container.find('ul >li >img').first();
						if (fli.data('lazyload')!=undefined) fli.attr('src', fli.data('lazyload'));
						fli.data('lazydone', 1);
						
						fli.parent().waitForImages(function() {
							//Prepare the slides
							that.prepareSlides();
	
							//Create bullets
							if (that.opt.slideCount>1) {
								that.createBullets();
								that.createThumbs();
								that.createArrows();
							}
							that.swipeAction();
	
							if (that.opt.showNavOnHover || that.opt.showNavArrowOnHover) that.hideThumbs();
	
							fli.parent().waitForImages(function() {
								//Start the first slide
								that.preloader.fadeOut(600);
								setTimeout(function() {
									that.swapSlide();
									//Start timer
									if (that.opt.slideCount>1) that.countDown();
									//Onloaded event trigger
									that.container.trigger('themo_slider.onloaded');
								}, 600);
							});
						});
					}
	
					//If resized, need to stop actual transition and resize actual images
					$(window).resize(function() {
						if ($("body").find(that.container)!=0) {
							if (that.container.outerWidth(true)!=that.opt.width) {
								that.containerResized();
							}
						}
					});
					
					//Check if the caption is a "Scroll me to position" caption
					this.container.find('.scrollbelowslider').on('click',function() {
							var off = 0;
							
							try{
								off = $('body').find(that.opt.fullScreenOffsetContainer).height();
							} catch(e) {}
							
							try{
								off -= $(this).data('scrolloffset');
							} catch(e) {}

							$('body,html').animate({scrollTop:(that.container.offset().top+(that.container.find('>ul >li').height())-off)+"px"}, {duration:400});
					});
				},
				
				//Check browser type
				checkBrowser:function() {
					this.opt.ie = !$.support.opacity;
					this.opt.ie9 = (document.documentMode == 9);
				},
				
				//Check jQuery version
				checkJQueryVersion:function() {
					var version = $.fn.jquery.split('.'),
						versionTop = parseFloat(version[0]),
						versionMinor = parseFloat(version[1]),
						versionIncrement = parseFloat(version[2] || '0');
					//If jQuery is less than 1.7 generate error
					if (versionTop==1 && versionMinor<7) {
						alert("jQuery version is "+version+". Please, update it to 1.7 or later.");
					}
				},
				
				//Load YouTube API if necessary
				loadYouTubeAPI:function() {
					var that = this;
					var addedyt = false;
					
					this.container.find('.caption iframe').each(function() {
						try {
							if ($(this).attr('src').indexOf('you')>0 && !addedyt) {
								addedyt = true;
								var src = that.httpprefix+"//www.youtube.com/iframe_api";
								
								var s = document.createElement("script");
								s.src = src;
								var before = document.getElementsByTagName("script")[0];
								
								var loadit = true;
								$('head').find('*').each(function() {
									if ($(this).attr('src')==src) {
									   loadit = false;
									}
								});
								
								if (loadit) {
									before.parentNode.insertBefore(s, before);
								}
							}
						} catch(e) {}
					});
				},
					
				//Load Vimeo API if necessary
				loadVimeoAPI:function() {
					var that = this;
					var addedvim = false;
					
					this.container.find('.caption iframe').each(function() {
						try {
							var src = that.httpprefix+"//a.vimeocdn.com/js/froogaloop2.min.js";
							
							if ($(this).attr('src').indexOf('vim')>0 && !addedvim) {
								addedvim = true;								
								
								var f = document.createElement("script");
								f.src = src;
								var before = document.getElementsByTagName("script")[0];

								var loadit = true;
								$('head').find('*').each(function() {
									if ($(this).attr('src')==src) {
									   loadit = false;
									}
								});
								
								if (loadit) {
									before.parentNode.insertBefore(f, before);
								}
							}							
							
							if ($(this).attr('src').indexOf('vim')>0) {
								var f = document.createElement("script");
								f.src = src;
								var before = document.getElementsByTagName("script")[0];
								before.parentNode.insertBefore(f, before);
							}
						} catch(e) {}
					});
				},
				
				//Load video.js API if necessary
				loadVideoJSAPI:function() {
					var that = this;
					var addedvid = false;
					
					this.container.find('.caption video').each(function(i) {
						try{
							if ($(this).hasClass('video-js') && !addedvid) {
								addedvid = true;
								var src = that.opt.videoJsPath+"video.js";
								
								var f = document.createElement("script");
								f.src = src;
								var before = document.getElementsByTagName("script")[0];
								
								var loadit = true;
								$('head').find('*').each(function() {									
									if ($(this).attr('src')==src) {
									   loadit = false;
									}
								});
								
								if (loadit) {
									before.parentNode.insertBefore(f, before);
									$('head').append('<link rel="stylesheet" type="text/css" href="'+that.opt.videoJsPath+'video-js.min.css" media="screen" />');
									$('head').append('<script> videojs.options.flash.swf = "'+that.opt.videoJsPath+'video-js.swf";</script>');
								}
							}
						} catch(e) {}
					});
				},
				
				//Randomize slides
				randomizeSlides:function() {
					var len = this.container.find('>ul:first-child >li').length;
					var arrSlides = new Array(len);
					var i = 0;
					
					for (i=0; i<len; i++) {
						arrSlides[i] = this.container.find('>ul:first-child >li:eq('+i+')').clone(true);
					}	
								
					for (i=0; i<len; i++) {
						var rnd = Math.floor(Math.random()*len);
						var temp = arrSlides[i];
						arrSlides[i] = arrSlides[rnd];
						arrSlides[rnd] = temp;
					}
									
					for (i=0; i<len; i++) {
						this.container.find('>ul:first-child >li:eq('+i+')').replaceWith(arrSlides[i]);
					}		
				},
				
				//Create timer
				createTimer:function() {
					this.container.append('<div class="timer"></div>');
					this.timer = this.container.find('.timer');
					this.timer.addClass("timer-"+this.opt.timerAlign)
							  .css({"width":"0%", "visibility":(this.opt.showTimer ? "visible" : "hidden")});					
				},
				
				//Create shadow
				createShadow:function() {
					if (this.opt.shadow) {
						this.container.parent().append('<div class="themo-slider-shadow themo-slider-shadow'+this.opt.shadow+'"></div>');
						this.container.parent().find('.themo-slider-shadow').css({'width':this.opt.width});
					}
				},
				
				//Container resized
				containerResized:function() {
					var that = this;
					this.container.find('.defaultimg').each(function(i) {	
						that.setSize($(this));
						
						that.opt.height = Math.round(that.opt.startHeight * (that.opt.width/that.opt.startWidth));
						that.container.height(that.opt.height);
			
						that.setSize($(this));					
			
						try{
							that.container.parent().find('.themo-slider-shadow').css({'width':that.opt.width});
						} catch(e) {}
			
						var actsh = that.container.find('>ul >li:eq('+that.opt.act+') .slotholder');
						var nextsh = that.container.find('>ul >li:eq('+that.opt.next+') .slotholder');
						that.removeSlots();
						nextsh.find('.defaultimg').css({'opacity':0});
						actsh.find('.defaultimg').css({'opacity':1});
						
						that.setCaptionPosition();
						var nextli = that.container.find('>ul >li:eq('+that.opt.next+')');
						that.container.find('.caption').each(function() { 
							$(this).stop(true, true);
						});
						that.showCaption(nextli);
							
						that.restartBannerTimer();
					});
				},
				
				//Kill the banner timer
				killBannerTimer:function() {
					this.opt.cd = 0;
					this.timer.stop(true,true).css({'width':'0%'});
					clearTimeout(this.opt.thumbtimer);
				},
				
				//Restart the banner timer
				restartBannerTimer:function() {
					var that = this;
					this.opt.cd = 0;
					if (!this.opt.videoPlaying) {
						this.timer.stop()
								  .css({'width':'0%'})
								  .animate({'width':"100%"}, {duration:(this.opt.delay-100), queue:false, easing:"linear"});
						clearTimeout(this.opt.thumbtimer);
						this.opt.thumbtimer = setTimeout(function() {
							that.moveSelectedThumb();
							that.setBulletPosition();
						}, 200);
					}
				},
			
				//Call new slide
				newSlide:function() {
					this.opt.cd = 0;
					this.swapSlide();
					//Stop timer and rescale it
					this.timer.stop()
							  .css({'width':'0%'})
							  .animate({'width':"100%"},{duration:(this.opt.delay-100), queue:false, easing:"linear"});
				},
				
				//Create the thumbnails
				createThumbs:function() {
					var that = this;
					var cap = this.container.parent();
			
					if (this.opt.navType=="thumb" || this.opt.navSecond=="both") {
						cap.append('<div class="bullets thumbs '+this.opt.navStyle+'"><div class="mask"><div class="thumb-container"></div></div></div>');
					}
					var bullets = cap.find('.bullets.thumbs .mask .thumb-container');
					var bup = bullets.parent();
			
					bup.width(this.opt.thumbWidth*this.opt.thumbAmount);
					bup.height(this.opt.thumbHeight);
					bup.parent().width(this.opt.thumbWidth*this.opt.thumbAmount);
					bup.parent().height(this.opt.thumbHeight);

					this.container.find('>ul:first >li').each(function(i) {
						var li = that.container.find(">ul:first >li:eq("+i+")");
						if (li.data('thumb')!=undefined) {
							var src = li.data('thumb')
						} else {
							var src = li.find("img:first").attr('src');
						}
						bullets.append('<div class="bullet thumb"><img src="'+src+'"></div>');
						var bullet = bullets.find('.bullet:first');
					});
					bullets.append('<div style="clear:both"></div>');
					var minwidth = 1000;
			
					//Add the bullet click function here
					bullets.find('.bullet').each(function(i) {
						var bul = $(this);		
						bul.width(that.opt.thumbWidth);
						bul.height(that.opt.thumbHeight);
						if (minwidth>bul.outerWidth(true)) minwidth = bul.outerWidth(true);			
						bul.click(function() {
							if (!that.opt.transitionStarted && bul.index() != that.opt.act) {
								that.opt.next = bul.index();
								that.newSlide();
							}
						});
					});		
			
					var max = minwidth*this.container.find('>ul:first >li').length;
					var thumbconwidth = bullets.parent().width();
					this.opt.thumbWidth = minwidth;
			
					//Slide to position
					if (thumbconwidth<max) {
						$(document).mousemove(function(e) {
							$('body').data('mousex',e.pageX);
						});	
		
						//On mouse move on the thumbnails everything should move
						bullets.parent().mouseenter(function() {
							var $this = $(this);
							$this.addClass("over");
							var offset = $this.offset();
							var x = $('body').data('mousex')-offset.left;
							var thumbconwidth = $this.width();
							var minwidth = $this.find('.bullet:first').outerWidth(true);
							var max = minwidth*that.container.find('>ul:first >li').length;
							var diff = (max- thumbconwidth)+15;
							var steps = diff / thumbconwidth;
							x -= 30;
							//Animate to position
							var pos = (0-((x)*steps));
							if (pos>0) pos =0;
							if (pos<0-max+thumbconwidth) pos=0-max+thumbconwidth;
							that.moveThumbSliderToPosition($this,pos,200);
						});
		
						bullets.parent().mousemove(function() {
							var $this = $(this);	
							var offset = $this.offset();
							var x = $('body').data('mousex')-offset.left;
							var thumbconwidth = $this.width();
							var minwidth = $this.find('.bullet:first').outerWidth(true);
							var max = minwidth*that.container.find('>ul:first >li').length;
							var diff=(max- thumbconwidth)+15;
							var steps = diff / thumbconwidth;
							x -= 30;
							//Animate to position
							var pos = (0-((x)*steps));
							if (pos>0) pos =0;
							if (pos<0-max+thumbconwidth) pos=0-max+thumbconwidth;
							that.moveThumbSliderToPosition($this,pos,0);									
						});
		
						bullets.parent().mouseleave(function() {
							var $this = $(this);
							$this.removeClass("over");
							that.moveSelectedThumb();
						});
					}
				},
	
				//Set selected thumb position
				moveSelectedThumb:function() {
					var bullets = this.container.parent().find('.bullets.thumbs .mask .thumb-container');
					var $this = bullets.parent();
					var offset = $this.offset();
					var minwidth = $this.find('.bullet:first').outerWidth(true);		
					var x = $this.find('.bullet.selected').index() * minwidth;
					var thumbconwidth = $this.width();
					var minwidth = $this.find('.bullet:first').outerWidth(true);
					var max = minwidth*this.container.find('>ul:first >li').length;
					var diff=(max- thumbconwidth);
					var steps = diff / thumbconwidth;
			
					//Animate to position
					var pos = -x;		
					if (pos>0) pos = 0;
					if (pos<0-max+thumbconwidth) pos=0-max+thumbconwidth;
					if (!$this.hasClass("over")) {
						this.moveThumbSliderToPosition($this,pos,200);
					}
				},
	
				//Move thumb slider to position
				moveThumbSliderToPosition:function($this,pos,speed) {
					$this.stop();
					$this.find('.thumb-container').animate({'left':pos+'px'}, {duration:speed, queue:false});
				},
	
				//Create the bullets
				createBullets:function() {
					var that = this;
					if (this.opt.navType=="bullet" || this.opt.navType=="both") {
						this.container.parent().append('<div class="bullets simplebullets '+this.opt.navStyle+'"></div>');
					}
			
					var bullets = this.container.parent().find('.bullets');
			
					this.container.find('>ul:first >li').each(function(i) {
						var src = that.container.find(">ul:first >li:eq("+i+") img:first").attr('src');
						bullets.append('<div class="bullet">'+(i+1)+'</div>');
						var bullet = bullets.find('.bullet:first');
					});
			
					//Add the bullet click function here
					bullets.find('.bullet').each(function(i) {
						var bul = $(this);
						bul.click(function() {
							if (!that.opt.transitionStarted && bul.index() != that.opt.act) {
								that.opt.next = bul.index();
								that.newSlide();
							}
						});
			
					});
			
					bullets.append('<div style="clear:both"></div>');
					this.setBulletPosition();
			
					$('#unvisible_button').click(function() {
						try {
							that.opt.showNavArrowOnHover = $('.checkshowarrow').is(':checked');
							if (that.opt.ie) {
								ca.css({'visibility':(that.opt.showNavArrowOnHover ? 'hidden' : 'visible')});							
							} else {
								ca.css({'opacity':(that.opt.showNavArrowOnHover ? 0 : 1)});	
							}
						} catch(e) {}
						that.opt.navType = $('.selectnavtype').val();						
						that.opt.navOffsetVertical = that.opt.navType=="bullet" ? that.navOffV : 15;	
						that.setBulletPosition();
						setTimeout(function() {
							that.setBulletPosition();
						},100);		
					});
				},
	
				//Create arrows
				createArrows:function() {
					var that = this;
					var bullets = this.container.find('.bullets');
			
					var hidden = "";
					if (this.opt.navigationArrow=="none") hidden="visibility:none";
			
					this.container.parent().append('<div style="'+hidden+'" class="leftarrow arrows '+this.opt.navStyle+'"></div>');
					this.container.parent().append('<div style="'+hidden+'" class="rightarrow arrows '+this.opt.navStyle+'"></div>');
			
					//Right button click
					this.container.parent().find('.rightarrow').click(function() {		
						if (!that.opt.transitionStarted) {
							if (that.container.data('showus') !=undefined && that.container.data('showus') != -1) {
								that.opt.next = that.container.data('showus')-1;
							} else {
								that.opt.next++;
							}
							that.container.data('showus',-1);
							if (that.opt.next >= that.opt.slideCount) that.opt.next = 0;
							if (that.opt.next<0) that.opt.next = 0;	
							if (that.opt.act !=that.opt.next) {
								that.newSlide();
							}
						}
					});
			
					//Left button click
					this.container.parent().find('.leftarrow').click(function() {
						if (!that.opt.transitionStarted) {
							that.opt.next--;
							that.opt.leftArrowPressed = true;
							if (that.opt.next < 0) that.opt.next = that.opt.slideCount-1;
							that.newSlide();
						}
					});
			
					this.setBulletPosition();
				},
	
				//Set the swipe function
				swipeAction:function() {
					var that = this;
					//Touch enabled scroll
					if (this.opt.touchEnabled) {
						this.container.swipe({
							data:that.container,
							swipeRight:function() {
								if (!that.opt.transitionStarted) {
									that.opt.next--;
									that.opt.leftArrowPressed = true;
									if (that.opt.next<0) that.opt.next = that.opt.slideCount-1;
									that.newSlide();
								}
							},
							swipeLeft:function() {
								if (!that.opt.transitionStarted) {
									that.opt.next++;
									if (that.opt.next == that.opt.slideCount) that.opt.next = 0;
									that.newSlide();
								}
							},
							allowPageScroll:"auto"
						});
					}
				},
	
				//Show and hide the thumbs if mouse goes out of the banner
				hideThumbs:function() {
					var that = this;
					var bullets = this.container.parent().find('.bullets');
					var ca = this.container.parent().find('.arrows');
			
					if (bullets==null) {
						this.container.append('<div class=".bullets"></div>');
						var bullets = this.container.parent().find('.bullets');
					}
			
					if (ca==null) {
						this.container.append('<div class=".arrows"></div>');
						var ca = this.container.parent().find('.arrows');
					}
			
					//Add thumbnail images for the bullets
					this.container.data('hidethumbs', this.opt.hideNavSpeed);	
			
					if (this.opt.ie) {
						if (this.opt.showNavOnHover) {
							bullets.css({'visibility':'hidden'});
						}
						if (this.opt.showNavArrowOnHover) {
							ca.css({'visibility':'hidden'});
						}
					} else {
						if (this.opt.showNavOnHover) {
							try {bullets.css({'opacity':0});} catch(e) {}
						}
						if (this.opt.showNavArrowOnHover) {
							try {ca.css({'opacity':0});} catch(e) {}
						}
					}
			
					bullets.hover(
						function() {
							bullets.addClass("hovered");
							clearTimeout(that.container.data('hidethumbs'));
							if (that.opt.showNavOnHover) {
								bullets.animate({'opacity':1}, {duration:200, queue:false});
							}
							if (that.opt.showNavArrowOnHover) {
								ca.animate({'opacity':1}, {duration:200, queue:false});
							}
						},
						function() {		
							bullets.removeClass("hovered");
							if (!that.container.hasClass("hovered") && !bullets.hasClass("hovered")) {
								that.container.data('hidethumbs', setTimeout(function() {
									if (that.opt.ie) {
										if (that.opt.showNavOnHover) {
											bullets.css({'visibility':'hidden'});
										}
										if (that.opt.showNavArrowOnHover) {
											ca.css({'visibility':'hidden'});
										}
									} else {
										if (that.opt.showNavOnHover) {
											bullets.animate({'opacity':0}, {duration:200, queue:false});
										}
										if (that.opt.showNavArrowOnHover) {
											ca.animate({'opacity':0}, {duration:200, queue:false});
										}
									}
								}, that.opt.hideNavSpeed));
							}
						}
					);		
			
					ca.hover(
						function() {
							bullets.addClass("hovered");
							clearTimeout(that.container.data('hidethumbs'));
							if (that.opt.ie) {
								if (that.opt.showNavOnHover) {
									bullets.css({'visibility':'visible'});
								}
								if (that.opt.showNavArrowOnHover) {
									ca.css({'visibility':'visible'});
								}
							} else {
								if (that.opt.showNavOnHover) {
									bullets.animate({'opacity':1}, {duration:200, queue:false});
								}
								if (that.opt.showNavArrowOnHover) {
									ca.animate({'opacity':1}, {duration:200, queue:false});
								}
							}
						},
						function() {			
							bullets.removeClass("hovered");
							if (!that.container.hasClass("hovered") && !bullets.hasClass("hovered")) {
								that.container.data('hidethumbs', setTimeout(function() {
									if (that.opt.ie) {
										if (that.opt.showNavOnHover) {
											bullets.css({'visibility':'hidden'});
										}
										if (that.opt.showNavArrowOnHover) {
											ca.css({'visibility':'hidden'});
										}
									} else {
										if (that.opt.showNavOnHover) {
											bullets.animate({'opacity':0}, {duration:200, queue:false});
										}
										if (that.opt.showNavArrowOnHover) {
											ca.animate({'opacity':0}, {duration:200, queue:false});
										}
									}
								}, that.opt.hideNavSpeed));
							}
						}
					);		
			
					this.container.on('mouseenter', function() {
						that.container.addClass("hovered");
						clearTimeout(that.container.data('hidethumbs'));
						if (that.opt.ie) {
							if (that.opt.showNavOnHover) {
								bullets.css({'visibility':'visible'});
							}
							if (that.opt.showNavArrowOnHover) {
								ca.css({'visibility':'visible'});
							}
						} else {
							if (that.opt.showNavOnHover) {
								bullets.animate({'opacity':1}, {duration:200, queue:false});
							}
							if (that.opt.showNavArrowOnHover) {	
								ca.animate({'opacity':1}, {duration:200, queue:false});

							}
						}
					});
			
					this.container.on('mouseleave', function() {
						that.container.removeClass("hovered");
						if (!that.container.hasClass("hovered") && !bullets.hasClass("hovered")) {
							that.container.data('hidethumbs', setTimeout(function() {
								if (that.opt.ie) {
									if (that.opt.showNavOnHover) {
										bullets.css({'visibility':'hidden'});
									}
									if (that.opt.showNavArrowOnHover) {		
										ca.css({'visibility':'hidden'});
									}
								} else {
									if (that.opt.showNavOnHover) {
										bullets.animate({'opacity':0},{duration:200, queue:false});
									}
									if (that.opt.showNavArrowOnHover) {	
										ca.animate({'opacity':0},{duration:200, queue:false});
									}
								}
							}, that.opt.hideNavSpeed));
						}
					});		
				},
	
				//Set position of bullets
				setBulletPosition:function() {	
					//For the preview we need to handle if both navigation is loaded
					if (this.opt.navType=="both") {
						this.opt.navType = "bullet";
						this.opt.navSecond = "both";
					}
					
					this.opt.navOH = this.opt.navOffsetHorizontal * this.opt.bw;
					this.opt.navOV = this.opt.navOffsetVertical * this.opt.bh;
					if (this.opt.bw!=1) this.opt.navOH = 0;
					
					//Some help
					var cap = this.container.parent();
					var la = cap.find('.leftarrow');
					var ra = cap.find('.rightarrow');
			
					//The bullet navigation positions
					if (this.opt.navType=="bullet") {		
						var bullets = cap.find('.bullets.simplebullets');
						var navb = cap.find('.bullets.simplebullets.navbar');
						bullets.css({'visibility':'visible'});
	
						try {
							cap.find('.thumbs').css({'visibility':'hidden'});
							if (this.opt.ie) cap.find('.thumbs').remove();
						} catch(e) {}
	
						var fulllong = bullets.width();
						if (!bullets.hasClass("thumbs")) {
							fulllong = 0;
							bullets.find('.bullet').each(function() { fulllong += $(this).outerWidth(true);});
							bullets.css({'width':(fulllong)+"px"});
						}
	
						var ldiff = cap.outerWidth()-this.opt.width;
	
						bullets.css({'left':(this.opt.navOH) + ((ldiff+this.opt.width-fulllong)/2)+"px", 'bottom':this.opt.navOV+"px"});
	
						if (this.opt.navStyle=="navbar") {
							la.removeClass("large");
							ra.removeClass("large");
							la.css({'visibility':'visible'});
							ra.css({'visibility':'visible'});
							var diff = 0;	
							la.css({'position':'absolute', 'left':(bullets.position().left - la.outerWidth(true))+"px", 'top': bullets.position().top+"px"});	
							ra.css({'position':'absolute', 'left':(bullets.outerWidth(true) + bullets.position().left)+"px", 'top':bullets.position().top+"px"});
							try {
								navb.css({'paddingLeft':'30px', 'paddingRight':'30px', 'margin-left':'-30px'});
							} catch(e) {}
						} else {
							if (this.opt.navArrow=="visible") {
								la.addClass("large");
								ra.addClass("large");
								la.css({'visibility':'visible'});
								ra.css({'visibility':'visible'});
								var decorh = cap.outerHeight();
								la.css({'position':'absolute','left':(ldiff/2)+"px",'top': (decorh/2)+"px"});
								ra.css({'position':'absolute','left':(this.opt.width - ra.outerWidth()+ldiff/2)+"px", 'top':(decorh/2)+"px"});
								try {
									navb.css({'paddingLeft':'10px', 'paddingRight':'10px', 'margin-left':'-10px'});
								} catch(e) {}
							} else {
								la.css({'visibility':'hidden'});
								ra.css({'visibility':'hidden'});
								try {
									navb.css({'paddingLeft':'10px', 'paddingRight':'10px', 'margin-left':'-10px'});
								} catch(e) {}
							}
						}
					} else {	
						//The thumbs navigation positions
						if (this.opt.navType=="thumb") {
							var thumbs = cap.find('.thumbs');
							try{cap.find('.bullets').css({'visibility':'hidden'});} catch(e) {}
							thumbs.css({'visibility':'visible', 'padding':this.opt.thumbContainerBorder+"px"});		
	
							var decorh = thumbs.parent().outerHeight();
	
							var ldiff = cap.outerWidth()- this.opt.width;
	
							thumbs.css({'left':(this.opt.navOH) + ((this.opt.width-thumbs.width())/2)+"px"});
							thumbs.css({'bottom':(0-thumbs.outerHeight(true)  + (this.opt.navOV))+"px"});
	
							if (this.opt.navArrow=="visible") {
								la.css({'visibility':'visible'});
								ra.css({'visibility':'visible'});
								la.addClass("large");
								ra.addClass("large");
								la.css({'position':'absolute','left':(ldiff/2)+"px", 'top':(cap.outerHeight()/2 )+"px"});
								ra.css({'position':'absolute','left':(this.opt.width - ra.outerWidth()+ldiff/2)+"px", 'top':(cap.outerHeight()/2)+"px"});
							} else {
								la.css({'visibility':'hidden'});
								ra.css({'visibility':'hidden'});
							}		
						} else {
							if (this.opt.navType=="none") {
								try{cap.find('.bullets').css({'visibility':'hidden'});} catch(e) {}
								try{cap.find('.thumbs').css({'visibility':'hidden'});} catch(e) {}
								if (this.opt.navArrow=="visible") {
									var ldiff = cap.outerWidth()- this.opt.width;
									la.css({'visibility':'visible'});
									ra.css({'visibility':'visible'});
									la.addClass("large");
									ra.addClass("large");
									la.css({'position':'absolute','left':(ldiff/2)+"px", 'top':(cap.outerHeight()/2)+"px"});
									ra.css({'position':'absolute','left':(this.opt.width - ra.outerWidth()+ldiff/2)+"px", 'top':(cap.outerHeight()/2)+"px"});
								} else {
									la.css({'visibility':'hidden'});
									ra.css({'visibility':'hidden'});
								}
							}
						}
					}		
				},
				
				//Set the image size to fit into the container
				setSize:function(img) {	
					this.opt.width = parseInt(this.container.width(),0);
					this.opt.height = parseInt(this.container.height(),0);
		
					this.opt.bw = this.opt.width / this.opt.startWidth;
					this.opt.bh = this.opt.height / this.opt.startHeight;
					
					if (this.opt.fullScreen) {
						this.opt.height = this.opt.bw*this.opt.startHeight;
					}
		
					if (this.opt.bh>1) {
						this.opt.bw = 1;
						this.opt.bh = 1;
					}
		
					//If image is already prepared, we reset the size first here
					if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload')==undefined) {
						if (img.data('orgw')!=undefined && img.data('orgw')!=0) {
							img.width(img.data('orgw'));
							img.height(img.data('orgh'));
						}	
					}
		
					var fw = this.opt.width / img.width();
					var fh = this.opt.height / img.height();	
		
					this.opt.fw = fw;
					this.opt.fh = fh;
		
					if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload')==undefined) {
						if (img.data('orgw')==undefined || img.data('orgw')==0) {
							img.data('orgw',img.width());
							img.data('orgh',img.height());
						}	
					}
		
					if (this.opt.fullWidth && !this.opt.fullScreen) {	
						var cow = this.container.parent().width();
						var coh = this.container.parent().height();
						var ffw = cow/img.data('orgw');
						var ffh = coh/img.data('orgh');
	
						if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload')==undefined) {
							img.width(img.width()*ffh);
							img.height(coh);
						}
						
						if (img.width()<cow) {
							img.width(cow+50);
							ffw = img.width()/img.data('orgw');
							img.height(img.data('orgh')*ffw);
						} 
						
						if (img.width()>cow) {
							img.data("fxof", (cow-img.width())/2);	
							img.css({'position':'absolute', 'left':img.data('fxof')+'px'});
						}
						
						if (img.height()<=coh) {
							img.data('fyof',0);
							img.data("fxof", (cow-img.width())/2);
							img.css({'position':'absolute','top':img.data('fyof')+"px",'left':img.data('fxof')+"px"});
						} 
						
						if (img.height()>coh && img.data('fullwidthcentering')==true) {
							img.data('fyof', (coh-img.height())/2);
							img.data("fxof", (cow-img.width())/2);
							img.css({'position':'absolute','top':img.data('fyof')+"px",'left':img.data('fxof')+"px"});
						}
					} else if (this.opt.fullScreen) {	
						var cow = this.container.parent().width();
						var coh = $(window).height();						

						//If the default grid is higher than the calculated slider height, we need to resize the slider height
						var offsety = (coh-(this.opt.startHeight*this.opt.bh))/2;
						if (offsety<0) coh = this.opt.startHeight*this.opt.bh;

						if (this.opt.fullScreenOffsetContainer!=undefined) {
							try{
								var offcontainers = this.opt.fullScreenOffsetContainer.split(",");
								$.each(offcontainers, function(index, searchedcont) {
									coh -= $(searchedcont).outerHeight(true);
								});
							} catch(e) {}
						}		
						
						this.container.parent().height(coh);
						this.container.css({'height':'100%'});					

						this.opt.height = coh;

						var ffh = coh/img.data('orgh');
						var ffw = cow/img.data('orgw');

						if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload') ===undefined) {
							img.width(img.width()*ffh);
							img.height(coh);
						}

						if (img.width()<cow) {
							img.width(cow+50);
							var ffw = img.width()/img.data('orgw');
							img.height(img.data('orgh')*ffw);
						}

						if (img.width()>cow) {
							img.data("fxof", (cow- img.width())/2);
							img.css({'position':'absolute','left':img.data('fxof')+"px"});
						}

						if (img.height()<=coh) {
							img.data('fyof',0);
							img.data("fxof", (cow-img.width())/2);
							img.css({'position':'absolute','top':img.data('fyof')+"px",'left':img.data('fxof')+"px"});
						}

						if (img.height()>coh && img.data('fullwidthcentering')==true) {
							img.data('fyof', (coh-img.height())/2);
							img.data("fxof", (cow-img.width())/2);
							img.css({'position':'absolute','top':img.data('fyof')+"px",'left':img.data('fxof')+"px"});
						}
					} else {	
						if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload')==undefined) {
							img.width(this.opt.width);
							img.height(img.height()*fw);							
						}
						
						if (img.height()<this.opt.height && img.height()!=0 && img.height()!=null) {
							if ((img.data('lazyload')!=undefined && img.data('lazydone')==1) || img.data('lazyload')==undefined) {	
								img.height(this.opt.height);
								img.width(img.data('orgw')*fh);
							}
						}
					}	
		
					img.data('neww', img.width());
					img.data('newh', img.height());
					
					if (this.opt.fullWidth) {
						this.opt.slotw = Math.ceil(img.width()/this.opt.slots);
					} else {
						this.opt.slotw = Math.ceil(this.opt.width/this.opt.slots);
					}
					
					this.opt.sloth = Math.ceil(this.opt.height/this.opt.slots);	
				},
				
				//Prepare the slides / slots
				prepareSlides:function() {	
					var that = this;
					
					this.container.find('.caption').each(function() { 
						$(this).addClass($(this).data('transition'));
						$(this).addClass('start'); 
					});
					
					//Prepare the ul container to having max height and height for any situation
					this.container.find('>ul:first').css({overflow:'hidden', width:'100%', height:'100%', maxHeight:this.container.parent().css('maxHeight')});
					
					container.find('>ul:first >li >img').each(function(j) {	
						var img = $(this);
						img.addClass('defaultimg');
						
						if (img.data('lazyload')==undefined) {
							that.setSize(img);
							that.setSize(img);
						}
						
						img.wrap('<div class="slotholder"></div>');
						img.css({'opacity':0});
						img.data('li-id',j);	
					});
		
					this.container.find('>ul:first >li').each(function(j) {
						var li = $(this);
						
						//Make li overflow hidden for further issues
						li.css({'width':'100%', 'height':'100%', 'overflow':'hidden'});
						
						if (li.data('link')!=undefined) {
							var sh = li.find(".slotholder");
							var link = li.data('link');
							var target = "_self";
							if (li.data('target')!=undefined) target = li.data('target');
							var url = '<div class="caption sft slidelink" data-x="0" data-y="0" data-start="0">\
										<a target="'+target+'" href="'+link+'">\
											<div></div>\
										</a>\
									   </div>';
							if (sh.length>0) {
								$(url).insertAfter(sh);
							} else {
								li.prepend(url);
							}
						}
					});
					
					//Resolve overflow hidden of main container
					this.container.parent().css({'overflow':'visible'});
				},
				
				//Prepare the slide
				prepareOneSlide:function(slotholder, visible) {	
					var sh = slotholder;
					var img = sh.find('img');
					this.setSize(img);
					var src = img.attr('src');
					var w = img.data('neww');
					var h = img.data('newh');
					var fulloff = img.data("fxof");
					if (fulloff==undefined) fulloff = 0;	
					var off = 0;
					if (!visible) {
						off = -this.opt.slotw;
					}
					for (var i=0;i<this.opt.slots;i++) {
						sh.append( '<div class="slot" style="position:absolute;top:0px;left:'+(fulloff+i*this.opt.slotw)+'px;overflow:hidden;width:'+this.opt.slotw+'px;height:'+h+'px">'+
										'<div class="slotslide" style="position:absolute;top:0px;left:'+off+'px;width:'+this.opt.slotw+'px;height:'+h+'px;overflow:hidden;">'+
											'<img style="position:absolute;top:0px;left:'+(0-(i*this.opt.slotw))+'px;width:'+w+'px;height:'+h+'px" src="'+src+'">'+
										'</div>'+
									'</div>');
					}
				},
		
				//Prepare the vertical slide
				prepareOneSlideV:function(slotholder, visible) {	
					var sh = slotholder;
					var img = sh.find('img');
					this.setSize(img);
					var src = img.attr('src');
					var w = img.data('neww');
					var h = img.data('newh');
					var fulloff = img.data("fxof");
					if (fulloff==undefined) fulloff = 0;
					var off = 0;
					if (!visible) {
						off = -this.opt.sloth;
					}
					for (var i=0; i<this.opt.slots; i++) {
						sh.append( '<div class="slot" style="position:absolute;top:'+(i*this.opt.sloth)+'px;left:'+(fulloff)+'px;overflow:hidden;width:'+w+'px;height:'+(this.opt.sloth)+'px">'+
										'<div class="slotslide" style="position:absolute;top:'+off+'px;left:0px;width:'+w+'px;height:'+this.opt.sloth+'px;overflow:hidden;">'+
											'<img style="position:absolute;top:'+(-(i*this.opt.sloth))+'px;left:0px;width:'+w+'px;height:'+h+'px" src="'+src+'">'+
										'</div>'+
									'</div>');
					}
				},	
		
				//Prepare the slide box
				prepareOneSlideBox:function(slotholder, visible) {	
					var sh = slotholder;
					var img = sh.find('img');
					this.setSize(img);
					var src = img.attr('src');
					var w = img.data('neww');
					var h = img.data('newh');
					var fulloff = img.data("fxof");
					if (fulloff==undefined) fulloff = 0;
					var off = 0;
	
					//Set the minimal size of a box
					var basicsize = 0;
					if (this.opt.sloth>this.opt.slotw) {
						basicsize = this.opt.sloth;
					} else {
						basicsize = this.opt.slotw;
					}
					if (!visible) {
						off = -basicsize;
					}
	
					this.opt.slotw = basicsize;
					this.opt.sloth = basicsize;
					var x = 0;
					var y = 0;
	
					for (var j=0; j<this.opt.slots; j++) {
						y=0;
						for (var i=0; i<this.opt.slots; i++) 	{
							sh.append('<div class="slot" '+
									  'style="position:absolute;'+
												'top:'+y+'px;'+
												'left:'+(fulloff+x)+'px;'+
												'width:'+basicsize+'px;'+
												'height:'+basicsize+'px;'+
												'overflow:hidden;">'+
	
									  '<div class="slotslide" data-x="'+x+'" data-y="'+y+'" '+
									  'style="position:absolute;'+
												'top:'+(0)+'px;'+
												'left:'+(0)+'px;'+
												'width:'+basicsize+'px;'+
												'height:'+basicsize+'px;'+
												'overflow:hidden;">'+
	
									  '<img style="position:absolute;'+
												'top:'+(0-y)+'px;'+
												'left:'+(0-x)+'px;'+
												'width:'+w+'px;'+
												'height:'+h+'px"'+
									  'src="'+src+'"></div></div>');
							y += basicsize;
						}
						x += basicsize;
					}
				},
		
				//Remove slots
				removeSlots:function(time) {
					var that = this;
					if (time==undefined) {
						time = 80;
					}
					setTimeout(function() {
						that.container.find('.slotholder .slot').each(function() {
							clearTimeout($(this).data('tout'));
							$(this).remove();
						});
						that.opt.transitionStarted = false;
					},time);
				},				
				
				//Swap slide
				swapSlide:function() {
					var that = this;
					this.opt.lastslide = this.opt.act;
					
					try{
						this.actli = this.container.find('>ul:first-child >li:eq('+this.opt.act+')');
					} catch(e) {
						this.actli = this.container.find('>ul:first-child >li:eq(1)');
					}					
					
					this.nextli = this.container.find('>ul:first-child >li:eq('+this.opt.next+')');
		
					var defimg = this.nextli.find('.defaultimg');
		
					if (defimg.data('lazyload')!=undefined && defimg.data('lazydone')!=1 ) {
						defimg.attr('src', defimg.data('lazyload')),
						defimg.data('lazydone', 1);
						defimg.data('orgw', 0);
						
						var waitforsrc = setInterval(function() {
							if (defimg.attr('src')==defimg.data('lazyload')) {
								clearInterval(waitforsrc);
								that.preloader.fadeIn(300);
								
								setTimeout(function() {
									that.killBannerTimer();
								}, 180);		
								
								that.nextli.waitForImages(function() {		
									setTimeout(function() {
										that.restartBannerTimer();
									}, 190);
									
									that.preloader.fadeOut(600);
									that.setSize(defimg);
									that.setBulletPosition();
									that.setSize(defimg);
									that.swapSlideProgress();							
								});	
							}
						}, 100);			
					} else {
						this.swapSlideProgress();
					}
				},
				
				//Swap the slides
				swapSlideProgress:function() {
					var that = this;
					
					this.container.trigger('themo_slider.onbeforeswap');
					
					this.opt.transitionStarted = true;
					this.opt.videoPlaying = false;
					this.opt.lastslide = this.opt.act;
			
					try{
						this.actli = this.container.find('>ul:first-child >li:eq('+this.opt.act+')');
					} catch(e) {
						this.actli = this.container.find('>ul:first-child >li:eq(1)');
					}
			
					this.nextli = this.container.find('>ul:first-child >li:eq('+this.opt.next+')');
					
					this.actsh = this.actli.find('.slotholder');
					this.nextsh = this.nextli.find('.slotholder');
					this.actli.css({'visibility':'visible'});
					this.nextli.css({'visibility':'visible'});
			
					if (this.opt.ie) {
						if (this.nextli.data('transition')=="boxfade") this.nextli.data('transition',"boxslide");
						if (this.nextli.data('transition')=="slotfade-vertical") this.nextli.data('transition',"slotzoom-vertical");
						if (this.nextli.data('transition')=="slotfade-horizontal") this.nextli.data('transition',"slotzoom-horizontal");
					}
					
					//If delay has been set via the slide, we take the new value, other way the old one
					if (this.nextli.data('delay')!=undefined) {
						this.opt.cd = 0;
						this.opt.delay = this.nextli.data('delay');
					} else {
						this.opt.delay = this.opt.origcd;
					}
			
					//Reset position and fades of li's
					this.actli.css({'left':'0px','top':'0px'});
					this.nextli.css({'left':'0px','top':'0px'});
			
					//Choose transition - random effects
					var effect = EFFECTS[this.nextli.data('transition')];
					if (effect==undefined) {
						effect = EFFECTS[this.opt.transition];
					}	
					if (effect==EFFECTS["random"]) {
						effect = Math.floor(Math.random()*(ei-1));
					}		
			
					var direction = -1;
					if (this.opt.leftArrowPressed || this.opt.act>this.opt.next) direction = 1;
			
					//Slide horizontal
					if (this.nextli.data('transition')=="slide-horizontal") {
						effect = EFFECTS["slideleft"];
						if (this.opt.leftArrowPressed) {
							effect = EFFECTS["slideright"];
						}
					}
			
					//Slide vertical
					if (this.nextli.data('transition')=="slide-vertical") {
						effect = EFFECTS["slideup"];
						if (this.opt.leftArrowPressed) {
							effect = EFFECTS["slidedown"];
						}
					}
			
					this.opt.leftArrowPressed = false;
			
					if (effect>(this.opt.ei-1)) effect = opt.ei-1;
					if (effect<0) effect = 0;
			
					if (!$.support.transition && effect>EFFECTS["papercut"]) {
						effect = Math.round(Math.random()*this.noCSS3effectCount);
						this.nextli.data('slotamount',Math.round(Math.random()*12+4));
					};
					if (this.opt.ie && (effect==EFFECTS["3dcurtain-horizontal"] || effect==EFFECTS["papercut"] || effect==EFFECTS["slotslide-horizontal"] || effect==EFFECTS["slotslide-vertical"] || effect==EFFECTS["slotfade-horizontal"] || effect==EFFECTS["slotfade-vertical"] )) {
						effect = Math.round(Math.random()*3+12);
					}
					if (this.opt.ie9 && (effect==EFFECTS["slotslide-vertical"])) effect = EFFECTS["curtain-1"];
			
					//Define the master speed for the slide
					this.masterspeed = 300;
					if (this.nextli.data('masterspeed')!=undefined && this.nextli.data('masterspeed')>99 && this.nextli.data('masterspeed')<4001) {
						this.masterspeed = this.nextli.data('masterspeed');

					}
			
					//Set the bullets selected or unselected
					this.container.parent().find(".bullet").each(function() {
						var bul = $(this);
						bul.removeClass("selected");
						if (bul.index() == that.opt.next) bul.addClass('selected');
					});
			
					//Set the next caption and remove the last caption
					this.container.find('>li').each(function() {
						var li = $(this);
						if (li.index!=that.opt.act && li.index!=that.opt.next) li.css({'z-index':16});
					});
			
					this.actli.css({'z-index':18});
					this.nextli.css({'z-index':20, 'opacity':0});
					
					//Animate the captions
					this.removeCaption(this.actli);
					this.showCaption(this.nextli);
			
					//Set the actual amount of slides / Set a random amount of slots
					if (this.nextli.data('slotamount')==undefined || this.nextli.data('slotamount')<1) {
						this.opt.slots = Math.round(Math.random()*12+4);						
						if (this.nextli.data('transition')=="boxslide") {
							this.opt.slots = Math.round(Math.random()*6+3);
						}
					} else {
						this.opt.slots = this.nextli.data('slotamount');
					}
			
					//Rotate slides
					if (this.nextli.data('rotate')==undefined) {
						this.opt.rotate = 0;
					} else {
						if (this.nextli.data('rotate')==999) {
							this.opt.rotate = Math.round(Math.random()*360);
						} else {
							this.opt.rotate = this.nextli.data('rotate');
						}
					}
					if (!$.support.transition || this.opt.ie || this.opt.ie9) this.opt.rotate = 0;
			
					//First slide
					if (this.opt.startUp) {
						this.actli.css({'opacity':0});
						this.opt.startUp = false;
					}
			
					//Animate the effect
					switch (effect) {
						case EFFECTS["boxslide"]:
							this.animationBoxSlide();
							break;
						case EFFECTS["boxfade"]:
							this.animationBoxFade();
							break;
						case EFFECTS["boxzigzag"]:
							this.animationBoxZigZag();
							break;
						case EFFECTS["slotslide-horizontal"]:
							this.animationSlotSlideHorizontal();
							break;
						case EFFECTS["slotslide-vertical"]:
							this.animationSlotSlideVertical();
							break;
						case EFFECTS["curtain-1"]:
							this.animationCurtain1();
							break;
						case EFFECTS["curtain-2"]:
							this.animationCurtain2();
							break;
						case EFFECTS["curtain-3"]:
							this.animationCurtain3();
							break;
						case EFFECTS["slotzoom-horizontal"]:
							this.animationSlotZoomHorizontal();
							break;
						case EFFECTS["slotzoom-vertical"]:
							this.animationSlotZoomVertical();
							break;
						case EFFECTS["slotfade-horizontal"]:
							this.animationSlotFadeHorizontal();
							break;
						case EFFECTS["slotfade-vertical"]:
							this.animationSlotFadeVertical();
							break;
						case EFFECTS["fade"]:
							this.animationFade();
							break;
						case EFFECTS["slideleft"]:
						case EFFECTS["slideup"]:
						case EFFECTS["slidedown"]:
						case EFFECTS["slideright"]:
							this.animationSlide(effect);
							break;					
						case EFFECTS["papercut"]:
							this.animationPaperCut();
							break;
						case EFFECTS["3dcurtain-horizontal"]:
							this.animation3DCurtainHorizontal();
							break;
						case EFFECTS["3dcurtain-vertical"]:
							this.animation3DCurtainVertical();
							break;
						case EFFECTS["cubic"]:
							this.animationCubic(direction);
							break;
						case EFFECTS["flyin"]:
							this.animationFlyIn(direction);
							break;
						case EFFECTS["turnoff"]:
							this.animationTurnOff(direction);
							break;
					}
			
					var data = {};
					data.slideIndex = this.opt.next+1;
					this.container.trigger('themo_slider.onchange', data);
					setTimeout(function() {that.container.trigger('themo_slider.onafterswap');}, this.masterspeed);
					this.container.trigger('themo_slider.onvideostop');
				},
				
				/*****************************
				    - Transition effects -
				*****************************/
								
				//BoxSlide
				animationBoxSlide:function() {
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;	
					this.nextli.css({'opacity':1});
					
					//Prepare the slots here
					this.prepareOneSlideBox(this.actsh, true);
					this.prepareOneSlideBox(this.nextsh, false);
					
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.css({'top':-that.opt.sloth+"px", 'left':-that.opt.slotw+"px"});	
						setTimeout(function() {
							ss.animate({'top':'0px', 'left':'0px'}, {duration:400, queue:false,
								complete:function() {
									if (i==(that.opt.slots*that.opt.slots)-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.opt.transitionStarted = false;		
										that.moveSelectedThumb();
									}													
								}
							});						
						}, i*25);
					});			
				},
				
				//BoxFade
				animationBoxFade:function() {
					var that = this;
					if (this.opt.slots>5) this.opt.slots = 5;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideBox(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(j) {
						var ss=$(this);
						ss.css({'opacity':0});
						ss.find('img').css({'opacity':0});
						if (that.opt.ie9) {
							ss.find('img').transition({'top':(Math.random()*that.opt.slotw-that.opt.slotw)+"px",'left':(Math.random()*that.opt.slotw-that.opt.slotw)+"px"},0);
						} else {
							ss.find('img').transition({'top':(Math.random()*that.opt.slotw-that.opt.slotw)+"px",'left':(Math.random()*that.opt.slotw-that.opt.slotw)+"px", rotate:that.opt.rotate},0);
						}
						var rand = Math.random()*1000+(that.masterspeed+200);
						if (j==(that.opt.slots*that.opt.slots)-1) rand = 1500;
						ss.find('img').transition({'opacity':1,'top':(0-ss.data('y'))+"px",'left':(0-ss.data('x'))+'px', rotate:0},rand);
						ss.transition({'opacity':1},rand,function() {
							if (j==(that.opt.slots*that.opt.slots)-1) {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
							}
						});
					});
				},
				
				//BoxZigZag
				animationBoxZigZag:function() {
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;					
					this.nextli.css({'opacity':1});
					
					//Prepare the slots here
					this.prepareOneSlideBox(this.actsh, true);
					this.prepareOneSlideBox(this.nextsh, false);
					
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					var row, column, total;
					row = column = that.opt.slots;
					total = row*column;
					
					var arrBox = new Array(row);
					arrBox[0] = new Array(column);
					var arr = new Array(total);
					var i = 0, j = 0, count = 0, lastId = "";
					var fwd = true;
					
					this.nextsh.find('.slotslide').each(function(n) {
						var ss = $(this);
						ss.css({'opacity':0});
						ss.attr("id", i+"-"+j);
						arrBox[i][j] = ss;				
						j++;
						if (j==row) {
							j = 0;
							i++;
							arrBox[i] = new Array(column);
						}											
					});
					
					lastId = (column%2==0) ? "0-"+(column-1) : (row-1)+"-"+(column-1);
					i = 0; j = 0;
					
					this.intervalId = setInterval(
						function() {
							var ss = arrBox[i][j];							
							ss.animate({'opacity':1}, {duration:400, queue:false,
								complete:function() {
									if ($(this).attr("id")==lastId) {	
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.opt.transitionStarted = false;		
										that.moveSelectedThumb();
									}													
								}
							});
							if (ss.attr("id") == lastId) {
								clearInterval(that.intervalId);
								that.intervalId = null;
							}	
							(fwd ? i++ : i--);
							if (i==row || i<0) {
								fwd = !fwd;
								i = (fwd ? 0 : row-1);
								j++;
							}						
						}
					, 25);
				},			
				
				//SlotSlide-Horizontal
				animationSlotSlideHorizontal:function() {
					var that = this;
					this.masterspeed += 200;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All old slots should be slided to the right
					this.actsh.find('.slotslide').each(function() {
						var ss = $(this);
						ss.transit({'left':that.opt.slotw+'px', rotate:(0-that.opt.rotate)}, that.masterspeed, function() {
							that.removeSlots();
							that.nextsh.find('.defaultimg').css({'opacity':1});
							if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
							that.opt.act = that.opt.next;
							that.moveSelectedThumb();
						});
					});
	
					//All new slots should be slided from the left to the right
					that.nextsh.find('.slotslide').each(function() {
						var ss = $(this);
						if (that.opt.ie9) {
							ss.transit({'left':(0-that.opt.slotw)+"px"}, 0);
						} else {
							ss.transit({'left':(0-that.opt.slotw)+"px", rotate:that.opt.rotate}, 0);
							ss.transit({'left':'0px', rotate:0}, that.masterspeed,
								function() {
									that.removeSlots();
									that.nextsh.find('.defaultimg').css({'opacity':1});
									if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
									if (that.opt.ie) that.actsh.find('.defaultimg').css({'opacity':1});
									that.opt.act = that.opt.next;
									that.moveSelectedThumb();
								}
							);
						}
					});
				},
				
				//SlotSlide-Vertical
				animationSlotSlideVertical:function() {
					var that = this;
					this.masterspeed += 200;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideV(this.actsh, true);
					this.prepareOneSlideV(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All old slots should be slided to the right
					this.actsh.find('.slotslide').each(function() {
						var ss = $(this);
						ss.transit({'top':that.opt.sloth+'px', rotate:that.opt.rotate}, that.masterspeed,
							function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
							}
						);
					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function() {
						var ss = $(this);
							if (that.opt.ie9) {
								ss.transit({'top':(0-that.opt.sloth)+"px"}, 0);
							} else {
								ss.transit({'top':(0-that.opt.sloth)+"px", rotate:that.opt.rotate}, 0);
								ss.transit({'top':'0px', rotate:0}, that.masterspeed,
									function() {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								);
							}
					});
				},
				
				//Curtain-1
				animationCurtain1:function() {
					var that = this;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, true);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					this.actsh.find('.defaultimg').css({'opacity':0});
	
					//All old slots should be slided from the left to the right
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transit({'top':that.opt.height+"px", 'opacity':1, rotate:that.opt.rotate}, that.masterspeed+(i*(70-that.opt.slots)));
					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						if (that.opt.ie9) {
							ss.transition({'top':-that.opt.height+"px", 'opacity':0}, 0);
						} else {
							ss.transition({'top':-that.opt.height+"px", 'opacity':0, rotate:that.opt.rotate}, 0);
						}
						ss.transition({'top':'0px', 'opacity':1, rotate:0}, that.masterspeed+(i*(70-that.opt.slots)),
							function() {
								if (i==that.opt.slots-1) {
									that.removeSlots();
									that.nextsh.find('.defaultimg').css({'opacity':1});
									if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
									that.opt.act = that.opt.next;
									that.moveSelectedThumb();
								}
							}
						);
					});
				},
				
				//Curtain-2
				animationCurtain2:function() {
					var that = this;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, true);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					this.actsh.find('.defaultimg').css({'opacity':0});
	
					//All old slots should be slided from the left to the right
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transition({'top':that.opt.height+"px", 'opacity':1, rotate:that.opt.rotate}, that.masterspeed+((that.opt.slots-i)*(70-that.opt.slots)));
					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						if (that.opt.ie9) {
							ss.transition({'top':-that.opt.height+"px", 'opacity':0}, 0);
						} else {
							ss.transition({'top':-that.opt.height+"px", 'opacity':0, rotate:that.opt.rotate}, 0);
						}
						ss.transition({'top':'0px', 'opacity':1, rotate:0}, that.masterspeed+((that.opt.slots-i)*(70-that.opt.slots)),
							function() {
								if (i==0) {
									that.removeSlots();
									that.nextsh.find('.defaultimg').css({'opacity':1});
									if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
									that.opt.act = that.opt.next;
									that.moveSelectedThumb();
								}
							}
						);
					});
				},
				
				//Curtain-3
				animationCurtain3:function() {
					var that = this;
					this.nextli.css({'opacity':1});
					if (this.opt.slots<2) this.opt.slots = 2;
					
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, true);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					this.actsh.find('.defaultimg').css({'opacity':0});
	
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						var tempo = 0;
						if (i<that.opt.slots/2) {
							tempo = (i+2)*60;
						} else {
							tempo = (2+that.opt.slots-i)*60;
						}
						ss.transition({'top':(0+(that.opt.height))+"px",'opacity':1}, that.masterspeed+tempo);

					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						var tempo = 0;
						if (that.opt.ie9) {
							ss.transition({'top':(0-(that.opt.height))+"px", 'opacity':0}, 0);
						} else {
							ss.transition({'top':(0-(that.opt.height))+"px", 'opacity':0, rotate:that.opt.rotate}, 0);
						}
						if (i<that.opt.slots/2) {
							tempo = (i+2)*60;
						} else {
							tempo = (2+that.opt.slots-i)*60;
						}
						ss.transition({'top':'0px', 'opacity':1, rotate:0}, that.masterspeed+tempo,
							function() {
								if (i==Math.round(that.opt.slots/2)) {
									that.removeSlots();
									that.nextsh.find('.defaultimg').css({'opacity':1});
									if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
									that.opt.act = that.opt.next;
									that.moveSelectedThumb();
								}
							}
						);
	
					});
				},
				
				//SlotZoom-Horizontal
				animationSlotZoomHorizontal:function() {
					var that = this;
					this.masterspeed *= 3;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh ,true);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All old slots should be slided to the right
					this.actsh.find('.slotslide').each(function() {
						var ss = $(this).find('img');
						ss.transition({'left':(-that.opt.slotw/2)+'px', 'top':(-that.opt.height/2)+'px',
									   'width':(that.opt.slotw*2)+"px", 'height':(that.opt.height*2)+"px", 
									   opacity:0, rotate:that.opt.rotate},
									   that.masterspeed,
						   function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
							}
						);
					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this).find('img');
						if (that.opt.ie9) {
							ss.transition({'left':'0px', 'top':'0px', opacity:0}, 0);
						} else {
							ss.transition({'left':'0px', 'top':'0px', opacity:0, rotate:that.opt.rotate}, 0);
						}
						ss.transition({'left':(-i*that.opt.slotw)+'px', 'top':'0px',
									   'width':(that.nextsh.find('.defaultimg').data('neww'))+"px",
									   'height':(that.nextsh.find('.defaultimg').data('newh'))+"px",
									   opacity:1, rotate:0},
									   that.masterspeed,
							function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
							}
						);
					});	
				},
				
				//SlotZoom-Vertical
				animationSlotZoomVertical:function() {
					var that = this;
					this.masterspeed *= 3;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideV(this.actsh, true);
					this.prepareOneSlideV(this.nextsh, true);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All old slots should be slided to the right
					this.actsh.find('.slotslide').each(function() {
						var ss = $(this).find('img');
						ss.transition({'left':(-that.opt.width/2)+'px', 'top':(-that.opt.sloth/2)+'px',
									   'width':(that.opt.width*2)+"px", 'height':(that.opt.sloth*2)+"px",
									   opacity:0, rotate:that.opt.rotate},
									   that.masterspeed,
							function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
							}
						);
					});
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss=$(this).find('img');
						if (that.opt.ie9) {
							ss.transition({'left':'0px', 'top':'0px', opacity:0}, 0);
						} else {
							ss.transition({'left':'0px', 'top':'0px', opacity:0, rotate:that.opt.rotate}, 0);
						}
						ss.transition({'left':'0px', 'top':(-i*that.opt.sloth)+'px',
									   'width':(that.nextsh.find('.defaultimg').data('neww'))+"px",
									   'height':(that.nextsh.find('.defaultimg').data('newh'))+"px",
									   opacity:1, rotate:0},
									   that.masterspeed,
							function() {
									that.removeSlots();
									that.nextsh.find('.defaultimg').css({'opacity':1});
									if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
									that.opt.act = that.opt.next;
									that.moveSelectedThumb();
							});
	
					});
				},
				
				//SlotFade-Horizontal
				animationSlotFadeHorizontal:function() {
					var that = this;
					this.nextli.css({'opacity':1});
					this.opt.slots = this.opt.width/20;
	
					this.prepareOneSlide(this.nextsh, true);
	
					this.nextsh.find('.defaultimg').css({'opacity':0});
	
					var ssamount = 0;
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ssamount++;
						ss.transition({'opacity':0, x:0, y:0}, 0);
						ss.data('tout', setTimeout(function() {ss.transition({x:0, y:0, 'opacity':1}, that.masterspeed);}, i*4));
					});
	
					setTimeout(
						function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								if (that.opt.ie) actsh.find('.defaultimg').css({'opacity':1});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
						}, (that.masterspeed+(ssamount*4))
					);
				},
				
				//SlotFade-Vertical
				animationSlotFadeVertical:function() {
					var that = this;
					this.nextli.css({'opacity':1});
					this.opt.slots = this.opt.height/20;
	
					this.prepareOneSlideV(this.nextsh, true);
	
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All new slots should be slided from the left to the right
					var ssamount = 0;
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ssamount++;
						ss.transition({'opacity':0, x:0, y:0}, 0);
						ss.data('tout',setTimeout(function() {ss.transition({x:0, y:0, 'opacity':1}, that.masterspeed);}, i*4));
	
					});
	
					setTimeout(
						function() {
								that.removeSlots();
								that.nextsh.find('.defaultimg').css({'opacity':1});
								if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
								if (that.opt.ie) actsh.find('.defaultimg').css({'opacity':1});
								that.opt.act = that.opt.next;
								that.moveSelectedThumb();
						}, (that.masterspeed+(ssamount*4))
					);
				},
				
				//Fade
				animationFade:function() {				
					var that = this;
					this.nextli.css({'opacity':1});
					this.opt.slots = 1;
					this.prepareOneSlide(this.nextsh, true);
					this.nextsh.find('.defaultimg').css({'opacity':0});
					var ssamount=0;
					
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ssamount++;
						if (that.opt.ie9 ||that.opt.ie) {
							ss.transition({'opacity':0}, 0);
						} else {
							ss.transition({'opacity':0, rotate:that.opt.rotate}, 0);
						}
						ss.transition({'opacity':1, rotate:0}, that.masterspeed);
					});
					
					setTimeout(function() {
						that.removeSlots();
						that.nextsh.find('.defaultimg').css({'opacity':1});
						if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
						if (that.opt.ie) that.actsh.find('.defaultimg').css({'opacity':1});
						that.opt.act = that.opt.next;
						that.moveSelectedThumb();
					}, this.masterspeed);
				},
				
				//Slide
				animationSlide:function(effect) {
					var that = this;
					this.masterspeed *= 3;
					this.nextli.css({'opacity':1});
	
					this.opt.slots = 1;
	
					this.prepareOneSlide(this.nextsh, true);
					this.prepareOneSlide(this.actsh, true);
	
					this.actsh.find('.defaultimg').css({'opacity':0});
					this.nextsh.find('.defaultimg').css({'opacity':0});
	
					var oow = this.opt.width;
					var ooh = this.opt.height;
					if (this.opt.fullWidth) {
						oow = this.container.parent().width();
						ooh = this.container.parent().height();
					}
	
					var ssn = this.nextsh.find('.slotslide');
					
					switch (effect) {
						case EFFECTS["slideleft"]:
							if (this.opt.ie9) {
								ssn.transition({'left':oow+"px"}, 0);
							} else {
								ssn.transition({'left':oow+"px", rotate:this.opt.rotate}, 0);
							}
							break;
						case EFFECTS["slideright"]:
							if (this.opt.ie9) {
								ssn.transition({'left':-this.opt.width+"px"}, 0);
							} else {
								ssn.transition({'left':-this.opt.width+"px", rotate:this.opt.rotate}, 0);
							}
							break;	
						case EFFECTS["slideup"]:
							if (this.opt.ie9) {
								ssn.transition({'top':ooh+"px"}, 0);
							} else {
								ssn.transition({'top':ooh+"px", rotate:this.opt.rotate}, 0);
							}
							break;
						case EFFECTS["slidedown"]:
							if (this.opt.ie9) {
								ssn.transition({'top':-this.opt.height+"px"}, 0);
							} else {
								ssn.transition({'top':-this.opt.height+"px", rotate:this.opt.rotate}, 0);
							}
							break;
					}
					
					ssn.transition({'left':'0px', 'top':'0px', opacity:1, rotate:0}, this.masterspeed,
						function() {
							that.removeSlots(0);
							if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
							that.nextsh.find('.defaultimg').css({'opacity':1});
							that.opt.act = that.opt.next;
							that.moveSelectedThumb();
						}
					);
	
					var ssa = this.actsh.find('.slotslide');
					
					switch (effect) {
						case EFFECTS["slideleft"]:
							ssa.transition({'left':-oow+'px', opacity:1, rotate:0}, this.masterspeed);
							break;
						case EFFECTS["slideright"]:
							ssa.transition({'left':oow+'px', opacity:1, rotate:0}, this.masterspeed);
							break;	
						case EFFECTS["slideup"]:
							ssa.transition({'top':-ooh+'px', opacity:1, rotate:0}, this.masterspeed);
							break;
						case EFFECTS["slidedown"]:
							ssa.transition({'top':ooh+'px', opacity:1, rotate:0}, this.masterspeed);
							break;
					}
				},
				
				//PaperCut
				animationPaperCut:function() {				
					var that = this;
					this.actli.css({'position':'absolute', 'z-index':20});
					this.nextli.css({'position':'absolute', 'z-index':15});
					
					//Prepare the cuts
					this.actli.wrapInner('<div class="half-one"></div>');
					this.actli.find('.half-one').clone(true).appendTo(this.actli).addClass("half-two");
					this.actli.find('.half-two').removeClass('half-one');
					this.actli.find('.half-two').wrapInner('<div class="offset"></div>');
					
					var oow = this.opt.width;
					var ooh = this.opt.height;
					if (this.opt.fullWidth || this.opt.fullScreen) {
						oow = this.container.parent().width();
						ooh = this.container.parent().height();
					}

					var img = this.actli.find('.defaultimg');
					if (img.length>0 && img.data("fullwidthcentering")) {
						var imgh = ooh/2;
						var to = img.position().top;
					} else {
						var imgh = ooh/2;
						var to = 0;
					}
	
					//Animate the cuts
					this.actli.find('.half-one').css({'width':oow+'px', 'height':(to+imgh)+'px', 'overflow':'hidden', 'position':'absolute', 'top':'0px', 'left':'0px'});
					this.actli.find('.half-two').css({'width':oow+'px', 'height':(to+imgh)+'px', 'overflow':'hidden', 'position':'absolute', 'top':(to+imgh)+'px', 'left':'0px'});
					this.actli.find('.half-two .offset').css({'position':'absolute','top':(-this.opt.height/2)+'px', 'left':'0px'});
	
					//Delegate .transition() calls to .animate() if the browser can't do CSS transitions
					if (!$.support.transition) {
						this.actli.find('.half-one').animate({'opacity':0, 'top':(-ooh/2)+"px"}, {duration:500, queue:false});
						this.actli.find('.half-two').animate({'opacity':0, 'top':ooh+"px"}, {duration:500, queue:false});
					} else {
						var ro1 = Math.round(Math.random()*40-20);
						var ro2 = Math.round(Math.random()*40-20);
						var sc1 = Math.random()*1+1;
						var sc2 = Math.random()*1+1;
						this.actli.find('.half-one').transition({opacity:1, scale:sc1, rotate:ro1, y:(-this.opt.height/1.4)+"px"}, 800, 'in');
						this.actli.find('.half-two').transition({opacity:1, scale:sc2, rotate:ro2, y:(this.opt.height/1.4)+"px"}, 800, 'in');
						if (this.actli.html()!=null) this.nextli.transition({scale:0.8, x:this.opt.width*0.1, y:this.opt.height*0.1, rotate:ro1},0).transition({rotate:0, scale:1, x:0, y:0}, 600, 'snap');
					}
					this.nextsh.find('.defaultimg').css({'opacity':1});
					
					setTimeout(function() {
						//Clean-up before we start
						that.actli.css({'position':'absolute', 'z-index':18});
						that.nextli.css({'position':'absolute', 'z-index':20});
						that.nextsh.find('.defaultimg').css({'opacity':1});
						that.actsh.find('.defaultimg').css({'opacity':0});
						if (that.actli.find('.half-one').length>0)  {
							that.actli.find('.half-one >img, .half-one >div').unwrap();
						}
						that.actli.find('.half-two').remove();
						that.opt.transitionStarted = false;
						that.opt.act = that.opt.next;
					}, 800);
					
					this.nextli.css({'opacity':1});
				},
				
				//3DCurtain-Horizontal
				animation3DCurtainHorizontal:function() {		
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideV(this.actsh, true);
					this.prepareOneSlideV(this.nextsh ,false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transition({opacity:0, rotateY:350 ,rotateX:40, perspective:'1400px'}, 0);
						setTimeout(function() {
							ss.transition({opacity:1, top:0, left:0, scale:1, perspective:'150px', rotate:0,rotateY:0, rotateX:0}, that.masterspeed*2,
								function() {
									if (i==that.opt.slots-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								});
						}, i*100);
					});
				},
				
				//3DCurtain-Vertical
				animation3DCurtainVertical:function() {		
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transition({rotateX:10 ,rotateY:310, perspective:'1400px', rotate:0, opacity:0}, 0);
						setTimeout(function() {
							ss.transition({top:0, left:0, scale:1, perspective:'150px', rotate:0, rotateY:0, rotateX:0, opacity:1}, that.masterspeed*2,
								function() {
									if (i==that.opt.slots-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								});
						},i*100);
					});
				},
				
				//Cubic
				animationCubic:function(direction) {		
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots=10;
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlide(this.actsh, true);
					this.prepareOneSlide(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});
					
					var chix = this.nextli.css('z-index');
					var chix2 = this.actli.css('z-index');
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.parent().css({'overflow':'visible'});
						ss.css({'background':'#333'});
						if (direction==1) {
							ss.transition({opacity:0, left:0, top:that.opt.height/2, perspective:that.opt.height*100, rotate3d:'1, 0, 0, -90deg'}, 0);
						} else {
							ss.transition({opacity:0, left:0, top:-that.opt.height/2, perspective:that.opt.height*100, rotate3d:'1, 0, 0, 90deg'}, 0);
						}
						setTimeout(function() {
							ss.transition({opacity:1, top:0, rotate3d:'1, 0, 0, 0deg'}, that.masterspeed*2,
								function() {
									if (i==that.opt.slots-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								});
						},i*150);
					});
	
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.parent().css({'overflow':'visible'});
						ss.css({'background':'#333'});
						ss.transition({top:0, perspective:that.opt.height*100, rotate3d: '1, 0, 0, 0deg'}, 0);
						that.actsh.find('.defaultimg').css({'opacity':0});
						setTimeout(function() {
							if (direction==1) {
								ss.transition({opacity:0.6, left:0, top:-that.opt.height/2, rotate3d: '1, 0, 0, 90deg'}, that.masterspeed*2, function() {});
							} else {
								ss.transition({opacity:0.6, left:0, top:that.opt.height/2, rotate3d: '1, 0, 0, -90deg'}, that.masterspeed*2, function() {});
							}
						},i*150);
					});
				},
				
				//FlyIn
				animationFlyIn:function(direction) {		
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;	
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideV(this.actsh, true);
					this.prepareOneSlideV(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});				
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss=$(this);
						ss.parent().css({'overflow':'visible'});
						if (direction==1) {
							ss.transition({scale:0.8, top:0, left:-that.opt.width, perspective:that.opt.width, rotate3d:'2, 5, 0, 110deg'}, 0);
						} else {
							ss.transition({scale:0.8, top:0, left:that.opt.width, perspective:that.opt.width, rotate3d:'2, 5, 0, -110deg'}, 0);
						}
						setTimeout(function() {
							ss.transition({scale:0.8, left:0, perspective:that.opt.width, rotate3d:'1, 5, 0, 0deg'}, that.masterspeed*2, 'ease').transition({scale:1}, 200, 'out',
								function() {
									if (i==that.opt.slots-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								});
						},i*100);
					});
	
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transition({scale:0.5, left:0, perspective:500, rotate3d:'1, 5, 0, 5deg'}, 300, 'in-out');
						that.actsh.find('.defaultimg').css({'opacity':0});
						setTimeout(function() {
							if (direction==1) {
								ss.transition({top:0, left:that.opt.width/2, perspective:that.opt.width, rotate3d:'0, -3, 0, 70deg', opacity:0}, that.masterspeed*2, 'out', function() {});
							} else {
								ss.transition({top:0, left:-that.opt.width/2, perspective:that.opt.width, rotate3d:'0, -3, 0, -70deg', opacity:0}, that.masterspeed*2, 'out', function() {});
							}
						},i*100);
					});
				},
				
				//TurnOff
				animationTurnOff:function(direction) {		
					var that = this;
					this.masterspeed += 100;
					if (this.opt.slots>10) this.opt.slots = 10;	
					this.nextli.css({'opacity':1});
	
					//Prepare the slots here
					this.prepareOneSlideV(this.actsh, true);
					this.prepareOneSlideV(this.nextsh, false);
	
					//Set default image unvisible
					this.nextsh.find('.defaultimg').css({'opacity':0});				
	
					//All new slots should be slided from the left to the right
					this.nextsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						if (direction==1) {
							ss.transition({top:0, left:-that.opt.width/2, perspective:that.opt.width*2, rotate3d:'0, 100, 0, 90deg'}, 0);
						} else {
							ss.transition({top:0, left:that.opt.width/2, perspective:that.opt.width*2, rotate3d:'0, 100, 0, -90deg'} ,0);
						}
						setTimeout(function() {
							ss.transition({left:0, perspective:that.opt.width*2, rotate3d:'0, 0, 0, 0deg'}, that.masterspeed*2,
								function() {
									if (i==that.opt.slots-1) {
										that.removeSlots();
										that.nextsh.find('.defaultimg').css({'opacity':1});
										if (that.nextli.index()!=that.actli.index()) that.actsh.find('.defaultimg').css({'opacity':0});
										that.opt.act = that.opt.next;
										that.moveSelectedThumb();
									}
								}
							);
						},i*100);
					});
	
					this.actsh.find('.slotslide').each(function(i) {
						var ss = $(this);
						ss.transition({left:0, perspective:that.opt.width*2, rotate3d:'0, 0, 0, 0deg'}, 0);
						that.actsh.find('.defaultimg').css({'opacity':0});
						setTimeout(function() {
							if (direction==1) {
								ss.transition({top:0, left:that.opt.width/2, perspective:that.opt.width, rotate3d:'0, 1000, 0, -90deg'}, that.masterspeed*1.5, function() {});
							} else {
								ss.transition({top:0, left:-that.opt.width/2, perspective:that.opt.width, rotate3d:'0, 1000, 0, +90deg'}, that.masterspeed*1.5 ,function() {});
							}
						},i*100);
					});
				},
				
				/******************
				    - YouTube -
				******************/
				onYouTubePlayerAPIReady:function() {},
	
				//Change the YouTube player state here
				onPlayerStateChange:function(e) {
					var embedCode = e.target.getVideoEmbedCode();
					var ytcont = $('#'+embedCode.split('id="')[1].split('"')[0]);
					var container = ytcont.closest('.themo-slider');
					var timer = container.find('.timer');
					var opt;					
					
					if (e.data==YT.PlayerState.PLAYING) {
						opt = container.data('opt');						
						opt.videoPlaying = true;
						opt.videoStarted = true;
						timer.stop();
						if (ytcont.closest('.caption').data('volume')=="mute") {
							player.mute();
						}
					} else {
						opt = container.data('opt');
						
						if (e.data!=-1) {
							opt.videoPlaying = false;
							opt.videoStopped = true;
							if (opt.conthover==0) {
								timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100), queue:false, easing:"linear"});
							}
						}
					}
					
					if (e.data==0 && opt.nextSlideAtEnd) {
						opt.container.rasNext();
					}
				},
				
				//YouTube video autoplay
				onPlayerReady:function(e) {
					e.target.playVideo();
				},
	
				/******************
				    - Vimeo -
				******************/
				
				//Add event
				addEvent:function(element, eventName, callback) {
					if (element.addEventListener) {
						element.addEventListener(eventName, callback, false);
					} else {
						element.attachEvent(eventName, callback, false);
					}
				},
	
				//Change the Vimeo player state here
				vimeoReady:function(player_id, autoplay) {
					var froogaloop = $f(player_id);
					var vimcont = $('#'+player_id);
					var container = vimcont.closest('.themo-slider');
					var timer = container.find('.timer');
					var opt;
					
					froogaloop.addEvent('ready', function(data) {
						if(autoplay) froogaloop.api('play');
						
						froogaloop.addEvent('play', function(data) {
							opt = timer.data('opt');							
							opt.videoPlaying = true;
							timer.stop();
							if (vimcont.closest('.caption').data('volume')=="mute") {
								froogaloop.api('setVolume',"0");
							}
						});
						
						froogaloop.addEvent('finish', function(data) {
							opt = timer.data('opt');
							opt.videoPlaying = false;
							opt.videoStarted = true;
							if (opt.conthover==0) {
								timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100), queue:false, easing:"linear"});
							}
							if (opt.nextSlideAtEnd) opt.container.rasNext();
						});
						
						froogaloop.addEvent('pause', function(data) {
							opt = timer.data('opt');
							opt.videoPlaying = false;
							opt.videoStopped = true;
							if (opt.conthover==0) {
								timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100), queue:false, easing:"linear"});
							}
						});
					});	
				},
	
				/**********************
				    - HTML5 video -
				**********************/
				html5VideoReady:function(myPlayer, player_id, that) {
					if (player_id==undefined) player_id = $(myPlayer["b"]).attr('id');
					var player_cont = $('#'+player_id);
					var container = player_cont.closest('.themo-slider');
					var timer = container.find('.timer');
					var opt;
					
					myPlayer.on("play",function() {
						opt = timer.data('opt');		
						if (player_cont.closest('.caption').data('volume')=="mute") {
							myPlayer.volume(0);
						}
						try{
							opt.videoPlaying = true;
						} catch(e) {}
						timer.stop();					
					});

					myPlayer.on("pause",function() {
						opt = timer.data('opt');		
						opt.videoPlaying = false;
						opt.videoStopped = true;
						if (opt.conthover==0) {
							timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100),queue:false, easing:"linear"});
						}						
					});

					myPlayer.on("ended",function() {
						opt = timer.data('opt');		
						opt.videoPlaying = false;						
						opt.videoStopped = true;
						if (opt.conthover==0) {
							timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100),queue:false, easing:"linear"});
						}
						if (opt.nextSlideAtEnd) opt.container.rasNext();
					});
					
					myPlayer.on("loadedmetadata", function(data) {
						var videoWidth = 0;
						var videoHeight = 0;

						for(var prop in this) {
							try{
								if(this[prop].hasOwnProperty('videoWidth')) {
									videoWidth = this[prop].videoWidth;
								}
								if(this[prop].hasOwnProperty('videoHeight')) {
									videoHeight = this[prop].videoHeight;
								}
							} catch(e) {}
						}

						var mediaAspect = videoWidth/videoHeight;
						
						if (player_cont.data('mediaAspect')==undefined) {
							player_cont.data('mediaAspect', mediaAspect);
						}
						
						if (player_cont.closest('.caption').data('forcecover')) {
							that.updateHTML5Size(player_cont, container);
						}
					});
				},
				
				//Resize HTML video for fullscreen
				updateHTML5Size:function(pc, container) {			
					var windowW = container.width();
					var windowH = container.height();
					var mediaAspect = pc.data('mediaAspect');
					var windowAspect = windowW/windowH;
					
					pc.parent().find('.vjs-poster').css({width:"100%",height:"100%"});
					
					if (windowAspect<mediaAspect) {						
						//Taller
						pc.width(windowH*mediaAspect).height(windowH);
						pc.css('top',0).css('left',-(windowH*mediaAspect-windowW)/2).css('height',windowH);
						pc.find('.vjs-tech').css('width',windowH*mediaAspect);
					} else {
						//Wider
						pc.width(windowW).height(windowW/mediaAspect);
						pc.css('top',-(windowW/mediaAspect-windowH)/2).css('left',0).css('height',windowW/mediaAspect);
						pc.find('.vjs-tech').css('width','100%');
					}
				},
				
		
				/******************
				    - Caption -
				******************/
				
				//Set caption position
				setCaptionPosition:function() {
					//Find the right captions
					var actli = this.container.find('>li:eq('+this.opt.act+')');
					var nextli = this.container.find('>li:eq('+this.opt.next+')');
					
					//Set the next caption and remove the last caption
					var nextcaption = nextli.find('.caption');
					if (nextcaption.find('iframe')==0) {
						//Move the captions to the right position
						if (nextcaption.hasClass('hcenter')) {
							nextcaption.css({'height':this.opt.height+"px",'top':'0px','left':((this.opt.width-nextcaption.outerWidth())/2)+'px'});
						} else {
							if (nextcaption.hasClass('vcenter')) {
								nextcaption.css({'width':this.opt.width+"px",'left':'0px','top':((this.opt.height-nextcaption.outerHeight())/2)+'px'});
							}
						}
					}
				},
	
				//Show caption
				showCaption:function(nextli) {
					var that = this;
					var offsetx = 0;
					var offsety = 0;
					
					nextli.find('.caption').each(function(i) {
						offsetx = (that.opt.width-that.opt.startWidth)/2;
	
						if (that.opt.bh>1) {
							that.opt.bw=1;
							that.opt.bh=1;
						}
	
						if (that.opt.bw>1) {
							that.opt.bw=1;
							that.opt.bh=1;
						}
	
						var xbw = that.opt.bw;
						var xbh = that.opt.bh;
						
						if (that.opt.fullScreen) {
							offsety = (that.opt.height-(that.opt.startHeight*that.opt.bh))/2;
						}
						
						if (offsety<0) offsety = 0;
	
						var nextcaption = nextli.find('.caption:eq('+i+')');
						nextcaption.stop(true,true);
						
						var handlecaption = false;
	
						//Hide caption on resolution
						if (that.opt.width<=that.opt.hideCaptionAtResolution && nextcaption.data('captionhidden')==true) {
							nextcaption.addClass("hidden-caption");
							handlecaption = true;							
						} else {
							if (that.opt.width<that.opt.hideCaptionAtResolution) {
								nextcaption.addClass("hidden-caption");
								handlecaption = true;	
							} else {
								nextcaption.removeClass("hidden-caption");
							}
						}
	
						if (!handlecaption) {
							//Link to slide
							if (nextcaption.data('linktoslide')!=undefined) {
								nextcaption.css({'cursor':'pointer'});
								nextcaption.click(function() {
									var nextcaption = $(this);
									var dir = nextcaption.data('linktoslide');
									if (dir!="next" && dir!="prev") {
										that.container.data('showus',dir);
										that.container.parent().find('.rightarrow').click();
									} else
										if (dir=="next")
											that.container.parent().find('.rightarrow').click();
									else
										if (dir=="prev")
											that.container.parent().find('.leftarrow').click();
								});
							}
		
							if (nextcaption.hasClass("coloredbg")) offsetx = 0;
							if (offsetx<0) offsetx = 0;
		
							clearTimeout(nextcaption.data('timer'));
							clearTimeout(nextcaption.data('timer-end'));
		
							//YouTube and Vimeo listeners initialization
							var frameID = "iframe"+Math.round(Math.random()*1000+1);
	
							if (nextcaption.find('iframe').length>0) {
								if (nextcaption.data('autoplayonlyfirsttime')) {
									nextcaption.data('autoplay', true);
								}
								
								nextcaption.find('iframe').each(function() {
									var ifr = $(this);
			
									if (ifr.attr('src').toLowerCase().indexOf('youtube')>=0) {
										that.opt.nextSlideAtEnd = nextcaption.data('nextslideatend');
										
										if (!ifr.hasClass("HasListener")) {
											try {
												ifr.attr('id',frameID);
												var player;
												
												if (nextcaption.data('autoplay')) {
													player = new YT.Player(frameID, {
														events:{
															"onStateChange":that.onPlayerStateChange,
															"onReady":that.onPlayerReady
														}
													});
												} else {
													player = new YT.Player(frameID, {
														events:{
															"onStateChange":that.onPlayerStateChange
														}
													});
												}
													
												ifr.addClass("HasListener");
												nextcaption.data('player', player);
												
												if (nextcaption.data('autoplay')) {
													var timer = $('body').find('#'+that.opt.container.attr('id')).find('.timer');
													setTimeout(function() {
														timer.stop();
														that.opt.videoPlaying = true;
													},200);
												}
											} catch(e) {}
										} else {
											if (nextcaption.data('autoplay')) {
												var player = nextcaption.data('player');
												
												nextcaption.data('timerplay',setTimeout(function() {
													if (nextcaption.data('forcerewind')) {
														player.seekTo(0);
													}
													player.playVideo();
												},nextcaption.data('start')));

												var timer = $('body').find('#'+that.opt.container.attr('id')).find('.timer');
												setTimeout(function() {
													timer.stop();
													that.opt.videoPlaying = true;
												},200);
											}
										}
									} else {
										if (ifr.attr('src').toLowerCase().indexOf('vimeo')>=0) {
											that.opt.nextSlideAtEnd = nextcaption.data('nextslideatend');
											
										   	if (!ifr.hasClass("HasListener")) {									   
												ifr.addClass("HasListener");
												ifr.attr('id',frameID);
												var isrc = ifr.attr('src');
												var queryParameters = {}, queryString = isrc,
												re = /([^&=]+)=([^&]*)/g, m;
												
												//Creates a map with the query string parameters
												while (m = re.exec(queryString)) {
													queryParameters[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
												}
													
												if (queryParameters['player_id']!=undefined) {	
													isrc = isrc.replace(queryParameters['player_id'],frameID);
												} else {
													isrc += "&player_id="+frameID;
												}
													
												try{
													isrc = isrc.replace('api=0','api=1');
												} catch(e) {}
													
												isrc += "&api=1";	
												ifr.attr('src',isrc);
												var player = nextcaption.find('iframe')[0];
												
												if (nextcaption.data('autoplay')) {
													$f(player).addEvent('ready', function() {that.vimeoReady(frameID, true);});
													var timer = $('body').find('#'+that.opt.container.attr('id')).find('.timer');
													setTimeout(function() {
														timer.stop();
														that.opt.videoPlaying = true;
													},200);
												} else {
													$f(player).addEvent('ready', function() {that.vimeoReady(frameID, false);});	
												}
											} else {
												if (nextcaption.data('autoplay')) {
													var ifr = nextcaption.find('iframe');
													var id = ifr.attr('id');
													var froogaloop = $f(id);
													
													nextcaption.data('timerplay',setTimeout(function() {
														if (nextcaption.data('forcerewind')) {
															froogaloop.api("seekTo", 0);
														}
														froogaloop.api("play");
													},nextcaption.data('start')));
													
													var timer = $('body').find('#'+that.opt.container.attr('id')).find('.timer');
													
													setTimeout(function() {
														timer.stop();
														that.opt.videoPlaying = true;
													},200);
												}	
											}
										}
									}
								});
							}
							
							//If HTML5 video is embedded
							if (nextcaption.find('video').length>0) {
								if (nextcaption.data('autoplayonlyfirsttime')) {
									nextcaption.data('autoplay', true);
								}
								
								nextcaption.find('video').each(function(i) {
									var video = $(this).parent();
									
									var mediaaspect = 16/9;
									if (nextcaption.data('aspectratio')=="4:3") mediaaspect = 4/3;
									video.data('mediaAspect', mediaaspect);
									
									if (video.hasClass("video-js")) {
										that.opt.nextSlideAtEnd = nextcaption.data('nextslideatend');
										
										if (!video.hasClass("HasListener")) {
											video.addClass("HasListener");
											var videoID = "videoid_"+Math.round(Math.random()*1000+1);
											video.attr('id',videoID);
											videojs(videoID).ready(function() {
												that.html5VideoReady(this, videoID, that);
											});
										} else {
											videoID = video.attr('id');
										}
										
										video.find('.vjs-poster').css({display:"block"});
										
										if (nextcaption.data('autoplay')) {
											var timer = $('body').find('#'+that.opt.container.attr('id')).find('.timer');
											setTimeout(function() {
												timer.stop();
												that.opt.videoPlaying = true;
											},200);

											videojs(videoID).ready(function() {
												var myPlayer = this;
												
												try {
													if (nextcaption.data("forcerewind")) {
														myPlayer.currentTime(0);
													}
												} catch(e) {}
												
												video.data('timerplay',setTimeout(function() {
													if (nextcaption.data('forcerewind')) {
													  	myPlayer.currentTime(0);
													}

													if (video.closest('.caption').data('volume')=="mute") {
													  	myPlayer.volume(0);
													}
													
													setTimeout(function() {
														myPlayer.play(0);
														video.find('.vjs-poster').css({display:"none"});
													},50);
												},10+nextcaption.data('start')));
											});
										}

										if (video.data('ww')==undefined) video.data('ww',video.width());
										if (video.data('hh')==undefined) video.data('hh',video.height());

										videojs(videoID).ready(function() {
											if (!nextcaption.hasClass("fullscreenvideo")) {
												var myPlayer = videojs(videoID);

												try{
													myPlayer.width(video.data('ww')*that.opt.bw);
													myPlayer.height(video.data('hh')*that.opt.bh);
												} catch(e) {}
											}
										});

										if (video.closest('.caption').data('forcecover')) {
											that.updateHTML5Size(video, that.opt.container);
											video.addClass("fullcoveredvideo");
										}
									 }
								});
							}
							
							if (nextcaption.find('iframe').length>0 || nextcaption.find('video').length>0) {
								if (nextcaption.data('autoplayonlyfirsttime')) {
									nextcaption.data('autoplay', false);
									nextcaption.data('autoplayonlyfirsttime', false);
								}
							}
		
							//Random rotate
							if (nextcaption.hasClass("randomrotate") && (that.opt.ie || that.opt.ie9)) nextcaption.removeClass("randomrotate").addClass("sfb");
							nextcaption.removeClass('noFilterClass');
		
							var imw = 0;
							var imh = 0;
	
							if (nextcaption.find('img').length>0) {
								var im = nextcaption.find('img');
								if (im.data('ww') == undefined) im.data('ww',im.width());
								if (im.data('hh') == undefined) im.data('hh',im.height());
								var ww = im.data('ww');
								var hh = im.data('hh');
								im.width(ww*that.opt.bw);
								im.height(hh*that.opt.bh);
								imw = im.width();
								imh = im.height();
							} else {
								if (nextcaption.find('iframe').length>0) {
									var im = nextcaption.find('iframe');
									im.css({display:"block"});
									
									if (nextcaption.data('ww') == undefined) {
										nextcaption.data('ww',im.width());
									}
									if (nextcaption.data('hh') == undefined) nextcaption.data('hh',im.height());
		
									var ww = nextcaption.data('ww');
									var hh = nextcaption.data('hh');
		
									var nc =nextcaption;
									if (nc.data('fsize') == undefined) nc.data('fsize',parseInt(nc.css('font-size'),0) || 0);
									if (nc.data('pt') == undefined) nc.data('pt',parseInt(nc.css('paddingTop'),0) || 0);
									if (nc.data('pb') == undefined) nc.data('pb',parseInt(nc.css('paddingBottom'),0) || 0);
									if (nc.data('pl') == undefined) nc.data('pl',parseInt(nc.css('paddingLeft'),0) || 0);
									if (nc.data('pr') == undefined) nc.data('pr',parseInt(nc.css('paddingRight'),0) || 0);
		
									if (nc.data('mt') == undefined) nc.data('mt',parseInt(nc.css('marginTop'),0) || 0);
									if (nc.data('mb') == undefined) nc.data('mb',parseInt(nc.css('marginBottom'),0) || 0);
									if (nc.data('ml') == undefined) nc.data('ml',parseInt(nc.css('marginLeft'),0) || 0);
									if (nc.data('mr') == undefined) nc.data('mr',parseInt(nc.css('marginRight'),0) || 0);
		
									if (nc.data('bt') == undefined) nc.data('bt',parseInt(nc.css('borderTopWidth'),0) || 0);
									if (nc.data('bb') == undefined) nc.data('bb',parseInt(nc.css('borderBottomWidth'),0) || 0);
									if (nc.data('bl') == undefined) nc.data('bl',parseInt(nc.css('borderLeftWidth'),0) || 0);
									if (nc.data('br') == undefined) nc.data('br',parseInt(nc.css('borderRightWidth'),0) || 0);
		
									if (nc.data('lh') == undefined) nc.data('lh',parseInt(nc.css('lineHeight'),0) || 0);
		
									var fvwidth = that.opt.width;
									var fvheight = that.opt.height;
									if (fvwidth>that.opt.startWidth) fvwidth = that.opt.startWidth;
									if (fvheight>that.opt.startHeight) fvheight = that.opt.startHeight;
		
									if (!nextcaption.hasClass('fullscreenvideo')) {
										nextcaption.css({
											'font-size': (nc.data('fsize') * that.opt.bw)+"px",
		
											'padding-top': (nc.data('pt') * that.opt.bh) + "px",
											'padding-bottom': (nc.data('pb') * that.opt.bh) + "px",
											'padding-left': (nc.data('pl') * that.opt.bw) + "px",
											'padding-right': (nc.data('pr') * that.opt.bw) + "px",
		
											'margin-top': (nc.data('mt') * that.opt.bh) + "px",
											'margin-bottom': (nc.data('mb') * that.opt.bh) + "px",
											'margin-left': (nc.data('ml') * that.opt.bw) + "px",
											'margin-right': (nc.data('mr') * that.opt.bw) + "px",
		
											'border-top-width': (nc.data('bt') * that.opt.bh) + "px",
											'border-bottom-width': (nc.data('bb') * that.opt.bh) + "px",
											'border-left-width': (nc.data('bl') * that.opt.bw) + "px",
											'border-right-width': (nc.data('br') * that.opt.bw) + "px",
		
											'line-height': (nc.data('lh') * that.opt.bh) + "px",
											'height':(hh*that.opt.bh)+'px',
											'white-space':"nowrap"
										});
									} else {
										nextcaption.css({
											'width':that.opt.startWidth*that.opt.bw,
											'height':that.opt.startHeight*that.opt.bh
										});
									}
		
									im.width(ww*that.opt.bw);
									im.height(hh*that.opt.bh);
									imw = im.width();
									imh = im.height();
								} else {
									nextcaption.find('.resizeme, .resizeme *').each(function() {
										that.calcCaptionResponsive($(this));
									});
	
									if (nextcaption.hasClass("resizeme")) {
										nextcaption.find('*').each(function() {
											that.calcCaptionResponsive($(this));
										});
									}
	
									that.calcCaptionResponsive(nextcaption);
	
									imh = nextcaption.outerHeight(true);
									imw = nextcaption.outerWidth(true);
	
									//Next caption front corner changes
									var ncch = nextcaption.outerHeight();
									var bgcol = nextcaption.css('backgroundColor');									
									nextcaption.find('.frontcorner').css({
										'borderWidth':ncch+"px",
										'left':(0-ncch)+'px',
										'borderRight':'0px solid transparent',
										'borderTopColor':bgcol
									});
									
									nextcaption.find('.frontcornertop').css({
										'borderWidth':ncch+"px",
										'left':(0-ncch)+'px',
										'borderRight':'0px solid transparent',
										'borderBottomColor':bgcol
									});
	
									//Next caption back corner changes
									nextcaption.find('.backcorner').css({
										'borderWidth':ncch+"px",
										'right':(0-ncch)+'px',
										'borderLeft':'0px solid transparent',
										'borderBottomColor':bgcol
									});
	
									nextcaption.find('.backcornertop').css({
										'borderWidth':ncch+"px",
										'right':(0-ncch)+'px',
										'borderLeft':'0px solid transparent',
										'borderTopColor':bgcol
									});					
								}
							}
						
							//Video
							var video = nextcaption.data("video");
							if (video!=undefined) {
								var w = that.opt.startWidth*that.opt.bw;
								var h = that.opt.startHeight*that.opt.bh;
								nextcaption.html("").width(w).height(h);
								var videoFrame = $('<div class="video-frame"></div>');
								nextcaption.append(videoFrame);
								var videoPlayBtn = $('<div class="video-play"></div>');							
								nextcaption.append(videoPlayBtn);
								
								videoPlayBtn.bind("click", function() {
									that.opt.videoPlaying = true;
									that.opt.videoStarted = true;
									that.timer.stop();
									
									if (that.opt.showTimer) {
										that.timer.hide();
									}
									
									videoFrame.html('<iframe frameborder="0" width="'+w+'" height="'+h+'" src="'+video+'" /><div class="video-close"></div>');
									var videoCloseBtn = videoFrame.find(".video-close");
									
									videoCloseBtn.bind("click", function() {
										that.opt.videoPlaying = false;
										that.opt.videoStopped = true;
										videoFrame.html("");
										
										if (that.opt.conthover==0) {
											that.timer.animate({'width':"100%"}, {duration:((that.opt.delay-that.opt.cd)-100), queue:false, easing:"linear"});
										}
										
										if (that.opt.showTimer) {
											that.timer.show();	
										}
									});								
								});		
							}
						
							//Offset
							if (nextcaption.data('voffset')==undefined) nextcaption.data('voffset',0);
							if (nextcaption.data('hoffset')==undefined) nextcaption.data('hoffset',0);
	
							var vofs = nextcaption.data('voffset')*xbw;
							var hofs = nextcaption.data('hoffset')*xbw;
	
							var crw = that.opt.startWidth*xbw;
							var crh = that.opt.startHeight*xbw;
	
							//Center the caption horizontally
							if (nextcaption.data('x')=='center' || nextcaption.data('xcenter')=='center') {
								nextcaption.data('xcenter','center');
								nextcaption.data('x',((crw-nextcaption.outerWidth(true))/2)/xbw+hofs);
							}
	
							//Align left the caption horizontally
							if (nextcaption.data('x')=='left' || nextcaption.data('xleft')=='left') {
								nextcaption.data('xleft','left');
								nextcaption.data('x',(0)/xbw+hofs);
							}
	
							//Align right the caption horizontally
							if (nextcaption.data('x')=="right" || nextcaption.data('xright')=='right') {
								nextcaption.data('xright','right');
								nextcaption.data('x',(crw-nextcaption.outerWidth(true)+hofs)/xbw);							
							}
	
							//Center the caption vertically
							if (nextcaption.data('y')=="center" || nextcaption.data('ycenter')=='center') {
								nextcaption.data('ycenter','center');
								nextcaption.data('y',((crh-nextcaption.outerHeight(true))/2)/that.opt.bh+vofs);
							}
	
							//Align top the caption vertically
							if (nextcaption.data('y')=="top" || nextcaption.data('ytop')=='top') {
								nextcaption.data('ytop','top');
								nextcaption.data('y',vofs);
							}
	
							//Align bottom the caption vertically
							if (nextcaption.data('y')=="bottom" || nextcaption.data('ybottom')=='bottom') {
								nextcaption.data('ybottom','bottom');
								nextcaption.data('y',((crh-nextcaption.outerHeight(true))+vofs)/xbw);
							}
							
							//Calculate x-y positions
							var calcx = 0;
							var calcy = 0;
							var skwx = 0;
							var rox = 0;
							
							if (!nextcaption.hasClass('fullscreenvideo')) {
								calcx = xbw*nextcaption.data('x')+offsetx;
								calcy = that.opt.bh*nextcaption.data('y')+offsety;
							}
							
							//Fade
							if (nextcaption.hasClass('fade')) {
								nextcaption.css({'opacity':0, 'left':calcx+'px', 'top':calcy+"px"});
							}
		
							//Random rotate
							if (nextcaption.hasClass("randomrotate")) {
								nextcaption.css({'opacity':0, 'left':calcx+'px', 'top':(xbh*nextcaption.data('y')+offsety)+'px'});
								var sc = Math.random()*2+1;
								var ro = Math.round(Math.random()*200-100);
								var xx = Math.round(Math.random()*200-100);
								var yy = Math.round(Math.random()*200-100);
								nextcaption.data('repx',xx);
								nextcaption.data('repy',yy);
								nextcaption.data('repo',nextcaption.css('opacity'));
								nextcaption.data('rotate',ro);
								nextcaption.data('scale',sc);
								nextcaption.transition({scale:sc, rotate:ro, x:xx, y:yy, duration:'0ms'});
							} else {
								if (that.opt.ie || that.opt.ie9) {
								} else {
									nextcaption.transition({scale:1, rotate:0});
								}
							}
							
							var oo = nextcaption.data('opacity');
							if (oo==undefined) oo = 1;
							
							//Short from bottom
							if (nextcaption.hasClass('sfb')) {
								nextcaption.css({'opacity':0, 'left':calcx+'px', 'top':(calcy+50)+'px'});
							}
							
							//Short from left
							if (nextcaption.hasClass('sfl')) {
								nextcaption.css({'opacity':0, 'left':(calcx-50)+'px', 'top':calcy+'px'});
							}
		
							//Short from right
							if (nextcaption.hasClass('sfr')) {
								nextcaption.css({'opacity':0, 'left':(calcx+50)+'px', 'top':calcy+'px'});
							}
							
							//Short from top
							if (nextcaption.hasClass('sft')) {
								nextcaption.css({'opacity':0, 'left':calcx+'px', 'top':(calcy-50)+'px'});
							}
							
							//Long from bottom
							if (nextcaption.hasClass('lfb')) {
								nextcaption.css({'opacity':oo, 'left':calcx+'px', 'top':(25+that.opt.height)+'px'});
							}
							
							//Long from left
							if (nextcaption.hasClass('lfl')) {
								nextcaption.css({'opacity':oo, 'left':(-15-imw)+'px', 'top':calcy+'px'});
							}
							
							//Long from right
							if (nextcaption.hasClass('lfr')) {
								nextcaption.css({'opacity':oo, 'left':(15+that.opt.width)+'px', 'top':calcy+'px'});
							}	
							
							//Long from top
							if (nextcaption.hasClass('lft')) {
								nextcaption.css({'opacity':oo, 'left':calcx+'px', 'top':(-25-imh)+'px'});
							}
							
							//Skew from left
							if (nextcaption.hasClass('skewfromleft')) {
								skwx = 85;
								nextcaption.css({'opacity':0, 'left':(-15-imw)+'px', 'top':calcy+'px'});
								nextcaption.transition({skewX:skwx, duration:'0ms'});
							}
							
							//Skew from right
							if (nextcaption.hasClass('skewfromright')) {
								skwx = -85;
								nextcaption.css({'opacity':0, 'left':(15+that.opt.width)+'px', 'top':calcy+'px'});
								nextcaption.transition({skewX:skwx, duration:'0ms'});
							}
							
							//Skew from left short
							if (nextcaption.hasClass('skewfromleftshort')) {
								skwx = 85;
								nextcaption.css({'opacity':0, 'left':(calcx-50)+'px', 'top':calcy+'px'});
								nextcaption.transition({skewX:skwx, duration:'0ms'});
							}
							
							//Skew from right short
							if (nextcaption.hasClass('skewfromrightshort')) {
								skwx = -85;
								nextcaption.css({'opacity':0, 'left':(calcx+50)+'px', 'top':calcy+'px'});
								nextcaption.transition({skewX:skwx, duration:'0ms'});
							}
							
							//Custom in
							if (nextcaption.hasClass('customin')) {
								rox = 90;
								nextcaption.css({'opacity':0});
								nextcaption.transition({origin:'50% 0%', perspective:200, rotateX:rox, duration:'0ms'});
							}
							
							nextcaption.data('repskewx',skwx);
							nextcaption.data('reprox',rox);
	
							//Animate in order
							nextcaption.data('timer',setTimeout(function() {
									nextcaption.css({'visibility':'visible'});
									
									if (nextcaption.hasClass('fade')) {
										nextcaption.data('repo',nextcaption.css('opacity'));
										nextcaption.animate({'opacity':1},{duration:nextcaption.data('speed')});
										if (that.opt.ie) nextcaption.addClass('noFilterClass');
									}
									
									if (nextcaption.hasClass("randomrotate")) {
										var rndy = (!nextcaption.hasClass('fullscreenvideo')) ? (xbh*(nextcaption.data('y'))+offsety) : 0;
										nextcaption.transition({opacity:1, scale:1, 'left':calcx+'px', 'top':rndy+"px", rotate:0, x:0, y:0, duration:nextcaption.data('speed')});
										if (that.opt.ie) nextcaption.addClass('noFilterClass');
									}
									
									if (nextcaption.hasClass('lfr') || nextcaption.hasClass('lfl') || nextcaption.hasClass('lft') || nextcaption.hasClass('lfb') ||
										nextcaption.hasClass('sfr') || nextcaption.hasClass('sfl') || nextcaption.hasClass('sft') || nextcaption.hasClass('sfb') ||
										nextcaption.hasClass('skewfromleft') || nextcaption.hasClass('skewfromright') || nextcaption.hasClass('skewfromleftshort') || nextcaption.hasClass('skewfromrightshort') ||
										nextcaption.hasClass('customin')
									) {
										var oo = nextcaption.data('opacity');
										var speed = nextcaption.data('speed');
										var easetype = nextcaption.data('easing');	
										
										if (oo==undefined) oo = 1;
										if (easetype==undefined) easetype = that.opt.captionEasing;
										
										nextcaption.data('repx',nextcaption.position().left);
										nextcaption.data('repy',nextcaption.position().top);
										nextcaption.data('repo',nextcaption.css('opacity'));
										
										nextcaption.transition({opacity:oo, scale:1, left:calcx+'px', top:calcy+'px', rotate:0, x:0, y:0, skewX:0, rotateX:0, rotateY:0, duration:speed, easing:easetype});
										
										if (that.opt.ie) nextcaption.addClass('noFilterClass');
									}
							},nextcaption.data('start')));
	
							//If there is any exit anim defined
							if (nextcaption.data('end')!=undefined) {
								nextcaption.data('timer-end', setTimeout(function() {
									if ((that.opt.ie || that.opt.ie9) && (nextcaption.hasClass("randomrotate") || nextcaption.hasClass("randomrotateout"))) {
										nextcaption.removeClass("randomrotate").removeClass("randomrotateout").addClass('fadeout');
									}
									that.endMoveCaption(nextcaption);
								}, nextcaption.data('end')));
							}
						}
					});
				},
				
				//Calculate the responsive sizes of captions
				calcCaptionResponsive:function(nc) {
					if (nc.data('fsize') == undefined) nc.data('fsize',parseInt(nc.css('font-size'),0) || 0);
					if (nc.data('pt') == undefined) nc.data('pt',parseInt(nc.css('paddingTop'),0) || 0);
					if (nc.data('pb') == undefined) nc.data('pb',parseInt(nc.css('paddingBottom'),0) || 0);
					if (nc.data('pl') == undefined) nc.data('pl',parseInt(nc.css('paddingLeft'),0) || 0);
					if (nc.data('pr') == undefined) nc.data('pr',parseInt(nc.css('paddingRight'),0) || 0);

					if (nc.data('mt') == undefined) nc.data('mt',parseInt(nc.css('marginTop'),0) || 0);
					if (nc.data('mb') == undefined) nc.data('mb',parseInt(nc.css('marginBottom'),0) || 0);
					if (nc.data('ml') == undefined) nc.data('ml',parseInt(nc.css('marginLeft'),0) || 0);
					if (nc.data('mr') == undefined) nc.data('mr',parseInt(nc.css('marginRight'),0) || 0);

					if (nc.data('bt') == undefined) nc.data('bt',parseInt(nc.css('borderTopWidth'),0) || 0);
					if (nc.data('bb') == undefined) nc.data('bb',parseInt(nc.css('borderBottomWidth'),0) || 0);
					if (nc.data('bl') == undefined) nc.data('bl',parseInt(nc.css('borderLeftWidth'),0) || 0);
					if (nc.data('br') == undefined) nc.data('br',parseInt(nc.css('borderRightWidth'),0) || 0);

					if (nc.data('lh') == undefined) nc.data('lh',parseInt(nc.css('lineHeight'),0) || 0);
					if (nc.data('minwidth') == undefined) nc.data('minwidth',parseInt(nc.css('minWidth'),0) || 0);
					if (nc.data('minheight') == undefined) nc.data('minheight',parseInt(nc.css('minHeight'),0) || 0);
					if (nc.data('maxwidth') == undefined) nc.data('maxwidth',parseInt(nc.css('maxWidth'),0) || "none");
					if (nc.data('maxheight') == undefined) nc.data('maxheight',parseInt(nc.css('maxHeight'),0) || "none");

					nc.css({
						'font-size':Math.round((nc.data('fsize')*this.opt.bw))+"px",

						'padding-top':Math.round((nc.data('pt')*this.opt.bh))+"px",
						'padding-bottom':Math.round((nc.data('pb')*this.opt.bh))+"px",
						'padding-left':Math.round((nc.data('pl')*this.opt.bw))+"px",
						'padding-right':Math.round((nc.data('pr')*this.opt.bw))+"px",
						
						'margin-top':(nc.data('mt')*this.opt.bh)+"px",
						'margin-bottom':(nc.data('mb')*this.opt.bh)+"px",
						'margin-left':(nc.data('ml')*this.opt.bw)+"px",
						'margin-right':(nc.data('mr')*this.opt.bw)+"px",
						
						'borderTopWidth':Math.round((nc.data('bt')*this.opt.bh))+"px",
						'borderBottomWidth':Math.round((nc.data('bb')*this.opt.bh))+"px",
						'borderLeftWidth':Math.round((nc.data('bl')*this.opt.bw))+"px",
						'borderRightWidth':Math.round((nc.data('br')*this.opt.bw))+"px",
						
						'line-height':Math.round((nc.data('lh')*this.opt.bh))+"px",
						'white-space':"nowrap",
						'minWidth':(nc.data('minwidth')*this.opt.bw)+"px",
						'minHeight':(nc.data('minheight')*this.opt.bh)+"px",
					});

					if (nc.data('maxheight')!='none') {
						nc.css({'maxHeight':(nc.data('maxheight')*this.opt.bh)+"px"});
					}

					if (nc.data('maxwidth')!='none') {
						nc.css({'maxWidth':(nc.data('maxwidth')*this.opt.bw)+"px"});
					}
				},
					
				//Remove caption
				removeCaption:function(actli) {
					var that = this;
					
					actli.find('.caption').each(function(i) {
						var nextcaption = actli.find('.caption:eq('+i+')');
						nextcaption.stop(true,true);
						
						clearTimeout(nextcaption.data('timer'));
						clearTimeout(nextcaption.data('timer-end'));
		
						if (nextcaption.find('iframe').length>0) {
							//Vimeo video pause
							try {
								var ifr = nextcaption.find('iframe');
								var id = ifr.attr('id');
								var froogaloop = $f(id);
								froogaloop.api("pause");
							} catch(e) {}
							
							//YouTube video pause
							try {
								var player = nextcaption.data('player');
								player.stopVideo();
							} catch(e) {}
						}
						
						//If HTML5 video is embedded
						if (nextcaption.find('video').length>0) {
							try {
								nextcaption.find('video').each(function(i) {
									var video = $(this).parent();
									var videoID = video.attr('id');
									
									clearTimeout(video.data('timerplay'));
									
									videojs(videoID).ready(function() {
										var myPlayer = this;
										myPlayer.pause();
									});
								})
							} catch(e) {}
						}
						
						try {
							that.endMoveCaption(nextcaption);
						} catch(e) {}
					});
				},	
				
				//Move out the captions
				endMoveCaption:function(nextcaption) {
					if (nextcaption.hasClass("randomrotate") && (this.opt.ie || this.opt.ie9)) nextcaption.removeClass("randomrotate").addClass("sfb");
					if (nextcaption.hasClass("randomrotateout") && (this.opt.ie || this.opt.ie9)) nextcaption.removeClass("randomrotateout").addClass("stb");

					var endspeed = nextcaption.data('endspeed');
					if (endspeed==undefined) endspeed = nextcaption.data('speed');
					
					var easetype = nextcaption.data('endeasing');
					if (easetype==undefined) easetype="linear";

					var xx = nextcaption.data('repx');
					var yy = nextcaption.data('repy');
					var oo = nextcaption.data('repo');
					var skwx = nextcaption.data('repskewx');
					var rox = nextcaption.data('reprox');
					
					if (skwx==undefined) skwx = 0;
					if (rox==undefined) rox = 0;

					if (this.opt.ie) {
						nextcaption.css({'opacity':'inherit','filter':'inherit'});
					}

					if (nextcaption.hasClass('ltr') || nextcaption.hasClass('ltl') || nextcaption.hasClass('ltt') || nextcaption.hasClass('ltb') ||
						nextcaption.hasClass('str') || nextcaption.hasClass('stl') || nextcaption.hasClass('stt') || nextcaption.hasClass('stb') ||
						nextcaption.hasClass('skewtoleft') || nextcaption.hasClass('skewtoright') || nextcaption.hasClass('skewtoleftshort') || nextcaption.hasClass('skewtorightshort')
					) {
						xx = nextcaption.position().left;
						yy = nextcaption.position().top;
						skwx = 0;

						if (nextcaption.hasClass('ltr') || nextcaption.hasClass('skewtoright'))
							xx = this.opt.width+60;
						else if (nextcaption.hasClass('ltl') || nextcaption.hasClass('skewtoleft'))
							xx = -nextcaption.width()-60;
						else if (nextcaption.hasClass('ltt'))
							yy = -nextcaption.height()-60;
						else if (nextcaption.hasClass('ltb'))
							yy = this.opt.height+60;
						else if (nextcaption.hasClass('str') || nextcaption.hasClass('skewtorightshort')) {
							xx += 50; oo=0;
						} else if (nextcaption.hasClass('stl') || nextcaption.hasClass('skewtoleftshort')) {
							xx -= 50; oo=0;
						} else if (nextcaption.hasClass('stt')) {
							yy -= 50; oo=0;
						} else if (nextcaption.hasClass('stb')) {
							yy += 50; oo=0;
						}
						
						if (nextcaption.hasClass('skewtoright') || nextcaption.hasClass('skewtorightshort')) {
							skwx = 35;
						}

						if (nextcaption.hasClass('skewtoleft') || nextcaption.hasClass('skewtoleftshort')) {
							skwx = -35;
						}

						nextcaption.transition({'opacity':oo, 'left':xx+'px', 'top':yy+"px", skewX:skwx, duration:nextcaption.data('endspeed'), easing:easetype,
							complete:function() {
								if (easetype.indexOf("Bounce")>=0 || easetype.indexOf("Elastic")>=0) {
									$(this).css({visibility:'hidden'});
								}
							}
						});
						
						if (this.opt.ie) nextcaption.removeClass('noFilterClass');
					} else if (nextcaption.hasClass("randomrotateout")) {
						nextcaption.transition({opacity:0, scale:Math.random()*2+0.3, 'left':Math.random()*this.opt.width+'px','top':Math.random()*this.opt.height+"px", rotate:Math.random()*40, duration:endspeed, easing:easetype, 
							complete:function() {
								$(this).css({visibility:'hidden'});
							}
						});
						if (this.opt.ie) nextcaption.removeClass('noFilterClass');
					} else if (nextcaption.hasClass('fadeout')) {
						if (this.opt.ie) nextcaption.removeClass('noFilterClass');
						nextcaption.transition({'opacity':0, duration:200});
					} else if (nextcaption.hasClass('customout')) {
						nextcaption.transition({'opacity':oo, scale:0.75, origin:'50% 50%', perspective:600, rotateX:0, duration:nextcaption.data('endspeed'), easing:easetype,
							complete:function() {
								if (easetype.indexOf("Bounce")>=0 || easetype.indexOf("Elastic")>=0) {
									$(this).css({visibility:'hidden'});
								}
							}
						});
						if (this.opt.ie) nextcaption.removeClass('noFilterClass');
					} else {
						if (nextcaption.hasClass('lfr') || nextcaption.hasClass('lfl') || nextcaption.hasClass('lft') || nextcaption.hasClass('lfb') ||
							nextcaption.hasClass('sfr') || nextcaption.hasClass('sfl') || nextcaption.hasClass('sft') || nextcaption.hasClass('sfb') ||
							nextcaption.hasClass('skewfromleft') || nextcaption.hasClass('skewfromright') || nextcaption.hasClass('skewfromleftshort') || nextcaption.hasClass('skewfromrightshort')
						) {							
							if (nextcaption.hasClass('lfr'))
								xx = this.opt.width+60;
							else if (nextcaption.hasClass('lfl'))
								xx = -nextcaption.width()-60;
							else if (nextcaption.hasClass('lft'))
								yy = -nextcaption.height()-60;
							else if (nextcaption.hasClass('lfb'))
								yy = this.opt.height+60;

							nextcaption.transition({'opacity':oo, 'left':xx+'px', 'top':yy+"px", skewX:skwx, duration:nextcaption.data('endspeed'), easing:easetype,
								complete:function() { 
									if (easetype.indexOf("Bounce")>=0 || easetype.indexOf("Elastic")>=0) {
										$(this).css({visibility:'hidden'});
									}
								}
							});							
						} else if (nextcaption.hasClass('customin')) {
							nextcaption.transition({'opacity':oo, origin:'50% 0%', perspective:200, rotateX:rox, duration:nextcaption.data('endspeed'), easing:easetype,
								complete:function() { 
									if (easetype.indexOf("Bounce")>=0 || easetype.indexOf("Elastic")>=0) {
										$(this).css({visibility:'hidden'});
									}
								}
							});
						} else if (nextcaption.hasClass('fade')) {
							nextcaption.transition({'opacity':0, duration:endspeed});
						} else if (nextcaption.hasClass("randomrotate")) {
							nextcaption.transition({opacity:0, scale:Math.random()*2+0.3, 'left':Math.random()*this.opt.width+'px','top':Math.random()*this.opt.height+"px", rotate:Math.random()*40, duration:endspeed, easing:easetype});
						}
						
						if (this.opt.ie) nextcaption.removeClass('noFilterClass');
					}
				},	
	
				//Countdown
				countDown:function() {
					var that = this;
					this.opt.cd = 0;
					this.opt.loop = 0;
					
					if (this.opt.stopAfterLoops>-1) {
						this.opt.loopToGo = this.opt.stopAfterLoops;
					} else {
						this.opt.loopToGo = 9999999;
					}
					
					if (this.opt.stopAtSlide>-1) {
						this.opt.lastSlideToShow = this.opt.stopAtSlide;
					} else {
						this.opt.lastSlideToShow = 999;
					}
					
					if (this.opt.loopToGo==0) this.opt.stopLoop = true;	
			
					if (this.opt.slideCount>1 && !(this.opt.stopAfterLoops==0 && this.opt.stopAtSlide==1)) {
						this.timer.css({'width':'0%'});
						this.timer.animate({'width':"100%"}, {duration:(this.opt.delay-100),queue:false, easing:"linear"});						
						this.timer.data('opt', this.opt);
						this.opt.cdint = setInterval(function() {		
							if (container.data('conthover-changed') == 1) {
								that.opt.conthover = that.container.data('conthover');
								that.container.data('conthover-changed',0);
							}
		
							if (that.opt.conthover!=1 && !that.opt.videoPlaying) that.opt.cd += 100;
		
							//Event triggering in case video has been started
							if (that.opt.videoStarted) {
								that.container.trigger('themo_slider.onvideoplay');
								that.opt.videoStarted = false;
							}
		
							//Event triggering in case video has been stopped
							if (that.opt.videoStopped) {
								that.container.trigger('themo_slider.onvideostop');
								that.opt.videoStopped = false;
							}
			
							if (that.opt.cd>=that.opt.delay) {
								that.opt.cd = 0;
								
								//Swap to next banner
								that.opt.act = that.opt.next;
								that.opt.next++;
								if (that.opt.next>container.find('>ul >li').length-1) {
									that.opt.next = 0;
									that.opt.loopToGo--;
									if (that.opt.loop<=0) {
										that.opt.stopLoop = true;
									}
								}
		
								//Stop timer if no loop no more needed
								if (that.opt.stopLoop && that.opt.next==that.opt.lastSlideToShow-1) {
									clearInterval(that.opt.cdint);
									container.find('.timer').css({'visibility':'hidden'});
									container.trigger('themo_slider.onstop');
								}
		
								//Swap the slides
								that.swapSlide();	
		
								//Clear the timer
								that.timer.css({'width':'0%'});
								that.timer.animate({'width':"100%"}, {duration:(that.opt.delay-100),queue:false, easing:"linear"});
							}
						},100);		
			
						container.hover(
							function() {	
								if (that.opt.pauseOnHover) {
									that.opt.conthover = 1;
									that.timer.stop();
									that.container.trigger('themo_slider.onpause');
								}
							},
							function() {
								if (container.data('conthover')!=1) {
									that.container.trigger('themo_slider.onresume');
									that.opt.conthover = 0;
									if (that.opt.pauseOnHover && !that.opt.videoPlaying) {
										that.timer.animate({'width':"100%"}, {duration:((that.opt.delay-that.opt.cd)-100),queue:false, easing:"linear"});
									}
								}
							}
						);
					}
				}
				
			};
			
			//Create slider
			var container = $(this);
			container.addClass("themo-slider");
			container.css({visibility:"visible"});
			return this.each(function() {
				objSlider = new ThemoSlider($(this), options);
			});
				
		},
		
		/************************
		    - API functions -
		************************/
		
		//Pause
		rasPause:function(options) {
			return this.each(function() {
				var container = $(this);
				container.data('conthover', 1);
				container.data('conthover-changed', 1);
				container.trigger('themo_slider.onpause');
				var timer = container.parent().find('.timer');
				timer.stop();
			});
		},
		
		//Resume
		rasResume:function(options) {
			return this.each(function() {
				var container = $(this);
				container.data('conthover', 0);
				container.data('conthover-changed', 1);
				container.trigger('themo_slider.onresume');
				var timer = container.parent().find('.timer');
				var opt = timer.data('opt');
				timer.animate({'width':"100%"}, {duration:((opt.delay-opt.cd)-100), queue:false, easing:"linear"});
			});
		},
	
		//Previous
		rasPrev:function(options) {
			return this.each(function() {
				var container = $(this);
				container.parent().find('.leftarrow').click();
			});
		},
	
		//Next
		rasNext:function(options) {
			return this.each(function() {
				var container = $(this);
				container.parent().find('.rightarrow').click();
			});
		},
	
		//Length
		rasMaxSlide:function(options) {
			return $(this).find('>ul:first-child >li').length;
		},
	
		//Jump to slide
		rasShowSlide:function(slide) {
			return this.each(function() {
				var container = $(this);
				container.data('showus', slide);
				container.parent().find('.rightarrow').click();
			});
		},
		
		//Current slide
		rasCurrentSlide:function() {
			var container = $(this);
			var timer = container.parent().find('.timer');
			var opt = timer.data('opt');
			return opt.act;
		},
		
		//Last slide
		rasLastSlide:function() {
			var container = $(this);
			var timer = container.parent().find('.timer');
			var opt = timer.data('opt');
			return opt.lastslide;
		},
		
		//Scroll Top
		rasScroll:function(oy) {
			return this.each(function() {
				var container = $(this);
				$('body,html').animate({scrollTop:(container.offset().top+(container.find('>ul >li').height())-oy)+"px"}, {duration:400});
			});
		}
	
	});
	
})(jQuery);
