(function() {
	var global = this;
	
	// widget constructor function
	global.magnifier = function() {
		var options = {
				width: 250,
				height: 250,
				minZoomLevel: 2,
				maxZoomLevel: 6,
				xOffset: 20,
				yOffset: 20,
				zoomLevel: 3,
				caption: "use mouse scroll to zoom in or out"
			},
			helpers = new myHelpers(),
		
		_add = function( image ) {
			var _realSizeImage,
				_storage = helpers.data( image ).data = {},
				_originalImageSize = {},
				_originalImageScaledSize = {};

			// create the structure if it has not been created yet
			if ( !data.initiated ) {
				_createStructure();
			}
			
			// get the real size – you have to do it when you add
			// add() method to an image with, eg. style="width: 380px; height: auto"
			_realSizeImage = new Image();
			_realSizeImage.src = image.src;
			
			_originalImageSize.width = _realSizeImage.width;
			_originalImageSize.height = _realSizeImage.height;
			
			// scaled size is the size of an image that was scaled for example with CSS
			_originalImageScaledSize = _calculateScaledImageSize( image, _realSizeImage );
			
			// if scaled image is >= original do not use zoom on it
			if ( _originalImageScaledSize.width >= _originalImageSize.width ) {
				return;
			}
			
			// store basic data on the image
			_storage.zoomLevel = 3;
			_storage.$originalImage = image;
			_storage.originalImagePosition = helpers.getElementPosition( image );
			_storage.originalImageSize = _originalImageSize;
			_storage.originalImageScaledSize = _originalImageScaledSize;
			_storage.zoomStepSize = _calculateZoomStepSize( _originalImageSize, _originalImageScaledSize );
			
			// add event handlers
			helpers.addEvent( image, "mousemove", function( event ) {
				_show( image, event );
			});
			helpers.addEvent( image, "mouseout", _hide );
			helpers.addEvent( image, "mousewheel", function( event ) {
				_changeZoomLevel( image, event );
				helpers.preventDefault( event );
			});
		},
		
		_calculateScaledImageSize = function( image, originalImage ) {
			var _width, _height, _sizeRatio,
				_originalWidth = originalImage.width,
				_originalHeight = originalImage.height;
			
			if ( image.style.width !== "auto" ) {
				_sizeRatio = _originalHeight / _originalWidth;
				_width = parseInt( image.style.width, 10 );
				_height = _width * _sizeRatio;
			} else if ( image.style.height !== "auto" ) {
				_sizeRatio = _originalWidth / _originalHeight;				
				_height = parseInt( image.style.height, 10 );
				_width = _height * _sizeRatio;
			}
			
			return {
				width: _width,
				height: _height
			};
		},
		
		_calculateZoomStepSize = function( originalSize, scaledSize ) {
			return {
				width: ( originalSize.width - scaledSize.width ) / options.maxZoomLevel,
				height: ( originalSize.height - scaledSize.height ) / options.maxZoomLevel
			};
		},
		
		_changeZoomLevel = function( image, event ) {
			var _delta,
				_storage = helpers.data( image ).data,
				_zoomLevel = _storage.zoomLevel,
				_minZoomLevel = options.minZoomLevel,
				_maxZoomLevel = options.maxZoomLevel,
				_mousePos = data.mousePos,
				_xPos = _mousePos.relX,
				_yPos = _mousePos.relY;

			if ( event.wheelDelta ) {
				_delta = event.wheelDelta / 120;
			} else {
				// Firefox
				_delta = -event.detail;
			}
			
			// if you scroll down
			if ( _delta > 0 ) {
				_zoomLevel += 1;
			} else if ( _delta < 0 ) {
				_zoomLevel -= 1;
			}
			
			// minZoom → maxZoom
			if ( _zoomLevel > _maxZoomLevel ) {
				_zoomLevel = _maxZoomLevel;
			} else if ( _zoomLevel < _minZoomLevel ) {
				_zoomLevel = _minZoomLevel;
			}
			
			// remember current zoom level
			helpers.data( image ).data.zoomLevel = _zoomLevel;

			_updateImageSize( image );
			_positionImage( _xPos, _yPos );			
		},				
		
		_createStructure = function() {
			var $root, $container, $image, $caption, $captionTxt,
				$widget = data.$widget;
			
			// create root of the widget
			$root = document.createElement( "div" );
			$root.id = "ui-magnifier";
			$widget.root = $root;
			
			// create image holder
			$container = document.createElement( "div" );
			$container.id = "ui-magnifier-container";
			$container.style.width = options.width + "px";
			$container.style.height = options.height + "px";
			$root.appendChild( $container );
			
			// remember the reference
			$widget.container = $container;
			
			// create an empty image
			$image = document.createElement( "img" );
			$image.id = "ui-magnifier-image";			
			
			// append the image to the container
			$container.appendChild( $image );
			
			// remember the reference to the image
			$widget.image = $image;			
			
			// create caption
			$caption = document.createElement( "p" );
			$caption.id = "ui-magnifier-caption";
			$captionTxt = document.createTextNode( options.caption );
			$caption.appendChild( $captionTxt );
			$root.appendChild( $caption );
			
			// and add the widget to the page
			document.getElementsByTagName( "body" )[0].appendChild( $root );
			
			data.initiated = true;
		},
		
		_hide = function () {
			data.$widget.root.style.display = "none";
		},		
		
		_positionMagnifier = function( x, y ) {
			var $root = data.$widget.root;
			
			$root.style.left = x + options.xOffset + "px";
			$root.style.top = y + options.yOffset + "px";			
		},
		
		_positionImage = function( x, y ) {
			var $image = data.$widget.image,
				_storage = helpers.data( data.$currentImage ).data,
				_zoomLevel = _storage.zoomLevel,
				_zoomStepSize = _storage.zoomStepSize,
				_currentSize = _storage.currentImageSize;

			$image.style.marginLeft = -x * _currentSize.currentToScaledWidthRatio + "px";
			$image.style.marginTop = -y * _currentSize.currentToScaledHeightRatio + "px";
		},
		
		_show = function ( image, event ) {
			var _storage = helpers.data( image ).data,
				$widget = data.$widget,
				$image = $widget.image,
				$root = $widget.root,
				_mousePos = helpers.getMousePosition( event ),
				_mouseXPos = _mousePos.x,
				_mouseYPos = _mousePos.y,
				_imagePosition = _storage.originalImagePosition,
				_imageXPos = _imagePosition.x,
				_imageYPos = _imagePosition.y,
				_relativeXPos = _mouseXPos - _imageXPos,
				_relativeYPos = _mouseYPos - _imageYPos;			

			// scaled image you are hovering on
			data.$currentImage = image;
			
			// copy original image to magnifier image
			$image.src = image.src;
			
			// update size taking zoom into account
			_updateImageSize( image );	
			
			// position magnifier
			_positionMagnifier( _mouseXPos, _mouseYPos );

			// and position image as well
			_positionImage( _relativeXPos, _relativeYPos );

			// show the magnifier
			$root.style.display = "block";
			
			// remember mouse positon
			data.mousePos = {
				x: _mouseXPos,
				y: _mouseYPos,
				relX: _relativeXPos,
				relY: _relativeYPos
			};			
		},		
		
		_updateImageSize = function( image ) {
			var _width, _height,
				_storage = helpers.data( image ).data,
				_scaledSize = _storage.originalImageScaledSize,
				_zoomLevel = _storage.zoomLevel,
				_zoomStepSize = _storage.zoomStepSize,
				$image = data.$widget.image;
			
			// width and height depend on zoomLevel; for example when an
			// original image width = 1000px and it was scaled to 100px and
			// maxZoomLevel was set to 5, we are able to see remaining 900px
			// (originalWidth - scaledWidth); then we have to divide it by
			// maxZoomLevel. What we get is step we have to add per zoomLevel –
			// 180px in this example
			_width = _scaledSize.width + _zoomStepSize.width * _zoomLevel;
			_height = _scaledSize.height + _zoomStepSize.height * _zoomLevel;
			
			$image.style.width = _width + "px";
			$image.style.height = _height + "px";
			
			// save current size
			_storage.currentImageSize = {
				width: _width,
				height: _height,
				currentToScaledWidthRatio: _width / _scaledSize.width,
				currentToScaledHeightRatio: _height / _scaledSize.height
			};
		},
		
		data = {
			initiated: false,
			$widget: {}
		};

		// public instance methods
		return {
			add: _add
		};
	};
	
	myHelpers = function() {
		this.addEvent = function( obj, type, fn ) {
			if ( obj.attachEvent ) {
				obj["e" + type + fn] = fn;
				obj[type + fn] = function() {
					obj["e" + type + fn]( window.event );
				};
				obj.attachEvent( "on" + type, obj[type + fn] );
			} else {
				obj.addEventListener( type, fn, false );
				
				// for firefox
				if ( type === "mousewheel" ) {
					arguments.callee( obj, "DOMMouseScroll", fn );
				}
			}
		};
		
		this.data = function( element ) {
			var _expando = this.dataObj.expando,
				_cache = this.dataObj.cache,
				_cacheIndex = element[_expando],
				_nextCacheIndex = _cache.length;
			
			if ( !_cacheIndex ) {
				_cacheIndex = element[_expando] = _nextCacheIndex;
				_cache[_cacheIndex] = {};
			}
			
			return _cache[_cacheIndex];
		};
		
		this.getElementPosition = function( element ) {
			var _xPos = 0,
				_yPos = 0;
			
			if ( element.offsetParent ) {
				do {
					_xPos += element.offsetLeft;
					_yPos += element.offsetTop;
				} while ( element = element.offsetParent );
			}
			
			return {
				x: _xPos,
				y: _yPos
			};
		};
		
		this.getMousePosition = function( event ) {
			var xPos, yPos;
			
			if ( !event ) {
				event = window.event;
			}
			
			if ( event.pageX || event.pageY ) {
				xPos = event.pageX;
				yPos = event.pageY;
			} else if ( event.clientX || event.clientY ) {
				xPos = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				yPos = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			
			return {
				x: xPos,
				y: yPos
			};
		};
		
		this.preventDefault = function( event ) {
			if ( event.preventDefault ) {
				event.preventDefault();
			} else {
				event.returnValue = false;
			}
		};
		
		this.dataObj = {
			cache: [0],
			expando: "data" + new Date().getTime()
		};
	};
})();