#ifdef GL_ES
precision mediump float;
#endif

uniform float lifeWarning;
uniform float manaWarning;

uniform float warningSpeed;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform vec4 background;

uniform vec3 bar2Color;
uniform float bar2Size;

uniform vec3 bar1Color;
uniform float bar1Size;

uniform float bar2WarningSpeed;
uniform float bar1WarningSpeed;

float barWidth = 0.2;
	

bool inBar2(float y, float border) {

	return (y > 0.3 - barWidth - border && y < 0.1 + barWidth + border);
}


bool inBar1(float y, float border) {
	
	return (y > (0.6 + border) && y < 0.6 + (barWidth - border));
}


void main( void ) {

	vec4 background = vec4(1.0, 1.0, 1.0, 0.0);
	
	vec3 bar2Color = vec3(0.0, 1.0, 0.0);
	float bar2Size = 0.9;
	
	vec3 bar1Color = vec3(0.0, 0.0, 1.0);
	float bar1Size = 0.1;

	float bar2WarningSpeed = 10.0;
	float bar1WarningSpeed = 10.0;	

	float lifeWarning;
	float manaWarning;

	
	// vec2 position = ( gl_FragCoord.xy / resolution.xy ) / 4.0;
	vec2 position = ( gl_FragCoord.xy / resolution.xy );
	float x = fract(position.x);
	float y = fract(position.y);
	
	vec4 color;
	float opacity = sin(x);
	
	if (inBar2(y, 0.0)) {
    	color = vec4(0, 0, 1, opacity)  *  x  /  (bar2Size - x);
	}
	else if (inBar2(y, 0.01)) {
    	color = vec4(sin(time * bar2WarningSpeed), 0, 0, 1.0 - manaWarning);
	}
	else if (inBar1(y, 0.01)) {
    	color = vec4(0, 1, 0, opacity)  *  x  /  (bar1Size - x);
	}
	else if (inBar1(y, 0.0)) {
    	color = vec4(sin(time * bar1WarningSpeed), 0, 0, 1.0 - lifeWarning);
	}
	else {
    	color = background;
	}

	
	// this is the critical line: set the actual fragment colour.
	gl_FragColor = color;
}