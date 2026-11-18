in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
// highp to match the vertex stage, which declares them at its default precision.
uniform highp vec4 uInputSize;
uniform highp vec4 uOutputFrame;

// 0-1 envelopes, read off the audio clock every frame.
uniform float uKick;
uniform float uShot;
uniform float uHit;

// Pixi compiles filters for WebGL1 too (GLSL ES 1.0, no array
// constructors), so the bloom taps are unrolled through this helper.
vec3 brightRing(vec2 uv, vec2 step)
{
  vec2 d = step * 0.7071;
  vec3 sum =
    max(texture(uTexture, uv + vec2(step.x, 0.0)).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv - vec2(step.x, 0.0)).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv + vec2(0.0, step.y)).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv - vec2(0.0, step.y)).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv + d).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv - d).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv + vec2(d.x, -d.y)).rgb - 0.3, 0.0) +
    max(texture(uTexture, uv + vec2(-d.x, d.y)).rgb - 0.3, 0.0);
  return sum;
}

void main(void)
{
  // Texture coords cover only part of the input texture; this maps them
  // back to 0-1 across the screen.
  vec2 uvPerScreen = uOutputFrame.zw * uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec2 fromCentre = uv / uvPerScreen - 0.5;

  // Chromatic aberration: channels split outwards, wider on the kick.
  vec2 split = fromCentre * (0.002 + 0.012 * uKick + 0.012 * uHit) * uvPerScreen;
  vec3 color = vec3(
    texture(uTexture, uv + split).r,
    texture(uTexture, uv).g,
    texture(uTexture, uv - split).b
  );

  // Single-pass bloom: two rings of taps, keeping only what's bright.
  vec2 pixel = uInputSize.zw;
  float radius = 3.0 + 9.0 * uKick + 4.0 * uShot;
  vec3 glow =
    brightRing(uv, pixel * radius) + 0.6 * brightRing(uv, pixel * radius * 2.5);
  color += glow / 12.8 * (0.6 + 1.4 * uKick + 0.8 * uShot);

  // Getting hit flashes the screen red.
  color += vec3(0.3, 0.0, 0.07) * uHit;

  // Vignette that breathes open on the kick.
  float vignette = 1.0 - dot(fromCentre, fromCentre) * (1.1 - 0.5 * uKick);
  finalColor = vec4(color * vignette, 1.0);
}
