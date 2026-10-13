"use client";;
import {
  WebGLErrorBoundary,
  WebGLFallback,
} from "@/components/ui/webgl-error-boundary";
import { cn } from "@/lib/utils";
import { animate } from "framer-motion";
import * as React from "react";

const sampleImages = [
  "#101318",
  "#17191d",
  "#20232b",
].map((color) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2" fill="${color}"/></svg>`)}`,
);

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform sampler2D fromImage;
uniform sampler2D toImage;
uniform vec2 viewport;
uniform vec2 fromSize;
uniform vec2 toSize;
uniform vec2 origin;
uniform float phase;
uniform float speed;
uniform float thickness;
uniform float frequency;
uniform float displacement;
uniform float chroma;
uniform float highlight;
uniform float roughness;
uniform float pinchAmount;
uniform int transitionStyle;

float random2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  local = local * local * (3. - 2. * local);
  return mix(
    mix(random2(cell), random2(cell + vec2(1., 0.)), local.x),
    mix(random2(cell + vec2(0., 1.)), random2(cell + vec2(1.)), local.x),
    local.y
  );
}

float layeredNoise(vec2 p) {
  return smoothNoise(p) * .57 +
    smoothNoise(p * 2.07 + 4.3) * .29 +
    smoothNoise(p * 4.21 - 2.8) * .14;
}

vec2 cover(vec2 point, vec2 media, vec2 frame) {
  float mediaRatio = media.x / media.y;
  float frameRatio = frame.x / frame.y;
  vec2 crop = frameRatio > mediaRatio
    ? vec2(1., mediaRatio / frameRatio)
    : vec2(frameRatio / mediaRatio, 1.);
  return (point - .5) * crop + .5;
}

vec3 splitSample(sampler2D image, vec2 size, vec2 point, vec2 split) {
  return vec3(
    texture2D(image, cover(point - split, size, viewport)).r,
    texture2D(image, cover(point, size, viewport)).g,
    texture2D(image, cover(point + split, size, viewport)).b
  );
}

void main() {
  float aspect = viewport.x / viewport.y;
  vec2 radial = uv - origin;
  radial.x *= aspect;
  float distanceFromOrigin = length(radial);
  float farthest = length(vec2(aspect, 1.));
  float distance01 = distanceFromOrigin * 2. / farthest;
  float agitation = (layeredNoise(radial * 9. + phase * 1.8) - .5) * roughness;
  float signedDistance = 0.;
  float wave = 0.;
  float reveal = 0.;
  vec2 direction = distanceFromOrigin > .0001 ? radial / distanceFromOrigin : vec2(0.);
  direction.x /= aspect;
  vec2 fromPoint = uv;
  vec2 toPoint = uv;

  if (transitionStyle == 0) {
    signedDistance = distance01 + agitation - phase * speed;
    wave = exp(-(signedDistance * signedDistance) / max(.0001, 2. * thickness * thickness));
    wave *= .55 + .45 * cos(signedDistance * frequency * 6.28318);
    wave *= smoothstep(0., .08, phase) * (1. - smoothstep(.82, 1., phase));
    reveal = 1. - smoothstep(-.045, .045, signedDistance);
  } else if (transitionStyle == 1) {
    vec2 cell = floor(uv * vec2(16., 10.));
    float cellNoise = random2(cell);
    signedDistance = cellNoise - (phase * 1.1 - .05);
    wave = exp(-(signedDistance * signedDistance) / max(.0001, 2. * thickness * thickness));
    reveal = 1. - smoothstep(-.04, .04, signedDistance);
    float cellAngle = cellNoise * 6.28318;
    direction = vec2(cos(cellAngle), sin(cellAngle));
  } else if (transitionStyle == 2) {
    float diagonal = uv.y + (uv.x - .5) * .28;
    signedDistance = diagonal - (1.1 - phase * 1.4) + agitation * .12;
    wave = exp(-(signedDistance * signedDistance) / max(.0001, 2. * thickness * thickness));
    reveal = 1. - smoothstep(-.035, .035, signedDistance);
    direction = normalize(vec2(.28, 1.));
    fromPoint = (uv - .5) * (1. + phase * .12) + .5;
    toPoint = (uv - .5) * (1. + (1. - phase) * .12) + .5;
  } else if (transitionStyle == 3) {
    signedDistance = uv.x + sin(uv.y * frequency * 6.28318 + phase * 6.28318) * thickness * .65 - phase * 1.15 + .08;
    wave = exp(-(signedDistance * signedDistance) / max(.0001, 2. * thickness * thickness));
    reveal = 1. - smoothstep(-.035, .035, signedDistance);
    direction = vec2(1., 0.);
  } else {
    float waterNoise = layeredNoise(uv * vec2(14., 10.) + vec2(phase * 3., -phase * 2.));
    signedDistance = distance01 + (waterNoise - .5) * roughness * 1.5 - phase * speed;
    wave = exp(-(signedDistance * signedDistance) / max(.0001, 2. * thickness * thickness));
    wave *= .6 + .4 * cos(signedDistance * frequency * 6.28318);
    reveal = 1. - smoothstep(-.05, .05, signedDistance);
    vec2 waterDirection = vec2(radial.x + waterNoise - .5, radial.y);
    direction = length(waterDirection) > .0001
      ? normalize(waterDirection)
      : vec2(0., 1.);
  }

  float centerPull = exp(-distanceFromOrigin * distanceFromOrigin * 45.) * pinchAmount;
  vec2 offset = direction * (wave * displacement - centerPull * .018);
  vec2 split = direction * wave * chroma;
  vec3 before = splitSample(fromImage, fromSize, fromPoint - offset, split);
  vec3 after = splitSample(toImage, toSize, toPoint + offset, split);
  vec3 color = mix(before, after, reveal);
  color += wave * highlight * .38;
  color *= 1. - centerPull * .12;
  gl_FragColor = vec4(clamp(color, 0., 1.), 1.);
}`;

function fetchPictures(sources, signal) {
  return Promise.all(
    sources.map(
      (source) =>
        new Promise((resolve) => {
          const image = new Image();
          const finish = (picture) => {
            image.onload = null;
            image.onerror = null;
            resolve(picture);
          };
          image.crossOrigin = "anonymous";
          image.onload = () =>
            finish({
              element: image,
              width: image.naturalWidth || 1,
              height: image.naturalHeight || 1,
            });
          image.onerror = () => finish(null);
          signal.addEventListener("abort", () => finish(null), { once: true });
          image.src = source;
        }),
    ),
  ).then((pictures) =>
    pictures.filter(picture => picture !== null),
  );
}

function shader(gl, type, source) {
  const result = gl.createShader(type);
  if (!result) throw new Error("Unable to allocate a WebGL shader.");
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(result) ?? "Shader compilation failed.";
    gl.deleteShader(result);
    throw new Error(message);
  }
  return result;
}

class RippleRenderer {
  textureSlots = [0, 1];
  phase = 0;
  origin = [0.5, 0.5];

  constructor(canvas, pictures, settings) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", {
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL is not supported.");
    this.gl = gl;
    this.settings = settings;
    this.sizes = [pictures[0], pictures[1] ?? pictures[0]];
    this.vertexShader = shader(gl, gl.VERTEX_SHADER, vertexSource);
    this.fragmentShader = shader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate a WebGL program.");
    this.program = program;
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ?? "WebGL program link failed.",
      );
    }
    gl.useProgram(program);

    const geometry = gl.createBuffer();
    if (!geometry) throw new Error("Unable to allocate WebGL geometry.");
    this.geometry = geometry;
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.textures = [
      this.makeTexture(0, this.sizes[0].element),
      this.makeTexture(1, this.sizes[1].element),
    ];
    gl.uniform1i(this.location("fromImage"), 0);
    gl.uniform1i(this.location("toImage"), 1);
  }

  location(name) {
    return this.gl.getUniformLocation(this.program, name);
  }

  makeTexture(unit, image) {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to allocate a WebGL texture.");
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  resize(width, height) {
    const density = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(width * density));
    const pixelHeight = Math.max(1, Math.round(height * density));
    if (
      this.canvas.width !== pixelWidth ||
      this.canvas.height !== pixelHeight
    ) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.gl.viewport(0, 0, pixelWidth, pixelHeight);
    }
    this.draw();
  }

  configure(settings) {
    this.settings = settings;
    this.draw();
  }

  begin(x, y) {
    this.origin = [x, y];
    this.phase = 0;
    this.draw();
  }

  setPhase(value) {
    this.phase = value;
    this.draw();
  }

  advance(picture, nextIndex) {
    const gl = this.gl;
    const previousToSlot = this.textureSlots[1];
    this.textureSlots = [previousToSlot, nextIndex];
    this.sizes = [this.sizes[1], picture];
    gl.activeTexture(gl.TEXTURE0 + nextIndex);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[nextIndex]);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      picture.element,
    );
    gl.uniform1i(this.location("fromImage"), previousToSlot);
    gl.uniform1i(this.location("toImage"), nextIndex);
    this.phase = 0;
    this.draw();
  }

  draw() {
    const gl = this.gl;
    const s = this.settings;
    gl.useProgram(this.program);
    gl.uniform2f(
      this.location("viewport"),
      this.canvas.width,
      this.canvas.height,
    );
    gl.uniform2f(
      this.location("fromSize"),
      this.sizes[0].width,
      this.sizes[0].height,
    );
    gl.uniform2f(
      this.location("toSize"),
      this.sizes[1].width,
      this.sizes[1].height,
    );
    gl.uniform2f(this.location("origin"), this.origin[0], this.origin[1]);
    gl.uniform1f(this.location("phase"), this.phase);
    gl.uniform1f(this.location("speed"), s.waveSpeed);
    gl.uniform1f(this.location("thickness"), s.sigma);
    gl.uniform1f(this.location("frequency"), s.waveFreq);
    gl.uniform1f(this.location("displacement"), s.pushAmt);
    gl.uniform1f(this.location("chroma"), s.caStrength);
    gl.uniform1f(this.location("highlight"), s.glow);
    gl.uniform1f(this.location("roughness"), s.noiseWarp * 0.09);
    gl.uniform1f(this.location("pinchAmount"), s.pinch ? 1 : 0);
    gl.uniform1i(this.location("transitionStyle"), s.style);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    const gl = this.gl;
    this.textures.forEach((texture) => gl.deleteTexture(texture));
    gl.deleteBuffer(this.geometry);
    gl.deleteProgram(this.program);
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader);
  }
}

function RippleTransitionCanvas({
  images = sampleImages,
  duration = 1.4,
  ease = "easeInOut",
  playOnMount = false,
  onComplete,
  onError,
  autoPlay = false,
  autoPlayInterval = 3200,
  autoPlayOrigin = "center",
  waveSpeed = 1.6,
  sigma = 0.15,
  waveFreq = 5,
  pushAmt = 0.145,
  caStrength = 0.02,
  glow = 0.73,
  noiseWarp = 1,
  pinch = false,
  transitionStyle = "radial",
  borderRadius = 24,
  background = "#111416",
  label = "Ripple image transition",
  className,
  style,
  ...props
}) {
  const rootRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const engineRef = React.useRef(null);
  const playRef = React.useRef(() => undefined);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  const settings = React.useMemo(() => {
    const styles = {
      radial: 0,
      mosaic: 1,
      diagonal: 2,
      curtain: 3,
      underwater: 4,
    };
    const style = styles[transitionStyle];
    if (style === undefined) {
      throw new Error(`Unknown ripple transition style: ${transitionStyle}`);
    }
    return {
      waveSpeed,
      sigma,
      waveFreq,
      pushAmt,
      caStrength,
      glow,
      noiseWarp,
      pinch,
      style,
    };
  }, [caStrength, glow, noiseWarp, pinch, pushAmt, sigma, transitionStyle, waveFreq, waveSpeed]);
  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  React.useEffect(() => {
    engineRef.current?.configure(settings);
  }, [settings]);

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const abortController = new AbortController();
    let animation = null;
    let engine = null;
    let observer = null;
    let busy = false;
    let current = 0;

    const initialize = async () => {
      try {
        const pictures = await fetchPictures(images, abortController.signal);
        if (abortController.signal.aborted) return;
        if (pictures.length < 2) {
          throw new Error("At least two transition images must load.");
        }

        engine = new RippleRenderer(canvas, pictures, settingsRef.current);
        engineRef.current = engine;
        observer = new ResizeObserver(([entry]) => {
          const box = entry?.contentRect;
          if (box) engine?.resize(box.width, box.height);
        });
        observer.observe(root);
        engine.resize(root.clientWidth, root.clientHeight);

        playRef.current = (x = 0.5, y = 0.5) => {
          if (busy || !engine) return;
          busy = true;
          engine.begin(x, y);
          animation?.stop();
          animation = animate(0, 1, {
            duration,
            ease,
            onUpdate: (value) => engine?.setPhase(value),
            onComplete: () => {
              current = (current + 1) % pictures.length;
              const following = pictures[(current + 1) % pictures.length];
              engine?.advance(following, (current + 1) % 2);
              busy = false;
              onCompleteRef.current?.();
            },
          });
        };

        if (playOnMount) playRef.current();

        abortController.signal.addEventListener(
          "abort",
          () => {
            observer?.disconnect();
            animation?.stop();
            engine?.destroy();
          },
          { once: true },
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Unable to initialize the ripple image transition.", error);
          observer?.disconnect();
          animation?.stop();
          engine?.destroy();
          engineRef.current = null;
          onErrorRef.current?.(error);
        }
      }
    };
    initialize();

    return () => {
      playRef.current = () => undefined;
      engineRef.current = null;
      abortController.abort();
    };
  }, [duration, ease, images, playOnMount]);

  React.useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      const x = autoPlayOrigin === "random" ? 0.18 + Math.random() * 0.64 : 0.5;
      const y = autoPlayOrigin === "random" ? 0.18 + Math.random() * 0.64 : 0.5;
      playRef.current(x, y);
    }, autoPlayInterval);
    return () => window.clearInterval(timer);
  }, [autoPlay, autoPlayInterval, autoPlayOrigin]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full min-h-[320px] w-full cursor-pointer overflow-hidden leading-none outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2",
        className,
      )}
      style={{
        borderRadius,
        background,
        touchAction: "manipulation",
        ...style,
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerUp={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        playRef.current(
          (event.clientX - bounds.left) / bounds.width,
          (event.clientY - bounds.top) / bounds.height,
        );
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          playRef.current();
        }
      }}
      {...props}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export function RippleTransition(props) {
  const { onError, ...transitionProps } = props;
  const handleError = (error, errorInfo) => {
    console.error("Ripple transition rendering failed.", error, errorInfo);
    onError?.(error, errorInfo);
  };

  return (
    <WebGLErrorBoundary
      onError={handleError}
      fallback={
        <WebGLFallback
          className={transitionProps.className}
          message="Ripple transitions need WebGL, which is unavailable in this browser."
        />
      }
    >
      <RippleTransitionCanvas {...transitionProps} onError={onError} />
    </WebGLErrorBoundary>
  );
}
